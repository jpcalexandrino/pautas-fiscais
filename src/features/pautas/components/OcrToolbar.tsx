import { Search, Info, Edit3, Save, X, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface OcrToolbarProps {
  searchTerm: string;
  onSearchTermChange: (s: string) => void;
  filterBrandOnly: boolean;
  onFilterBrandOnlyChange: (b: boolean) => void;
  totalLinesFound: number;
  totalTablesCount: number;
  displayLinesCount: number;
  displayTablesCount: number;
  isEditingMode?: boolean;
  onToggleEditingMode?: () => void;
  onSaveEdits?: () => void;
  isSavingEdits?: boolean;
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
  isEditingMode = false,
  onToggleEditingMode,
  onSaveEdits,
  isSavingEdits = false,
}: OcrToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between py-1 bg-transparent">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Filtrar termo nas tabelas..."
            className="pl-9 text-xs h-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
            disabled={isEditingMode}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-md font-medium">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
          <span>
            {searchTerm || filterBrandOnly
              ? `Filtro: ${totalLinesFound} linhas em ${displayTablesCount} tab.`
              : `Total: ${displayLinesCount} linhas em ${totalTablesCount} tab.`}
          </span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors" title="Como associar preços">
              <HelpCircle className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 text-xs leading-relaxed space-y-1.5">
            <p className="font-semibold text-foreground">Como associar preços:</p>
            <p className="text-muted-foreground">
              Clique sobre qualquer valor de preço de pauta nas tabelas (células azuis, ex: <code className="bg-muted px-1 py-0.5 rounded text-primary">R$ 3,12</code>) para abrir o diálogo de associação manual ou carga em lote.
            </p>
          </PopoverContent>
        </Popover>

        {onToggleEditingMode && (
          <div className="flex items-center gap-2">
            {isEditingMode ? (
              <>
                <button
                  type="button"
                  onClick={onSaveEdits}
                  disabled={isSavingEdits}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingEdits ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={onToggleEditingMode}
                  disabled={isSavingEdits}
                  className="text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-muted-foreground/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onToggleEditingMode}
                className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar Tabelas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
