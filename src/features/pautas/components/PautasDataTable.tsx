import { useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import TableComponent from '@/components/Table';
import { type ColumnDef } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';
import { formatCurrency } from '@/shared/utils/formatters';

interface PautasDataTableProps {
  pautas: Record<string, unknown>[];
  estados: Record<string, unknown>[];
  loading: boolean;
  getTableInstance?: (table: any) => void;
}

export const ALL_COLUMNS = [
  { key: 'uf', label: 'UF' },
  { key: 'nome_estado', label: 'Estado' },
  { key: 'descricao_interna', label: 'Produto' },
  { key: 'codigo_interno', label: 'Código ERP' },
  { key: 'gtin_13', label: 'GTIN' },
  { key: 'embalagem', label: 'Embalagem' },
  { key: 'conteudo_volume', label: 'Volume' },
  { key: 'valor_pauta', label: 'PMPF' },
  { key: 'data', label: 'Data' },
  { key: 'arquivo_origem', label: 'Arquivo' }
];

export const DEFAULT_COLUMNS = ['uf', 'descricao_interna', 'gtin_13', 'valor_pauta', 'data'];

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
  const columns = useMemo<ColumnDef<any>[]>(
    () => calculateColumnSizes([
      {
        accessorKey: 'uf',
        id: 'uf',
        header: 'UF - Estado',
        size: 150,
        cell: ({ row }) => (
          <span className="font-medium">
            {String(row.original.uf)} - {String(row.original.nome_estado)}
          </span>
        ),
      },
      {
        accessorKey: 'descricao_interna',
        id: 'descricao_interna',
        header: 'Produto',
        size: 250,
        cell: ({ row }) => (
          <span
            className="max-w-xs truncate block"
            title={String(row.original.descricao_interna)}
          >
            {String(row.original.descricao_interna)}
          </span>
        ),
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
        cell: ({ row }) => (row.original.conteudo_volume != null ? String(row.original.conteudo_volume) : '-'),
      },
      {
        accessorKey: 'valor_pauta',
        id: 'valor_pauta',
        header: 'PMPF',
        size: 110,
        cell: ({ row }) => (row.original.valor_pauta != null ? formatCurrency(row.original.valor_pauta) : '-'),
      },
      {
        accessorKey: 'data',
        id: 'data',
        header: 'Data',
        size: 120,
        cell: ({ row }) => formatDateToBR(row.original.data),
      },
      {
        accessorKey: 'arquivo_origem',
        id: 'arquivo_origem',
        header: 'Arquivo',
        size: 250,
        cell: ({ row }) => (
          <span
            className="max-w-xs truncate block"
            title={String(row.original.arquivo_origem || '')}
          >
            {String(row.original.arquivo_origem || '-')}
          </span>
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
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <Spinner className="w-8 h-8" />
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-border dark:border-white/15 flex flex-1 flex-col bg-card">
        <TableComponent
          tableId="pautas"
          columns={columns}
          data={pautas}
          isLoading={loading}
          paginate={true}
          defaultPageSize={20}
          getTableInstance={getTableInstance}
          maxHeight="550px"
        />
      </div>
    </div>
  );
}
