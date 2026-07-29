import { useEffect } from 'react';
import { useAuth } from '@features/auth/context/AuthContext';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';
import { toast } from 'sonner';
import HomeGreeting from '../components/HomeGreeting';
import HomeStats from '../components/HomeStats';
import HomeQuickAccess from '../components/HomeQuickAccess';
import HomeWorkFlow from '../components/HomeWorkFlow';
import HomeCharts from '../components/HomeCharts';
import { useHomeDashboard } from '../hooks/useHomeDashboard';

const EMPTY_STATS = {
  pautasCount: 0,
  pendentesCount: 0,
  produtosCount: 0,
  deParaCount: 0,
};

export default function HomePage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useHomeDashboard();

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar estatísticas', {
        description: 'Não foi possível carregar os dados do painel.',
      });
    }
  }, [isError]);

  return (
    <div className="space-y-12 pb-12">
      <HomeGreeting userName={user?.name || 'Bem-vindo'} />

      <HomeStats stats={data?.stats ?? EMPTY_STATS} isLoading={isLoading} />

      <HomeCharts
        pautas={data?.pautas ?? []}
        ocrFiles={data?.ocrFiles ?? []}
        isLoading={isLoading}
      />

      <Separator />

      <Tabs defaultValue="actions" className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Painel Operacional</h2>
            <p className="text-muted-foreground text-xs">Selecione uma visão para gerenciar as pautas fiscais</p>
          </div>
          <TabsList className="flex gap-2 w-full sm:w-auto">
            <TabsTrigger value="actions">Acesso Rápido</TabsTrigger>
            <TabsTrigger value="flow">Fluxo de Trabalho</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="actions" className="focus-visible:outline-none">
          <HomeQuickAccess />
        </TabsContent>

        <TabsContent value="flow" className="focus-visible:outline-none">
          <HomeWorkFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
