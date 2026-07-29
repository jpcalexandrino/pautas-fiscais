import { useCrudResource } from '@/shared/hooks/useCrudResource';
import type { DePara } from '@/shared/types';

export function useDePara(uf?: string) {
  const crud = useCrudResource<DePara>({
    queryKey: ['de-para', uf || 'all'],
    endpoint: '/de-para',
    listUrl: () => (uf ? `/de-para?uf=${uf}` : '/de-para'),
    importEndpoint: '/de-para/bulk',
    invalidateKeys: [['de-para'], ['audit-logs']],
    labels: {
      list: 'Falha ao carregar De-Para',
      create: 'Falha ao criar De-Para',
      update: 'Falha ao atualizar De-Para',
      delete: 'Falha ao deletar De-Para',
      import: 'Falha ao importar planilha',
    },
  });

  return {
    loading: crud.loading,
    items: crud.items,
    createDePara: crud.create,
    updateDePara: crud.update,
    deleteDePara: crud.remove,
    bulkImportDePara: crud.importFile!,
    refetch: crud.refetch,
  };
}
