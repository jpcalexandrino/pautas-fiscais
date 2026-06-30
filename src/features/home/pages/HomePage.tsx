import { useState, useEffect } from 'react';
import { useAuth } from '@features/auth/context/AuthContext';
import { apiFetch } from '@/api/client';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';
import { toast } from 'sonner';
import HomeGreeting from '../components/HomeGreeting';
import HomeStats from '../components/HomeStats';
import HomeQuickAccess from '../components/HomeQuickAccess';
import HomeWorkFlow from '../components/HomeWorkFlow';
import HomeCharts from '../components/HomeCharts';

export default function HomePage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    pautasCount: 0,
    pendentesCount: 0,
    produtosCount: 0,
    deParaCount: 0,
  });
  const [pautas, setPautas] = useState<any[]>([]);
  const [ocrFiles, setOcrFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [pautasRes, ocrFilesRes, produtosRes, deParaRes] = await Promise.all([
          apiFetch('/pautas'),
          apiFetch('/pautas/ocr-files'),
          apiFetch('/produtos'),
          apiFetch('/de-para')
        ]);

        const pautasData = pautasRes.ok ? await pautasRes.json() : [];
        const ocrFilesData = ocrFilesRes.ok ? await ocrFilesRes.json() : [];
        const produtos = produtosRes.ok ? await produtosRes.json() : [];
        const dePara = deParaRes.ok ? await deParaRes.json() : [];

        setPautas(pautasData);
        setOcrFiles(ocrFilesData);

        const totalPending = ocrFilesData.reduce((acc: number, f: any) => acc + (f.pending_count || 0), 0);

        setStats({
          pautasCount: pautasData.length,
          pendentesCount: totalPending,
          produtosCount: produtos.length,
          deParaCount: dePara.length,
        });
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        toast.error('Erro ao carregar estatísticas', {
          description: 'Não foi possível carregar os dados do painel.',
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-12 pb-12">
      {/* Greeting Section */}
      <HomeGreeting userName={user?.name || 'Bem-vindo'} />

      {/* KPI Stats Cards */}
      <HomeStats stats={stats} isLoading={loading} />

      {/* Modern SVGs Charts Section */}
      <HomeCharts pautas={pautas} ocrFiles={ocrFiles} isLoading={loading} />

      <Separator />

      {/* Operational Panel tabs */}
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

        {/* Tab Content 1: Modules Grid */}
        <TabsContent value="actions" className="focus-visible:outline-none">
          <HomeQuickAccess />
        </TabsContent>

        {/* Tab Content 2: Process Timeline */}
        <TabsContent value="flow" className="focus-visible:outline-none">
          <HomeWorkFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
