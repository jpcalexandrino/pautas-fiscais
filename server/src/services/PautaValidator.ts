import { Logger } from '../utils/logger';
import type { PautaItemExtraido } from './PautaAIService';

const logger = new Logger('PautaValidator');

import { parseBatchDescription } from '../utils/batchMatcher';

export function validatePautaItem(item: PautaItemExtraido, catalogVolumes?: Set<number>): boolean {
  const hasDescricao = !!item.descricao_estado;
  const hasValor = typeof item.valor_pauta === 'number' && !isNaN(item.valor_pauta);
  const hasValidGtin = !item.gtin || (item.gtin.length === 13 && /^\d+$/.test(item.gtin));

  if (!hasDescricao || !hasValor || !hasValidGtin) {
    return false;
  }

  // Sempre consideramos o item válido se passou nos testes básicos de estrutura e preço.
  // Deixamos a verificação fina de volume para o Matching e a tela de De-Para. Isso permite que
  // itens com faixas de volume (ex: "até 299ml", "300 a 360ml") sejam mantidos e associados manualmente.
  return true;
}

export async function validateAndReprocess(
  items: PautaItemExtraido[],
  payload: any,
  fullUrl: string,
  fetchWithRetryAndTimeout: (url: string, options: any, maxRetries?: number, timeoutMs?: number) => Promise<Response>,
  extractRawText: (data: any) => string,
  parseJsonResponse: (raw: string) => PautaItemExtraido[]
): Promise<PautaItemExtraido[]> {
  const catalogVolumes = new Set<number>();
  if (payload && Array.isArray(payload.produtos_referencia)) {
    payload.produtos_referencia.forEach((p: any) => {
      if (typeof p.volume === 'number') {
        catalogVolumes.add(p.volume);
      } else if (p.volume) {
        const val = parseInt(String(p.volume), 10);
        if (!isNaN(val)) catalogVolumes.add(val);
      }
    });
  }

  const validItems: PautaItemExtraido[] = [];
  const invalidItems: PautaItemExtraido[] = [];

  for (const item of items) {
    if (validatePautaItem(item, catalogVolumes)) {
      validItems.push(item);
    } else {
      invalidItems.push(item);
    }
  }

  // Se já temos itens válidos, não fazemos o retry na IA para evitar que ela retorne menos itens ou se confunda.
  // Apenas descartamos os itens inválidos (ex: itens sem preço no PDF ou concorrentes que escaparam do filtro preliminar).
  if (invalidItems.length > 0) {
    if (validItems.length > 0) {
      logger.info(`[VALIDATOR] ${validItems.length} item(s) válido(s) mantido(s). ${invalidItems.length} item(s) inválido(s) descartado(s) sem requerer reprocessamento.`);
      return validItems;
    }

    logger.warn(`[VALIDATOR] Nenhum item válido encontrado e ${invalidItems.length} item(s) inválido(s). Reprocessando chunk com instruções extra...`);

    const invalidList = invalidItems
      .map(it => `"${it.descricao_estado}" (valor_pauta: ${it.valor_pauta ?? 'nulo'})`)
      .slice(0, 5)
      .join(', ');

    const retryPayload = {
      ...payload,
      instrucoes_extra: `Os seguintes itens retornados foram considerados inválidos por conterem volumes inexistentes ou valores nulos: ${invalidList}. Certifique-se de que os volumes descritos correspondam estritamente aos volumes dos produtos de referência ou a faixas de volumes válidas que os cubram.`
    };

    try {
      const response = await fetchWithRetryAndTimeout(fullUrl, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.SYNAPSE_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retryPayload),
      });

      if (response.ok) {
        const data = await response.json();
        const raw = extractRawText(data);
        const retried = parseJsonResponse(raw);
        return retried.filter(it => validatePautaItem(it, catalogVolumes));
      }
    } catch (err) {
      logger.error(`[VALIDATOR] Falha ao reprocessar chunk: ${err}`);
    }
  }

  return validItems;
}
