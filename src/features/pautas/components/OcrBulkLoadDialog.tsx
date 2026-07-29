import { useState } from 'react';
import { Check, Loader2, Info, Barcode, Maximize2, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import type { OcrBulkLoadDialogProps } from './OcrBulkLoadDialog/types';
import { useBulkLoadItems } from './OcrBulkLoadDialog/hooks/useBulkLoadItems';
import { useBulkProductFilter } from './OcrBulkLoadDialog/hooks/useBulkProductFilter';
import { BulkLoadItemProductDialog } from './OcrBulkLoadDialog/components/BulkLoadItemProductDialog';
import { extractGtin } from '../utils/ocrHelpers';

export type { OcrBulkLoadDialogProps };

export function OcrBulkLoadDialog({
  open,
  onOpenChange,
  tabela,
  produtos,
  deParas,
  uf,
  dataPauta,
  filename,
  confirmedCells,
  onConfirmBulk,
  isPriceCell,
  inferItemDescription,
}: OcrBulkLoadDialogProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const bulkItems = useBulkLoadItems({
    open,
    tabela,
    produtos,
    deParas,
    uf,
    dataPauta,
    filename,
    confirmedCells,
    onConfirmBulk,
    onOpenChange,
    isPriceCell,
    inferItemDescription,
  });

  const productFilter = useBulkProductFilter({
    produtos,
    activeItemIdx: bulkItems.activeItemIdx,
    activeItem: bulkItems.activeItem,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`flex flex-col bg-background shadow-xl transition-all duration-200 ${
          isFullScreen 
            ? '!w-screen !h-screen !max-w-none !max-h-none !left-0 !top-0 !translate-x-0 !translate-y-0 !rounded-none !border-none p-6' 
            : 'max-w-[95vw] w-[95vw] sm:max-w-[75vw] max-h-[95vh] border border-border/60 rounded-xl'
        }`}>
          <DialogHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-foreground">
                <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                  <Check className="w-5 h-5" />
                </span>
                Carga em Lote - Tabela {tabela?.tabelaIndex} ({bulkItems.items.length} {bulkItems.items.length === 1 ? 'item' : 'itens'})
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Mapeie múltiplos preços de uma vez. O sistema tentará sugerir o produto com base no catálogo e De-Para do estado.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                title={isFullScreen ? "Minimizar" : "Maximizar"}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogHeader>

          {/* Alert Informação */}
          <div className="text-xs text-muted-foreground bg-muted/20 border border-border/40 p-3 rounded-xl flex items-start gap-2 mt-1">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <p>
              Itens já confirmados anteriormente serão omitidos da seleção de envio, mas podem ser vistos abaixo. Clique na linha para reassociar um produto.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto my-3 border border-border/50 rounded-xl bg-card scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/20 border-b border-border/40 sticky top-0 backdrop-blur-md">
                  <th className="p-3 w-10 text-center">
                    <Checkbox
                      checked={
                        bulkItems.items.length > 0 &&
                        bulkItems.items.filter((item) => !item.confirmed).every((item) => item.selected)
                      }
                      onCheckedChange={(checked) => bulkItems.handleToggleSelectAll(!!checked)}
                      disabled={bulkItems.items.filter((item) => !item.confirmed).length === 0}
                    />
                  </th>
                  <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Descrição Inferida (Estado)
                  </th>
                  <th className="p-3 w-28 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Preço
                  </th>
                  <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Produto Associado
                  </th>
                  <th className="p-3 w-28 text-center font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {bulkItems.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Nenhum preço encontrado nesta tabela.
                    </td>
                  </tr>
                ) : (
                  bulkItems.items.map((item, idx) => {
                    const matchedProds = produtos.filter((p) => item.matchedProductIds.includes(p.id));
                    return (
                      <tr
                        key={item.cellKey}
                        className={`hover:bg-muted/20 transition-colors ${
                          item.confirmed ? 'opacity-50 bg-muted/10' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => bulkItems.handleToggleItem(idx)}
                            disabled={item.confirmed}
                          />
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          <div className="break-words whitespace-normal" title={item.inferredDesc}>{item.inferredDesc}</div>
                          {(item.gtin || extractGtin(item.inferredDesc)) && (
                            <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                              GTIN: {item.gtin || extractGtin(item.inferredDesc)}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-primary">
                          R$ {item.value.replace(/R\$\s*/i, '')}
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => !item.confirmed && bulkItems.setActiveItemIdx(idx)}
                            className={`w-full text-left justify-start px-3 py-1.5 h-auto text-xs border border-border/60 rounded-xl hover:bg-accent transition-all font-medium block max-w-md ${
                              item.confirmed ? 'cursor-not-allowed bg-muted/10' : 'cursor-pointer'
                            }`}
                          >
                            {matchedProds.length > 0 ? (
                              <span className="flex flex-col gap-0.5 w-full">
                                {matchedProds.map((p, pIdx) => (
                                  <span key={p.id} className="block">
                                    <span className="block truncate font-medium text-foreground">{p.descricao_interna}</span>
                                    {p.gtin_13 && (
                                      <span className="block text-[10px] text-muted-foreground font-normal">
                                        GTIN: {p.gtin_13}
                                      </span>
                                    )}
                                    {pIdx < matchedProds.length - 1 && (
                                      <span className="block border-b border-border/30 my-1" />
                                    )}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              '(Selecione um ou mais Produtos)'
                            )}
                          </Button>
                        </td>
                        <td className="p-3 text-center">
                          {item.confirmed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-semibold bg-muted text-muted-foreground border border-border/40">
                              Importado
                            </span>
                          ) : item.matchType === 'de-para' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              De-Para
                            </span>
                          ) : item.matchType === 'gtin' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              GTIN
                            </span>
                          ) : item.matchType === 'fuzzy' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Sugerido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center space-x-2 px-1 py-1">
            <Checkbox
              id="bulk-save-de-para"
              checked={bulkItems.saveDePara}
              onCheckedChange={(checked) => bulkItems.setSaveDePara(!!checked)}
            />
            <Label
              htmlFor="bulk-save-de-para"
              className="text-xs text-muted-foreground cursor-pointer select-none font-medium"
            >
              Salvar associações no histórico De-Para
            </Label>
          </div>

          <DialogFooter className="gap-1.5 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={bulkItems.isSaving}
              className="h-7 px-2.5 text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={bulkItems.handleSaveBulk}
              disabled={
                bulkItems.isSaving ||
                bulkItems.items.filter((item) => item.selected && item.matchedProductIds.length > 0).length === 0
              }
              className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer shadow-2xs"
            >
              {bulkItems.isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Gravando {bulkItems.items.filter((item) => item.selected).length} Itens...
                </>
              ) : (
                `Gravar na Pauta (${
                  bulkItems.items.filter((item) => item.selected && item.matchedProductIds.length > 0).length
                } itens)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo secundário para seleção de produto de um item do lote */}
      <BulkLoadItemProductDialog
        activeItemIdx={bulkItems.activeItemIdx}
        onClose={() => bulkItems.setActiveItemIdx(null)}
        activeItem={bulkItems.activeItem}
        productSearch={productFilter.productSearch}
        onProductSearchChange={productFilter.setProductSearch}
        embalagemFilter={productFilter.embalagemFilter}
        onEmbalagemFilterChange={productFilter.setEmbalagemFilter}
        volumeFilter={productFilter.volumeFilter}
        onVolumeFilterChange={productFilter.setVolumeFilter}
        uniqueEmbalagens={productFilter.uniqueEmbalagens}
        filteredProducts={productFilter.filteredProducts}
        selectedProductsForActiveItem={productFilter.selectedProductsForActiveItem}
        onProductSelect={bulkItems.handleProductSelect}
        onRemoveProduct={bulkItems.handleRemoveProductFromActiveItem}
        onClearAll={bulkItems.handleClearAllForActiveItem}
      />
    </>
  );
}
