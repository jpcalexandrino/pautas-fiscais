import { Search, Info, Edit3, Save, X, HelpCircle, TableProperties } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';

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
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between py-0.5 px-0.5 bg-transparent">
      <div className="flex flex-col sm:flex-row gap-2.5 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Buscar termo nas tabelas..."
            className="pl-8 text-xs h-7.5 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary rounded-xl shadow-2xs hover:border-border transition-all"
            disabled={isEditingMode}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto shrink-0 text-xs">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-card border border-border/60 px-2.5 h-7.5 rounded-xl font-medium shadow-2xs">
          <TableProperties className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            {searchTerm || filterBrandOnly
              ? `${totalLinesFound} linhas`
              : `${displayLinesCount} linhas`}
          </span>
          <Separator orientation="vertical" className="h-3 bg-border/50" />
          <span>
            {searchTerm || filterBrandOnly
              ? `${displayTablesCount} tabelas`
              : `${totalTablesCount} tabelas`}
          </span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7.5 px-2.5 text-xs cursor-pointer border-border/60 hover:bg-accent transition-all gap-1"
              title="Como associar preços"
            >
              <HelpCircle className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Ajuda</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 text-xs leading-relaxed space-y-2 rounded-xl shadow-xl border-border/40">
            <div className="flex items-center gap-2 font-semibold text-foreground border-b border-border/30 pb-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Como associar preços de pauta:
            </div>
            <p className="text-muted-foreground">
              Clique sobre qualquer valor de preço (<code className="bg-primary/10 px-1.5 py-0.5 rounded-md font-bold text-primary">R$ 3,12</code>) para abrir o modal de associação manual ao produto do catálogo.
            </p>
            <p className="text-muted-foreground">
              Ou clique em <strong className="text-foreground">Carga em Lote</strong> no topo de cada tabela para mapear vários produtos de uma vez só!
            </p>
          </PopoverContent>
        </Popover>

        {onToggleEditingMode && (
          <div className="flex items-center gap-1.5">
            {isEditingMode ? (
              <>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={onSaveEdits}
                  disabled={isSavingEdits}
                  className="h-7.5 px-2.5 text-xs font-semibold gap-1 cursor-pointer shadow-2xs transition-all"
                >
                  <Save className="size-3.5" />
                  {isSavingEdits ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onToggleEditingMode}
                  disabled={isSavingEdits}
                  className="h-7.5 px-2.5 text-xs border-border/60 hover:bg-accent transition-all gap-1 cursor-pointer"
                >
                  <X className="size-3.5" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleEditingMode}
                className="h-7.5 px-2.5 text-xs border-border/60 hover:bg-accent transition-all gap-1 cursor-pointer"
              >
                <Edit3 className="size-3.5 text-muted-foreground" />
                Editar Tabelas
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
