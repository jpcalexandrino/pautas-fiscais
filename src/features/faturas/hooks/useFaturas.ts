import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '@/api/client';

export function useFaturas() {
  const queryClient = useQueryClient();

  const faturasQuery = useQuery({
    queryKey: ['faturas'],
    queryFn: async () => {
      const response = await apiFetch('/faturas');
      if (!response.ok) throw new Error('Falha ao carregar faturas');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiUpload('/faturas/upload', formData);
      if (!response.ok) throw new Error('Falha no upload');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (faturas: any[]) => {
      const response = await apiFetch('/faturas', {
        method: 'POST',
        body: JSON.stringify({ faturas }),
      });
      if (!response.ok) throw new Error('Falha ao salvar faturas');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
    },
  });

  const syncPowerHubMutation = useMutation({
    mutationFn: async (args?: { installationId?: string; referenceMonth?: string }) => {
      const response = await apiFetch('/faturas/sync-powerhub', {
        method: 'POST',
        body: JSON.stringify(args || {}),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Falha ao sincronizar com PowerHUB');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/faturas', { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao limpar dados');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
    },
  });

  return {
    loading: faturasQuery.isLoading || uploadMutation.isPending || saveMutation.isPending || clearMutation.isPending || syncPowerHubMutation.isPending,
    syncing: syncPowerHubMutation.isPending,
    error: faturasQuery.error?.message || uploadMutation.error?.message || saveMutation.error?.message || clearMutation.error?.message || syncPowerHubMutation.error?.message || null,
    getFaturas: async () => {
      const { data } = await faturasQuery.refetch();
      return data || [];
    },
    uploadFatura: uploadMutation.mutateAsync,
    saveFaturas: saveMutation.mutateAsync,
    clearFaturas: clearMutation.mutateAsync,
    syncPowerHub: syncPowerHubMutation.mutateAsync,
    faturas: faturasQuery.data || [],
  };
}
