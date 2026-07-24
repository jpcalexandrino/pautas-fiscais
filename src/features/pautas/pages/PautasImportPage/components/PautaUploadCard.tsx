import { useRef, useState } from 'react';
import { UploadCloud, X, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import pdfLogo from '@/assets/pdf.png';

interface PautaUploadCardProps {
  contexto: 'proprio' | 'terceiros';
  onContextoChange: (val: 'proprio' | 'terceiros') => void;
  estados: any[];
  isUploading: boolean;
  onUploadAndAudit: (params: {
    file: File;
    uf: string;
    dataPauta: string;
    contexto: 'proprio' | 'terceiros';
  }) => Promise<void>;
}

export function PautaUploadCard({
  contexto,
  onContextoChange,
  estados,
  isUploading,
  onUploadAndAudit,
}: PautaUploadCardProps) {
  const [uploadUf, setUploadUf] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadVigenciaDate, setUploadVigenciaDate] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async () => {
    if (!selectedFile || !uploadUf || !uploadVigenciaDate) {
      toast.warning('Selecione o estado (UF), o arquivo PDF e a data de vigência antes de carregar.');
      return;
    }

    try {
      await onUploadAndAudit({
        file: selectedFile,
        uf: uploadUf,
        dataPauta: uploadVigenciaDate,
        contexto,
      });

      setSelectedFile(null);
      setUploadUf('');
      setUploadVigenciaDate('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // O tratamento de toast de erro já está no handler pai
    }
  };

  return (
    <Card className="border-border/50 shadow-xs rounded-xl p-5 space-y-5 animate-fade-in">
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
              'border border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors min-h-[102px] flex flex-col items-center justify-center gap-1 bg-muted/10 hover:bg-muted/30 border-muted-foreground/20 hover:border-primary/50',
              isDragging && 'border-primary bg-primary/5',
              selectedFile && 'border-primary/30 bg-primary/5',
              isUploading && 'pointer-events-none opacity-60'
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
                  className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors shrink-0 cursor-pointer h-6 w-6"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <UploadCloud className="size-6 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground font-medium">
                  Arraste o PDF ou{' '}
                  <span className="text-primary hover:underline font-semibold">
                    procure no dispositivo
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Form Fields + Button */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Contexto *</Label>
            <Select value={contexto} onValueChange={(val: any) => onContextoChange(val)} disabled={isUploading}>
              <SelectTrigger className="bg-background text-xs h-10">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proprio" className="text-xs">
                  Produtos Próprios
                </SelectItem>
                <SelectItem value="terceiros" className="text-xs">
                  Produtos de Terceiros
                </SelectItem>
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
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={!selectedFile || !uploadUf || !uploadVigenciaDate || isUploading}
            >
              {isUploading ? (
                <>
                  <Spinner className="size-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Processar e Auditar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
