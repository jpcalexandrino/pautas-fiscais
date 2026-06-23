import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Database } from 'lucide-react';

interface OcrJsonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  ocrData: any | null;
}

export function OcrJsonModal({ open, onOpenChange, filename, ocrData }: OcrJsonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-400 max-h-200 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Comparativo de Dados (OCR vs. IA)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Compare o JSON bruto gerado pelo Textract com o JSON estruturado gerado pela Inteligência Artificial para o arquivo <span className="font-semibold text-foreground">{filename}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* OCR JSON */}
          <div className="flex flex-col min-h-0">
            <span className="text-xs font-semibold mb-1.5 text-muted-foreground">JSON do Textract (OCR)</span>
            <div className="flex-1 overflow-auto rounded-md border bg-muted/40 p-4 font-mono text-xs text-foreground/80 scrollbar-thin">
              <pre className="whitespace-pre-wrap break-all">
                {ocrData ? JSON.stringify(ocrData.textract_json, null, 2) : 'Carregando...'}
              </pre>
            </div>
          </div>
          {/* AI JSON */}
          <div className="flex flex-col min-h-0">
            <span className="text-xs font-semibold mb-1.5 text-muted-foreground">JSON da IA (Mapeado)</span>
            <div className="flex-1 overflow-auto rounded-md border bg-muted/40 p-4 font-mono text-xs text-foreground/80 scrollbar-thin">
              <pre className="whitespace-pre-wrap break-all">
                {ocrData && ocrData.ai_json ? JSON.stringify(ocrData.ai_json, null, 2) : 'Nenhum JSON da IA disponível (processe o arquivo primeiro)'}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
