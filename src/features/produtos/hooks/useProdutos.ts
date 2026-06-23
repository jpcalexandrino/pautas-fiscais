import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '@/api/client';

export function useProdutos() {
  const queryClient = useQueryClient();

  const produtosQuery = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await apiFetch('/produtos');
      if (!response.ok) throw new Error('Falha ao carregar produtos');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const createMutation = useMutation({
    mutationFn: async (produto: Record<string, unknown>) => {
      const response = await apiFetch('/produtos', {
        method: 'POST',
        body: JSON.stringify(produto),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao criar produto');
      }
      return await response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, produto }: { id: number; produto: Record<string, unknown> }) => {
      const response = await apiFetch(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(produto),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao atualizar produto');
      }
      return await response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/produtos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao deletar produto');
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiUpload('/produtos/bulk', formData);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao importar produtos');
      }
      return await response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });

  return {
    loading: produtosQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || importMutation.isPending,
    produtos: produtosQuery.data || [],
    createProduto: createMutation.mutateAsync,
    updateProduto: (id: number, produto: Record<string, unknown>) => updateMutation.mutateAsync({ id, produto }),
    deleteProduto: deleteMutation.mutateAsync,
    importProdutos: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    refetch: produtosQuery.refetch,
  };

}
