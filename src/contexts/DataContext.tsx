import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { useFaturas } from '../hooks/useFaturas';
import { useClients } from '../hooks/useClients';
import { useEquipment } from '../hooks/useEquipment';
import { useUsers } from '../hooks/useUsers';
import { type FaturaRow } from '../utils/calculations';
import { toast } from 'sonner';

export interface DataState {
  rows: FaturaRow[];
  fileName: string;
  fileSize: number;
  importedAt: string | null;
  isLoading: boolean;
  error: string | null;
  rawHeaders: string[];
}

type DataAction =
  | { type: 'IMPORT_START' }
  | { type: 'IMPORT_SUCCESS'; payload: { rows: FaturaRow[]; fileName?: string; fileSize?: number; rawHeaders?: string[] } }
  | { type: 'IMPORT_ERROR'; payload: string }
  | { type: 'CLEAR_DATA' }
  | { type: 'UPDATE_ROW'; payload: { index: number; data: Partial<FaturaRow> } }
  | { type: 'DELETE_ROW'; payload: number };

const initialState: DataState = {
  rows: [],
  fileName: '',
  fileSize: 0,
  importedAt: null,
  isLoading: false,
  error: null,
  rawHeaders: [],
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'IMPORT_START':
      return { ...state, isLoading: true, error: null };
    case 'IMPORT_SUCCESS':
      return {
        ...state,
        rows: action.payload.rows,
        fileName: action.payload.fileName || state.fileName,
        fileSize: action.payload.fileSize || state.fileSize,
        importedAt: new Date().toISOString(),
        rawHeaders: action.payload.rawHeaders || [],
        isLoading: false,
        error: null,
      };
    case 'IMPORT_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_DATA':
      return { ...initialState };
    case 'UPDATE_ROW':
      return {
        ...state,
        rows: state.rows.map((row, idx) =>
          idx === action.payload.index ? { ...row, ...action.payload.data } : row
        ),
      };
    case 'DELETE_ROW':
      return {
        ...state,
        rows: state.rows.filter((_, idx) => idx !== action.payload),
      };
    default:
      return state;
  }
}

/**
 * Mapeia chaves do banco de dados (snake_case) para camelCase usado no front
 */
export function mapFromDb(dbRow: any): FaturaRow {
  const mapping: Record<string, string> = {
    nome_do_site: 'nomeDoSite',
    nome_do_cliente: 'nomeDoCliente',
    fonte: 'fonte',
    modalidade_tarifaria: 'modalidadeTarifaria',
    data_insercao: 'dataInsercao',
    nome_concessionaria: 'nomeConcessionaria',
    cnpj_concessionaria: 'cnpjConcessionaria',
    endereco: 'endereco',
    cep: 'cep',
    cidade: 'cidade',
    uf: 'uf',
    cnpj: 'cnpj',
    impostos_rs: 'impostosRS',
    instalacao: 'instalacao',
    mes_referencia: 'mesReferencia',
    data_leitura_atualizada: 'dataLeituraAtualizada',
    data_leitura_anterior: 'dataLeituraAnterior',
    data_leitura_proxima: 'dataLeituraProxima',
    mes_consumo: 'mesConsumo',
    data_vencimento: 'dataVencimento',
    data_emissao: 'dataEmissao',
    valor_total_rs: 'valorTotalRS',
    classe: 'classe',
    subclasse: 'subClasse',
    subgrupo: 'subgrupo',
    codigo_barras: 'codigoBarras',
    numero_nf: 'numeroNF',
    consumo_tusd_fora_ponta_rs: 'consumoTUSDForaPontaRS',
    tarifa_consumo_tusd_fora_ponta: 'tarifaConsumoTUSDForaPonta',
    medida_consumo_tusd_fora_ponta: 'medidaConsumoTUSDForaPonta',
    consumo_te_fora_ponta_rs: 'consumoTEForaPontaRS',
    tarifa_consumo_te_fora_ponta: 'tarifaConsumoTEForaPonta',
    medida_consumo_te_fora_ponta: 'medidaConsumoTEForaPonta',
    consumo_te_adicional_bandeira_amarela_rs: 'consumoTEAdicionalBandeiraAmarelaRS',
    tarifa_consumo_te_adicional_bandeira_amarela: 'tarifaConsumoTEAdicionalBandeiraAmarela',
    medida_consumo_te_adicional_bandeira_amarela: 'medidaConsumoTEAdicionalBandeiraAmarela',
    multa_rs: 'multaRS',
    juros_mora_rs: 'jurosMoraRS',
    atualizacao_monetaria_rs: 'atualizacao_monetaria_rs',
    ressarcimento_rs: 'ressarcimentoRS',
    outros_rs: 'outrosRS',
    aliquota_icms: 'aliquotaICMS',
    base_calculo_icms_rs: 'baseCalculoICMSRS',
    custo_icms_rs: 'custoICMSRS',
    aliquota_cofins: 'aliquotaCOFINS',
    base_calculo_cofins_rs: 'baseCalculoCOFINSRS',
    custo_cofins_rs: 'custoCOFINSRS',
    aliquota_pis_pasep: 'aliquotaPISPASEP',
    base_calculo_pis_pasep_rs: 'baseCalculoPISPASEPRS',
    custo_pis_pasep_rs: 'custoPISPASEPRS',
    servicos_iluminacao_publica_rs: 'servicosIluminacaoPublicaRS',
    tarifa_servicos_iluminacao_publica: 'tarifaServicosIluminacaoPublica',
    medida_servicos_iluminacao_publica: 'medidaServicosIluminacaoPublica',
  };

  const mapped: any = {
    id: dbRow.id
  };
  for (const [dbKey, jsKey] of Object.entries(mapping)) {
    let value = dbRow[dbKey];
    // Convert numeric strings/numbers to floats for the front
    if (jsKey.endsWith('RS') || jsKey.startsWith('tarifa') || jsKey.startsWith('medida') || jsKey.startsWith('aliquota') || jsKey.startsWith('base')) {
      value = parseFloat(value) || 0;
    }
    mapped[jsKey] = value;
  }
  return mapped as FaturaRow;
}

