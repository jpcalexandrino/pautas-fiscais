import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  FileText,
  Trash2,
  Info
} from 'lucide-react';

import { useFatura } from '@features/faturas/context/FaturaContext';
import { usePDF } from '@features/reports/context/ReportContext';
import { calcularResumo } from '@shared/utils/calculations';
import { formatCurrency, formatDate, formatPercentage, formatNumber } from '@shared/utils/formatters';
import { CSV_FIELDS, DEFAULT_VISIBLE_COLUMNS } from '@shared/utils/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataStats } from '../components/DataStats';
import { DataTable } from '../components/DataTable';
import { DataEmptyState } from '../components/DataEmptyState';
import { ColumnCustomizer } from '../components/ColumnCustomizer';
import { DataPagination } from '../components/DataPagination';

export default function DataPage() {
  const navigate = useNavigate();
  const { state, clearData } = useFatura();
  const rows = state.rows;
  const { selectedRows, selectRow, selectAllRows } = usePDF();
  const resumo = calcularResumo(rows);

  // Estados para Paginação e Colunas
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);

  const formatCell = (field: string, value: any) => {
    if (value === undefined || value === null || value === '') return '—';
    const def = CSV_FIELDS.find((f) => f.key === field);
    if (!def) return String(value);
    switch (def.type) {
      case 'currency': return formatCurrency(value);
      case 'date': return formatDate(value);
      case 'percentage': return formatPercentage(value);
      case 'number': return formatNumber(value);
      default: return String(value);
    }
  };

  if (rows.length === 0) {
    return <DataEmptyState onNavigateToImport={() => navigate({ to: '/import' as any })} />;
  }


  const rowsWithIndex = useMemo(() => rows.map((r: any, idx: number) => ({ ...r, _originalIdx: idx })), [rows]);

  // Lógica de Paginação
  const totalPages = Math.ceil(rowsWithIndex.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rowsWithIndex.slice(start, start + pageSize);
  }, [rowsWithIndex, currentPage, pageSize]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllRows(rowsWithIndex.map((r: any) => r._originalIdx));
    } else {
      selectAllRows([]);
    }
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const isAllSelected = selectedRows.length === rowsWithIndex.length && rowsWithIndex.length > 0;

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dados Importados</h1>
          <p className="text-sm text-muted-foreground">Visualize e selecione as faturas para processamento.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <Button
              onClick={() => navigate({ to: '/reports' as any })}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Gerar PDF ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => { clearData(); navigate({ to: '/import' as any }); }}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </Button>
        </div>
      </div>

      <DataStats resumo={resumo} />

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Instruções de Seleção</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Selecione as faturas desejadas na tabela abaixo utilizando as caixas de seleção. Cada item selecionado será incluído no processamento do relatório individual.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Tabela de Dados</h3>
        <div className="flex items-center gap-2">
          <ColumnCustomizer 
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onReset={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <DataTable
          rowsWithIndex={paginatedRows}
          selectedRows={selectedRows}
          isAllSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          onSelectRow={selectRow}
          formatCell={formatCell}
          visibleColumns={visibleColumns}
        />

        {totalPages > 0 && (
          <DataPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalRows={rowsWithIndex.length}
            selectedCount={selectedRows.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
