import { useState, useMemo } from 'react';
import { Search, Trash2, FileText, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { formatDateToBR } from './PautasDataTable';
import { toast } from 'sonner';

interface OcrFileItem {
  id: number | string;
  filename: string;
  uf: string;
  data_pauta?: string | null;
  confirmed_count?: number;
  total_prices?: number;
  contexto?: string;
  created_at?: string;
}

interface OcrFilesManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocrFiles: OcrFileItem[];
  contexto: string;
  onDeleteFile: (filename: string, contexto: string) => Promise<void>;
  isDeleting: boolean;
  activeFilename?: string;
  onSelectFile?: (filename: string) => void;
}

export function OcrFilesManagerDialog({
  open,
  onOpenChange,
  ocrFiles,
  contexto,
  onDeleteFile,
  isDeleting,
  activeFilename,
  onSelectFile,
}: OcrFilesManagerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileToDelete, setFileToDelete] = useState<OcrFileItem | null>(null);

  const normalize = (str: string) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const filteredFiles = useMemo(() => {
    const term = normalize(searchTerm);
    if (!term) return ocrFiles;
    return ocrFiles.filter(
      (f) =>
        normalize(f.filename).includes(term) ||
        normalize(f.uf).includes(term)
    );
  }, [ocrFiles, searchTerm]);

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await onDeleteFile(fileToDelete.filename, contexto);
      toast.success('Arquivo OCR excluído com sucesso!', {
        description: `O arquivo ${fileToDelete.filename} foi removido do banco de dados.`,
      });
      if (activeFilename === fileToDelete.filename && onSelectFile) {
        onSelectFile('');
      }
      setFileToDelete(null);
    } catch (err: any) {
      toast.error('Erro ao excluir arquivo', {
        description: err.message || 'Falha ao processar exclusão do arquivo.',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-w-4xl w-[95vw] h-[80vh] flex flex-col rounded-xl gap-4 bg-background border border-border/60 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                  <FileText className="w-5 h-5" />
                </span>
                Gerenciar Arquivos OCR Cadastrados
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Visualize os PDFs processados no contexto <strong className="text-foreground capitalize">{contexto}</strong>. Arquivos sem pautas lançadas podem ser excluídos.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Filtro de Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/55" />
            <Input
              placeholder="Buscar arquivo por nome ou UF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-7.5 bg-background border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-primary px-2.5"
            />
          </div>

          {/* Tabela de Arquivos */}
          <div className="flex-1 overflow-y-auto border border-border/50 rounded-xl bg-card divide-y divide-border/30 min-h-0 scrollbar-thin">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
                <span className="text-xs font-semibold">Nenhum arquivo OCR encontrado</span>
                <span className="text-[11px] opacity-75">Envie um arquivo PDF ou altere o termo de busca.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/20 border-b border-border/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5">Arquivo</th>
                    <th className="px-4 py-2.5 w-[100px]">UF</th>
                    <th className="px-4 py-2.5 w-[130px]">Vigência</th>
                    <th className="px-4 py-2.5 w-[150px]">Pautas Lançadas</th>
                    <th className="px-4 py-2.5 w-[90px] text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredFiles.map((file) => {
                    const hasPautas = (file.confirmed_count || 0) > 0;
                    const isSelected = activeFilename === file.filename;

                    return (
                      <tr
                        key={file.id}
                        className={`hover:bg-muted/20 transition-colors ${
                          isSelected ? 'bg-primary/[0.04]' : ''
                        }`}
                      >
                        {/* Nome do Arquivo */}
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2 max-w-[320px]">
                            <div className="p-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-foreground truncate text-xs" title={file.filename}>
                              {file.filename}
                            </span>
                          </div>
                        </td>

                        {/* UF */}
                        <td className="px-4 py-2.5 align-middle">
                          <Badge variant="outline" className="font-semibold text-[10px] bg-primary/10 text-primary border-primary/20 rounded-xl px-2">
                            {file.uf}
                          </Badge>
                        </td>

                        {/* Vigência */}
                        <td className="px-4 py-2.5 align-middle text-muted-foreground text-xs font-normal">
                          {file.data_pauta ? formatDateToBR(file.data_pauta) : '-'}
                        </td>

                        {/* Status de Pautas */}
                        <td className="px-4 py-2.5 align-middle">
                          {hasPautas ? (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2.5 py-0.5 text-[10px] rounded-xl">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              {file.confirmed_count} lançadas
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-border/40 bg-muted/30 text-muted-foreground font-medium px-2.5 py-0.5 text-[10px] rounded-xl">
                              Sem pautas
                            </Badge>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-2.5 align-middle text-center">
                          {hasPautas ? (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              disabled
                              className="text-muted-foreground/30 cursor-not-allowed opacity-40 h-6 w-6 rounded-lg"
                              title="Não é possível excluir o arquivo pois ele possui pautas lançadas no sistema."
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setFileToDelete(file)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors h-6 w-6 rounded-lg"
                              title="Excluir Arquivo PDF do OCR"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <DialogFooter className="border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total de arquivos em <strong className="capitalize text-foreground">{contexto}</strong>: {ocrFiles.length}
            </span>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-7 px-2.5 text-xs cursor-pointer">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Arquivo */}
      <Dialog open={!!fileToDelete} onOpenChange={(val) => !val && setFileToDelete(null)}>
        <DialogContent className="sm:max-w-xl rounded-xl gap-4 bg-background border border-destructive/30 shadow-xl z-[60]">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <span className="p-1.5 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="w-4 h-4" />
              </span>
              Excluir Arquivo PDF do OCR
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Confirme a exclusão do arquivo PDF cadastrado no banco de dados do OCR.
            </DialogDescription>
          </DialogHeader>

          {fileToDelete && (
            <div className="space-y-3 py-1">
              <div className="p-3.5 bg-muted/20 border border-border/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-semibold text-foreground text-xs leading-snug break-all">
                    {fileToDelete.filename}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
                  <span><strong>UF:</strong> {fileToDelete.uf}</span>
                  {fileToDelete.data_pauta && (
                    <span><strong>Vigência:</strong> {formatDateToBR(fileToDelete.data_pauta)}</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esta ação removerá o arquivo PDF e o histórico do OCR deste arquivo no sistema. Nenhuma pauta lançada será afetada pois este arquivo não contém lançamentos.
              </p>
            </div>
          )}

          <DialogFooter className="border-t border-border/40 gap-1.5 flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={() => setFileToDelete(null)} disabled={isDeleting} className="h-7 px-2.5 text-xs cursor-pointer">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer shadow-2xs"
            >
              {isDeleting ? (
                <>
                  <Spinner className="w-3 h-3 mr-1 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
