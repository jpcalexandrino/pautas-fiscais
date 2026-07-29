/**
 * Compactor para Minas Gerais (MG).
 *
 * Lida com tabelas paralelas (duas tabelas lado a lado) onde o Textract
 * retorna uma única tabela com 11-13 colunas. O compactor divide em
 * duas tabelas independentes de 5 colunas.
 *
 * Headers padrão: ITEM, EMBALAGEM_VOLUME, MARCA_PRODUTO, COD_FABRICANTE, VALOR_PMPF
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class MGCompactor implements UFCompactorStrategy {
  readonly uf = 'MG';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    // Só aplica split se a tabela tiver 11+ colunas (tabelas paralelas)
    if (table[0].length < 11) {
      return this._filterGeneric(table);
    }

    const newTable: string[][] = [];
    // Cabeçalho normalizado (5 colunas)
    newTable.push(['ITEM', 'EMBALAGEM_VOLUME', 'MARCA_PRODUTO', 'COD_FABRICANTE', 'VALOR_PMPF']);

    for (let rIdx = 1; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      if (row.length < 5) continue;

      const { left, right } = this._splitRow(row);

      const normalizedLeft = this._normalizeSide(left);
      const normalizedRight = this._normalizeSide(right);

      if (normalizedLeft.length >= 5 && isRowRelevant(normalizedLeft.join(' '))) {
        newTable.push(normalizedLeft);
      }
      if (normalizedRight.length >= 5 && isRowRelevant(normalizedRight.join(' '))) {
        newTable.push(normalizedRight);
      }
    }

    return newTable;
  }

  sortPageBlocks(blocks: TextractBlock[]): TextractBlock[] {
    // MG não precisa de ordenação especial — top-down, left-right padrão
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
    return false; // MG não faz tracking de subcabeçalhos
  }

  createInitialState(): Record<string, CompactorState> {
    return { left: {} };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Divide uma row larga em lado esquerdo e direito com base na contagem de colunas.
   */
  private _splitRow(row: string[]): { left: string[]; right: string[] } {
    let left: string[] = [];
    let right: string[] = [];

    if (row.length === 11) {
      left = row.slice(0, 5);
      right = row.slice(6, 11);
    } else if (row.length === 13) {
      left = row.slice(0, 6);
      right = row.slice(7, 13);
    } else if (row.length === 12) {
      const row5 = row[5] ? row[5].trim() : '';
      const row6 = row[6] ? row[6].trim() : '';
      // Verifica se a coluna 5 parece ser o valor_pmpf (geralmente contém vírgula ou ponto decimal)
      const isRow5Price = /^\d+([.,]\d+)?$/.test(row5) && (row5.includes(',') || row5.includes('.'));

      if (row5 === '' || (!isRow5Price && row6 !== '')) {
        // Lado esquerdo tem 5 colunas, lado direito tem 6 colunas
        left = row.slice(0, 5);
        right = row.slice(6, 12);
      } else {
        // Lado esquerdo tem 6 colunas, lado direito tem 5 colunas
        left = row.slice(0, 6);
        right = row.slice(7, 12);
      }
    } else {
      // Fallback: tenta encontrar a coluna separadora (primeira coluna vazia entre posições 4-8)
      const gapIdx = this._findGapColumn(row);
      if (gapIdx !== null) {
        left = row.slice(0, gapIdx);
        right = row.slice(gapIdx + 1);
      } else {
        // Fallback final
        left = row.slice(0, 5);
        right = row.length >= 12 ? row.slice(7, 12) : [];
      }
    }

    return { left, right };
  }

  /**
   * Procura uma coluna vazia entre as posições 4-8 que separa as duas tabelas paralelas.
   */
  private _findGapColumn(row: string[]): number | null {
    for (let i = 4; i < Math.min(row.length - 3, 9); i++) {
      if (!row[i] || row[i].trim() === '') {
        return i;
      }
    }
    return null;
  }

  /**
   * Normaliza um lado de 6 colunas para 5, mesclando embalagem + volume.
   */
  private _normalizeSide(side: string[]): string[] {
    if (side.length === 6) {
      const item = side[0];
      const embalagemVolume = `${side[1]} ${side[2]}`.trim();
      const marcaProduto = side[3];
      const codFabricante = side[4];
      const valorPmpf = side[5];
      return [item, embalagemVolume, marcaProduto, codFabricante, valorPmpf];
    }
    return side;
  }

  /**
   * Filtro genérico para tabelas MG que não são paralelas.
   */
  private _filterGeneric(table: string[][]): string[][] {
    if (table.length === 0) return [];
    const newTable: string[][] = [];
    newTable.push(table[0]); // Mantém header

    for (let rIdx = 1; rIdx < table.length; rIdx++) {
      if (isRowRelevant(table[rIdx].join(' '))) {
        newTable.push(table[rIdx]);
      }
    }
    return newTable;
  }
}
