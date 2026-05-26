
/**
 * Utilitários para Benchmarks e comparativos setoriais no PDF.
 */

export interface BenchmarkItem {
  indicator: string;
  unit: string;
  value: number;
  benchmark: number;
  status: 'above' | 'below' | 'equal';
  evaluation: string;
}

export const calculateBenchmarks = (currentData: any, historicalAverage?: number): BenchmarkItem[] => {
  const items: BenchmarkItem[] = [
    {
      indicator: 'Consumo Mensal',
      unit: 'kWh',
      value: currentData.consumoTotal || 0,
      benchmark: historicalAverage || (currentData.consumoTotal * 0.95),
      status: (currentData.consumoTotal > (historicalAverage || 0)) ? 'above' : 'below',
      evaluation: (currentData.consumoTotal > (historicalAverage || 0)) ? 'Acima da Média' : 'Otimizado'
    },
    {
      indicator: 'Tarifa Média',
      unit: 'R$/kWh',
      value: currentData.tarifaMedia || 0,
      benchmark: 0.65,
      status: (currentData.tarifaMedia > 0.65) ? 'above' : 'below',
      evaluation: (currentData.tarifaMedia > 0.65) ? 'Elevada' : 'Adequada'
    },
    {
      indicator: 'Impacto Tributário',
      unit: '%',
      value: currentData.percTributos || 0,
      benchmark: 25,
      status: ((currentData.percTributos || 0) > 25) ? 'above' : 'below',
      evaluation: ((currentData.percTributos || 0) > 25) ? 'Crítico' : 'Adequado'
    }
  ];

  return items;
};