/**
 * Mapeia chaves do front (camelCase) para snake_case usado no banco
 */
function mapToDb(jsRow: FaturaRow): any {
  const mapping: Record<string, string> = {
    nomeDoSite: 'nome_do_site',
    nomeDoCliente: 'nome_do_cliente',
    fonte: 'fonte',
    modalidadeTarifaria: 'modalidade_tarifaria',
    dataInsercao: 'data_insercao',
    nomeConcessionaria: 'nome_concessionaria',
    cnpjConcessionaria: 'cnpj_concessionaria',
    endereco: 'endereco',
    cep: 'cep',
    cidade: 'cidade',
    uf: 'uf',
    cnpj: 'cnpj',
    impostosRS: 'impostos_rs',
    instalacao: 'instalacao',
    mesReferencia: 'mes_referencia',
    dataLeituraAtualizada: 'data_leitura_atualizada',
    dataLeituraAnterior: 'data_leitura_anterior',
    dataLeituraProxima: 'data_leitura_proxima',
    mesConsumo: 'mes_consumo',
    dataVencimento: 'data_vencimento',
    dataEmissao: 'data_emissao',
    valorTotalRS: 'valor_total_rs',
    classe: 'classe',
    subClasse: 'subclasse',
    subgrupo: 'subgrupo',
    codigoBarras: 'codigo_barras',
    numeroNF: 'numero_nf',
    consumoTUSDForaPontaRS: 'consumo_tusd_fora_ponta_rs',
    tarifaConsumoTUSDForaPonta: 'tarifa_consumo_tusd_fora_ponta',
    medidaConsumoTUSDForaPonta: 'medida_consumo_tusd_fora_ponta',
    consumoTEForaPontaRS: 'consumo_te_fora_ponta_rs',
    tarifaConsumoTEForaPonta: 'tarifa_consumo_te_fora_ponta',
    medidaConsumoTEForaPonta: 'medida_consumo_te_fora_ponta',
    consumoTEAdicionalBandeiraAmarelaRS: 'consumo_te_adicional_bandeira_amarela_rs',
    tarifaConsumoTEAdicionalBandeiraAmarela: 'tarifa_consumo_te_adicional_bandeira_amarela',
    medidaConsumoTEAdicionalBandeiraAmarela: 'medida_consumo_te_adicional_bandeira_amarela',
    multaRS: 'multa_rs',
    jurosMoraRS: 'juros_mora_rs',
    atualizacaoMonetariaRS: 'atualizacao_monetaria_rs',
    ressarcimentoRS: 'ressarcimento_rs',
    outrosRS: 'outros_rs',
    aliquotaICMS: 'aliquota_icms',
    baseCalculoICMSRS: 'base_calculo_icms_rs',
    custoICMSRS: 'custo_icms_rs',
    aliquotaCOFINS: 'aliquota_cofins',
    baseCalculoCOFINSRS: 'base_calculo_cofins_rs',
    custoCOFINSRS: 'custo_cofins_rs',
    aliquotaPISPASEP: 'aliquota_pis_pasep',
    baseCalculoPISPASEPRS: 'base_calculo_pis_pasep_rs',
    custoPISPASEPRS: 'custo_pis_pasep_rs',
    servicosIluminacaoPublicaRS: 'servicos_iluminacao_publica_rs',
    tarifaServicosIluminacaoPublica: 'tarifa_servicos_iluminacao_publica',
    medidaServicosIluminacaoPublica: 'medida_servicos_iluminacao_publica',
  };

  const mapped: any = {};
  for (const [jsKey, dbKey] of Object.entries(mapping)) {
    mapped[dbKey] = jsRow[jsKey as keyof FaturaRow];
  }
  return mapped;
}

