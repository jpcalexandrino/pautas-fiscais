import { useState } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useDePara } from '../hooks/useDePara';
import { useEstados } from '@features/pautas/hooks/usePautas';
import { useProduto } from '@features/produtos/context/ProdutoContext';
import { useAlert } from '@/contexts/AlertContext';
import { DeParaDialog } from '../components/DeParaDialog';
import { DeParaTable } from '../components/DeParaTable';
import { DeParaImportDialog } from '../components/DeParaImportDialog';

const emptyForm: Record<string, unknown> = {
  uf: '',
  termo_descricao_estado: '',
  gtin_estado: '',
  fk_produto: null,
};

export default function DeParaPage() {
  const [selectedUf, setSelectedUf] = useState<string>('');
  const { data: estados = [] } = useEstados();
  const { produtos } = useProduto();
  const { items, loading, createDePara, updateDePara, deleteDePara, bulkImportDePara } = useDePara(selectedUf || undefined);
  const { showConfirm } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...emptyForm, uf: selectedUf });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleOpen = (item: Record<string, unknown> | null = null) => {
    if (item) {
      setEditing(item);
      setFormData({
        uf: item.uf as string,
        termo_descricao_estado: item.termo_descricao_estado as string,
        gtin_estado: (item.gtin_estado as string) || '',
        fk_produto: item.fk_produto as number | null,
      });
    } else {
      setEditing(null);
      setFormData({ ...emptyForm, uf: selectedUf });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing?.id) {
        await updateDePara(Number(editing.id), formData);
        toast.success('De-Para atualizado!');
      } else {
        await createDePara(formData);
        toast.success('De-Para criado!');
      }
      setIsOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Record<string, unknown>) => {
    const ok = await showConfirm('Excluir este De-Para?', 'Excluir De-Para', 'error');
    if (ok && item.id) {
      setDeletingId(Number(item.id));
      try {
        await deleteDePara(Number(item.id));
        toast.success('De-Para excluído!');
      } catch {
        toast.error('Erro ao excluir');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">De-Para por Estado</h1>
          <p className="text-sm text-muted-foreground">Mapeamento de descrições variantes por UF.</p>
        </div>
        <div className="flex items-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Importar Excel
          </Button>
          <Button size="sm" onClick={() => handleOpen()} className="gap-2">
            <Plus className="w-4 h-4" /> Novo De-Para
          </Button>
        </div>
      </div>
      <DeParaTable
        items={items}
        loading={loading}
        onEdit={handleOpen}
        onDelete={handleDelete}
      />
      <DeParaDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        editing={editing}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={saving}
        estados={estados}
        produtos={produtos}
      />
      <DeParaImportDialog
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={bulkImportDePara}
      />
    </div>
  );
}
