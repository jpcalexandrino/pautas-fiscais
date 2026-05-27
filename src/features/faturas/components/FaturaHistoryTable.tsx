import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Eye, Download, Mail } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TableColumnFilter } from '@features/data/components/TableColumnFilter';
import {
  formatCurrency,
  formatMesReferencia,
  formatKWh,
  formatDate,
  formatPercentage,
  formatNumber
} from '@shared/utils/formatters';
import { DataPagination } from '@features/data/components/DataPagination';
import { CSV_FIELDS } from '@shared/utils/constants';

interface FaturaHistoryTableProps {
  faturas: any[];
  loading: boolean;
  columnFilters: any;
  onFilterChange: (key: string, value: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' | null };
  onSortChange: (key: string, direction: 'asc' | 'desc' | null) => void;
  onAction: (fatura: any, action: 'view' | 'download' | 'email') => void;
  generatingId: number | null;
  onClearFilters: () => void;
  visibleColumns: string[];
}

export const DEFAULT_COLUMNS = ['nomeDoSite', 'nomeDoCliente', 'mesReferencia', 'instalacao', 'medidaConsumoTUSDForaPonta', 'valorTotalRS'];

export const FaturaHistoryTable: React.FC<FaturaHistoryTableProps> = ({
  faturas,
  loading,
  columnFilters,
  onFilterChange,
  sortConfig,
  onSortChange,
  onAction,
  generatingId,
  onClearFilters,
  visibleColumns
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to first page when filtering or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [faturas.length, columnFilters]);

  const totalItems = faturas.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFaturas = faturas.slice(startIndex, startIndex + pageSize);

  // Filter CSV_FIELDS to maintain original order of columns
  const columnsToRender = CSV_FIELDS.filter(field => visibleColumns.includes(field.key));

  return (
    <div className="flex flex-col">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right w-5"></TableHead>
              {columnsToRender.map((field) => {
                const colKey = field.key;
                let thClass = '';
                let containerClass = 'flex items-center';

                if (colKey === 'nomeDoSite') {
                  thClass = 'w-50';
                } else if (colKey === 'mesReferencia') {
                  thClass = 'text-center';
                  containerClass = 'flex items-center justify-center';
                } else if (field.type === 'currency' || field.type === 'number') {
                  thClass = 'text-right';
                  containerClass = 'flex items-center justify-end';
                }

                return (
                  <TableHead key={colKey} className={thClass}>
                    <div className={containerClass}>
                      <TableColumnFilter
                        columnName={field.label}
                        value={columnFilters[colKey] || ''}
                        onChange={(v) => onFilterChange(colKey, v)}
                        sortDirection={sortConfig.key === colKey ? sortConfig.direction : null}
                        onSort={(dir) => onSortChange(colKey, dir)}
                        onClearAll={onClearFilters}
                      >
                        {field.label}
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
                    <span className="text-sm text-muted-foreground">Carregando histórico...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedFaturas.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={columnsToRender.length + 1} className="h-48 text-center text-muted-foreground">
                  Nenhuma fatura encontrada.
                </TableCell>
              </TableRow>
            ) : (
              paginatedFaturas.map((fatura) => (
                <TableRow key={fatura.id} className="group transition-colors hover:bg-muted/50">
                  <TableCell className="text-right py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 animate-in fade-in-0 zoom-in-95">
                        <DropdownMenuItem
                          onClick={() => onAction(fatura, 'view')}
                          disabled={generatingId !== null}
                          className="gap-2"
                        >
                          {generatingId === fatura.id ? <Spinner className="w-3.5 h-3.5" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(fatura, 'download')}
                          disabled={generatingId !== null}
                          className="gap-2"
                        >
                          {generatingId === fatura.id ? <Spinner className="w-3.5 h-3.5" /> : <Download className="h-4 w-4 text-muted-foreground" />}
                          Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(fatura, 'email')}
                          disabled={generatingId !== null}
                          className="gap-2"
                        >
                          {generatingId === fatura.id ? <Spinner className="w-3.5 h-3.5" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                          Enviar por e-mail
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  {columnsToRender.map((field) => {
                    const colKey = field.key;
                    const value = fatura[colKey];

                    // Custom rendering for existing columns to maintain styling:
                    if (colKey === 'mesReferencia') {
                      return (
                        <TableCell key={colKey} className="text-center">
                          <Badge variant="secondary">
                            {formatMesReferencia(value)}
                          </Badge>
                        </TableCell>
                      );
                    }

                    if (colKey === 'medidaConsumoTUSDForaPonta') {
                      return (
                        <TableCell key={colKey} className="text-right tabular-nums">
                          <Badge variant="secondary" className="tabular-nums bg-primary/50">
                            {formatKWh(value)}
                          </Badge>
                        </TableCell>
                      );
                    }

                    if (colKey === 'valorTotalRS') {
                      return (
                        <TableCell key={colKey} className="text-right tabular-nums">
                          {formatCurrency(value)}
                        </TableCell>
                      );
                    }

                    if (colKey === 'nomeDoSite') {
                      return (
                        <TableCell key={colKey} className="font-medium">
                          {value}
                        </TableCell>
                      );
                    }

                    // General rendering for other dynamic columns based on field type
                    const isNumeric = field.type === 'currency' || field.type === 'number' || field.type === 'percentage';
                    let displayVal = value === undefined || value === null || value === '' ? '—' : String(value);

                    if (value !== undefined && value !== null && value !== '') {
                      if (field.type === 'currency') {
                        displayVal = formatCurrency(value);
                      } else if (field.type === 'percentage') {
                        displayVal = formatPercentage(value);
                      } else if (field.type === 'number') {
                        displayVal = formatNumber(value);
                      } else if (field.type === 'date') {
                        displayVal = formatDate(value);
                      }
                    }

                    return (
                      <TableCell
                        key={colKey}
                        className={isNumeric ? 'text-right tabular-nums' : ''}
                      >
                        {displayVal}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {!loading && totalItems > 0 && (
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
