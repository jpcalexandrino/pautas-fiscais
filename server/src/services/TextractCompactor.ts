import { Logger } from '../utils/logger';
import { BRAND_SLUGS } from './brandSlugs';
import { getLayoutForUF } from './LayoutRegistry';

const logger = new Logger('TextractCompactor');

export interface EstruturaTabela {
  tabelaIndex: number;
  pagina: number;
  headers: string[];
  rows: string[][];
}

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
      
      const hasBrand = BRAND_SLUGS_LOWER.some(slug => {
        if (slug === '3.0') {
          return /\b3\.0\b/.test(pageText);
        }
        return pageText.includes(slug);
      });
      
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

  /**
   * Extrai e reconstrói as tabelas estruturadas do TextractJson, retornando-as como JSON.
   */
  static extractTables(data: any, uf?: string): EstruturaTabela[] {
    if (!data) return [];

    let nestedData: any = data;
    if (data && typeof data === 'object') {
      if ('data' in data && data.data && typeof data.data === 'object') {
        nestedData = data.data;
      }
    }

    const ufUpper = uf ? uf.toUpperCase() : '';
    const resultados: EstruturaTabela[] = [];

    // Case 1: Structured layout from pre-parsed table data
    if (nestedData && typeof nestedData === 'object' && Array.isArray(nestedData.tables)) {
      const tables: any[][] = nestedData.tables;
      for (let tIdx = 0; tIdx < tables.length; tIdx++) {
        const table = tables[tIdx];
        if (!Array.isArray(table) || table.length === 0) continue;

        const tableData: string[][] = table.map(row => {
          if (!Array.isArray(row)) return [];
          return row.map(cell => cell !== undefined ? String(cell).trim() : '');
        });

        const compactedTable = this._compactTable(tableData, ufUpper);
        if (compactedTable.length === 0) continue;

        let headers = compactedTable[0];
        if (ufUpper) {
          const layout = getLayoutForUF(ufUpper);
          const customHeaders = layout.getTableHeaders(headers.length);
          if (customHeaders && customHeaders.length > 0 && !customHeaders[0].startsWith('COLUNA_')) {
            headers = customHeaders;
          }
        }

        const rows = compactedTable.slice(1);

        resultados.push({
          tabelaIndex: tIdx + 1,
          pagina: 1,
          headers,
          rows
        });
      }
      return resultados;
    }

    // Case 2: Raw OCR block hierarchy
    const blocks = this._extractBlocks(data);
    if (blocks.length === 0) {
      return [];
    }

    const blocksByPage: Record<number, any[]> = {};
    for (const block of blocks) {
      const pageNum = block.Page || 1;
      if (!blocksByPage[pageNum]) {
        blocksByPage[pageNum] = [];
      }
      blocksByPage[pageNum].push(block);
    }

    const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);
    let globalTableIdx = 1;

    for (const pageNum of pageNumbers) {
      const pageBlocks = blocksByPage[pageNum];
      const tableBlocks = pageBlocks.filter(b => b.BlockType === 'TABLE');
      const blockMap = new Map<string, any>(pageBlocks.map(b => [b.Id, b]));
      const wordIdsInTables = new Set<string>();

      for (const table of tableBlocks) {
        const tableData = this._reconstructTableData(table, blockMap, wordIdsInTables);
        if (tableData.length === 0) continue;

        const compactedTable = this._compactTable(tableData, ufUpper);
        if (compactedTable.length === 0) continue;

        let headers = compactedTable[0];
        if (ufUpper) {
          const layout = getLayoutForUF(ufUpper);
          const customHeaders = layout.getTableHeaders(headers.length);
          if (customHeaders && customHeaders.length > 0 && !customHeaders[0].startsWith('COLUNA_')) {
            headers = customHeaders;
          }
        }

        const rows = compactedTable.slice(1);

        resultados.push({
          tabelaIndex: globalTableIdx++,
          pagina: pageNum,
          headers,
          rows
        });
      }
    }

    return resultados;
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

      const normalizeSide = (side: string[]): string[] => {
        if (side.length === 6) {
          const item = side[0];
          const embalagemVolume = `${side[1]} ${side[2]}`.trim();
          const marcaProduto = side[3];
          const codFabricante = side[4];
          const valorPmpf = side[5];
          return [item, embalagemVolume, marcaProduto, codFabricante, valorPmpf];
        }
        return side;
      };

      for (let rIdx = 1; rIdx < table.length; rIdx++) {
        const row = table[rIdx];
        if (row.length < 5) continue;

        let leftRow: string[] = [];
        let rightRow: string[] = [];

        if (row.length === 11) {
          leftRow = row.slice(0, 5);
          rightRow = row.slice(6, 11);
        } else if (row.length === 13) {
          leftRow = row.slice(0, 6);
          rightRow = row.slice(7, 13);
        } else if (row.length === 12) {
          const row5 = row[5] ? row[5].trim() : '';
          const row6 = row[6] ? row[6].trim() : '';
          // Verifica se a coluna 5 parece ser o valor_pmpf (geralmente contém vírgula ou ponto decimal)
          const isRow5Price = /^\d+([.,]\d+)?$/.test(row5) && (row5.includes(',') || row5.includes('.'));
          
          if (row5 === '' || (!isRow5Price && row6 !== '')) {
            // Lado esquerdo tem 5 colunas, lado direito tem 6 colunas
            leftRow = row.slice(0, 5);
            rightRow = row.slice(6, 12);
          } else {
            // Lado esquerdo tem 6 colunas, lado direito tem 5 colunas
            leftRow = row.slice(0, 6);
            rightRow = row.slice(7, 12);
          }
        } else {
          // Fallback para outros tamanhos não previstos
          leftRow = row.slice(0, 5);
          rightRow = row.length >= 12 ? row.slice(7, 12) : [];
        }

        const normalizedLeft = normalizeSide(leftRow);
        const normalizedRight = normalizeSide(rightRow);

        if (normalizedLeft.length >= 5 && this._isRowRelevant(normalizedLeft.join(' '))) {
          newTable.push(normalizedLeft);
        }
        if (normalizedRight.length >= 5 && this._isRowRelevant(normalizedRight.join(' '))) {
          newTable.push(normalizedRight);
        }
      }
      return newTable;
    }

    // 2. Tratamento para o Paraná (PR) - Preserva as 3 primeiras linhas de cabeçalho mesclado
    if (ufUpper === 'PR') {
      const newTable: string[][] = [];
      const headerRowsCount = Math.min(table.length, 3);
      
      for (let i = 0; i < headerRowsCount; i++) {
        newTable.push(table[i]);
      }

      for (let rIdx = headerRowsCount; rIdx < table.length; rIdx++) {
        const row = table[rIdx];
        if (this._isRowRelevant(row.join(' '))) {
          newTable.push(row);
        }
      }
      return newTable;
    }

    // 3. Filtro geral de marca para outros estados
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

    if (
      lower.includes('imperio') ||
      lower.includes('império') ||
      lower.includes('cidade imperial') ||
      lower.includes('puro malte pilsen') ||
      /\b3\.0\b/.test(lower)
    ) {
      return true;
    }

    if (lower.includes('cidade imperial')) {
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
    const tableData = this._reconstructTableData(tableBlock, blockMap, wordIdsInTables);
    if (tableData.length === 0) return '';

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

  private static _reconstructTableData(
    tableBlock: any,
    blockMap: Map<string, any>,
    wordIdsInTables: Set<string>
  ): string[][] {
    const cells = (tableBlock.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [])
      .map((id: string) => blockMap.get(id))
      .filter((b: any) => b && b.BlockType === 'CELL');

    if (cells.length === 0) return [];

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

    return tableData;
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

  /**
   * Varre o JSON do Textract procurando por datas de vigência (formatos comuns: DD/MM/AAAA).
   */
  static extractDates(data: any): string[] {
    if (!data) return [];
    const blocks = this._extractBlocks(data);
    
    // Filtra todas as linhas de texto do OCR
    const lines = blocks
      .filter(b => b && b.BlockType === 'LINE')
      .map(b => (b.Text || '').trim())
      .filter(Boolean);

    // Expressão regular para encontrar datas no formato DD/MM/AAAA
    const dateRegex = /\b(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})\b/g;
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
}

