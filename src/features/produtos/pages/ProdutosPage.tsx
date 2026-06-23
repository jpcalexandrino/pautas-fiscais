import { useState } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useProduto } from '../context/ProdutoContext';
import { useAlert } from '@/contexts/AlertContext';
import { ProdutoDialog } from '../components/ProdutoDialog';
import { ProdutosTable } from '../components/ProdutosTable';
import { ProdutoImportDialog } from '../components/ProdutoImportDialog';

const emptyForm: Record<string, unknown> = {
  codigo_interno: '',
  gtin_13: '',
  descricao_interna: '',
  embalagem: '',
  conteudo_volume: null,
};

export default function ProdutosPage() {
  const { produtos, loading, createProduto, updateProduto, deleteProduto, importProdutos } = useProduto();
  const { showConfirm } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleOpen = (produto: Record<string, unknown> | null = null) => {
    if (produto) {
      setEditing(produto);
      setFormData({
        codigo_interno: produto.codigo_interno || '',
        gtin_13: produto.gtin_13 || '',
        descricao_interna: produto.descricao_interna || '',
        embalagem: produto.embalagem || '',
        conteudo_volume: produto.conteudo_volume ?? null,
      });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing?.id) {
        await updateProduto(Number(editing.id), formData);
        toast.success('Produto atualizado!');
      } else {
        await createProduto(formData);
        toast.success('Produto criado!');
      }
      setIsOpen(false);
      setFormData(emptyForm);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (produto: Record<string, unknown>) => {
    const ok = await showConfirm('Excluir este produto?', 'Excluir Produto', 'error');
    if (ok && produto.id) {
      setDeletingId(Number(produto.id));
      try {
        await deleteProduto(Number(produto.id));
        toast.success('Produto excluído!');
      } catch {
        toast.error('Erro ao excluir produto');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">Catálogo mestre com código ERP e GTIN.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2 cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Importar Excel
          </Button>
          <Button size="sm" onClick={() => handleOpen()} className="gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>
      <ProdutosTable
        produtos={produtos}
        loading={loading}
        onEdit={handleOpen}
        onDelete={handleDelete}
      />
      <ProdutoDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        editing={editing}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={saving}
      />
      <ProdutoImportDialog
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={importProdutos}
      />
    </div>
  );
}
