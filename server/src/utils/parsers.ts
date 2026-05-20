/**
 * Handles scientific notation parsing for numeric values.
 */
function parseScientific(cleanValue: string): number {
  return Number.parseFloat(cleanValue.replaceAll(',', '.')) || 0;
}

/**
 * Handles logic for values with both dots and commas.
 */
function handleDualSeparators(cleanValue: string): number {
  const lastDot = cleanValue.lastIndexOf('.');
  const lastComma = cleanValue.lastIndexOf(',');
  
  if (lastComma > lastDot) {
    // BR format: 1.234,56
    return Number.parseFloat(cleanValue.replaceAll('.', '').replaceAll(',', '.')) || 0;
  }
  // US format: 1,234.56
  return Number.parseFloat(cleanValue.replaceAll(',', '')) || 0;
}

/**
 * Handles logic for values with only commas.
 */
function handleOnlyComma(cleanValue: string): number {
  const parts = cleanValue.split(',');
  if (parts.length > 2) {
    // Multiple commas: 1,234,567 -> Thousands
    return Number.parseFloat(cleanValue.replaceAll(',', '')) || 0;
  }
  // Single comma: 123,45 or 1,234
  // In BR context, always treat as decimal
  return Number.parseFloat(cleanValue.replaceAll(',', '.')) || 0;
}

/**
 * Handles logic for values with only dots.
 */
function handleOnlyDot(cleanValue: string): number {
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    // Multiple dots: 1.234.567 -> Thousands
    return Number.parseFloat(cleanValue.replaceAll('.', '')) || 0;
  }
  // Single dot: 123.45 or 1.234
  // Treat as decimal (safer for US exports and small BR faturas)
  return Number.parseFloat(cleanValue) || 0;
}

/**
 * Parses numeric values from CSV, handling Brazilian format (1.234,56)
 * and ambiguous single dot cases (1.530).
 */
export function parseNumericValue(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  
  let cleanValue = String(value).trim();
  if (cleanValue === '') return 0;

  // Regex to detect scientific notation
  const scientificRegex = /^-?\d+([.,]\d+)?e[+-]?\d+$/i;
  if (scientificRegex.test(cleanValue)) {
    return parseScientific(cleanValue);
  }

  // Remove currency symbols and other non-numeric chars except . and ,
  cleanValue = cleanValue.replaceAll(/[R$\s]/g, '');

  const hasComma = cleanValue.includes(',');
  const hasDot = cleanValue.includes('.');

  if (hasComma && hasDot) return handleDualSeparators(cleanValue);
  if (hasComma) return handleOnlyComma(cleanValue);
  if (hasDot) return handleOnlyDot(cleanValue);

  const parsed = Number.parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Handles sanitization for Date objects.
 */
function sanitizeDate(value: Date): string {
  if (isNaN(value.getTime())) return '';
  const d = String(value.getDate()).padStart(2, '0');
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const y = value.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Handles sanitization for scientific notation strings in text fields.
 */
function sanitizeScientific(cleanValue: string): string {
  try {
    const normalizedValue = cleanValue.replaceAll(',', '.');
    const num = Number(normalizedValue);
    
    if (isNaN(num)) return cleanValue;

    if (isFinite(num) && (num > 1e6 || num < -1e6)) {
        return BigInt(Math.round(num)).toString();
    }
    
    return num.toLocaleString(undefined, { 
      useGrouping: false, 
      maximumFractionDigits: 20 
    });
  } catch (e) {
    return cleanValue;
  }
}

/**
 * Sanitizes strings, handling scientific notation for any text field.
 * Very robust version for Large IDs (CNPJ, UC, etc).
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
  
  // Strip time if present
  if (cleanValue.includes(' ') && (cleanValue.includes('/') || cleanValue.includes('-'))) {
    const parts = cleanValue.split(' ');
    if (parts[1]?.includes(':')) {
      cleanValue = parts[0];
    }
  }
  
  const scientificRegex = /^-?\d+([.,]\d+)?e[+-]?\d+$/i;
  if (scientificRegex.test(cleanValue)) {
    return sanitizeScientific(cleanValue);
  }
  
  return cleanValue;
}

/**
 * Strips time from date strings or converts Date objects/Excel serials
 */
export function formatDateOnly(value: any): string | null {
  if (value === null || value === undefined) return null;

  // Handle JS Date objects
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }

  // Handle Excel Serial Numbers (if they come as numbers)
  // Usually > 30000 (roughly 1980+) and < 60000 (roughly 2060+)
  if (typeof value === 'number' && value > 30000 && value < 60000) {
    try {
      // Excel dates start from 1899-12-30
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  const str = String(value).trim();
  if (str === '') return null;

  // Extract just the date part from ISO or other formats (YYYY-MM-DD HH:mm:ss or DD/MM/YYYY HH:mm:ss)
  const datePart = str.split(/[ T]/)[0];

  // If it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  // If it's DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
    const [d, m, y] = datePart.split('/');
    return `${y}-${m}-${d}`;
  }
  
  // If it's not a recognized date format, return null for DATE columns
  return null;
}
