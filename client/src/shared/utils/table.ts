import { type ColumnDef } from '@tanstack/react-table';

interface CalculateColumnSizesOptions {
  minWidth?: number;
  maxWidth?: number;
  charWidthHeader?: number;
  charWidthCell?: number;
  extraHeaderPadding?: number;
  extraCellPadding?: number;
}

/**
 * Calcula dinamicamente as larguras das colunas com base no comprimento do cabeçalho e dos dados.
 * 
 * @param columns Definições de colunas originais do TanStack Table
 * @param data Dados reais da tabela para calcular a largura com base no conteúdo
 * @param options Configurações adicionais de limites e pesos de caracteres
 */
export function calculateColumnSizes<T>(
  columns: ColumnDef<T, any>[],
  data: T[],
  options: CalculateColumnSizesOptions = {}
): ColumnDef<T, any>[] {
  const {
    minWidth = 100,
    maxWidth = 500,
    charWidthHeader = 8,
    charWidthCell = 7.5,
    extraHeaderPadding = 65, // Considera grip handle, ícone de ordenação e input de filtro
    extraCellPadding = 24, // Considera preenchimento interno e bordas
  } = options;

  return columns.map((col) => {
    // TypeScript safe access to accessorKey since not all ColumnDef types have it
    const accessorKey = 'accessorKey' in col ? (col.accessorKey as string) : undefined;

    // Colunas de ação devem manter o tamanho padrão delas
    if (col.id === 'actions' || accessorKey === 'actions') {
      return col;
    }

    // Calcula largura com base no texto do cabeçalho
    let headerText = '';
    if (typeof col.header === 'string') {
      headerText = col.header;
    } else if (col.id) {
      headerText = col.id;
    } else if (typeof accessorKey === 'string') {
      headerText = accessorKey;
    }

    const headerWidth = headerText.length * charWidthHeader + extraHeaderPadding;

    // Calcula largura máxima com base no conteúdo das células na coluna
    let maxContentWidth = 0;
    const key = accessorKey;
    if (typeof key === 'string' && data && data.length > 0) {
      const maxLen = data.reduce((max, row) => {
        const val = (row as any)[key];
        if (val === null || val === undefined) return max;
        
        // Trata conversão para string do valor
        const str = String(val);
        return str.length > max ? str.length : max;
      }, 0);
      maxContentWidth = maxLen * charWidthCell + extraCellPadding;
    }

    // Define o limite inferior de largura específica por coluna
    let targetMinWidth = minWidth;
    if (col.id === 'uf' || accessorKey === 'uf') {
      targetMinWidth = 135; // UF precisa de menos espaço padrão
    }

    // O tamanho ideal é o maior entre a largura mínima, o cabeçalho e o conteúdo das células
    let optimalSize = Math.max(targetMinWidth, headerWidth, maxContentWidth);

    // Limita ao tamanho máximo configurado
    if (optimalSize > maxWidth) {
      optimalSize = maxWidth;
    }

    return {
      ...col,
      size: optimalSize,
    };
  });
}
