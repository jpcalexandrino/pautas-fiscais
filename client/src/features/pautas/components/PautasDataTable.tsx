import { useMemo, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import TableComponent from '@/components/Table';
import { type ColumnDef } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';
import { formatCurrency } from '@/shared/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, MoreHorizontal, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useClientTable } from '@/shared/hooks/useClientTable';
import { usePautas } from '../hooks/usePautas';
import { PautaDeleteDialog } from './PautaDeleteDialog';
import type { Pauta } from '@/shared/types';

interface PautasDataTableProps {
  pautas: Pauta[];
  estados: Record<string, unknown>[];
  loading: boolean;
  getTableInstance?: (table: any) => void;
}

export const ALL_COLUMNS = [
  { key: 'contexto', label: 'Tipo de Pauta' },
  { key: 'uf', label: 'UF' },
  { key: 'nome_estado', label: 'Estado' },
  { key: 'descricao_interna', label: 'Descrição' },
  { key: 'codigo_interno', label: 'Código ERP' },
  { key: 'gtin_13', label: 'Código GTIN' },
  { key: 'embalagem', label: 'Embalagem' },
  { key: 'conteudo_volume', label: 'Volume da embalagem' },
  { key: 'valor_pauta', label: 'PMPF' },
  { key: 'data', label: 'Data de vigência' },
  { key: 'arquivo_origem', label: 'Arquivo' },
  { key: 'acoes', label: 'Ações' },
];

export const DEFAULT_COLUMNS = ['contexto', 'uf', 'descricao_interna', 'gtin_13', 'valor_pauta', 'data', 'acoes'];

export function formatDateToBR(dateStr: any): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch {
    return String(dateStr);
  }
}

export function PautasDataTable({ pautas, loading, getTableInstance }: PautasDataTableProps) {
  const { excluirPauta, isExcluindoPauta } = usePautas();
  const [pautaToDelete, setPautaToDelete] = useState<Pauta | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const customFilterHandlers = useMemo(() => ({
    uf: (item: Pauta, searchValue: string) => {
      const ufStr = `${item.uf || ''} - ${item.nome_estado || ''}`;
      return ufStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(searchValue);
    },
    valor_pauta: (item: Pauta, searchValue: string) => {
      const formatted = item.valor_pauta != null ? formatCurrency(Number(item.valor_pauta)) : '';
      return formatted.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(searchValue);
    },
    data: (item: Pauta, searchValue: string) => {
      const formatted = formatDateToBR(item.data);
      return formatted.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(searchValue);
    }
  }), []);

  const {
    tableState,
    paginatedData,
    onPaginationChange,
    onColumnFiltersChange,
    paginationProps,
  } = useClientTable<Pauta>({
    data: pautas,
    defaultPageSize: 20,
    customFilterHandlers,
    storageKey: 'table_state_pautas',
  });

  const columns = useMemo<ColumnDef<Pauta>[]>(
    () => calculateColumnSizes([
      {
        accessorKey: 'contexto',
        id: 'contexto',
        header: 'Tipo de Pauta',
        size: 130,
        cell: ({ row }) => {
          const value = row.original.contexto;
          if (value === 'terceiros') {
            return (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5">
                Terceiro
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5">
              Próprio
            </Badge>
          );
        },
      },
      {
        accessorFn: (row) => `${row.uf || ''} - ${row.nome_estado || ''}`,
        id: 'uf',
        header: 'UF - Estado',
        size: 150,
        cell: ({ row }) => (
          <span>
            {String(row.original.uf || '')} - {String(row.original.nome_estado || '')}
          </span>
        ),
      },
      {
        accessorKey: 'gtin_13',
        id: 'gtin_13',
        header: 'Código GTIN',
        size: 140,
        cell: ({ row }) => String(row.original.gtin_13 || '-'),
      },
      {
        accessorKey: 'codigo_interno',
        id: 'codigo_interno',
        header: 'Código ERP',
        size: 120,
        cell: ({ row }) => String(row.original.codigo_interno || '-'),
      },
      {
        accessorKey: 'descricao_interna',
        id: 'descricao_interna',
        header: 'Descrição',
        size: 250,
        cell: ({ row }) => (
          <span
            className="truncate block"
            title={String(row.original.descricao_interna)}
          >
            {String(row.original.descricao_interna)}
          </span>
        ),
      },
      {
        accessorKey: 'embalagem',
        id: 'embalagem',
        header: 'Embalagem',
        size: 120,
        cell: ({ row }) => String(row.original.embalagem || '-'),
      },
      {
        accessorKey: 'conteudo_volume',
        id: 'conteudo_volume',
        header: 'Volume da Embalagem',
        size: 150,
        cell: ({ row }) => (row.original.conteudo_volume != null ? String(row.original.conteudo_volume) : '-'),
      },
      {
        accessorFn: (row) => (row.valor_pauta != null ? formatCurrency(row.valor_pauta) : '-'),
        id: 'valor_pauta',
        header: 'PMPF',
        size: 110,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorFn: (row) => formatDateToBR(row.data),
        id: 'data',
        header: 'Data de Vigência',
        size: 140,
        cell: ({ row }) => formatDateToBR(row.original.data),
      },
      {
        accessorKey: 'arquivo_origem',
        id: 'arquivo_origem',
        header: 'Arquivo',
        size: 260,
        cell: ({ row }) => {
          const filename = row.original.arquivo_origem;
          if (!filename) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }
          return (
            <div
              className="inline-flex items-center gap-2 max-w-[250px] px-2.5 py-1 rounded-xl bg-red-500/[0.06] dark:bg-red-500/[0.1] border border-red-500/20 text-xs font-medium text-foreground hover:bg-red-500/[0.12] transition-all group cursor-default"
              title={filename}
            >
              <div className="p-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="truncate text-[11px] font-semibold text-foreground/90 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                {filename}
              </span>
            </div>
          );
        },
      },
      {
        id: 'acoes',
        header: 'Ações',
        size: 70,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive font-medium cursor-pointer flex items-center gap-2"
                onClick={() => {
                  setPautaToDelete(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Excluir Pauta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ], pautas),
    [pautas]
  );

  const handleConfirmDelete = async ({ id, justificativa, apagarDePara }: { id: string; justificativa: string; apagarDePara: boolean }) => {
    try {
      const res = await excluirPauta({ id, justificativa, apagarDePara });
      toast.success('Pauta excluída com sucesso!', {
        description: res?.totalExcluidas && res.totalExcluidas > 1
          ? `${res.totalExcluidas} pautas vinculadas foram excluídas e a linha foi liberada no OCR.`
          : 'A pauta foi excluída e a linha foi liberada para nova carga no OCR.',
      });
    } catch (err: any) {
      toast.error('Erro ao excluir pauta', {
        description: err.message || 'Falha ao processar a exclusão.',
      });
      throw err;
    }
  };

  if (loading && pautas.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!loading && pautas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-sidebar/20">
        Nenhuma pauta encontrada.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 relative">
      {loading && pautas.length > 0 && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-xl">
          <Spinner className="w-8 h-8" />
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-border dark:border-white/15 flex flex-1 flex-col bg-card">
        <TableComponent
          className="max-h-[700px]"
          columns={columns}
          data={paginatedData}
          getTableInstance={getTableInstance}
          tableState={tableState}
          onPaginationChange={onPaginationChange}
          onColumnFiltersChange={onColumnFiltersChange}
          pagination={paginationProps}
        />
      </div>

      <PautaDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        pauta={pautaToDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isExcluindoPauta}
      />
    </div>
  );
}

