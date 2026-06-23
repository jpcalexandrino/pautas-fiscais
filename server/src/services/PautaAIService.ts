import { Logger } from '../utils/logger';
import { deduplicatePautaItems } from '../utils/normalize';
import { getLayoutForUF, GLOBAL_INSTRUCTIONS } from './LayoutRegistry';
import { validateAndReprocess } from './PautaValidator';
import { TextractCompactor } from './TextractCompactor';
import { extractRawText, parseJsonResponse } from '../utils/jsonRepair';

const logger = new Logger('PautaAIService');

export interface PautaItemExtraido {
  descricao_estado: string;
  gtin?: string | null;
  valor_pauta?: number | null;
  data_pauta?: string | null;
}

export interface PautaAIContext {
  uf: string;
  nomeEstado: string;
  textractJson: unknown;
  produtos: Array<{
    sk_produto: number;
    nk_codigo_interno?: string;
    gtin_13?: string;
    descricao_interna: string;
    embalagem?: string;
    conteudo_volume?: number;
  }>;
  deParas: Array<{
    termo_descricao_estado: string;
    gtin_estado?: string;
    fk_produto_sk: number;
    descricao_interna?: string;
  }>;
}

const CHUNK_SIZE = 25000;

class PautaAIService {
  async extractPautaItems(context: PautaAIContext): Promise<PautaItemExtraido[]> {
    const SYNAPSE_API_URL = process.env.SYNAPSE_API_URL;
    const SYNAPSE_API_KEY = process.env.SYNAPSE_API_KEY;
    const SYNAPSE_PAUTA_SLUG = process.env.SYNAPSE_PAUTA_SLUG;

    if (!SYNAPSE_API_URL || !SYNAPSE_API_KEY || !SYNAPSE_PAUTA_SLUG) {
      logger.warn('[CHUNK] Gateway AI não configurado, retornando array vazio.');
      return [];
    }

    const textoCompleto = TextractCompactor.compact(context.textractJson, context.uf);
    const chunks = this._splitIntoChunks(textoCompleto, CHUNK_SIZE);

    logger.info(`[CHUNK] Texto compactado: ${textoCompleto.length} chars → ${chunks.length} chunk(s)`);

    const fullUrl = `${SYNAPSE_API_URL}/${SYNAPSE_PAUTA_SLUG}`;
    const allItems: PautaItemExtraido[] = [];

    const results = await this._runWithConcurrencyLimit(
      chunks,
      3,
      async (chunk, index) => {
        logger.info(`[CHUNK] Enviando chunk ${index + 1}/${chunks.length}...`);

        const layout = getLayoutForUF(context.uf);
        const payload = {
          uf: context.uf,
          nome_estado: context.nomeEstado,
          diretrizes_layout: `${layout.guideline}\n\n${GLOBAL_INSTRUCTIONS}`,
          produtos_referencia: context.produtos.map(p => ({
            gtin: p.gtin_13,
            descricao: p.descricao_interna,
            volume: p.conteudo_volume
          })),
          textract_texto: `<DOCUMENTO_TEXTRACT>\n${chunk}\n</DOCUMENTO_TEXTRACT>`,
        };

        const response = await this._fetchWithRetryAndTimeout(
          fullUrl,
          {
            method: 'POST',
            headers: {
              'x-api-key': SYNAPSE_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
          3,
          30000
        );

        if (!response.ok) throw new Error(`Status HTTP ${response.status}`);

        const data: { success?: boolean; data?: unknown } = await response.json();
        const raw = extractRawText(data);

        logger.info(`[CHUNK] Chunk ${index + 1} — resposta bruta: ${raw.slice(0, 300)}`);

        let parsed = parseJsonResponse<PautaItemExtraido>(raw);

        // Validação pós-IA + reprocessamento
        parsed = await validateAndReprocess(
          parsed,
          payload,
          fullUrl,
          (url, options) => this._fetchWithRetryAndTimeout(url, options, 3, 30000),
          (d) => extractRawText(d),
          (r) => parseJsonResponse<PautaItemExtraido>(r)
        );

        logger.info(`[CHUNK] Chunk ${index + 1}: ${parsed.length} item(s) válidos extraído(s)`);
        return parsed;
      }
    );

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'fulfilled') {
        allItems.push(...res.value);
      } else {
        logger.error(`[CHUNK] Falha no processamento do chunk ${i + 1}`, res.reason);
      }
    }

    if (allItems.length === 0) return [];

    logger.info(`[DEDUP] ${allItems.length} item(s) coletados antes da deduplicação:`);
    allItems.forEach((it, idx) =>
      logger.info(
        `[DEDUP]   [${idx + 1}] gtin=${it.gtin ?? 'null'} | desc="${it.descricao_estado?.slice(0, 80)}" | valor=${it.valor_pauta ?? 'null'}`
      )
    );

    const deduplicated = deduplicatePautaItems(allItems, (item, reason) => {
      if (reason === 'gtin') {
        logger.info(`[DEDUP] Descartado por GTIN duplicado: gtin=${item.gtin} | desc="${item.descricao_estado?.slice(0, 60)}"`);
      } else {
        logger.info(`[DEDUP] Descartado por descrição duplicada: desc="${item.descricao_estado?.slice(0, 60)}"`);
      }
    });

    logger.info(`[DEDUP] Total após deduplicação: ${deduplicated.length} item(s)`);

    return this._applyDataPautaFallback(deduplicated);
  }

