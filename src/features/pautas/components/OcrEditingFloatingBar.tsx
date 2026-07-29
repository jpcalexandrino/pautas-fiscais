import { Save, X, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';

interface OcrEditingFloatingBarProps {
  isSavingEdits?: boolean;
  onSaveEdits: () => void;
  onToggleEditingMode: () => void;
}

export function OcrEditingFloatingBar({
  isSavingEdits = false,
  onSaveEdits,
  onToggleEditingMode,
}: OcrEditingFloatingBarProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-card/95 backdrop-blur-md border border-border/60 shadow-xl rounded-xl px-3.5 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Edit3 className="size-3.5 text-amber-500 shrink-0" />
        <span>Modo Edição</span>
      </div>

      <Separator orientation="vertical" className="h-4 bg-border/50" />

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleEditingMode}
          disabled={isSavingEdits}
          className="h-7 px-2.5 text-xs border-border/60 hover:bg-accent transition-all cursor-pointer gap-1"
        >
          <X className="size-3" />
          Cancelar
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onSaveEdits}
          disabled={isSavingEdits}
          className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer shadow-2xs transition-all"
        >
          {isSavingEdits ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="size-3" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
