import ProdutoRepository, { ProdutoRow } from '../repositories/ProdutoRepository';
import DeParaProdutoEstadoRepository from '../repositories/DeParaProdutoEstadoRepository';
import { normalizeGtin, normalizeText, isDummyGtin } from '../utils/normalize';
import type { PautaItemExtraido } from './PautaValidator';
import { stripAnnotations } from './brandSlugs';
import { parseBatchDescription, findMatchingProducts } from '../utils/batchMatcher';

export { stripAnnotations } from './brandSlugs';

export type MatchResult =
  | { status: 'matched'; fk_produtos: number[]; matchType: 'gtin' | 'de_para_gtin' | 'de_para_termo' | 'batch' | 'catalog_fuzzy' }
  | { status: 'pending'; reason: string; sugestao?: { fk_produto: number; score: number; descricao_interna: string } };

// Função Levenshtein
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenA; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deleção
        matrix[i][j - 1] + 1, // inserção
        matrix[i - 1][j - 1] + cost // substituição
      );
    }
  }
  return matrix[lenA][lenB];
}

// Função Jaro-Winkler
function jaroWinkler(s1: string, s2: string): number {
  const m = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const matches1: boolean[] = new Array(s1.length).fill(false);
  const matches2: boolean[] = new Array(s2.length).fill(false);

  let matches = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - m);
    const end = Math.min(i + m + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (!matches2[j] && s1[i] === s2[j]) {
        matches1[i] = true;
        matches2[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (matches1[i]) {
      while (!matches2[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }

  const jaro = (matches / s1.length + matches / s2.length + (matches - t / 2) / matches) / 3;

  // Winkler adjustment
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

class PautaMatchingService {
  async matchItem(item: PautaItemExtraido, uf: string, produtos: ProdutoRow[]): Promise<MatchResult> {
    // 0. Matching por lote (batch/lot)
    if (item.descricao_estado) {
      const cleanDesc = stripAnnotations(item.descricao_estado);
      const parsedBatch = parseBatchDescription(cleanDesc);
      if (parsedBatch.isBatch) {
        const matchedProds = findMatchingProducts(parsedBatch, produtos as any[]);
        if (matchedProds.length > 0) {
          const fk_produtos = matchedProds
            .map((p) => p.sk_produto)
            .filter((id): id is number => id !== undefined);

          if (fk_produtos.length > 0) {
            return {
              status: 'matched',
              fk_produtos,
              matchType: 'batch',
            };
          }
        }
      }
    }

    // 1. Matching por GTIN (ignora se for dummy/fictício)
    if (item.gtin && !isDummyGtin(item.gtin)) {
      const normalizedGtin = normalizeGtin(item.gtin);

      const byGtin = await ProdutoRepository.findByGtin(normalizedGtin);
      if (byGtin.rows.length > 0 && byGtin.rows[0].sk_produto !== undefined) {
        return { status: 'matched', fk_produtos: [byGtin.rows[0].sk_produto], matchType: 'gtin' };
      }

      const byDeParaGtin = await DeParaProdutoEstadoRepository.findByGtinEstado(uf, normalizedGtin);
      if (byDeParaGtin.rows.length > 0 && byDeParaGtin.rows[0].fk_produto_sk !== undefined) {
        return {
          status: 'matched',
          fk_produtos: [byDeParaGtin.rows[0].fk_produto_sk],
          matchType: 'de_para_gtin',
        };
      }
    }

    // 2. Matching por descrição
    if (item.descricao_estado) {
      const cleanDesc = stripAnnotations(item.descricao_estado);
      const normalizedDesc = normalizeText(cleanDesc);

      // Busca termo exato
      const byTermo = await DeParaProdutoEstadoRepository.findByTermo(uf, cleanDesc);
      if (byTermo.rows.length > 0 && byTermo.rows[0].fk_produto_sk !== undefined) {
        return {
          status: 'matched',
          fk_produtos: [byTermo.rows[0].fk_produto_sk],
          matchType: 'de_para_termo',
        };
      }

      // Busca fuzzy com Levenshtein e Jaro-Winkler
      const allDeParas = await DeParaProdutoEstadoRepository.getAll(uf);
      const sortedDeParas = [...allDeParas.rows].sort(
        (a, b) => (b.termo_descricao_estado?.length || 0) - (a.termo_descricao_estado?.length || 0)
      );

      const thresholdJaro = 0.85; // similaridade mínima
      const thresholdLev = 3; // distância máxima permitida

      const fuzzy = sortedDeParas.find(row => {
        const termNorm = normalizeText(row.termo_descricao_estado || '');
        if (!termNorm) return false;

        const levDist = levenshtein(normalizedDesc, termNorm);
        const jaroScore = jaroWinkler(normalizedDesc, termNorm);

        return levDist <= thresholdLev || jaroScore >= thresholdJaro;
      });

      if (fuzzy && fuzzy.fk_produto_sk !== undefined) {
        return {
          status: 'matched',
          fk_produtos: [fuzzy.fk_produto_sk],
          matchType: 'de_para_termo',
        };
      }
    }

    // 2.3. Fallback: Busca fuzzy direta contra o catálogo de produtos (dim_produto)
    if (item.descricao_estado) {
      const cleanDesc = stripAnnotations(item.descricao_estado);
      const normalizedDesc = normalizeText(cleanDesc);
      const volumeVal = this._extractVolumeFromDesc(cleanDesc);

      const candidates = volumeVal !== undefined
        ? produtos.filter((p) => p.conteudo_volume === volumeVal)
        : produtos;

      let bestProd: any = null;
      let bestScore = 0;

      for (const prod of candidates) {
        const normProd = normalizeText(prod.descricao_interna);
        const score = jaroWinkler(normalizedDesc, normProd);
        if (score > bestScore) {
          bestScore = score;
          bestProd = prod;
        }
      }

      if (bestProd && bestScore >= 0.90 && bestProd.sk_produto !== undefined) {
        return {
          status: 'matched',
          fk_produtos: [bestProd.sk_produto],
          matchType: 'catalog_fuzzy',
        };
      }

      if (bestProd && bestScore >= 0.75 && bestProd.sk_produto !== undefined) {
        return {
          status: 'pending',
          reason: `Produto sugerido por similaridade (${Math.round(bestScore * 100)}%): ${bestProd.descricao_interna}`,
          sugestao: {
            fk_produto: bestProd.sk_produto,
            score: bestScore,
            descricao_interna: bestProd.descricao_interna,
          },
        };
      }
    }

    // 3. Caso não encontre
    return {
      status: 'pending',
      reason: item.gtin
        ? `GTIN ${normalizeGtin(item.gtin)} não encontrado no catálogo nem no De-Para`
        : 'Descrição não encontrada no De-Para do estado',
    };
  }

  private _extractVolumeFromDesc(description: string): number | undefined {
    const normalized = description.toLowerCase();
    const volRegex = /\b(\d+)\s*(ml|l)\b/i;
    const match = volRegex.exec(normalized);
    if (match) {
      let v = parseInt(match[1], 10);
      if (match[2] === 'l') {
        v *= 1000;
      }
      return v;
    }
    return undefined;
  }
}

export default new PautaMatchingService();
