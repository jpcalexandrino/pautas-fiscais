import { Check, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import type { OcrBulkLoadDialogProps } from './OcrBulkLoadDialog/types';
import { useBulkLoadItems } from './OcrBulkLoadDialog/hooks/useBulkLoadItems';
import { useBulkProductFilter } from './OcrBulkLoadDialog/hooks/useBulkProductFilter';
import { BulkLoadItemProductDialog } from './OcrBulkLoadDialog/components/BulkLoadItemProductDialog';

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
        <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[75vw] flex flex-col max-h-[95vh] border border-muted/40 rounded-2xl">
          <DialogHeader className="pb-3 border-b border-muted/30">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              Carga em Lote - Tabela {tabela?.tabelaIndex}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mapeie múltiplos preços de uma vez. O sistema tentará sugerir o produto com base no catálogo e De-Para do estado.
            </DialogDescription>
          </DialogHeader>

          {/* Alert Informação */}
          <div className="text-xs text-muted-foreground bg-muted/20 border border-muted/30 p-3 rounded-lg flex items-start gap-2 mt-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <p>
              Itens já confirmados anteriormente serão omitidos da seleção de envio, mas podem ser vistos abaixo. Clique na linha para reassociar um produto.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto my-4 border border-muted/50 rounded-xl scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/10 border-b border-muted/30 sticky top-0 backdrop-blur-md">
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
                  <th className="p-3 font-bold text-muted-foreground uppercase tracking-wide text-xs">
                    Descrição Inferida (Estado)
                  </th>
                  <th className="p-3 w-28 font-bold text-muted-foreground uppercase tracking-wide text-xs">
                    Preço
                  </th>
                  <th className="p-3 font-bold text-muted-foreground uppercase tracking-wide text-xs">
                    Produto Associado
                  </th>
                  <th className="p-3 w-28 text-center font-bold text-muted-foreground uppercase tracking-wide text-xs">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/30">
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
                        className={`hover:bg-muted/10 transition-colors ${
                          item.confirmed ? 'opacity-50 bg-muted/5' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => bulkItems.handleToggleItem(idx)}
                            disabled={item.confirmed}
                          />
                        </td>
                        <td className="p-3 font-medium max-w-xs truncate" title={item.inferredDesc}>
                          {item.inferredDesc}
                        </td>
                        <td className="p-3 font-semibold text-primary">
                          R$ {item.value.replace(/R\$\s*/i, '')}
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => !item.confirmed && bulkItems.setActiveItemIdx(idx)}
                            className={`w-full text-left justify-start p-1.5 h-auto border border-muted/50 rounded hover:border-primary/40 hover:bg-muted/40 transition-colors font-medium truncate block max-w-md ${
                              item.confirmed ? 'cursor-not-allowed bg-muted/10' : 'cursor-pointer'
                            }`}
                          >
                            {matchedProds.length > 0
                              ? matchedProds.map((p) => p.descricao_interna).join(', ')
                              : '(Selecione um ou mais Produtos)'}
                          </Button>
                        </td>
                        <td className="p-3 text-center">
                          {item.confirmed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                              Importado
                            </span>
                          ) : item.matchType === 'de-para' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              De-Para
                            </span>
                          ) : item.matchType === 'fuzzy' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Sugerido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
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

          <div className="flex items-center space-x-2 pt-1 my-2">
            <Checkbox
              id="bulk-save-de-para"
              checked={bulkItems.saveDePara}
              onCheckedChange={(checked) => bulkItems.setSaveDePara(!!checked)}
            />
            <Label
              htmlFor="bulk-save-de-para"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Salvar associações no De-Para
            </Label>
          </div>

          <DialogFooter className="gap-2 mt-2 border-t border-muted/30 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={bulkItems.isSaving}
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
            >
              {bulkItems.isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
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
