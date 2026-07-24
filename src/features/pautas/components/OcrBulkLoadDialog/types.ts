export interface Produto {
  id: number;
  descricao_interna: string;
  gtin_13?: string;
  embalagem?: string;
  conteudo_volume?: number;
}

export interface DeParaItem {
  id: number;
  termo_descricao_estado: string;
  fk_produto: number;
}

export interface BulkItem {
  cellKey: string;
  rowIdx: number;
  colIdx: number;
  inferredDesc: string;
  value: string;
  valorNum: number;
  matchedProductIds: number[];
  matchType: 'de-para' | 'fuzzy' | 'none';
  selected: boolean;
  confirmed: boolean;
}

export interface OcrBulkLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabela: {
    tabelaIndex: number;
    pagina: number;
    headers: string[];
    indexedRows: { data: string[]; originalIndex: number }[];
  } | null;
  produtos: Produto[];
  deParas: DeParaItem[];
  uf: string;
  dataPauta: string;
  filename: string;
  confirmedCells: Set<string>;
  onConfirmBulk: (params: {
    fk_produtos: number[];
    uf: string;
    descricao_estado: string;
    valor_pauta: number;
    data_pauta: string;
    arquivo_origem: string;
    salvar_de_para: boolean;
    cell_key: string;
  }[]) => Promise<void>;
  isPriceCell: (value: string, header: string, colIdx?: number) => boolean;
  inferItemDescription: (row: string[], headers: string[], colIdx: number, uf: string) => string;
}
