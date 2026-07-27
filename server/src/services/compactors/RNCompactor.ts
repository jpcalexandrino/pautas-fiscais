/**
 * Compactor para Rio Grande do Norte (RN).
 *
 * Mapeia as colunas da pauta fiscal do RN:
 *   7 colunas: [ID, FABRICANTE, EMBALAGEM, TIPO_EMB, VOLUME_ML, MARCA, PMPF]
 *   6 colunas: [ID, FABRICANTE, EMBALAGEM, TIPO_E_VOLUME, MARCA, PMPF]
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class RNCompactor implements UFCompactorStrategy {
  readonly uf = 'RN';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];
    const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;

    const firstRow = table[0];
    const firstRowHasPrice = firstRow.some(cell => priceRegex.test(cell.trim()));
    const firstRowHasId = firstRow.some(cell => /^C\d{6,8}$/i.test(cell.trim()));

    if (!firstRowHasPrice && !firstRowHasId) {
      newTable.push(table[0]);
    } else {
      const numCols = firstRow.length;
      if (numCols >= 7) {
        newTable.push(['ID', 'FABRICANTE', 'EMBALAGEM', 'TIPO_EMB', 'VOLUME_ML', 'MARCA', 'PMPF']);
      } else {
        newTable.push(['ID', 'FABRICANTE', 'EMBALAGEM', 'TIPO_E_VOLUME', 'MARCA', 'PMPF']);
      }
    }

    const startIdx = (!firstRowHasPrice && !firstRowHasId) ? 1 : 0;

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      const rowText = row.join(' ');

      if (!isRowRelevant(rowText)) continue;

      const hasPrice = row.some(cell => priceRegex.test(cell.trim()));
      const hasVolumeOrId = row.some(cell => /^C\d{6,8}$/i.test(cell.trim()) || /\d+\s*ml|\d+\s*l/i.test(cell.trim()));

      if (hasPrice || hasVolumeOrId) {
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
