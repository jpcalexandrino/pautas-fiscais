/**
 * Compactor genérico para estados sem lógica específica.
 *
 * Mantém o header original da tabela e filtra as linhas por relevância
 * de marca. Detecta dinamicamente se a primeira row é header.
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class GenericCompactor implements UFCompactorStrategy {
  readonly uf: string;
  readonly needsLineTracking = false;

  constructor(uf: string = '') {
    this.uf = uf;
  }

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];

    // Detecta se a primeira row é header (não contém padrão monetário)
    const firstRow = table[0];
    const priceRegex = /^\s*(?:R\$\s*)?\d+[.,]\d{2}\s*$/;
    const hasPrice = firstRow.some(cell => priceRegex.test(cell.trim()));

    if (!hasPrice) {
      // Primeira row parece ser header
      newTable.push(firstRow);
      for (let rIdx = 1; rIdx < table.length; rIdx++) {
        if (isRowRelevant(table[rIdx].join(' '))) {
          newTable.push(table[rIdx]);
        }
      }
    } else {
      // Sem header detectado — filtra todas as rows
      for (const row of table) {
        if (isRowRelevant(row.join(' '))) {
          newTable.push(row);
        }
      }
    }

    return newTable;
  }

  sortPageBlocks(blocks: TextractBlock[]): TextractBlock[] {
    return [...blocks].sort((a, b) => {
      const topA = a.Geometry?.BoundingBox?.Top ?? 0;
      const topB = b.Geometry?.BoundingBox?.Top ?? 0;
      if (topA !== topB) return topA - topB;
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
