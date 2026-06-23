import { usePautas, useEstados } from '../hooks/usePautas';
import { PautaUpload, type ResultadoProcessamento } from '../components/PautaUpload';
import { ReprocessTab } from '../components/ReprocessTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Upload, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function PautasImportPage() {
  const { data: estados = [] } = useEstados();
  const {
    uploadPauta,
    isUploading,
    ocrFiles = [],
    reprocessPauta,
    isReprocessing,
  } = usePautas();

  const handleUpload = async (file: File, uf: string): Promise<ResultadoProcessamento> => {
    const toastId = toast.loading('Processando pauta...');
    try {
      const result = await uploadPauta({ file, uf });

      toast.success('Pauta processada com sucesso!', {
        id: toastId,
        description: `${result.autoInserted} inseridos, ${result.pendingReview} pendentes de revisão.`,
      });

      return result;
    } catch (error) {
      toast.error('Falha no processamento', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Erro inesperado ao enviar o arquivo.',
      });
      throw error;
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6 max-w-2xl mx-auto px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Importar Pauta Fiscal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie o PDF extraído do Diário Oficial ou reprocessar dados já extraídos do Textract.
        </p>
      </div>

      {estados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-sidebar/20">
          Nenhum estado disponível para importação.
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="size-4" />
              Novo Upload (PDF)
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="size-4" />
              Reprocessar Pauta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <PautaUpload estados={estados} onUpload={handleUpload} isUploading={isUploading} />
          </TabsContent>

          <TabsContent value="database">
            <ReprocessTab
              estados={estados}
              ocrFiles={ocrFiles}
              reprocessPauta={reprocessPauta}
              isReprocessing={isReprocessing}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
