import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ClientsImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (importedClients: any[]) => Promise<void>;
  isLoading: boolean;
}

const TEMPLATE_HEADERS = [
  'Número da UC', 'Nome da UC', 'Distribuidora', 'Subgrupo',
  'CPF/CNPJ', 'E-mail', 'CEP', 'Estado', 'Cidade',
  'Logradouro', 'Número', 'Complemento'
];

function handleDownloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  ws['!cols'] = TEMPLATE_HEADERS.map(h => ({ wch: Math.max(h.length + 4, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, 'modelo_importacao_clientes.xlsx');
  toast.success('Modelo baixado com sucesso!');
}

function sanitizeToString(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    if (value > 1e6 || value < -1e6) {
      return BigInt(Math.round(value)).toString();
    }
    return String(value);
  }
  const str = String(value).trim();
  if (/^-?\d+([.,]\d+)?e[+-]?\d+$/i.test(str)) {
    try {
      const normalized = str.replace(',', '.');
      return BigInt(Math.round(Number(normalized))).toString();
    } catch { return str; }
  }
  return str;
}

const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (!evt.target?.result) return resolve([]);
        const data = new Uint8Array(evt.target.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { raw: true });

        if (rows.length === 0) return resolve([]);

        const mapped = (rows as any[]).map(row => ({
          uc_number: sanitizeToString(row['Número da UC'] || row['UC'] || ''),
          name: row['Nome da UC'] || row['Nome'] || '',
          distributor: row['Distribuidora'] || '',
          subgroup: row['Subgrupo'] || '',
          cnpj: sanitizeToString(row['CPF/CNPJ'] || row['CNPJ'] || ''),
          contact_email: row['E-mail'] || row['Email'] || '',
          cep: sanitizeToString(row['CEP'] || ''),
          uf: row['Estado'] || row['UF'] || '',
          city: row['Cidade'] || '',
          address: row['Logradouro'] || row['Endereço'] || '',
          number: sanitizeToString(row['Número'] || ''),
          complement: row['Complemento'] || '',
        })).filter(c => c.name && c.name.trim() !== '');

        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const ClientsImportDialog: React.FC<ClientsImportDialogProps> = ({
  isOpen,
  onOpenChange,
  onImportComplete,
  isLoading,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')
    );
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    } else {
      toast.error('Formato de arquivo inválido. Utilize .xlsx, .xls ou .csv');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const results = await Promise.all(selectedFiles.map(parseExcelFile));
      const allMappedClients = results.flat();

      if (allMappedClients.length === 0) {
        toast.warning('Nenhum cliente válido encontrado nas planilhas.');
        return;
      }

      await onImportComplete(allMappedClients);
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao importar Excel:', error);
      toast.error('Erro ao processar os arquivos', {
        description: 'Verifique o formato e as colunas das planilhas.',
      });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) {
        onOpenChange(open);
        if (!open) setSelectedFiles([]);
      }
    }}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Importar Clientes
          </DialogTitle>
          <DialogDescription>
            Envie planilhas para cadastrar múltiplos clientes de uma só vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Section for downloading template */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Ainda não tem a planilha modelo?</p>
                <p className="text-muted-foreground text-xs">Use nosso padrão para garantir a importação sem erros.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 shrink-0 h-8 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Modelo.xlsx
            </Button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              multiple
              className="hidden"
            />
            <div className="p-3 bg-muted rounded-full text-muted-foreground group-hover:text-primary transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">
                Arrastar & soltar planilhas aqui
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ou clique para selecionar arquivos (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>

          {/* File list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Arquivos selecionados ({selectedFiles.length})
              </p>
              <div className="space-y-1.5">
                {selectedFiles.map((file, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 rounded-md border bg-muted/20 text-sm animate-fade-in"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate font-medium text-xs max-w-70">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      disabled={isLoading}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={selectedFiles.length === 0 || isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <>
                <Spinner className="w-3.5 h-3.5" />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Importação ({selectedFiles.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
