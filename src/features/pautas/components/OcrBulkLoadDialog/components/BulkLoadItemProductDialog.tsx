import { OcrAssociationDialog } from '../../OcrAssociationDialog';
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
  filteredProducts,
  onProductSelect,
}: BulkLoadItemProductDialogProps) {
  if (!activeItem) return null;

  return (
    <OcrAssociationDialog
      open={activeItemIdx !== null}
      onOpenChange={(open) => !open && onClose()}
      selectedCellData={{
        value: activeItem.value.replace(/R\$\s*/i, ''),
        inferredDesc: activeItem.inferredDesc,
        gtin: activeItem.gtin,
      }}
      produtos={filteredProducts}
      productSearch={productSearch}
      onProductSearchChange={onProductSearchChange}
      selectedProductIds={activeItem.matchedProductIds}
      setSelectedProductIds={(action) => {
        const nextIds = typeof action === 'function' ? action(activeItem.matchedProductIds) : action;
        // Identifica o ID selecionado ou desmarcado
        const added = nextIds.find((id) => !activeItem.matchedProductIds.includes(id));
        const removed = activeItem.matchedProductIds.find((id) => !nextIds.includes(id));
        if (added) onProductSelect(added);
        else if (removed) onProductSelect(removed);
        else if (nextIds.length === 0 && activeItem.matchedProductIds.length > 0) {
          activeItem.matchedProductIds.forEach((id) => onProductSelect(id));
        }
      }}
      onConfirm={onClose}
      title="Associar Produto do Lote"
      badgeLabel="Item do Lote"
      hideDeParaCheckbox={true}
      confirmText="Concluir"
    />
  );
}
