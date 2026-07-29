import { useRef, useState, type ReactNode } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import * as xlsx from 'xlsx';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SpreadsheetImportResult {
  success: boolean;
  processed: number;
  inserted: number;
  updated: number;
  errors: { row: number; error: string }[];
}

export interface ImportSpreadsheetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<SpreadsheetImportResult>;
  title: string;
  description: ReactNode;
  templateRows: Record<string, unknown>[];
  templateSheetName: string;
  templateFileName: string;
  successDetail?: string;
  importErrorFallback?: string;
  instructions?: ReactNode;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function isAcceptedFile(name: string) {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function ImportSpreadsheetDialog({
  isOpen,
  onOpenChange,
  onImport,
  title,
  description,
  templateRows,
  templateSheetName,
  templateFileName,
  successDetail = 'Todos os registros foram importados sem erros.',
  importErrorFallback = 'Falha ao importar planilha.',
  instructions,
}: ImportSpreadsheetDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SpreadsheetImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (isAcceptedFile(selectedFile.name)) {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Formato de arquivo inválido. Use apenas .xlsx, .xls ou .csv.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleDownloadTemplate = () => {
    try {
      const ws = xlsx.utils.json_to_sheet(templateRows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, templateSheetName);
      xlsx.writeFile(wb, templateFileName);
      toast.success('Modelo de importação baixado!');
    } catch {
      toast.error('Erro ao gerar modelo de importação.');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const response = await onImport(file);
      setResult(response);
      toast.success('Processamento do arquivo concluído!');
    } catch (error) {
      toast.error((error as Error).message || importErrorFallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setDragActive(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 my-2">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>Precisa do arquivo modelo com as colunas corretas?</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Baixar Modelo
              </Button>
            </div>

            {instructions}

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center cursor-pointer group ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : file
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isLoading}
              />

              {file ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-6 h-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm max-w-md truncate">{file.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB • Pronto para importar
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    disabled={isLoading}
                  >
                    Remover arquivo
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">
                    Arraste a planilha ou clique para selecionar
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Tipos de arquivos aceitos: Excel (.xlsx, .xls) ou CSV de até 10MB.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 my-2 animate-fade-in">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-muted/20 text-center">
                <span className="text-2xl font-bold text-foreground">{result.processed}</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Processados</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{result.inserted}</span>
                <span className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Inseridos</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.updated}</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Atualizados</span>
              </div>
            </div>

            {result.errors.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-800 dark:text-green-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Importação concluída com sucesso!</p>
                  <p className="opacity-90 text-xs mt-0.5">{successDetail}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">Processado com {result.errors.length} erro(s)</p>
                    <p className="opacity-90 text-xs mt-0.5">
                      Algumas linhas da planilha falharam e foram ignoradas. Veja os detalhes abaixo.
                    </p>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden bg-background">
                  <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold text-muted-foreground">
                    Erros por Linha da Planilha
                  </div>
                  <ScrollArea className="h-44">
                    <div className="divide-y text-xs px-4">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="py-2.5 flex items-start gap-2.5">
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-foreground mr-1.5">Linha {err.row}:</span>
                            <span className="text-muted-foreground leading-relaxed">{err.error}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose} className="cursor-pointer">Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading} className="cursor-pointer">
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!file || isLoading} className="gap-2 cursor-pointer">
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Importação'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
