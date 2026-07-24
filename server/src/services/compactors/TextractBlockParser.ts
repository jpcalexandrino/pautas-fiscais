/**
 * Parser de blocos brutos do Textract.
 *
 * Responsável por:
 * - Localizar o array de Blocks no JSON do Textract (independente do aninhamento)
 * - Reconstruir dados tabulares a partir de blocos TABLE + CELL
 * - Extrair datas de vigência dos blocos LINE
 * - Fallback de extração de texto genérico
 */

import type { TextractBlock } from './types';
import { Logger } from '../../utils/logger';

const logger = new Logger('TextractBlockParser');

// ---------------------------------------------------------------------------
// Opções de reconstrução
// ---------------------------------------------------------------------------

export interface ReconstructOptions {
  /** Confiança mínima para incluir uma WORD. Default: 0 (aceita tudo). */
  minWordConfidence?: number;
  /** Se true, marca células com confiança baixa com [?]. Default: false. */
  flagLowConfidence?: boolean;
  /** Limiar de confiança para flagging. Default: 70. */
  lowConfidenceThreshold?: number;
}

// ---------------------------------------------------------------------------
// Extração de blocos
// ---------------------------------------------------------------------------

export class TextractBlockParser {
  /**
   * Busca o array de Blocks no JSON do Textract, independente do nível de aninhamento.
   * Suporta `data.Blocks`, `data.blocks`, `data.rawBlocks` e busca recursiva.
   */
  static extractBlocks(data: any): TextractBlock[] {
    if (typeof data !== 'object' || data === null) return [];
    if ('Blocks' in data && Array.isArray(data.Blocks)) return data.Blocks;
    if ('blocks' in data && Array.isArray(data.blocks)) return data.blocks;

    const findBlocks = (node: any): TextractBlock[] | null => {
      if (!node || typeof node !== 'object') return null;
      if (Array.isArray(node.Blocks)) return node.Blocks;
      if (Array.isArray(node.blocks)) return node.blocks;
      if (Array.isArray(node.rawBlocks)) return node.rawBlocks;
      for (const key of Object.keys(node)) {
        const res = findBlocks(node[key]);
        if (res) return res;
      }
      return null;
    };
    return findBlocks(data) || [];
  }

  /**
   * Reconstrói os dados tabulares a partir de blocos TABLE + CELL do Textract.
   * Suporta RowSpan e ColumnSpan para células mescladas.
   */
  static reconstructTableData(
    tableBlock: TextractBlock,
    blockMap: Map<string, TextractBlock>,
    wordIdsInTables: Set<string>,
    options: ReconstructOptions = {}
  ): string[][] {
    const { minWordConfidence = 0, flagLowConfidence = false, lowConfidenceThreshold = 70 } = options;

    const childRel = tableBlock.Relationships?.find(r => r.Type === 'CHILD');
    if (!childRel) return [];

    const cells = childRel.Ids
      .map(id => blockMap.get(id))
      .filter((b): b is TextractBlock => !!b && b.BlockType === 'CELL');

    if (cells.length === 0) return [];

    // Registra word IDs que pertencem a tabelas
    for (const cell of cells) {
      const childWordIds = cell.Relationships?.find(r => r.Type === 'CHILD')?.Ids || [];
      for (const id of childWordIds) {
        wordIdsInTables.add(id);
      }
    }

    // Agrupa células por row e detecta dimensões
    const rows: Record<number, TextractBlock[]> = {};
    let maxCol = 1;
    let maxRow = 1;

    for (const cell of cells) {
      const rIdx = cell.RowIndex || 1;
      const cIdx = cell.ColumnIndex || 1;
      if (cIdx > maxCol) maxCol = cIdx;
      if (rIdx > maxRow) maxRow = rIdx;
      if (!rows[rIdx]) rows[rIdx] = [];
      rows[rIdx].push(cell);
    }

    // Monta grid 2D com suporte a RowSpan/ColumnSpan
    const grid: string[][] = Array.from({ length: maxRow }, () =>
      Array.from({ length: maxCol }, () => '')
    );

    // Track de células já preenchidas por span
    const filled: boolean[][] = Array.from({ length: maxRow }, () =>
      Array.from({ length: maxCol }, () => false)
    );

    const sortedRowIndices = Object.keys(rows).map(Number).sort((a, b) => a - b);

    for (const rIdx of sortedRowIndices) {
      const rowCells = rows[rIdx].sort((a, b) => (a.ColumnIndex || 1) - (b.ColumnIndex || 1));

      for (const cell of rowCells) {
        const r = (cell.RowIndex || 1) - 1;
        const c = (cell.ColumnIndex || 1) - 1;
        const rowSpan = cell.RowSpan || 1;
        const colSpan = cell.ColumnSpan || 1;

        // Extrai texto da célula
        const childIds = cell.Relationships?.find(rel => rel.Type === 'CHILD')?.Ids || [];
        const words: string[] = [];
        let minConfidence = 100;

        for (const id of childIds) {
          const wordBlock = blockMap.get(id);
          if (!wordBlock?.Text) continue;

          const conf = wordBlock.Confidence ?? 100;
          if (conf < minConfidence) minConfidence = conf;

          if (minWordConfidence > 0 && conf < minWordConfidence) continue;
          words.push(wordBlock.Text);
        }

        let cellText = words.filter(Boolean).join(' ');

        // Marca células com confiança baixa
        if (flagLowConfidence && minConfidence < lowConfidenceThreshold && cellText) {
          cellText = `${cellText} [?]`;
        }

        // Preenche o grid com span
        for (let dr = 0; dr < rowSpan && (r + dr) < maxRow; dr++) {
          for (let dc = 0; dc < colSpan && (c + dc) < maxCol; dc++) {
            if (!filled[r + dr][c + dc]) {
              grid[r + dr][c + dc] = (dr === 0 && dc === 0) ? cellText : cellText;
              filled[r + dr][c + dc] = true;
            }
          }
        }
      }
    }

    return grid;
  }

