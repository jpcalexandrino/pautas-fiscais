export interface Produto {
  id: number;
  codigo_interno: string;
  gtin_13: string | null;
  descricao_interna: string;
  embalagem: string;
  conteudo_volume: number | null;
  tipo: 'proprio' | 'terceiros';
  rowId?: string;
  subRows?: Produto[];
}

export interface DePara {
  id: number;
  uf: string;
  nome_estado: string;
  termo_descricao_estado: string;
  gtin_estado: string | null;
  produto_descricao: string;
  produto_gtin: string | null;
  produto_codigo: string;
  rowId?: string;
  subRows?: DePara[];
}

export interface Pauta {
  id: string;
  fk_produto?: number;
  fk_estado?: number;
  uf: string;
  nome_estado: string;
  descricao_interna: string;
  gtin_13: string | null;
  codigo_interno: string | null;
  embalagem: string | null;
  conteudo_volume: number | null;
  valor_pauta: number;
  data: string;
  arquivo_origem: string;
  contexto: 'proprio' | 'terceiros';
  created_at?: string;
  rowId?: string;
  subRows?: Pauta[];
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  active: boolean;
  rowId?: string;
  subRows?: User[];
}
