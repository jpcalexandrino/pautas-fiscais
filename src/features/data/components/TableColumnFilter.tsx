import React from 'react';
import { Filter, X, ArrowUpAZ, SortAsc, SortDesc, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface TableColumnFilterProps {
  columnName: string;
  value: string;
  onChange: (value: string) => void;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (direction: 'asc' | 'desc' | null) => void;
  className?: string;
  children?: React.ReactNode;
  onClearAll?: () => void;
}

export const TableColumnFilter: React.FC<TableColumnFilterProps> = ({
  columnName,
  value,
  onChange,
  sortDirection,
  onSort,
  className,
  children,
  onClearAll
}) => {

  const isFiltered = value.length > 0;
  const isSorted = !!sortDirection;

  return (
    <div className={cn("inline-flex items-center ml-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 transition-colors focus:outline-none w-full h-full px-2 py-1 -ml-2 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground",
              (isFiltered || isSorted) && "text-primary font-bold hover:text-primary"
            )}
          >

            {children || columnName}
            {isSorted && (
              sortDirection === 'asc' ? <SortAsc className="size-5 ml-1" /> : <SortDesc className="size-5 ml-1" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3" align="start">
          <div className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold leading-none flex items-center gap-1.5">
                <Filter className="h-3 w-3" />
                Filtrar {columnName}
              </h4>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`Buscar...`}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:text-destructive"
                    onClick={() => onChange('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {onSort && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold leading-none flex items-center gap-1.5">
                    <ArrowUpAZ className="h-3 w-3" />
                    Ordenar
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={sortDirection === 'asc' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-[10px] gap-1 px-2"
                      onClick={() => onSort(sortDirection === 'asc' ? null : 'asc')}
                    >
                      <SortAsc className="h-3 w-3" />
                      Crescente
                    </Button>
                    <Button
                      variant={sortDirection === 'desc' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-[10px] gap-1 px-2"
                      onClick={() => onSort(sortDirection === 'desc' ? null : 'desc')}
                    >
                      <SortDesc className="h-3 w-3" />
                      Decrescente
                    </Button>
                  </div>
                </div>
              </>
            )}
            <Separator />
            <div>
              <Button
                className="w-full"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onClearAll) {
                    onClearAll();
                  } else {
                    onChange('');
                    onSort?.(null);
                  }
                }}
              >
                <RotateCcw className="h-3 w-3" /> Limpar Filtros
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

