import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Layers, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { formatCurrency } from '@/shared/utils/formatters';
import { formatDateToBR } from './PautasDataTable';
import { usePautasRelacionadas } from '../hooks/usePautas';
import type { Pauta } from '@/shared/types';

interface PautaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pauta: Pauta | null;
  onConfirmDelete: (params: { id: string; justificativa: string; apagarDePara: boolean }) => Promise<void>;
  isDeleting: boolean;
}

export function PautaDeleteDialog({
  open,
  onOpenChange,
  pauta,
  onConfirmDelete,
  isDeleting,
}: PautaDeleteDialogProps) {
  const [justificativa, setJustificativa] = useState('');
  const [apagarDePara, setApagarDePara] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: relatedData, isLoading: isLoadingRelated } = usePautasRelacionadas(open && pauta ? pauta.id : null);
  const relatedPautas = relatedData?.relatedPautas || [];

  useEffect(() => {
    if (open) {
      setJustificativa('');
      setApagarDePara(false);
      setErrorMsg('');
    }
  }, [open]);

  if (!pauta) return null;

  const handleConfirm = async () => {
    if (!justificativa.trim() || justificativa.trim().length < 5) {
      setErrorMsg('A justificativa é obrigatória e deve ter pelo menos 5 caracteres.');
      return;
    }

    try {
      setErrorMsg('');
      await onConfirmDelete({
        id: pauta.id,
        justificativa: justificativa.trim(),
        apagarDePara,
      });
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir pauta');
    }
  };

  const isJustificativaValid = justificativa.trim().length >= 5;
  const isMultiProduct = relatedPautas.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl gap-4 bg-background border border-destructive/30 shadow-xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-muted/30 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
            <span className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="w-5 h-5" />
            </span>
            Excluir Pauta Fiscal
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Esta ação realizará a exclusão lógica da pauta e liberará a linha correspondente para nova carga no módulo OCR/De-Para.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1.5 px-1.5 flex-1 overflow-y-auto">
          {/* Card Detalhes da Pauta Alvo */}
          <div className="bg-muted/30 border border-muted/50 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center font-bold text-foreground border-b border-muted/30 pb-2">
              <span className="truncate pr-2">{pauta.descricao_interna}</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-extrabold shrink-0">
                {formatCurrency(Number(pauta.valor_pauta))}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
              <div>
                <strong>UF:</strong> {pauta.uf} - {pauta.nome_estado}
              </div>
              <div>
                <strong>Vigência:</strong> {formatDateToBR(pauta.data)}
              </div>
              {pauta.codigo_interno && (
                <div>
                  <strong>Código ERP:</strong> {pauta.codigo_interno}
                </div>
              )}
              {pauta.gtin_13 && (
                <div>
                  <strong>GTIN:</strong> {pauta.gtin_13}
                </div>
              )}
              {pauta.arquivo_origem && (
                <div className="col-span-2 truncate">
                  <strong>Arquivo:</strong> {pauta.arquivo_origem}
                </div>
              )}
            </div>
          </div>

          {/* Se houver carregamento das pautas vinculadas */}
          {isLoadingRelated ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-xl border border-muted/30">
              <Spinner className="w-4 h-4" />
              Verificando produtos vinculados ao mesmo termo no arquivo...
            </div>
          ) : isMultiProduct ? (
            /* Lista de Produtos do mesmo Termo */
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-snug">
                  <strong className="font-bold">Aviso: Termo do arquivo vinculado a múltiplos produtos!</strong>
                  <p className="text-[11px] opacity-90">
                    O termo desta pauta no arquivo foi mapeado para <strong>{relatedPautas.length} produtos juntos</strong>. Ao excluir, <strong>todos os produtos abaixo vinculados a este termo serão excluídos</strong> e a linha ficará liberada para recarga no OCR:
                  </p>
                </div>
              </div>

              {/* Lista dos Produtos Vincularos */}
              <div className="max-h-36 overflow-y-auto scrollbar-thin space-y-1.5 p-1.5 bg-background/60 rounded-lg border border-amber-500/20">
                {relatedPautas.map((rp: any) => {
                  const isTarget = String(rp.sk_pauta || rp.id) === String(pauta.id);
                  return (
                    <div
                      key={rp.sk_pauta || rp.id}
                      className={`flex items-center justify-between p-2 rounded text-xs border ${
                        isTarget
                          ? 'bg-amber-500/10 border-amber-500/40 font-semibold'
                          : 'bg-background/80 border-muted/30'
                      }`}
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <div className="flex items-center gap-1.5 text-foreground truncate">
                          <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{rp.descricao_interna}</span>
                          {isTarget && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.25 rounded uppercase shrink-0">
                              Alvo
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-2">
                          {rp.nk_codigo_interno && <span>ERP: {rp.nk_codigo_interno}</span>}
                          {rp.gtin_13 && <span>GTIN: {rp.gtin_13}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/30 shrink-0">
                        {formatCurrency(Number(rp.valor_pauta))}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted/20 border border-muted/30 rounded-xl text-xs text-muted-foreground">
              Esta exclusão desvinculará a pauta acima e liberará a linha no arquivo OCR para nova importação.
            </div>
          )}

          {/* Campo Justificativa Obrigatória */}
          <div className="space-y-1.5">
            <Label htmlFor="justificativa" className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Justificativa da Exclusão <span className="text-destructive">*</span></span>
              <span className="text-[10px] text-muted-foreground font-normal">Mínimo 5 caracteres</span>
            </Label>
            <textarea
              id="justificativa"
              rows={3}
              placeholder="Descreva obrigatoriamente o motivo da exclusão desta pauta..."
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className={`w-full text-xs p-3 rounded-xl bg-background border transition-all resize-none outline-none ${
                errorMsg 
                  ? 'border-destructive focus:ring-2 focus:ring-destructive/30' 
                  : 'border-input hover:border-muted-foreground/40 focus:border-destructive/60 focus:ring-2 focus:ring-destructive/20'
              }`}
            />
            {errorMsg && (
              <p className="text-[11px] text-destructive font-medium animate-fade-in">{errorMsg}</p>
            )}
          </div>

          {/* Checkbox De-Para */}
          <div className="flex items-center space-x-2.5 px-3 py-2.5 bg-muted/20 border border-dashed border-muted/60 rounded-xl">
            <Checkbox
              id="apagar-de-para"
              checked={apagarDePara}
              onCheckedChange={(checked) => setApagarDePara(!!checked)}
              className="cursor-pointer"
            />
            <Label
              htmlFor="apagar-de-para"
              className="text-xs text-muted-foreground font-medium leading-tight cursor-pointer select-none"
            >
              Apagar também o mapeamento De-Para salvo para esta descrição de produto neste estado
            </Label>
          </div>
        </div>

        <DialogFooter className="border-t border-muted/30 pt-3 gap-2 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isDeleting} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={!isJustificativaValid || isDeleting || isLoadingRelated}
            className="gap-1.5 cursor-pointer shadow-md font-semibold"
          >
            {isDeleting ? (
              <>
                <Spinner className="w-4 h-4 mr-1" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {isMultiProduct ? `Excluir ${relatedPautas.length} Pautas` : 'Confirmar Exclusão'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
