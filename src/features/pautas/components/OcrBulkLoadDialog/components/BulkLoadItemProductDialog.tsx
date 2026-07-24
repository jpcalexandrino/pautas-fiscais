import { Search, Info, SlidersHorizontal, AlertCircle, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import type { BulkItem, Produto } from '../types';

interface BulkLoadItemProductDialogProps {
  activeItemIdx: number | null;
  onClose: () => void;
  activeItem: BulkItem | null;
  productSearch: string;
  onProductSearchChange: (val: string) => void;
  embalagemFilter: string;
  onEmbalagemFilterChange: (val: string) => void;
  volumeFilter: string;
  onVolumeFilterChange: (val: string) => void;
  uniqueEmbalagens: string[];
  filteredProducts: Produto[];
  selectedProductsForActiveItem: Produto[];
  onProductSelect: (productId: number) => void;
  onRemoveProduct: (productId: number) => void;
  onClearAll: () => void;
}

export function BulkLoadItemProductDialog({
  activeItemIdx,
  onClose,
  activeItem,
  productSearch,
  onProductSearchChange,
  embalagemFilter,
  onEmbalagemFilterChange,
  volumeFilter,
  onVolumeFilterChange,
  uniqueEmbalagens,
  filteredProducts,
  selectedProductsForActiveItem,
  onProductSelect,
  onRemoveProduct,
  onClearAll,
}: BulkLoadItemProductDialogProps) {
  return (
    <Dialog open={activeItemIdx !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-6xl max-w-6xl w-[92vw] h-[85vh] flex flex-col p-6 rounded-2xl gap-4 bg-background border border-muted/40">
        <DialogHeader className="border-b border-muted/30 pb-3 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-foreground">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Search className="w-5 h-5" />
              </span>
              Associar Produto do Lote
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Escolha o produto correspondente do catálogo para associar a esta linha.
            </DialogDescription>
          </div>
        </DialogHeader>

        {activeItem && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
            {/* COLUNA ESQUERDA - DESTAQUE DO ITEM DO LOTE */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-primary/[0.02] dark:bg-primary/[0.03] border border-primary/10 p-5 rounded-xl space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/15 text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                      Item do Lote
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Descrição na Pauta:
                    </span>
                    <h3 className="text-base font-extrabold text-foreground leading-snug tracking-tight">
                      {activeItem.inferredDesc}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-primary/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Preço Detectado:
                    </span>
                    <span className="text-xl font-black text-primary">
                      R$ {activeItem.value.replace(/R\$\s*/i, '')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 bg-background/50 dark:bg-background/20 p-3 rounded-lg border border-primary/10 text-xs">
                  <div className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      Selecione um produto à direita. Você pode associar múltiplos produtos se necessário.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA - SELEÇÃO DE PRODUTOS */}
            <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
              {/* FILTROS */}
              <div className="bg-muted/20 border border-muted/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    Filtros de Busca
                  </span>
                  {activeItem.matchedProductIds.length > 0 && (
                    <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                      Selecionados: {activeItem.matchedProductIds.length}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/55" />
                  <Input
                    placeholder="Buscar por descrição interna ou GTIN..."
                    value={productSearch}
                    onChange={(e) => onProductSearchChange(e.target.value)}
                    className="pl-9 text-xs h-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Embalagem</Label>
                    <Select value={embalagemFilter} onValueChange={onEmbalagemFilterChange}>
                      <SelectTrigger className="h-8.5 text-xs bg-background">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as embalagens</SelectItem>
                        {uniqueEmbalagens.map((emb) => (
                          <SelectItem key={emb} value={emb} className="text-xs">
                            {emb}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Volumetria (ex: 473 ml)
                    </Label>
                    <Input
                      placeholder="Filtrar volume..."
                      value={volumeFilter}
                      onChange={(e) => onVolumeFilterChange(e.target.value)}
                      className="text-xs h-8.5 bg-background border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* PRODUTOS SELECIONADOS (BADGES) */}
              {selectedProductsForActiveItem.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 border border-muted/20 rounded-xl animate-fade-in max-h-24 overflow-y-auto scrollbar-thin">
                  {selectedProductsForActiveItem.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-xl"
                    >
                      <span className="truncate max-w-[150px]">{p.descricao_interna}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRemoveProduct(p.id)}
                        className="hover:bg-primary/20 p-0.5 rounded cursor-pointer shrink-0 transition-colors h-4 w-4"
                      >
                        <X className="w-3 h-3 text-primary" />
                      </Button>
                    </span>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={onClearAll}
                    className="text-[10px] font-bold text-destructive hover:text-destructive/80 hover:bg-transparent transition-colors px-2 py-1 cursor-pointer ml-auto h-auto"
                  >
                    Desmarcar Todos
                  </Button>
                </div>
              )}

              {/* LISTA DE PRODUTOS */}
              <div className="flex-1 overflow-y-auto border border-muted/50 rounded-xl p-1 bg-background/50 divide-y divide-muted/30 min-h-[180px]">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-1.5">
                    <AlertCircle className="w-6 h-6 text-muted-foreground/60" />
                    <span className="text-xs font-semibold">Nenhum produto correspondente no catálogo</span>
                    <span className="text-[10px]">Tente alterar os termos de busca ou remover os filtros.</span>
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = activeItem.matchedProductIds.includes(p.id);
                    return (
                      <Button
                        key={p.id}
                        variant="ghost"
                        onClick={() => onProductSelect(p.id)}
                        className={`w-full text-left justify-between px-4 py-2.5 text-xs h-auto transition-all flex items-center leading-snug cursor-pointer rounded-none border-b border-muted/20 ${
                          isSelected
                            ? 'bg-primary/[0.04] text-primary font-semibold hover:bg-primary/[0.08] hover:text-primary'
                            : 'hover:bg-muted/40 text-foreground/90'
                        }`}
                      >
                        <div className="pr-2 space-y-0.5">
                          <span className="font-semibold text-foreground block">{p.descricao_interna}</span>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {p.gtin_13 && (
                              <span>
                                GTIN: <strong className="text-foreground">{p.gtin_13}</strong>
                              </span>
                            )}
                            {p.embalagem && (
                              <span>
                                Embalagem: <strong className="text-foreground">{p.embalagem}</strong>
                              </span>
                            )}
                            {p.conteudo_volume && (
                              <span>
                                Volume: <strong className="text-foreground">{p.conteudo_volume} ml</strong>
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </Button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-muted/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
