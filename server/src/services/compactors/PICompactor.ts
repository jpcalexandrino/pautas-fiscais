/**
 * Compactor para Piauí (PI).
 *
 * PI possui 4 colunas:
 *   [ITEM, PRODUTO, UNIDADE, PMPF (R$)]
 *
 * Possui subcabeçalhos de seção como:
 *   - "TABELA 1 - CERVEJA"
 *   - "TABELA 2 - REFRIGERANTE"
 * Propaga o subcabeçalho de seção para a descrição do produto se relevante.
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class PICompactor implements UFCompactorStrategy {
  readonly uf = 'PI';
  readonly needsLineTracking = true;

  compactTable(table: string[][], state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];

    const firstRowText = table[0].join(' ').toLowerCase();
    const isFirstRowHeader = /item|produto|unidade|pmpf|valor/i.test(firstRowText);

    if (isFirstRowHeader) {
      newTable.push(['ITEM', 'PRODUTO', 'UNIDADE', 'PMPF_RS']);
    } else {
      newTable.push(['ITEM', 'PRODUTO', 'UNIDADE', 'PMPF_RS']);
    }

    const startIdx = isFirstRowHeader ? 1 : 0;
    let currentSubheader = state.currentSubheader || '';

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      if (row.length === 0) continue;

      const rowText = row.join(' ').trim();
      if (!rowText) continue;

      const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;
      const hasPrice = row.some(cell => priceRegex.test(cell.trim()));

      // Detecta subcabeçalhos como "TABELA 2 - REFRIGERANTE"
      const isSubheader = /tabela\s*\d+\s*-|anexo\s*i/i.test(rowText) && !hasPrice;

      if (isSubheader) {
        currentSubheader = rowText;
        state.currentSubheader = rowText;
        continue;
      }

      if (isRowRelevant(rowText) && hasPrice) {
        const newRow = [...row];
        const activeSub = currentSubheader || state.currentSubheader || '';

        // Se a coluna de produto (geralmente col 1 ou 0) existir, anexa a seção se relevante
        if (activeSub && newRow.length >= 2) {
          const prodColIdx = newRow.length >= 4 ? 1 : 0;
          const originalProd = newRow[prodColIdx] || '';
          if (originalProd && !originalProd.toLowerCase().includes(activeSub.toLowerCase())) {
            newRow[prodColIdx] = `${originalProd} - ${activeSub}`;
          }
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

    if (/tabela\s*\d+\s*-|anexo\s*i/i.test(text) && !/\d+[.,]\d{2}/.test(text)) {
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
