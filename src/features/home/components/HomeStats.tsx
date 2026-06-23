import { Database, ClipboardCheck, Package, ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { Card, CardDescription, CardTitle, CardFooter, CardHeader } from '@/components/ui/card';
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
  const renderValue = (value: number, extra?: React.ReactNode) =>
    isLoading ? <Skeleton className="h-8 w-16 rounded-md" /> : <>{value}{extra}</>;

  return (
    <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Pautas Homologadas */}
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardDescription>Pautas Homologadas</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums tracking-tighter">
              {renderValue(stats.pautasCount)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="flex items-center gap-1 font-medium">
              Consolidadas na base <Database className="h-3.5 w-3.5" />
            </div>
            <div className="text-muted-foreground text-xs">Total de pautas fiscais ativas</div>
          </CardFooter>
        </Card>

        {/* Revisões Pendentes */}
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardDescription>Revisões Pendentes</CardDescription>
            <CardTitle className="text-3xl flex items-center font-bold tabular-nums tracking-tighter text-amber-600 dark:text-amber-400">
              {renderValue(stats.pendentesCount, <TriangleAlert className="ml-2" />)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="flex items-center gap-1 font-medium">
              Aguardando associação <ClipboardCheck className="h-3.5 w-3.5" />
            </div>
            <div className="text-muted-foreground text-xs">Produtos sem classificação automática</div>
          </CardFooter>
        </Card>

        {/* Produtos Registrados */}
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardDescription>Produtos Registrados</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums tracking-tighter">
              {renderValue(stats.produtosCount)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="flex items-center gap-1 font-medium">
              Produtos internos <Package className="h-3.5 w-3.5" />
            </div>
            <div className="text-muted-foreground text-xs">Total de produtos cadastrados no ERP</div>
          </CardFooter>
        </Card>

        {/* Regras De-Para */}
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardDescription>Regras De-Para</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums tracking-tighter">
              {renderValue(stats.deParaCount)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="flex items-center gap-1 font-medium">
              Mapeamentos ativos <ArrowLeftRight className="h-3.5 w-3.5" />
            </div>
            <div className="text-muted-foreground text-xs">Sinônimos de estados configurados</div>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
