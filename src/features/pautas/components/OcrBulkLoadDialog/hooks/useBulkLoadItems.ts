import { useState, useEffect } from 'react';
import type { BulkItem, Produto, DeParaItem } from '../types';
import { normalizeText, cleanPriceString } from '../../../utils/ocrHelpers';

interface UseBulkLoadItemsProps {
  open: boolean;
  tabela: {
    tabelaIndex: number;
    pagina: number;
    headers: string[];
    indexedRows: { data: string[]; originalIndex: number }[];
  } | null;
  produtos: Produto[];
  deParas: DeParaItem[];
  uf: string;
  dataPauta: string;
  filename: string;
  confirmedCells: Set<string>;
  onConfirmBulk: (params: any[]) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  isPriceCell: (value: string, header: string, colIdx?: number) => boolean;
  inferItemDescription: (row: string[], headers: string[], colIdx: number, uf: string) => string;
}

export function useBulkLoadItems({
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
}: UseBulkLoadItemsProps) {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [saveDePara, setSaveDePara] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);

  // Processa as linhas da tabela ao abrir o modal ou mudar a tabela
  useEffect(() => {
    if (!open || !tabela) {
      setItems([]);
      setActiveItemIdx(null);
      return;
    }

    const processedItems: BulkItem[] = [];

    tabela.indexedRows.forEach((rowObj) => {
      const { data: row, originalIndex: rIdx } = rowObj;
      row.forEach((cell, cIdx) => {
        const header = tabela.headers[cIdx] || '';
        if (isPriceCell(cell, header, cIdx)) {
          const cellKey = `${tabela.tabelaIndex}-${rIdx}-${cIdx}`;
          const inferredDesc = inferItemDescription(row, tabela.headers, cIdx, uf);
          const isConfirmed = confirmedCells.has(cellKey);
          const cleanCell = cleanPriceString(cell);
          const valorNum = parseFloat(cleanCell.replace(',', '.'));

          // Procura primeiro no De-Para
          const normInferred = normalizeText(inferredDesc);
          const exactDeParaMatches = deParas.filter(
            (dp) => normalizeText(dp.termo_descricao_estado) === normInferred
          );

          let matchedProductIds: number[] = [];
          let matchType: 'de-para' | 'fuzzy' | 'none' = 'none';

          if (exactDeParaMatches.length > 0) {
            matchedProductIds = exactDeParaMatches.map((dp) => dp.fk_produto);
            matchType = 'de-para';
          } else {
            // Fuzzy search contra catálogo de produtos
            const bestMatch = produtos
              .map((p) => {
                const normInternal = normalizeText(p.descricao_interna);
                const score = normInferred.split(/\s+/).reduce((acc, word) => {
                  if (word.length >= 3 && normInternal.includes(word)) {
                    return acc + 1;
                  }
                  return acc;
                }, 0);
                return { p, score };
              })
              .filter((m) => m.score > 0)
              .sort((a, b) => b.score - a.score)[0];

            if (bestMatch) {
              matchedProductIds = [bestMatch.p.id];
              matchType = 'fuzzy';
            }
          }

          processedItems.push({
            cellKey,
            rowIdx: rIdx,
            colIdx: cIdx,
            inferredDesc,
            value: cell,
            valorNum,
            matchedProductIds,
            matchType,
            confirmed: isConfirmed,
            selected: !isConfirmed && matchedProductIds.length > 0,
          });
        }
      });
    });

    setItems(processedItems);
  }, [open, tabela, deParas, produtos, uf]);

  const handleToggleSelectAll = (checked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.confirmed ? item : { ...item, selected: checked }))
    );
  };

  const handleToggleItem = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleProductSelect = (productId: number) => {
    if (activeItemIdx === null) return;
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== activeItemIdx) return item;
        const exists = item.matchedProductIds.includes(productId);
        const newIds = exists
          ? item.matchedProductIds.filter((id) => id !== productId)
          : [...item.matchedProductIds, productId];
        return {
          ...item,
          matchedProductIds: newIds,
          matchType: item.matchType === 'de-para' ? 'de-para' : 'fuzzy',
          selected: newIds.length > 0,
        };
      })
    );
  };

  const handleRemoveProductFromActiveItem = (id: number) => {
    if (activeItemIdx === null) return;
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== activeItemIdx) return item;
        const newIds = item.matchedProductIds.filter((val) => val !== id);
        return {
          ...item,
          matchedProductIds: newIds,
          selected: newIds.length > 0,
        };
      })
    );
  };

  const handleClearAllForActiveItem = () => {
    if (activeItemIdx === null) return;
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== activeItemIdx) return item;
        return {
          ...item,
          matchedProductIds: [],
          selected: false,
        };
      })
    );
  };

  const handleSaveBulk = async () => {
    const selectedItems = items.filter((item) => item.selected && item.matchedProductIds.length > 0);
    if (selectedItems.length === 0) return;

    setIsSaving(true);
    try {
      const payloads = selectedItems.map((item) => ({
        fk_produtos: item.matchedProductIds,
        uf,
        descricao_estado: item.inferredDesc,
        valor_pauta: item.valorNum,
        data_pauta: dataPauta,
        arquivo_origem: filename,
        salvar_de_para: saveDePara && item.matchType !== 'de-para',
        cell_key: item.cellKey,
      }));

      await onConfirmBulk(payloads);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const activeItem = activeItemIdx !== null ? items[activeItemIdx] : null;

  return {
    items,
    saveDePara,
    setSaveDePara,
    isSaving,
    activeItemIdx,
    setActiveItemIdx,
    activeItem,
    handleToggleSelectAll,
    handleToggleItem,
    handleProductSelect,
    handleRemoveProductFromActiveItem,
    handleClearAllForActiveItem,
    handleSaveBulk,
  };
}
