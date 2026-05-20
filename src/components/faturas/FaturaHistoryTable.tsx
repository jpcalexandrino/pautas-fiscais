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
import { TableColumnFilter } from '../data/TableColumnFilter';
import { formatCurrency, formatMesReferencia, formatKWh } from '@/utils/formatters';
import { DataPagination } from '@/components/data/DataPagination';

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
}

export const FaturaHistoryTable: React.FC<FaturaHistoryTableProps> = ({
  faturas,
  loading,
  columnFilters,
  onFilterChange,
  sortConfig,
  onSortChange,
  onAction,
  generatingId,
  onClearFilters
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

  return (
    <div className="flex flex-col">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right w-5"></TableHead>
              <TableHead className="w-50">
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Site"
                    value={columnFilters.site}
                    onChange={(v) => onFilterChange('site', v)}
                    sortDirection={sortConfig.key === 'site' ? sortConfig.direction : null}
                    onSort={(dir) => onSortChange('site', dir)}
                    onClearAll={onClearFilters}
                  >
                    Site
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Cliente"
                    value={columnFilters.client}
                    onChange={(v) => onFilterChange('client', v)}
                    sortDirection={sortConfig.key === 'client' ? sortConfig.direction : null}
                    onSort={(dir) => onSortChange('client', dir)}
                    onClearAll={onClearFilters}
                  >
                    Cliente
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center">
                  <TableColumnFilter
                    columnName="Mês"
                    value={columnFilters.mes}
                    onChange={(v) => onFilterChange('mes', v)}
                    sortDirection={sortConfig.key === 'mes' ? sortConfig.direction : null}
                    onSort={(dir) => onSortChange('mes', dir)}
                    onClearAll={onClearFilters}
                  >
                    Mês Ref.
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Instalação"
                    value={columnFilters.instalacao}
                    onChange={(v) => onFilterChange('instalacao', v)}
                    sortDirection={sortConfig.key === 'instalacao' ? sortConfig.direction : null}
                    onSort={(dir) => onSortChange('instalacao', dir)}
                    onClearAll={onClearFilters}
                  >
                    Instalação
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end">
                  <TableColumnFilter
                    columnName="Consumo"
                    value={columnFilters.consumo}
                    onChange={(v) => onFilterChange('consumo', v)}
                    sortDirection={sortConfig.key === 'consumo' ? sortConfig.direction : null}
                    onSort={(dir) => onSortChange('consumo', dir)}
                    onClearAll={onClearFilters}
                  >
                    Consumo Total
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead className="text-right text-muted-foreground">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow key="loading-row">
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Spinner className="w-8 h-8" />
                    <span className="text-sm text-muted-foreground">Carregando histórico...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedFaturas.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  Nenhuma fatura encontrada.
                </TableCell>
              </TableRow>
            ) : (
              paginatedFaturas.map((fatura) => (
                <TableRow key={fatura.id} className="group transition-colors hover:bg-muted/50">
                  <TableCell className="text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40 animate-in fade-in-0 zoom-in-95">
                        <DropdownMenuItem
                          onClick={() => onAction(fatura, 'view')}
                          disabled={generatingId !== null}
                        >
                          {generatingId === fatura.id ? <Spinner className="mr-2 w-3 h-3" /> : <Eye className="mr-2 h-4 w-4 text-muted-foreground" />}
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(fatura, 'download')}
                          disabled={generatingId !== null}
                        >
                          {generatingId === fatura.id ? <Spinner className="mr-2 w-3 h-3" /> : <Download className="mr-2 h-4 w-4 text-muted-foreground" />}
                          Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(fatura, 'email')}
                          disabled={generatingId !== null}
                        >
                          {generatingId === fatura.id ? <Spinner className="mr-2 w-3 h-3" /> : <Mail className="mr-2 h-4 w-4 text-muted-foreground" />}
                          Enviar por e-mail
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="font-medium">{fatura.nomeDoSite}</TableCell>
                  <TableCell>{fatura.nomeDoCliente}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {formatMesReferencia(fatura.mesReferencia)}
                    </Badge>
                  </TableCell>
                  <TableCell>{fatura.instalacao}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant="secondary" className="tabular-nums bg-primary/50">
                      {formatKWh(fatura.medidaConsumoTUSDForaPonta)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(fatura.valorTotalRS)}
                  </TableCell>
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
