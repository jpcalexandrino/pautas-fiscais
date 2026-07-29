import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson, apiUploadJson, hasAuthToken } from '@/shared/api/http';

type Id = string | number;

export type CrudResourceConfig<TItem = unknown, TCreate = Record<string, unknown>, TUpdate = TCreate> = {
  /** React Query key prefix, e.g. 'produtos' or ['de-para', uf] */
  queryKey: unknown[];
  /** REST base path, e.g. '/produtos' */
  endpoint: string;
  labels?: {
    list?: string;
    create?: string;
    update?: string;
    delete?: string;
    import?: string;
  };
  /** Extra query keys to invalidate on mutations */
  invalidateKeys?: unknown[][];
  /** Bulk import endpoint (FormData field "file"). Omit to disable import. */
  importEndpoint?: string;
  enabled?: boolean;
  /** Optional query string builder for list */
  listUrl?: () => string;
  mapCreate?: (payload: TCreate) => unknown;
  mapUpdate?: (payload: TUpdate) => unknown;
  /** Kept for callers that specialize the list item type */
  _itemType?: TItem;
};

function useInvalidate(queryKey: unknown[], extra: unknown[][] = []) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey });
    for (const key of extra) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useCrudResource<
  TItem = unknown,
  TCreate = Record<string, unknown>,
  TUpdate = TCreate,
>(config: CrudResourceConfig<TItem, TCreate, TUpdate>) {
  const {
    queryKey,
    endpoint,
    labels = {},
    invalidateKeys = [],
    importEndpoint,
    enabled = hasAuthToken(),
    listUrl,
    mapCreate,
    mapUpdate,
  } = config;

  const invalidate = useInvalidate(queryKey, invalidateKeys);

  const listQuery = useQuery({
    queryKey,
    queryFn: () =>
      apiJson<TItem[]>(listUrl?.() ?? endpoint, undefined, labels.list || 'Falha ao carregar dados'),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: (payload: TCreate) =>
      apiJson(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(mapCreate ? mapCreate(payload) : payload),
        },
        labels.create || 'Falha ao criar',
      ),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: Id; data: TUpdate }) =>
      apiJson(
        `${endpoint}/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(mapUpdate ? mapUpdate(data) : data),
        },
        labels.update || 'Falha ao atualizar',
      ),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: Id) => {
      await apiJson(`${endpoint}/${id}`, { method: 'DELETE' }, labels.delete || 'Falha ao deletar');
      return true;
    },
    onSuccess: invalidate,
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!importEndpoint) throw new Error('Importação não configurada');
      const formData = new FormData();
      formData.append('file', file);
      return apiUploadJson(importEndpoint, formData, labels.import || 'Falha ao importar');
    },
    onSuccess: invalidate,
  });

  const pending =
    listQuery.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    importMutation.isPending;

  return {
    query: listQuery,
    items: listQuery.data || [],
    loading: pending,
    error:
      listQuery.error?.message ||
      createMutation.error?.message ||
      updateMutation.error?.message ||
      deleteMutation.error?.message ||
      importMutation.error?.message ||
      null,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    create: createMutation.mutateAsync,
    update: (id: Id, data: TUpdate) => updateMutation.mutateAsync({ id, data }),
    remove: deleteMutation.mutateAsync,
    importFile: importEndpoint ? importMutation.mutateAsync : undefined,
    isImporting: importMutation.isPending,
    createMutation,
    updateMutation,
    deleteMutation,
    importMutation,
  };
}
