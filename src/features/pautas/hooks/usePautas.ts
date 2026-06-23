import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '@/api/client';

export function usePautas(filters?: { fk_estado?: number; fk_produto?: number }) {
  const queryClient = useQueryClient();

  const pautasQuery = useQuery({
    queryKey: ['pautas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fk_estado) params.set('fk_estado', String(filters.fk_estado));
      if (filters?.fk_produto) params.set('fk_produto', String(filters.fk_produto));
      const qs = params.toString();
      const response = await apiFetch(`/pautas${qs ? `?${qs}` : ''}`);
      if (!response.ok) throw new Error('Falha ao carregar pautas');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const pendentesQuery = useQuery({
    queryKey: ['pautas-pendentes'],
    queryFn: async () => {
      const response = await apiFetch('/pautas/pendentes');
      if (!response.ok) throw new Error('Falha ao carregar pendentes');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, uf }: { file: File; uf: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uf', uf);
      const response = await apiUpload('/pautas/upload', formData);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao processar PDF');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-pendentes'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, fk_produto, salvar_de_para }: { id: number; fk_produto: number; salvar_de_para?: boolean }) => {
      const response = await apiFetch(`/pautas/pendentes/${id}/confirmar`, {
        method: 'POST',
        body: JSON.stringify({ fk_produto, salvar_de_para }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao confirmar item');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['de-para'] });
    },
  });

  const deletePendenteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/pautas/pendentes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao excluir pendente');
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pautas-pendentes'] }),
  });

  const deleteAllPendentesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/pautas/pendentes', { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao excluir todos os pendentes');
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pautas-pendentes'] }),
  });

  const ocrFilesQuery = useQuery({
    queryKey: ['pautas-ocr-files'],
    queryFn: async () => {
      const response = await apiFetch('/pautas/ocr-files');
      if (!response.ok) throw new Error('Falha ao carregar arquivos do banco');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const reprocessMutation = useMutation({
    mutationFn: async ({ filename, uf }: { filename: string; uf: string }) => {
      const response = await apiFetch('/pautas/reprocessar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, uf }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao reprocessar arquivo');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['pautas-ocr-files'] });
    },
  });

  return {
    loading: pautasQuery.isLoading || pendentesQuery.isLoading || ocrFilesQuery.isLoading,
    pautas: pautasQuery.data || [],
    pendentes: pendentesQuery.data || [],
    ocrFiles: ocrFilesQuery.data || [],
    uploadPauta: uploadMutation.mutateAsync,
    reprocessPauta: reprocessMutation.mutateAsync,
    confirmPendente: confirmMutation.mutateAsync,
    deletePendente: deletePendenteMutation.mutateAsync,
    deleteAllPendentes: deleteAllPendentesMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isReprocessing: reprocessMutation.isPending,
    refetchPautas: pautasQuery.refetch,
    refetchPendentes: pendentesQuery.refetch,
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
