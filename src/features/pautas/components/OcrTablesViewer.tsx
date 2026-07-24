import { useState, type ReactNode, useMemo } from 'react';
import { HelpCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { BRAND_SLUGS } from '@shared/utils/constants';
import { useTerms } from '@features/settings/hooks/useTerms';
import { useDePara } from '@features/de-para/hooks/useDePara';
import { OcrToolbar } from './OcrToolbar';
import { OcrTableCard } from './OcrTableCard';
import { OcrAssociationDialog } from './OcrAssociationDialog';
import { OcrBulkLoadDialog } from './OcrBulkLoadDialog';
import { OcrEditingFloatingBar } from './OcrEditingFloatingBar';
import { useOcrTableEditing } from './hooks/useOcrTableEditing';
import { useOcrAssociation } from './hooks/useOcrAssociation';
import { useOcrBulkLoad } from './hooks/useOcrBulkLoad';
import {
  priceRegex,
  normalizeForSearch,
  inferItemDescription,
  cleanPriceString,
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
  updateOcrTables?: (params: { filename: string; tabelas: any[]; confirmedCells?: string[]; contexto?: string }) => Promise<any>;
  isUpdatingOcrTables?: boolean;
  contexto?: string;
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
  updateOcrTables,
  isUpdatingOcrTables = false,
  contexto = 'proprio',
}: OcrTablesViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrandOnly, setFilterBrandOnly] = useState(true);

  // Hook de gerenciamento e edição das tabelas
  const {
    localTabelas,
    confirmedCells,
    markCellConfirmed,
    isEditingMode,
    inlineEditingCell,
    setInlineEditingCell,
    inlineEditingHeader,
    setInlineEditingHeader,
    handleToggleEditingMode,
    handleCellEdit,
    handleHeaderEdit,
    handleDeleteRow,
    handleDeleteTable,
    handleAddRow,
    handleSaveEdits,
    handleSaveInlineCell,
    handleSaveInlineHeader,
  } = useOcrTableEditing({
    tabelas,
    dbConfirmedCells,
    filename,
    contexto,
    updateOcrTables,
  });

  const { items: deParas } = useDePara(uf);

  // Produtos filtrados por contexto
  const filteredCatalogProducts = useMemo(() => {
    return produtos.filter((p: any) => (p.tipo || 'proprio') === contexto);
  }, [produtos, contexto]);

  // Slugs/marcas ativas para filtragem
  const { terms } = useTerms(contexto);
  const activeSlugs = useMemo(() => {
    if (terms && terms.length > 0) {
      return terms.map((t) => t.termo);
    }
    return BRAND_SLUGS;
  }, [terms]);

  // Hook de associação manual de produtos
  const association = useOcrAssociation({
    uf,
    dataPauta,
    filename,
    contexto,
    filteredCatalogProducts,
    onConfirmManual,
    markCellConfirmed,
  });

  // Hook de carga em lote
  const bulkLoad = useOcrBulkLoad({
    dataPauta,
    contexto,
    onConfirmManual,
    markCellConfirmed,
  });

  const normalizedSearch = normalizeForSearch(searchTerm);

  const rowMatchesBrand = (row: string[]) => {
    return row.some((cell) => {
      const cellNorm = normalizeForSearch(cell);
      return activeSlugs.some((slug) => {
        const normSlug = normalizeForSearch(slug);
        if (normSlug === '3.0' || slug === '3.0') {
          return /(?:^|[^0-9])3\.0(?:[^0-9]|$)/.test(cellNorm);
        }
        return cellNorm.includes(normSlug);
      });
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



  const isPriceCell = (value: string, header: string, colIdx?: number) => {
    if (!value || typeof value !== 'string') return false;

    const normHeader = (header || '').toUpperCase();
    const nonPriceHeaders = [
      'ITEM', 'CHAVE', 'CODIGO', 'CÓDIGO', 'COD', 'NCM', 'CEST',
      'CNPJ', 'GTIN', 'EAN', 'Nº', 'NO', 'NUMERO', 'NÚMERO',
      'DESCRICAO', 'DESCRIÇÃO', 'PRODUTO', 'MARCA', 'EMBALAGEM', 'VOLUME', 'TIPO',
    ];

    if (nonPriceHeaders.some((h) => normHeader.includes(h))) {
      return false;
    }

    if (colIdx === 0 && !/R\$/i.test(value) && !/VALOR_PAUTA|VALOR_PMPF|PRECO|PREÇO|PAUTA/i.test(normHeader)) {
      return false;
    }

    const cleanVal = cleanPriceString(value);
    return priceRegex.test(value) || priceRegex.test(cleanVal);
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
          tableHasBrand(activeTabelas.find((t) => t.tabelaIndex === tabela.tabelaIndex) || ({ rows: [] } as any)))
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
              onCellClick={association.handleCellClick}
              highlightText={highlightText}
              rowMatchesBrand={rowMatchesBrand}
              isPriceCell={isPriceCell}
              onBulkLoadClick={bulkLoad.handleBulkLoadClick}
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
        open={association.modalOpen}
        onOpenChange={association.setModalOpen}
        selectedCellData={association.selectedCellData}
        produtos={filteredCatalogProducts}
        saveDePara={association.saveDePara}
        onSaveDeParaChange={association.setSaveDePara}
        onConfirm={association.handleConfirmAssociation}
        isSaving={association.isSaving}
        productSearch={association.productSearch}
        onProductSearchChange={association.setProductSearch}
        selectedProductIds={association.selectedProductIds}
        setSelectedProductIds={association.setSelectedProductIds}
        contexto={contexto}
      />

      <OcrBulkLoadDialog
        open={bulkLoad.bulkLoadOpen}
        onOpenChange={bulkLoad.setBulkLoadOpen}
        tabela={bulkLoad.selectedBulkTable}
        produtos={filteredCatalogProducts}
        deParas={deParas || []}
        uf={uf}
        dataPauta={dataPauta}
        filename={filename}
        confirmedCells={confirmedCells}
        onConfirmBulk={bulkLoad.handleConfirmBulk}
        isPriceCell={isPriceCell}
        inferItemDescription={inferItemDescription}
      />

      {isEditingMode && (
        <OcrEditingFloatingBar
          isSavingEdits={isUpdatingOcrTables}
          onSaveEdits={handleSaveEdits}
          onToggleEditingMode={handleToggleEditingMode}
        />
      )}
    </div>
  );
}
