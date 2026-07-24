import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="fixed bottom-6 right-6 z-50 bg-card border shadow-lg rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="text-xs font-medium text-foreground">Modo Edição</span>
      </div>
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={onSaveEdits}
        disabled={isSavingEdits}
      >
        <Save className="size-3.5" />
        {isSavingEdits ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggleEditingMode}
        disabled={isSavingEdits}
      >
        <X className="size-3.5" />
        Cancelar
      </Button>
    </div>
  );
}
