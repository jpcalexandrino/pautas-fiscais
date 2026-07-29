import { SlidersHorizontal, FolderCog, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';

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
  { value: '12', label: 'Dezembro' },
];

interface PautasFilterCardProps {
  contexto: 'proprio' | 'terceiros';
  onContextoChange: (val: 'proprio' | 'terceiros') => void;
  filterMonth: string;
  onFilterMonthChange: (val: string) => void;
  filterYear: string;
  onFilterYearChange: (val: string) => void;
  availableYears: string[];
  ocrFilesCount: number;
  filteredOcrFiles: any[];
  auditFilename: string;
  onAuditFilenameChange: (filename: string) => void;
  onOpenManager: () => void;
  selectedAuditUf: string;
  estados: any[];
  vigenciaDate: string;
}

export function PautasFilterCard({
  contexto,
  onContextoChange,
  filterMonth,
  onFilterMonthChange,
  filterYear,
  onFilterYearChange,
  availableYears,
  ocrFilesCount,
  filteredOcrFiles,
  auditFilename,
  onAuditFilenameChange,
  onOpenManager,
  selectedAuditUf,
  estados,
  vigenciaDate,
}: PautasFilterCardProps) {
  return (
    <Card className="border border-border/50 shadow-2xs rounded-xl p-4 sm:p-5 space-y-3.5 bg-card animate-fade-in">
      {/* Título e Ícone do Container do Filtro */}
      <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <SlidersHorizontal className="size-3.5 text-primary" />
          Filtros de Pautas Cadastradas
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onOpenManager}
          className="text-xs h-6 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer transition-all gap-1 font-medium"
        >
          <FolderCog className="size-3" />
          Gerenciar Pautas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end pt-0.5">
        {/* Contexto */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Contexto
          </Label>
          <Select
            value={contexto}
            onValueChange={(val: any) => {
              onContextoChange(val);
              onAuditFilenameChange('');
            }}
          >
            <SelectTrigger className="w-full bg-background text-xs h-7.5 rounded-xl border-border/60 hover:border-border transition-all px-2.5">
              <SelectValue placeholder="Selecione o contexto" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="proprio" className="text-xs rounded-lg">
                Produtos Próprios
              </SelectItem>
              <SelectItem value="terceiros" className="text-xs rounded-lg">
                Produtos de Terceiros
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Período */}
        <div className="md:col-span-4 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Período (Mês / Ano)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterMonth} onValueChange={onFilterMonthChange} disabled={ocrFilesCount === 0}>
              <SelectTrigger className="w-full bg-background text-xs h-7.5 rounded-xl border-border/60 hover:border-border transition-all px-2.5">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs rounded-lg">
                  Todos os meses
                </SelectItem>
                {monthsList.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs rounded-lg">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={onFilterYearChange} disabled={ocrFilesCount === 0}>
              <SelectTrigger className="w-full bg-background text-xs h-7.5 rounded-xl border-border/60 hover:border-border transition-all px-2.5">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs rounded-lg">
                  Todos os anos
                </SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year} className="text-xs rounded-lg">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Arquivo PDF */}
        <div className="md:col-span-5 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Arquivo de Pauta
          </Label>
          <Select
            value={auditFilename || undefined}
            onValueChange={(val) => onAuditFilenameChange(val)}
            disabled={filteredOcrFiles.length === 0}
          >
            <SelectTrigger className="w-full bg-background text-xs h-7.5 rounded-xl border-border/60 hover:border-border transition-all px-2.5">
              <SelectValue
                placeholder={
                  filteredOcrFiles.length === 0 ? 'Nenhum arquivo encontrado' : 'Selecione a pauta...'
                }
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              {filteredOcrFiles.map((file: any) => (
                <SelectItem key={file.id} value={file.filename} className="text-xs rounded-lg">
                  {file.filename}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Separator + Resumo minimalista de estado/vigência da pauta selecionada */}
      {auditFilename && (
        <div className="pt-3 space-y-3">
          <Separator className="bg-border/40" />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {selectedAuditUf && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-0.5 rounded-xl text-xs font-semibold border border-primary/20 hover:bg-primary/15 transition-all">
                <MapPin className="size-3" />
                {selectedAuditUf} {estados.find((e: any) => e.uf === selectedAuditUf)?.nome ? `- ${estados.find((e: any) => e.uf === selectedAuditUf)?.nome}` : ''}
              </span>
            )}

            {selectedAuditUf && vigenciaDate && (
              <Separator orientation="vertical" className="h-3.5 bg-border/50" />
            )}

            {vigenciaDate ? (
              <span className="inline-flex items-center gap-1.5 bg-muted/60 text-muted-foreground px-2.5 py-0.5 rounded-xl text-xs font-medium border border-border/40 hover:bg-muted/80 transition-all">
                <Calendar className="size-3" />
                Vigência: {vigenciaDate.split('-').reverse().join('/')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-xl text-xs font-medium border border-amber-500/20">
                <Calendar className="size-3" />
                Vigência não definida
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
