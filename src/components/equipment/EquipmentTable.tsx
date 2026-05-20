import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash, Cpu } from 'lucide-react';
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
import { TableColumnFilter } from '../data/TableColumnFilter';
import { Badge } from '@/components/ui/badge';
import { DataPagination } from '@/components/data/DataPagination';

interface EquipmentTableProps {
  equipment: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({ equipment, onEdit, onDelete }) => {
  const [nameFilter, setNameFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSortChange = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key, direction });
  };

  const filteredEquipment = equipment
    .filter(item =>
      (item.name || '').toLowerCase().includes(nameFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.direction || !sortConfig.key) return 0;

      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
      const key = sortConfig.key;

      const valA = a[key];
      const valB = b[key];

      if (valA === valB) return 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * multiplier;
      }

      return String(valA || '').localeCompare(String(valB || '')) * multiplier;
    });

  // Reset to first page when filtering or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredEquipment.length, nameFilter]);

  const totalItems = filteredEquipment.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEquipment = filteredEquipment.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Equipamento"
                    value={nameFilter}
                    onChange={setNameFilter}
                    sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('name', dir)}
                  >
                    Equipamento
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end">
                  <TableColumnFilter
                    columnName="Potência"
                    value=""
                    onChange={() => { }}
                    sortDirection={sortConfig.key === 'power_w' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('power_w', dir)}
                  >
                    Potência (W)
                  </TableColumnFilter>
                </div>
              </TableHead>

              <TableHead className="text-right">
                <div className="flex items-center justify-end">
                  <TableColumnFilter
                    columnName="Horas"
                    value=""
                    onChange={() => { }}
                    sortDirection={sortConfig.key === 'hours_per_day' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('hours_per_day', dir)}
                  >
                    Horas/Dia
                  </TableColumnFilter>
                </div>
              </TableHead>

              <TableHead className="text-right">
                <div className="flex items-center justify-end">
                  <TableColumnFilter
                    columnName="Qtd"
                    value=""
                    onChange={() => { }}
                    sortDirection={sortConfig.key === 'quantity' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('quantity', dir)}
                  >
                    Qtd
                  </TableColumnFilter>
                </div>
              </TableHead>

              <TableHead className="text-right text-muted-foreground">kWh/Dia</TableHead>
              <TableHead className="text-right text-muted-foreground">Consumo Mensal</TableHead>
              <TableHead className="text-right text-muted-foreground">Valor Estimado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEquipment.length > 0 ? (
              paginatedEquipment.map((item) => (
                <TableRow key={item.id} className="group transition-colors hover:bg-muted/50">
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[160px] animate-in fade-in-0 zoom-in-95">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => onDelete(item)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.power_w}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.hours_per_day}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {typeof item.kwh_dia === 'number' ? item.kwh_dia.toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {typeof item.kwh_mes === 'number' ? item.kwh_mes.toFixed(2) : '0.00'} kWh
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {typeof item.valor_estimado === 'number' ? item.valor_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <Cpu className="w-8 h-8 opacity-20 mb-2" />
                    <p className="font-medium">Nenhum equipamento encontrado</p>
                    <p className="text-xs">Tente ajustar seus filtros ou cadastre um novo item.</p>
                  </div>
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
