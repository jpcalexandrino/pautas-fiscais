import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import type { ResultadoProcessamento } from './PautaUpload';

interface ReprocessResultProps {
  result: ResultadoProcessamento;
}

export function ReprocessResult({ result }: ReprocessResultProps) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="font-semibold text-emerald-900 dark:text-emerald-400">
          Reprocessamento concluído — {result.arquivo}
        </p>
      </div>
      <p className="text-muted-foreground">{result.totalExtracted} itens mapeados no total.</p>
      <div className="flex gap-2 mt-2">
        <Badge variant="default">✓ {result.autoInserted} inseridos</Badge>
        {result.pendingReview > 0 && (
          <Badge variant="destructive">⚠ {result.pendingReview} pendentes</Badge>
        )}
      </div>
    </div>
  );
}
