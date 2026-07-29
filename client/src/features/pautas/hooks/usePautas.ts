import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '@/api/client';

export function usePautas(filters?: { fk_estado?: number; fk_produto?: number; contexto?: string }) {
  const queryClient = useQueryClient();

  const pautasQuery = useQuery({
    queryKey: ['pautas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fk_estado) params.set('fk_estado', String(filters.fk_estado));
      if (filters?.fk_produto) params.set('fk_produto', String(filters.fk_produto));
      if (filters?.contexto) params.set('contexto', filters.contexto);
      const qs = params.toString();
      const response = await apiFetch(`/pautas${qs ? `?${qs}` : ''}`);
      if (!response.ok) throw new Error('Falha ao carregar pautas');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, uf, dataPauta, contexto }: { file: File; uf: string; dataPauta?: string; contexto?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uf', uf);
      if (dataPauta) {
        formData.append('data_pauta', dataPauta);
      }
      if (contexto) {
        formData.append('contexto', contexto);
      }
      const response = await apiUpload('/pautas/upload', formData);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao processar PDF');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-ocr-files'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const ocrFilesQuery = useQuery({
    queryKey: ['pautas-ocr-files', filters?.contexto],
    queryFn: async () => {
      const qs = filters?.contexto ? `?contexto=${filters.contexto}` : '';
      const response = await apiFetch(`/pautas/ocr-files${qs}`);
      if (!response.ok) throw new Error('Falha ao carregar arquivos do banco');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const confirmManualMutation = useMutation({
    mutationFn: async (params: {
      fk_produtos: number[];
      uf: string;
      descricao_estado: string;
      valor_pauta: number;
      data_pauta: string;
      arquivo_origem: string;
      salvar_de_para: boolean;
      cell_key?: string;
      contexto?: string;
    }) => {
      const response = await apiFetch('/pautas/confirmar-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao gravar pauta manualmente');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      queryClient.invalidateQueries({ queryKey: ['de-para'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-ocr-tables'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const updateOcrTablesMutation = useMutation({
    mutationFn: async ({ filename, tabelas, confirmedCells, contexto }: { filename: string; tabelas: any[]; confirmedCells?: string[]; contexto?: string }) => {
      const response = await apiFetch(`/pautas/ocr-files/${encodeURIComponent(filename)}/tabelas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabelas, confirmedCells, contexto }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao salvar alterações nas tabelas');
      }
      return await response.json();
    },
    onSuccess: (_, { filename }) => {
      queryClient.invalidateQueries({ queryKey: ['pautas-ocr-tables', filename] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: async ({ id, justificativa, apagarDePara }: { id: string | number; justificativa: string; apagarDePara?: boolean }) => {
      const response = await apiFetch(`/pautas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justificativa, apagarDePara }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao excluir pauta');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-ocr-files'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-ocr-tables'] });
      queryClient.invalidateQueries({ queryKey: ['de-para'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const excluirArquivoOcrMutation = useMutation({
    mutationFn: async ({ filename, contexto }: { filename: string; contexto?: string }) => {
      const qs = contexto ? `?contexto=${contexto}` : '';
      const response = await apiFetch(`/pautas/ocr-files/${encodeURIComponent(filename)}${qs}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao excluir arquivo OCR');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas-ocr-files'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  return {
    loading: pautasQuery.isLoading || ocrFilesQuery.isLoading,
    pautas: pautasQuery.data || [],
    ocrFiles: ocrFilesQuery.data || [],
    uploadPauta: uploadMutation.mutateAsync,
    confirmManualPauta: confirmManualMutation.mutateAsync,
    updateOcrTables: updateOcrTablesMutation.mutateAsync,
    excluirPauta: excluirMutation.mutateAsync,
    excluirArquivoOcr: excluirArquivoOcrMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isUpdatingOcrTables: updateOcrTablesMutation.isPending,
    isExcluindoPauta: excluirMutation.isPending,
    isExcluindoArquivoOcr: excluirArquivoOcrMutation.isPending,
    refetchPautas: pautasQuery.refetch,
    refetchOcrFiles: ocrFilesQuery.refetch,
  };
}

export function useEstados() {
  return useQuery({
    queryKey: ['estados'],
    queryFn: async () => {
      const response = await apiFetch('/estados');
      if (!response.ok) throw new Error('Falha ao carregar estados');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });
}

export function useOcrTables(filename?: string, contexto?: string) {
  return useQuery<{ tabelas: any[]; sugestoesDatas: string[]; confirmedCells: string[]; uf?: string }>({
    queryKey: ['pautas-ocr-tables', filename, contexto],
    queryFn: async () => {
      if (!filename) return { tabelas: [], sugestoesDatas: [], confirmedCells: [], uf: '' };
      const qs = contexto ? `?contexto=${contexto}` : '';
      const response = await apiFetch(`/pautas/ocr-files/${encodeURIComponent(filename)}/tabelas${qs}`);
      if (!response.ok) throw new Error('Falha ao carregar tabelas do OCR');
      return await response.json();
    },
    enabled: !!filename && !!localStorage.getItem('token'),
  });
}

export function usePautasRelacionadas(pautaId?: string | number | null) {
  return useQuery<{ targetPauta: any; relatedPautas: any[] }>({
    queryKey: ['pautas-relacionadas', pautaId],
    queryFn: async () => {
      if (!pautaId) return { targetPauta: null, relatedPautas: [] };
      const response = await apiFetch(`/pautas/${pautaId}/related`);
      if (!response.ok) throw new Error('Falha ao carregar pautas vinculadas');
      return await response.json();
    },
    enabled: !!pautaId && !!localStorage.getItem('token'),
  });
}
