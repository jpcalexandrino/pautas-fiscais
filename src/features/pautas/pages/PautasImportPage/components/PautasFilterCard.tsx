import { Search, FolderCog } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/shared/components/ui/label';

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
    <Card className="border-border/50 shadow-xs rounded-xl p-5 space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Contexto */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Contexto</Label>
          <Select
            value={contexto}
            onValueChange={(val: any) => {
              onContextoChange(val);
              onAuditFilenameChange('');
            }}
          >
            <SelectTrigger className="w-full bg-background text-xs h-10">
              <SelectValue placeholder="Selecione o contexto" />
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

        {/* Filtro Período */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Filtrar Período</Label>
          <div className="flex gap-2">
            <Select value={filterMonth} onValueChange={onFilterMonthChange} disabled={ocrFilesCount === 0}>
              <SelectTrigger className="w-full bg-background text-xs h-10">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todos os meses
                </SelectItem>
                {monthsList.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={onFilterYearChange} disabled={ocrFilesCount === 0}>
              <SelectTrigger className="w-full bg-background text-xs h-10">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todos os anos
                </SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year} className="text-xs">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Arquivo PDF */}
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">Arquivo de Pauta</Label>
            <Button type="button" variant="outline" size="sm" onClick={onOpenManager}>
              <FolderCog />
              Gerenciar Arquivos
            </Button>
          </div>
          <Select
            value={auditFilename || undefined}
            onValueChange={(val) => onAuditFilenameChange(val)}
            disabled={filteredOcrFiles.length === 0}
          >
            <SelectTrigger className="w-full bg-background text-xs h-10">
              <SelectValue
                placeholder={
                  filteredOcrFiles.length === 0 ? 'Nenhum arquivo' : 'Selecione o arquivo...'
                }
              />
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
      </div>

      {/* Informações detalhadas inline (Vigência e Estado) */}
      {auditFilename && (
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/40 text-xs">
          <span className="text-muted-foreground">UF do Estado:</span>
          {selectedAuditUf ? (
            <span className="inline-flex items-center bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold">
              {selectedAuditUf} - {estados.find((e: any) => e.uf === selectedAuditUf)?.nome || ''}
            </span>
          ) : (
            <span className="text-muted-foreground/60 italic">Não identificado</span>
          )}

          <span className="text-muted-foreground ml-2">Data de Vigência:</span>
          {vigenciaDate ? (
            <span className="inline-flex items-center bg-muted border text-muted-foreground px-2.5 py-1 rounded-md font-medium">
              {vigenciaDate.split('-').reverse().join('/')}
            </span>
          ) : (
            <span className="text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md font-medium">
              Vigência não definida
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
