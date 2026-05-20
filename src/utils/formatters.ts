/**
 * Formatadores para moeda, datas, números e percentuais (pt-BR)
 */

/**
 * Formata valor em Reais (R$)
 * @param {number|string} value
 * @returns {string}
 */
export function formatCurrency(value: number | string | any): string {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata data para dd/MM/yyyy
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Formata número com separador brasileiro
 * @param {number|string} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(value: number | string | any, decimals = 2): string {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata percentual
 * @param {number|string} value - valor já em percentual (ex: 18 = 18%)
 * @returns {string}
 */
export function formatPercentage(value: number | string | any): string {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0,00%';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + '%';
}

/**
 * Formata kWh
 * @param {number|string} value
 * @returns {string}
 */
export function formatKWh(value: number | string | any): string {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0 kWh';
  return formatNumber(num, 0) + ' kWh';
}

/**
 * Formata tarifa R$/kWh
 * @param {number|string} value
 * @returns {string}
 */
export function formatTarifa(value: number | string | any): string {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return 'R$ 0,000000';
  return 'R$ ' + num.toLocaleString('pt-BR', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

/**
 * Parse de valor monetário brasileiro para número
 * @param {string|number} value - ex: "1.531,33" ou "R$ 1.531,33"
 * @returns {number}
 */
export function parseCurrencyBR(value: string | number | any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value)
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Realiza o parse de uma string de data/mês de referência para um objeto { m: mês, y: ano }
 * @param {any} d - data em diversos formatos (Date, "MM/YYYY", "DD/MM/YYYY", "YYYY-MM-DD")
 * @returns {{m: number, y: number} | null}
 */
export function parseMesReferencia(d: any): { m: number; y: number } | null {
  if (!d) return null;
  if (d instanceof Date) return { m: d.getMonth() + 1, y: d.getFullYear() };
  
  const s = String(d).trim().split(' ')[0];
  if (s.includes('/')) {
    const p = s.split('/');
    if (p.length === 3) return { m: parseInt(p[1], 10), y: parseInt(p[2], 10) };
    if (p.length === 2) return { m: parseInt(p[0], 10), y: parseInt(p[1], 10) };
  } else if (s.includes('-')) {
    const p = s.split('-');
    if (p.length >= 2) return { m: parseInt(p[1], 10), y: parseInt(p[0], 10) };
  }
  return null;
}

/**
 * Formata mês de referência para exibição
 * @param {string} mesRef - ex: "01/2026" ou "Janeiro/2026"
 * @returns {string}
 */
export function formatMesReferencia(mesRef: string | any): string {
  if (!mesRef) return '—';
  
  const parsed = parseMesReferencia(mesRef);
  if (!parsed) return String(mesRef);

  const meses: Record<number, string> = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março',
    4: 'Abril', 5: 'Maio', 6: 'Junho',
    7: 'Julho', 8: 'Agosto', 9: 'Setembro',
    10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
  };

  const mStr = String(parsed.m).padStart(2, '0');
  if (meses[parsed.m]) {
    return `${meses[parsed.m]}/${parsed.y}`;
  }

  return `${mStr}/${parsed.y}`;
}
