import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import * as xlsx from 'xlsx';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeParaImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (file: File) => Promise<any>;
}

interface ImportResult {
  success: boolean;
  processed: number;
  inserted: number;
  updated: number;
  errors: { row: number; error: string }[];
}

export function DeParaImportDialog({
  isOpen,
  onOpenChange,
  onImportSuccess,
}: DeParaImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase();
    if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Formato de arquivo inválido. Use apenas .xlsx, .xls ou .csv.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'UF': 'SP',
          'Termo na Pauta': 'CERVEJA IMPERIO PILSEN LN 355ML',
          'GTIN na Pauta': '7898585910014',
          'Código ERP Produto': '12345',
          'GTIN do Produto': '7898585910014',
          'Nome do Produto': 'CERVEJA IMPERIO PILSEN LN 355ML',
        },
        {
          'UF': 'RJ',
          'Termo na Pauta': 'CERVEJA IMPERIO LATA 269ML',
          'GTIN na Pauta': '',
          'Código ERP Produto': '54321',
          'GTIN do Produto': '',
          'Nome do Produto': '',
        },
      ];

      const ws = xlsx.utils.json_to_sheet(templateData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'De-Para');
      xlsx.writeFile(wb, 'modelo_importacao_depara.xlsx');
      toast.success('Modelo de importação baixado!');
    } catch (error) {
      toast.error('Erro ao gerar modelo de importação.');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await onImportSuccess(file);
      setResult(response);
      toast.success('Processamento do arquivo concluído!');
    } catch (error: any) {
      toast.error(error.message || 'Falha ao importar registros de De-Para.');
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
          <DialogTitle>Importar De-Para via Excel</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha no formato <strong>.xlsx, .xls ou .csv</strong> para cadastrar ou atualizar múltiplos mapeamentos De-Para de uma vez.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 my-2">
            {/* Template Download Section */}
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

            {/* Explanatory notes */}
            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 space-y-1.5">
              <p className="font-semibold text-amber-800 dark:text-amber-400">Instruções para o preenchimento:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>UF:</strong> Sigla do estado (Ex: SP, RJ, MG) com 2 letras.</li>
                <li><strong>Termo na Pauta:</strong> Descrição exata de como o produto aparece na pauta do estado.</li>
                <li><strong>GTIN na Pauta:</strong> EAN/Código de barras do produto na pauta (opcional).</li>
                <li>Para vincular ao produto interno correto, preencha <strong>ao menos um</strong> dos seguintes: <strong>Código ERP Produto</strong>, <strong>GTIN do Produto</strong> ou <strong>Nome do Produto</strong>.</li>
              </ul>
            </div>

            {/* Dropzone Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
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
          /* Result Report Section */
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

            {/* Success Notification */}
            {result.errors.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-800 dark:text-green-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Importação concluída com sucesso!</p>
                  <p className="opacity-90 text-xs mt-0.5">Todos os registros de De-Para foram importados sem erros.</p>
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
