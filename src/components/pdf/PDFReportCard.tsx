import React from 'react';
import { Eye, EyeOff, Download, Mail, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import PDFPreview from './PDFPreview';
import { formatCurrency, formatMesReferencia } from '@/utils/formatters';
import { calcularConsumoTotal } from '@/utils/calculations';

interface PDFReportCardProps {
  row: any;
  idx: number;
  equipment: any[];
  previousMonthData: any;
  historicalData: any[];
  suggestions: string;
  isPreviewOpen: boolean;
  isDownloading: boolean;
  isSendingEmail: boolean;
  onTogglePreview: () => void;
  onDownload: () => void;
  onSendEmail: () => void;
}

export const PDFReportCard: React.FC<PDFReportCardProps> = ({
  row,
  idx,
  equipment,
  previousMonthData,
  historicalData,
  suggestions,
  isPreviewOpen,
  isDownloading,
  isSendingEmail,
  onTogglePreview,
  onDownload,
  onSendEmail,
}) => {
  return (
    <div className="space-y-4 animate-slide-up" style={{ animationDelay: `${0.05 * idx}s` }}>
      <Card className="group hover:border-primary/20 transition-all shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-md bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold truncate leading-tight">
                {row.nomeDoSite || row.nomeDoCliente || `Fatura ${idx + 1}`}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 border-none px-2 py-0">
                  {formatMesReferencia(row.mesReferencia)}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-medium">UC: {row.instalacao || '—'}</Badge>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border-none px-2 py-0 font-bold">
                  {formatCurrency(row.valorTotalRS)}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-wider">
                {row.nomeConcessionaria || '—'} • {calcularConsumoTotal(row)} kWh
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePreview}
              className={isPreviewOpen ? 'bg-secondary' : ''}
            >
              {isPreviewOpen ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPreviewOpen ? 'Ocultar' : 'Ver'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isDownloading}
              onClick={onDownload}
            >
              {isDownloading ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4 mr-2" />}
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isSendingEmail}
              onClick={onSendEmail}
            >
              {isSendingEmail ? <Spinner className="w-4 h-4" /> : <Mail className="w-4 h-4 mr-2" />}
              E-mail
            </Button>
          </div>
        </CardContent>
      </Card>

      <PDFPreview
        data={row}
        equipment={equipment || []}
        previousMonthData={previousMonthData}
        historicalData={historicalData}
        suggestions={suggestions}
        show={isPreviewOpen}
      />
    </div>
  );
};
