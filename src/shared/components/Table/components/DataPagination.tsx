import { type FC } from 'react';
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
  totalPages: number;
  pageSize: number;
  totalRows: number;
  selectedCount?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const DataPagination: FC<DataPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalRows,
  selectedCount,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalPages === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-white/15 bg-card text-card-foreground">
      {/* Left side: Selection status */}
      <div className="flex-1 text-xs text-muted-foreground">
        {selectedCount !== undefined && selectedCount > 0
          ? `${selectedCount} de ${totalRows} linha(s) selecionadas.`
          : totalRows > 1 ? `${totalRows} linhas` : `${totalRows} linha`}
      </div>

      {/* Right side: Controls */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">Linhas por página</p>
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
              {[20, 30, 40, 50, 100].map((value) => (
                <SelectItem key={value} value={value.toString()} className="text-xs">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[100px] items-center justify-center text-xs font-medium text-muted-foreground">
          Página {currentPage} de {totalPages}
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
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Ir para a próxima página</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Ir para a última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
