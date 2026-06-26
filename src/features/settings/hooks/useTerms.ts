import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export interface Termo {
  id: number;
  termo: string;
  created_at: string;
}

export function useTerms() {
  const queryClient = useQueryClient();

  const termsQuery = useQuery<Termo[]>({
    queryKey: ['config-termos'],
    queryFn: async () => {
      const response = await apiFetch('/config/termos');
      if (!response.ok) throw new Error('Falha ao carregar termos de busca');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const createMutation = useMutation({
    mutationFn: async (termo: string) => {
      const response = await apiFetch('/config/termos', {
        method: 'POST',
        body: JSON.stringify({ termo }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao criar termo');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-termos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const response = await apiFetch(`/config/termos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao deletar termo');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-termos'] });
    },
  });

  return {
    terms: termsQuery.data || [],
    isLoading: termsQuery.isLoading || createMutation.isPending || deleteMutation.isPending,
    error: termsQuery.error?.message || createMutation.error?.message || deleteMutation.error?.message || null,
    createTerm: createMutation.mutateAsync,
    deleteTerm: deleteMutation.mutateAsync,
    refetchTerms: termsQuery.refetch,
  };
}
