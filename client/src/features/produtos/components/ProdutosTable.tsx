import { useMemo } from 'react';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import TableComponent from '@/components/Table';
import { type ColumnDef } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';
import { useClientTable } from '@/shared/hooks/useClientTable';
import type { Produto } from '@/shared/types';

interface ProdutosTableProps {
  produtos: Produto[];
  onEdit: (p: Produto) => void;
  onDelete: (p: Produto) => void;
  loading: boolean;
  deletingId?: number | null;
}

export const ALL_COLUMNS = [
  { key: 'codigo_interno', label: 'Código ERP' },
  { key: 'gtin_13', label: 'GTIN' },
  { key: 'descricao_interna', label: 'Descrição' },
  { key: 'embalagem', label: 'Embalagem' },
  { key: 'conteudo_volume', label: 'Volume' },
  { key: 'tipo', label: 'Tipo' }
];

export const DEFAULT_COLUMNS = ['codigo_interno', 'gtin_13', 'descricao_interna', 'embalagem', 'conteudo_volume', 'tipo'];

export function ProdutosTable({ produtos, onEdit, onDelete, loading, deletingId }: ProdutosTableProps) {
  const {
    tableState,
    paginatedData,
    onPaginationChange,
    onColumnFiltersChange,
    paginationProps,
  } = useClientTable<Produto>({
    data: produtos,
    defaultPageSize: 20,
    storageKey: 'table_state_produtos',
  });

  const columns = useMemo<ColumnDef<Produto>[]>(
    () =>
      calculateColumnSizes(
        [
          {
            id: 'actions',
            header: 'Ações',
            enableSorting: false,
            enableColumnFilter: false,
            size: 120,
            cell: ({ row }) => {
              const isDeleting = deletingId === Number(row.original.id);
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-50 hover:opacity-100 transition-opacity"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Spinner className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onEdit(row.original)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(row.original)}
                      disabled={isDeleting}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
          },
          {
            accessorKey: 'codigo_interno',
            id: 'codigo_interno',
            header: 'Código ERP',
            size: 120,
            cell: ({ row }) => String(row.original.codigo_interno || '-'),
          },
          {
            accessorKey: 'gtin_13',
            id: 'gtin_13',
            header: 'GTIN',
            size: 140,
            cell: ({ row }) => String(row.original.gtin_13 || '-'),
          },
          {
            accessorKey: 'descricao_interna',
            id: 'descricao_interna',
            header: 'Descrição',
            size: 300,
            cell: ({ row }) => String(row.original.descricao_interna || '-'),
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
            header: 'Volume',
            size: 100,
            cell: ({ row }) =>
              row.original.conteudo_volume != null ? String(row.original.conteudo_volume) : '-',
          },
          {
            accessorKey: 'tipo',
            id: 'tipo',
            header: 'Tipo',
            size: 110,
            cell: ({ row }) => {
              const val = row.original.tipo || 'proprio';
              return val === 'terceiros' ? (
                <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 ring-1 ring-inset ring-amber-600/20">
                  Terceiros
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20">
                  Próprio
                </span>
              );
            }
          },
        ],
        produtos
      ),
    [onEdit, onDelete, produtos, deletingId]
  );

  if (loading && produtos.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!loading && produtos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-sidebar/20">
        Nenhum produto cadastrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20 rounded-lg">
          <Spinner className="w-8 h-8" />
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border dark:border-white/15 bg-card shadow-xs flex-1 min-h-0 flex flex-col">
        <TableComponent
          className="max-h-[700px]"
          columns={columns}
          data={paginatedData}
          tableState={tableState}
          onPaginationChange={onPaginationChange}
          onColumnFiltersChange={onColumnFiltersChange}
          pagination={paginationProps}
        />
      </div>
    </div>
  );
}

