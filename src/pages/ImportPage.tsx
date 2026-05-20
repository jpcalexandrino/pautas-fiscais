import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, FileSpreadsheet, Table, CheckCircle2, Lightbulb, Columns3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import FileUpload from '../components/upload/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Tip {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}

const tips: Tip[] = [
  {
    icon: FileSpreadsheet,
    title: 'Formatos Suportados',
    description: 'CSV, XLSX e XLS. Você pode selecionar e subir vários arquivos de uma vez para análise combinada.',
    iconColor: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    icon: Columns3,
    title: 'Mapeamento Inteligente',
    description: 'Os campos da planilha são identificados automaticamente. Procure usar cabeçalhos padronizados.',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
  },
  {
    icon: CheckCircle2,
    title: 'Validação em Tempo Real',
    description: 'O sistema valida a estrutura dos dados instantaneamente e apresenta um resumo do processamento.',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
];

export default function ImportPage() {
  const navigate = useNavigate();
  const { state } = useData();
  const rows = state.rows;
  const fileName = state.fileName;

  return (
    <div className="animate-fade-in pb-20 space-y-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importação de Dados</h1>
        <p className="text-sm text-muted-foreground">Envie suas planilhas de faturas para análise.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12 mt-8">
        {/* Upload Section */}
        <section className="relative">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold">Envie suas planilhas</h2>
            <p className="text-sm text-muted-foreground mt-1">Selecione uma ou mais faturas para iniciar a análise técnica</p>
          </div>

          <FileUpload />

          {rows.length > 0 && (
            <div className="mt-8 flex flex-col items-center gap-4 animate-slide-up">
              <Button
                size="lg"
                onClick={() => navigate({ to: '/dados' })}
                className="px-8 gap-2"
              >
                <span>Prosseguir para Análise ({rows.length} {rows.length === 1 ? 'fatura' : 'faturas'})</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              {fileName && (
                <Badge variant="secondary" className="px-3 py-1 font-bold gap-2 rounded-full">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[250px]">{fileName}</span>
                </Badge>
              )}
            </div>
          )}
        </section>

        <Separator />

        {/* Tips Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-md font-bold">Dicas de Importação</h2>
              <p className="text-xs text-muted-foreground">Boas práticas para garantir a precisão dos dados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tips.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <Card
                  key={idx}
                  className="group transition-all duration-300 border-border animate-slide-up"
                  style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
                >
                  <CardHeader className="p-6">
                    <div className={`w-10 h-10 rounded-lg ${tip.iconBg} ${tip.iconColor} flex items-center justify-center mb-4 border border-current/10`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-sm font-bold">{tip.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed font-medium mt-2">
                      {tip.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Current Session Info */}
        {rows.length > 0 && (
          <section className="animate-fade-in">
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shrink-0 border border-border shadow-sm">
                  <Table className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold">
                    Sessão ativa com {rows.length} {rows.length === 1 ? 'fatura carregada' : 'faturas carregadas'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    Você pode continuar adicionando arquivos ou prosseguir para a visualização detalhada.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/dados' })}
                  className="w-full sm:w-auto bg-background gap-2"
                >
                  <span>Ver Tabela de Dados</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
