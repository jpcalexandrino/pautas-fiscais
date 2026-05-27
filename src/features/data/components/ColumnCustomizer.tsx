import React from 'react';
import {
  Columns2,
  ChevronRight,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CSV_FIELDS } from '@shared/utils/constants';
import { cn } from '@/lib/utils';

export interface CustomizerColumn {
  key: string;
  label: string;
}

interface ColumnCustomizerProps {
  columns?: CustomizerColumn[];
  visibleColumns: string[];
  onToggleColumn: (columnKey: string) => void;
  onReset: () => void;
  className?: string;
}

export const ColumnCustomizer: React.FC<ColumnCustomizerProps> = ({
  columns,
  visibleColumns,
  onToggleColumn,
  onReset,
  className,
}) => {
  const fields = columns || CSV_FIELDS;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2 h-7", className)}>
          <Columns2 className="w-4 h-4" />
          Colunas
          <ChevronRight className="w-4 h-4 rotate-90" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1">
        <ScrollArea className={fields.length > 8 ? "h-75" : ""}>
          {fields.map((field) => (
            <div
              key={field.key}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={(e) => {
                e.preventDefault();
                onToggleColumn(field.key);
              }}
            >
              <div className="flex h-4 w-4 items-center justify-center mr-3">
                {visibleColumns.includes(field.key) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              <span className="flex-1">{field.label}</span>
            </div>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start font-normal text-xs h-8 px-2 mt-1"
          onClick={onReset}
        >
          Restaurar Padrão
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
