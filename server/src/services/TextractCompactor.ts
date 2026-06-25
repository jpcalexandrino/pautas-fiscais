import { Logger } from '../utils/logger';
import { BRAND_SLUGS } from './brandSlugs';
import { getLayoutForUF } from './LayoutRegistry';

const logger = new Logger('TextractCompactor');

export class TextractCompactor {
  /**
   * Compacts raw Textract JSON data into structured Markdown text.
   */
  static compact(data: any, uf?: string): string {
    if (!data) return '';

    let nestedData: any = data;
    if (data && typeof data === 'object') {
      if ('data' in data && data.data && typeof data.data === 'object') {
        nestedData = data.data;
      }
    }

    // Case 1: Structured layout from pre-parsed table data
    if (nestedData && typeof nestedData === 'object' && Array.isArray(nestedData.tables)) {
      const tables: any[][] = nestedData.tables;
      const finalLines: string[] = [];

      if (typeof nestedData.text === 'string' && nestedData.text.trim()) {
        const textSnippet = nestedData.text.slice(0, 3000).trim();
        finalLines.push('=== CONTEXTO DO DOCUMENTO ===');
        finalLines.push(textSnippet);
        finalLines.push('=============================\n');
      }

      const formatted = this._formatNestedTables(tables, uf || '');
      finalLines.push(...formatted);

      if (finalLines.length > 0) {
        return finalLines.join('\n');
      }
    }

    // Case 2: Raw OCR block hierarchy
    const blocks = this._extractBlocks(data);

    if (blocks.length === 0) {
      return this._fallbackTextExtractor(data);
    }

    const blocksByPage: Record<number, any[]> = {};
    for (const block of blocks) {
      const pageNum = block.Page || 1;
      if (!blocksByPage[pageNum]) {
        blocksByPage[pageNum] = [];
      }
      blocksByPage[pageNum].push(block);
    }

    const BRAND_SLUGS_LOWER = BRAND_SLUGS.map(s => s.toLowerCase());
    const finalLines: string[] = [];

    const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);

    for (const pageNum of pageNumbers) {
      const pageBlocks = blocksByPage[pageNum];
      const lineBlocks = pageBlocks.filter(b => b.BlockType === 'LINE');
      const pageText = lineBlocks.map(b => b.Text || '').join(' ').toLowerCase();
      
      const hasBrand = BRAND_SLUGS_LOWER.some(slug => pageText.includes(slug));
      
      if (!hasBrand) {
        logger.info(`[CHUNK] Ignorando página ${pageNum} por não conter marca relevante.`);
        continue;
      }

      finalLines.push(`--- PÁGINA ${pageNum} ---`);

      const tableBlocks = pageBlocks.filter(b => b.BlockType === 'TABLE');
      const blockMap = new Map<string, any>(pageBlocks.map(b => [b.Id, b]));
      const wordIdsInTables = new Set<string>();
      const tableMarkdowns: string[] = [];

      for (const table of tableBlocks) {
        const tableMd = this._reconstructTableFromBlocks(table, blockMap, wordIdsInTables, uf);
        if (tableMd) {
          tableMarkdowns.push(tableMd);
        }
      }

      if (tableMarkdowns.length > 0) {
        finalLines.push(...tableMarkdowns);
      }

      const nonTableLines: string[] = [];
      for (const line of lineBlocks) {
        const childWordIds = line.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [];
        const hasWordsInTable = childWordIds.some((id: string) => wordIdsInTables.has(id));

        if (!hasWordsInTable) {
          const text = (line.Text || '').trim();
          if (text) {
            nonTableLines.push(text);
          }
        }
      }

      if (nonTableLines.length > 0) {
        finalLines.push(nonTableLines.join('\n'));
      }
    }

