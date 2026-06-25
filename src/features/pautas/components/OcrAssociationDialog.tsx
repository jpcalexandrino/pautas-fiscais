import { Search, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';

interface Produto {
  id: number;
  descricao_interna: string;
  gtin_13?: string;
  embalagem?: string;
  conteudo_volume?: number;
}

interface OcrAssociationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCellData: {
    tabelaIdx: number;
    rIdx: number;
    cIdx: number;
    value: string;
    inferredDesc: string;
  } | null;
  produtos: Produto[];
  saveDePara: boolean;
  onSaveDeParaChange: (checked: boolean) => void;
  onConfirm: () => void;
  isSaving: boolean;
  productSearch: string;
  onProductSearchChange: (s: string) => void;
  selectedProductIds: number[];
  setSelectedProductIds: (ids: number[]) => void;
}

export function OcrAssociationDialog({
  open,
  onOpenChange,
  selectedCellData,
  produtos,
  saveDePara,
  onSaveDeParaChange,
  onConfirm,
  isSaving,
  productSearch,
  onProductSearchChange,
  selectedProductIds,
  setSelectedProductIds,
}: OcrAssociationDialogProps) {
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const normProductSearch = normalize(productSearch);
  const filteredProducts = produtos.filter((p) =>
    normalize(p.descricao_interna).includes(normProductSearch) ||
    (p.gtin_13 && p.gtin_13.includes(normProductSearch))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-md">
            <Check className="w-5 h-5 text-primary" />
            Mapeamento de Preço Manual
          </DialogTitle>
          <DialogDescription className="text-xs">
            Vincule este preço da pauta ao produto correspondente do catálogo de referência.
          </DialogDescription>
        </DialogHeader>

        {selectedCellData && (
          <div className="space-y-4 my-2 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1.5">
              <div>
                <span className="text-muted-foreground">Descrição Inferida:</span>
                <div className="font-semibold text-foreground text-sm mt-0.5 leading-snug">{selectedCellData.inferredDesc}</div>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t">
                <span className="text-muted-foreground">Preço na Pauta:</span>
                <span className="text-primary font-bold text-sm">R$ {selectedCellData.value}</span>
              </div>
            </div>

            {/* Seletor de produtos */}
            <div className="space-y-2 flex flex-col flex-1 min-h-0">
              <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Selecionar SKUs no Catálogo (Selecionados: {selectedProductIds.length}) *</span>
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filtrar produtos por nome ou GTIN..."
                  value={productSearch}
                  onChange={(e) => onProductSearchChange(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
              
              {/* Lista de produtos */}
              <div className="flex-1 overflow-y-auto border rounded-md p-1 bg-background/50 divide-y divide-muted max-h-48 scrollbar-thin">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Nenhum produto correspondente no catálogo.
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between leading-snug ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-muted/50 text-foreground/90'
                        }`}
                      >
                        <div className="pr-2">
                          <div>{p.descricao_interna}</div>
                          {p.gtin_13 && <span className="text-[10px] text-muted-foreground">GTIN: {p.gtin_13}</span>}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Checkbox De-Para */}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="save-de-para"
                checked={saveDePara}
                onCheckedChange={(checked) => onSaveDeParaChange(!!checked)}
              />
              <label
                htmlFor="save-de-para"
                className="text-xs text-muted-foreground leading-none cursor-pointer select-none"
              >
                Salvar associação de descrição no histórico De-Para
              </label>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={selectedProductIds.length === 0 || isSaving}>
            {isSaving ? (
              <>
                <Spinner className="w-3.5 h-3.5 animate-spin mr-1" />
                Salvando...
              </>
            ) : (
              'Gravar na Pauta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
