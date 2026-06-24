export function normalizeText(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ') // garante espaços únicos
    .replace(/[^0-9a-z ]/g, ''); // mantém apenas letras, números e espaço
}

export function normalizeGtin(value?: string | null): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}

export function dateToSkData(date: Date): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`, 10);
}

export function parseStringToDate(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return new Date(+brMatch[3], +brMatch[2] - 1, +brMatch[1]);

  const skMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (skMatch) return new Date(+skMatch[1], +skMatch[2] - 1, +skMatch[3]);

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseDateToSkData(value?: string | null): number | null {
  const date = parseStringToDate(value);
  return date ? dateToSkData(date) : null;
}

/**
 * Identifica se um GTIN é fictício/dummy
 */
export function isDummyGtin(gtin?: string | null): boolean {
  if (!gtin) return true;
  const clean = normalizeGtin(gtin);
  if (!clean || clean.length < 8) return true;
  if (/^(\d)\1+$/.test(clean)) return true; // todos dígitos iguais
  if (clean === '7890000000000') return true; // GTIN de teste padrão
  return false;
}

export interface PautaItem {
  gtin?: string | null;
  descricao_estado: string;
  data_pauta?: string | null;
}

/**
 * Deduplica itens de pauta baseado em GTIN, descrição normalizada e data.
 */
export function deduplicatePautaItems<T extends PautaItem>(
  items: T[],
  onDuplicateDiscarded?: (item: T, reason: 'gtin' | 'description') => void
): T[] {
  const seenGtins = new Set<string>();
  const seenDescs = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const cleanGtin = normalizeGtin(item.gtin);
    const descKey = normalizeText(item.descricao_estado);
    const isDummy = isDummyGtin(cleanGtin);
    const dateKey = String(parseDateToSkData(item.data_pauta) ?? 'null');

    const gtinUniqueKey = `${cleanGtin}_${dateKey}`;
    const descUniqueKey = `${descKey}_${dateKey}`;

    if (cleanGtin && !isDummy && seenGtins.has(gtinUniqueKey)) {
      onDuplicateDiscarded?.(item, 'gtin');
      continue;
    }

    if (descKey && seenDescs.has(descUniqueKey)) {
      onDuplicateDiscarded?.(item, 'description');
      continue;
    }

    if (cleanGtin && !isDummy) seenGtins.add(gtinUniqueKey);
    if (descKey) seenDescs.add(descUniqueKey);

    result.push(item);
  }

  return result;
}
