/**
 * Compactor para Pernambuco (PE).
 *
 * PE utiliza 2 colunas:
 *   [MERCADORIA/MARCA/TIPO, BASE DE CÁLCULO ICMS (R$)]
 *
 * Possui subcabeçalhos de seção/embalagem como:
 *   - "Cerveja em garrafa retornável até 360 ml"
 *   - "Cerveja em garrafa retornável de 361 a 660 ml"
 * Propaga a descrição do subcabeçalho ativo para cada produto extraído.
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class PECompactor implements UFCompactorStrategy {
  readonly uf = 'PE';
  readonly needsLineTracking = true;

  compactTable(table: string[][], state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];

    const firstRowText = table[0].join(' ').toLowerCase();
    const isFirstRowHeader = /mercadoria|marca|tipo|base\s*de\s*c[aá]lculo|valor/i.test(firstRowText);

    if (isFirstRowHeader) {
      newTable.push(['MERCADORIA_MARCA_TIPO', 'VALOR_RS']);
    } else {
      newTable.push(['MERCADORIA_MARCA_TIPO', 'VALOR_RS']);
    }

    const startIdx = isFirstRowHeader ? 1 : 0;
    let currentSubheader = state.currentSubheader || '';

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      if (row.length === 0) continue;

      const col0 = row[0] ? row[0].trim() : '';
      const col1 = row[1] ? row[1].trim() : '';

      const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;
      const hasPrice = col1 && priceRegex.test(col1);

      // Detecta subcabeçalhos de embalagem/faixa de volume
      const isSubheader = !hasPrice && col0 && (
        /cerveja|chopp|refrigerante|energ[eé]tico|garrafa|lata|retorn[aá]vel|descart[aá]vel|bebida|[áa]gua|suco|ch[áa]/i.test(col0) ||
        /at[eé]\s*\d+\s*ml|de\s*\d+\s*a\s*\d+\s*ml|acima\s*de/i.test(col0)
      );

      if (isSubheader) {
        const cleanedSub = row.filter(Boolean).map(c => c.trim()).join(' ');
        if (cleanedSub) {
          currentSubheader = cleanedSub;
          state.currentSubheader = cleanedSub;
        }
        continue;
      }

      if (isRowRelevant(col0) && hasPrice) {
        const newRow = [...row];
        const activeSub = currentSubheader || state.currentSubheader || '';

        if (activeSub && !newRow[0].toLowerCase().includes(activeSub.toLowerCase())) {
          newRow[0] = `${newRow[0]} - ${activeSub}`;
        }

        newTable.push(newRow);
      }
    }

    return newTable;
  }

  sortPageBlocks(blocks: TextractBlock[]): TextractBlock[] {
    return [...blocks].sort((a, b) => {
      const topA = a.Geometry?.BoundingBox?.Top ?? 0;
      const topB = b.Geometry?.BoundingBox?.Top ?? 0;
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

    if (/cerveja|chopp|refrigerante|energ[eé]tico|garrafa|lata|retorn[aá]vel|descart[aá]vel/i.test(text) && !/\d+[.,]\d{2}/.test(text)) {
      state.currentSubheader = text.trim();
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
}
