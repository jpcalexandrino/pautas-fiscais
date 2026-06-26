import { type ReactNode } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
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
}: OcrTableCardProps) {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="bg-muted/40 px-4 py-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm text-foreground">
          Tabela {tabela.tabelaIndex}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBulkLoadClick(tabela)}
            className="text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 px-2.5 py-1 rounded transition-all cursor-pointer"
          >
            Carga em Lote
          </button>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-w-full scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/20 border-b border-muted">
                {tabela.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {header || `Coluna ${idx + 1}`}
                  </th>
                ))}
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
                      isBrandRow ? 'bg-primary/[0.03] dark:bg-primary/[0.02] border-l-2' : ''
                    }`}
                  >
                    {row.map((cell, cIdx) => {
                      const isPrice = isPriceCell(cell, tabela.headers[cIdx]);
                      const cellKey = `${tabela.tabelaIndex}-${rIdx}-${cIdx}`;
                      const isConfirmed = confirmedCells.has(cellKey);

                      return (
                        <td key={cIdx} className="px-4 py-2 text-foreground/90 whitespace-nowrap">
                          {cIdx === 0 && showWarning && (
                            <span 
                              className="inline-flex items-center gap-1 text-amber-500 mr-1.5 vertical-middle align-middle cursor-help"
                              title="Esta linha corresponde à nossa marca, mas nenhum preço válido de pauta foi detectado. Possível falha de leitura no OCR."
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          )}
                          {isPrice ? (
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
