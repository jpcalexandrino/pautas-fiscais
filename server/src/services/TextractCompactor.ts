import * as xlsx from 'xlsx';
import { Logger } from '../utils/logger';
import { BRAND_SLUGS } from './brandSlugs';
import { getLayoutForUF } from './LayoutRegistry';

const logger = new Logger('TextractCompactor');

export interface StateSE {
  currentSubheaderSE?: string;
  isBeerSection?: boolean;
}

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

    if (nestedData && typeof nestedData === 'object' && nestedData.format === 'csv' && typeof nestedData.csv === 'string') {
      const tables = this.extractTables(data, uf);
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
    const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);
    // Estado por coluna: evita que o subcabeçalho da coluna esquerda contamine a coluna direita
    const stateSEByCol: Record<string, StateSE> = {
      left: { currentSubheaderSE: '', isBeerSection: true },
      right: { currentSubheaderSE: '', isBeerSection: true },
    };
    const finalLines: string[] = [];

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

      const blockMap = new Map<string, any>(pageBlocks.map(b => [b.Id, b]));
      const wordIdsInTables = new Set<string>();
      const tableMarkdowns: string[] = [];

      // Ordena os blocos da página: para Sergipe (SE), primeiro coluna da esquerda (centro < 0.5), depois da direita.
      // Dentro de cada coluna (ou para outros estados), ordena de cima para baixo.
      const sortedPageBlocks = [...pageBlocks].sort((a, b) => {
        if (uf === 'SE') {
          const centerA = (a.Geometry?.BoundingBox?.Left ?? 0) + (a.Geometry?.BoundingBox?.Width ?? 0) / 2;
          const centerB = (b.Geometry?.BoundingBox?.Left ?? 0) + (b.Geometry?.BoundingBox?.Width ?? 0) / 2;
          const isLeftA = centerA < 0.5;
          const isLeftB = centerB < 0.5;
          if (isLeftA !== isLeftB) {
            return isLeftA ? -1 : 1;
          }
        }
        const topA = a.Geometry?.BoundingBox?.Top ?? 0;
        const topB = b.Geometry?.BoundingBox?.Top ?? 0;
        if (topA !== topB) return topA - topB;
        const leftA = a.Geometry?.BoundingBox?.Left ?? 0;
        const leftB = b.Geometry?.BoundingBox?.Left ?? 0;
        return leftA - leftB;
      });

      for (const block of sortedPageBlocks) {
        if (block.BlockType === 'LINE' && uf === 'SE') {
          const colKey = this._getColKey(block);
          const colState = stateSEByCol[colKey];
          const text = (block.Text || '').trim();
          if (text) {
            if (this._isNonBeerSubheader(text)) {
              colState.isBeerSection = false;
              colState.currentSubheaderSE = '';
            } else if (this._isSubheaderSE(text)) {
              colState.isBeerSection = true;
              colState.currentSubheaderSE = text;
            }
          }
        } else if (block.BlockType === 'TABLE') {
          const stateForBlock = uf === 'SE' ? stateSEByCol[this._getColKey(block)] : stateSEByCol['left'];
          const tableMd = this._reconstructTableFromBlocks(block, blockMap, wordIdsInTables, uf, stateForBlock);
          if (tableMd) {
            tableMarkdowns.push(tableMd);
          }
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
    if (nestedData && typeof nestedData === 'object' && nestedData.isEdited && Array.isArray(nestedData.tables)) {
      return nestedData.tables;
    }

    if (nestedData && typeof nestedData === 'object' && nestedData.format === 'csv' && typeof nestedData.csv === 'string') {
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
          
          const ufUpper = uf ? uf.toUpperCase() : '';
          const stateSE = { currentSubheaderSE: '', isBeerSection: true };
          const compactedTable = this._compactTable(rows, ufUpper, stateSE);

          return [{
            tabelaIndex: 1,
            pagina: 1,
            headers,
            rows: compactedTable
          }];
        }
      } catch (err) {
        console.error('Failed to parse CSV in extractTables:', err);
      }
      return [];
    }

    const ufUpper = uf ? uf.toUpperCase() : '';
    const resultados: EstruturaTabela[] = [];

    // Case 1: Structured layout from pre-parsed table data
    if (nestedData && typeof nestedData === 'object' && Array.isArray(nestedData.tables)) {
      const tables: any[][] = nestedData.tables;
      const stateSE = { currentSubheaderSE: '' };
      for (let tIdx = 0; tIdx < tables.length; tIdx++) {
        const table = tables[tIdx];
        if (!Array.isArray(table) || table.length === 0) continue;

        const tableData: string[][] = table.map(row => {
          if (!Array.isArray(row)) return [];
          return row.map(cell => cell !== undefined ? String(cell).trim() : '');
        });

        const compactedTable = this._compactTable(tableData, ufUpper, stateSE);
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

      // Adiciona itens adicionais detectados como Key-Value pairs (texto solto)
      if (nestedData.keyValuePairs && typeof nestedData.keyValuePairs === 'object') {
        const virtualRows: string[][] = [];
        for (const [key, value] of Object.entries(nestedData.keyValuePairs)) {
          const valStr = value !== undefined ? String(value).trim() : '';
          const keyStr = key !== undefined ? String(key).trim() : '';
          if (keyStr && valStr) {
            const isProductRelevant = this._isRowRelevant(keyStr);
            const hasPrice = /\d+[\.,]\d+/.test(valStr) || /^\s*(?:R\$\s*)?\d+\s*$/i.test(valStr);
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
    // Estado por coluna: evita que o subcabeçalho da coluna esquerda contamine a coluna direita
    const stateSEByCol: Record<string, StateSE> = {
      left: { currentSubheaderSE: '', isBeerSection: true },
      right: { currentSubheaderSE: '', isBeerSection: true },
    };

    for (const pageNum of pageNumbers) {
      const pageBlocks = blocksByPage[pageNum];
      const blockMap = new Map<string, any>(pageBlocks.map(b => [b.Id, b]));
      const wordIdsInTables = new Set<string>();

      // Ordena os blocos da página: para Sergipe (SE), primeiro coluna da esquerda (centro < 0.5), depois da direita.
      // Dentro de cada coluna (ou para outros estados), ordena de cima para baixo.
      const sortedPageBlocks = [...pageBlocks].sort((a, b) => {
        if (ufUpper === 'SE') {
          const centerA = (a.Geometry?.BoundingBox?.Left ?? 0) + (a.Geometry?.BoundingBox?.Width ?? 0) / 2;
          const centerB = (b.Geometry?.BoundingBox?.Left ?? 0) + (b.Geometry?.BoundingBox?.Width ?? 0) / 2;
          const isLeftA = centerA < 0.5;
          const isLeftB = centerB < 0.5;
          if (isLeftA !== isLeftB) {
            return isLeftA ? -1 : 1;
          }
        }
        const topA = a.Geometry?.BoundingBox?.Top ?? 0;
        const topB = b.Geometry?.BoundingBox?.Top ?? 0;
        if (topA !== topB) return topA - topB;
        const leftA = a.Geometry?.BoundingBox?.Left ?? 0;
        const leftB = b.Geometry?.BoundingBox?.Left ?? 0;
        return leftA - leftB;
      });

      for (const block of sortedPageBlocks) {
        if (block.BlockType === 'LINE' && ufUpper === 'SE') {
          const colKey = this._getColKey(block);
          const colState = stateSEByCol[colKey];
          const text = (block.Text || '').trim();
          if (text) {
            if (this._isNonBeerSubheader(text)) {
              colState.isBeerSection = false;
              colState.currentSubheaderSE = '';
            } else if (this._isSubheaderSE(text)) {
              colState.isBeerSection = true;
              colState.currentSubheaderSE = text;
            }
          }
        } else if (block.BlockType === 'TABLE') {
          const tableData = this._reconstructTableData(block, blockMap, wordIdsInTables);
          if (tableData.length === 0) continue;

          const stateForBlock = ufUpper === 'SE' ? stateSEByCol[this._getColKey(block)] : stateSEByCol['left'];
          const compactedTable = this._compactTable(tableData, ufUpper, stateForBlock);
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

  private static _compactTable(table: string[][], uf: string, state?: { currentSubheaderSE?: string; isBeerSection?: boolean }): string[][] {
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

    // 3. Tratamento para Sergipe (SE) - Propaga a hierarquia de subcabeçalhos (tipo + embalagem/volume)
    // O state recebido já é por coluna (left/right), eliminando contaminação entre colunas paralelas.
    if (ufUpper === 'SE') {
      const normalize = (str: string) => {
        return str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      };
      const newTable: string[][] = [];
      
      const col0First = table[0]?.[0] ? table[0][0].trim() : '';
      const isFirstRowHeader = /produto|marca|tipo|valor|coluna|column/i.test(col0First);
      
      let startIdx = 1;
      if (isFirstRowHeader) {
        newTable.push(table[0]);
      } else {
        newTable.push(['PRODUTO_MARCA_TIPO', 'VALOR_RS']);
        startIdx = 0;
      }

      let currentSubheader = '';

      for (let rIdx = startIdx; rIdx < table.length; rIdx++) {
        const row = table[rIdx];
        if (row.length === 0) continue;

        const col0 = row[0] ? row[0].trim() : '';
        const col1 = row[1] ? row[1].trim() : '';

        const isProductRelevant = this._isRowRelevant(col0);
        const hasPrice = col1 && (/\d+[\.,]\d+/.test(col1) || /^\s*(?:R\$\s*)?\d+\s*$/i.test(col1));
        const isSub = this._isSubheaderSE(col0);
        const isNonBeerSub = this._isNonBeerSubheader(col0);

        // Ignorar subcabeçalhos de 900ml a 1000ml pois não possuem produtos relevantes e quebram a propagação
        const is900or1000ml = col0.toLowerCase().includes('900') || col0.toLowerCase().includes('1000') || col0.toLowerCase().includes('1.000');

        if (isNonBeerSub && !hasPrice) {
          currentSubheader = '';
          if (state) {
            state.isBeerSection = false;
            state.currentSubheaderSE = '';
          }
          continue;
        }

        if (isSub && !hasPrice) {
          currentSubheader = col0;
          if (state) {
            state.isBeerSection = true;
            state.currentSubheaderSE = col0;
          }
          continue;
        }

        if (isProductRelevant) {
          const isBeerSection = state ? state.isBeerSection !== false : true;
          if (isBeerSection) {
            const newRow = [...row];
            let activeSubheader = currentSubheader || state?.currentSubheaderSE || '';

            // Auto-correção heurística baseada EM CONFLITOS DE VOLUME explicitados no nome do item
            const normCol0 = normalize(col0);
            const normActiveSub = normalize(activeSubheader);

            let mlVal = 0;
            const mlMatch = normCol0.match(/(\d+)\s*ml/);
            if (mlMatch) {
              mlVal = parseInt(mlMatch[1]);
            } else {
              // Tenta identificar faixas de volume no padrão "NUM NUM" ou "NUM-NUM" onde o OCR omitiu "a" ou "ml"
              const rangeMatch = normCol0.match(/\b(\d{2,4})\s*(?:a|à|-|\s)\s*(\d{2,4})\b/i);
              if (rangeMatch) {
                const n1 = parseInt(rangeMatch[1]);
                const n2 = parseInt(rangeMatch[2]);
                if (n1 === 269 || n2 === 269) mlVal = 269;
                else if (n1 === 350 || n2 === 350) mlVal = 350;
                else if (n1 === 473 || n2 === 473) mlVal = 473;
                else if (n1 === 500 || n2 === 500) mlVal = 500;
                else if (n1 === 210 || n2 === 210) mlVal = 210;
                else mlVal = n1;
              }
            }

            if (mlVal > 0) {
              const isDescartavel = normCol0.includes('descartavel') || normCol0.includes('long neck') || normCol0.includes('ln');
              const isRetornavel = normCol0.includes('retornavel');
              const isLata = normCol0.includes('lata') || normCol0.includes('lt');
              const isBeer = !normCol0.includes('energetico') && !normCol0.includes('energy') && !normCol0.includes('dopamina') && !normCol0.includes('best power') && !normCol0.includes('hysotonic') && !normCol0.includes('isotonic') && !normCol0.includes('tonica') && !normCol0.includes('agua tonica');

              if (isBeer) {
                if (mlVal === 500) {
                  if (normActiveSub.includes('descartavel') && (normActiveSub.includes('276') || normActiveSub.includes('399') || normActiveSub.includes('250') || normActiveSub.includes('200'))) {
                    activeSubheader = 'Cerveja em garrafa descartável de 500 ml a 660 ml';
                  } else if (normActiveSub.includes('retornavel')) {
                    activeSubheader = 'Cerveja em garrafa retornável de 600 ml';
                  }
                } else if (mlVal === 210) {
                  if (normActiveSub.includes('descartavel') && !normActiveSub.includes('200') && !normActiveSub.includes('249')) {
                    activeSubheader = 'Cerveja em garrafa descartável de 200 ml a 249 ml';
                  }
                } else if (mlVal === 269 && isLata) {
                  if (!normActiveSub.includes('250') || !normActiveSub.includes('299') || !normActiveSub.includes('330')) {
                    activeSubheader = 'Cerveja em lata de 250 ml a 299 ml';
                  }
                } else if (mlVal === 350 && isLata) {
                  if (!normActiveSub.includes('300') || !normActiveSub.includes('399')) {
                    activeSubheader = 'Cerveja em lata de 300 ml a 399 ml';
                  }
                } else if (mlVal === 473 && isLata) {
                  if (!normActiveSub.includes('400') || !normActiveSub.includes('473')) {
                    activeSubheader = 'Cerveja em lata de 400 a 473 ml';
                  }
                } else if ((mlVal === 900 || mlVal === 1000 || mlVal === 990) && (isRetornavel || normCol0.includes('bohemia') || normCol0.includes('antarctica') || normCol0.includes('brahma') || normCol0.includes('budweiser'))) {
                  if (!normActiveSub.includes('900') && !normActiveSub.includes('1000')) {
                    activeSubheader = 'Cerveja em garrafa de 900ml a 1000 ml';
                  }
                }
              } else {
                // Para energéticos e outras bebidas que não sejam cerveja
                if (normCol0.includes('dopamina') || normCol0.includes('energetico') || normCol0.includes('energy') || normCol0.includes('best power')) {
                  if (mlVal === 269 || mlVal <= 355) {
                    activeSubheader = 'Bebida energética em embalagem até 355 ml';
                  } else if (mlVal === 473 || (mlVal >= 356 && mlVal <= 599)) {
                    activeSubheader = 'Bebidas energéticas em embalagem de 356ml a 599ml';
                  } else if (mlVal >= 1500) {
                    activeSubheader = 'Bebidas energéticas em embalagem com capacidade igual ou superior a 1500 ml';
                  }
                } else if (normCol0.includes('hysotonic') || normCol0.includes('isotonic') || normCol0.includes('hidroeletrolitica')) {
                  if (mlVal < 600) {
                    activeSubheader = 'Bebidas hidroeletroliticas (isotônicas) em embalagem com capacidade inferior a 600ml';
                  }
                } else if (normCol0.includes('agua tonica') || normCol0.includes('tonica')) {
                  if (normCol0.includes('lata') || mlVal === 350) {
                    activeSubheader = 'Água tônica em lata de 350 ml';
                  } else {
                    activeSubheader = 'Água tônica em garrafa PET';
                  }
                }
              }
            }

            if (activeSubheader) {
              currentSubheader = activeSubheader;
              if (state) state.currentSubheaderSE = activeSubheader;
              newRow[0] = `${col0} (${activeSubheader})`;
            }

            // Normaliza e formata o valor da pauta para 2 casas decimais
            if (col1) {
              let priceVal = col1.replace(/R\$\s*/gi, '').trim();
              priceVal = priceVal.replace(',', '.');
              const num = parseFloat(priceVal);
              if (!isNaN(num)) {
                if (Number.isInteger(num) && num >= 100) {
                  newRow[1] = (num / 100).toFixed(2);
                } else {
                  newRow[1] = num.toFixed(2);
                }
              }
            }

            newTable.push(newRow);
          }
        }
      }
      return newTable;
    }

    // 4. Filtro geral de marca para outros estados
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
    const stateSE = { currentSubheaderSE: '' };

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const table = tables[tIdx];
      if (!Array.isArray(table) || table.length === 0) continue;

      const tableData: string[][] = table.map(row => {
        if (!Array.isArray(row)) return [];
        return row.map(cell => cell !== undefined ? String(cell).trim() : '');
      });

      const compactedTable = this._compactTable(tableData, uf, stateSE);
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

  private static _isNonBeerSubheader(text: string): boolean {
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };
    const normText = normalize(text);
    const nonBeerKeywords = [
      'refrigerante', 'suco', 'nectar', 'cha', 'bebida lactea'
    ];
    return nonBeerKeywords.some(kw => normText.includes(kw)) && !normText.includes('cerveja') && !normText.includes('chopp');
  }

  private static _isSubheaderSE(text: string): boolean {
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };
    const normText = normalize(text);

    // Se contiver preço (ex: decimal com vírgula ou ponto), não é um subcabeçalho
    if (/\d+[\.,]\d+/.test(normText)) {
      return false;
    }
    
    // Identifica se é comprovadamente um subcabeçalho conhecido
    const knownSubheaderKeywords = [
      ['cerveja', 'garrafa'],
      ['cerveja', 'lata'],
      ['agua', 'tonica'],
      ['bebida', 'energetica'],
      ['bebidas', 'energeticas'],
      ['bebidas', 'hidroeletrolitica'],
      ['bebidas', 'isotonica'],
      ['chope', 'litro'],
      ['chopp', 'litro']
    ];
    const isKnownSubheader = knownSubheaderKeywords.some(kws => kws.every(kw => normText.includes(kw)));

    if (!isKnownSubheader) {
      // Se contiver marcas concorrentes, é uma linha de produto concorrente, não subcabeçalho
      const concorrentes = [
        'skol', 'brahma', 'antarctica', 'heineken', 'amstel', 'budweiser', 'stella', 'corona',
        'kaiser', 'crystal', 'itaipava', 'devassa', 'schin', 'conti', 'cerpa', 'colina', 'samba',
        'proibida', 'spoller', 'serramalte', 'eisenbahn', 'bohemia', 'petra', 'burguesa', 'caracu',
        '1500', 'original'
      ];
      const hasConcorrente = concorrentes.some(c => {
        if (c === '1500') {
          // Evita confundir "1500 ml" (volume) com a cerveja "1500"
          return normText.includes('1500') && !normText.includes('1500ml') && !normText.includes('1500 ml');
        }
        return normText.includes(c);
      });
      if (hasConcorrente) return false;
    }

    const hasKeyword = normText.includes('garrafa') ||
                       normText.includes('lata') ||
                       normText.includes('retornavel') ||
                       normText.includes('descartavel') ||
                       normText.includes('copo') ||
                       normText.includes('barril') ||
                       normText.includes('embalagem') ||
                       normText.includes('hidroeletrolitica') ||
                       normText.includes('isotonica') ||
                       normText.includes('energetica') ||
                       (normText.includes('cerveja') && (normText.includes(' de ') || normText.includes('em')));
                       
    return hasKeyword || isKnownSubheader;
  }

  private static _isRowRelevant(rowText: string): boolean {
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };
    const normText = normalize(rowText);

    const matches = BRAND_SLUGS.some(slug => {
      const normSlug = normalize(slug);
      if (normSlug === '3.0') {
        return /\b3\.0\b/.test(normText);
      }
      return normText.includes(normSlug);
    });

    if (matches) {
      return true;
    }

    if (normText.includes('cidade imperial')) {
      const isStyle = /imperial\s+(stout|ipa|sour|red|double|ap|lager|pils|wit|helles|dunkel)/i.test(normText) ||
                      /(stout|ipa|sour|red|double|ap|lager|pils|wit|helles|dunkel)\s+imperial/i.test(normText);
      if (!isStyle) {
        return true;
      }
    }

    const seRelevant = ['dopamina', 'best power', 'hysotonic', 'macedonia'];
    if (seRelevant.some(term => normText.includes(term))) {
      return true;
    }

    return false;
  }

  private static _reconstructTableFromBlocks(
    tableBlock: any,
    blockMap: Map<string, any>,
    wordIdsInTables: Set<string>,
    uf?: string,
    state?: StateSE
  ): string {
    const tableData = this._reconstructTableData(tableBlock, blockMap, wordIdsInTables);
    if (tableData.length === 0) return '';

    const compactedTable = this._compactTable(tableData, uf || '', state);
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

  /**
   * Determina se um bloco pertence à coluna esquerda ou direita da página.
   * Usado para manter estados independentes em tabelas de duas colunas (ex: SE).
   */
  private static _getColKey(block: any): 'left' | 'right' {
    const left = block.Geometry?.BoundingBox?.Left ?? 0;
    const width = block.Geometry?.BoundingBox?.Width ?? 0;
    const centerX = left + width / 2;
    return centerX < 0.5 ? 'left' : 'right';
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

