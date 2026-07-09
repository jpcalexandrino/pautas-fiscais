import { useMemo, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import TableComponent from '@/components/Table';
import { type ColumnDef, type TableState } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';
import { formatCurrency } from '@/shared/utils/formatters';
import { Badge } from '@/components/ui/badge';

interface PautasDataTableProps {
  pautas: Record<string, unknown>[];
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
  { key: 'arquivo_origem', label: 'Arquivo' }
];

export const DEFAULT_COLUMNS = ['contexto', 'uf', 'descricao_interna', 'gtin_13', 'valor_pauta', 'data'];

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
  const [tableState, setTableState] = useState<Partial<TableState>>({
    pagination: {
      pageIndex: 0,
      pageSize: 20,
    },
  });

  const paginatedData = useMemo(() => {
    const pageIndex = tableState.pagination?.pageIndex ?? 0;
    const pageSize = tableState.pagination?.pageSize ?? 20;
    const start = pageIndex * pageSize;
    return pautas.slice(start, start + pageSize);
  }, [pautas, tableState.pagination]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => calculateColumnSizes([
      {
        accessorKey: 'contexto',
        id: 'contexto',
        header: 'Tipo de Pauta',
        size: 130,
        cell: ({ row }) => {
          const value = row.original.contexto;
          if (value === 'terceiros' || value === 'terceiro') {
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
        size: 250,
        cell: ({ row }) => (
            <Badge variant="outline" className="gap-1 border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 font-semibold px-2 py-0.5">
              {String(row.original.arquivo_origem || '-')}
            </Badge>
        ),
      },
    ], pautas),
    [pautas]
  );

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
          className="max-h-[550px]"
          columns={columns}
          data={paginatedData}
          getTableInstance={getTableInstance}
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
          pagination={{
            totalItems: pautas.length,
            totalPages: Math.ceil(pautas.length / (tableState.pagination?.pageSize ?? 20)),
            pageSize: tableState.pagination?.pageSize ?? 20,
          }}
        />
      </div>
    </div>
  );
}
