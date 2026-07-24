/**
 * TextractCompactor — Orquestrador de compactação de dados do Textract.
 *
 * Transforma dados brutos do Textract (blocos OCR, CSV, tabelas pré-parseadas)
 * em tabelas estruturadas filtradas por relevância de marca.
 *
 * Este arquivo é o ponto de entrada público. A lógica de processamento
 * por estado é delegada para os compactors em `./compactors/`.
 *
 * API pública (retrocompatível):
 *   - TextractCompactor.compact(data, uf)       → Markdown
 *   - TextractCompactor.extractTables(data, uf)  → EstruturaTabela[]
 *   - TextractCompactor.extractDates(data)        → string[]
 */

import * as xlsx from 'xlsx';
import { Logger } from '../utils/logger';
import { BRAND_SLUGS } from './brandSlugs';
import { getLayoutForUF } from './LayoutRegistry';

// Compactors
import { TextractBlockParser } from './compactors/TextractBlockParser';
import { getCompactorForUF } from './compactors/UFCompactorStrategy';
import { getColumnKey, isRowRelevant, pageContainsBrand } from './compactors/textractNormalize';
import type { EstruturaTabela, CompactorState, TextractBlock } from './compactors/types';

// Re-exports para retrocompatibilidade
export type { EstruturaTabela } from './compactors/types';
export type { CompactorState as StateSE } from './compactors/types';

const logger = new Logger('TextractCompactor');

export class TextractCompactor {
  // =========================================================================
  // API Pública
  // =========================================================================

  /**
   * Compacts raw Textract JSON data into structured Markdown text.
   */
  static compact(data: any, uf?: string): string {
    if (!data) return '';

    const nestedData = TextractBlockParser.unwrapData(data);
    const ufUpper = uf ? uf.toUpperCase() : '';

    // Case: CSV format
    if (nestedData && typeof nestedData === 'object' && nestedData.format === 'csv' && typeof nestedData.csv === 'string') {
      const tables = this.extractTables(data, uf);
      return this._tablesToMarkdown(tables);
    }

    // Case: Structured layout from pre-parsed table data
    if (nestedData && typeof nestedData === 'object' && Array.isArray(nestedData.tables)) {
      const finalLines: string[] = [];

      if (typeof nestedData.text === 'string' && nestedData.text.trim()) {
        const textSnippet = nestedData.text.slice(0, 3000).trim();
        finalLines.push('=== CONTEXTO DO DOCUMENTO ===');
        finalLines.push(textSnippet);
        finalLines.push('=============================\n');
      }

      const formatted = this._formatNestedTables(nestedData.tables, ufUpper);
      finalLines.push(...formatted);

      if (finalLines.length > 0) {
        return finalLines.join('\n');
      }
    }

    // Case: Raw OCR block hierarchy
    const blocks = TextractBlockParser.extractBlocks(data);
    if (blocks.length === 0) {
      return TextractBlockParser.fallbackTextExtract(data);
    }

    return this._processRawBlocksAsMarkdown(blocks, ufUpper);
  }

  /**
   * Extrai e reconstrói as tabelas estruturadas do Textract JSON, retornando-as como JSON.
   */
  static extractTables(data: any, uf?: string): EstruturaTabela[] {
    if (!data) return [];

    const nestedData = TextractBlockParser.unwrapData(data);
    const ufUpper = uf ? uf.toUpperCase() : '';

    // Dados já editados pelo usuário
    if (nestedData && typeof nestedData === 'object' && nestedData.isEdited && Array.isArray(nestedData.tables)) {
      return nestedData.tables;
    }

    // CSV
    if (nestedData && typeof nestedData === 'object' && nestedData.format === 'csv' && typeof nestedData.csv === 'string') {
      return this._extractFromCsv(nestedData, ufUpper);
    }

    // Structured layout from pre-parsed tables
    if (nestedData && typeof nestedData === 'object' && Array.isArray(nestedData.tables)) {
      return this._extractFromNestedTables(nestedData, ufUpper);
    }

    // Raw OCR blocks
    const blocks = TextractBlockParser.extractBlocks(data);
    if (blocks.length === 0) return [];

    return this._extractFromRawBlocks(blocks, ufUpper);
  }

  /**
   * Varre o JSON do Textract procurando por datas de vigência.
   */
  static extractDates(data: any): string[] {
    return TextractBlockParser.extractDates(data);
  }

  // =========================================================================
  // Processamento de CSV
  // =========================================================================

