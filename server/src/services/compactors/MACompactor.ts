/**
 * Compactor para Maranhão (MA).
 *
 * O MA possui subcabeçalhos de Subgrupo / Embalagem:
 *   - "Grupo 02 | Subgrupo 15 = Cerveja - Lata | Emb 15 - 710 ml"
 *   - "Grupo 02 | Subgrupo 16 = Cerveja - Retornavel | Emb 16 - 660 ml"
 *   - "Grupo 02 | Subgrupo 17 = Cerveja - Descartavel | Emb 17 - 600 ml"
 *
 * Cada produto possui as colunas: [Códigos, und, Discriminação, Valor R$].
 * Propaga a descrição do subgrupo ativo para cada produto extraído.
 */

import type { UFCompactorStrategy } from './UFCompactorStrategy';
import type { CompactorState, TextractBlock } from './types';
import { isRowRelevant } from './textractNormalize';

export class MACompactor implements UFCompactorStrategy {
  readonly uf = 'MA';
  readonly needsLineTracking = true;

  compactTable(table: string[][], state: CompactorState): string[][] {
    if (table.length === 0) return [];

    const newTable: string[][] = [];

    // Detecta se a primeira linha é o cabeçalho das colunas (ex: "Códigos | und | Discriminação | Valor R$")
    const firstRowText = table[0].join(' ').toLowerCase();
    const isFirstRowHeader = /código|codigos|discrimina[çc][ãa]o|valor/i.test(firstRowText);

    if (isFirstRowHeader) {
      newTable.push(['CODIGO', 'UNIDADE', 'DISCRIMINACAO', 'VALOR_RS']);
    } else {
      newTable.push(['CODIGO', 'UNIDADE', 'DISCRIMINACAO', 'VALOR_RS']);
    }

    const startIdx = isFirstRowHeader ? 1 : 0;
    let currentSubheader = state.currentSubheader || '';

    for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      if (row.length === 0) continue;

      const rowText = row.join(' ').trim();
      if (!rowText) continue;

      // Detecta se é linha de Subgrupo (ex: "Subgrupo 17 = Cerveja - Descartavel | Emb 17 - 600 ml")
      const isSubheader = /subgrupo\s*\d+|emb\s*\d+\s*-/i.test(rowText);
      const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;
      const hasPrice = row.some(cell => priceRegex.test(cell.trim()));

      if (isSubheader && !hasPrice) {
        // Limpa partes repetidas e salva o subcabeçalho ativo
        const cleanedSub = row.filter(Boolean).map(c => c.trim()).join(' - ');
        currentSubheader = cleanedSub;
        state.currentSubheader = cleanedSub;
        continue;
      }

      // Linha de cabeçalho repetida entre subgrupos (ex: "Códigos | und | Discriminação | Valor R$")
      if (/código|codigos|discrimina[çc][ãa]o|valor/i.test(rowText) && !hasPrice) {
        continue;
      }

      // Produto relevante
      if (isRowRelevant(rowText) && hasPrice) {
        const newRow = [...row];
        const activeSub = currentSubheader || state.currentSubheader || '';

        // Se a coluna de discriminação (geralmente col 2 ou 1) existir, anexa o subgrupo
        if (activeSub && newRow.length >= 3) {
          const descColIdx = newRow.length === 4 ? 2 : 1;
          const originalDesc = newRow[descColIdx] || '';
          if (originalDesc && !originalDesc.toLowerCase().includes(activeSub.toLowerCase())) {
            newRow[descColIdx] = `${originalDesc} - ${activeSub}`;
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

    if (/subgrupo\s*\d+|emb\s*\d+\s*-/i.test(text) && !/\d+[.,]\d{2}/.test(text)) {
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
