import { type ReactNode, useMemo } from 'react';
import { Check, AlertTriangle, Trash2, Plus, X, Menu, TableProperties, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EstruturaTabela, IndexedRow } from './OcrTablesViewer';
import { cleanPriceString } from '../utils/ocrHelpers';

interface OcrTableCardProps {
  tabela: Omit<EstruturaTabela, 'rows'> & { indexedRows: IndexedRow[] };
  searchTerm: string;
  confirmedCells: Set<string>;
  onCellClick: (tabelaIdx: number, rIdx: number, cIdx: number, value: string, row: string[], headers: string[]) => void;
  highlightText: (text: string, search: string) => ReactNode;
  rowMatchesBrand: (row: string[]) => boolean;
  isPriceCell: (value: string, header: string, colIdx?: number) => boolean;
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
        if (isPriceCell(cell, tabela.headers[cIdx], cIdx)) {
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
    <Card className={`overflow-hidden border border-border/50 bg-card shadow-2xs rounded-xl transition-all duration-200 ${isEditingMode ? 'ring-2 ring-primary/40 border-primary/50' : 'hover:border-border'}`}>
      {/* CABEÇALHO DO CARD MINIMALISTA */}
      <CardHeader className="px-4 py-2.5 border-b border-border/40 flex flex-row items-center justify-between bg-muted/10 space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="font-semibold text-xs tracking-tight text-foreground">
            Tabela {tabela.tabelaIndex}
          </CardTitle>
          {tabela.pagina && (
            <Badge variant="outline" className="text-[10px] font-medium h-5 px-2 bg-primary/5 text-primary border-primary/20">
              Página {tabela.pagina}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground font-normal">
            ({tabela.indexedRows.length} {tabela.indexedRows.length === 1 ? 'linha' : 'linhas'})
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {priceStats.totalPrices > 0 && (
            <Badge 
              variant="outline" 
              className={`text-[10px] font-medium h-6 rounded-xl px-2.5 ${
                priceStats.confirmedPrices === priceStats.totalPrices
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-semibold'
                  : 'bg-muted/40 text-muted-foreground border-border/40'
              }`}
            >
              {priceStats.confirmedPrices}/{priceStats.totalPrices} mapeados
            </Badge>
          )}

          {isEditingMode ? (
            onDeleteTable && (
              <Button
                variant="destructive"
                size="xs"
                className="h-6.5 px-2 text-[11px] gap-1 cursor-pointer"
                onClick={() => onDeleteTable(tabela.tabelaIndex)}
              >
                <Trash2 className="size-3" />
                Excluir Tabela
              </Button>
            )
          ) : (
            <Button
              variant="outline"
              size="xs"
              className="h-6.5 px-2 text-[11px] gap-1 cursor-pointer font-medium border-border/60 hover:bg-accent transition-all"
              onClick={() => onBulkLoadClick(tabela)}
            >
              <Menu className="size-3 text-muted-foreground" />
              Carga em Lote
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto max-w-full scrollbar-thin">
          <Table className="w-full text-xs">
            <TableHeader>
              <TableRow className="bg-muted/15 hover:bg-muted/15 border-b border-border/40">
                {tabela.headers.map((header, idx) => {
                  const isEditingHeaderThis = inlineEditingHeader?.tabelaIdx === tabela.tabelaIndex && inlineEditingHeader?.cIdx === idx;

                  return (
                    <TableHead
                      key={idx}
                      className="px-3.5 py-2 font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px] min-w-[120px] cursor-default select-none group border-r border-border/10 last:border-r-0"
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
                          className="bg-background hover:bg-background text-foreground text-xs font-semibold px-2 py-0.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary w-full transition-all"
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
                            className="bg-background text-foreground text-xs font-semibold px-2 py-0.5 rounded-lg border border-primary focus:outline-none focus:ring-1 focus:ring-primary flex-1 shadow-2xs"
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="icon-xs"
                            onClick={() => onSaveInlineHeader?.(tabela.tabelaIndex, idx, inlineEditingHeader.value)}
                            className="cursor-pointer h-6 w-6 shadow-2xs"
                            title="Salvar"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => setInlineEditingHeader?.(null)}
                            className="text-foreground hover:bg-muted/80 cursor-pointer h-6 w-6 shadow-2xs"
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
                    </TableHead>
                  );
                })}
                {isEditingMode && (
                  <TableHead className="px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] w-[60px] text-center">
                    Ações
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabela.indexedRows.map((rowObj) => {
                const { data: row, originalIndex: rIdx } = rowObj;
                const isBrandRow = rowMatchesBrand(row);
                const hasPrices = row.some((cell, cIdx) => isPriceCell(cell, tabela.headers[cIdx], cIdx));
                const showWarning = isBrandRow && !hasPrices;

                return (
                  <TableRow
                    key={rIdx}
                    className="hover:bg-muted/20 transition-colors border-b border-border/15 relative"
                  >
                    {row.map((cell, cIdx) => {
                      const isPrice = isPriceCell(cell, tabela.headers[cIdx], cIdx);
                      const cellKey = `${tabela.tabelaIndex}-${rIdx}-${cIdx}`;
                      const isConfirmed = confirmedCells.has(cellKey);
                      const isEditingCellThis = inlineEditingCell?.tabelaIdx === tabela.tabelaIndex && inlineEditingCell?.rIdx === rIdx && inlineEditingCell?.cIdx === cIdx;

                      return (
                        <TableCell
                          key={cIdx}
                          className="px-3.5 py-2 text-foreground/90 whitespace-nowrap cursor-default select-none align-middle relative border-r border-border/10 last:border-r-0"
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
                              className="bg-background hover:bg-background text-foreground text-xs px-2 py-0.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary w-full transition-all"
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
                                className="bg-background text-foreground text-xs px-2 py-0.5 rounded-lg border border-primary focus:outline-none focus:ring-1 focus:ring-primary flex-1 shadow-2xs"
                                placeholder="-"
                              />
                              <Button
                                type="button"
                                variant="default"
                                size="icon-xs"
                                onClick={() => onSaveInlineCell?.(tabela.tabelaIndex, rIdx, cIdx, inlineEditingCell.value)}
                                className="cursor-pointer h-6 w-6 shadow-2xs"
                                title="Salvar"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                onClick={() => setInlineEditingCell?.(null)}
                                className="text-foreground hover:bg-muted/80 cursor-pointer h-6 w-6 shadow-2xs"
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
                              className={`font-semibold px-2.5 h-6.5 text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer border shadow-2xs rounded-lg ${
                                isConfirmed
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20'
                                  : 'bg-primary/30 text-primary-foreground hover:bg-primary hover:text-primary-foreground border-primary/35 hover:border-primary font-bold'
                              }`}
                            >
                              {isConfirmed ? (
                                <Check className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <Tag className="size-3 shrink-0 opacity-70" />
                              )}
                              <span>R$ {cleanPriceString(cell)}</span>
                            </Button>
                          ) : (
                            searchTerm ? highlightText(cell, searchTerm) : cell
                          )}
                        </TableCell>
                      );
                    })}
                    {isEditingMode && (
                      <TableCell className="px-3 py-2 text-center whitespace-nowrap align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteRow?.(tabela.tabelaIndex, rIdx)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer h-6 w-6"
                          title="Excluir Linha"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {isEditingMode && onAddRow && (
          <div className="p-2.5 bg-muted/10 border-t border-border/30 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              onClick={() => onAddRow(tabela.tabelaIndex)}
            >
              <Plus className="size-3" />
              Adicionar Linha
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