  /**
   * Extrator de texto genérico como último recurso.
   * Percorre recursivamente o JSON procurando campos de texto.
   */
  static fallbackTextExtract(data: unknown): string {
    const lines: string[] = [];
    const SKIP_KEYS = new Set([
      'Geometry', 'BoundingBox', 'Polygon', 'Id', 'Relationships',
      'Confidence', 'SelectionStatus', 'EntityTypes', 'RowIndex',
      'ColumnIndex', 'RowSpan', 'ColumnSpan', 'Page',
    ]);
    const TEXT_KEYS = ['text', 'Text', 'content', 'Content', 'value', 'Value'];
    const stack: Array<{ node: unknown; depth: number }> = [{ node: data, depth: 0 }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      const { node, depth } = current;
      if (depth > 10) continue;

      if (typeof node === 'string') {
        const trimmed = node.trim();
        if (trimmed) lines.push(trimmed);
        continue;
      }

      if (Array.isArray(node)) {
        if (node.length > 0 && Array.isArray(node[0])) {
          for (const row of node) {
            if (Array.isArray(row)) {
              const cells = row.map((c: unknown) => (typeof c === 'string' ? c.trim() : String(c ?? '')))
                .filter(Boolean);
              if (cells.length > 0) lines.push(cells.join('\t'));
            }
          }
          continue;
        }
        for (let i = node.length - 1; i >= 0; i--) stack.push({ node: node[i], depth: depth + 1 });
        continue;
      }

      if (typeof node === 'object' && node !== null) {
        const obj = node as Record<string, unknown>;
        let foundText = false;
        for (const key of TEXT_KEYS) {
          if (typeof obj[key] === 'string') {
            const trimmed = (obj[key] as string).trim();
            if (trimmed) lines.push(trimmed);
            foundText = true;
            break;
          }
        }
        if (foundText) continue;
        const keys = Object.keys(obj);
        for (let i = keys.length - 1; i >= 0; i--) {
          const key = keys[i];
          if (!SKIP_KEYS.has(key)) stack.push({ node: obj[key], depth: depth + 1 });
        }
      }
    }

    return Array.from(new Set(lines)).join('\n');
  }

  /**
   * Varre o JSON do Textract procurando por datas de vigência (formatos comuns: DD/MM/AAAA).
   * Funciona tanto com blocos brutos quanto com dados já estruturados que contenham texto.
   */
  static extractDates(data: any): string[] {
    if (!data) return [];

    const lines: string[] = [];

    // Tenta extrair de blocos Textract brutos
    const blocks = this.extractBlocks(data);
    if (blocks.length > 0) {
      for (const b of blocks) {
        if (b && b.BlockType === 'LINE' && b.Text) {
          lines.push(b.Text.trim());
        }
      }
    }

    // Também tenta extrair de dados nested (CSV/tabelas)
    let nestedData: any = data;
    if (data && typeof data === 'object' && 'data' in data && data.data && typeof data.data === 'object') {
      nestedData = data.data;
    }

    if (nestedData && typeof nestedData === 'object') {
      // CSV
      if (typeof nestedData.csv === 'string') {
        lines.push(nestedData.csv);
      }
      // Text context
      if (typeof nestedData.text === 'string') {
        lines.push(nestedData.text);
      }
    }

    // Expressão regular para encontrar datas no formato DD/MM/AAAA
    const dateRegex = /\b(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})\b/g;
    const detectedDates = new Set<string>();

    for (const text of lines) {
      let match;
      dateRegex.lastIndex = 0;
      while ((match = dateRegex.exec(text)) !== null) {
        const day = match[1];
        const month = match[2];
        const year = match[3];

        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);

        if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
          detectedDates.add(`${year}-${month}-${day}`);
        }
      }
    }

    return Array.from(detectedDates);
  }

  /**
   * Desempacota os dados do Textract, removendo wrappers como `data.data`.
   */
  static unwrapData(data: any): any {
    if (!data) return data;
    if (data && typeof data === 'object' && 'data' in data && data.data && typeof data.data === 'object') {
      return data.data;
    }
    return data;
  }
}
