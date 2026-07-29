import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCrudResource } from '@/shared/hooks/useCrudResource';
import { apiJson } from '@/shared/api/http';
import type { User } from '@/shared/types';

export function useUsers() {
  const queryClient = useQueryClient();
  const crud = useCrudResource<User>({
    queryKey: ['users'],
    endpoint: '/users',
    labels: {
      list: 'Falha ao carregar usuários',
      create: 'Falha ao criar usuário',
      update: 'Falha ao atualizar usuário',
      delete: 'Falha ao deletar usuário',
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string | number) =>
      apiJson(`/users/${id}/reset-password`, { method: 'POST' }, 'Falha ao resetar senha'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return {
    loading: crud.loading || resetPasswordMutation.isPending,
    error: crud.error || resetPasswordMutation.error?.message || null,
    getUsers: async () => {
      const { data } = await crud.refetch();
      return data || [];
    },
    createUser: crud.create,
    updateUser: crud.update,
    deleteUser: crud.remove,
    resetUserPassword: resetPasswordMutation.mutateAsync,
    users: crud.items,
    isError: crud.isError,
  };
}
