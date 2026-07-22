import TextractGatewayService from './TextractGatewayService';
import EstadoRepository from '../repositories/EstadoRepository';
import DeParaProdutoEstadoRepository from '../repositories/DeParaProdutoEstadoRepository';
import PautaFiscalRepository from '../repositories/PautaFiscalRepository';
import AuditRepository from '../repositories/AuditRepository';
import CalendarioRepository from '../repositories/CalendarioRepository';
import { TextractCompactor } from './TextractCompactor';
import { parseDateToSkData, parseStringToDate } from '../utils/normalize';
import { PDFSplitter } from './PDFSplitter';

export interface ProcessPautaResult {
  autoInserted: number;
  pendingReview: number;
  totalExtracted: number;
  arquivo: string;
}

class PautaFiscalService {
  /**
   * Processa o upload de uma pauta fiscal em PDF.
   */
  async processUpload(
    buffer: Buffer,
    filename: string,
    uf: string,
    dataPauta?: string,
    contexto: string = 'proprio'
  ): Promise<ProcessPautaResult> {
    const estado = await this._getEstado(uf);

    // 1. OCR via Textract (com cache)
    let textractJson: unknown;
    const cachedOcr = await PautaFiscalRepository.findOcrByFilename(filename, contexto);

    if (cachedOcr.rows.length > 0) {
      textractJson = cachedOcr.rows[0].textract_json;
      if (dataPauta) {
        await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta, contexto);
      }
    } else {
      let finalBuffer = buffer;
      if (uf.toUpperCase() === 'SE') {
        try {
          finalBuffer = await PDFSplitter.splitVertically(buffer);
        } catch (err) {
          console.error('Failed to split PDF vertically:', err);
        }
      }
      const textractResult = await TextractGatewayService.extractFromPdf(finalBuffer, filename, uf);
      textractJson = textractResult.data;
      await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta, contexto);
    }

    return {
      autoInserted: 0,
      pendingReview: 0,
      totalExtracted: 0,
      arquivo: filename,
    };
  }

  async confirmManual(params: {
    fk_produtos: number[];
    uf: string;
    descricao_estado: string;
    valor_pauta: number;
    data_pauta: string;
    arquivo_origem: string;
    salvarDePara?: boolean;
    cellKey?: string;
    contexto?: string;
  }): Promise<{
    results: {
      fk_produto: number;
      status: 'inserted' | 'updated' | 'skipped';
      valor_anterior?: number;
      valor_novo: number;
    }[];
  }> {
    const estado = await this._getEstado(params.uf);
    const fk_data = params.data_pauta ? parseDateToSkData(params.data_pauta) : null;

    if (fk_data && params.data_pauta) {
      const dateObj = parseStringToDate(params.data_pauta);
      if (dateObj) {
        await CalendarioRepository.ensureDate(dateObj);
      }
    }

    const ctx = params.contexto || 'proprio';
    const results: {
      fk_produto: number;
      status: 'inserted' | 'updated' | 'skipped';
      valor_anterior?: number;
      valor_novo: number;
    }[] = [];

    for (const fk_produto of params.fk_produtos) {
      const existingRes = await PautaFiscalRepository.findActive(
        fk_produto,
        estado.sk_estado,
        fk_data,
        ctx
      );

      const newPrice = Number(params.valor_pauta);

      if (existingRes.rows.length > 0) {
        const existingRow = existingRes.rows[0];
        const oldPrice = Number(existingRow.valor_pauta);

        if (oldPrice === newPrice) {
          // Se tudo a mesma coisa, não precisa fazer nada
          results.push({
            fk_produto,
            status: 'skipped',
            valor_novo: newPrice
          });
          continue;
        }

        // Se o valor mudou, atualiza (soft-delete antigo + insere novo)
        await PautaFiscalRepository.create({
          fk_produto,
          fk_estado: estado.sk_estado,
          fk_data,
          valor_pauta: params.valor_pauta,
          arquivo_origem: params.arquivo_origem,
          status: 'confirmado',
          contexto: ctx
        });

        results.push({
          fk_produto,
          status: 'updated',
          valor_anterior: oldPrice,
          valor_novo: newPrice
        });
      } else {
        // Novo registro
        await PautaFiscalRepository.create({
          fk_produto,
          fk_estado: estado.sk_estado,
          fk_data,
          valor_pauta: params.valor_pauta,
          arquivo_origem: params.arquivo_origem,
          status: 'confirmado',
          contexto: ctx
        });

        results.push({
          fk_produto,
          status: 'inserted',
          valor_novo: newPrice
        });
      }

      if (params.salvarDePara) {
        await DeParaProdutoEstadoRepository.create({
          fk_estado_nk: estado.nk_uf,
          termo_descricao_estado: params.descricao_estado,
          fk_produto_sk: fk_produto,
        }).catch(() => {
          // ignora duplicata de De-Para
        });
      }
    }

    if (params.cellKey) {
      await PautaFiscalRepository.addConfirmedCell(params.arquivo_origem, params.cellKey, ctx);
    }

    return { results };
  }

  async excluirPauta(params: {
    pautaId: number;
    justificativa: string;
    apagarDePara?: boolean;
    userId: number;
  }) {
    // 1. Buscar a pauta alvo
    const pautaRes = await PautaFiscalRepository.getById(params.pautaId);
    if (pautaRes.rows.length === 0) {
      throw new Error('Pauta não encontrada ou já excluída');
    }
    const targetPauta = pautaRes.rows[0];

    // 2. Buscar pautas relacionadas do mesmo arquivo, estado, vigência, contexto e valor_pauta
    let pautasParaExcluir = [targetPauta];
    if (targetPauta.arquivo_origem) {
      const relRes = await PautaFiscalRepository.findRelatedPautasBySource(
        targetPauta.arquivo_origem,
        targetPauta.fk_estado,
        targetPauta.fk_data,
        targetPauta.contexto || 'proprio',
        targetPauta.valor_pauta
      );
      if (relRes.rows.length > 0) {
        pautasParaExcluir = relRes.rows;
      }
    }

    const idsParaExcluir = pautasParaExcluir.map((p: any) => Number(p.sk_pauta));

    // 3. Efetuar Soft Delete das pautas
    await PautaFiscalRepository.softDeleteByIds(idsParaExcluir);

    // 4. Liberar APENAS as células no OCR correspondentes às pautas excluídas
    if (targetPauta.arquivo_origem) {
      const ocrRes = await PautaFiscalRepository.findOcrByFilename(
        targetPauta.arquivo_origem,
        targetPauta.contexto || 'proprio'
      );
      if (ocrRes.rows.length > 0) {
        const ocrData = ocrRes.rows[0];
        const confirmedCells: string[] = Array.isArray(ocrData.confirmed_cells) ? ocrData.confirmed_cells : [];

        if (confirmedCells.length > 0) {
          const targetValue = Number(targetPauta.valor_pauta);
          const cellKeysToRemove = new Set<string>();

          try {
            const tabelas = TextractCompactor.extractTables(ocrData.textract_json, ocrData.uf);
            tabelas.forEach((tabela: any) => {
              (tabela.rows || []).forEach((r: string[], rIdx: number) => {
                r.forEach((cell: string, cIdx: number) => {
                  if (cell) {
                    const rawVal = cell.replace(/R\$\s*/gi, '').trim().replace(',', '.');
                    const numVal = parseFloat(rawVal);
                    if (!isNaN(numVal) && Math.abs(numVal - targetValue) < 0.001) {
                      const key = `${tabela.tabelaIndex}-${rIdx}-${cIdx}`;
                      cellKeysToRemove.add(key);
                    }
                  }
                });
              });
            });
          } catch (err) {
            console.error('Erro ao mapear tabelas OCR para desvinculação:', err);
          }

          // Se identificou as celulas especificas, remove apenas elas. Caso contrario (fallback), mantem as confirmedCells
          const newConfirmedCells = cellKeysToRemove.size > 0
            ? confirmedCells.filter(cellKey => !cellKeysToRemove.has(cellKey))
            : confirmedCells;

          await PautaFiscalRepository.updateOcrTables(
            targetPauta.arquivo_origem,
            ocrData.textract_json,
            newConfirmedCells,
            targetPauta.contexto || 'proprio'
          );
        }
      }
    }

    // 5. Apagar De-Para se solicitado pelo usuário
    if (params.apagarDePara && targetPauta.nk_uf) {
      const productIds = Array.from(new Set(pautasParaExcluir.map((p: any) => Number(p.fk_produto))));
      await DeParaProdutoEstadoRepository.deleteByProdutosEEstado(targetPauta.nk_uf, productIds);
    }

    // 6. Log de Auditoria detalhado
    await AuditRepository.log(params.userId, 'EXCLUSAO_PAUTA', {
      pauta_alvo_id: params.pautaId,
      justificativa: params.justificativa,
      total_excluidos: idsParaExcluir.length,
      apaga_de_para: Boolean(params.apagarDePara),
      pautas_afetadas: pautasParaExcluir.map((p: any) => ({
        id: p.sk_pauta,
        produto: p.descricao_interna,
        codigo_interno: p.nk_codigo_interno,
        gtin_13: p.gtin_13,
        uf: p.nk_uf,
        data: p.data,
        valor_pauta: p.valor_pauta,
        arquivo_origem: p.arquivo_origem,
        contexto: p.contexto
      }))
    });

    return {
      success: true,
      pautasExcluidas: pautasParaExcluir,
      totalExcluidas: idsParaExcluir.length
    };
  }

  async getRelatedPautas(pautaId: number) {
    const pautaRes = await PautaFiscalRepository.getById(pautaId);
    if (pautaRes.rows.length === 0) {
      throw new Error('Pauta não encontrada');
    }
    const targetPauta = pautaRes.rows[0];

    if (!targetPauta.arquivo_origem) {
      return { targetPauta, relatedPautas: [targetPauta] };
    }

    const relRes = await PautaFiscalRepository.findRelatedPautasBySource(
      targetPauta.arquivo_origem,
      targetPauta.fk_estado,
      targetPauta.fk_data,
      targetPauta.contexto || 'proprio',
      targetPauta.valor_pauta
    );

    return {
      targetPauta,
      relatedPautas: relRes.rows.length > 0 ? relRes.rows : [targetPauta]
    };
  }

  private async _getEstado(uf: string) {
    const estadoResult = await EstadoRepository.getByUf(uf);
    if (estadoResult.rows.length === 0) throw new Error(`Estado ${uf} não encontrado`);
    return estadoResult.rows[0];
  }
}

export default new PautaFiscalService();
