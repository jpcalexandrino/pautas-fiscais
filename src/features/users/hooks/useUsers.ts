import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiFetch('/users');
      if (!response.ok) throw new Error('Falha ao carregar usuários');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });

  const createMutation = useMutation({
    mutationFn: async (user: any) => {
      const response = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(user),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao criar usuário');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, user }: { id: string | number; user: any }) => {
      const response = await apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao atualizar usuário');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiFetch(`/users/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao deletar usuário');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiFetch(`/users/${id}/reset-password`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao resetar senha');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    loading: usersQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || resetPasswordMutation.isPending,
    error: usersQuery.error?.message || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || resetPasswordMutation.error?.message || null,
    getUsers: async () => {
      const { data } = await usersQuery.refetch();
      return data || [];
    },
    createUser: createMutation.mutateAsync,
    updateUser: (id: string | number, user: any) => updateMutation.mutateAsync({ id, user }),
    deleteUser: deleteMutation.mutateAsync,
    resetUserPassword: resetPasswordMutation.mutateAsync,
    users: usersQuery.data || [],
    isError: usersQuery.isError,
  };
}
