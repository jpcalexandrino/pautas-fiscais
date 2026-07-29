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
  static extractTables(data: any, uf?: string, ufConfig?: any): EstruturaTabela[] {
    if (!data) return [];

    const nestedData = TextractBlockParser.unwrapData(data);
    const ufUpper = uf ? uf.toUpperCase() : '';

    let resultTables: EstruturaTabela[] = [];

    // Dados já editados manualmente pelo usuário
    if (nestedData && typeof nestedData === 'object' && nestedData.isEdited && Array.isArray(nestedData.tables)) {
      resultTables = nestedData.tables;
    } else {
      // Prioridade Máxima: Blocos brutos do Textract (Blocks)
      const blocks = TextractBlockParser.extractBlocks(data);
      if (blocks.length > 0) {
        const rawTables = this._extractFromRawBlocks(blocks, ufUpper, ufConfig);
        if (rawTables.length > 0) {
          resultTables = rawTables;
        }
      }

      // Fallback: CSV
      if (resultTables.length === 0 && nestedData && typeof nestedData === 'object' && nestedData.format === 'csv' && typeof nestedData.csv === 'string') {
        resultTables = this._extractFromCsv(nestedData, ufUpper, ufConfig);
      }

      // Fallback: Structured layout de tabelas pré-parseadas (ex: DF)
      if (resultTables.length === 0 && nestedData && typeof nestedData === 'object' && Array.isArray(nestedData.tables)) {
        resultTables = this._extractFromNestedTables(nestedData, ufUpper, ufConfig);
      }
    }

    // Pós-processamento inteligente de alta precisão:
    // Reconstrói automaticamente faixas de volume truncadas (ex: "de 360 ml" -> "de 251 a 360 ml", "de 361 660 ml" -> "de 361 a 660 ml")
    return this._repairVolumeCells(resultTables, nestedData);
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

  private static _extractFromCsv(nestedData: any, ufUpper: string, ufConfig?: any): EstruturaTabela[] {
    try {
      const workbook = xlsx.read(nestedData.csv, { type: 'string', raw: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: true });

      if (rawRows.length > 0) {
        const priceRegex = /(?:R\$\s*)?\d+[.,]\d{2}/i;
        const headerIndex = rawRows.findIndex(row => row.some(cell => String(cell).trim() !== ''));

        let headers: string[] = [];
        let rows: string[][] = [];

        if (headerIndex !== -1) {
          const candidateHeader = rawRows[headerIndex];
          const isFirstRowData = candidateHeader.some(cell => priceRegex.test(String(cell).trim()));

          if (isFirstRowData) {
            headers = [];
            rows = rawRows.slice(headerIndex).map(row => row.map(cell => String(cell === null || cell === undefined ? '' : cell).trim()));
          } else {
            headers = candidateHeader.map(h => String(h || '').trim());
            rows = rawRows.slice(headerIndex + 1).map(row => row.map(cell => String(cell === null || cell === undefined ? '' : cell).trim()));
          }
        }

        const compactor = getCompactorForUF(ufUpper, ufConfig?.features);
        const state: CompactorState = { currentSubheader: '', isBeerSection: true };
        const compactedTable = compactor.compactTable(rows, state);

        let finalHeaders = headers;
        if (ufUpper) {
          const layout = getLayoutForUF(ufUpper);
          const customHeaders = layout.getTableHeaders(headers.length);
          if (customHeaders && customHeaders.length > 0 && !customHeaders[0].startsWith('COLUNA_')) {
            finalHeaders = customHeaders;
          }
        }

        let rawPage = nestedData.page || nestedData.pagina || 1;
        if (ufConfig?.features?.split_2_columns) {
          rawPage = Math.ceil(rawPage / 2);
        }

        return [{
          tabelaIndex: 1,
          pagina: rawPage,
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

  private static _extractFromNestedTables(nestedData: any, ufUpper: string, ufConfig?: any): EstruturaTabela[] {
    const tables: any[][] = nestedData.tables;
    const resultados: EstruturaTabela[] = [];
    const compactor = getCompactorForUF(ufUpper, ufConfig?.features);
    const state: CompactorState = { currentSubheader: '' };

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const table = tables[tIdx];
      if (!table || (Array.isArray(table) && table.length === 0)) continue;

      const rawRows: any[] = Array.isArray(table) ? table : (table.rows || table.data || []);
      if (!Array.isArray(rawRows) || rawRows.length === 0) continue;

      const tableData: string[][] = rawRows.map(row => {
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

      // Extrai número da página do objeto de tabela ou array de páginas
      let tablePage = (table as any).page || (table as any).pagina || (table as any).page_number || (nestedData.pages && nestedData.pages[tIdx]);
      if (typeof tablePage !== 'number' || isNaN(tablePage)) {
        tablePage = tIdx + 1;
      }

      if (ufConfig?.features?.split_2_columns) {
        tablePage = Math.ceil(tablePage / 2);
      }

      resultados.push({ tabelaIndex: tIdx + 1, pagina: tablePage, headers, rows });
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

    // Recupera produtos soltos no texto OCR que não foram tabulados no grid do Textract
    if (typeof nestedData.text === 'string' && resultados.length > 0) {
      const extraRows = this._extractUnmappedProductsFromText(nestedData.text, resultados);
      if (extraRows.length > 0) {
        resultados[0].rows.unshift(...extraRows);
      }
    }

    return resultados;
  }

  private static _extractUnmappedProductsFromText(text: string | undefined, existingTables: EstruturaTabela[]): string[][] {
    if (!text || typeof text !== 'string') return [];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const extraRows: string[][] = [];

    const existingKeys = new Set<string>();
    existingTables.forEach(t => {
      t.rows.forEach(r => {
        existingKeys.add(r.join(' ').toLowerCase());
      });
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isRowRelevant(line)) {
        const windowLines = lines.slice(Math.max(0, i - 3), i + 12);
        const windowStr = windowLines.join(' ');

        let priceLineIdx = -1;
        let priceMatch: RegExpMatchArray | null = null;
        for (let w = 0; w < windowLines.length; w++) {
          const m = windowLines[w].match(/^R\$\s*(\d+[.,]\d{2})$/i);
          if (m) {
            priceMatch = m;
            priceLineIdx = Math.max(0, i - 3) + w;
            break;
          }
        }

        const volumeMatch = windowLines.map(l => l.match(/^(\d+\s*ml|\d+\s*l)$/i)).find(Boolean);

        if (priceMatch && volumeMatch && priceLineIdx !== -1) {
          const priceStr = `R$ ${priceMatch[1].replace('.', ',')}`;
          const volumeStr = volumeMatch[1].toUpperCase();

          const codePrefixMatch = windowLines.map(l => l.match(/^(CER\d{2}\.\d{2})$/i)).find(Boolean);
          const codeSuffixLine = lines[priceLineIdx + 1];
          const codeSuffix = (codeSuffixLine && /^\d{1,2}$/.test(codeSuffixLine)) ? codeSuffixLine : '';

          let codeStr = codePrefixMatch ? codePrefixMatch[1].toUpperCase() : '';
          if (codeStr && codeSuffix) {
            codeStr += ` ${codeSuffix}`;
          }

          const gtinPrefixMatch = windowLines.map(l => l.match(/^(789\d{7})$/)).find(Boolean);
          const gtinSuffixLine = lines[priceLineIdx + 2];
          const gtinSuffix = (gtinSuffixLine && /^\d{3,4}$/.test(gtinSuffixLine)) ? gtinSuffixLine : '';
          let gtinStr = gtinPrefixMatch ? (gtinPrefixMatch[1] + (gtinSuffix ? ` ${gtinSuffix}` : '')) : '';

          let embalagemStr = 'GARRAFA VIDRO DESCARTÁVEL';
          if (/retorn[aá]vel/i.test(windowStr)) embalagemStr = 'GARRAFA VIDRO RETORNÁVEL';
          else if (/lata/i.test(windowStr)) embalagemStr = 'LATA';
          else if (/pet/i.test(windowStr)) embalagemStr = 'GARRAFA PET';

          let isAlreadyMapped = false;
          for (const k of existingKeys) {
            if (k.includes(line.toLowerCase()) && (k.includes(volumeStr.toLowerCase()) || k.includes(priceMatch[1]))) {
              isAlreadyMapped = true;
              break;
            }
          }

          if (!isAlreadyMapped) {
            extraRows.push([
              codeStr,
              line.toUpperCase(),
              volumeStr,
              gtinStr,
              embalagemStr,
              priceStr
            ]);
            existingKeys.add(`${codeStr} ${line} ${volumeStr} ${gtinStr} ${priceStr}`.toLowerCase());
          }
        }
      }
    }

    return extraRows;
  }

  // =========================================================================
  // Processamento de blocos brutos do Textract
  // =========================================================================

  private static _extractFromRawBlocks(blocks: TextractBlock[], ufUpper: string, ufConfig?: any): EstruturaTabela[] {
    const blocksByPage = this._groupBlocksByPage(blocks);
    const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);

    const compactor = getCompactorForUF(ufUpper, ufConfig?.features);
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
          const displayPageNum = ufConfig?.features?.split_2_columns ? Math.ceil(pageNum / 2) : pageNum;
          resultados.push({ tabelaIndex: globalTableIdx++, pagina: displayPageNum, headers, rows });
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

  private static _repairVolumeCells(tables: EstruturaTabela[], nestedData: any): EstruturaTabela[] {
    if (!tables || tables.length === 0) return tables;

    let docText = '';
    if (nestedData && typeof nestedData === 'object') {
      if (typeof nestedData.text === 'string') docText += ' ' + nestedData.text;
      if (typeof nestedData.csv === 'string') docText += ' ' + nestedData.csv;
    }

    const rangeRegex = /\b(?:de\s+\d+\s*a\s*\d+\s*ml|at[eé]\s*\d+\s*ml)\b/gi;
    const foundRanges = Array.from(new Set(docText.match(rangeRegex) || [])).map(r => r.trim());

    const upperBoundMap = new Map<number, string>();
    for (const r of foundRanges) {
      const m = r.match(/a\s*(\d+)\s*ml/i);
      if (m) {
        const upper = parseInt(m[1], 10);
        if (!upperBoundMap.has(upper)) {
          upperBoundMap.set(upper, r);
        }
      }
    }

    if (!upperBoundMap.has(360)) upperBoundMap.set(360, 'de 251 a 360 ml');
    if (!upperBoundMap.has(660)) upperBoundMap.set(660, 'de 361 a 660 ml');

    return tables.map(tab => {
      const newRows = tab.rows.map(row => {
        const newRow = [...row];

        newRow.forEach((cell, cIdx) => {
          let trimmed = (cell || '').trim();
          if (!trimmed) return;

          // 1. Correção: "de 361 660 ml" -> "de 361 a 660 ml"
          if (/^de\s+\d{3}\s+\d{3}\s*ml$/i.test(trimmed)) {
            newRow[cIdx] = trimmed.replace(/^de\s+(\d{3})\s+(\d{3})\s*ml$/i, 'de $1 a $2 ml');
            return;
          }

          // 2. Correção: "de 360 ml" -> "de 251 a 360 ml" / "de 660 ml" -> "de 361 a 660 ml"
          const singleBoundMatch = trimmed.match(/^de\s+(\d+)\s*ml$/i);
          if (singleBoundMatch) {
            const upper = parseInt(singleBoundMatch[1], 10);
            const repairedRange = upperBoundMap.get(upper);
            if (repairedRange) {
              newRow[cIdx] = repairedRange;
              return;
            }
          }

          // 3. Correção: "de ml" -> infere faixa pelo valor da pauta na mesma linha
          if (/^de\s*ml$/i.test(trimmed)) {
            const priceCell = row.find(c => /\d+[.,]\d{2}/.test(c));
            const priceVal = priceCell ? parseFloat(priceCell.replace(/[^\d.,]/g, '').replace(',', '.')) : 0;

            if (priceVal >= 5.0) {
              newRow[cIdx] = upperBoundMap.get(660) || 'de 361 a 660 ml';
            } else if (priceVal >= 3.30) {
              newRow[cIdx] = 'de 271 a 360 ml';
            } else {
              newRow[cIdx] = upperBoundMap.get(360) || 'de 251 a 360 ml';
            }
            return;
          }
        });

        return newRow;
      });

      return { ...tab, rows: newRows };
    });
  }
}
