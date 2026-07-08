import { useState, useRef, useEffect } from 'react';
import { usePautas, useEstados, useOcrTables } from '../hooks/usePautas';
import { useProdutos } from '@/features/produtos/hooks/useProdutos';
import { OcrTablesViewer } from '../components/OcrTablesViewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DatePicker } from '@/components/ui/date-picker';
import { Upload, Database, Search, Check, UploadCloud, FileText, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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
        // Se a data_pauta for retornada como string ISO datetime de banco, pega apenas a parte da data YYYY-MM-DD
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

    const toastId = toast.loading('Processando OCR e tabelas da pauta...');
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

      // Auto-seleciona o arquivo recém-carregado para carregar a tabela na hora
      setAuditFilename(result.arquivo);
      if (uploadVigenciaDate) {
        setVigenciaDate(uploadVigenciaDate);
      }
      
      // Muda de volta para o modo de seleção com animação
      setMode('select');
      
      // Limpa os campos do formulário de upload
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
    <div className="animate-fade-in pb-10 space-y-6 max-w-7xl mx-auto px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Importar & Auditar Pautas Fiscais</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um PDF de pauta já processado no banco de dados ou envie um novo arquivo para estruturar e auditar preços de pauta.
        </p>
      </div>

      {estados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-sidebar/20">
          Nenhum estado disponível para importação.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Seção Superior de Controle */}
          <div className="w-full bg-card border rounded-2xl shadow-md overflow-hidden transition-all duration-300">
            <div className="relative overflow-hidden">
              <div 
                className="flex w-[200%] transition-transform duration-500 ease-in-out"
                style={{ transform: mode === 'select' ? 'translateX(0)' : 'translateX(-50%)' }}
              >
                {/* 1. PAINEL SELECIONAR DO BANCO */}
                <div className="w-1/2 p-6 shrink-0 space-y-6">
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3 text-primary font-semibold text-sm">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Database className="size-4" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-sm font-semibold text-foreground">Selecionar Pauta Existente</h2>
                        <p className="text-[11px] text-muted-foreground font-normal">Selecione um arquivo PDF que já foi carregado e defina a vigência.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode('upload')}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer shrink-0 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Enviar novo PDF <ArrowRight className="size-3" />
                    </button>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                    {/* Filtros à esquerda */}
                    <div className="lg:col-span-4 p-4 border-r space-y-4">
                      <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-2">
                        <Search className="size-3.5 text-primary" />
                        Filtrar por Período
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground">Mês</label>
                          <Select value={filterMonth} onValueChange={setFilterMonth} disabled={ocrFiles.length === 0}>
                            <SelectTrigger className="w-full bg-background text-xs h-9">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="text-xs">Todos os meses</SelectItem>
                              {monthsList.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground">Ano</label>
                          <Select value={filterYear} onValueChange={setFilterYear} disabled={ocrFiles.length === 0}>
                            <SelectTrigger className="w-full bg-background text-xs h-9">
                              <SelectValue placeholder="Todos" />
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
                    </div>

                    {/* Seleção do arquivo no centro/direita */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      {/* Selecionar Contexto */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Contexto *</label>
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

                      {/* Selecionar Arquivo */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Arquivo de Pauta *</label>
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

                      {/* Exibir UF */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Estado (UF)</label>
                        {selectedAuditUf ? (
                          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/40 text-xs font-medium text-foreground">
                            <span className="bg-primary/15 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {selectedAuditUf}
                            </span>
                            <span className="truncate text-muted-foreground text-[11px]">
                              {estados.find((e: any) => e.uf === selectedAuditUf)?.nome || ''}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center h-10 px-3 border border-dashed rounded-md bg-muted/20 text-xs text-muted-foreground/60 italic">
                            Sem seleção
                          </div>
                        )}
                      </div>

                      {/* Selecionar Vigência */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                          <span>Data de Vigência *</span>
                          {sugestoesDatas.includes(vigenciaDate) && (
                            <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1 py-0.5 rounded font-semibold animate-pulse">
                              Detectada
                            </span>
                          )}
                        </label>
                        <DatePicker
                          value={vigenciaDate}
                          onChange={setVigenciaDate}
                          disabled={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. PAINEL ENVIAR NOVO PDF */}
                <div className="w-1/2 p-6 shrink-0 space-y-6">
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3 text-primary font-semibold text-sm">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Upload className="size-4" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-sm font-semibold text-foreground">Enviar Novo PDF de Pauta</h2>
                        <p className="text-[11px] text-muted-foreground font-normal">Faça o upload do novo PDF para processar.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode('select')}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer shrink-0 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="size-3" /> Voltar para Selecionar
                    </button>
                  </div>

                  {/* Upload controls */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1 items-start">
                    {/* Dropzone Area */}
                    <div className="space-y-1.5 lg:col-span-5">
                      <label className="text-xs font-semibold text-muted-foreground">Arquivo PDF *</label>
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
                        className={`
                          border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all duration-200 min-h-[90px] flex flex-col items-center justify-center gap-1
                          ${isDragging 
                            ? 'border-primary bg-primary/5 scale-[0.98]' 
                            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
                          }
                          ${selectedFile ? 'border-emerald-500/30 bg-emerald-500/5' : ''}
                          ${isUploading ? 'pointer-events-none opacity-60' : ''}
                        `}
                      >
                        {selectedFile ? (
                          <div className="flex items-center justify-between w-full px-2">
                            <div className="flex items-center gap-2 truncate">
                              <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                <FileText className="size-4" />
                              </div>
                              <div className="text-left truncate">
                                <div className="text-[11px] font-semibold text-foreground truncate max-w-[120px] sm:max-w-[150px]">
                                  {selectedFile.name}
                                </div>
                                <div className="text-[9px] text-muted-foreground">
                                  {(selectedFile.size / 1024).toFixed(0)} KB
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(null);
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors shrink-0 cursor-pointer"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className={`size-5 text-muted-foreground/60 transition-transform ${isDragging ? 'scale-110 text-primary' : ''}`} />
                            <div className="text-xs text-muted-foreground font-medium">
                              Arraste seu PDF ou <span className="text-primary hover:underline font-semibold">procure</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fields + Button */}
                    <div className="lg:col-span-7 grid grid-cols-3 gap-3 items-end">
                      {/* Selecionar Contexto */}
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground">Contexto *</label>
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

                      {/* Select UF */}
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground">Estado (UF) *</label>
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

                      {/* Data de Vigência da Pauta */}
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground">Vigência *</label>
                        <DatePicker
                          value={uploadVigenciaDate}
                          onChange={setUploadVigenciaDate}
                          disabled={isUploading}
                          placeholder="Selecione"
                        />
                      </div>

                      {/* Botão de Envio */}
                      <div className="col-span-3 pt-1">
                        <Button
                          className={`w-full text-xs h-10 font-semibold transition-all duration-200 ${
                            selectedFile && uploadUf && uploadVigenciaDate && !isUploading
                              ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg' 
                              : 'bg-muted text-muted-foreground border'
                          }`}
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

              </div>
            </div>
          </div>

          {/* Seção Inferior: Tabelas de Auditoria */}
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
