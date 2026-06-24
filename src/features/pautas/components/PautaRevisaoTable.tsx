import { useState, useMemo } from 'react';
import { Check, Lightbulb, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ProdutoSelector } from '@/features/produtos/components/ProdutoSelector';
import { formatCurrency } from '@/shared/utils/formatters';
import TableComponent from '@/components/Table';
import { type ColumnDef } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';
import { toast } from 'sonner';
import { useAlert } from '@/contexts/AlertContext';

interface PendentesItem {
  id: number;
  uf: string;
  descricao_estado: string;
  descricao_state?: string;
  gtin_extraido?: string;
  valor_pauta?: number;
  dados_extraidos?: { sugestao?: { fk_produto: number; score: number } };
}

interface Produto {
  id: number;
  descricao_interna: string;
  codigo_interno?: string;
}

interface PautaRevisaoTableProps {
  pendentes: PendentesItem[];
  produtos: Produto[];
  loading: boolean;
  onConfirm: (id: number, fk_produto: number, salvarDePara: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function PautaRevisaoTable({ pendentes, produtos, loading, onConfirm, onDelete }: PautaRevisaoTableProps) {
  const { showConfirm } = useAlert();
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [salvarDePara, setSalvarDePara] = useState<Record<number, boolean>>({});
  const [processing, setProcessing] = useState<number | null>(null);

  const handleConfirm = async (id: number) => {
    const fk = selections[id];
    if (!fk) return;
    setProcessing(id);
    try {
      await onConfirm(id, fk, salvarDePara[id] ?? true);
      setSelections((s) => { const n = { ...s }; delete n[id]; return n; });
      toast.success("Produto confirmado com sucesso!");
    } catch {
      toast.error("Erro ao confirmar o vínculo.");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("Tem certeza que deseja excluir este item?", "Excluir Item", "error");
    if (!confirmed) return;
    try {
      await onDelete(id);
      toast.success("Item excluído da pauta.");
    } catch {
      toast.error("Erro ao excluir o item.");
    }
  };

  const columns = useMemo<ColumnDef<PendentesItem>[]>(
    () => calculateColumnSizes([
      { accessorKey: 'uf', header: 'UF', size: 160 },
      {
        accessorKey: 'descricao_estado',
        header: 'Descrição no Estado',
        size: 250,
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm" title={row.original.descricao_state || row.original.descricao_estado}>
            {row.original.descricao_state || row.original.descricao_estado}
          </span>
        ),
      },
      { accessorKey: 'gtin_extraido', header: 'GTIN', size: 140, cell: ({ row }) => row.original.gtin_extraido || '-' },
      { accessorKey: 'valor_pauta', header: 'Valor PMPF', size: 110, cell: ({ row }) => row.original.valor_pauta != null ? formatCurrency(row.original.valor_pauta) : '-' },
      {
        id: 'produto',
        header: 'Produto',
        size: 200,
        cell: ({ row }) => {
          const id = row.original.id;
          const sugestao = row.original.dados_extraidos?.sugestao;
          const hasSugestao = sugestao?.fk_produto;

          return (
            <div className="flex flex-col gap-1 py-1 w-full">
              <ProdutoSelector
                produtos={produtos}
                value={selections[id] || null}
                onChange={(val) => setSelections((s) => ({ ...s, [id]: val }))}
              />
              {hasSugestao && selections[id] === sugestao.fk_produto && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Lightbulb className="size-3" /> Sugestão IA ({Math.round(sugestao.score * 100)}% similar)
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'salvarDePara',
        header: 'Salvar vínculo',
        size: 160,
        cell: ({ row }) => {
          const id = row.original.id;
          return (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`depara-${id}`}
                checked={salvarDePara[id] ?? true}
                onCheckedChange={(c) => setSalvarDePara((s) => ({ ...s, [id]: !!c }))}
              />
              <Label htmlFor={`depara-${id}`} className="text-xs">Salvar</Label>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        size: 100,
        cell: ({ row }) => {
          const id = row.original.id;
          const isProcessing = processing === id;
          return (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary"
                disabled={!selections[id] || isProcessing}
                onClick={() => handleConfirm(id)}
              >
                {isProcessing ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                disabled={isProcessing}
                onClick={() => handleDelete(id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ], pendentes),
    [produtos, selections, salvarDePara, processing, onDelete, pendentes]
  );

  if (loading && pendentes.length === 0) {
    return <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>;
  }

  if (pendentes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-sidebar/20">
        Nenhum item pendente de revisão.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs flex-1 min-h-0 flex flex-col">
        <TableComponent
          tableId="revisao"
          columns={columns}
          data={pendentes}
          isLoading={loading}
          paginate
          defaultPageSize={20}
          maxHeight="550px"
        />
      </div>
    </div>
  );
}
