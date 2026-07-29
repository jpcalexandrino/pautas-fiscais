import { useState, useRef, useCallback } from 'react';
import { Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import pdfIcon from '@/assets/pdf.png';

export interface Estado {
  uf: string;
  nome: string;
}

export interface ResultadoProcessamento {
  arquivo: string;
  totalExtracted: number;
  autoInserted: number;
  pendingReview: number;
}

interface PautaUploadProps {
  estados: Estado[];
  onUpload: (file: File, uf: string) => Promise<ResultadoProcessamento>;
  isUploading: boolean;
}

export function PautaUpload({ estados, onUpload, isUploading }: PautaUploadProps) {
  const [uf, setUf] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ResultadoProcessamento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetAll = useCallback(() => {
    setFile(null);
    setUf('');
    setResult(null);
    setError(null);
  }, []);

  const resetFeedbacks = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  const handleFile = useCallback((f: File) => {
    resetFeedbacks();
    if (!f.name.toLowerCase().endsWith('.pdf') || f.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são aceitos.');
      setFile(null);
      return;
    }
    setFile(f);
  }, [resetFeedbacks]);

  const handleUfChange = useCallback((value: string) => {
    setUf(value);
    resetFeedbacks();
  }, [resetFeedbacks]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) setDragOver(true);
  }, [isUploading]);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (isUploading) return;
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [isUploading, handleFile]);

  const handleSubmit = useCallback(async () => {
    if (!file || !uf) {
      setError('Selecione o estado e o arquivo PDF antes de prosseguir.');
      return;
    }
    resetFeedbacks();
    try {
      const res = await onUpload(file, uf);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno ao processar o arquivo.');
    }
  }, [file, uf, onUpload, resetFeedbacks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Upload de Pauta Fiscal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Select de estados */}
        {estados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-sidebar/20">
            Nenhum estado disponível para importação.
          </div>
        ) : (
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="uf-select">Estado (UF) *</Label>
            <Select value={uf} onValueChange={handleUfChange} disabled={isUploading}>
              <SelectTrigger id="uf-select">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={e.uf} value={e.uf}>
                    {e.uf} - {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Área de upload */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer select-none',
            dragOver ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-50 bg-muted/20'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
          role="button"
          aria-label="Área para upload de PDF da pauta"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !isUploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner className="w-8 h-8 text-primary animate-spin" />
              <p className="font-medium text-sm">Processando pauta...</p>
              <p className="text-xs text-muted-foreground">Aguarde enquanto a IA estrutura e cruza com a tabela De-Para</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-3">
              <img src={pdfIcon} alt="PDF" className='w-16' />
              <p className="font-medium text-sm max-w-xs truncate">{file.name}</p>
              <Badge variant="secondary" className="bg-primary/20">
                {(file.size / 1024).toFixed(0)} KB
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetAll} className="mt-2 hover:bg-destructive/20 hover:text-destructive">
                <X className="size-4 text-destructive"/>Limpar arquivo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-muted-foreground" />
              <p className="font-medium text-sm">
                {dragOver ? 'Solte o arquivo aqui...' : 'Arraste o PDF da pauta ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground">Suporta PDFs nativos e escaneados</p>
            </div>
          )}
        </div>

        {/* Feedbacks */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" /> 
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-semibold text-emerald-900 dark:text-emerald-400">
                Processamento concluído — {result.arquivo}
              </p>
            </div>
            <p className="text-muted-foreground">{result.totalExtracted} itens mapeados no total.</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default">✓ {result.autoInserted} inseridos</Badge>
              {result.pendingReview > 0 && (
                <Badge variant="destructive">⚠ {result.pendingReview} pendentes</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={resetAll} className="mt-3">
              Novo Upload
            </Button>
          </div>
        )}

        <Button 
          onClick={handleSubmit}
          disabled={!file || !uf || isUploading} 
          className="gap-2 w-full sm:w-auto"
        >
          {isUploading ? (
            <>
              <Spinner className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Processar Pauta
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
