import { type ReactNode } from 'react';
import { Check, AlertTriangle, Trash2, Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { EstruturaTabela, IndexedRow } from './OcrTablesViewer';

interface OcrTableCardProps {
  tabela: Omit<EstruturaTabela, 'rows'> & { indexedRows: IndexedRow[] };
  searchTerm: string;
  confirmedCells: Set<string>;
  onCellClick: (tabelaIdx: number, rIdx: number, cIdx: number, value: string, row: string[], headers: string[]) => void;
  highlightText: (text: string, search: string) => ReactNode;
  rowMatchesBrand: (row: string[]) => boolean;
  isPriceCell: (value: string, header: string) => boolean;
  onBulkLoadClick: (tabela: Omit<EstruturaTabela, 'rows'> & { indexedRows: IndexedRow[] }) => void;
  isEditingMode?: boolean;
  onCellEdit?: (tabelaIdx: number, rIdx: number, cIdx: number, value: string) => void;
  onHeaderEdit?: (tabelaIdx: number, cIdx: number, value: string) => void;
  onDeleteRow?: (tabelaIdx: number, rIdx: number) => void;
  onDeleteTable?: (tabelaIdx: number) => void;
  onAddRow?: (tabelaIdx: number) => void;
  inlineEditingCell?: {
    tabelaIdx: number;
    rIdx: number;
    cIdx: number;
    value: string;
  } | null;
  setInlineEditingCell?: (
    cell: {
      tabelaIdx: number;
      rIdx: number;
      cIdx: number;
      value: string;
    } | null
  ) => void;
  inlineEditingHeader?: {
    tabelaIdx: number;
    cIdx: number;
    value: string;
  } | null;
  setInlineEditingHeader?: (
    header: {
      tabelaIdx: number;
      cIdx: number;
      value: string;
    } | null
  ) => void;
  onSaveInlineCell?: (tabelaIdx: number, rIdx: number, cIdx: number, value: string) => Promise<void>;
  onSaveInlineHeader?: (tabelaIdx: number, cIdx: number, value: string) => Promise<void>;
}

export function OcrTableCard({
  tabela,
  searchTerm,
  confirmedCells,
  onCellClick,
  highlightText,
  rowMatchesBrand,
  isPriceCell,
  onBulkLoadClick,
  isEditingMode = false,
  onCellEdit,
  onHeaderEdit,
  onDeleteRow,
  onDeleteTable,
  onAddRow,
  inlineEditingCell,
  setInlineEditingCell,
  inlineEditingHeader,
  setInlineEditingHeader,
  onSaveInlineCell,
  onSaveInlineHeader,
}: OcrTableCardProps) {
  return (
    <Card className={`overflow-hidden border shadow-sm transition-all duration-300 ${isEditingMode ? 'ring-2 ring-primary/20 border-primary/30' : ''}`}>
      <div className="bg-muted/40 px-4 py-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          Tabela {tabela.tabelaIndex}
          {isEditingMode && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Editando
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {isEditingMode ? (
            onDeleteTable && (
              <button
                type="button"
                onClick={() => onDeleteTable(tabela.tabelaIndex)}
                className="text-[11px] font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 hover:border-destructive/30 px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Excluir Tabela
              </button>
            )
          ) : (
            <button
              onClick={() => onBulkLoadClick(tabela)}
              className="text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 px-2.5 py-1 rounded transition-all cursor-pointer"
            >
              Carga em Lote
            </button>
          )}
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-w-full scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/20 border-b border-muted">
                {tabela.headers.map((header, idx) => {
                  const isEditingHeaderThis = inlineEditingHeader?.tabelaIdx === tabela.tabelaIndex && inlineEditingHeader?.cIdx === idx;

                  return (
                    <th
                      key={idx}
                      className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px] cursor-pointer select-none"
                      onDoubleClick={() => {
                        if (!isEditingMode && setInlineEditingHeader) {
                          setInlineEditingHeader({
                            tabelaIdx: tabela.tabelaIndex,
                            cIdx: idx,
                            value: header || `Coluna ${idx + 1}`,
                          });
                        }
                      }}
                      title={!isEditingMode ? "Dois cliques para editar" : undefined}
                    >
                      {isEditingMode ? (
                        <input
                          value={header}
                          onChange={(e) => onHeaderEdit?.(tabela.tabelaIndex, idx, e.target.value)}
                          className="bg-background text-foreground text-xs font-semibold px-2 py-1 rounded border border-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
                          placeholder={`Coluna ${idx + 1}`}
                        />
                      ) : isEditingHeaderThis ? (
                        <div className="flex items-center gap-1.5 min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={inlineEditingHeader.value}
                            onChange={(e) => setInlineEditingHeader?.({ ...inlineEditingHeader, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onSaveInlineHeader?.(tabela.tabelaIndex, idx, inlineEditingHeader.value);
                              } else if (e.key === 'Escape') {
                                setInlineEditingHeader?.(null);
                              }
                            }}
                            className="bg-background text-foreground text-xs font-semibold px-2 py-1 rounded border border-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => onSaveInlineHeader?.(tabela.tabelaIndex, idx, inlineEditingHeader.value)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                            title="Salvar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditingHeader?.(null)}
                            className="p-1 bg-muted hover:bg-muted/80 text-foreground border rounded transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        header || `Coluna ${idx + 1}`
                      )}
                    </th>
                  );
                })}
                {isEditingMode && (
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider w-[60px] text-center">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/60">
              {tabela.indexedRows.map((rowObj) => {
                const { data: row, originalIndex: rIdx } = rowObj;
                const isBrandRow = rowMatchesBrand(row);
                const hasPrices = row.some((cell, cIdx) => isPriceCell(cell, tabela.headers[cIdx]));
                const showWarning = isBrandRow && !hasPrices;

                return (
                  <tr
                    key={rIdx}
                    className={`hover:bg-muted/10 transition-colors odd:bg-muted/5 ${
                      isBrandRow && !isEditingMode ? 'bg-primary/[0.03] dark:bg-primary/[0.02] border-l-2' : ''
                    }`}
                  >
                    {row.map((cell, cIdx) => {
                      const isPrice = isPriceCell(cell, tabela.headers[cIdx]);
                      const cellKey = `${tabela.tabelaIndex}-${rIdx}-${cIdx}`;
                      const isConfirmed = confirmedCells.has(cellKey);
                      const isEditingCellThis = inlineEditingCell?.tabelaIdx === tabela.tabelaIndex && inlineEditingCell?.rIdx === rIdx && inlineEditingCell?.cIdx === cIdx;

                      return (
                        <td
                          key={cIdx}
                          className="px-4 py-2 text-foreground/90 whitespace-nowrap cursor-pointer select-none"
                          onDoubleClick={() => {
                            if (!isEditingMode && setInlineEditingCell) {
                              setInlineEditingCell({
                                tabelaIdx: tabela.tabelaIndex,
                                rIdx,
                                cIdx,
                                value: cell,
                              });
                            }
                          }}
                          title={!isEditingMode ? "Dois cliques para editar" : undefined}
                        >
                          {cIdx === 0 && showWarning && !isEditingMode && (
                            <span 
                              className="inline-flex items-center gap-1 text-amber-500 mr-1.5 vertical-middle align-middle cursor-help"
                              title="Esta linha corresponde aos termos cadastrados, mas nenhum preço válido de pauta foi detectado. Possível falha de leitura no OCR."
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          )}
                          {isEditingMode ? (
                            <input
                              value={cell}
                              onChange={(e) => onCellEdit?.(tabela.tabelaIndex, rIdx, cIdx, e.target.value)}
                              className="bg-background text-foreground text-xs px-2 py-1 rounded border border-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
                              placeholder="-"
                            />
                          ) : isEditingCellThis ? (
                            <div className="flex items-center gap-1.5 min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={inlineEditingCell.value}
                                onChange={(e) => setInlineEditingCell?.({ ...inlineEditingCell, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onSaveInlineCell?.(tabela.tabelaIndex, rIdx, cIdx, inlineEditingCell.value);
                                  } else if (e.key === 'Escape') {
                                    setInlineEditingCell?.(null);
                                  }
                                }}
                                className="bg-background text-foreground text-xs px-2 py-1 rounded border border-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary flex-1"
                                placeholder="-"
                              />
                              <button
                                type="button"
                                onClick={() => onSaveInlineCell?.(tabela.tabelaIndex, rIdx, cIdx, inlineEditingCell.value)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                                title="Salvar"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineEditingCell?.(null)}
                                className="p-1 bg-muted hover:bg-muted/80 text-foreground border rounded transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isPrice ? (
                            <button
                              onClick={() => onCellClick(tabela.tabelaIndex, rIdx, cIdx, cell, row, tabela.headers)}
                              className={`font-semibold border px-2 py-1 rounded transition-all inline-flex items-center gap-1 cursor-pointer ${
                                isConfirmed
                                  ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 font-bold'
                                  : 'bg-primary/5 hover:bg-primary/20 border-primary/20 hover:border-primary/40 text-primary'
                              }`}
                            >
                              R$ {cell.replace(/R\$\s*/i, '')}
                              {isConfirmed && <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
                            </button>
                          ) : (
                            searchTerm ? highlightText(cell, searchTerm) : cell
                          )}
                        </td>
                      );
                    })}
                    {isEditingMode && (
                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteRow?.(tabela.tabelaIndex, rIdx)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
                          title="Excluir Linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isEditingMode && onAddRow && (
          <div className="p-3 bg-muted/20 border-t flex justify-center">
            <button
              type="button"
              onClick={() => onAddRow(tabela.tabelaIndex)}
              className="text-xs font-semibold text-primary hover:text-primary-foreground bg-primary/5 hover:bg-primary border border-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Linha
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
