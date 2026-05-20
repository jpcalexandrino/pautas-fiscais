
import { Document, Page, StyleSheet, Font, View } from '@react-pdf/renderer';
import { theme } from './theme';

// Import Components
import { PDFHeader } from './document/PDFHeader';
import { PDFFooter } from './document/PDFFooter';
import { SectionTitle } from './document/SectionTitle';
import { KPIBox } from './document/KPIBox';
import { DataTable } from './document/DataTable';
import { ChartBlock } from './document/ChartBlock';
import { EfficiencyScore } from './document/EfficiencyScore';
import { ExecutiveSummary } from './document/ExecutiveSummary';
import { BenchmarkTable } from './document/BenchmarkTable';
import { TimelineBlock } from './document/TimelineBlock';
import { AIInsights } from './document/AIInsights';

// Import Utils
import { formatCurrency, formatNumber, formatPercentage, formatKWh, formatMesReferencia } from '../../utils/formatters';
import {
  calcularTotalTributos, calcularPercentualTributos, calcularTarifaMedia,
  calcularConsumoTotal, calcularComposicaoFatura
} from '../../utils/calculations';
import { calculateEfficiencyScore } from '../../utils/pdf/pdfScore';
import { formatAIInsights } from '../../utils/pdf/pdfInsights';
import { calculateBenchmarks } from '../../utils/pdf/pdfBenchmarks';

// Register Inter font
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKfMZg.ttf', fontWeight: 300 },
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl + 20, // Aumenta o espaço inferior para não encostar no rodapé
    paddingHorizontal: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.colors.white,
    color: theme.colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  }
});

interface PDFDocumentProps {
  data: any;
  equipment?: any[];
  previousMonthData?: any;
  suggestions?: string | null;
  historicalData?: any[]; // For charts
}

