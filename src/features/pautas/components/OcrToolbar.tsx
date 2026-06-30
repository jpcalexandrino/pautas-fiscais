import { Search, Info, Edit3, Save, X } from 'lucide-react';
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card border p-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Buscar termo nas tabelas (ex: imperio)..."
            className="pl-9 text-xs"
            disabled={isEditingMode}
          />
        </div>

        {/* <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background select-none shrink-0">
          <Checkbox
            id="filter-brand-only"
            checked={filterBrandOnly}
            onCheckedChange={(checked) => onFilterBrandOnlyChange(!!checked)}
            disabled={isEditingMode}
          />
          <label
            htmlFor="filter-brand-only"
            className={`text-xs font-semibold text-foreground cursor-pointer ${isEditingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Filtrar apenas nossa marca
          </label>
        </div> */}
      </div>

      <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border font-medium">
          <Info className="w-3.5 h-3.5 text-primary" />
          <span>
            {searchTerm || filterBrandOnly
              ? `Exibindo ${totalLinesFound} linha(s) em ${displayTablesCount} tabela(s)`
              : `Total: ${displayLinesCount} linha(s) em ${totalTablesCount} tabela(s)`}
          </span>
        </div>

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
                  {isSavingEdits ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  type="button"
                  onClick={onToggleEditingMode}
                  disabled={isSavingEdits}
                  className="text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onToggleEditingMode}
                className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
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
