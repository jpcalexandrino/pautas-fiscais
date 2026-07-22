import { type ReactNode, useMemo } from 'react';
import { Check, AlertTriangle, Trash2, Plus, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  // Contagem de preços e progresso na tabela
  const priceStats = useMemo(() => {
    let totalPrices = 0;
    let confirmedPrices = 0;

    tabela.indexedRows.forEach(({ data: row, originalIndex: rIdx }) => {
      row.forEach((cell, cIdx) => {
        if (isPriceCell(cell, tabela.headers[cIdx])) {
          totalPrices++;
          if (confirmedCells.has(`${tabela.tabelaIndex}-${rIdx}-${cIdx}`)) {
            confirmedPrices++;
          }
        }
      });
    });

    return { totalPrices, confirmedPrices };
  }, [tabela, confirmedCells, isPriceCell]);

  return (
    <Card className={`overflow-hidden border border-border/40 bg-card shadow-xs rounded-2xl transition-all duration-300 ${isEditingMode ? 'ring-2 ring-primary/40 border-primary/50 shadow-md' : 'hover:shadow-sm'}`}>
      {/* CABEÇALHO DO CARD COM HIERARQUIA VISUAL CLARA */}
      <div className="px-4 py-3 border-b border-border/30 flex justify-between items-center bg-muted/15">
        <div className="flex items-center gap-3">
          <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
            {tabela.tabelaIndex}
          </span>
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-xs text-foreground tracking-tight">
              Tabela {tabela.tabelaIndex}
            </h3>
            <span className="text-[11px] text-muted-foreground/70 font-normal">
              • {tabela.indexedRows.length} {tabela.indexedRows.length === 1 ? 'linha' : 'linhas'}
            </span>
            {priceStats.totalPrices > 0 && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                priceStats.confirmedPrices === priceStats.totalPrices
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-muted/40 text-muted-foreground border-border/40'
              }`}>
                {priceStats.confirmedPrices}/{priceStats.totalPrices} mapeados
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingMode ? (
            onDeleteTable && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteTable(tabela.tabelaIndex)}
                className="text-[11px] h-7 font-medium rounded-lg gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Tabela
              </Button>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkLoadClick(tabela)}
              className="text-xs h-7.5 font-medium border-border/50 text-foreground/90 hover:text-primary hover:bg-primary/5 hover:border-primary/30 rounded-lg gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Menu className="w-3.5 h-3.5 text-primary" />
              Carga em Lote
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto max-w-full scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/20 border-b border-border/30">
                {tabela.headers.map((header, idx) => {
                  const isEditingHeaderThis = inlineEditingHeader?.tabelaIdx === tabela.tabelaIndex && inlineEditingHeader?.cIdx === idx;
                  const isLastCol = idx === tabela.headers.length - 1 && !isEditingMode;

                  return (
                    <th
                      key={idx}
                      className={`px-3.5 py-2 font-medium text-muted-foreground/75 uppercase tracking-wider text-[10px] min-w-[120px] cursor-default select-none group border-b border-border/30 ${
                        !isLastCol ? 'border-r border-border/20' : ''
                      }`}
                      onDoubleClick={() => {
                        if (!isEditingMode && setInlineEditingHeader) {
                          setInlineEditingHeader({
                            tabelaIdx: tabela.tabelaIndex,
                            cIdx: idx,
                            value: header || `Coluna ${idx + 1}`,
                          });
                        }
                      }}
                      title={!isEditingMode ? "Dois cliques para editar cabeçalho" : undefined}
                    >
                      {isEditingMode ? (
                        <input
                          value={header}
                          onChange={(e) => onHeaderEdit?.(tabela.tabelaIndex, idx, e.target.value)}
                          className="bg-background/80 hover:bg-background text-foreground text-xs font-semibold px-2 py-0.5 rounded border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary w-full transition-all"
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
                            className="bg-background text-foreground text-xs font-semibold px-2 py-0.5 rounded border border-primary focus:outline-none focus:ring-1 focus:ring-primary flex-1 shadow-2xs"
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="icon-xs"
                            onClick={() => onSaveInlineHeader?.(tabela.tabelaIndex, idx, inlineEditingHeader.value)}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 rounded cursor-pointer h-6 w-6"
                            title="Salvar"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => setInlineEditingHeader?.(null)}
                            className="text-foreground hover:bg-muted/80 rounded cursor-pointer h-6 w-6"
                            title="Cancelar"  
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="group-hover:text-foreground transition-colors flex items-center gap-1">
                          {header || `Coluna ${idx + 1}`}
                        </span>
                      )}
                    </th>
                  );
                })}
                {isEditingMode && (
                  <th className="px-3 py-2 font-medium text-muted-foreground uppercase tracking-wide text-[10px] w-[60px] text-center border-b border-border/30">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tabela.indexedRows.map((rowObj) => {
                const { data: row, originalIndex: rIdx } = rowObj;
                const isBrandRow = rowMatchesBrand(row);
                const hasPrices = row.some((cell, cIdx) => isPriceCell(cell, tabela.headers[cIdx]));
                const showWarning = isBrandRow && !hasPrices;

                return (
                  <tr
                    key={rIdx}
                    className={`hover:bg-muted/20 transition-colors border-b border-border/15 relative ${
                      isBrandRow && !isEditingMode 
                        ? 'bg-primary/[0.02]' 
                        : ''
                    }`}
                  >
                    {row.map((cell, cIdx) => {
                      const isPrice = isPriceCell(cell, tabela.headers[cIdx]);
                      const cellKey = `${tabela.tabelaIndex}-${rIdx}-${cIdx}`;
                      const isConfirmed = confirmedCells.has(cellKey);
                      const isEditingCellThis = inlineEditingCell?.tabelaIdx === tabela.tabelaIndex && inlineEditingCell?.rIdx === rIdx && inlineEditingCell?.cIdx === cIdx;
                      const isLastCell = cIdx === row.length - 1 && !isEditingMode;

                      return (
                        <td
                          key={cIdx}
                          className={`px-3.5 py-2 text-foreground/90 whitespace-nowrap cursor-default select-none align-middle relative ${
                            !isLastCell ? 'border-r border-border/15' : ''
                          }`}
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
                          title={!isEditingMode ? "Dois cliques para editar esta célula" : undefined}
                        >
                          {/* INDICADOR LATERAL DE MARCA REGISTRADA (ESTILO STRIPE) */}
                          {cIdx === 0 && isBrandRow && !isEditingMode && (
                            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/70 rounded-r" title="Linha de marca monitorada" />
                          )}

                          {cIdx === 0 && showWarning && !isEditingMode && (
                            <span 
                              className="inline-flex items-center gap-1 text-amber-500 mr-1.5 align-middle cursor-help"
                              title="Esta linha corresponde aos termos cadastrados, mas nenhum preço válido de pauta foi detectado."
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          )}

                          {isEditingMode ? (
                            <input
                              value={cell}
                              onChange={(e) => onCellEdit?.(tabela.tabelaIndex, rIdx, cIdx, e.target.value)}
                              className="bg-background/80 hover:bg-background text-foreground text-xs px-2 py-0.5 rounded border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary w-full transition-all"
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
                                className="bg-background text-foreground text-xs px-2 py-0.5 rounded border border-primary focus:outline-none focus:ring-1 focus:ring-primary flex-1 shadow-2xs"
                                placeholder="-"
                              />
                              <Button
                                type="button"
                                variant="default"
                                size="icon-xs"
                                onClick={() => onSaveInlineCell?.(tabela.tabelaIndex, rIdx, cIdx, inlineEditingCell.value)}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded cursor-pointer h-6 w-6"
                                title="Salvar"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                onClick={() => setInlineEditingCell?.(null)}
                                className="text-foreground hover:bg-muted/80 rounded cursor-pointer h-6 w-6"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : isPrice ? (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onCellClick(tabela.tabelaIndex, rIdx, cIdx, cell, row, tabela.headers)}
                              className={`font-semibold px-2 py-0.5 rounded text-xs transition-all inline-flex items-center gap-1 cursor-pointer h-auto border ${
                                isConfirmed
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20'
                                  : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 hover:border-primary/40'
                              }`}
                            >
                              <span>R$ {cell.replace(/R\$\s*/i, '')}</span>
                              {isConfirmed ? (
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </Button>
                          ) : (
                            searchTerm ? highlightText(cell, searchTerm) : cell
                          )}
                        </td>
                      );
                    })}
                    {isEditingMode && (
                      <td className="px-3 py-2 text-center whitespace-nowrap align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteRow?.(tabela.tabelaIndex, rIdx)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded h-6 w-6"
                          title="Excluir Linha"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isEditingMode && onAddRow && (
          <div className="p-3 bg-muted/10 border-t border-border/30 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddRow(tabela.tabelaIndex)}
              className="text-xs font-semibold text-primary hover:text-primary-foreground bg-primary/5 hover:bg-primary px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-primary/30 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Linha
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
