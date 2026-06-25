import TextractGatewayService from './TextractGatewayService';
import PautaAIService from './PautaAIService';
import PautaMatchingService, { stripAnnotations } from './PautaMatchingService';
import ProdutoRepository from '../repositories/ProdutoRepository';
import EstadoRepository from '../repositories/EstadoRepository';
import DeParaProdutoEstadoRepository from '../repositories/DeParaProdutoEstadoRepository';
import PautaFiscalRepository from '../repositories/PautaFiscalRepository';
import CalendarioRepository from '../repositories/CalendarioRepository';
import { parseDateToSkData, parseStringToDate } from '../utils/normalize';
import type { PautaItemExtraido } from './PautaAIService';

export interface ProcessPautaResult {
  autoInserted: number;
  pendingReview: number;
  totalExtracted: number;
  arquivo: string;
}

class PautaFiscalService {
  /**
   * Processa o upload de uma pauta fiscal em PDF.
   *
   * Fluxo:
   * 1. Envia o PDF ao gateway Textract → recebe JSON bruto
   * 2. Envia o JSON ao AI Gateway → recebe itens estruturados
   * 3. Faz o matching de cada item com o catálogo/De-Para
   * 4. Persiste em batch como confirmado (match automático) ou pendente (revisão manual)
   */
  async processUpload(
    buffer: Buffer,
    filename: string,
    uf: string,
    dataPauta?: string
  ): Promise<ProcessPautaResult> {
    const estado = await this._getEstado(uf);

    // 1. OCR via Textract (com cache)
    let textractJson: unknown;
    const cachedOcr = await PautaFiscalRepository.findOcrByFilename(filename);

    if (cachedOcr.rows.length > 0) {
      textractJson = cachedOcr.rows[0].textract_json;
      if (dataPauta) {
        await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta);
      }
    } else {
      const textractResult = await TextractGatewayService.extractFromPdf(buffer, filename);
      textractJson = textractResult.data;
      await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta);
    }

    return {
      autoInserted: 0,
      pendingReview: 0,
      totalExtracted: 0,
      arquivo: filename,
    };
  }

  /**
   * Reprocessa uma pauta comparando o JSON original do Textract
   * com o JSON gerado anteriormente pela IA.
   * Exige que ai_json já exista no cache.
   */
  async reprocessWithAI(
    filename: string,
    uf: string
  ): Promise<ProcessPautaResult> {
    const estado = await this._getEstado(uf);

    // 1. Busca OCR + AI JSON do cache
    const cachedOcr = await PautaFiscalRepository.findOcrByFilename(filename);
    if (cachedOcr.rows.length === 0) {
      throw new Error(`Arquivo cacheado "${filename}" não encontrado.`);
    }

    const { textract_json: textractJson, ai_json: aiJson, data_pauta: dbDataPauta } = cachedOcr.rows[0];

    // 2. Catálogo e De-Para
    const [produtosResult, deParasResult] = await Promise.all([
      ProdutoRepository.getAll(),
      DeParaProdutoEstadoRepository.getAll(uf),
    ]);

    // 3. Reprocessamento comparativo ou extração inicial via AI
    let items: PautaItemExtraido[];
    if (aiJson && Array.isArray(aiJson) && aiJson.length > 0) {
      items = await PautaAIService.reprocessPautaItems(
        {
          uf,
          nomeEstado: estado.nome_estado,
          textractJson,
          produtos: produtosResult.rows,
          deParas: deParasResult.rows,
        },
        aiJson as PautaItemExtraido[]
      );
    } else {
      items = await PautaAIService.extractPautaItems({
        uf,
        nomeEstado: estado.nome_estado,
        textractJson,
        produtos: produtosResult.rows,
        deParas: deParasResult.rows,
      });
    }

    // Atualiza o JSON da AI no banco com o resultado do reprocessamento
    await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, items);

    // 4. Limpa registros anteriores para evitar duplicados no reprocessamento
    await PautaFiscalRepository.deleteFiscalAndPendenteByFilename(filename);

    // 5. Matching e acumulação
    const confirmados: any[] = [];
    const pendentes: any[] = [];

    let finalDataPautaStr: string | undefined = undefined;
    if (dbDataPauta) {
      if (dbDataPauta instanceof Date) {
        finalDataPautaStr = dbDataPauta.toISOString().split('T')[0];
      } else {
        finalDataPautaStr = dbDataPauta;
      }
    }

    for (const item of items) {
      const result = await this._prepareItem(item, estado, filename, produtosResult.rows, finalDataPautaStr);
      if (result.tipo === 'auto') {
        confirmados.push(...result.payloads);
      } else {
        pendentes.push(result.payload);
      }
    }

    // 6. Persistência em batch
    if (confirmados.length > 0) {
      await PautaFiscalRepository.createMany(confirmados);
    }
    if (pendentes.length > 0) {
      await PautaFiscalRepository.createPendentesMany(pendentes);
    }

    return {
      autoInserted: confirmados.length,
      pendingReview: pendentes.length,
      totalExtracted: items.length,
      arquivo: filename,
    };
  }

  async confirmPendente(
    pendenteId: number,
    fk_produto: number,
    salvarDePara = false
  ): Promise<void> {
    const pendenteResult = await PautaFiscalRepository.getPendenteById(pendenteId);
    if (pendenteResult.rows.length === 0) {
      throw new Error('Item pendente não encontrado');
    }
    const pendente = pendenteResult.rows[0];

    await PautaFiscalRepository.create({
      fk_produto,
      fk_estado: pendente.fk_estado,
      fk_data: pendente.fk_data,
      valor_pauta: pendente.valor_pauta,
      arquivo_origem: pendente.arquivo_origem,
      status: 'confirmado',
    });

    if (salvarDePara) {
      await DeParaProdutoEstadoRepository.create({
        fk_estado_nk: pendente.fk_estado_nk,
        termo_descricao_estado: pendente.descricao_estado,
        gtin_estado: pendente.gtin_extraido,
        fk_produto_sk: fk_produto,
      }).catch(() => {
        // ignora duplicata de De-Para
      });
    }

    await PautaFiscalRepository.deletePendente(pendenteId);
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
  }): Promise<void> {
    const estado = await this._getEstado(params.uf);
    const fk_data = params.data_pauta ? parseDateToSkData(params.data_pauta) : null;

    if (fk_data && params.data_pauta) {
      const dateObj = parseStringToDate(params.data_pauta);
      if (dateObj) {
        await CalendarioRepository.ensureDate(dateObj);
      }
    }

    for (const fk_produto of params.fk_produtos) {
      await PautaFiscalRepository.create({
        fk_produto,
        fk_estado: estado.sk_estado,
        fk_data,
        valor_pauta: params.valor_pauta,
        arquivo_origem: params.arquivo_origem,
        status: 'confirmado',
      });

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
      await PautaFiscalRepository.addConfirmedCell(params.arquivo_origem, params.cellKey);
    }
  }

  private async _getEstado(uf: string) {
    const estadoResult = await EstadoRepository.getByUf(uf);
    if (estadoResult.rows.length === 0) throw new Error(`Estado ${uf} não encontrado`);
    return estadoResult.rows[0];
  }

  private async _prepareItem(
    item: PautaItemExtraido,
    estado: { sk_estado: number; nk_uf: string; nome_estado: string },
    filename: string,
    produtos: any[],
    defaultDataPauta?: string
  ): Promise<
    | { tipo: 'auto'; payloads: Record<string, unknown>[] }
    | { tipo: 'pending'; payload: Record<string, unknown> }
  > {
    const itemDate = defaultDataPauta || item.data_pauta;
    const fk_data = itemDate ? parseDateToSkData(itemDate) : null;

    if (fk_data && itemDate) {
      const dateObj = parseStringToDate(itemDate);
      if (dateObj) {
        await CalendarioRepository.ensureDate(dateObj);
      }
    }

    const cleanItem: PautaItemExtraido = {
      ...item,
      descricao_estado: stripAnnotations(item.descricao_estado),
    };

    const match = await PautaMatchingService.matchItem(cleanItem, estado.nk_uf, produtos);

    if (match.status === 'matched') {
      const payloads = match.fk_produtos.map((fk_produto) => ({
        fk_produto,
        fk_estado: estado.sk_estado,
        fk_data,
        valor_pauta: cleanItem.valor_pauta,
        arquivo_origem: filename,
        status: 'confirmado',
      }));
      return {
        tipo: 'auto',
        payloads,
      };
    }

    const dadosExtraidos: Record<string, unknown> = {
      ...(cleanItem as unknown as Record<string, unknown>),
    };

    if (match.status === 'pending' && 'sugestao' in match && match.sugestao) {
      dadosExtraidos.sugestao = match.sugestao;
    }

    return {
      tipo: 'pending',
      payload: {
        fk_estado: estado.sk_estado,
        fk_estado_nk: estado.nk_uf,
        descricao_estado: cleanItem.descricao_estado,
        gtin_extraido: cleanItem.gtin,
        valor_pauta: cleanItem.valor_pauta,
        fk_data,
        arquivo_origem: filename,
        dados_extraidos: dadosExtraidos,
      },
    };
  }
}

export default new PautaFiscalService();
