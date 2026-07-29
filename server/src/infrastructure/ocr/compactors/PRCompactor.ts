/**
 * Compactor para Paraná (PR).
 *
 * O PR utiliza tabelas em matriz onde as primeiras N linhas são cabeçalho
 * mesclado (geralmente 3 linhas). As linhas subsequentes são dados de
 * produtos com preços em múltiplas colunas de embalagem.
 *
 * Melhoria sobre o original: detecção dinâmica de linhas de cabeçalho
 * em vez de hardcoded `3`.
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class PRCompactor implements UFCompactorStrategy {
  readonly uf = 'PR';
  readonly needsLineTracking = false;

  compactTable(table: string[][], _state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];
    const headerRowsCount = this._detectHeaderRows(table);

    // Preserva as linhas de cabeçalho mesclado
    for (let i = 0; i < headerRowsCount; i++) {
      newTable.push(table[i]);
    }

    // Filtra dados por relevância de marca
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
    return false; // PR não faz tracking de subcabeçalhos
  }

  createInitialState(): Record<string, CompactorState> {
    return { left: {} };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Detecta quantas linhas iniciais são cabeçalho.
   * Uma linha é considerada cabeçalho se NÃO contiver padrão monetário.
   * Limita a no máximo 5 linhas de header para evitar edge cases.
   */
  private _detectHeaderRows(table: string[][]): number {
    const priceRegex = /^\s*(?:R\$\s*)?\d+[.,]\d{2}\s*$/;
    const maxHeaderScan = Math.min(table.length, 5);

    for (let i = 0; i < maxHeaderScan; i++) {
      const row = table[i];
      const hasPriceCell = row.some(cell => priceRegex.test(cell.trim()));
      if (hasPriceCell) {
        // Esta linha tem preços, então o header termina na linha anterior
        return Math.max(i, 1); // pelo menos 1 linha de header
      }
    }

    // Se não encontrou preço nas primeiras 5 linhas, assume 3 (padrão PR)
    return Math.min(table.length, 3);
  }
}
