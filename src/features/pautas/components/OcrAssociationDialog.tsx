import { useState, useMemo } from 'react';
import { Search, Check, Package, Layers, SlidersHorizontal, ArrowRight, Info, AlertCircle, X, Barcode, Maximize2, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { extractGtin } from '../utils/ocrHelpers';

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
    tabelaIdx?: number;
    rIdx?: number;
    cIdx?: number;
    value: string;
    inferredDesc: string;
  } | null;
  produtos: Produto[];
  saveDePara?: boolean;
  onSaveDeParaChange?: (checked: boolean) => void;
  onConfirm: () => void;
  isSaving?: boolean;
  productSearch: string;
  onProductSearchChange: (s: string) => void;
  selectedProductIds: number[];
  setSelectedProductIds: (ids: number[] | ((prev: number[]) => number[])) => void;
  contexto?: string;
  title?: string;
  badgeLabel?: string;
  hideDeParaCheckbox?: boolean;
  confirmText?: string;
}

export function OcrAssociationDialog({
  open,
  onOpenChange,
  selectedCellData,
  produtos,
  saveDePara = false,
  onSaveDeParaChange,
  onConfirm,
  isSaving = false,
  productSearch,
  onProductSearchChange,
  selectedProductIds,
  setSelectedProductIds,
  contexto = 'proprio',
  title = 'Associação e Mapeamento de Produto',
  badgeLabel = 'Item Identificado',
  hideDeParaCheckbox = false,
  confirmText = 'Gravar na Pauta',
}: OcrAssociationDialogProps) {
  
  // Filtros adicionais
  const [embalagemFilter, setEmbalagemFilter] = useState<string>('all');
  const [volumeFilter, setVolumeFilter] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const detectedGtin = useMemo(() => {
    return selectedCellData ? ((selectedCellData as any).gtin || extractGtin(selectedCellData.inferredDesc)) : null;
  }, [selectedCellData]);

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
      <DialogContent className={`flex flex-col bg-background shadow-xl transition-all duration-200 ${
        isFullScreen 
          ? '!w-screen !h-screen !max-w-none !max-h-none !left-0 !top-0 !translate-x-0 !translate-y-0 !rounded-none !border-none p-6 gap-4' 
          : 'sm:max-w-6xl max-w-6xl w-[95vw] h-[85vh] rounded-xl border border-border/60 gap-4'
      }`}>
        <DialogHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
              <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <Layers className="w-5 h-5" />
              </span>
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Associe a descrição capturada na pauta do estado ao produto correspondente do catálogo no contexto <strong className="text-foreground capitalize">{contexto}</strong>.
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

        {selectedCellData && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 py-1">
            
            {/* COLUNA ESQUERDA - DESTAQUE DO ITEM DA PAUTA */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-primary/[0.02] dark:bg-primary/[0.03] border border-primary/15 p-5 rounded-xl space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-primary/15 text-primary text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-xl">
                      {badgeLabel}
                    </span>

                    {detectedGtin && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold px-2.5 py-0.5 rounded-xl">
                        <Barcode className="w-3 h-3 shrink-0" />
                        GTIN: {detectedGtin}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descrição na Pauta:</span>
                    <h3 className="text-base font-bold text-foreground leading-snug tracking-tight">
                      {selectedCellData.inferredDesc}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-primary/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preço Detectado:</span>
                    <span className="text-xl font-extrabold text-primary">
                      R$ {selectedCellData.value}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-background/50 dark:bg-background/20 p-3 rounded-xl border border-primary/10 text-xs">
                  <div className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      Esta associação vincula a descrição acima ao(s) produto(s) selecionado(s) para futuras leituras desta UF.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA - SELEÇÃO DE PRODUTOS DO CATÁLOGO */}
            <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
              
              {/* FILTROS */}
              <div className="bg-card border border-border/50 p-4 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    Filtros de Busca
                  </span>
                  {selectedProductIds.length > 0 && (
                    <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-xl font-semibold text-[10px] border border-emerald-500/20">
                      Selecionados: {selectedProductIds.length}
                    </span>
                  )}
                </div>

                {/* Filtro textual principal */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/55" />
                  <Input
                    placeholder="Buscar por descrição interna ou GTIN..."
                    value={productSearch}
                    onChange={(e) => onProductSearchChange(e.target.value)}
                    className="pl-8 text-xs h-7.5 bg-background border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                {/* Filtros adicionais: Embalagem e Volumetria */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Embalagem</Label>
                    <Select value={embalagemFilter} onValueChange={setEmbalagemFilter}>
                      <SelectTrigger className="h-7.5 text-xs bg-background rounded-xl border-border/60 px-2.5">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="text-xs rounded-lg">Todas as embalagens</SelectItem>
                        {uniqueEmbalagens.map((emb) => (
                          <SelectItem key={emb} value={emb} className="text-xs rounded-lg">
                            {emb}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Volumetria (ex: 473 ml)</Label>
                    <Input
                      placeholder="Filtrar volume..."
                      value={volumeFilter}
                      onChange={(e) => setVolumeFilter(e.target.value)}
                      className="text-xs h-7.5 bg-background border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-primary px-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* PRODUTOS SELECIONADOS (BADGES) */}
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 border border-border/40 rounded-xl animate-fade-in max-h-24 overflow-y-auto scrollbar-thin">
                  {selectedProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-xl border border-primary/20"
                    >
                      <span className="truncate max-w-[150px]">{p.descricao_interna}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveProduct(p.id)}
                        className="hover:bg-primary/20 p-0.5 rounded-md cursor-pointer shrink-0 transition-colors h-4 w-4"
                      >
                        <X className="w-3 h-3 text-primary" />
                      </Button>
                    </span>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleClearAll}
                    className="text-[10px] font-semibold text-destructive hover:text-destructive/80 hover:bg-transparent transition-colors px-2 py-1 cursor-pointer ml-auto h-auto"
                  >
                    Desmarcar Todos
                  </Button>
                </div>
              )}

              {/* LISTA DE PRODUTOS */}
              <div className="flex-1 overflow-y-auto border border-border/50 rounded-xl bg-card divide-y divide-border/30 min-h-[180px]">
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
                      <Button
                        key={p.id}
                        variant="ghost"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        }}
                        className={`w-full text-left justify-between px-4 py-2.5 text-xs h-auto transition-all flex items-center leading-snug cursor-pointer rounded-none border-b border-border/20 ${
                          isSelected
                            ? 'bg-primary/[0.05] text-primary font-semibold hover:bg-primary/[0.08]'
                            : 'hover:bg-muted/30 text-foreground/90'
                        }`}
                      >
                        <div className="pr-4 space-y-0.5">
                          <div className="font-semibold text-foreground/95 flex items-center gap-1.5 flex-wrap">
                            {p.descricao_interna}
                            {detectedGtin && p.gtin_13 && extractGtin(p.gtin_13) === detectedGtin && (
                              <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.25 rounded-md">
                                GTIN
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                            {p.gtin_13 && (
                              <span className={`font-medium ${detectedGtin && extractGtin(p.gtin_13) === detectedGtin ? 'text-emerald-600 font-bold' : ''}`}>
                                GTIN: {p.gtin_13}
                              </span>
                            )}
                            {p.embalagem && (
                              <span className="bg-muted px-1.5 py-0.25 rounded-md text-[9px] uppercase font-semibold text-muted-foreground">
                                {p.embalagem}
                              </span>
                            )}
                            {p.conteudo_volume && (
                              <span className="bg-primary/10 text-primary px-1.5 py-0.25 rounded-md text-[9px] font-semibold">
                                {p.conteudo_volume} ml/g
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-primary border-primary text-primary-foreground shadow-2xs' 
                            : 'border-border/60 bg-background'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </Button>
                    );
                  })
                )}
              </div>

              {/* CHECKBOX DE-PARA */}
              {!hideDeParaCheckbox && (
                <div className="flex items-center space-x-2.5 px-3 py-2 bg-muted/20 border border-border/40 rounded-xl">
                  <Checkbox
                    id="save-de-para"
                    checked={saveDePara}
                    onCheckedChange={(checked) => onSaveDeParaChange?.(!!checked)}
                    className="cursor-pointer"
                  />
                  <Label
                    htmlFor="save-de-para"
                    className="text-xs text-muted-foreground font-medium leading-tight cursor-pointer select-none"
                  >
                    Salvar associação de descrição no histórico De-Para de automação
                  </Label>
                </div>
              )}

            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border/40 gap-1.5 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving} className="h-7 px-2.5 text-xs cursor-pointer">
            Cancelar
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={selectedProductIds.length === 0 || isSaving} className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer shadow-2xs">
            {isSaving ? (
              <>
                <Spinner className="w-3 h-3 animate-spin mr-1" />
                Gravando...
              </>
            ) : (
              <>
                {confirmText}
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
