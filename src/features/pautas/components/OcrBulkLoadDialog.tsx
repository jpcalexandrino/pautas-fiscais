import { useState, useEffect } from 'react';
import { Check, Search, AlertTriangle, Loader2, Info } from 'lucide-react';
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

interface DeParaItem {
  id: number;
  termo_descricao_estado: string;
  fk_produto: number;
}

interface BulkItem {
  cellKey: string;
  rowIdx: number;
  colIdx: number;
  inferredDesc: string;
  value: string;
  valorNum: number;
  matchedProductIds: number[];
  matchType: 'de-para' | 'fuzzy' | 'none';
  selected: boolean;
  confirmed: boolean;
}

interface OcrBulkLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  onConfirmBulk: (params: {
    fk_produtos: number[];
    uf: string;
    descricao_estado: string;
    valor_pauta: number;
    data_pauta: string;
    arquivo_origem: string;
    salvar_de_para: boolean;
    cell_key: string;
  }[]) => Promise<void>;
  isPriceCell: (value: string, header: string) => boolean;
  inferItemDescription: (row: string[], headers: string[], colIdx: number, uf: string) => string;
}

function normalizeText(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^0-9a-z ]/g, '');
}

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
  const [items, setItems] = useState<BulkItem[]>([]);
  const [saveDePara, setSaveDePara] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');

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
        if (isPriceCell(cell, header)) {
          const cellKey = `${tabela.tabelaIndex}-${rIdx}-${cIdx}`;
          const inferredDesc = inferItemDescription(row, tabela.headers, cIdx, uf);
          const isConfirmed = confirmedCells.has(cellKey);
          const cleanCell = cell.replace(/R\$\s*/i, '').trim();
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
        salvar_de_para: saveDePara,
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

  const filteredProducts = produtos.filter((p) => {
    const normSearch = normalizeText(productSearch);
    return (
      normalizeText(p.descricao_interna).includes(normSearch) ||
      (p.gtin_13 && p.gtin_13.includes(normSearch))
    );
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[75vw] flex flex-col max-h-[95vh] p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              Carga em Lote - Tabela {tabela?.tabelaIndex}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mapeie múltiplos preços de uma vez. O sistema tentará sugerir o produto com base no catálogo e De-Para do estado.
            </DialogDescription>
          </DialogHeader>

          {/* Alert Informação */}
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 p-3 rounded-md flex items-start gap-2 mt-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Itens já confirmados anteriormente serão omitidos da seleção de envio, mas podem ser vistos abaixo. Clique na linha para reassociar um produto.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto my-4 border rounded-md scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-muted sticky top-0">
                  <th className="p-3 w-10 text-center">
                    <Checkbox
                      checked={
                        items.length > 0 &&
                        items.filter((item) => !item.confirmed).every((item) => item.selected)
                      }
                      onCheckedChange={(checked) => handleToggleSelectAll(!!checked)}
                      disabled={items.filter((item) => !item.confirmed).length === 0}
                    />
                  </th>
                  <th className="p-3">Descrição Inferida (Estado)</th>
                  <th className="p-3 w-28">Preço</th>
                  <th className="p-3">Produto Associado</th>
                  <th className="p-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/60">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Nenhum preço encontrado nesta tabela.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
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
                            onCheckedChange={() => handleToggleItem(idx)}
                            disabled={item.confirmed}
                          />
                        </td>
                        <td className="p-3 font-medium max-w-xs truncate" title={item.inferredDesc}>
                          {item.inferredDesc}
                        </td>
                        <td className="p-3 font-semibold text-primary">R$ {item.value.replace(/R\$\s*/i, '')}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => !item.confirmed && setActiveItemIdx(idx)}
                            className={`w-full text-left p-1.5 border rounded hover:border-primary/50 transition-all font-medium truncate block max-w-md ${
                              item.confirmed ? 'cursor-not-allowed bg-muted/20' : 'cursor-pointer'
                            }`}
                          >
                            {matchedProds.length > 0
                              ? matchedProds.map((p) => p.descricao_interna).join(', ')
                              : '(Selecione um ou mais Produtos)'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          {item.confirmed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              Importado
                            </span>
                          ) : item.matchType === 'de-para' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              De-Para
                            </span>
                          ) : item.matchType === 'fuzzy' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Sugerido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
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
              checked={saveDePara}
              onCheckedChange={(checked) => setSaveDePara(!!checked)}
            />
            <label
              htmlFor="bulk-save-de-para"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Salvar associações no De-Para
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveBulk}
              disabled={
                isSaving ||
                items.filter((item) => item.selected && item.matchedProductIds.length > 0).length === 0
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Gravando {items.filter((item) => item.selected).length} Itens...
                </>
              ) : (
                `Gravar na Pauta (${items.filter((item) => item.selected && item.matchedProductIds.length > 0).length} itens)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog secundário para seleção de produto de uma linha */}
      <Dialog open={activeItemIdx !== null} onOpenChange={(open) => !open && setActiveItemIdx(null)}>
        <DialogContent className="max-w-md flex flex-col max-h-[80vh] p-5">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Associar Produto
            </DialogTitle>
            <DialogDescription className="text-[11px] truncate">
              Associação para: {activeItem?.inferredDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nome ou GTIN..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-8 text-xs h-8"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md p-1 bg-background/50 divide-y divide-muted max-h-56 scrollbar-thin">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = activeItem?.matchedProductIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProductSelect(p.id)}
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

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setActiveItemIdx(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
