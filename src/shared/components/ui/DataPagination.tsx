import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataPaginationProps {
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalRows?: number;
  totalItems?: number;
  totalPages?: number;
  selectedCount?: number;
}

export const DataPagination: React.FC<DataPaginationProps> = ({
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalRows,
  totalItems,
  totalPages,
  selectedCount,
}) => {
  const finalTotalRows = totalRows !== undefined ? totalRows : (totalItems !== undefined ? totalItems : 0);
  const finalTotalPages = totalPages !== undefined ? totalPages : Math.ceil(finalTotalRows / pageSize);

  if (finalTotalPages === 0) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t border-border/50">
      {/* Left side: Selection status */}
      <div className="flex-1 text-sm text-muted-foreground">
        {selectedCount !== undefined
          ? `${selectedCount} de ${finalTotalRows} linha(s) selecionadas.`
          : finalTotalRows > 1 ? `${finalTotalRows} linhas` : `${finalTotalRows} linha`}
      </div>

      {/* Right side: Controls */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Linhas por página</p>
          <Select
            defaultValue={pageSize.toString()}
            onValueChange={(value: string) => {
              onPageSizeChange(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((value) => (
                <SelectItem key={value} value={value.toString()}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full items-center justify-center text-sm font-medium text-muted-foreground">
          Página {currentPage} de {finalTotalPages}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Ir para a primeira página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Ir para a página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === finalTotalPages}
          >
            <span className="sr-only">Ir para a próxima página</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(finalTotalPages)}
            disabled={currentPage === finalTotalPages}
          >
            <span className="sr-only">Ir para a última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
