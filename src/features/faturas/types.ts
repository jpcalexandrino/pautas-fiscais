/**
 * Tipos centrais do domínio de Faturas de Energia
 */

// ─── Entidade principal ──────────────────────────────────────────────────────

export interface FaturaRow {
  id?: string | number;
  valorTotalRS?: number | string;
  custoICMSRS?: number | string;
  custoPISPASEPRS?: number | string;
  custoCOFINSRS?: number | string;
  medidaConsumoTUSDForaPonta?: number | string;
  consumoTEAdicionalBandeiraAmarelaRS?: number | string;
  multaRS?: number | string;
  jurosMoraRS?: number | string;
  atualizacaoMonetariaRS?: number | string;
  servicosIluminacaoPublicaRS?: number | string;
  outrosRS?: number | string;
  ressarcimentoRS?: number | string;
  consumoTUSDForaPontaRS?: number | string;
  consumoTEForaPontaRS?: number | string;
  nomeDoSite?: string;
  nomeDoCliente?: string;
  fonte?: string;
  modalidadeTarifaria?: string;
  dataInsercao?: string;
  nomeConcessionaria?: string;
  cnpjConcessionaria?: string;
  endereco?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  cnpj?: string;
  impostosRS?: number | string;
  instalacao?: string;
  mesReferencia?: string;
  dataLeituraAtualizada?: string;
  dataLeituraAnterior?: string;
  dataLeituraProxima?: string;
  mesConsumo?: string;
  dataVencimento?: string;
  dataEmissao?: string;
  classe?: string;
  subClasse?: string;
  subgrupo?: string;
  codigoBarras?: string;
  numeroNF?: string;
  tarifaConsumoTUSDForaPonta?: number | string;
  tarifaConsumoTEForaPonta?: number | string;
  tarifaConsumoTEAdicionalBandeiraAmarela?: number | string;
  medidaConsumoTEForaPonta?: number | string;
  medidaConsumoTEAdicionalBandeiraAmarela?: number | string;
  aliquotaICMS?: number | string;
  baseCalculoICMSRS?: number | string;
  aliquotaCOFINS?: number | string;
  baseCalculoCOFINSRS?: number | string;
  aliquotaPISPASEP?: number | string;
  baseCalculoPISPASEPRS?: number | string;
  tarifaServicosIluminacaoPublica?: number | string;
  medidaServicosIluminacaoPublica?: number | string;
  medida_consumo_tusd_fora_ponta?: number | string;
  [key: string]: any;
}

// ─── Estado do contexto de importação ────────────────────────────────────────

export interface DataState {
  rows: FaturaRow[];
  fileName: string;
  fileSize: number;
  importedAt: string | null;
  isLoading: boolean;
  error: string | null;
  rawHeaders: string[];
}

export type DataAction =
  | { type: 'IMPORT_START' }
  | { type: 'IMPORT_SUCCESS'; payload: { rows: FaturaRow[]; fileName?: string; fileSize?: number; rawHeaders?: string[] } }
  | { type: 'IMPORT_ERROR'; payload: string }
  | { type: 'CLEAR_DATA' }
  | { type: 'UPDATE_ROW'; payload: { index: number; data: Partial<FaturaRow> } }
  | { type: 'DELETE_ROW'; payload: number };
