/**
 * Compactor para Alagoas (AL).
 *
 * Mapeia as colunas de produtos do estado de AL e filtra linhas ruidosas de
 * cabeçalho ou fragmentos de OCR sem preço/volume válidos.
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class ALCompactor implements UFCompactorStrategy {
  readonly uf = 'AL';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];
    const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;

    // Encontra a primeira linha com preço (PMPF) para determinar se a primeira linha já é um produto
    const firstRow = table[0];
    const firstRowHasPrice = firstRow.some(cell => priceRegex.test(cell.trim()));
    const firstRowHasVolume = firstRow.some(cell => /\d+\s*ml|\d+\s*l/i.test(cell.trim()));

    // Se a primeira linha não for um produto, preserva-a como cabeçalho.
    // Se a primeira linha já for um produto (ex: CER01.01 9), insere um cabeçalho fictício no topo.
    if (!firstRowHasPrice && !firstRowHasVolume) {
      newTable.push(table[0]);
    } else {
      newTable.push(['CODIGO', 'PRODUTO_MARCA_TIPO', 'VOLUME', 'GTIN', 'EMBALAGEM', 'PMPF']);
    }

    const startIdx = (!firstRowHasPrice && !firstRowHasVolume) ? 1 : 0;

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      const rowText = row.join(' ');

      if (!isRowRelevant(rowText)) continue;

      // Uma linha válida de produto de AL deve possuir preço (PMPF) ou volume/GTIN/código
      const hasPrice = row.some(cell => priceRegex.test(cell.trim()));
      const hasVolumeOrGtin = row.some(cell => /\d+\s*ml|\d+\s*l|\b789\d{7,10}\b|\b789\d{10}\b/i.test(cell.trim()));

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
