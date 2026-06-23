import { useState, useMemo, useEffect } from 'react';
import { Check, Lamp, Lightbulb, Trash2 } from 'lucide-react';
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

interface PautaRevisaoTableProps {
  pendentes: Record<string, unknown>[];
  produtos: Record<string, unknown>[];
  loading: boolean;
  onConfirm: (id: number, fk_produto: number, salvarDePara: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function PautaRevisaoTable({ pendentes, produtos, loading, onConfirm, onDelete }: PautaRevisaoTableProps) {
  const { showConfirm } = useAlert();
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [salvarDePara, setSalvarDePara] = useState<Record<number, boolean>>({});
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    setSelections((prev) => {
      const initialSelections: Record<number, number> = { ...prev };
      for (const p of pendentes) {
        const id = Number(p.id);
        if (initialSelections[id] === undefined) {
          const sugestao = (p.dados_extraidos as any)?.sugestao;
          if (sugestao && sugestao.fk_produto) {
            initialSelections[id] = sugestao.fk_produto;
          }
        }
      }
      return initialSelections;
    });
  }, [pendentes]);

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
    const confirmed = await showConfirm(
      "Tem certeza que deseja excluir este item?",
      "Excluir Item",
      "error"
    );
    if (!confirmed) return;
    try {
      await onDelete(id);
      toast.success("Item excluído da pauta.");
    } catch {
      toast.error("Erro ao excluir o item.");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => calculateColumnSizes([
      {
        accessorKey: 'uf',
        id: 'uf',
        header: 'UF',
        size: 160,
        cell: ({ row }) => String(row.original.uf),
      },
      {
        accessorKey: 'descricao_estado',
        id: 'descricao_estado',
        header: 'Descrição no Estado',
        size: 250,
        cell: ({ row }) => (
          <span
            className="line-clamp-2 text-sm"
            title={String(row.original.descricao_state || row.original.descricao_estado)}
          >
            {String(row.original.descricao_state || row.original.descricao_estado)}
          </span>
        ),
      },
      {
        accessorKey: 'gtin_extraido',
        id: 'gtin_extraido',
        header: 'GTIN',
        size: 140,
        cell: ({ row }) => String(row.original.gtin_extraido || '-'),
      },
      {
        accessorKey: 'valor_pauta',
        id: 'valor_pauta',
        header: 'Valor PMPF',
        size: 110,
        cell: ({ row }) => (row.original.valor_pauta != null ? formatCurrency(row.original.valor_pauta) : '-'),
      },
      {
        id: 'produto',
        header: 'Produto',
        size: 200,
        cell: ({ row }) => {
          const id = Number(row.original.id);
          const sugestao = (row.original.dados_extraidos as any)?.sugestao;
          const hasSugestao = sugestao && sugestao.fk_produto;
          
          return (
            <div className="flex flex-col gap-1 py-1">
              <ProdutoSelector
                produtos={produtos}
                value={selections[id] || null}
                onChange={(val) => setSelections((s) => ({ ...s, [id]: val }))}
                className="w-200"
              />
              {hasSugestao && selections[id] === sugestao.fk_produto && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 select-none">
                  <Lightbulb className='size-3'/> Sugestão IA ({Math.round(sugestao.score * 100)}% similar)
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
          const id = Number(row.original.id);
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
          const id = Number(row.original.id);
          return (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary hover:text-primary/80 transition-colors"
                disabled={!selections[id] || processing === id}
                onClick={() => handleConfirm(id)}
              >
                {processing === id ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive/80 transition-colors"
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
      <div className="overflow-hidden rounded-xl border border-border dark:border-white/15 bg-card shadow-xs flex-1 min-h-0 flex flex-col">
        <TableComponent
          tableId="revisao"
          columns={columns}
          data={pendentes}
          isLoading={loading}
          paginate={true}
          defaultPageSize={20}
          maxHeight="550px"
        />
      </div>
    </div>
  );
}
