import { Search, Info, Edit3, Save, X, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between py-2 px-1 bg-transparent">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Filtrar termo nas tabelas..."
            className="pl-9 text-xs h-9 bg-background/80 backdrop-blur-xs border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary rounded-xl shadow-xs"
            disabled={isEditingMode}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
        <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/40 border border-border/30 px-3 py-1.5 rounded-xl font-medium shadow-2xs">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            {searchTerm || filterBrandOnly
              ? `Filtro: ${totalLinesFound} linhas em ${displayTablesCount} tab.`
              : `Total: ${displayLinesCount} linhas em ${totalTablesCount} tab.`}
          </span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Como associar preços"
            >
              <HelpCircle />
              <span className="hidden sm:inline">Ajuda</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 text-xs leading-relaxed space-y-2 rounded-2xl shadow-xl border-border/40">
            <div className="flex items-center gap-2 font-semibold text-foreground border-b border-border/30 pb-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Como associar preços de pauta:
            </div>
            <p className="text-muted-foreground">
              Clique sobre qualquer valor de preço (<code className="bg-primary/10 px-1.5 py-0.5 rounded font-bold text-primary">R$ 3,12</code>) para abrir o modal de associação manual ao produto do catálogo.
            </p>
            <p className="text-muted-foreground">
              Ou clique em <strong className="text-foreground">Carga em Lote</strong> no topo de cada tabela para mapear vários produtos de uma vez só!
            </p>
          </PopoverContent>
        </Popover>

        {onToggleEditingMode && (
          <div className="flex items-center gap-2">
            {isEditingMode ? (
              <>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={onSaveEdits}
                  disabled={isSavingEdits}
                >
                  <Save />
                  {isSavingEdits ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onToggleEditingMode}
                  disabled={isSavingEdits}
                >
                  <X />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleEditingMode}
              >
                <Edit3 />
                Editar Tabelas
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
