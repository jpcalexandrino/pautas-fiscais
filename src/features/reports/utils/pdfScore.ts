import { theme } from '../theme';

/**
 * Lógica de cálculo do Score de Eficiência Energética.
 */

export interface EfficiencyFactors {
  tarifaMedia: number;
  impactoTributario: number;
  variacaoConsumo: number;
  aderenciaCarga: number; // 0 a 1 (1 = 100% aderente)
  perfilTarifario: 'excelente' | 'bom' | 'regular' | 'ruim';
}

export const calculateEfficiencyScore = (factors: EfficiencyFactors) => {
  // Pesos fictícios para composição do score corporativo
  let score = 100;

  // 1. Impacto Tributário (Ideal < 25%)
  if (factors.impactoTributario > 0.30) score -= 15;
  else if (factors.impactoTributario > 0.25) score -= 5;

  // 2. Variação de Consumo (Ideal < 10% de variação mensal)
  const absVar = Math.abs(factors.variacaoConsumo);
  if (absVar > 20) score -= 15;
  else if (absVar > 10) score -= 8;

  // 3. Aderência de Carga (Ideal > 0.9)
  if (factors.aderenciaCarga < 0.7) score -= 20;
  else if (factors.aderenciaCarga < 0.85) score -= 10;

  // 4. Perfil Tarifário
  const profileWeights = { excelente: 0, bom: -5, regular: -15, ruim: -25 };
  score += profileWeights[factors.perfilTarifario];

  // Garantir limites
  score = Math.max(0, Math.min(100, score));

  let label = 'Crítica';
  let color = theme.colors.status.critical;

  if (score >= 90) {
    label = 'Excelente';
    color = theme.colors.status.excellent;
  } else if (score >= 75) {
    label = 'Boa';
    color = theme.colors.status.good;
  } else if (score >= 60) {
    label = 'Atenção';
    color = theme.colors.status.attention;
  }

  return {
    score,
    label,
    color,
    factors
  };
};
