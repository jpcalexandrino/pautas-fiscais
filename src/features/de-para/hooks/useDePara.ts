import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '@/api/client';

export function useDePara(uf?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['de-para', uf || 'all'];

  const deParaQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const url = uf ? `/de-para?uf=${uf}` : '/de-para';
      const response = await apiFetch(url);
      if (!response.ok) throw new Error('Falha ao carregar De-Para');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const createMutation = useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const response = await apiFetch('/de-para', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao criar De-Para');
      }
      return await response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['de-para'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: number; item: Record<string, unknown> }) => {
      const response = await apiFetch(`/de-para/${id}`, {
        method: 'PUT',
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao atualizar De-Para');
      }
      return await response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['de-para'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/de-para/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao deletar De-Para');
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['de-para'] }),
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiUpload('/de-para/bulk', formData);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao importar planilha');
      }
      return await response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['de-para'] }),
  });

  return {
    loading: deParaQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || bulkImportMutation.isPending,
    items: deParaQuery.data || [],
    createDePara: createMutation.mutateAsync,
    updateDePara: (id: number, item: Record<string, unknown>) => updateMutation.mutateAsync({ id, item }),
    deleteDePara: deleteMutation.mutateAsync,
    bulkImportDePara: bulkImportMutation.mutateAsync,
    refetch: deParaQuery.refetch,
  };
}