  private static _extractFromCsv(nestedData: any, ufUpper: string): EstruturaTabela[] {
    try {
      const workbook = xlsx.read(nestedData.csv, { type: 'string', raw: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: true });

      if (rawRows.length > 0) {
        const headerIndex = rawRows.findIndex(row => row.some(cell => String(cell).trim() !== ''));
        const headers = headerIndex !== -1 ? rawRows[headerIndex].map(h => String(h || '').trim()) : [];
        const rows = headerIndex !== -1
          ? rawRows.slice(headerIndex + 1).map(row => row.map(cell => String(cell === null || cell === undefined ? '' : cell).trim()))
          : [];

        const compactor = getCompactorForUF(ufUpper);
        const state: CompactorState = { currentSubheader: '', isBeerSection: true };
        const compactedTable = compactor.compactTable(rows, state);

        let finalHeaders = headers;
        if (ufUpper) {
          const layout = getLayoutForUF(ufUpper);
          const customHeaders = layout.getTableHeaders(headers.length);
          if (customHeaders && customHeaders.length > 0 && !customHeaders[0].startsWith('COLUNA_')) {
            finalHeaders = headers.map((h, i) => (h && !h.toUpperCase().startsWith('COLUNA') && h.toUpperCase() !== 'VALOR' ? h : (customHeaders[i] || h)));
          }
        }

        return [{
          tabelaIndex: 1,
          pagina: 1,
          headers: finalHeaders,
          rows: compactedTable
        }];
      }
    } catch (err) {
      logger.error(`Failed to parse CSV in extractTables: ${(err as Error).message}`);
    }
    return [];
  }

  // =========================================================================
  // Processamento de tabelas pré-parseadas (nested)
  // =========================================================================

  private static _extractFromNestedTables(nestedData: any, ufUpper: string): EstruturaTabela[] {
    const tables: any[][] = nestedData.tables;
    const resultados: EstruturaTabela[] = [];
    const compactor = getCompactorForUF(ufUpper);
    const state: CompactorState = { currentSubheader: '' };

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const table = tables[tIdx];
      if (!Array.isArray(table) || table.length === 0) continue;

      const tableData: string[][] = table.map(row => {
        if (!Array.isArray(row)) return [];
        return row.map(cell => cell !== undefined ? String(cell).trim() : '');
      });

      const compactedTable = compactor.compactTable(tableData, state);
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
      resultados.push({ tabelaIndex: tIdx + 1, pagina: 1, headers, rows });
    }

    // Key-value pairs adicionais
    if (nestedData.keyValuePairs && typeof nestedData.keyValuePairs === 'object') {
      const virtualRows: string[][] = [];
      for (const [key, value] of Object.entries(nestedData.keyValuePairs)) {
        const valStr = value !== undefined ? String(value).trim() : '';
        const keyStr = key !== undefined ? String(key).trim() : '';
        if (keyStr && valStr) {
          const isProductRelevant = isRowRelevant(keyStr);
          const hasPrice = /\d+[.,]\d+/.test(valStr) || /^\s*(?:R\$\s*)?\d+\s*$/i.test(valStr);
          if (isProductRelevant && hasPrice) {
            virtualRows.push([keyStr, valStr]);
          }
        }
      }
      if (virtualRows.length > 0) {
        resultados.push({
          tabelaIndex: resultados.length + 1,
          pagina: 1,
          headers: ['PRODUTO/MARCA/TIPO', 'VALOR (R$)'],
          rows: virtualRows
        });
      }
    }

