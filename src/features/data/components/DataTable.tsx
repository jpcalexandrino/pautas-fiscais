import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CSV_FIELDS } from '@shared/utils/constants';
import { TableColumnFilter } from './TableColumnFilter';

interface DataTableProps {
  rowsWithIndex: any[];
  selectedRows: number[];
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (index: number) => void;
  formatCell: (field: string, value: any) => string;
  visibleColumns: string[];
}

export const DataTable: React.FC<DataTableProps> = ({
  rowsWithIndex,
  selectedRows,
  isAllSelected,
  onSelectAll,
  onSelectRow,
  formatCell,
  visibleColumns,
}) => {
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  const handleFilterChange = (field: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key: field, direction });
  };

  const filteredRows = rowsWithIndex
    .filter(row => {
      return Object.entries(columnFilters).every(([field, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = formatCell(field, row[field]).toLowerCase();
        return cellValue.includes(filterValue.toLowerCase());
      });
    })
    .sort((a, b) => {
      if (!sortConfig.direction || !sortConfig.key) return 0;

      const field = sortConfig.key;
      const valA = a[field];
      const valB = b[field];

      if (valA === valB) return 0;

      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * multiplier;
      }

      return String(valA).localeCompare(String(valB)) * multiplier;
    });


  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="px-6 py-4 border-b bg-muted/30">
        <CardTitle className="text-sm font-bold">Listagem de Faturas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[50px] text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => onSelectAll(checked === true)}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                {CSV_FIELDS.filter(f => visibleColumns.includes(f.key)).map(f => (
                  <TableHead key={f.key} className={f.type === 'currency' || f.type === 'number' ? 'text-right' : ''}>
                    <div className={f.type === 'currency' || f.type === 'number' ? 'flex items-center justify-end' : 'flex items-center'}>
                      <TableColumnFilter
                        columnName={f.label}
                        value={columnFilters[f.key] || ''}
                        onChange={(v) => handleFilterChange(f.key, v)}
                        sortDirection={sortConfig.key === f.key ? sortConfig.direction : null}
                        onSort={(dir) => handleSortChange(f.key, dir)}
                      >
                        {f.label}
                      </TableColumnFilter>
                    </div>

                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <TableRow key={row._originalIdx} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedRows.includes(row._originalIdx)}
                        onCheckedChange={() => onSelectRow(row._originalIdx)}
                        aria-label={`Selecionar linha ${row._originalIdx}`}
                      />
                    </TableCell>
                    {CSV_FIELDS.filter(f => visibleColumns.includes(f.key)).map(f => (
                      <TableCell
                        key={f.key}
                        className={`whitespace-nowrap ${f.type === 'currency' || f.type === 'number' ? 'text-right tabular-nums' : ''}`}
                      >
                        {formatCell(f.key, row[f.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center text-muted-foreground">
                    Nenhum resultado encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