export default function PDFDocument({
  data,
  equipment = [],
  previousMonthData = null,
  suggestions = null,
  historicalData = []
}: PDFDocumentProps) {
  const row = data;
  const composicao = calcularComposicaoFatura(row);
  const consumoTotal = calcularConsumoTotal(row);
  const tarifaMedia = calcularTarifaMedia(row);
  const percTributos = calcularPercentualTributos(row);

  // Stats
  const consumptionPrev = previousMonthData ? calcularConsumoTotal(previousMonthData) : 0;
  const valuePrev = previousMonthData ? (parseFloat(previousMonthData.valorTotalRS) || 0) : 0;

  const consumptionVariation = consumptionPrev > 0 ? ((consumoTotal / consumptionPrev) - 1) * 100 : 0;
  const valueVariation = valuePrev > 0 ? ((parseFloat(row.valorTotalRS) / valuePrev) - 1) * 100 : 0;

  // Equipment stats
  const totalValorEquip = (equipment || []).reduce((acc, item) => {
    const kwhMes = ((item.quantity || 1) * (item.power_w || 0) * (item.hours_per_day || 0) * 22 / 1000);
    const valorEst = kwhMes * (parseFloat(item.tariff) || 0.513);
    return acc + valorEst;
  }, 0);
  const aderencia = consumoTotal > 0 ? Math.min(1, totalValorEquip / (row.valorTotalRS || 1)) : 0;

  const hasEquipment = equipment && equipment.length > 0;

  // Efficiency Score
  const scoreResult = calculateEfficiencyScore({
    tarifaMedia,
    impactoTributario: percTributos / 100,
    variacaoConsumo: consumptionVariation,
    aderenciaCarga: hasEquipment ? aderencia : 1, // Não penaliza se não houver levantamento de carga
    perfilTarifario: tarifaMedia < 0.6 ? 'excelente' : tarifaMedia < 0.75 ? 'bom' : 'regular'
  });


  // Insights
  const insights = formatAIInsights(suggestions);

  // Benchmarks
  const benchmarks = calculateBenchmarks({
    consumoTotal,
    tarifaMedia,
    percTributos
  }, historicalData.length > 0 ? historicalData.reduce((acc, d) => acc + (calcularConsumoTotal(d) || 0), 0) / historicalData.length : undefined);

  // Chart Data
  const last12Months = historicalData.slice(-6).map(d => calcularConsumoTotal(d));
  const last12Labels = historicalData.slice(-6).map(d => formatMesReferencia(d.mesReferencia).split('/')[0]);

  const compositionData = [
    { value: composicao.energia.tusd, color: theme.colors.slate[900] },
    { value: composicao.energia.te, color: theme.colors.slate[600] },
    { value: composicao.tributos.totalTributos, color: theme.colors.slate[400] },
    { value: composicao.encargos.totalEncargos, color: theme.colors.slate[200] }
  ];

  return (
    <Document title={`Relatório Executivo - ${row.nomeDoSite || 'Energia'}`}>

      {/* PAGE 1: EXECUTIVE DASHBOARD */}
      <Page size="A4" style={styles.page}>
        <PDFHeader title="Relatório Executivo" siteName={row.nomeDoSite} referenceDate={row.mesReferencia} />

        <ExecutiveSummary
          content="Este relatório apresenta uma auditoria detalhada da performance energética da unidade, consolidando análises tarifárias, tributárias e operacionais para suporte à decisão executiva."
        />

        <View wrap={false}>
          <SectionTitle subtitle="Principais indicadores de performance e variações mensais">Métricas de Impacto</SectionTitle>
          <View style={styles.grid}>
            <KPIBox label="Total Faturado" value={formatCurrency(row.valorTotalRS)} trend={valueVariation} />
            <KPIBox label="Consumo Total" value={formatKWh(consumoTotal)} trend={consumptionVariation} />
            <KPIBox label="Tarifa Média" value={`R$ ${formatNumber(tarifaMedia, 3)}`} />
            <KPIBox label="Eficiência" value={`${scoreResult.score}/100`} color={scoreResult.color} />
          </View>
        </View>


        <EfficiencyScore
          score={scoreResult.score}
          label={scoreResult.label}
          color={scoreResult.color}
          description="O Score de Eficiência considera a variabilidade do consumo, aderência da carga instalada, peso tributário e otimização da modalidade tarifária."
        />

        <View wrap={false} style={{ marginTop: theme.spacing.xl }}>
          <SectionTitle>Composição de Custos</SectionTitle>
          <ChartBlock
            title="Distribuição de Valores na Fatura"
            type="donut"
            data={compositionData}
            labels={['TUSD', 'TE', 'Tributos', 'Encargos']}
          />
        </View>


        <PDFFooter />
      </Page>

      {/* PAGE 2: ANÁLISE TARIFÁRIA E EVOLUÇÃO */}
      <Page size="A4" style={styles.page}>
        <PDFHeader title="Análise Tarifária" siteName={row.nomeDoSite} referenceDate={row.mesReferencia} />

        <View wrap={false}>
          <SectionTitle subtitle="Histórico de consumo e tendências de custo">Evolução Temporal</SectionTitle>
          <ChartBlock
            title="Consumo Histórico (Últimos Meses)"
            type="bar"
            data={last12Months.length > 1 ? last12Months : (consumptionPrev > 0 ? [consumptionPrev, consumoTotal] : [consumoTotal])}
            labels={last12Labels.length > 1 ? last12Labels : (consumptionPrev > 0 ? ['Mês Ant.', 'Atual'] : ['Atual'])}

          />
        </View>


        <View wrap={false} style={{ marginTop: theme.spacing.xl }}>
          <SectionTitle>Detalhamento de Faturamento</SectionTitle>
          <DataTable
            columns={[
              { header: 'Componente', key: 'name', width: '40%' },
              { header: 'Medida', key: 'measure', width: '30%', align: 'right' },
              { header: 'Valor (R$)', key: 'value', width: '30%', align: 'right', bold: true }
            ]}
            data={[
              { name: 'Consumo TUSD', measure: `${formatNumber(row.medidaConsumoTUSDForaPonta)} kWh`, value: formatCurrency(composicao.energia.tusd) },
              { name: 'Consumo TE', measure: `${formatNumber(row.medidaConsumoTEForaPonta)} kWh`, value: formatCurrency(composicao.energia.te) },
              { name: 'Bandeiras Tarifárias', measure: '-', value: formatCurrency(composicao.energia.bandeira) },
              { name: 'Encargos e Taxas', measure: '-', value: formatCurrency(composicao.encargos.totalEncargos) },
              // { name: 'Total Tributos (ICMS/PIS/COF)', measure: '-', value: formatCurrency(composicao.tributos.totalTributos) },
            ]}
            showTotal={true}
            totalValue={formatCurrency(row.valorTotalRS)}
          />
        </View>


        <PDFFooter />
      </Page>

      {/* PAGE 3: AUDITORIA FISCAL E BENCHMARKS */}
      <Page size="A4" style={styles.page}>
        <PDFHeader title="Auditoria Fiscal & Benchmarks" siteName={row.nomeDoSite} referenceDate={row.mesReferencia} />

        <View wrap={false}>
          <SectionTitle subtitle="Validação de alíquotas e bases de cálculo">Detalhamento Tributário</SectionTitle>
          <DataTable
            columns={[
              { header: 'Tributo', key: 'name', width: '25%' },
              { header: 'Base de Cálculo', key: 'base', width: '35%', align: 'right' },
              { header: 'Alíquota', key: 'rate', width: '15%', align: 'right' },
              { header: 'Total', key: 'total', width: '25%', align: 'right', bold: true }
            ]}
            data={[
              { name: 'ICMS', base: formatCurrency(row.baseCalculoICMSRS), rate: formatPercentage(row.aliquotaICMS), total: formatCurrency(row.custoICMSRS) },
              { name: 'PIS/PASEP', base: formatCurrency(row.baseCalculoPISPASEPRS), rate: formatPercentage(row.aliquotaPISPASEP), total: formatCurrency(row.custoPISPASEPRS) },
              { name: 'COFINS', base: formatCurrency(row.baseCalculoCOFINSRS), rate: formatPercentage(row.aliquotaCOFINS), total: formatCurrency(row.custoCOFINSRS) },
            ]}
            showTotal={true}
            totalLabel="Total Tributos"
            totalValue={formatCurrency(calcularTotalTributos(row))}
          />

        </View>


        <View wrap={false} style={{ marginTop: theme.spacing.xl }}>
          <SectionTitle subtitle="Comparativo de performance com padrões do setor">Benchmarks Corporativos</SectionTitle>
          <BenchmarkTable
            items={benchmarks.map(b => ({
              indicator: b.indicator,
              unit: b.unit,
              value: b.unit === 'R$/kWh' ? `R$ ${formatNumber(b.value as number, 3)}` : (b.unit === '%' ? formatPercentage(b.value as number) : formatNumber(b.value as number)),
              benchmark: b.unit === 'R$/kWh' ? `R$ ${formatNumber(b.benchmark as number, 3)}` : (b.unit === '%' ? formatPercentage(b.benchmark as number) : formatNumber(b.benchmark as number)),
              status: b.status,
              evaluation: b.evaluation,
              invert: b.indicator === 'Consumo Mensal' || b.indicator === 'Tarifa Média'
            }))}
          />
        </View>


        <PDFFooter />
      </Page>

      {/* PAGE 4: INTELIGÊNCIA ARTIFICIAL & INSIGHTS */}
      <Page size="A4" style={styles.page}>
        <PDFHeader title="Insights IA & Otimização" siteName={row.nomeDoSite} referenceDate={row.mesReferencia} />

        <View>
          <SectionTitle subtitle="Oportunidades identificadas via algoritmos de auditoria">Diagnóstico Inteligente</SectionTitle>
          <AIInsights
            insights={insights.map(i => ({
              type: i.type,
              title: i.title,
              description: i.description,
              impact: i.impact
            }))}

          />
        </View>


        <View style={{ marginTop: theme.spacing.xl }}>
          <SectionTitle subtitle="Eventos críticos e operacionais detectados">Timeline do Período</SectionTitle>
          <TimelineBlock
            events={[
              { date: formatMesReferencia(row.mesReferencia), title: 'Ciclo de Faturamento', description: 'Geração do relatório de auditoria consolidado.' },
              { date: 'Detectado', title: 'Variação de Consumo', description: `${consumptionVariation >= 0 ? 'Aumento' : 'Redução'} de ${Math.abs(consumptionVariation).toFixed(1)}% em relação ao período anterior.` },
              { date: 'Análise', title: 'Variação de Valor', description: `O valor faturado teve uma ${valueVariation >= 0 ? 'alta' : 'queda'} de ${Math.abs(valueVariation).toFixed(1)}%.` },
              { date: 'Check', title: 'Perfil Tarifário', description: 'Aderência total à modalidade contratada verificada.' },
            ]}
          />
        </View>


        <PDFFooter />
      </Page>

      {/* PAGE 5: LEVANTAMENTO DE CARGA (OPCIONAL) */}
      {hasEquipment && (
        <Page size="A4" style={styles.page}>
          <PDFHeader title="Levantamento de Carga" siteName={row.nomeDoSite} referenceDate={row.mesReferencia} />

          <View wrap={false}>
            <SectionTitle subtitle="Inventário de ativos e estimativa de consumo">Carga Instalada</SectionTitle>
            <DataTable
              columns={[
                { header: 'Equipamento', key: 'name', width: '35%' },
                { header: 'Qtd', key: 'quantity', width: '10%', align: 'center' },
                { header: 'Potência', key: 'power_w', width: '15%', align: 'right', render: (v) => `${v} W` },
                { header: 'Consumo Est.', key: 'kwh', width: '20%', align: 'right', render: (_, item) => `${formatNumber(((item.quantity || 1) * (item.power_w || 0) * (item.hours_per_day || 0) * 22 / 1000), 1)} kWh` },
                { header: 'Custo Est.', key: 'cost', width: '20%', align: 'right', bold: true, render: (_, item) => formatCurrency(((item.quantity || 1) * (item.power_w || 0) * (item.hours_per_day || 0) * 22 / 1000) * (parseFloat(item.tariff) || 0.513)) }
              ]}
              data={equipment}
              showTotal={true}
              totalLabel="Aderência Estimada"
              totalValue={formatCurrency(totalValorEquip)}
            />
          </View>


          <View wrap={false} style={{ marginTop: theme.spacing.xl }}>
            <SectionTitle>Perfil da Carga</SectionTitle>
            <ChartBlock
              title="Maiores Consumidores"
              type="bar"
              data={equipment.slice(0, 5).map(e => (e.quantity * e.power_w * e.hours_per_day * 22) / 1000)}
              labels={equipment.slice(0, 5).map(e => e.name)}
            />
          </View>


          <PDFFooter />
        </Page>
      )}

    </Document>
  );
}
