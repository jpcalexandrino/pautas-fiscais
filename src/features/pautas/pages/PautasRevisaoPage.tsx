import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { usePautas } from '../hooks/usePautas';
import { useProduto } from '@features/produtos/context/ProdutoContext';
import { PautaRevisaoTable } from '../components/PautaRevisaoTable';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useAlert } from '@/contexts/AlertContext';
import { useState } from 'react';

export default function PautasRevisaoPage() {
  const { pendentes, loading, confirmPendente, deletePendente, deleteAllPendentes } = usePautas();
  const { produtos } = useProduto();
  const { showConfirm } = useAlert();
  const [deletingAll, setDeletingAll] = useState(false);

  const handleConfirm = async (id: number, fk_produto: number, salvarDePara: boolean) => {
    const toastId = toast.loading('Confirmando item...');
    try {
      await confirmPendente({ id, fk_produto, salvar_de_para: salvarDePara });
      toast.success('Item confirmado e inserido na pauta', { id: toastId });
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao confirmar item', { id: toastId });
    }
  };

  const handleDelete = async (id: number) => {
    const toastId = toast.loading('Removendo item...');
    try {
      await deletePendente(id);
      toast.success('Item removido', { id: toastId });
    } catch {
      toast.error('Erro ao remover item', { id: toastId });
    }
  };

  const handleDeleteAll = async () => {
    const confirm = await showConfirm(
      'Tem certeza que deseja remover todos os itens pendentes? Esta ação não pode ser desfeita.',
      'Remover todos os itens',
      'error'
    );
    if (!confirm) return;

    setDeletingAll(true);
    const toastId = toast.loading('Removendo todos os itens...');
    try {
      await deleteAllPendentes();
      toast.success('Todos os itens foram removidos', { id: toastId });
    } catch {
      toast.error('Erro ao remover itens', { id: toastId });
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revisão Pendente</h1>
          <p className="text-sm text-muted-foreground">
            Itens que a IA não conseguiu associar automaticamente via GTIN ou De-Para.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendentes.length > 0 && (
            <>
              <Badge className="px-2.5 py-0.5 text-xs font-semibold rounded-full tracking-wide border border-amber-200/80 bg-amber-50 text-amber-700 transition-colors dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 shadow-sm shadow-amber-500/5">
                {pendentes.length} pendente(s)
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
                className="gap-2"
                disabled={deletingAll}
              >
                {deletingAll ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Removendo...
                  </span>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remover Todos
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      <PautaRevisaoTable
        pendentes={pendentes}
        produtos={produtos}
        loading={loading}
        onConfirm={handleConfirm}
        onDelete={handleDelete}
      />
    </div>
  );
}
