import { Database, ClipboardCheck, Package, ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  pautasCount: number;
  pendentesCount: number;
  produtosCount: number;
  deParaCount: number;
}

interface HomeStatsProps {
  stats: Stats;
  isLoading: boolean;
}

export default function HomeStats({ stats, isLoading }: HomeStatsProps) {
  const renderValue = (value: number) =>
    isLoading ? <Skeleton className="h-9 w-20 rounded-md" /> : <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">{value}</span>;

  return (
    <section className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Pautas Homologadas */}
        <Card className="hover:border-primary/30 transition-all rounded-xl border border-muted/50 shadow-2xs">
          <CardContent className="p-5 flex flex-col justify-between h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide">Pautas Homologadas</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              {renderValue(stats.pautasCount)}
              <span className="text-[10px] text-muted-foreground mt-1">Total de pautas fiscais ativas</span>
            </div>
          </CardContent>
        </Card>

        {/* Revisões Pendentes */}
        <Card className="hover:border-amber-500/30 transition-all rounded-xl border border-muted/50 shadow-2xs">
          <CardContent className="p-5 flex flex-col justify-between h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide">Revisões Pendentes</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <TriangleAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              {isLoading ? (
                renderValue(stats.pendentesCount)
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
                    {stats.pendentesCount}
                  </span>
                </div>
              )}
              <span className="text-[10px] text-muted-foreground mt-1">Produtos pendentes de associação</span>
            </div>
          </CardContent>
        </Card>

        {/* Produtos Registrados */}
        <Card className="hover:border-primary/30 transition-all rounded-xl border border-muted/50 shadow-2xs">
          <CardContent className="p-5 flex flex-col justify-between h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide">Produtos Cadastrados</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              {renderValue(stats.produtosCount)}
              <span className="text-[10px] text-muted-foreground mt-1">Produtos integrados do ERP</span>
            </div>
          </CardContent>
        </Card>

        {/* Regras De-Para */}
        <Card className="hover:border-primary/30 transition-all rounded-xl border border-muted/50 shadow-2xs">
          <CardContent className="p-5 flex flex-col justify-between h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide">Regras De-Para</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              {renderValue(stats.deParaCount)}
              <span className="text-[10px] text-muted-foreground mt-1">Sinônimos ativos cadastrados</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
