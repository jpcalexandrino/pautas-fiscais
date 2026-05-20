/**
 * Funções de cálculo derivado para análise de faturas
 */

export interface FaturaRow {
  valorTotalRS?: number | string;
  custoICMSRS?: number | string;
  custoPISPASEPRS?: number | string;
  custoCOFINSRS?: number | string;
  medidaConsumoTUSDForaPonta?: number | string;
  consumoTEAdicionalBandeiraAmarelaRS?: number | string;
  multaRS?: number | string;
  jurosMoraRS?: number | string;
  atualizacaoMonetariaRS?: number | string;
  servicosIluminacaoPublicaRS?: number | string;
  outrosRS?: number | string;
  ressarcimentoRS?: number | string;
  consumoTUSDForaPontaRS?: number | string;
  consumoTEForaPontaRS?: number | string;
  [key: string]: any;
}

/**
 * Parse seguro de número
 */
function safeNum(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) || num === undefined || num === null ? 0 : num;
}

/**
 * Calcula o total de tributos (ICMS + PIS + COFINS)
 * @param {FaturaRow} row - linha de dados da fatura
 * @returns {number}
 */
export function calcularTotalTributos(row: FaturaRow): number {
  return (
    safeNum(row.custoICMSRS) +
    safeNum(row.custoPISPASEPRS) +
    safeNum(row.custoCOFINSRS)
  );
}

/**
 * Calcula o percentual dos tributos sobre o valor total da fatura
 * @param {FaturaRow} row
 * @returns {number} percentual (ex: 18.5)
 */
export function calcularPercentualTributos(row: FaturaRow): number {
  const total = safeNum(row.valorTotalRS);
  if (total === 0) return 0;
  const tributos = calcularTotalTributos(row);
  return (tributos / total) * 100;
}

/**
 * Calcula a tarifa média por kWh
 * @param {FaturaRow} row
 * @returns {number} R$/kWh
 */
export function calcularTarifaMedia(row: FaturaRow): number {
  const consumo = safeNum(row.medidaConsumoTUSDForaPonta);
  if (consumo === 0) return 0;
  const valorTotal = safeNum(row.valorTotalRS);
  return valorTotal / consumo;
}

/**
 * Calcula o consumo total em kWh (usa medida TUSD como referência)
 * @param {FaturaRow} row
 * @returns {number}
 */
export function calcularConsumoTotal(row: FaturaRow): number {
  return safeNum(row.medidaConsumoTUSDForaPonta || row.medida_consumo_tusd_fora_ponta);
}

/**
 * Calcula o percentual da bandeira tarifária sobre o valor total
 * @param {FaturaRow} row
 * @returns {number}
 */
export function calcularPercentualBandeira(row: FaturaRow): number {
  const total = safeNum(row.valorTotalRS);
  if (total === 0) return 0;
  const bandeira = safeNum(row.consumoTEAdicionalBandeiraAmarelaRS);
  return (bandeira / total) * 100;
}

/**
 * Calcula o percentual de encargos financeiros (multa) sobre o valor total
 * @param {FaturaRow} row
 * @returns {number}
 */
export function calcularPercentualEncargos(row: FaturaRow): number {
  const total = safeNum(row.valorTotalRS);
  if (total === 0) return 0;
  const multa = safeNum(row.multaRS);
  return (multa / total) * 100;
}

/**
 * Calcula o custo total de energia (TUSD + TE)
 * @param {FaturaRow} row
 * @returns {number}
 */
export function calcularCustoEnergia(row: FaturaRow): number {
  return (
    safeNum(row.consumoTUSDForaPontaRS) +
    safeNum(row.consumoTEForaPontaRS)
  );
}

export interface ComposicaoFatura {
  valorTotal: number;
  valorCalculado: number;
  diferenca: number;
  estaBatendo: boolean;
  energia: {
    tusd: number;
    te: number;
    bandeira: number;
    totalEnergia: number;
    percentual: number;
  };
  tributos: {
    icms: number;
    pis: number;
    cofins: number;
    totalTributos: number;
    percentual: number;
  };
  encargos: {
    multa: number;
    jurosMora: number;
    atualizacaoMonetaria: number;
    iluminacao: number;
    outros: number;
    ressarcimento: number;
    totalEncargos: number;
    percentual: number;
  };
}

/**
 * Calcula a composição completa da fatura e valida o total
 * @param {FaturaRow} row
 * @returns {ComposicaoFatura}
 */
