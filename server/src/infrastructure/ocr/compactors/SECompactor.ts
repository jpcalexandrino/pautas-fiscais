/**
 * Compactor para Sergipe (SE).
 *
 * O SE possui hierarquia de 3 níveis:
 *   Nível 1 — Tipo de produto (cerveja, refrigerante, suco...)
 *   Nível 2 — Subcabeçalho de embalagem + faixa de volume
 *   Nível 3 — Linhas de produto (marca + preço)
 *
 * Particularidades:
 * - Layout de duas colunas paralelas (esquerda/direita) com estados independentes
 * - Auto-correção heurística de subcabeçalho quando o volume do item contradiz o subcabeçalho ativo
 * - Normalização de preços (R$, detecção centavos vs reais)
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { normalizeAccents, isRowRelevant, isSubheaderSE, isNonBeerSubheader } from './textractNormalize';

// ---------------------------------------------------------------------------
// Faixas de preço esperadas por tipo de produto (para correção centavos/reais)
// ---------------------------------------------------------------------------

const PRICE_RANGES: Record<string, [number, number]> = {
  cerveja:    [1.50, 35.00],
  energetico: [3.00, 50.00],
  isotonico:  [2.00, 20.00],
  tonica:     [2.00, 15.00],
  default:    [1.00, 100.00],
};

// ---------------------------------------------------------------------------
// Implementação
// ---------------------------------------------------------------------------

export class SECompactor implements UFCompactorStrategy {
  readonly uf = 'SE';
  readonly needsLineTracking = true;

  compactTable(table: string[][], state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];

    // Detecta se a primeira row é header
    const col0First = table[0]?.[0] ? table[0][0].trim() : '';
    const isFirstRowHeader = /produto|marca|tipo|valor|coluna|column/i.test(col0First);

    let startIdx = 1;
    if (isFirstRowHeader) {
      newTable.push(table[0]);
    } else {
      newTable.push(['PRODUTO_MARCA_TIPO', 'VALOR_RS']);
      startIdx = 0;
    }

    let currentSubheader = '';

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      if (row.length === 0) continue;

      const col0 = row[0] ? row[0].trim() : '';
      const col1 = row[1] ? row[1].trim() : '';

      const isProductRelevant = isRowRelevant(col0);
      const hasPrice = col1 && (/\d+[.,]\d+/.test(col1) || /^\s*(?:R\$\s*)?\d+\s*$/i.test(col1));
      const isSub = isSubheaderSE(col0);
      const isNonBeerSub = isNonBeerSubheader(col0);

      // Subcabeçalho não-cerveja: marca fim de seção relevante
      if (isNonBeerSub && !hasPrice) {
        currentSubheader = '';
        state.isBeerSection = false;
        state.currentSubheader = '';
        continue;
      }

      // Subcabeçalho de cerveja/bebida: atualiza contexto
      if (isSub && !hasPrice) {
        currentSubheader = col0;
        state.isBeerSection = true;
        state.currentSubheader = col0;
        continue;
      }

      // Linha de continuação de texto (sem preço próprio no OCR raw): anexa a descrição ao produto anterior
      if (col0 && !hasPrice && !isSub && !isNonBeerSub && newTable.length > startIdx) {
        const lastRow = newTable[newTable.length - 1];
        if (lastRow && lastRow[0]) {
          let activeSubheader = currentSubheader || state.currentSubheader || '';
          let prevBaseDesc = lastRow[0];
          if (activeSubheader && prevBaseDesc.endsWith(` (${activeSubheader})`)) {
            prevBaseDesc = prevBaseDesc.slice(0, -(` (${activeSubheader})`.length));
          }
          const updatedDesc = `${prevBaseDesc} ${col0}`.trim();
          activeSubheader = this._correctSubheader(updatedDesc, activeSubheader);
          if (activeSubheader) {
            lastRow[0] = `${updatedDesc} (${activeSubheader})`;
          } else {
            lastRow[0] = updatedDesc;
          }
          continue;
        }
      }

      // Produto relevante em seção de cerveja
      if (isProductRelevant) {
        const isBeerSection = state.isBeerSection !== false;
        if (isBeerSection) {
          // Se col0 contiver múltiplos produtos concatenados (ex: "Cidade Imperio Dunkel Cidade Imperio Hessel")
          // Apenas divide se houver repetição de prefixos principais de marca (ex: "Cidade Imperio", "Império")
          const brandMatches = Array.from(col0.matchAll(/(?:cidade\s+imperia?l?|império|imperio)(?=\s|$)/gi));
          const prodsToProcess: string[] = [];

          if (brandMatches.length > 1) {
            for (let i = 0; i < brandMatches.length; i++) {
              const start = brandMatches[i].index!;
              const end = (i + 1 < brandMatches.length) ? brandMatches[i + 1].index! : col0.length;
              const prod = col0.slice(start, end).trim();
              if (prod) prodsToProcess.push(prod);
            }
          } else {
            prodsToProcess.push(col0);
          }

          for (const itemDesc of prodsToProcess) {
            const newRow = [...row];
            let activeSubheader = currentSubheader || state.currentSubheader || '';

            // Auto-correção heurística baseada em conflitos de volume
            activeSubheader = this._correctSubheader(itemDesc, activeSubheader);

            if (activeSubheader) {
              currentSubheader = activeSubheader;
              state.currentSubheader = activeSubheader;
              newRow[0] = `${itemDesc} (${activeSubheader})`;
            } else {
              newRow[0] = itemDesc;
            }

            // Normaliza o valor do preço
            if (col1) {
              const productType = this._detectProductType(itemDesc);
              newRow[1] = this._normalizePrice(col1, productType);
            }

            newTable.push(newRow);
          }
        }
      }
    }

    return newTable;
  }

  sortPageBlocks(blocks: TextractBlock[]): TextractBlock[] {
    // Para páginas splitadas (ou páginas de coluna única), a ordenação primária
    // deve ser top-down (Top), seguida por esquerda-direita (Left).
    return [...blocks].sort((a, b) => {
      const topA = a.Geometry?.BoundingBox?.Top ?? 0;
      const topB = b.Geometry?.BoundingBox?.Top ?? 0;
      // Tolerância de 1.5% na vertical para considerar mesma linha
      if (Math.abs(topA - topB) > 0.015) {
        return topA - topB;
      }
      const leftA = a.Geometry?.BoundingBox?.Left ?? 0;
      const leftB = b.Geometry?.BoundingBox?.Left ?? 0;
      return leftA - leftB;
    });
  }

  processLineBlock(text: string, _columnKey: 'left' | 'right', state: CompactorState): boolean {
    if (!text) return false;

    if (isNonBeerSubheader(text)) {
      state.isBeerSection = false;
      state.currentSubheader = '';
      return true;
    }

    if (isSubheaderSE(text)) {
      state.isBeerSection = true;
      state.currentSubheader = text;
      return true;
    }

    return false;
  }

  createInitialState(): Record<string, CompactorState> {
    return {
      left: { currentSubheader: '', isBeerSection: true },
      right: { currentSubheader: '', isBeerSection: true },
    };
  }

  // ---------------------------------------------------------------------------
  // Auto-correção heurística de subcabeçalho
  // ---------------------------------------------------------------------------

  /**
   * Corrige o subcabeçalho ativo quando o volume do item contradiz
   * a faixa de volume do subcabeçalho atual.
   */
  private _correctSubheader(col0: string, activeSubheader: string): string {
    const normCol0 = normalizeAccents(col0);
    const normActiveSub = normalizeAccents(activeSubheader);

    const mlVal = this._extractVolumeMl(normCol0);
    if (mlVal <= 0) return activeSubheader;

    const isRetornavel = normCol0.includes('retornavel');
    const isLata = normCol0.includes('lata') || normCol0.includes('lt');
    const isBeer = !normCol0.includes('energetico') && !normCol0.includes('energy') &&
                   !normCol0.includes('dopamina') && !normCol0.includes('best power') &&
                   !normCol0.includes('hysotonic') && !normCol0.includes('isotonic') &&
                   !normCol0.includes('tonica') && !normCol0.includes('agua tonica');

    let corrected: string;
    if (isBeer) {
      corrected = this._correctBeerSubheader(mlVal, normActiveSub, normCol0, isLata, isRetornavel);
    } else {
      corrected = this._correctNonBeerSubheader(mlVal, normCol0);
    }

    // Se a correção retornou vazio, mantém o subcabeçalho atual
    return corrected || activeSubheader;
  }

  private _correctBeerSubheader(
    mlVal: number,
    normActiveSub: string,
    normCol0: string,
    isLata: boolean,
    isRetornavel: boolean
  ): string {
    const currentSub = normActiveSub; // para legibilidade

    if (mlVal === 500) {
      if (currentSub.includes('descartavel') && (currentSub.includes('276') || currentSub.includes('399') || currentSub.includes('250') || currentSub.includes('200'))) {
        return 'Cerveja em garrafa descartável de 500 ml a 660 ml';
      }
      if (currentSub.includes('retornavel')) {
        return 'Cerveja em garrafa retornável de 600 ml';
      }
    }

    if (mlVal === 210) {
      if (currentSub.includes('descartavel') && !currentSub.includes('200') && !currentSub.includes('249')) {
        return 'Cerveja em garrafa descartável de 200 ml a 249 ml';
      }
    }

    if (mlVal === 269 && isLata) {
      if (!currentSub.includes('250') || !currentSub.includes('299') || !currentSub.includes('330')) {
        return 'Cerveja em lata de 250 ml a 299 ml';
      }
    }

    if (mlVal === 350 && isLata) {
      if (!currentSub.includes('300') || !currentSub.includes('399')) {
        return 'Cerveja em lata de 300 ml a 399 ml';
      }
    }

    if (mlVal === 473 && isLata) {
      if (!currentSub.includes('400') || !currentSub.includes('473')) {
        return 'Cerveja em lata de 400 a 473 ml';
      }
    }

    if ((mlVal === 900 || mlVal === 1000 || mlVal === 990) &&
        (isRetornavel || normCol0.includes('bohemia') || normCol0.includes('antarctica') || normCol0.includes('brahma') || normCol0.includes('budweiser'))) {
      if (!currentSub.includes('900') && !currentSub.includes('1000')) {
        return 'Cerveja em garrafa de 900ml a 1000 ml';
      }
    }

    // Sem correção necessária — retorna vazio para que o caller mantenha o subcabeçalho atual
    return '';
  }

  private _correctNonBeerSubheader(mlVal: number, normCol0: string): string {
    // Energéticos
    if (normCol0.includes('dopamina') || normCol0.includes('energetico') || normCol0.includes('energy') || normCol0.includes('best power')) {
      if (mlVal === 269 || mlVal <= 355) {
        return 'Bebida energética em embalagem até 355 ml';
      }
      if (mlVal === 473 || (mlVal >= 356 && mlVal <= 599)) {
        return 'Bebidas energéticas em embalagem de 356ml a 599ml';
      }
      if (mlVal >= 1500) {
        return 'Bebidas energéticas em embalagem com capacidade igual ou superior a 1500 ml';
      }
    }

    // Isotônicos / Hidroeletrolíticos
    if (normCol0.includes('hysotonic') || normCol0.includes('isotonic') || normCol0.includes('hidroeletrolitica')) {
      if (mlVal < 600) {
        return 'Bebidas hidroeletroliticas (isotônicas) em embalagem com capacidade inferior a 600ml';
      }
    }

    // Água tônica
    if (normCol0.includes('agua tonica') || normCol0.includes('tonica')) {
      if (normCol0.includes('lata') || mlVal === 350) {
        return 'Água tônica em lata de 350 ml';
      }
      return 'Água tônica em garrafa PET';
    }

    return '';
  }


  // ---------------------------------------------------------------------------
  // Extração de volume
  // ---------------------------------------------------------------------------

  /**
   * Extrai o volume em ml do nome do produto.
   */
  private _extractVolumeMl(normCol0: string): number {
    // Match direto: "350 ml", "473ml"
    const mlMatch = normCol0.match(/(\d+)\s*ml/);
    if (mlMatch) {
      return parseInt(mlMatch[1]);
    }

    // Faixas de volume: "269 330", "269-330", "269 a 330"
    const rangeMatch = normCol0.match(/\b(\d{2,4})\s*(?:a|à|-|\s)\s*(\d{2,4})\b/i);
    if (rangeMatch) {
      const n1 = parseInt(rangeMatch[1]);
      const n2 = parseInt(rangeMatch[2]);
      if (n1 === 269 || n2 === 269) return 269;
      if (n1 === 350 || n2 === 350) return 350;
      if (n1 === 473 || n2 === 473) return 473;
      if (n1 === 500 || n2 === 500) return 500;
      if (n1 === 210 || n2 === 210) return 210;
      return n1;
    }

    return 0;
  }

  // ---------------------------------------------------------------------------
  // Normalização de preço
  // ---------------------------------------------------------------------------

  /**
   * Detecta o tipo de produto para escolher a faixa de preço correta.
   */
  private _detectProductType(col0: string): string {
    const norm = normalizeAccents(col0);
    if (norm.includes('energetico') || norm.includes('energy') || norm.includes('dopamina') || norm.includes('best power')) {
      return 'energetico';
    }
    if (norm.includes('hysotonic') || norm.includes('isotonic') || norm.includes('hidroeletrolitica')) {
      return 'isotonico';
    }
    if (norm.includes('agua tonica') || norm.includes('tonica')) {
      return 'tonica';
    }
    return 'cerveja';
  }

  /**
   * Normaliza o valor da pauta para 2 casas decimais.
   * Usa faixa de preço esperada para decidir se o valor está em centavos.
   */
  private _normalizePrice(rawPrice: string, productType: string): string {
    let priceVal = rawPrice.replace(/R\$\s*/gi, '').trim();
    priceVal = priceVal.replace(',', '.');
    const num = parseFloat(priceVal);
    if (isNaN(num)) return rawPrice;

    const [min, max] = PRICE_RANGES[productType] ?? PRICE_RANGES['default'];

    // Se o número é inteiro e está fora da faixa esperada,
    // mas dividido por 100 está dentro, provavelmente veio em centavos
    if (Number.isInteger(num) && num > max && (num / 100) >= min && (num / 100) <= max) {
      return (num / 100).toFixed(2);
    }

    return num.toFixed(2);
  }
}
