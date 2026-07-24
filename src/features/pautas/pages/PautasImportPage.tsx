import { useState } from 'react';
import { usePautas, useEstados, useOcrTables } from '../hooks/usePautas';
import { useProdutos } from '@/features/produtos/hooks/useProdutos';
import { OcrTablesViewer } from '../components/OcrTablesViewer';
import { OcrFilesManagerDialog } from '../components/OcrFilesManagerDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, Search } from 'lucide-react';
import { toast } from 'sonner';
import { usePautasImportFilters } from './PautasImportPage/hooks/usePautasImportFilters';
import { PautasFilterCard } from './PautasImportPage/components/PautasFilterCard';
import { PautaUploadCard } from './PautasImportPage/components/PautaUploadCard';

export default function PautasImportPage() {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { data: estados = [] } = useEstados();
  const { produtos = [] } = useProdutos();

  // Custom hook para contexto temporário (carrega do sessionStorage se existir)
  const [contextoInicial] = useState<'proprio' | 'terceiros'>(() => {
    return (sessionStorage.getItem('pautas_import_contexto') as 'proprio' | 'terceiros') || 'proprio';
  });

  const {
    uploadPauta,
    isUploading,
    ocrFiles = [],
    confirmManualPauta,
    updateOcrTables,
    isUpdatingOcrTables,
    excluirArquivoOcr,
    isExcluindoArquivoOcr,
    loading: isLoadingPautas,
  } = usePautas({ contexto: contextoInicial });

  const { data: queryData, isLoading: isLoadingTabelas } = useOcrTables(
    sessionStorage.getItem('pautas_import_filename') || '',
    contextoInicial
  );

  const filters = usePautasImportFilters({
    ocrFiles,
    isLoadingPautas,
    queryDataUf: queryData?.uf,
  });

  const tabelas = queryData?.tabelas || [];
  const dbConfirmedCells = queryData?.confirmedCells || [];

  const handleUploadAndAudit = async ({
    file,
    uf,
    dataPauta,
    contexto: uploadContexto,
  }: {
    file: File;
    uf: string;
    dataPauta: string;
    contexto: 'proprio' | 'terceiros';
  }) => {
    const toastId = toast.loading('Processando arquivos e tabelas da pauta...');
    try {
      const result = await uploadPauta({
        file,
        uf,
        dataPauta,
        contexto: uploadContexto,
      });

      toast.success('Pauta carregada com sucesso!', {
        id: toastId,
        description: 'Verifique e associe os produtos.',
      });

      filters.setAuditFilename(result.arquivo);
      if (dataPauta) {
        filters.setVigenciaDate(dataPauta);
      }

      filters.setMode('select');
    } catch (error) {
      toast.error('Falha no upload', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Erro ao processar arquivo.',
      });
      throw error;
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-8 w-full px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Importar e Auditar Pautas Fiscais
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um PDF de pauta no banco de dados ou envie um novo arquivo para estruturar e auditar preços de pauta.
        </p>
      </div>

      {estados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-sidebar/20">
          Nenhum estado disponível para importação.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Seletor de Modo Shadcn UI Tabs Oficial */}
          <Tabs value={filters.mode} onValueChange={(val) => filters.setMode(val as 'select' | 'upload')}>
            <TabsList>
              <TabsTrigger value="select" className="cursor-pointer gap-2 text-xs">
                <Search className="size-3.5" />
                Pautas Cadastradas
              </TabsTrigger>
              <TabsTrigger value="upload" className="cursor-pointer gap-2 text-xs">
                <UploadCloud className="size-3.5" />
                Carregar Novo PDF
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Painel do Modo Selecionado */}
          {filters.mode === 'select' ? (
            <PautasFilterCard
              contexto={filters.contexto}
              onContextoChange={filters.setContexto}
              filterMonth={filters.filterMonth}
              onFilterMonthChange={filters.setFilterMonth}
              filterYear={filters.filterYear}
              onFilterYearChange={filters.setFilterYear}
              availableYears={filters.availableYears}
              ocrFilesCount={ocrFiles.length}
              filteredOcrFiles={filters.filteredOcrFiles}
              auditFilename={filters.auditFilename}
              onAuditFilenameChange={filters.setAuditFilename}
              onOpenManager={() => setIsManagerOpen(true)}
              selectedAuditUf={filters.selectedAuditUf}
              estados={estados}
              vigenciaDate={filters.vigenciaDate}
            />
          ) : (
            <PautaUploadCard
              contexto={filters.contexto}
              onContextoChange={filters.setContexto}
              estados={estados}
              isUploading={isUploading}
              onUploadAndAudit={handleUploadAndAudit}
            />
          )}

          {/* Tabelas de Auditoria (exibidas apenas na aba Pautas Cadastradas) */}
          {filters.mode === 'select' && (
            filters.auditFilename ? (
              <div className="pt-2">
                <OcrTablesViewer
                  tabelas={tabelas}
                  isLoading={isLoadingTabelas}
                  filename={filters.auditFilename}
                  produtos={produtos}
                  uf={filters.selectedAuditUf}
                  dataPauta={filters.vigenciaDate}
                  dbConfirmedCells={dbConfirmedCells}
                  onConfirmManual={confirmManualPauta}
                  updateOcrTables={updateOcrTables}
                  isUpdatingOcrTables={isUpdatingOcrTables}
                  contexto={filters.contexto}
                />
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground border rounded-2xl bg-card shadow-xs border-dashed space-y-2">
                <Search className="size-8 mx-auto text-muted-foreground/60" />
                <h3 className="font-semibold text-foreground text-sm">Nenhuma pauta selecionada</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Selecione uma pauta existente acima ou altere para &ldquo;Carregar Novo PDF&rdquo; para auditar um novo arquivo.
                </p>
              </div>
            )
          )}
        </div>
      )}

      <OcrFilesManagerDialog
        open={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        ocrFiles={ocrFiles}
        contexto={filters.contexto}
        onDeleteFile={async (filename, ctx) => {
          await excluirArquivoOcr({ filename, contexto: ctx });
        }}
        isDeleting={isExcluindoArquivoOcr}
        activeFilename={filters.auditFilename}
        onSelectFile={(fn) => filters.setAuditFilename(fn)}
      />
    </div>
  );
}
