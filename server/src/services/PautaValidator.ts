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

  // Se não temos os volumes cadastrados do catálogo, aceitamos como fallback
  if (!catalogVolumes || catalogVolumes.size === 0) {
    return true;
  }

  const parsedBatch = parseBatchDescription(item.descricao_estado);

  if (parsedBatch.isBatch) {
    // Caso 1: Faixa de volumes ou múltiplos volumes (ex: "Lata de 300 a 399ml")
    let matchFound = false;

    if (parsedBatch.minVolume !== undefined && parsedBatch.maxVolume !== undefined) {
      // Verifica se existe algum volume do catálogo dentro do range
      for (const vol of catalogVolumes) {
        if (vol >= parsedBatch.minVolume && vol <= parsedBatch.maxVolume) {
          matchFound = true;
          break;
        }
      }
    } else if (parsedBatch.specificVolumes && parsedBatch.specificVolumes.length > 0) {
      // Verifica se algum dos volumes específicos está no catálogo
      for (const vol of parsedBatch.specificVolumes) {
        if (catalogVolumes.has(vol)) {
          matchFound = true;
          break;
        }
      }
    }

    return matchFound;
  } else {
    // Caso 2: Volume único específico (ex: "Lata 350ml")
    if (parsedBatch.specificVolumes && parsedBatch.specificVolumes.length === 1) {
      return catalogVolumes.has(parsedBatch.specificVolumes[0]);
    }

    // Fallback: Tentativa via regex simples se o batchMatcher não identificar volume estruturado
    const volumeMatch = item.descricao_estado?.match(/(\d+)\s*(ml|ML|l|L)/);
    if (volumeMatch) {
      let v = parseInt(volumeMatch[1], 10);
      const unit = volumeMatch[2].toLowerCase();
      if (unit === 'l') {
        v *= 1000;
      }
      return catalogVolumes.has(v);
    }
  }

  return false;
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

  if (invalidItems.length > 0) {
    logger.warn(`[VALIDATOR] ${invalidItems.length} item(s) inválido(s). Reprocessando chunk...`);

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
