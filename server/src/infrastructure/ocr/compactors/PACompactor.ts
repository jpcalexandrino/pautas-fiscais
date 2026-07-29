/**
 * Compactor para Pará (PA).
 *
 * Mapeia as 9 colunas da pauta fiscal do PA:
 *   [FABRICANTE, MARCA / DESCRIÇÃO, EMBALAGEM, MATERIAL, RETORNÁVEL / DESCARTÁVEL, VOLUME (ML), GTIN / EAN, PREÇO (R$), EFEITOS A PARTIR DE]
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class PACompactor implements UFCompactorStrategy {
  readonly uf = 'PA';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];
    const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;

    const firstRow = table[0];
    const firstRowHasPrice = firstRow.some(cell => priceRegex.test(cell.trim()));
    const firstRowHasGtin = firstRow.some(cell => /\b789\d{7,10}\b/.test(cell.trim()));

    if (!firstRowHasPrice && !firstRowHasGtin) {
      newTable.push(table[0]);
    } else {
      newTable.push([
        'FABRICANTE',
        'MARCA_DESCRICAO',
        'EMBALAGEM',
        'MATERIAL',
        'RETORNAVEL_DESCARTAVEL',
        'VOLUME_ML',
        'GTIN_EAN',
        'PRECO_RS',
        'EFEITOS_A_PARTIR_DE'
      ]);
    }

    const startIdx = (!firstRowHasPrice && !firstRowHasGtin) ? 1 : 0;

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      const rowText = row.join(' ');

      if (!isRowRelevant(rowText)) continue;

      const hasPrice = row.some(cell => priceRegex.test(cell.trim()));
      const hasVolumeOrGtin = row.some(cell => /\b789\d{7,10}\b|\d+\s*ml|\d+\s*l/i.test(cell.trim()));

      if (hasPrice || hasVolumeOrGtin) {
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
