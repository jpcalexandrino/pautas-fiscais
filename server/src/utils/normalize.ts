export function normalizeText(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-z]/g, '');
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
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return new Date(y, m, d);
  }
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const d = parseInt(brMatch[1], 10);
    const m = parseInt(brMatch[2], 10) - 1;
    const y = parseInt(brMatch[3], 10);
    return new Date(y, m, d);
  }
  const skMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (skMatch) {
    const y = parseInt(skMatch[1], 10);
    const m = parseInt(skMatch[2], 10) - 1;
    const d = parseInt(skMatch[3], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

export function parseDateToSkData(value?: string | null): number | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return parseInt(`${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`, 10);
  }
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return parseInt(`${brMatch[3]}${brMatch[2]}${brMatch[1]}`, 10);
  }
  const skMatch = trimmed.match(/^(\d{8})$/);
  if (skMatch) {
    return parseInt(skMatch[1], 10);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return dateToSkData(parsed);
  }
  return null;
}

/**
 * Identifica se um GTIN é fictício/dummy (ex: todos zeros, 7890000000000, etc.)
 */
export function isDummyGtin(gtin?: string | null): boolean {
  if (!gtin) return true;
  const clean = String(gtin).replace(/\D/g, '');
  if (!clean || clean.length < 8) return true;
  // Todos os dígitos iguais (ex: 0000000000000 ou 9999999999999)
  if (/^(\d)\1+$/.test(clean)) return true;
  // GTIN de teste padrão (ex: 7890000000000)
  if (clean === '7890000000000') return true;
  return false;
}

/**
 * Deduplica itens de pauta baseado em GTIN, descrição normalizada E data.
 * Um item é duplicata se tiver o mesmo GTIN OU a mesma descrição normalizada
 * DENTRO DA MESMA DATA. Se a data for diferente, o item é mantido.
 */
export function deduplicatePautaItems<T extends { gtin?: string | null; descricao_estado: string; data_pauta?: string | null }>(
  items: T[],
  onDuplicateDiscarded?: (item: T, reason: 'gtin' | 'description') => void
): T[] {
  const seenGtins = new Set<string>();
  const seenDescs = new Set<string>();
  const result: T[] = [];

  const normalizeDesc = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  for (const item of items) {
    const cleanGtin = item.gtin ? String(item.gtin).replace(/\D/g, '') : '';
    const descKey = normalizeDesc(item.descricao_estado);
    const isDummy = isDummyGtin(cleanGtin);
    const dateKey = item.data_pauta ? String(parseDateToSkData(item.data_pauta) ?? 'null') : 'null';

    const gtinUniqueKey = `${cleanGtin}_${dateKey}`;
    const descUniqueKey = `${descKey}_${dateKey}`;

    // Verifica duplicata por GTIN (ignora se for dummy)
    if (cleanGtin && !isDummy && seenGtins.has(gtinUniqueKey)) {
      if (onDuplicateDiscarded) onDuplicateDiscarded(item, 'gtin');
      continue;
    }

    // Verifica duplicata por descrição (mesmo que tenha GTIN diferente)
    if (descKey && seenDescs.has(descUniqueKey)) {
      if (onDuplicateDiscarded) onDuplicateDiscarded(item, 'description');
      continue;
    }

    // Registra AMBOS para cruzamento futuro (ignora gtin dummy)
    if (cleanGtin && !isDummy) seenGtins.add(gtinUniqueKey);
    if (descKey) seenDescs.add(descUniqueKey);

    result.push(item);
  }

  return result;
}

