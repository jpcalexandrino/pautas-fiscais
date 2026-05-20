import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client';

export function useEquipment() {
  const queryClient = useQueryClient();

  const getEquipmentByClient = async (clientId: string | number) => {
    const response = await apiFetch(`/equipment/client/${clientId}`);
    if (!response.ok) throw new Error('Falha ao carregar equipamentos');
    return await response.json();
  };

  const createMutation = useMutation({
    mutationFn: async (equipment: any) => {
      const response = await apiFetch('/equipment', {
        method: 'POST',
        body: JSON.stringify(equipment),
      });
      if (!response.ok) throw new Error('Falha ao criar equipamento');
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.clientId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, equipment }: { id: string | number, equipment: any }) => {
      const response = await apiFetch(`/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(equipment),
      });
      if (!response.ok) throw new Error('Falha ao atualizar equipamento');
      return await response.json();
    },
    onSuccess: () => {
      // We might need to invalidate all equipment or use a specific tag if we had one
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiFetch(`/equipment/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao deletar equipamento');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  return {
    loading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || null,
    getEquipmentByClient,
    createEquipment: createMutation.mutateAsync,
    updateEquipment: (id: string | number, equipment: any) => updateMutation.mutateAsync({ id, equipment }),
    deleteEquipment: deleteMutation.mutateAsync,
  };
}
