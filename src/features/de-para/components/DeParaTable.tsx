import { useMemo } from 'react';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import TableComponent from '@/components/Table';
import { type ColumnDef } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';

interface DeParaTableProps {
  items: Record<string, unknown>[];
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (item: Record<string, unknown>) => void;
  loading: boolean;
}

export const ALL_COLUMNS = [
  { key: 'uf', label: 'UF' },
  { key: 'nome_estado', label: 'Estado' },
  { key: 'termo_descricao_estado', label: 'Termo no Estado' },
  { key: 'gtin_estado', label: 'GTIN Estado' },
  { key: 'produto_descricao', label: 'Produto Interno' },
  { key: 'produto_gtin', label: 'GTIN do Produto' },
  { key: 'produto_codigo', label: 'Código ERP do Produto' }
];

export const DEFAULT_COLUMNS = ['uf', 'termo_descricao_estado', 'gtin_estado', 'produto_descricao'];

export function DeParaTable({ items, onEdit, onDelete, loading }: DeParaTableProps) {
  
  const columns = useMemo<ColumnDef<any>[]>(
    () => calculateColumnSizes([
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        enableColumnFilter: false,
        size: 100,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original)}>
                <Trash className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
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
        accessorKey: 'termo_descricao_estado',
        id: 'termo_descricao_estado',
        header: 'Termo no Estado',
        size: 250,
        cell: ({ row }) => 
            String(row.original.termo_descricao_estado || '-'),
      },
      {
        accessorKey: 'gtin_estado',
        id: 'gtin_estado',
        header: 'GTIN Estado',
        size: 140,
        cell: ({ row }) => String(row.original.gtin_estado || '-'),
      },
      {
        accessorKey: 'produto_descricao',
        id: 'produto_descricao',
        header: 'Produto Interno',
        size: 250,
        cell: ({ row }) => String(row.original.produto_descricao || '-'),
      },
      {
        accessorKey: 'produto_gtin',
        id: 'produto_gtin',
        header: 'GTIN do Produto',
        size: 140,
        cell: ({ row }) => String(row.original.produto_gtin || '-'),
      },
      {
        accessorKey: 'produto_codigo',
        id: 'produto_codigo',
        header: 'Código ERP do Produto',
        size: 150,
        cell: ({ row }) => String(row.original.produto_codigo || '-'),
      },
    ], items),
    [onEdit, onDelete, items]
  );



  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="overflow-hidden rounded-lg border border-border dark:border-white/15 bg-card shadow-xs flex-1 min-h-0 flex flex-col">
        <TableComponent
          tableId="depara"
          columns={columns}
          data={items}
          isLoading={loading}
          paginate={true}
          defaultPageSize={20}
          maxHeight="550px"
        />
      </div>
    </div>
  );
}
