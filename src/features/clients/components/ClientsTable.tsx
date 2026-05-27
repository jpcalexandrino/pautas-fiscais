import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TableColumnFilter } from '@features/data/components/TableColumnFilter';
import { DataPagination } from '@features/data/components/DataPagination';
import { Spinner } from '@/components/ui/spinner';

interface ClientsTableProps {
  clients: any[];
  onEdit: (client: any) => void;
  onDelete: (client: any) => void;
  loading: boolean;
  visibleColumns: string[];
}

export const ALL_COLUMNS = [
  { key: 'uc_number', label: 'Código (UC)' },
  { key: 'name', label: 'Nome / Descrição' },
  { key: 'cnpj', label: 'CPF/CNPJ' },
  { key: 'distributor', label: 'Distribuidora' },
  { key: 'location', label: 'Localização' }
];

const COLUMN_CONFIG: Record<string, { label: string; columnName: string; filterKey: string }> = {
  uc_number: { label: 'Código (UC)', columnName: 'Código', filterKey: 'uc' },
  name: { label: 'Nome / Descrição', columnName: 'Nome', filterKey: 'name' },
  cnpj: { label: 'CPF/CNPJ', columnName: 'Documento', filterKey: 'cnpj' },
  distributor: { label: 'Distribuidora', columnName: 'Distribuidora', filterKey: 'distributor' },
  location: { label: 'Localização', columnName: 'Localização', filterKey: 'location' }
};

export const DEFAULT_COLUMNS = ['uc_number', 'name', 'cnpj', 'distributor', 'location'];

export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, onEdit, onDelete, loading, visibleColumns }) => {
  const [filters, setFilters] = useState<Record<string, string>>({
    uc: '',
    name: '',
    cnpj: '',
    distributor: '',
    location: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key, direction });
  };

  const filteredClients = clients
    .filter(client => {
      const ucMatch = (client.uc_number || '').toLowerCase().includes(filters.uc.toLowerCase());
      const nameMatch = (client.name || '').toLowerCase().includes(filters.name.toLowerCase());
      const cnpjMatch = (client.cnpj || '').toLowerCase().includes(filters.cnpj.toLowerCase());
      const distributorMatch = (client.distributor || '').toLowerCase().includes(filters.distributor.toLowerCase());
      const locationStr = `${client.city || ''} - ${client.uf || ''}`;
      const locationMatch = locationStr.toLowerCase().includes(filters.location.toLowerCase());

      return ucMatch && nameMatch && cnpjMatch && distributorMatch && locationMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.direction || !sortConfig.key) return 0;

      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
      const key = sortConfig.key;

      let valA, valB;

      if (key === 'location') {
        valA = `${a.city || ''} - ${a.uf || ''}`;
        valB = `${b.city || ''} - ${b.uf || ''}`;
      } else if (key === 'uc') {
        valA = a.uc_number || '';
        valB = b.uc_number || '';
      } else {
        valA = a[key] || '';
        valB = b[key] || '';
      }

      return String(valA).localeCompare(String(valB)) * multiplier;
    });

  // Reset to first page when filtering or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredClients.length, filters]);

  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize);

  // Filter ALL_COLUMNS to preserve original order
  const columnsToRender = ALL_COLUMNS.filter(col => visibleColumns.includes(col.key));

  return (
    <div className="flex flex-col">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12.5"></TableHead>
              {columnsToRender.map((col) => {
                const config = COLUMN_CONFIG[col.key];
                return (
                  <TableHead key={col.key}>
                    <div className="flex items-center">
                      <TableColumnFilter
                        columnName={config.columnName}
                        value={filters[config.filterKey]}
                        onChange={(v) => handleFilterChange(config.filterKey, v)}
                        sortDirection={sortConfig.key === config.filterKey ? sortConfig.direction : null}
                        onSort={(dir) => handleSortChange(config.filterKey, dir)}
                      >
                        {config.label}
                      </TableColumnFilter>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow key="loading-row">
                <TableCell colSpan={columnsToRender.length + 1} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Spinner className="w-8 h-8" />
                    <span className="text-sm text-muted-foreground">Carregando clientes...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedClients.length > 0 ? (
              paginatedClients.map((client) => (
                <TableRow key={client.id} className="group transition-colors hover:bg-muted/50">
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => onDelete(client)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  {columnsToRender.map((col) => {
                    if (col.key === 'uc_number') {
                      return <TableCell key={col.key}>{client.uc_number}</TableCell>;
                    }
                    if (col.key === 'name') {
                      return <TableCell key={col.key}>{client.name}</TableCell>;
                    }
                    if (col.key === 'cnpj') {
                      return <TableCell key={col.key}>{client.cnpj}</TableCell>;
                    }
                    if (col.key === 'distributor') {
                      return <TableCell key={col.key}>{client.distributor}</TableCell>;
                    }
                    if (col.key === 'location') {
                      return <TableCell key={col.key}>{`${client.city || ''} - ${client.uf || ''}`}</TableCell>;
                    }
                    return null;
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnsToRender.length + 1} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {totalItems > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRows={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
};
