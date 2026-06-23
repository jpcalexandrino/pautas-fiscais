import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ResultadoProcessamento } from './PautaUpload';
import { ReprocessResult } from './ReprocessResult';

interface Estado {
  uf: string;
  nome: string;
}

interface OcrFile {
  id: number;
  filename: string;
  uf: string;
}

interface ReprocessTabProps {
  estados: Estado[];
  ocrFiles: OcrFile[];
  reprocessPauta: (params: { filename: string; uf: string }) => Promise<ResultadoProcessamento>;
  isReprocessing: boolean;
}

export function ReprocessTab({ estados, ocrFiles, reprocessPauta, isReprocessing }: ReprocessTabProps) {
  const [selectedFilename, setSelectedFilename] = useState('');
  const [selectedUf, setSelectedUf] = useState('');
  const [reprocessResult, setReprocessResult] = useState<ResultadoProcessamento | null>(null);
  const [reprocessError, setReprocessError] = useState<string | null>(null);



  // Auto-fill UF when selected file changes
  useEffect(() => {
    if (selectedFilename) {
      const file = ocrFiles.find((f) => f.filename === selectedFilename);
      if (file) {
        setSelectedUf(file.uf);
      }
    } else {
      setSelectedUf('');
    }
    setReprocessResult(null);
    setReprocessError(null);
  }, [selectedFilename, ocrFiles]);

  const handleReprocess = async () => {
    if (!selectedFilename || !selectedUf) {
      setReprocessError('Selecione o arquivo e a UF antes de prosseguir.');
      return;
    }
    setReprocessError(null);
    setReprocessResult(null);
    const toastId = toast.loading('Reprocessando pauta com IA comparativa...');
    try {
      const result = await reprocessPauta({ filename: selectedFilename, uf: selectedUf });
      setReprocessResult(result);
      toast.success('Reprocessamento concluído!', {
        id: toastId,
        description: `${result.autoInserted} inseridos, ${result.pendingReview} pendentes de revisão.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao reprocessar.';
      setReprocessError(message);
      toast.error('Falha no reprocessamento', {
        id: toastId,
        description: message,
      });
    }
  };



  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Reprocessar pauta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Select do arquivo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ocr-file-select">Arquivo Processado *</Label>
              </div>
              <Select
                value={selectedFilename}
                onValueChange={setSelectedFilename}
                disabled={isReprocessing || ocrFiles.length === 0}
              >
                <SelectTrigger id="ocr-file-select">
                  <SelectValue placeholder={ocrFiles.length === 0 ? "Nenhum arquivo no banco de dados" : "Selecione o arquivo"} />
                </SelectTrigger>
                <SelectContent>
                  {ocrFiles.map((file) => (
                    <SelectItem key={file.id} value={file.filename}>
                      {file.filename} ({file.uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select da UF */}
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="reprocess-uf-select">Estado (UF) *</Label>
              <Select
                value={selectedUf}
                onValueChange={setSelectedUf}
                disabled={isReprocessing || !selectedFilename}
              >
                <SelectTrigger id="reprocess-uf-select">
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
          </div>

          {/* Feedbacks de erro e sucesso */}
          {reprocessError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{reprocessError}</span>
            </div>
          )}

          {reprocessResult && <ReprocessResult result={reprocessResult} />}

          <Button
            onClick={handleReprocess}
            disabled={!selectedFilename || !selectedUf || isReprocessing}
            className="gap-2 w-full sm:w-auto"
          >
            {isReprocessing ? (
              <>
                <Spinner className="w-4 h-4 animate-spin" />
                Reprocessando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Reprocessar Pauta
              </>
            )}
          </Button>
        </CardContent>
      </Card>

    </>
  );
}
