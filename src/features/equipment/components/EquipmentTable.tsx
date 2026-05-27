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
import { TableColumnFilter } from '@features/data/components/TableColumnFilter';
import { Badge } from '@/components/ui/badge';
import { DataPagination } from '@features/data/components/DataPagination';
import { Spinner } from '@/components/ui/spinner';

interface EquipmentTableProps {
  equipment: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  loading: boolean;
  visibleColumns: string[];
}

export const ALL_COLUMNS = [
  { key: 'name', label: 'Equipamento' },
  { key: 'power_w', label: 'Potência (W)' },
  { key: 'hours_per_day', label: 'Horas/Dia' },
  { key: 'quantity', label: 'Qtd' },
  { key: 'kwh_dia', label: 'kWh/Dia' },
  { key: 'kwh_mes', label: 'Consumo Mensal' },
  { key: 'valor_estimado', label: 'Valor Estimado' }
];

const COLUMN_CONFIG: Record<string, { label: string; columnName: string; isNumeric: boolean }> = {
  name: { label: 'Equipamento', columnName: 'Equipamento', isNumeric: false },
  power_w: { label: 'Potência (W)', columnName: 'Potência', isNumeric: true },
  hours_per_day: { label: 'Horas/Dia', columnName: 'Horas', isNumeric: true },
  quantity: { label: 'Qtd', columnName: 'Qtd', isNumeric: true },
  kwh_dia: { label: 'kWh/Dia', columnName: 'kWh/Dia', isNumeric: true },
  kwh_mes: { label: 'Consumo Mensal', columnName: 'Consumo Mensal', isNumeric: true },
  valor_estimado: { label: 'Valor Estimado', columnName: 'Valor Estimado', isNumeric: true }
};

export const DEFAULT_COLUMNS = ['name', 'power_w', 'hours_per_day', 'quantity', 'kwh_dia', 'kwh_mes', 'valor_estimado'];

export const EquipmentTable: React.FC<EquipmentTableProps> = ({ equipment, onEdit, onDelete, loading, visibleColumns }) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
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

  const handleClearFilters = () => {
    setFilters({});
    setSortConfig({ key: '', direction: null });
  };

  const filteredEquipment = equipment
    .filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        const cellValue = item[key];
        if (key === 'valor_estimado') {
          const formatted = (typeof cellValue === 'number'
            ? cellValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : 'R$ 0,00').toLowerCase();
          if (!formatted.includes(value.toLowerCase())) return false;
          continue;
        }
        const strVal = String(cellValue || '').toLowerCase();
        if (!strVal.includes(value.toLowerCase())) return false;
      }
      return true;
    })
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
  }, [filteredEquipment.length, filters]);

  const totalItems = filteredEquipment.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEquipment = filteredEquipment.slice(startIndex, startIndex + pageSize);

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
                const alignmentClass = config.isNumeric ? 'text-right' : '';
                const containerAlignmentClass = config.isNumeric ? 'flex items-center justify-end' : 'flex items-center';

                return (
                  <TableHead key={col.key} className={alignmentClass}>
                    <div className={containerAlignmentClass}>
                      <TableColumnFilter
                        columnName={config.columnName}
                        value={filters[col.key] || ''}
                        onChange={(v) => handleFilterChange(col.key, v)}
                        sortDirection={sortConfig.key === col.key ? sortConfig.direction : null}
                        onSort={(dir) => handleSortChange(col.key, dir)}
                        onClearAll={handleClearFilters}
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
                    <span className="text-sm text-muted-foreground">Carregando equipamentos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedEquipment.length > 0 ? (
              paginatedEquipment.map((item) => (
                <TableRow key={item.id} className="group transition-colors hover:bg-muted/50">
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40 animate-in fade-in-0 zoom-in-95">
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
                  {columnsToRender.map((col) => {
                    const colKey = col.key;
                    if (colKey === 'name') {
                      return <TableCell key={colKey}>{item.name}</TableCell>;
                    }
                    if (colKey === 'power_w') {
                      return <TableCell key={colKey} className="text-right tabular-nums">{item.power_w}</TableCell>;
                    }
                    if (colKey === 'hours_per_day') {
                      return <TableCell key={colKey} className="text-right tabular-nums">{item.hours_per_day}</TableCell>;
                    }
                    if (colKey === 'quantity') {
                      return <TableCell key={colKey} className="text-right tabular-nums">{item.quantity}</TableCell>;
                    }
                    if (colKey === 'kwh_dia') {
                      return (
                        <TableCell key={colKey} className="text-right tabular-nums">
                          {typeof item.kwh_dia === 'number' ? item.kwh_dia.toFixed(2) : '0.00'}
                        </TableCell>
                      );
                    }
                    if (colKey === 'kwh_mes') {
                      return (
                        <TableCell key={colKey} className="text-right">
                          <Badge variant="secondary">
                            {typeof item.kwh_mes === 'number' ? item.kwh_mes.toFixed(2) : '0.00'} kWh
                          </Badge>
                        </TableCell>
                      );
                    }
                    if (colKey === 'valor_estimado') {
                      return (
                        <TableCell key={colKey} className="text-right tabular-nums">
                          {typeof item.valor_estimado === 'number'
                            ? item.valor_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : 'R$ 0,00'}
                        </TableCell>
                      );
                    }
                    return null;
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnsToRender.length + 1} className="h-32 text-center">
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
