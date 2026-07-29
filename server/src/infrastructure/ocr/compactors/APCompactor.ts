/**
 * Compactor para Amapá (AP).
 *
 * O Amapá (AP) utiliza tabelas em matriz similares às do Paraná (PR), onde as
 * colunas das tabelas representam tipos de embalagens/volumes:
 *   - GARRAFA Retornável de 600 ml
 *   - GARRAFA Retornável de 1000 ml
 *   - GARRAFA Desc/Retornável até 390 ml
 *   - GARRAFA Descartável de 391 a 660 ml
 *   - GARRAFA Descartável de 1000 ml
 *   - LATA Até 270 ml
 *   - LATA De 271 a 360 ml
 *   - LATA De 361 a 660 ml
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class APCompactor implements UFCompactorStrategy {
  readonly uf = 'AP';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];
    const headerRowsCount = this._detectHeaderRows(table);

    // Preserva as linhas de cabeçalho mesclado da matriz
    for (let i = 0; i < headerRowsCount; i++) {
      newTable.push(table[i]);
    }

    // Filtra linhas de produto por relevância de marca
    for (let rIdx = headerRowsCount; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      if (isRowRelevant(row.join(' '))) {
        newTable.push(row);
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

  private _detectHeaderRows(table: string[][]): number {
    const priceRegex = /^\s*(?:R\$\s*)?\d+[.,]\d{2}\s*$/;
    const maxHeaderScan = Math.min(table.length, 5);

    for (let i = 0; i < maxHeaderScan; i++) {
      const row = table[i];
      const hasPriceCell = row.some(cell => priceRegex.test(cell.trim()));
      if (hasPriceCell) {
        return Math.max(i, 1);
      }
    }

    return Math.min(table.length, 2);
  }
}