    return resultados;
  }

  // =========================================================================
  // Processamento de blocos brutos do Textract
  // =========================================================================

  private static _extractFromRawBlocks(blocks: TextractBlock[], ufUpper: string): EstruturaTabela[] {
    const blocksByPage = this._groupBlocksByPage(blocks);
    const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);

    const compactor = getCompactorForUF(ufUpper);
    const stateByCol = compactor.createInitialState();
    const resultados: EstruturaTabela[] = [];
    let globalTableIdx = 1;

    for (const pageNum of pageNumbers) {
      const pageBlocks = blocksByPage[pageNum];
      const blockMap = new Map<string, TextractBlock>(pageBlocks.map(b => [b.Id, b]));
      const wordIdsInTables = new Set<string>();

      const sortedPageBlocks = compactor.sortPageBlocks(pageBlocks);

      for (const block of sortedPageBlocks) {
        if (block.BlockType === 'LINE' && compactor.needsLineTracking) {
          const colKey = getColumnKey(block);
          const colState = stateByCol[colKey] || stateByCol['left'];
          const text = (block.Text || '').trim();
          if (text) {
            compactor.processLineBlock(text, colKey, colState);
          }
        } else if (block.BlockType === 'TABLE') {
          const tableData = TextractBlockParser.reconstructTableData(block, blockMap, wordIdsInTables);
          if (tableData.length === 0) continue;

          const colKey = getColumnKey(block);
          const stateForBlock = stateByCol[colKey] || stateByCol['left'];
          const compactedTable = compactor.compactTable(tableData, stateForBlock);
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
          resultados.push({ tabelaIndex: globalTableIdx++, pagina: pageNum, headers, rows });
        }
      }
    }

    return resultados;
  }

  private static _processRawBlocksAsMarkdown(blocks: TextractBlock[], ufUpper: string): string {
    const blocksByPage = this._groupBlocksByPage(blocks);
    const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);

    const compactor = getCompactorForUF(ufUpper);
    const stateByCol = compactor.createInitialState();
    const finalLines: string[] = [];

    for (const pageNum of pageNumbers) {
      const pageBlocks = blocksByPage[pageNum];
      const lineBlocks = pageBlocks.filter(b => b.BlockType === 'LINE');
      const pageText = lineBlocks.map(b => b.Text || '').join(' ').toLowerCase();

      if (!pageContainsBrand(pageText)) {
        logger.info(`[CHUNK] Ignorando página ${pageNum} por não conter marca relevante.`);
        continue;
      }

      finalLines.push(`--- PÁGINA ${pageNum} ---`);

      const blockMap = new Map<string, TextractBlock>(pageBlocks.map(b => [b.Id, b]));
      const wordIdsInTables = new Set<string>();
      const tableMarkdowns: string[] = [];

      const sortedPageBlocks = compactor.sortPageBlocks(pageBlocks);

      for (const block of sortedPageBlocks) {
        if (block.BlockType === 'LINE' && compactor.needsLineTracking) {
          const colKey = getColumnKey(block);
          const colState = stateByCol[colKey] || stateByCol['left'];
          const text = (block.Text || '').trim();
          if (text) {
            compactor.processLineBlock(text, colKey, colState);
          }
        } else if (block.BlockType === 'TABLE') {
          const colKey = getColumnKey(block);
          const stateForBlock = stateByCol[colKey] || stateByCol['left'];
          const tableMd = this._reconstructTableAsMarkdown(block, blockMap, wordIdsInTables, ufUpper, stateForBlock, compactor);
          if (tableMd) {
            tableMarkdowns.push(tableMd);
          }
        }
      }

      if (tableMarkdowns.length > 0) {
        finalLines.push(...tableMarkdowns);
      }

      // Non-table lines
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

  // =========================================================================
  // Helpers
  // =========================================================================

  private static _groupBlocksByPage(blocks: TextractBlock[]): Record<number, TextractBlock[]> {
    const blocksByPage: Record<number, TextractBlock[]> = {};
    for (const block of blocks) {
      const pageNum = block.Page || 1;
      if (!blocksByPage[pageNum]) {
        blocksByPage[pageNum] = [];
      }
      blocksByPage[pageNum].push(block);
    }
    return blocksByPage;
  }

  private static _reconstructTableAsMarkdown(
    tableBlock: TextractBlock,
    blockMap: Map<string, TextractBlock>,
    wordIdsInTables: Set<string>,
    ufUpper: string,
    state: CompactorState,
    compactor: ReturnType<typeof getCompactorForUF>
  ): string {
    const tableData = TextractBlockParser.reconstructTableData(tableBlock, blockMap, wordIdsInTables);
    if (tableData.length === 0) return '';

    const compactedTable = compactor.compactTable(tableData, state);
    if (compactedTable.length <= 1) return '';

    const tableLines: string[] = [];
    let headers = compactedTable[0];

    if (ufUpper) {
      const layout = getLayoutForUF(ufUpper);
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

  private static _formatNestedTables(tables: any[][], uf: string): string[] {
    const finalLines: string[] = [];
    const layout = getLayoutForUF(uf);
    const compactor = getCompactorForUF(uf);
    const state: CompactorState = { currentSubheader: '' };

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const table = tables[tIdx];
      if (!Array.isArray(table) || table.length === 0) continue;

      const tableData: string[][] = table.map(row => {
        if (!Array.isArray(row)) return [];
        return row.map(cell => cell !== undefined ? String(cell).trim() : '');
      });

      const compactedTable = compactor.compactTable(tableData, state);
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

  private static _tablesToMarkdown(tables: EstruturaTabela[]): string {
    const finalLines: string[] = [];
    for (const t of tables) {
      finalLines.push(`| ${t.headers.join(' | ')} |`);
      finalLines.push(`| ${t.headers.map(() => '---').join(' | ')} |`);
      for (const row of t.rows) {
        finalLines.push(`| ${row.join(' | ')} |`);
      }
    }
    return finalLines.join('\n');
  }
}