    return finalLines.join('\n');
  }

  private static _extractBlocks(data: any): any[] {
    if (typeof data !== 'object' || data === null) return [];
    if ('Blocks' in data && Array.isArray(data.Blocks)) return data.Blocks;
    if ('blocks' in data && Array.isArray(data.blocks)) return data.blocks;

    const findBlocks = (node: any): any[] | null => {
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

  private static _compactTable(table: string[][], uf: string): string[][] {
    if (table.length === 0) return [];
    const ufUpper = uf.toUpperCase();

    // 1. Detecção e divisão de tabelas paralelas (ex: MG com 12 colunas)
    if (ufUpper === 'MG' && table[0].length >= 11) {
      const newTable: string[][] = [];
      // Cabeçalho da tabela nova (5 colunas)
      newTable.push(['ITEM', 'EMBALAGEM_VOLUME', 'MARCA_PRODUTO', 'COD_FABRICANTE', 'VALOR_PMPF']);

      for (let rIdx = 1; rIdx < table.length; rIdx++) {
        const row = table[rIdx];
        if (row.length < 5) continue;
        
        // Lado esquerdo: colunas 0 a 4
        const leftRow = row.slice(0, 5);
        // Lado direito: colunas 7 a 11 (se existirem)
        const rightRow = row.length >= 12 ? row.slice(7, 12) : [];

        if (this._isRowRelevant(leftRow.join(' '))) {
          newTable.push(leftRow);
        }
        if (rightRow.length >= 5 && this._isRowRelevant(rightRow.join(' '))) {
          newTable.push(rightRow);
        }
      }
      return newTable;
    }

    // 2. Filtro geral de marca para outros estados
    const newTable: string[][] = [];
    newTable.push(table[0]); // Mantém o cabeçalho original

    for (let rIdx = 1; rIdx < table.length; rIdx++) {
      const row = table[rIdx];
      if (this._isRowRelevant(row.join(' '))) {
        newTable.push(row);
      }
    }
    return newTable;
  }

  private static _formatNestedTables(tables: any[][], uf: string): string[] {
    const finalLines: string[] = [];
    const layout = getLayoutForUF(uf);

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const table = tables[tIdx];
      if (!Array.isArray(table) || table.length === 0) continue;

      const tableData: string[][] = table.map(row => {
        if (!Array.isArray(row)) return [];
        return row.map(cell => cell !== undefined ? String(cell).trim() : '');
      });

      const compactedTable = this._compactTable(tableData, uf);
      if (compactedTable.length <= 1) continue;

      finalLines.push(`--- TABELA DE PRODUTOS ${tIdx + 1} ---`);

      let headers = compactedTable[0];
      const customHeaders = layout.getTableHeaders(headers.length);
      if (customHeaders && customHeaders.length > 0 && !customHeaders[0].startsWith('COLUNA_')) {
        headers = customHeaders;
      }

      finalLines.push(`| ${headers.join(' | ')} |`);
      const separator = headers.map(() => '---').join(' | ');
      finalLines.push(`| ${separator} |`);

      for (let rIdx = 1; rIdx < compactedTable.length; rIdx++) {
        finalLines.push(`| ${compactedTable[rIdx].join(' | ')} |`);
      }

      finalLines.push('');
    }
    return finalLines;
  }

  private static _isRowRelevant(rowText: string): boolean {
    const lower = rowText.toLowerCase();

    if (lower.includes('imperio') || lower.includes('império') || lower.includes('cidade imperial') || lower.includes('3.0')) {
      return true;
    }

    if (lower.includes('imperial')) {
      const isStyle = /imperial\s+(stout|ipa|sour|red|double|ap|lager|pils|wit|helles|dunkel)/i.test(lower) ||
                      /(stout|ipa|sour|red|double|ap|lager|pils|wit|helles|dunkel)\s+imperial/i.test(lower);
      if (!isStyle) {
        return true;
      }
    }

    return false;
  }

  private static _reconstructTableFromBlocks(
    tableBlock: any,
    blockMap: Map<string, any>,
    wordIdsInTables: Set<string>,
    uf?: string
  ): string {
    const cells = (tableBlock.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [])
      .map((id: string) => blockMap.get(id))
      .filter((b: any) => b && b.BlockType === 'CELL');

    if (cells.length === 0) return '';

    for (const cell of cells) {
      const childWordIds = cell.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [];
      for (const id of childWordIds) {
        wordIdsInTables.add(id);
      }
    }

    const rows: Record<number, any[]> = {};
    let maxCol = 1;
    for (const cell of cells) {
      const rIdx = cell.RowIndex || 1;
      const cIdx = cell.ColumnIndex || 1;
      if (cIdx > maxCol) maxCol = cIdx;
      if (!rows[rIdx]) rows[rIdx] = [];
      rows[rIdx].push(cell);
    }

    const sortedRowIndices = Object.keys(rows).map(Number).sort((a, b) => a - b);
    const tableData: string[][] = [];

    for (const rIdx of sortedRowIndices) {
      const rowCells = rows[rIdx].sort((a, b) => (a.ColumnIndex || 1) - (b.ColumnIndex || 1));
      const rowCellsText = Array.from({ length: maxCol }).map((_, colIdx) => {
        const cell = rowCells.find(c => c.ColumnIndex === colIdx + 1);
        if (!cell) return '';
        const childIds = cell.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [];
        const cellText = childIds
          .map((id: string) => blockMap.get(id)?.Text || '')
          .filter(Boolean)
          .join(' ');
        
        return cellText;
      });
      tableData.push(rowCellsText);
    }

    const compactedTable = this._compactTable(tableData, uf || '');
    if (compactedTable.length <= 1) return '';

    const tableLines: string[] = [];
    let headers = compactedTable[0];
    
    if (uf) {
      const layout = getLayoutForUF(uf);
      const customHeaders = layout.getTableHeaders(headers.length);
      if (customHeaders && customHeaders.length > 0 && !customHeaders[0].startsWith('COLUNA_')) {
        headers = customHeaders;
      }
    }

    tableLines.push(`| ${headers.join(' | ')} |`);
    const separator = headers.map(() => '---').join(' | ');
    tableLines.push(`| ${separator} |`);

    for (let rIdx = 1; rIdx < compactedTable.length; rIdx++) {
      tableLines.push(`| ${compactedTable[rIdx].join(' | ')} |`);
    }

    return tableLines.join('\n');
  }

  private static _fallbackTextExtractor(data: unknown): string {
    const lines: string[] = [];
    const SKIP_KEYS = new Set([
      'Geometry','BoundingBox','Polygon','Id','Relationships',
      'Confidence','SelectionStatus','EntityTypes','RowIndex',
      'ColumnIndex','RowSpan','ColumnSpan','Page',
    ]);
    const TEXT_KEYS = ['text','Text','content','Content','value','Value'];
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
}
