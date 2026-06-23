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
    uf: string
  ): Promise<ProcessPautaResult> {
    const estado = await this._getEstado(uf);

    // 1. OCR via Textract (com cache)
    let textractJson: unknown;
    const cachedOcr = await PautaFiscalRepository.findOcrByFilename(filename);

    if (cachedOcr.rows.length > 0) {
      textractJson = cachedOcr.rows[0].textract_json;
    } else {
      const textractResult = await TextractGatewayService.extractFromPdf(buffer, filename);
      textractJson = textractResult.data;
      await PautaFiscalRepository.upsertOcr(filename, uf, textractJson);
    }

    // 2. Catálogo e De-Para
    const [produtosResult, deParasResult] = await Promise.all([
      ProdutoRepository.getAll(),
      DeParaProdutoEstadoRepository.getAll(uf),
    ]);

    // 3. Estruturação via AI
    const items = await PautaAIService.extractPautaItems({
      uf,
      nomeEstado: estado.nome_estado,
      textractJson,
      produtos: produtosResult.rows,
      deParas: deParasResult.rows,
    });

    // Salva o JSON da AI no banco
    await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, items);

    // 4. Limpa registros anteriores para evitar duplicados no reprocessamento
    await PautaFiscalRepository.deleteFiscalAndPendenteByFilename(filename);

    // 5. Matching e acumulação
    const confirmados: any[] = [];
    const pendentes: any[] = [];

    for (const item of items) {
      const result = await this._prepareItem(item, estado, filename, produtosResult.rows);
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

    const { textract_json: textractJson, ai_json: aiJson } = cachedOcr.rows[0];

    if (!aiJson || (Array.isArray(aiJson) && aiJson.length === 0)) {
      throw new Error(
        'Este arquivo ainda não possui um JSON da IA. Processe o arquivo via upload primeiro antes de reprocessar.'
      );
    }

    // 2. Catálogo e De-Para
    const [produtosResult, deParasResult] = await Promise.all([
      ProdutoRepository.getAll(),
      DeParaProdutoEstadoRepository.getAll(uf),
    ]);

    // 3. Reprocessamento comparativo via AI
    const items = await PautaAIService.reprocessPautaItems(
      {
        uf,
        nomeEstado: estado.nome_estado,
        textractJson,
        produtos: produtosResult.rows,
        deParas: deParasResult.rows,
      },
      aiJson as PautaItemExtraido[]
    );

    // Atualiza o JSON da AI no banco com o resultado do reprocessamento
    await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, items);

    // 4. Limpa registros anteriores para evitar duplicados no reprocessamento
    await PautaFiscalRepository.deleteFiscalAndPendenteByFilename(filename);

    // 5. Matching e acumulação
    const confirmados: any[] = [];
    const pendentes: any[] = [];

    for (const item of items) {
      const result = await this._prepareItem(item, estado, filename, produtosResult.rows);
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

  private async _getEstado(uf: string) {
    const estadoResult = await EstadoRepository.getByUf(uf);
    if (estadoResult.rows.length === 0) throw new Error(`Estado ${uf} não encontrado`);
    return estadoResult.rows[0];
  }

  private async _prepareItem(
    item: PautaItemExtraido,
    estado: { sk_estado: number; nk_uf: string; nome_estado: string },
    filename: string,
    produtos: any[]
  ): Promise<
    | { tipo: 'auto'; payloads: Record<string, unknown>[] }
    | { tipo: 'pending'; payload: Record<string, unknown> }
  > {
    const fk_data = item.data_pauta ? parseDateToSkData(item.data_pauta) : null;

    if (fk_data && item.data_pauta) {
      const dateObj = parseStringToDate(item.data_pauta);
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