  /**
   * Reprocessa itens de pauta comparando o JSON original do Textract
   * com o JSON gerado anteriormente pela IA, enviando ambos a um slug dedicado.
   */
  async reprocessPautaItems(
    context: PautaAIContext,
    previousAiJson: PautaItemExtraido[]
  ): Promise<PautaItemExtraido[]> {
    const SYNAPSE_API_URL = process.env.SYNAPSE_API_URL;
    const SYNAPSE_API_KEY = process.env.SYNAPSE_API_KEY_REPROCESS;
    const SYNAPSE_REPROCESS_SLUG = process.env.SYNAPSE_PAUTA_REPROCESS_SLUG;

    if (!SYNAPSE_API_URL || !SYNAPSE_API_KEY || !SYNAPSE_REPROCESS_SLUG) {
      logger.warn('[REPROCESS] Gateway AI de reprocessamento não configurado, retornando array vazio.');
      return [];
    }

    const textoCompleto = TextractCompactor.compact(context.textractJson, context.uf);
    const aiJsonAnterior = JSON.stringify(previousAiJson);

    logger.info(`[REPROCESS] Texto compactado: ${textoCompleto.length} chars | AI anterior: ${previousAiJson.length} item(s)`);

    const fullUrl = `${SYNAPSE_API_URL}/${SYNAPSE_REPROCESS_SLUG}`;
    const layout = getLayoutForUF(context.uf);

    const payload = {
      uf: context.uf,
      nome_estado: context.nomeEstado,
      diretrizes_layout: `${layout.guideline}\n\n${GLOBAL_INSTRUCTIONS}`,
      produtos_referencia: context.produtos.map(p => ({
        gtin: p.gtin_13,
        descricao: p.descricao_interna,
        volume: p.conteudo_volume
      })),
      textract_texto: `<DOCUMENTO_TEXTRACT>\n${textoCompleto}\n</DOCUMENTO_TEXTRACT>`,
      ai_json_anterior: `<EXTRACAO_ANTERIOR>\n${aiJsonAnterior}\n</EXTRACAO_ANTERIOR>`,
    };

    const response = await this._fetchWithRetryAndTimeout(
      fullUrl,
      {
        method: 'POST',
        headers: {
          'x-api-key': SYNAPSE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      3,
      60000
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          'Acesso negado ao endpoint de reprocessamento (403). Verifique se o slug "pauta-fiscal-reprocess" foi criado no BSynapse e se a API key tem permissão.'
        );
      }
      throw new Error(`Falha na comunicação com a IA de reprocessamento (HTTP ${response.status})`);
    }

    const data: { success?: boolean; data?: unknown } = await response.json();
    const raw = extractRawText(data);

    logger.info(`[REPROCESS] Resposta bruta: ${raw.slice(0, 300)}`);

    let parsed = parseJsonResponse<PautaItemExtraido>(raw);

    // Validação pós-IA
    parsed = parsed.filter(it => !!it.descricao_estado && typeof it.valor_pauta === 'number');

    if (parsed.length === 0) {
      logger.warn('[REPROCESS] Nenhum item válido retornado. Mantendo extração anterior.');
      return previousAiJson;
    }

    logger.info(`[REPROCESS] ${parsed.length} item(s) válidos retornados após reprocessamento.`);

    const deduplicated = deduplicatePautaItems(parsed, (item, reason) => {
      if (reason === 'gtin') {
        logger.info(`[REPROCESS:DEDUP] Descartado por GTIN duplicado: gtin=${item.gtin} | desc="${item.descricao_estado?.slice(0, 60)}"`);
      } else {
        logger.info(`[REPROCESS:DEDUP] Descartado por descrição duplicada: desc="${item.descricao_estado?.slice(0, 60)}"`);
      }
    });

    logger.info(`[REPROCESS] Total após deduplicação: ${deduplicated.length} item(s)`);

    return this._applyDataPautaFallback(deduplicated);
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------
  private async _runWithConcurrencyLimit<T, R>(items: T[], limit: number, taskFn: (item: T, index: number) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
    const results: PromiseSettledResult<R>[] = new Array(items.length);
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        const item = items[index];
        try {
          const value = await taskFn(item, index);
          results[index] = { status: 'fulfilled', value };
        } catch (reason) {
          results[index] = { status: 'rejected', reason };
        }
      }
    };

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }

  private async _fetchWithRetryAndTimeout(url: string, options: RequestInit, maxRetries = 3, timeoutMs = 30000): Promise<Response> {
    let attempt = 0;
    while (true) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          throw new Error(`HTTP status ${response.status}`);
        }
        return response;
      } catch (error: any) {
        const isAbort = error.name === 'AbortError';
        const errorMessage = isAbort ? 'Timeout excedido' : error.message || String(error);

        if (attempt >= maxRetries) {
          throw new Error(`Falha após ${maxRetries} tentativas. Último erro: ${errorMessage}`);
        }

        logger.warn(
          `[CHUNK] Tentativa ${attempt}/${maxRetries} falhou: ${errorMessage}. Retentando em ${attempt}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  private _splitIntoChunks(text: string, size: number): string[] {
    if (text.length <= size) return [text];
    const chunks: string[] = [];
    const lines = text.split('\n');
    let current = '';
    for (const line of lines) {
      if ((current + '\n' + line).length > size && current.length > 0) {
        chunks.push(current.trim());
        current = line;
      } else {
        current = current ? current + '\n' + line : line;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  private _applyDataPautaFallback(items: PautaItemExtraido[]): PautaItemExtraido[] {
    return items.map((item) => {
      const hasValidDate = item.data_pauta && /^\d/.test(String(item.data_pauta).trim());
      return { ...item, data_pauta: hasValidDate ? item.data_pauta : null };
    });
  }
}

export default new PautaAIService();
