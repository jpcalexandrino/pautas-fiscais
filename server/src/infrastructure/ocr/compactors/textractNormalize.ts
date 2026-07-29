/**
 * Funções utilitárias de normalização e detecção de relevância para o pipeline
 * de compactação do Textract.
 *
 * Unifica as 4 cópias de `normalize()` que existiam no TextractCompactor original
 * (linhas 506, 726, 740 e 801) em uma única função exportável.
 */

import { BRAND_SLUGS } from '../brandSlugs';
import type { TextractBlock } from './types';

// ---------------------------------------------------------------------------
// Normalização de texto
// ---------------------------------------------------------------------------

/**
 * Normaliza texto removendo acentos e convertendo para minúsculas.
 * Preserva caracteres especiais (ao contrário de `normalizeText` em utils/normalize.ts
 * que também remove pontuação).
 */
export function normalizeAccents(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ---------------------------------------------------------------------------
// Detecção de coluna (layout de duas colunas)
// ---------------------------------------------------------------------------

/**
 * Determina se um bloco pertence à coluna esquerda ou direita da página.
 * Usado para manter estados independentes em tabelas de duas colunas (ex: SE).
 */
export function getColumnKey(block: Pick<TextractBlock, 'Geometry'>): 'left' | 'right' {
  const left = block.Geometry?.BoundingBox?.Left ?? 0;
  const width = block.Geometry?.BoundingBox?.Width ?? 0;
  const centerX = left + width / 2;
  return centerX < 0.5 ? 'left' : 'right';
}

// ---------------------------------------------------------------------------
// Detecção de relevância de marca
// ---------------------------------------------------------------------------

/**
 * Verifica se o texto de uma linha contém alguma marca relevante (BRAND_SLUGS).
 * Usado para filtrar linhas de tabela que pertencem a concorrentes.
 */
export function isRowRelevant(rowText: string): boolean {
  const normText = normalizeAccents(rowText);

  const matches = BRAND_SLUGS.some(slug => {
    const normSlug = normalizeAccents(slug);
    if (normSlug === '3.0' || slug === '3.0') {
      return /(?:^|[^0-9])3\.0(?:[^0-9]|$)/.test(normText);
    }
    return normText.includes(normSlug);
  });

  if (matches) {
    return true;
  }

  // Tratamento especial para "Cidade Imperial" vs estilos de cerveja com "Imperial"
  if (normText.includes('cidade imperial')) {
    const isStyle = /imperial\s+(stout|ipa|sour|red|double|ap|lager|pils|wit|helles|dunkel)/i.test(normText) ||
                    /(stout|ipa|sour|red|double|ap|lager|pils|wit|helles|dunkel)\s+imperial/i.test(normText);
    if (!isStyle) {
      return true;
    }
  }

  // Termos adicionais relevantes (SE e outros)
  const extraRelevant = ['dopamina', 'best power', 'hysotonic', 'macedonia'];
  if (extraRelevant.some(term => normText.includes(term))) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Detecção de subcabeçalhos (Sergipe)
// ---------------------------------------------------------------------------

/**
 * Detecta se o texto é um subcabeçalho de seção NÃO-cerveja
 * (ex: refrigerante, suco, néctar, chá, bebida láctea).
 */
export function isNonBeerSubheader(text: string): boolean {
  const normText = normalizeAccents(text);
  const nonBeerKeywords = [
    'refrigerante', 'suco', 'nectar', 'cha', 'bebida lactea'
  ];
  return nonBeerKeywords.some(kw => normText.includes(kw)) && !normText.includes('cerveja') && !normText.includes('chopp');
}

/**
 * Detecta se o texto é um subcabeçalho de seção de cerveja/bebida (formato SE).
 * Identifica linhas como "Cerveja em garrafa descartável de 276 ml a 399 ml".
 */
export function isSubheaderSE(text: string): boolean {
  const normText = normalizeAccents(text);

  // Se contiver preço (ex: decimal com vírgula ou ponto), não é um subcabeçalho
  if (/\d+[.,]\d+/.test(normText)) {
    return false;
  }

  // Identifica se é comprovadamente um subcabeçalho conhecido
  const knownSubheaderKeywords = [
    ['cerveja', 'garrafa'],
    ['cerveja', 'lata'],
    ['agua', 'tonica'],
    ['bebida', 'energetica'],
    ['bebidas', 'energeticas'],
    ['bebidas', 'hidroeletrolitica'],
    ['bebidas', 'isotonica'],
    ['chope', 'litro'],
    ['chopp', 'litro']
  ];
  const isKnownSubheader = knownSubheaderKeywords.some(kws => kws.every(kw => normText.includes(kw)));

  if (!isKnownSubheader) {
    // Se contiver marcas concorrentes, é uma linha de produto concorrente, não subcabeçalho
    const concorrentes = [
      'skol', 'brahma', 'antarctica', 'heineken', 'amstel', 'budweiser', 'stella', 'corona',
      'kaiser', 'crystal', 'itaipava', 'devassa', 'schin', 'conti', 'cerpa', 'colina', 'samba',
      'proibida', 'spoller', 'serramalte', 'eisenbahn', 'bohemia', 'petra', 'burguesa', 'caracu',
      '1500', 'original'
    ];
    const hasConcorrente = concorrentes.some(c => {
      if (c === '1500') {
        // Evita confundir "1500 ml" (volume) com a cerveja "1500"
        return normText.includes('1500') && !normText.includes('1500ml') && !normText.includes('1500 ml');
      }
      return normText.includes(c);
    });
    if (hasConcorrente) return false;
  }

  const hasKeyword = normText.includes('garrafa') ||
                     normText.includes('lata') ||
                     normText.includes('retornavel') ||
                     normText.includes('descartavel') ||
                     normText.includes('copo') ||
                     normText.includes('barril') ||
                     normText.includes('embalagem') ||
                     normText.includes('hidroeletrolitica') ||
                     normText.includes('isotonica') ||
                     normText.includes('energetica') ||
                     (normText.includes('cerveja') && (normText.includes(' de ') || normText.includes('em')));

  return hasKeyword || isKnownSubheader;
}

// ---------------------------------------------------------------------------
// Detecção de marca na página (filtro de página inteira)
// ---------------------------------------------------------------------------

/**
 * Verifica se o texto de uma página inteira contém pelo menos uma marca relevante.
 * Usado para decidir se uma página deve ser processada ou ignorada.
 */
export function pageContainsBrand(pageText: string): boolean {
  const normPageText = pageText.toLowerCase();
  const BRAND_SLUGS_LOWER = BRAND_SLUGS.map(s => s.toLowerCase());

  return BRAND_SLUGS_LOWER.some(slug => {
    if (slug === '3.0') {
      return /\b3\.0\b/.test(normPageText);
    }
    return normPageText.includes(slug);
  });
}
