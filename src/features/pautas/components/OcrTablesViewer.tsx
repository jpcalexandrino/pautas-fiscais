import { useState, useEffect, type ReactNode, useMemo } from 'react';
import { HelpCircle, Info, Save, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BRAND_SLUGS } from '@shared/utils/constants';
import { useTerms } from '@features/settings/hooks/useTerms';
import { OcrToolbar } from './OcrToolbar';
import { OcrTableCard } from './OcrTableCard';
import { OcrAssociationDialog } from './OcrAssociationDialog';
import { OcrBulkLoadDialog } from './OcrBulkLoadDialog';
import { useDePara } from '@features/de-para/hooks/useDePara';
import {
  priceRegex,
  normalizeForSearch,
  normalizeText,
  inferItemDescription,
  calculateProductMatchScore,
} from '../utils/ocrHelpers';

export interface EstruturaTabela {
  tabelaIndex: number;
  pagina: number;
  headers: string[];
  rows: string[][];
}

export interface IndexedRow {
  data: string[];
  originalIndex: number;
}

interface Produto {
  id: number;
  descricao_interna: string;
  gtin_13?: string;
  embalagem?: string;
  conteudo_volume?: number;
}

interface OcrTablesViewerProps {
  tabelas: EstruturaTabela[];
  isLoading: boolean;
  filename: string;
  produtos: Produto[];
  uf: string;
  dataPauta: string;
  dbConfirmedCells?: string[];
  onConfirmManual: (params: {
    fk_produtos: number[];
    uf: string;
    descricao_estado: string;
    valor_pauta: number;
    data_pauta: string;
    arquivo_origem: string;
    salvar_de_para: boolean;
    cell_key?: string;
    contexto?: string;
  }) => Promise<any>;
  updateOcrTables?: (params: { filename: string; tabelas: any[]; contexto?: string }) => Promise<any>;
  isUpdatingOcrTables?: boolean;
  contexto?: string;
}

// Helper functions and regex are now imported from ../utils/ocrHelpers

