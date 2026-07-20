import { useState, useRef, useEffect } from 'react';
import { usePautas, useEstados, useOcrTables } from '../hooks/usePautas';
import { useProdutos } from '@/features/produtos/hooks/useProdutos';
import { OcrTablesViewer } from '../components/OcrTablesViewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DatePicker } from '@/components/ui/date-picker';
import { UploadCloud, X, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import pdfLogo from '@/assets/pdf.png';
import { Label } from '@/shared/components/ui/label';

export default function PautasImportPage() {
  const [contexto, setContexto] = useState<'proprio' | 'terceiros'>(() => {
    return (sessionStorage.getItem('pautas_import_contexto') as 'proprio' | 'terceiros') || 'proprio';
  });
  const { data: estados = [] } = useEstados();
  const {
    uploadPauta,
    isUploading,
    ocrFiles = [],
    confirmManualPauta,
    updateOcrTables,
    isUpdatingOcrTables,
    loading: isLoadingPautas,
  } = usePautas({ contexto });

  const { produtos = [] } = useProdutos();

  const [auditFilename, setAuditFilename] = useState<string>(() => {
    return sessionStorage.getItem('pautas_import_filename') || '';
  });
  const [vigenciaDate, setVigenciaDate] = useState<string>('');

  // Estados para filtros de arquivos
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    return sessionStorage.getItem('pautas_import_month') || 'all';
  });
  const [filterYear, setFilterYear] = useState<string>(() => {
    return sessionStorage.getItem('pautas_import_year') || 'all';
  });

  useEffect(() => {
    sessionStorage.setItem('pautas_import_contexto', contexto);
  }, [contexto]);

  useEffect(() => {
    sessionStorage.setItem('pautas_import_filename', auditFilename);
  }, [auditFilename]);

  useEffect(() => {
    sessionStorage.setItem('pautas_import_month', filterMonth);
  }, [filterMonth]);

  useEffect(() => {
    sessionStorage.setItem('pautas_import_year', filterYear);
  }, [filterYear]);

  const monthsList = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const availableYears = Array.from(new Set(
    ocrFiles
      .map((f: any) => {
        if (!f.data_pauta) return '';
        const datePart = typeof f.data_pauta === 'string' ? f.data_pauta.split('T')[0] : '';
        return datePart ? datePart.split('-')[0] : '';
      })
      .filter((year: string) => year !== '')
  )).sort((a: any, b: any) => b.localeCompare(a));

  const filteredOcrFiles = ocrFiles.filter((file: any) => {
    if (!file.data_pauta) return filterMonth === 'all' && filterYear === 'all';
    const datePart = typeof file.data_pauta === 'string' ? file.data_pauta.split('T')[0] : '';
    if (!datePart) return false;
    const [year, month] = datePart.split('-');
    
    const matchMonth = filterMonth === 'all' || month === filterMonth;
    const matchYear = filterYear === 'all' || year === filterYear;
    return matchMonth && matchYear;
  });

   // Estados para o formulário de upload
  const [uploadUf, setUploadUf] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadVigenciaDate, setUploadVigenciaDate] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mode, setMode] = useState<'select' | 'upload'>(() => {
    return (sessionStorage.getItem('pautas_import_mode') as 'select' | 'upload') || 'select';
  });

  useEffect(() => {
    sessionStorage.setItem('pautas_import_mode', mode);
  }, [mode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Se não houver arquivos no banco, inicia no modo de upload automaticamente
  useEffect(() => {
    if (!isLoadingPautas && ocrFiles.length === 0) {
      setMode('upload');
    }
  }, [isLoadingPautas, ocrFiles.length]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são aceitos.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const { data: queryData, isLoading: isLoadingTabelas } = useOcrTables(auditFilename, contexto);
  const tabelas = queryData?.tabelas || [];
  const sugestoesDatas = queryData?.sugestoesDatas || [];
  const dbConfirmedCells = queryData?.confirmedCells || [];

  const ocrFileUf = queryData?.uf || '';
  const selectedAuditFile = ocrFiles.find((f: any) => f.filename === auditFilename);
  const selectedAuditUf = ocrFileUf || (selectedAuditFile ? selectedAuditFile.uf : '');

  // Preenche a data de vigência com a data cadastrada no banco, ou limpa se não houver
  useEffect(() => {
    if (auditFilename) {
      const selectedFileObj = ocrFiles.find((f: any) => f.filename === auditFilename);
      if (selectedFileObj && selectedFileObj.data_pauta) {
        const datePart = typeof selectedFileObj.data_pauta === 'string'
          ? selectedFileObj.data_pauta.split('T')[0]
          : '';
        setVigenciaDate(datePart);
      } else {
        setVigenciaDate('');
      }
    } else {
      setVigenciaDate('');
    }
  }, [auditFilename, ocrFiles]);

  // Preenche a data de vigência automaticamente com a primeira sugestão encontrada no OCR
  useEffect(() => {
    if (sugestoesDatas.length > 0 && !vigenciaDate) {
      setVigenciaDate(sugestoesDatas[0]);
      const dataFormatada = sugestoesDatas[0].split('-').reverse().join('/');
      toast.success('Data de vigência autodetectada!', {
        description: `Preenchemos o campo com a data ${dataFormatada} encontrada no PDF.`,
      });
    }
  }, [sugestoesDatas, vigenciaDate]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são aceitos.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadAndAudit = async () => {
    if (!selectedFile || !uploadUf || !uploadVigenciaDate) {
      toast.warning('Selecione o estado (UF), o arquivo PDF e a data de vigência antes de carregar.');
      return;
    }

    const toastId = toast.loading('Processando arquivos e tabelas da pauta...');
    try {
      const result = await uploadPauta({
        file: selectedFile,
        uf: uploadUf,
        dataPauta: uploadVigenciaDate,
        contexto
      });
      
      toast.success('Pauta carregada com sucesso!', {
        id: toastId,
        description: 'Verifique e associe os produtos.',
      });

      setAuditFilename(result.arquivo);
      if (uploadVigenciaDate) {
        setVigenciaDate(uploadVigenciaDate);
      }
      
      setMode('select');
      setSelectedFile(null);
      setUploadUf('');
      setUploadVigenciaDate('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error('Falha no upload', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Erro ao processar arquivo.',
      });
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-8 w-full px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Importar e Auditar Pautas Fiscais</h1>
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
          {/* Seletor de Modo Limpo & Minimalista */}
          <div className="flex border-b border-muted pb-px justify-start gap-6">
            <button
              onClick={() => setMode('select')}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer",
                mode === 'select'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Pautas Cadastradas
            </button>
            <button
              onClick={() => setMode('upload')}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer",
                mode === 'upload'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Carregar Novo PDF
            </button>
          </div>

          {/* Painel do Modo Selecionado */}
          {mode === 'select' ? (
            <div className="bg-card border border-muted/50 rounded-xl p-5 shadow-sm space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Contexto */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Contexto</Label>
                  <Select
                    value={contexto}
                    onValueChange={(val: any) => {
                      setContexto(val);
                      setAuditFilename('');
                    }}
                  >
                    <SelectTrigger className="w-full bg-background text-xs h-10">
                      <SelectValue placeholder="Selecione o contexto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprio" className="text-xs">Produtos Próprios</SelectItem>
                      <SelectItem value="terceiros" className="text-xs">Produtos de Terceiros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Período */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Filtrar Período</Label>
                  <div className="flex gap-2">
                    <Select value={filterMonth} onValueChange={setFilterMonth} disabled={ocrFiles.length === 0}>
                      <SelectTrigger className="w-full bg-background text-xs h-10">
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos os meses</SelectItem>
                        {monthsList.map((m) => (
                          <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterYear} onValueChange={setFilterYear} disabled={ocrFiles.length === 0}>
                      <SelectTrigger className="w-full bg-background text-xs h-10">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos os anos</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year} className="text-xs">{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Arquivo PDF */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Arquivo de Pauta</Label>
                  <Select
                    value={auditFilename || undefined}
                    onValueChange={(val) => setAuditFilename(val)}
                    disabled={filteredOcrFiles.length === 0}
                  >
                    <SelectTrigger className="w-full bg-background text-xs h-10">
                      <SelectValue placeholder={filteredOcrFiles.length === 0 ? "Nenhum arquivo" : "Selecione o arquivo..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredOcrFiles.map((file: any) => (
                        <SelectItem key={file.id} value={file.filename} className="text-xs">
                          {file.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informações detalhadas inline (Vigência e Estado) */}
              {auditFilename && (
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-muted/30 text-xs">
                  <span className="text-muted-foreground">UF do Estado:</span>
                  {selectedAuditUf ? (
                    <span className="inline-flex items-center bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold">
                      {selectedAuditUf} - {estados.find((e: any) => e.uf === selectedAuditUf)?.nome || ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60 italic">Não identificado</span>
                  )}

                  <span className="text-muted-foreground ml-2">Data de Vigência:</span>
                  {vigenciaDate ? (
                    <span className="inline-flex items-center bg-muted border text-muted-foreground px-2.5 py-1 rounded-md font-medium">
                      {vigenciaDate.split('-').reverse().join('/')}
                    </span>
                  ) : (
                    <span className="text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md font-medium">
                      Vigência não definida
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-muted/50 rounded-xl p-5 shadow-sm space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* PDF Dropzone */}
                <div className="md:col-span-5 space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Arquivo PDF *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={cn(
                      "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors min-h-[102px] flex flex-col items-center justify-center gap-1 bg-muted/10 hover:bg-muted/30 border-muted-foreground/20 hover:border-primary/50",
                      isDragging && "border-primary bg-primary/5",
                      selectedFile && "border-primary/30 bg-primary/5",
                      isUploading && "pointer-events-none opacity-60"
                    )}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center gap-2 truncate">
                          <img src={pdfLogo} alt="PDF" className="size-7 shrink-0 object-contain" />
                          <div className="text-left truncate">
                            <p className="text-xs font-semibold text-foreground truncate max-w-[140px] sm:max-w-[180px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors shrink-0 cursor-pointer h-6 w-6"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="size-6 text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground font-medium">
                          Arraste o PDF ou <span className="text-primary hover:underline font-semibold">procure no dispositivo</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Form Fields + Button */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Contexto *</Label>
                    <Select value={contexto} onValueChange={(val: any) => setContexto(val)} disabled={isUploading}>
                      <SelectTrigger className="bg-background text-xs h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprio" className="text-xs">Produtos Próprios</SelectItem>
                        <SelectItem value="terceiros" className="text-xs">Produtos de Terceiros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Estado (UF) *</Label>
                    <Select value={uploadUf} onValueChange={setUploadUf} disabled={isUploading}>
                      <SelectTrigger className="bg-background text-xs h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {estados.map((e: any) => (
                          <SelectItem key={e.uf} value={e.uf} className="text-xs">
                            {e.uf} - {e.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Vigência *</Label>
                    <DatePicker
                      value={uploadVigenciaDate}
                      onChange={setUploadVigenciaDate}
                      disabled={isUploading}
                      placeholder="Selecione"
                    />
                  </div>

                  <div className="sm:col-span-3 pt-2">
                    <Button
                      className="w-full text-xs h-10 font-semibold transition-all duration-150"
                      onClick={handleUploadAndAudit}
                      disabled={!selectedFile || !uploadUf || !uploadVigenciaDate || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Spinner className="w-4 h-4 animate-spin mr-2" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Check className="size-4 mr-2" />
                          Processar e Auditar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabelas de Auditoria */}
          {auditFilename ? (
            <div className="pt-2">
              <OcrTablesViewer
                tabelas={tabelas}
                isLoading={isLoadingTabelas}
                filename={auditFilename}
                produtos={produtos}
                uf={selectedAuditUf}
                dataPauta={vigenciaDate}
                dbConfirmedCells={dbConfirmedCells}
                onConfirmManual={confirmManualPauta}
                updateOcrTables={updateOcrTables}
                isUpdatingOcrTables={isUpdatingOcrTables}
                contexto={contexto}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground border rounded-lg bg-card shadow-sm border-dashed space-y-2">
              <Search className="size-8 mx-auto text-muted-foreground/60" />
              <h3 className="font-semibold text-foreground text-sm">Nenhuma pauta selecionada</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Selecione uma pauta existente acima ou carregue um novo arquivo PDF para visualizar e auditar as tabelas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
