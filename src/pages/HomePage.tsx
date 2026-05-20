import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Upload, ArrowRight, Sun, Moon, Sunrise,
  Building2, Receipt, Database, BarChart3, Users2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAccessItem {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

const quickAccessItems: QuickAccessItem[] = [
  {
    icon: Upload,
    title: 'Importar Planilha',
    description: 'Faça upload de CSV ou XLSX para iniciar a análise de faturas de energia.',
    to: '/importacao',
  },
  {
    icon: Database,
    title: 'Dados & Tabela',
    description: 'Visualize, ordene, filtre e selecione faturas para gerar relatórios.',
    to: '/dados',
  },
  {
    icon: BarChart3,
    title: 'Relatório PDF',
    description: 'Gere relatórios completos com composição, tributos e indicadores.',
    to: '/relatorio',
  },
  {
    icon: Users2,
    title: 'Gestão de Clientes',
    description: 'Cadastre e gerencie clientes com importação de planilhas Excel.',
    to: '/clientes',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', Icon: Sunrise, color: 'text-amber-500 dark:text-amber-400' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', Icon: Sun, color: 'text-orange-500 dark:text-orange-400' };
  return { text: 'Boa noite', Icon: Moon, color: 'text-indigo-400 dark:text-indigo-300' };
}

function getFirstName(fullName: string | undefined) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { getClients, getFaturas } = useData();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    clientCount: 0,
    faturaCount: 0,
    totalKwh: 0,
    totalValor: 0,
    isLoading: true
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [clients, faturas] = await Promise.all([
          getClients(),
          getFaturas()
        ]);

        const totalKwh = faturas.reduce((acc: number, f: any) => acc + (parseFloat(f.medida_consumo_tusd_fora_ponta) || 0), 0);
        const totalValor = faturas.reduce((acc: number, f: any) => acc + (parseFloat(f.valor_total_rs) || 0), 0);

        setStats({
          clientCount: clients.length,
          faturaCount: faturas.length,
          totalKwh,
          totalValor,
          isLoading: false
        });
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setStats(s => ({ ...s, isLoading: false }));
      }
    }
    loadStats();
  }, [getClients, getFaturas]);

  const greeting = getGreeting();

  return (
    <div className="space-y-12 pb-12">
      {/* Greeting Section */}
      <section className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {greeting.text}, <span className="text-primary">{getFirstName(user?.name)}</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Confira o resumo do seu sistema de análise de faturas de energia.
            </p>
          </div>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-70" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clientes Ativos</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tighter">
                {stats.isLoading ? '...' : stats.clientCount}
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                Clientes cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-70" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faturas Analisadas</CardTitle>
              <Receipt className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tighter">
                {stats.isLoading ? '...' : stats.faturaCount}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                Total de registros importados
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-70" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Energia Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tighter flex items-baseline gap-1">
                {stats.isLoading ? '...' : stats.totalKwh.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                <span className="text-xs font-bold text-muted-foreground">kWh</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                Consumo total identificado
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-70" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Volume Financeiro</CardTitle>
              <Database className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tighter text-emerald-600 dark:text-emerald-400">
                {stats.isLoading ? '...' : stats.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                Valor total mapeado em faturas
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Quick Access */}
        <section className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground tracking-tight">
              Acesso Rápido
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Acesse rapidamente os principais módulos do sistema
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickAccessItems.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="group hover:shadow-md transition-all duration-200 border-border cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${0.08 * (idx + 1)}s` }}
                  onClick={() => navigate({ to: feature.to as any })}
                >
                  <CardHeader className="pb-4">
                    <div className="w-10 h-10 rounded-md bg-primary/5 flex items-center justify-center border border-border/50 mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-[15px] font-bold">{feature.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed line-clamp-2">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Acessar módulo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How it works — Flow cards */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Como Funciona</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Fluxo de trabalho do sistema
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { step: '01', title: 'Upload', desc: 'Suba seu arquivo CSV ou XLSX com os dados.', icon: Upload },
              { step: '02', title: 'Análise', desc: 'Visualize, filtre e selecione as faturas.', icon: Database },
              { step: '03', title: 'Relatório', desc: 'Gere o PDF completo e baixe.', icon: BarChart3 },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="relative overflow-hidden border-border animate-slide-up" style={{ animationDelay: `${0.12 * (idx + 1)}s` }}>
                  <div className="text-2xl font-black text-muted/10 absolute right-4 top-4 select-none">{item.step}</div>
                  <CardHeader className="flex flex-row items-start gap-4 p-5 space-y-0">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="pr-8">
                      <CardTitle className="text-sm font-bold">{item.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {item.desc}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
