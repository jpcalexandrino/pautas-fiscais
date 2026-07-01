import { useState, useMemo } from 'react';
import { Search, Check, Package, Layers, SlidersHorizontal, ArrowRight, Info, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Produto {
  id: number;
  descricao_interna: string;
  gtin_13?: string;
  embalagem?: string;
  conteudo_volume?: number;
  tipo?: string;
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
  contexto?: string;
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
  contexto = 'proprio',
}: OcrAssociationDialogProps) {
  
  // Filtros adicionais
  const [embalagemFilter, setEmbalagemFilter] = useState<string>('all');
  const [volumeFilter, setVolumeFilter] = useState<string>('');

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Obtém lista de embalagens únicas no catálogo para popular o select de filtro
  const uniqueEmbalagens = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach(p => {
      if (p.embalagem) set.add(p.embalagem.toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [produtos]);

  const normProductSearch = normalize(productSearch);

  const filteredProducts = useMemo(() => {
    return produtos.filter((p) => {
      // 1. Filtro de pesquisa (nome ou GTIN)
      const matchesSearch = normalize(p.descricao_interna).includes(normProductSearch) ||
        (p.gtin_13 && p.gtin_13.includes(normProductSearch));

      // 2. Filtro de Embalagem
      const matchesEmbalagem = embalagemFilter === 'all' || 
        (p.embalagem && p.embalagem.toUpperCase().trim() === embalagemFilter.toUpperCase().trim());

      // 3. Filtro de Volume/Volumetria (ex: "473 ml" ou "473")
      const matchesVolume = !volumeFilter.trim() || (() => {
        const normFilter = volumeFilter.toLowerCase().replace(/\s*(?:ml|g|l|kg)\b/gi, '').trim();
        const prodVolume = p.conteudo_volume ? String(p.conteudo_volume) : '';
        return prodVolume.includes(normFilter) || 
               p.descricao_interna.toLowerCase().includes(volumeFilter.toLowerCase().trim());
      })();

      return matchesSearch && matchesEmbalagem && matchesVolume;
    });
  }, [produtos, normProductSearch, embalagemFilter, volumeFilter]);

  const selectedProducts = useMemo(() => {
    return produtos.filter((p) => selectedProductIds.includes(p.id));
  }, [produtos, selectedProductIds]);

  const handleRemoveProduct = (id: number) => {
    setSelectedProductIds(selectedProductIds.filter((val) => val !== id));
  };

  const handleClearAll = () => {
    setSelectedProductIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-w-6xl w-[95vw] h-[85vh] flex flex-col p-6 rounded-2xl gap-4 bg-background">
        <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Layers className="w-5 h-5" />
              </span>
              Associação e Mapeamento de Produto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Associe a descrição capturada na pauta do estado ao produto correspondente do catálogo no contexto <strong className="text-foreground capitalize">{contexto}</strong>.
            </DialogDescription>
          </div>
        </DialogHeader>

        {selectedCellData && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
            
            {/* COLUNA ESQUERDA - DESTAQUE DO ITEM DA PAUTA (4 colunas) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-5 rounded-2xl space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/15 text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.75 rounded-full">
                      Item Identificado
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Descrição na Pauta:</span>
                    <h3 className="text-lg font-extrabold text-foreground leading-snug tracking-tight">
                      {selectedCellData.inferredDesc}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-primary/10 flex justify-between items-baseline">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Preço Detectado:</span>
                    <span className="text-2xl font-black text-primary">
                      R$ {selectedCellData.value}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 bg-background/50 dark:bg-background/20 p-3.5 rounded-xl border border-primary/10 text-xs">
                  <div className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      Esta associação vincula permanentemente a descrição acima ao(s) produto(s) selecionado(s) à direita para as pautas futuras desta UF.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA - SELEÇÃO DE PRODUTOS DO CATÁLOGO (7 colunas) */}
            <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
              
              {/* FILTROS */}
              <div className="bg-muted/40 border p-3.5 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                    Filtros de Busca
                  </span>
                  {selectedProductIds.length > 0 && (
                    <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px] animate-fade-in">
                      Selecionados: {selectedProductIds.length}
                    </span>
                  )}
                </div>

                {/* Filtro textual principal */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
                  <Input
                    placeholder="Buscar por descrição interna ou GTIN..."
                    value={productSearch}
                    onChange={(e) => onProductSearchChange(e.target.value)}
                    className="pl-9 text-xs h-9 bg-background"
                  />
                </div>

                {/* Filtros adicionais: Embalagem e Volumetria */}
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
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 border rounded-2xl animate-fade-in max-h-24 overflow-y-auto scrollbar-thin">
                  {selectedProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-xl"
                    >
                      <span className="truncate max-w-[150px]">{p.descricao_interna}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(p.id)}
                        className="hover:bg-primary/20 p-0.5 rounded cursor-pointer shrink-0 transition-colors"
                      >
                        <X className="w-3 h-3 text-primary" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearAll}
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
                        className={`w-full text-left px-4 py-2.5 text-xs transition-all flex items-center justify-between leading-snug cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-muted/50 text-foreground/90'
                        }`}
                      >
                        <div className="pr-4 space-y-0.5">
                          <div className="font-semibold text-foreground/95 flex items-center gap-1.5">
                            {p.descricao_interna}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                            {p.gtin_13 && <span className="font-medium">GTIN: {p.gtin_13}</span>}
                            {p.embalagem && (
                              <span className="bg-muted px-1.5 py-0.25 rounded text-[9px] uppercase font-bold text-muted-foreground/80">
                                {p.embalagem}
                              </span>
                            )}
                            {p.conteudo_volume && (
                              <span className="bg-primary/10 text-primary px-1.5 py-0.25 rounded text-[9px] font-bold">
                                {p.conteudo_volume} ml/g
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-primary border-primary text-primary-foreground shadow-xs' 
                            : 'border-muted-foreground/35 bg-background'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* CHECKBOX DE-PARA */}
              <div className="flex items-center space-x-2.5 px-1 py-1 bg-muted/20 border border-dashed rounded-xl p-3">
                <Checkbox
                  id="save-de-para"
                  checked={saveDePara}
                  onCheckedChange={(checked) => onSaveDeParaChange(!!checked)}
                  className="cursor-pointer"
                />
                <label
                  htmlFor="save-de-para"
                  className="text-xs text-muted-foreground font-medium leading-tight cursor-pointer select-none"
                >
                  Salvar associação de descrição no histórico De-Para de automação
                </label>
              </div>

            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-3 gap-2 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving} className="cursor-pointer">
            Cancelar
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={selectedProductIds.length === 0 || isSaving} className="gap-1.5 cursor-pointer shadow-md">
            {isSaving ? (
              <>
                <Spinner className="w-4 h-4 animate-spin mr-1" />
                Gravando...
              </>
            ) : (
              <>
                Gravar na Pauta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