export function calcularComposicaoFatura(row: FaturaRow): ComposicaoFatura {
  const valorTotalCSV = safeNum(row.valorTotalRS);

  // Componentes de Energia
  const custoTUSD = safeNum(row.consumoTUSDForaPontaRS);
  const custoTE = safeNum(row.consumoTEForaPontaRS);
  const bandeira = safeNum(row.consumoTEAdicionalBandeiraAmarelaRS);
  const totalEnergia = custoTUSD + custoTE + bandeira;

  // Tributos (Geralmente incluídos nos itens acima, mas conferimos)
  const totalTributos = calcularTotalTributos(row);

  // Outros Encargos
  const multa = safeNum(row.multaRS);
  const jurosMora = safeNum(row.jurosMoraRS);
  const atualizacaoMonetaria = safeNum(row.atualizacaoMonetariaRS);
  const iluminacao = safeNum(row.servicosIluminacaoPublicaRS);
  const outros = safeNum(row.outrosRS);
  const ressarcimento = safeNum(row.ressarcimentoRS); // Ressarcimento é crédito (subtrai)
  const totalEncargos = multa + jurosMora + atualizacaoMonetaria + iluminacao + outros - ressarcimento;

  // Cálculo de conferência: Itens + Encargos
  // Nota: Em faturas do Grupo B, ICMS/PIS/COFINS já estão dentro do TUSD/TE.
  const valorCalculado = totalEnergia + totalEncargos;
  const diferenca = Math.abs(valorTotalCSV - valorCalculado);

  return {
    valorTotal: valorTotalCSV,
    valorCalculado,
    diferenca,
    estaBatendo: diferenca < 0.05, // Tolerância de centavos
    energia: {
      tusd: custoTUSD,
      te: custoTE,
      bandeira,
      totalEnergia,
      percentual: valorTotalCSV > 0 ? (totalEnergia / valorTotalCSV) * 100 : 0,
    },
    tributos: {
      icms: safeNum(row.custoICMSRS),
      pis: safeNum(row.custoPISPASEPRS),
      cofins: safeNum(row.custoCOFINSRS),
      totalTributos,
      percentual: valorTotalCSV > 0 ? (totalTributos / valorTotalCSV) * 100 : 0,
    },
    encargos: {
      multa,
      jurosMora,
      atualizacaoMonetaria,
      iluminacao,
      outros,
      ressarcimento,
      totalEncargos,
      percentual: valorTotalCSV > 0 ? (totalEncargos / valorTotalCSV) * 100 : 0,
    },
  };
}

export interface ResumoFaturas {
  totalFaturas: number;
  valorTotal: number;
  consumoTotal: number;
  mediaValor: number;
  mediaConsumo: number;
  totalTributos: number;
  faturasComErro: number;
}

/**
 * Calcula resumo estatístico de múltiplas faturas
 * @param {FaturaRow[]} rows - array de linhas
 * @returns {ResumoFaturas}
 */
export function calcularResumo(rows: FaturaRow[]): ResumoFaturas {
  if (!rows || rows.length === 0) {
    return {
      totalFaturas: 0,
      valorTotal: 0,
      consumoTotal: 0,
      mediaValor: 0,
      mediaConsumo: 0,
      totalTributos: 0,
      faturasComErro: 0,
    };
  }

  const totalFaturas = rows.length;
  const valorTotal = rows.reduce((sum, r) => sum + safeNum(r.valorTotalRS), 0);
  const consumoTotal = rows.reduce((sum, r) => sum + safeNum(r.medidaConsumoTUSDForaPonta), 0);
  const totalTributos = rows.reduce((sum, r) => sum + calcularTotalTributos(r), 0);

  const faturasComErro = rows.filter(r => {
    const comp = calcularComposicaoFatura(r);
    return !comp.estaBatendo;
  }).length;

  return {
    totalFaturas,
    valorTotal,
    consumoTotal,
    mediaValor: valorTotal / totalFaturas,
    mediaConsumo: consumoTotal / totalFaturas,
    totalTributos,
    faturasComErro,
  };
}

export interface PreviousMonthResult {
  slash: string;
  dash: string;
  year: number;
  month: number;
}

/**
 * Retorna a string de referência do mês anterior em múltiplos formatos
 * @param {string|Date} mesRef - ex: "01/01/2026", "2026-01-01" ou objeto Date
 * @returns {PreviousMonthResult | null}
 */
export function getPreviousMonth(mesRef: string | Date | null): PreviousMonthResult | null {
  if (!mesRef) return null;

  let date: Date | null = null;

  if (mesRef instanceof Date) {
    date = new Date(mesRef);
  } else {
    const str = String(mesRef).trim().split(' ')[0];

    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        date = new Date(parseInt(parts[2]), parseInt(parts[1], 10) - 1, 1);
      } else if (parts.length === 2) {
        // MM/YYYY
        date = new Date(parseInt(parts[1]), parseInt(parts[0], 10) - 1, 1);
      }
    } else if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length >= 3) {
        // YYYY-MM-DD
        date = new Date(parseInt(parts[0]), parseInt(parts[1], 10) - 1, 1);
      } else if (parts.length === 2) {
        // YYYY-MM
        date = new Date(parseInt(parts[0]), parseInt(parts[1], 10) - 1, 1);
      }
    }
  }

  if (!date || isNaN(date.getTime())) return null;

  // Subtract one month
  date.setMonth(date.getMonth() - 1);

  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  return {
    slash: `${m}/${y}`,
    dash: `${y}-${m}`,
    year: y,
    month: parseInt(m, 10)
  };
}
