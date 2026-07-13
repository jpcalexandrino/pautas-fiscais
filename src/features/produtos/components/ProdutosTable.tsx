import { useMemo, useState } from 'react';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import TableComponent from '@/components/Table';
import { type ColumnDef, type TableState } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';

interface ProdutosTableProps {
  produtos: Record<string, unknown>[];
  onEdit: (p: Record<string, unknown>) => void;
  onDelete: (p: Record<string, unknown>) => void;
  loading: boolean;
  deletingId?: number | null; // <- adicionamos aqui
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
  const [tableState, setTableState] = useState<Partial<TableState>>({
    pagination: {
      pageIndex: 0,
      pageSize: 20,
    },
    columnFilters: [],
  });

  const filteredData = useMemo(() => {
    let result = produtos;
    const filters = tableState.columnFilters || [];
    for (const filter of filters) {
      const { id, value } = filter;
      if (value === undefined || value === null || value === '') continue;
      const search = String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      result = result.filter((item) => {
        const itemVal = item[id];
        if (itemVal === undefined || itemVal === null) return false;
        return String(itemVal).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(search);
      });
    }
    return result;
  }, [produtos, tableState.columnFilters]);

  const paginatedData = useMemo(() => {
    const pageIndex = tableState.pagination?.pageIndex ?? 0;
    const pageSize = tableState.pagination?.pageSize ?? 20;
    const start = pageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, tableState.pagination]);

  const columns = useMemo<ColumnDef<any>[]>(
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
          onPaginationChange={(updater: any) => {
            setTableState((prev) => {
              const current = prev.pagination ?? { pageIndex: 0, pageSize: 20 };
              const next = typeof updater === 'function' ? updater(current) : updater;
              return {
                ...prev,
                pagination: next,
              };
            });
          }}
          onColumnFiltersChange={(updater: any) => {
            setTableState((prev) => {
              const current = prev.columnFilters ?? [];
              const next = typeof updater === 'function' ? updater(current) : updater;
              return {
                ...prev,
                columnFilters: next,
                pagination: prev.pagination ? { ...prev.pagination, pageIndex: 0 } : undefined,
              };
            });
          }}
          pagination={{
            totalItems: filteredData.length,
            totalPages: Math.ceil(filteredData.length / (tableState.pagination?.pageSize ?? 20)),
            pageSize: tableState.pagination?.pageSize ?? 20,
          }}
        />
      </div>
    </div>
  );
}
