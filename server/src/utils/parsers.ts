// Constantes reutilizáveis
const SCIENTIFIC_REGEX = /^-?\d+([.,]\d+)?e[+-]?\d+$/i;
const EXCEL_EPOCH = 25569; // Excel epoch (1970-01-01)
const MS_PER_DAY = 86400 * 1000;

/**
 * Trata parsing de notação científica.
 */
function parseScientific(cleanValue: string): number {
  return Number(cleanValue.replaceAll(',', '.')) || 0;
}

/**
 * Valores com ponto e vírgula.
 */
function handleDualSeparators(cleanValue: string): number {
  const lastDot = cleanValue.lastIndexOf('.');
  const lastComma = cleanValue.lastIndexOf(',');

  if (lastComma > lastDot) {
    // BR format: 1.234,56
    return Number(cleanValue.replaceAll('.', '').replaceAll(',', '.')) || 0;
  }
  // US format: 1,234.56
  return Number(cleanValue.replaceAll(',', '')) || 0;
}

/**
 * Valores com apenas vírgula.
 */
function handleOnlyComma(cleanValue: string): number {
  const parts = cleanValue.split(',');
  if (parts.length > 2) {
    // 1,234,567 -> milhares
    return Number(cleanValue.replaceAll(',', '')) || 0;
  }
  // 123,45 -> decimal BR
  return Number(cleanValue.replaceAll(',', '.')) || 0;
}

/**
 * Valores com apenas ponto.
 */
function handleOnlyDot(cleanValue: string): number {
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    // 1.234.567 -> milhares
    return Number(cleanValue.replaceAll('.', '')) || 0;
  }
  // 123.45 -> decimal
  return Number(cleanValue) || 0;
}

/**
 * Parsing numérico robusto para CSV (BR e US).
 */
export function parseNumericValue(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  let cleanValue = String(value).trim();
  if (cleanValue === '') return 0;

  if (SCIENTIFIC_REGEX.test(cleanValue)) {
    return parseScientific(cleanValue);
  }

  // Remove símbolos monetários e caracteres não numéricos (exceto . , -)
  cleanValue = cleanValue.replace(/[^\d.,-]/g, '');

  const hasComma = cleanValue.includes(',');
  const hasDot = cleanValue.includes('.');

  if (hasComma && hasDot) return handleDualSeparators(cleanValue);
  if (hasComma) return handleOnlyComma(cleanValue);
  if (hasDot) return handleOnlyDot(cleanValue);

  const parsed = Number(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Sanitização de Date.
 */
function sanitizeDate(value: Date): string {
  if (isNaN(value.getTime())) return '';
  const d = String(value.getDate()).padStart(2, '0');
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const y = value.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Sanitização de notação científica em texto.
 */
function sanitizeScientific(cleanValue: string): string {
  try {
    const normalizedValue = cleanValue.replaceAll(',', '.');
    const num = Number(normalizedValue);

    if (isNaN(num)) return cleanValue;

    // IDs grandes tratados como BigInt
    if (isFinite(num) && (num > 1e6 || num < -1e6)) {
      return BigInt(Math.round(num)).toString();
    }

    return num.toLocaleString(undefined, {
      useGrouping: false,
      maximumFractionDigits: 20,
    });
  } catch {
    return cleanValue;
  }
}

/**
 * Sanitização de texto genérica.
 */
export function sanitizeText(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return sanitizeDate(value);

  if (typeof value === 'number') {
    if (value > 1e6 || value < -1e6) {
      return BigInt(Math.round(value)).toString();
    }
    return String(value);
  }

  let cleanValue = String(value).trim();

  // Remove hora se presente
  if (cleanValue.includes(' ') && (cleanValue.includes('/') || cleanValue.includes('-'))) {
    const parts = cleanValue.split(' ');
    if (parts[1]?.includes(':')) {
      cleanValue = parts[0];
    }
  }

  if (SCIENTIFIC_REGEX.test(cleanValue)) {
    return sanitizeScientific(cleanValue);
  }

  // IDs muito longos tratados como string
  if (/^\d{15,}$/.test(cleanValue)) {
    return cleanValue;
  }

  return cleanValue;
}

/**
 * Formata apenas a parte de data.
 */
export function formatDateOnly(value: any): string | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number' && value > 30000 && value < 60000) {
    try {
      const date = new Date((value - EXCEL_EPOCH) * MS_PER_DAY);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  const str = String(value).trim();
  if (str === '') return null;

  const datePart = str.split(/[ T]/)[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
    const [d, m, y] = datePart.split('/');
    return `${y}-${m}-${d}`;
  }

  // Suporte extra: MM/DD/YYYY (US)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
    const [m, d, y] = datePart.split('/');
    return `${y}-${m}-${d}`;
  }

  return null;
}
