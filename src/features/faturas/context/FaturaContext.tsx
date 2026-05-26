import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { useFaturas } from '../hooks/useFaturas';
import { mapFromDb, mapToDb } from '../mappers';
import { toast } from 'sonner';
import type { FaturaRow, DataState, DataAction } from '../types';

export type { DataState };

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

export interface FaturaContextType {
  state: DataState;
  importFiles: (files: File | File[]) => Promise<void>;
  saveRows: (rowsToSave: FaturaRow[]) => Promise<void>;
  clearData: () => void;
  updateRow: (index: number, data: Partial<FaturaRow>) => void;
  deleteRow: (index: number) => void;
  getFaturas: () => Promise<any[]>;
}

const FaturaContext = createContext<FaturaContextType | null>(null);

interface FaturaProviderProps {
  children: ReactNode;
}

export function FaturaProvider({ children }: FaturaProviderProps) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const { uploadFatura, getFaturas, saveFaturas, loading: faturaLoading, error: faturaError } = useFaturas();

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
          fileSize: totalSize,
        },
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
      toast.error('Erro ao salvar dados', { description: err.message });
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

  const value: FaturaContextType = {
    state: {
      ...state,
      isLoading: state.isLoading || faturaLoading,
      error: state.error || faturaError,
    },
    importFiles,
    saveRows,
    clearData,
    updateRow,
    deleteRow,
    getFaturas,
  };

  return <FaturaContext.Provider value={value}>{children}</FaturaContext.Provider>;
}

export function useFatura() {
  const context = useContext(FaturaContext);
  if (!context) {
    throw new Error('useFatura deve ser usado dentro de um FaturaProvider');
  }
  return context;
}

export default FaturaContext;
