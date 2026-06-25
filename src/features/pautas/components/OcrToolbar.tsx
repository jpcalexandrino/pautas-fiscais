import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface OcrToolbarProps {
  searchTerm: string;
  onSearchTermChange: (s: string) => void;
  filterBrandOnly: boolean;
  onFilterBrandOnlyChange: (b: boolean) => void;
  totalLinesFound: number;
  totalTablesCount: number;
  displayLinesCount: number;
  displayTablesCount: number;
}

export function OcrToolbar({
  searchTerm,
  onSearchTermChange,
  filterBrandOnly,
  onFilterBrandOnlyChange,
  totalLinesFound,
  totalTablesCount,
  displayLinesCount,
  displayTablesCount,
}: OcrToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card border p-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Buscar termo nas tabelas (ex: imperio)..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background select-none shrink-0">
          <Checkbox
            id="filter-brand-only"
            checked={filterBrandOnly}
            onCheckedChange={(checked) => onFilterBrandOnlyChange(!!checked)}
          />
          <label
            htmlFor="filter-brand-only"
            className="text-xs font-semibold text-foreground cursor-pointer"
          >
            Filtrar apenas nossa marca
          </label>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border self-start md:self-auto shrink-0 font-medium">
        <Info className="w-3.5 h-3.5 text-primary" />
        <span>
          {searchTerm || filterBrandOnly
            ? `Exibindo ${totalLinesFound} linha(s) em ${displayTablesCount} tabela(s)`
            : `Total: ${displayLinesCount} linha(s) em ${totalTablesCount} tabela(s)`}
        </span>
      </div>
    </div>
  );
}
