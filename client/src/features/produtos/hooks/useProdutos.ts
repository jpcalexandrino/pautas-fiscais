import { useCrudResource } from '@/shared/hooks/useCrudResource';
import type { Produto } from '@/shared/types';

export function useProdutos() {
  const crud = useCrudResource<Produto>({
    queryKey: ['produtos'],
    endpoint: '/produtos',
    importEndpoint: '/produtos/bulk',
    labels: {
      list: 'Falha ao carregar produtos',
      create: 'Falha ao criar produto',
      update: 'Falha ao atualizar produto',
      delete: 'Falha ao deletar produto',
      import: 'Falha ao importar produtos',
    },
  });

  return {
    loading: crud.loading,
    produtos: crud.items,
    createProduto: crud.create,
    updateProduto: crud.update,
    deleteProduto: crud.remove,
    importProdutos: crud.importFile!,
    isImporting: crud.isImporting,
    refetch: crud.refetch,
  };
}
