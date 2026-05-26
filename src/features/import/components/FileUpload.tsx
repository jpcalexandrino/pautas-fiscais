import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFatura } from '@features/faturas/context/FaturaContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusProps {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  selectedFiles: File[];
  rowsCount: number;
}

const UploadStatus = ({ isLoading, isSuccess, error, selectedFiles, rowsCount }: StatusProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 animate-fade-in py-4">
        <Spinner className="w-8 h-8" />
        <div>
          <p className="text-foreground font-bold">Processando arquivos...</p>
          <p className="text-xs text-muted-foreground mt-1">Analisando dados das planilhas</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 animate-scale-in py-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="text-foreground font-bold text-lg tracking-tight">Importação concluída!</p>
          <div className="flex items-center justify-center gap-3 mt-1.5">
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">
              {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} arquivos`}
            </span>
            <span className="text-border">|</span>
            <span className="text-xs text-primary font-bold">
              {rowsCount} faturas encontradas
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 animate-scale-in py-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <p className="text-destructive font-bold text-lg">Erro ao processar</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

const UploadIdle = ({ isDragging }: { isDragging: boolean }) => (
  <div className="flex flex-col items-center gap-5 py-2">
    <div className={cn(
      "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
      isDragging ? "bg-primary text-primary-foreground scale-110 shadow-lg" : "bg-secondary text-primary border border-border"
    )}>
      <Upload className="w-7 h-7" />
    </div>
    <div>
      <p className="text-foreground font-bold text-xl tracking-tight">
        {isDragging ? 'Solte para importar' : 'Importar Planilhas'}
      </p>
      <p className="text-sm text-muted-foreground mt-1 font-medium">
        Arraste ou <span className="text-primary hover:underline decoration-2">clique para selecionar arquivos</span>
      </p>
    </div>
    <div className="flex items-center gap-2 mt-1">
      <Badge variant="secondary" className="text-[10px] font-bold">CSV</Badge>
      <Badge variant="secondary" className="text-[10px] font-bold">XLSX</Badge>
      <Badge variant="secondary" className="text-[10px] font-bold">XLS</Badge>
    </div>
  </div>
);

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, importFiles, clearData } = useFatura();
  const { isLoading, error, rows } = state;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, []);

  const processFiles = (files: FileList) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['csv', 'xlsx', 'xls'].includes(ext);
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles);
    importFiles(validFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isSuccess = rows.length > 0 && !isLoading && !error;
  const showStatus = isLoading || isSuccess || !!error;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200",
          isDragging ? "border-primary bg-primary/5 ring-4 ring-primary/5" :
            isSuccess ? "border-primary/20 bg-primary/5" :
              error ? "border-destructive/30 bg-destructive/5" :
                "bg-background border-primary/50 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          id="file-upload-input"
        />

        {showStatus ? (
          <UploadStatus
            isLoading={isLoading}
            isSuccess={isSuccess}
            error={error}
            selectedFiles={selectedFiles}
            rowsCount={rows.length}
          />
        ) : (
          <UploadIdle isDragging={isDragging} />
        )}
      </div>

      {selectedFiles.length > 0 && !isLoading && (
        <Card className="animate-slide-up border-border shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3 bg-muted/20">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {selectedFiles.length === 1 ? 'Arquivo Selecionado' : `${selectedFiles.length} Arquivos Selecionados`}
            </CardTitle>
            {isSuccess && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setSelectedFiles([]);
                  clearData();
                }}
                className="h-7 text-destructive hover:bg-destructive/10 text-[10px] font-bold"
              >
                <X className="w-3 h-3 mr-1" /> Limpar tudo
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-56 overflow-y-auto p-1 space-y-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 bg-background rounded border border-border text-primary">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate max-w-[400px]">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  {isSuccess && (
                    <div className="p-1 bg-primary/10 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
