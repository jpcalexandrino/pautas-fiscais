/**
 * Compactor para Mato Grosso (MT).
 *
 * Mapeia as 5 colunas da pauta fiscal do MT:
 *   [ORDEM, CÓDIGO GTIN/EAN, DESCRIÇÃO, UNIDADE DE MEDIDA, VALOR (R$)]
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class MTCompactor implements UFCompactorStrategy {
  readonly uf = 'MT';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];
    const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;

    const firstRow = table[0];
    const firstRowHasPrice = firstRow.some(cell => priceRegex.test(cell.trim()));
    const firstRowHasGtin = firstRow.some(cell => /\b789\d{10}\b|\b789\d{7}\b/.test(cell.trim()));

    // Se a primeira linha não for produto, usa-a como cabeçalho.
    // Caso contrário, insere cabeçalho padronizado.
    if (!firstRowHasPrice && !firstRowHasGtin) {
      newTable.push(table[0]);
    } else {
      newTable.push(['ORDEM', 'CODIGO_GTIN_EAN', 'DESCRICAO', 'UNIDADE_DE_MEDIDA', 'VALOR_RS']);
    }

    const startIdx = (!firstRowHasPrice && !firstRowHasGtin) ? 1 : 0;

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      const rowText = row.join(' ');

      if (!isRowRelevant(rowText)) continue;

      const hasPrice = row.some(cell => priceRegex.test(cell.trim()));
      const hasGtinOrVolume = row.some(cell => /\b789\d{7,10}\b|\d+\s*ml|\d+\s*l/i.test(cell.trim()));

      if (hasPrice || hasGtinOrVolume) {
        newTable.push(row);
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

  processLineBlock(_text: string, _columnKey: 'left' | 'right', _state: CompactorState): boolean {
    return false;
  }

  createInitialState(): Record<string, CompactorState> {
    return { left: {} };
  }
}
