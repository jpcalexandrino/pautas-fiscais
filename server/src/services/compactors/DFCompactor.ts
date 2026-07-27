/**
 * Compactor para Distrito Federal (DF).
 *
 * Mapeia as 6 colunas da pauta fiscal do DF:
 *   [Marca, Nome, Embalagem, Tipo, Volume, Valor]
 * Preserva o produto da primeira linha caso o OCR não traga a linha de cabeçalho.
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class DFCompactor implements UFCompactorStrategy {
  readonly uf = 'DF';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];
    const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;

    const firstRow = table[0];
    const firstRowHasPrice = firstRow.some(cell => priceRegex.test(cell.trim()));
    const firstRowHasVolume = firstRow.some(cell => /\d+\s*ml|\d+\s*l/i.test(cell.trim()));

    // Se a primeira linha for produto (possui preço ou volume), insere o cabeçalho padronizado e inclui a linha 0 nos dados
    if (!firstRowHasPrice && !firstRowHasVolume) {
      newTable.push(table[0]);
    } else {
      newTable.push(['MARCA', 'NOME', 'EMBALAGEM', 'TIPO', 'VOLUME', 'VALOR']);
    }

    const startIdx = (!firstRowHasPrice && !firstRowHasVolume) ? 1 : 0;

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      const rowText = row.join(' ');

      if (!isRowRelevant(rowText)) continue;

      const hasPrice = row.some(cell => priceRegex.test(cell.trim()));
      const hasVolume = row.some(cell => /\d+\s*ml|\d+\s*l/i.test(cell.trim()));

      if (hasPrice || hasVolume) {
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
}
