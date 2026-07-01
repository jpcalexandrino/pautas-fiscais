import { useState, useEffect, useMemo } from 'react';
import { Check, Search, Loader2, Info, SlidersHorizontal, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [embalagemFilter, setEmbalagemFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('');

  const uniqueEmbalagens = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => {
      if (p.embalagem) set.add(p.embalagem.toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [produtos]);

  useEffect(() => {
    setProductSearch('');
    setEmbalagemFilter('all');
    setVolumeFilter('');
  }, [activeItemIdx]);

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

  const filteredProducts = useMemo(() => {
    return produtos.filter((p) => {
      const normSearch = normalizeText(productSearch);
      const matchesSearch =
        normalizeText(p.descricao_interna).includes(normSearch) ||
        (p.gtin_13 && p.gtin_13.includes(normSearch));

      const matchesEmbalagem =
        embalagemFilter === 'all' ||
        (p.embalagem && p.embalagem.toUpperCase().trim() === embalagemFilter);

      const matchesVolume =
        !volumeFilter.trim() ||
        (() => {
          const normFilter = volumeFilter.toLowerCase().replace(/\s*(?:ml|g|l|kg)\b/gi, '').trim();
          const prodVolume = p.conteudo_volume ? String(p.conteudo_volume) : '';
          return (
            prodVolume.includes(normFilter) ||
            p.descricao_interna.toLowerCase().includes(volumeFilter.toLowerCase().trim())
          );
        })();

      return matchesSearch && matchesEmbalagem && matchesVolume;
    });
  }, [produtos, productSearch, embalagemFilter, volumeFilter]);

  const selectedProductsForActiveItem = useMemo(() => {
    if (!activeItem) return [];
    return produtos.filter((p) => activeItem.matchedProductIds.includes(p.id));
  }, [produtos, activeItem?.matchedProductIds]);

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
        <DialogContent className="sm:max-w-4xl max-w-4xl w-[92vw] h-[85vh] flex flex-col p-6 rounded-2xl gap-4 bg-background">
          <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between">
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
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-5 rounded-2xl space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/15 text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.75 rounded-full">
                        Item do Lote
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Descrição na Pauta:</span>
                      <h3 className="text-lg font-extrabold text-foreground leading-snug tracking-tight">
                        {activeItem.inferredDesc}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-primary/10 flex justify-between items-baseline">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Preço Detectado:</span>
                      <span className="text-2xl font-black text-primary">
                        R$ {activeItem.value.replace(/R\$\s*/i, '')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-background/50 dark:bg-background/20 p-3.5 rounded-xl border border-primary/10 text-xs">
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
                <div className="bg-muted/40 border p-3.5 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                      Filtros de Busca
                    </span>
                    {activeItem.matchedProductIds.length > 0 && (
                      <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        Selecionados: {activeItem.matchedProductIds.length}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
                    <Input
                      placeholder="Buscar por descrição interna ou GTIN..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 text-xs h-9 bg-background"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Embalagem</label>
                      <Select value={embalagemFilter} onValueChange={setEmbalagemFilter}>
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
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Volumetria (ex: 473 ml)</label>
                      <Input
                        placeholder="Filtrar volume..."
                        value={volumeFilter}
                        onChange={(e) => setVolumeFilter(e.target.value)}
                        className="text-xs h-8.5 bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* PRODUTOS SELECIONADOS (BADGES) */}
                {selectedProductsForActiveItem.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 border rounded-2xl animate-fade-in max-h-24 overflow-y-auto scrollbar-thin">
                    {selectedProductsForActiveItem.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-xl"
                      >
                        <span className="truncate max-w-[150px]">{p.descricao_interna}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductFromActiveItem(p.id)}
                          className="hover:bg-primary/20 p-0.5 rounded cursor-pointer shrink-0 transition-colors"
                        >
                          <X className="w-3 h-3 text-primary" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={handleClearAllForActiveItem}
                      className="text-[10px] font-bold text-destructive hover:text-destructive/80 transition-colors px-2 py-1 cursor-pointer ml-auto"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                )}

                {/* LISTA DE PRODUTOS */}
                <div className="flex-1 overflow-y-auto border rounded-2xl p-2 bg-background/50 divide-y divide-muted shadow-inner min-h-[180px]">
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
                        <button
                          key={p.id}
                          onClick={() => handleProductSelect(p.id)}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-all flex items-center justify-between leading-snug cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted/50 text-foreground/90'
                          }`}
                        >
                          <div className="pr-2 space-y-0.5">
                            <span className="font-semibold text-foreground block">{p.descricao_interna}</span>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              {p.gtin_13 && <span>GTIN: <strong className="text-foreground">{p.gtin_13}</strong></span>}
                              {p.embalagem && <span>Embalagem: <strong className="text-foreground">{p.embalagem}</strong></span>}
                              {p.conteudo_volume && <span>Volume: <strong className="text-foreground">{p.conteudo_volume} ml</strong></span>}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

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