export function OcrTablesViewer({
  tabelas,
  isLoading,
  filename,
  produtos,
  uf,
  dataPauta,
  dbConfirmedCells,
  onConfirmManual,
  updateOcrTables,
  isUpdatingOcrTables = false,
  contexto = 'proprio',
}: OcrTablesViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmedCells, setConfirmedCells] = useState<Set<string>>(new Set());
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [localTabelas, setLocalTabelas] = useState<EstruturaTabela[]>([]);

  const [inlineEditingCell, setInlineEditingCell] = useState<{
    tabelaIdx: number;
    rIdx: number;
    cIdx: number;
    value: string;
  } | null>(null);

  const [inlineEditingHeader, setInlineEditingHeader] = useState<{
    tabelaIdx: number;
    cIdx: number;
    value: string;
  } | null>(null);

  // Sincroniza a cópia local quando tabelas mudam
  useEffect(() => {
    setLocalTabelas(tabelas);
  }, [tabelas]);
  const [filterBrandOnly, setFilterBrandOnly] = useState(true);

  // Sincroniza as células confirmadas salvas no banco
  useEffect(() => {
    if (dbConfirmedCells) {
      setConfirmedCells(new Set(dbConfirmedCells));
    } else {
      setConfirmedCells(new Set());
    }
  }, [dbConfirmedCells, filename]);

  const { items: deParas } = useDePara(uf);

  // Estados para o Modal de Associação
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState<{
    tabelaIdx: number;
    rIdx: number;
    cIdx: number;
    value: string;
    inferredDesc: string;
  } | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [saveDePara, setSaveDePara] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para a Carga em Lote
  const [bulkLoadOpen, setBulkLoadOpen] = useState(false);
  const [selectedBulkTable, setSelectedBulkTable] = useState<any | null>(null);

  const normalizedSearch = normalizeForSearch(searchTerm);

  const filteredCatalogProducts = useMemo(() => {
    return produtos.filter((p: any) => (p.tipo || 'proprio') === contexto);
  }, [produtos, contexto]);

  const { terms } = useTerms(contexto);
  const activeSlugs = useMemo(() => {
    if (terms && terms.length > 0) {
      return terms.map((t) => t.termo);
    }
    return BRAND_SLUGS;
  }, [terms]);

  const rowMatchesBrand = (row: string[]) => {
    return row.some((cell) => {
      const cellNorm = normalizeForSearch(cell);
      return activeSlugs.some((slug) => cellNorm.includes(normalizeForSearch(slug)));
    });
  };

  const tableHasBrand = (tabela: EstruturaTabela) => {
    return tabela.rows.some(rowMatchesBrand);
  };

  const highlightText = (text: string, search: string): ReactNode => {
    if (!search.trim()) return text;
    
    const normText = normalizeForSearch(text);
    const normSearch = normalizeForSearch(search);
    
    const index = normText.indexOf(normSearch);
    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + search.length);
    const after = text.substring(index + search.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-400/30 text-yellow-900 dark:text-yellow-100 dark:bg-yellow-500/30 px-0.5 rounded font-medium">
          {match}
        </mark>
        {highlightText(after, search)}
      </>
    );
  };

  const isPriceCell = (value: string, header: string) => {
    const normHeader = header.toUpperCase();
    if (normHeader === 'ITEM' || normHeader === 'CNPJ_FABRICANTE' || normHeader === 'COD_FABRICANTE' || normHeader === 'NCM') {
      return false;
    }
    return priceRegex.test(value);
  };

  const handleToggleEditingMode = () => {
    if (isEditingMode) {
      setLocalTabelas(tabelas);
      setIsEditingMode(false);
    } else {
      setLocalTabelas(JSON.parse(JSON.stringify(tabelas)));
      setIsEditingMode(true);
    }
  };

  const handleCellEdit = (tabelaIdx: number, rIdx: number, cIdx: number, value: string) => {
    setLocalTabelas(prev => prev.map(t => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newRows = [...t.rows];
      newRows[rIdx] = [...newRows[rIdx]];
      newRows[rIdx][cIdx] = value;
      return { ...t, rows: newRows };
    }));
  };

  const handleHeaderEdit = (tabelaIdx: number, cIdx: number, value: string) => {
    setLocalTabelas(prev => prev.map(t => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newHeaders = [...t.headers];
      newHeaders[cIdx] = value;
      return { ...t, headers: newHeaders };
    }));
  };

  const handleDeleteRow = (tabelaIdx: number, rIdx: number) => {
    setLocalTabelas(prev => prev.map(t => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newRows = t.rows.filter((_, idx) => idx !== rIdx);
      return { ...t, rows: newRows };
    }));

    setConfirmedCells(prev => {
      const next = new Set<string>();
      prev.forEach(key => {
        const parts = key.split('-');
        if (parts.length === 3) {
          const tIdx = parseInt(parts[0], 10);
          const rowIdx = parseInt(parts[1], 10);
          const colIdx = parseInt(parts[2], 10);

          if (tIdx === tabelaIdx) {
            if (rowIdx < rIdx) {
              next.add(key);
            } else if (rowIdx > rIdx) {
              next.add(`${tIdx}-${rowIdx - 1}-${colIdx}`);
            }
          } else {
            next.add(key);
          }
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  const handleDeleteTable = (tabelaIdx: number) => {
    setLocalTabelas(prev => prev.filter(t => t.tabelaIndex !== tabelaIdx));

    setConfirmedCells(prev => {
      const next = new Set<string>();
      prev.forEach(key => {
        const parts = key.split('-');
        if (parts.length === 3) {
          const tIdx = parseInt(parts[0], 10);
          if (tIdx !== tabelaIdx) {
            next.add(key);
          }
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  const handleAddRow = (tabelaIdx: number) => {
    setLocalTabelas(prev => prev.map(t => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newRow = Array(t.headers.length).fill('');
      return { ...t, rows: [...t.rows, newRow] };
    }));
  };

  const handleSaveEdits = async () => {
    if (!updateOcrTables) return;
    try {
      await updateOcrTables({ 
        filename, 
        tabelas: localTabelas, 
        confirmedCells: Array.from(confirmedCells), 
        contexto 
      });
      toast.success('Tabelas atualizadas com sucesso!');
      setIsEditingMode(false);
    } catch (err: any) {
      toast.error('Erro ao salvar alterações', {
        description: err.message || 'Erro inesperado.',
      });
    }
  };

  const handleSaveInlineCell = async (tabelaIdx: number, rIdx: number, cIdx: number, value: string) => {
    const updatedTabelas = localTabelas.map(t => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newRows = [...t.rows];
      newRows[rIdx] = [...newRows[rIdx]];
      newRows[rIdx][cIdx] = value;
      return { ...t, rows: newRows };
    });
    setLocalTabelas(updatedTabelas);

    if (updateOcrTables) {
      try {
        await updateOcrTables({ 
          filename, 
          tabelas: updatedTabelas, 
          confirmedCells: Array.from(confirmedCells), 
          contexto 
        });
        toast.success('Célula atualizada com sucesso!');
      } catch (err: any) {
        toast.error('Erro ao salvar alteração', {
          description: err.message || 'Erro inesperado.',
        });
        setLocalTabelas(tabelas);
      }
    }
    setInlineEditingCell(null);
  };

  const handleSaveInlineHeader = async (tabelaIdx: number, cIdx: number, value: string) => {
    const updatedTabelas = localTabelas.map(t => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newHeaders = [...t.headers];
      newHeaders[cIdx] = value;
      return { ...t, headers: newHeaders };
    });
    setLocalTabelas(updatedTabelas);

    if (updateOcrTables) {
      try {
        await updateOcrTables({ 
          filename, 
          tabelas: updatedTabelas, 
          confirmedCells: Array.from(confirmedCells), 
          contexto 
        });
        toast.success('Cabeçalho atualizado com sucesso!');
      } catch (err: any) {
        toast.error('Erro ao salvar alteração', {
          description: err.message || 'Erro inesperado.',
        });
        setLocalTabelas(tabelas);
      }
    }
    setInlineEditingHeader(null);
  };

  const handleCellClick = (tabelaIdx: number, rIdx: number, cIdx: number, value: string, row: string[], headers: string[]) => {
    if (!dataPauta) {
      toast.warning('Atenção', {
        description: 'Selecione a Data de Vigência da Pauta no topo antes de fazer a associação manual.',
      });
      return;
    }

    const inferredDesc = inferItemDescription(row, headers, cIdx, uf);
    
    setSelectedCellData({
      tabelaIdx,
      rIdx,
      cIdx,
      value,
      inferredDesc,
    });

    const normInferred = normalizeText(inferredDesc);
    const exactDeParaMatches = deParas.filter(
      (dp: any) => normalizeText(dp.termo_descricao_estado) === normInferred
    );

    if (exactDeParaMatches.length > 0) {
      setSelectedProductIds(exactDeParaMatches.map((dp: any) => dp.fk_produto));
      setSaveDePara(false);
    } else {
      const bestMatch = filteredCatalogProducts
        .map(p => ({
          p,
          score: calculateProductMatchScore(inferredDesc, p)
        }))
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)[0];

      setSelectedProductIds(bestMatch ? [bestMatch.p.id] : []);
      setSaveDePara(true);
    }
    setProductSearch('');
    setModalOpen(true);
  };

  const handleConfirmAssociation = async () => {
    if (!selectedCellData || selectedProductIds.length === 0) return;

    setIsSaving(true);
    const cellKey = `${selectedCellData.tabelaIdx}-${selectedCellData.rIdx}-${selectedCellData.cIdx}`;
    
    try {
      const cleanValue = selectedCellData.value.replace(/R\$\s*/i, '').trim();
      const valorNum = parseFloat(cleanValue.replace(',', '.'));
      
      await onConfirmManual({
        fk_produtos: selectedProductIds,
        uf,
        descricao_estado: selectedCellData.inferredDesc,
        valor_pauta: valorNum,
        data_pauta: dataPauta,
        arquivo_origem: filename,
        salvar_de_para: saveDePara,
        cell_key: cellKey,
        contexto: contexto
      });

      setConfirmedCells((prev) => {
        const next = new Set(prev);
        next.add(cellKey);
        return next;
      });

      toast.success('Pauta Gravada', {
        description: `Preço R$ ${valorNum.toFixed(2)} associado com sucesso.`,
      });
      setModalOpen(false);
    } catch (err: any) {
      toast.error('Erro ao gravar', {
        description: err.message || 'Falha ao processar requisição.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkLoadClick = (tabela: any) => {
    if (!dataPauta) {
      toast.warning('Atenção', {
        description: 'Selecione a Data de Vigência da Pauta no topo antes de iniciar a carga em lote.',
      });
      return;
    }
    setSelectedBulkTable(tabela);
    setBulkLoadOpen(true);
  };

  const handleConfirmBulk = async (payloads: any[]) => {
    let successCount = 0;
    let failCount = 0;
    let lastError = '';

    for (const payload of payloads) {
      try {
        await onConfirmManual({ ...payload, contexto });
        setConfirmedCells((prev) => {
          const next = new Set(prev);
          next.add(payload.cell_key);
          return next;
        });
        successCount++;
      } catch (err: any) {
        console.error('Erro na carga em lote do item:', payload.descricao_estado, err);
        lastError = err?.message || String(err);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success('Carga em Lote Concluída', {
        description: `${successCount} itens importados com sucesso.${failCount > 0 ? ` ${failCount} falhas. Detalhe: ${lastError}` : ''}`,
      });
    } else if (failCount > 0) {
      toast.error('Erro na Carga em Lote', {
        description: `Falha ao importar os ${failCount} itens selecionados. Detalhe: ${lastError}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Spinner className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Reconstruindo tabelas</span>
      </div>
    );
  }

  if (tabelas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
        Nenhuma tabela encontrada no arquivo selecionado.
      </div>
    );
  }

  const activeTabelas = isEditingMode ? localTabelas : tabelas;

  const filteredTabelas = activeTabelas
    .map((tabela) => {
      let indexedRows = tabela.rows.map((row, originalIndex) => ({
        data: row,
        originalIndex,
      }));

      if (filterBrandOnly) {
        indexedRows = indexedRows.filter((rowObj) => rowMatchesBrand(rowObj.data));
      }
      if (normalizedSearch) {
        indexedRows = indexedRows.filter((rowObj) =>
          rowObj.data.some((cell) => normalizeForSearch(cell).includes(normalizedSearch))
        );
      }
      return {
        tabelaIndex: tabela.tabelaIndex,
        pagina: tabela.pagina,
        headers: tabela.headers,
        indexedRows,
      };
    })
    .filter(
      (tabela) =>
        tabela.indexedRows.length > 0 &&
        (!filterBrandOnly ||
          tableHasBrand(activeTabelas.find((t) => t.tabelaIndex === tabela.tabelaIndex) || { rows: [] } as any))
    );

  const totalLinesFound = filteredTabelas.reduce((acc, tab) => acc + tab.indexedRows.length, 0);

  const displayLinesCount = tabelas.reduce((acc, tab) => acc + tab.rows.length, 0);
  const displayTablesCount = filteredTabelas.length;

  return (
    <div className="space-y-6">
      <OcrToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filterBrandOnly={filterBrandOnly}
        onFilterBrandOnlyChange={setFilterBrandOnly}
        totalLinesFound={totalLinesFound}
        totalTablesCount={tabelas.length}
        displayLinesCount={displayLinesCount}
        displayTablesCount={displayTablesCount}
        isEditingMode={isEditingMode}
        onToggleEditingMode={handleToggleEditingMode}
        onSaveEdits={handleSaveEdits}
        isSavingEdits={isUpdatingOcrTables}
      />

      {filteredTabelas.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed space-y-2">
          <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">Nenhuma correspondência encontrada</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Nenhuma linha nas tabelas do arquivo corresponde aos filtros.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredTabelas.map((tabela) => (
            <OcrTableCard
              key={tabela.tabelaIndex}
              tabela={tabela}
              searchTerm={searchTerm}
              confirmedCells={confirmedCells}
              onCellClick={handleCellClick}
              highlightText={highlightText}
              rowMatchesBrand={rowMatchesBrand}
              isPriceCell={isPriceCell}
              onBulkLoadClick={handleBulkLoadClick}
              isEditingMode={isEditingMode}
              onCellEdit={handleCellEdit}
              onHeaderEdit={handleHeaderEdit}
              onDeleteRow={handleDeleteRow}
              onDeleteTable={handleDeleteTable}
              onAddRow={handleAddRow}
              inlineEditingCell={inlineEditingCell}
              setInlineEditingCell={setInlineEditingCell}
              inlineEditingHeader={inlineEditingHeader}
              setInlineEditingHeader={setInlineEditingHeader}
              onSaveInlineCell={handleSaveInlineCell}
              onSaveInlineHeader={handleSaveInlineHeader}
            />
          ))}
        </div>
      )}

      <OcrAssociationDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedCellData={selectedCellData}
        produtos={filteredCatalogProducts}
        saveDePara={saveDePara}
        onSaveDeParaChange={setSaveDePara}
        onConfirm={handleConfirmAssociation}
        isSaving={isSaving}
        productSearch={productSearch}
        onProductSearchChange={setProductSearch}
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={setSelectedProductIds}
        contexto={contexto}
      />

      <OcrBulkLoadDialog
        open={bulkLoadOpen}
        onOpenChange={setBulkLoadOpen}
        tabela={selectedBulkTable}
        produtos={filteredCatalogProducts}
        deParas={deParas || []}
        uf={uf}
        dataPauta={dataPauta}
        filename={filename}
        confirmedCells={confirmedCells}
        onConfirmBulk={handleConfirmBulk}
        isPriceCell={isPriceCell}
        inferItemDescription={inferItemDescription}
      />

      {isEditingMode && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border rounded-xl p-4 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs font-semibold text-muted-foreground mr-2">Modo Edição Ativo</span>
          <Button
            type="button"
            onClick={handleSaveEdits}
            disabled={isUpdatingOcrTables}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50 h-9 border-none"
          >
            <Save className="w-3.5 h-3.5" />
            {isUpdatingOcrTables ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleEditingMode}
            disabled={isUpdatingOcrTables}
            className="text-xs font-semibold hover:bg-muted/80 text-foreground flex items-center gap-1.5 cursor-pointer h-9"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