export interface DataContextType {
  state: DataState;
  importFiles: (files: File | File[]) => Promise<void>;
  saveRows: (rowsToSave: FaturaRow[]) => Promise<void>;
  clearData: () => void;
  updateRow: (index: number, data: Partial<FaturaRow>) => void;
  deleteRow: (index: number) => void;
  getFaturas: () => Promise<any[]>;
  getClients: () => Promise<any[]>;
  createClient: (data: any) => Promise<any>;
  updateClient: (id: string | number, data: any) => Promise<any>;
  deleteClient: (id: string | number) => Promise<boolean>;
  bulkCreateClients: (clients: any[]) => Promise<any>;
  getEquipmentByClient: (clientId: string | number) => Promise<any[]>;
  createEquipment: (data: any) => Promise<any>;
  updateEquipment: (id: string | number, data: any) => Promise<any>;
  deleteEquipment: (id: string | number) => Promise<boolean>;
  getUsers: () => Promise<any[]>;
  createUser: (data: any) => Promise<any>;
  updateUser: (id: string | number, data: any) => Promise<any>;
  deleteUser: (id: string | number) => Promise<boolean>;
  resetUserPassword: (id: string | number) => Promise<any>;
}

const DataContext = createContext<DataContextType | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  
  // These hooks might trigger queries on mount
  const { uploadFatura, getFaturas, saveFaturas, loading: faturaLoading, error: faturaError } = useFaturas();
  const { getClients, createClient, updateClient, deleteClient, bulkCreateClients, loading: clientLoading, error: clientError } = useClients();
  const { getEquipmentByClient, createEquipment, updateEquipment, deleteEquipment, loading: equipLoading, error: equipError } = useEquipment();
  const { getUsers, createUser, updateUser, deleteUser, resetUserPassword, loading: userLoading, error: userError } = useUsers();

  const importFiles = useCallback(async (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;

    dispatch({ type: 'IMPORT_START' });
    try {
      let allRows: FaturaRow[] = [];
      let totalSize = 0;

      for (const file of fileList) {
        const result = await uploadFatura(file);
        const rows = result.rows.map(mapFromDb);
        allRows = [...allRows, ...rows];
        totalSize += file.size;
      }

      const displayFileName = fileList.length === 1
        ? fileList[0].name
        : `${fileList.length} arquivos selecionados`;

      dispatch({
        type: 'IMPORT_SUCCESS',
        payload: {
          rows: allRows,
          fileName: displayFileName,
          fileSize: totalSize
        }
      });

      toast.success('Importação concluída', {
        description: `${allRows.length} faturas processadas com sucesso.`,
      });
    } catch (err: any) {
      dispatch({ type: 'IMPORT_ERROR', payload: err.message });
      toast.error('Erro na importação', {
        description: err.message || 'Ocorreu um erro ao processar os arquivos.',
      });
    }
  }, [uploadFatura]);

  const saveRows = useCallback(async (rowsToSave: FaturaRow[]) => {
    try {
      const dbRows = rowsToSave.map(mapToDb);
      await saveFaturas(dbRows);
      toast.success('Dados salvos com sucesso!');
    } catch (err: any) {
      dispatch({ type: 'IMPORT_ERROR', payload: err.message });
      toast.error('Erro ao salvar dados', {
        description: err.message,
      });
    }
  }, [saveFaturas]);

  const clearData = useCallback(() => {
    dispatch({ type: 'CLEAR_DATA' });
    toast.info('Dados da sessão limpos.');
  }, []);

  const updateRow = useCallback((index: number, data: Partial<FaturaRow>) => {
    dispatch({ type: 'UPDATE_ROW', payload: { index, data } });
  }, []);

  const deleteRow = useCallback((index: number) => {
    dispatch({ type: 'DELETE_ROW', payload: index });
  }, []);

  const value: DataContextType = {
    state: {
      ...state,
      isLoading: state.isLoading || faturaLoading || clientLoading || equipLoading || userLoading,
      error: state.error || faturaError || clientError || equipError || userError,
    },
    importFiles,
    saveRows,
    clearData,
    updateRow,
    deleteRow,
    // Faturas
    getFaturas,
    // Clients
    getClients,
    createClient,
    updateClient,
    deleteClient,
    bulkCreateClients,
    // Equipment
    getEquipmentByClient,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    // Users
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}

export default DataContext;
