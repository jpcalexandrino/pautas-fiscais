import { PDFViewer } from '@react-pdf/renderer';
import { FileText } from 'lucide-react';
import PDFDocument from './PDFDocument';

interface PDFPreviewProps {
  data: any;
  equipment?: any[];
  previousMonthData?: any;
  suggestions?: string | null;
  historicalData?: any[];
  show?: boolean;
}

export default function PDFPreview({
  data,
  equipment = [],
  previousMonthData = null,
  suggestions = null,
  historicalData = [],
  show = false
}: PDFPreviewProps) {
  if (!show) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-slide-up shadow-md">
      <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b border-border">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground tracking-tight text-left">Visualização do Relatório</span>
      </div>
      <div className="h-175 bg-muted/20">
        <PDFViewer key={suggestions || 'loading'} width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
          <PDFDocument
            data={data}
            equipment={equipment}
            previousMonthData={previousMonthData}
            suggestions={suggestions}
            historicalData={historicalData}
          />
        </PDFViewer>
      </div>
    </div>
  );
}

