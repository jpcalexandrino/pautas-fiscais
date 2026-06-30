import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

interface OcrFileItem {
  id: number;
  filename: string;
  uf: string;
  data_pauta?: string;
  total_prices: number;
  confirmed_count: number;
  pending_count: number;
}

interface HomeChartsProps {
  pautas: any[];
  ocrFiles: OcrFileItem[];
  isLoading: boolean;
}

export default function HomeCharts({ pautas, ocrFiles, isLoading }: HomeChartsProps) {
  const [hoveredUF, setHoveredUF] = useState<string | null>(null);

  // Compute stats
  const data = useMemo(() => {
    // Group pautas by UF
    const ufCountsMap: Record<string, { count: number; name: string }> = {};
    
    pautas.forEach(p => {
      const uf = p.uf || 'Ignorado';
      if (!ufCountsMap[uf]) {
        ufCountsMap[uf] = { count: 0, name: p.nome_estado || uf };
      }
      ufCountsMap[uf].count += 1;
    });

    const ufCounts = Object.entries(ufCountsMap)
      .map(([uf, data]) => ({ uf, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 states

    // Calculate total price cells and confirmed/pending from OCR files
    let totalPrices = 0;
    let totalConfirmed = 0;
    let totalPending = 0;

    ocrFiles.forEach(f => {
      totalPrices += f.total_prices || 0;
      totalConfirmed += f.confirmed_count || 0;
      totalPending += f.pending_count || 0;
    });

    const automationRate = totalPrices > 0 ? Math.round((totalConfirmed / totalPrices) * 1000) / 10 : 0;

    return {
      totalPrices,
      totalConfirmed,
      totalPending,
      automationRate,
      ufCounts,
      filesCount: ocrFiles.length
    };
  }, [pautas, ocrFiles]);

  // Donut/Pie Chart configuration
  const donutConfig = {
    confirmed: {
      label: 'Confirmados',
      color: 'var(--chart-1)',
    },
    pending: {
      label: 'Pendentes',
      color: 'var(--chart-4)',
    },
  } satisfies ChartConfig;

  const donutData = useMemo(() => {
    return [
      { name: 'confirmed', value: data.totalConfirmed, fill: 'var(--color-confirmed)' },
      { name: 'pending', value: data.totalPending, fill: 'var(--color-pending)' },
    ];
  }, [data.totalConfirmed, data.totalPending]);

  // Bar Chart configuration
  const barConfig = {
    count: {
      label: 'Pautas',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  const barData = useMemo(() => {
    return data.ufCounts.map(item => ({
      uf: item.uf,
      name: item.name,
      count: item.count,
    }));
  }, [data.ufCounts]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="h-80 bg-muted/40 rounded-xl lg:col-span-2"></div>
        <div className="h-80 bg-muted/40 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
      
      {/* 1. Bar Chart: Pautas por Estado (Top 5) */}
      <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Volumetria por Estado (UF)</CardTitle>
              <CardDescription className="text-xs">Estados com maior atividade de pautas fiscais homologadas</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Database className="h-3 w-3" />
              {pautas.length} Homologadas
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6 flex-1 flex flex-col justify-center min-h-[220px]">
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
              <Database className="h-10 w-10 text-muted-foreground/30 mb-2" />
              Nenhum dado de estado encontrado nas pautas.
            </div>
          ) : (
            <div className="h-[200px] w-full">
              <ChartContainer config={barConfig} className="h-full w-full">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="uf"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value}
                    width={30}
                    className="font-bold text-foreground"
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="count" hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={4}
                    barSize={16}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Donut Chart: Taxa de Automatização baseada nos preços mapeados do OCR */}
      <Card className="shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">Conclusão da Auditoria</CardTitle>
          <CardDescription className="text-xs">Preços do PDF confirmados e lançados no sistema</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 flex flex-col items-center justify-center flex-1 min-h-[220px]">
          {data.totalPrices === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
              Nenhum preço de pauta extraído nos PDFs.
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="relative flex items-center justify-center w-full h-[150px]">
                <ChartContainer config={donutConfig} className="h-full w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={65}
                      strokeWidth={2}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-foreground tracking-tight">
                    {data.automationRate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Concluído
                  </span>
                </div>
              </div>

              {/* Legends and metadata */}
              <div className="grid grid-cols-2 gap-4 w-full text-xs pt-2 border-t">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Confirmados</p>
                    <p className="text-sm font-black text-foreground">{data.totalConfirmed}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Pendentes</p>
                    <p className="text-sm font-black text-foreground">{data.totalPending}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
