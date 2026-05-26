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

interface ClientsTableProps {
  clients: any[];
  onEdit: (client: any) => void;
  onDelete: (client: any) => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, onEdit, onDelete }) => {
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

  return (
    <div className="flex flex-col">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12.5"></TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Código"
                    value={filters.uc}
                    onChange={(v) => handleFilterChange('uc', v)}
                    sortDirection={sortConfig.key === 'uc' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('uc', dir)}
                  >
                    Código (UC)
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Nome"
                    value={filters.name}
                    onChange={(v) => handleFilterChange('name', v)}
                    sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('name', dir)}
                  >
                    Nome / Descrição
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Documento"
                    value={filters.cnpj}
                    onChange={(v) => handleFilterChange('cnpj', v)}
                    sortDirection={sortConfig.key === 'cnpj' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('cnpj', dir)}
                  >
                    CPF/CNPJ
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Distribuidora"
                    value={filters.distributor}
                    onChange={(v) => handleFilterChange('distributor', v)}
                    sortDirection={sortConfig.key === 'distributor' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('distributor', dir)}
                  >
                    Distribuidora
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Localização"
                    value={filters.location}
                    onChange={(v) => handleFilterChange('location', v)}
                    sortDirection={sortConfig.key === 'location' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('location', dir)}
                  >
                    Localização
                  </TableColumnFilter>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.length > 0 ? (
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
                  <TableCell>{client.uc_number}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.cnpj}</TableCell>
                  <TableCell>{client.distributor}</TableCell>
                  <TableCell>{`${client.city || ''} - ${client.uf || ''}`}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
