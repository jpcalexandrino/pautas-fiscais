import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client';

export function useClients() {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await apiFetch('/clients');
      if (!response.ok) throw new Error('Falha ao carregar clientes');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const createMutation = useMutation({
    mutationFn: async (client: any) => {
      const response = await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify(client),
      });
      if (!response.ok) throw new Error('Falha ao criar cliente');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, client }: { id: string | number, client: any }) => {
      const response = await apiFetch(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(client),
      });
      if (!response.ok) throw new Error('Falha ao atualizar cliente');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiFetch(`/clients/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao deletar cliente');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (clients: any[]) => {
      const response = await apiFetch('/clients/bulk', {
        method: 'POST',
        body: JSON.stringify(clients),
      });
      if (!response.ok) throw new Error('Falha ao importar clientes');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    loading: clientsQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || bulkCreateMutation.isPending,
    error: clientsQuery.error?.message || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || bulkCreateMutation.error?.message || null,
    getClients: async () => {
      const { data } = await clientsQuery.refetch();
      return data || [];
    },
    createClient: createMutation.mutateAsync,
    updateClient: (id: string | number, client: any) => updateMutation.mutateAsync({ id, client }),
    deleteClient: deleteMutation.mutateAsync,
    bulkCreateClients: bulkCreateMutation.mutateAsync,
    // Add these for direct usage in components if needed
    clients: clientsQuery.data || [],
    isError: clientsQuery.isError,
  };
}
