import { useState, useEffect, type ReactNode } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { BRAND_SLUGS } from '@shared/utils/constants';
import { useTerms } from '@features/settings/hooks/useTerms';
import { OcrToolbar } from './OcrToolbar';
import { OcrTableCard } from './OcrTableCard';
import { OcrAssociationDialog } from './OcrAssociationDialog';
import { OcrBulkLoadDialog } from './OcrBulkLoadDialog';
import { useDePara } from '@features/de-para/hooks/useDePara';

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
  }) => Promise<any>;
}

const priceRegex = /^\s*(?:R\$\s*)?\d+[\.,]\d{2}\s*$/i;

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

function inferItemDescription(row: string[], headers: string[], colIdx: number, uf: string): string {
  const ufUpper = uf.toUpperCase();
  
  if (ufUpper === 'PR') {
    const marcaIdx = headers.findIndex(h => h.includes('MARCA_PRODUTO') || h.includes('MARCAS'));
    const marcaText = marcaIdx !== -1 ? row[marcaIdx] : row[1] || '';
    const embalagemText = headers[colIdx] || '';
    return `${marcaText} - ${embalagemText}`.trim().replace(/\s+/g, ' ');
  }
  
  const marcaIdx = headers.findIndex(h => h.includes('MARCA_PRODUTO') || h.includes('MARCA') || h.includes('DESCRICAO') || h.includes('PRODUTO'));
  const embalagemIdx = headers.findIndex(h => h.includes('EMBALAGEM') || h.includes('VOLUME'));
  
  let parts: string[] = [];
  if (marcaIdx !== -1 && row[marcaIdx]) parts.push(row[marcaIdx]);
  if (embalagemIdx !== -1 && row[embalagemIdx] && embalagemIdx !== colIdx) parts.push(row[embalagemIdx]);
  
  if (parts.length === 0) {
    parts = row.filter((_, idx) => idx !== colIdx && idx !== 0);
  }
  
  return parts.join(' - ').trim().replace(/\s+/g, ' ');
}

export function OcrTablesViewer({
  tabelas,
  isLoading,
  filename,
  produtos,
  uf,
  dataPauta,
  dbConfirmedCells,
  onConfirmManual,
}: OcrTablesViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmedCells, setConfirmedCells] = useState<Set<string>>(new Set());
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

  const { terms } = useTerms();
  const activeSlugs = terms.length > 0 ? terms.map((t) => t.termo) : BRAND_SLUGS;

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
    } else {
      const bestMatch = produtos
        .map(p => ({
          p,
          score: normInferred.split(/\s+/).reduce((acc, word) => {
            if (word.length >= 3 && normalizeText(p.descricao_interna).includes(word)) {
              return acc + 1;
            }
            return acc;
          }, 0)
        }))
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)[0];

      setSelectedProductIds(bestMatch ? [bestMatch.p.id] : []);
    }
    setProductSearch('');
    setSaveDePara(true);
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
        await onConfirmManual(payload);
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
        <span className="text-sm text-muted-foreground">Reconstruindo tabelas do OCR...</span>
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

  const filteredTabelas = tabelas
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
          tableHasBrand(tabelas.find((t) => t.tabelaIndex === tabela.tabelaIndex) || { rows: [] } as any))
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
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-md flex items-start gap-2 max-w-xl">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              <strong>Associação Manual Rápida:</strong> Clique sobre qualquer valor de preço de pauta (células azuis de valor, ex: <code>3,12</code>) para associá-lo diretamente a um produto e gravá-lo no banco.
            </p>
          </div>

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
            />
          ))}
        </div>
      )}

      <OcrAssociationDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedCellData={selectedCellData}
        produtos={produtos}
        saveDePara={saveDePara}
        onSaveDeParaChange={setSaveDePara}
        onConfirm={handleConfirmAssociation}
        isSaving={isSaving}
        productSearch={productSearch}
        onProductSearchChange={setProductSearch}
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={setSelectedProductIds}
      />

      <OcrBulkLoadDialog
        open={bulkLoadOpen}
        onOpenChange={setBulkLoadOpen}
        tabela={selectedBulkTable}
        produtos={produtos}
        deParas={deParas || []}
        uf={uf}
        dataPauta={dataPauta}
        filename={filename}
        confirmedCells={confirmedCells}
        onConfirmBulk={handleConfirmBulk}
        isPriceCell={isPriceCell}
        inferItemDescription={inferItemDescription}
      />
    </div>
  );
}
