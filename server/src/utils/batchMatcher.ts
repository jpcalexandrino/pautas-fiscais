export interface ParsedBatch {
  isBatch: boolean;
  minVolume?: number;
  maxVolume?: number;
  specificVolumes?: number[];
  brandKeywords: string[];
  styleKeywords: string[];
}

export interface ProdutoRow {
  sk_produto: number;
  nk_codigo_interno?: string;
  gtin_13?: string;
  descricao_interna: string;
  embalagem?: string;
  conteudo_volume?: number;
}

const BEER_STYLES = [
  'pilsen', 'dunkel', 'helles', 'lager', 'puro malte', 'puromalte', 'weiss',
  'ipa', 'witbier', 'stout', 'malzbier', 'zero', 'bock', 'session', 'kolsch',
  'pale ale', 'weissbier', 'porter', 'belgian'
];

const STOP_WORDS = new Set([
  'cerveja', 'lata', 'garrafa', 'a', 'de', 'da', 'do', 'e', 'ou', 'com', 'em', 'para', 'sem', 'de-para'
]);

/**
 * Normaliza e limpa a string, removendo acentos e caracteres especiais,
 * mas preservando espaços e convertendo para minúsculas.
 */
export function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')   // Mantém apenas letras, números e espaços
    .replace(/\s+/g, ' ')            // Remove múltiplos espaços seguidos
    .trim();
}

/**
 * Analisa a descrição e identifica se é um lote, extraindo
 * as faixas de volume, estilos e palavras-chave da marca.
 */
export function parseBatchDescription(description: string): ParsedBatch {
  const normalized = cleanString(description);

  let isBatch = false;
  let minVolume: number | undefined;
  let maxVolume: number | undefined;
  let specificVolumes: number[] = [];

  // 1. Detectar faixa de volume (ex: "300 a 500ml")
  const rangeRegex = /(\d+)\s*(?:ml|l)?\s*(?:a|à|e|a\s+ate|ate|-)\s*(\d+)\s*(ml|l)/gi;
  const rangeMatch = rangeRegex.exec(normalized);

  if (rangeMatch) {
    isBatch = true;
    let v1 = parseInt(rangeMatch[1], 10);
    let v2 = parseInt(rangeMatch[2], 10);
    const unit = rangeMatch[3].toLowerCase();

    if (unit === 'l') {
      v1 *= 1000;
      v2 *= 1000;
    }

    minVolume = Math.min(v1, v2);
    maxVolume = Math.max(v1, v2);
  } else {
    // 2. Detectar múltiplos volumes específicos (ex: "350ml e 473ml" ou "350/473ml")
    const volRegex = /\b(\d+)\s*(ml|l)\b/gi;
    let match;
    const vols: number[] = [];
    while ((match = volRegex.exec(normalized)) !== null) {
      let v = parseInt(match[1], 10);
      if (match[2].toLowerCase() === 'l') {
        v *= 1000;
      }
      vols.push(v);
    }

    if (vols.length > 1) {
      isBatch = true;
      specificVolumes = Array.from(new Set(vols));
    } else if (vols.length === 1) {
      specificVolumes = [vols[0]];
    }
  }

  // 3. Limpar volumes da descrição para analisar estilos/marca
  let cleanText = normalized
    .replace(/(\d+)\s*(?:ml|l)?\s*(?:a|à|e|a\s+ate|ate|-)\s*(\d+)\s*(ml|l)/gi, ' ')
    .replace(/\b\d+\s*(ml|l)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. Identificar estilos presentes na descrição
  const styleKeywords = BEER_STYLES.filter((style) => {
    const regex = new RegExp(`\\b${style}\\b`, 'i');
    return regex.test(cleanText);
  });

  if (styleKeywords.length > 1) {
    isBatch = true;
  }

  // 5. Identificar palavras-chave da marca (removendo stop words e estilos)
  const words = cleanText.split(/[^a-z0-9]+/i);
  const brandKeywords = words.filter((word) => {
    if (word.length < 2) return false;
    if (STOP_WORDS.has(word)) return false;
    if (styleKeywords.some((style) => style.includes(word))) return false;
    return true;
  });

  return {
    isBatch,
    minVolume,
    maxVolume,
    specificVolumes: specificVolumes.length > 0 ? specificVolumes : undefined,
    brandKeywords,
    styleKeywords,
  };
}

/**
 * Encontra todos os produtos no catálogo que correspondem ao lote analisado.
 */
export function findMatchingProducts(
  parsed: ParsedBatch,
  produtos: ProdutoRow[]
): ProdutoRow[] {
  if (!parsed.isBatch) {
    return [];
  }

  return produtos.filter((p) => {
    // 1. Filtro de Volume
    if (p.conteudo_volume === undefined || p.conteudo_volume === null) {
      return false;
    }

    if (parsed.minVolume !== undefined && parsed.maxVolume !== undefined) {
      if (p.conteudo_volume < parsed.minVolume || p.conteudo_volume > parsed.maxVolume) {
        return false;
      }
    } else if (parsed.specificVolumes && parsed.specificVolumes.length > 0) {
      if (!parsed.specificVolumes.includes(p.conteudo_volume)) {
        return false;
      }
    }

    const cleanProdDesc = cleanString(p.descricao_interna);

    // 2. Filtro de Estilo
    if (parsed.styleKeywords.length > 0) {
      const matchesAnyStyle = parsed.styleKeywords.some((style) => {
        const regex = new RegExp(`\\b${style}\\b`, 'i');
        return regex.test(cleanProdDesc);
      });
      if (!matchesAnyStyle) {
        return false;
      }
    }

    // 3. Filtro de Marca (Palavras-chave)
    if (parsed.brandKeywords.length > 0) {
      let matchedCount = 0;
      for (const keyword of parsed.brandKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(cleanProdDesc)) {
          matchedCount++;
        }
      }

      const ratio = matchedCount / parsed.brandKeywords.length;
      const threshold = parsed.brandKeywords.length <= 2 ? 0.49 : 0.6;
      if (ratio < threshold) {
        return false;
      }
    }

    return true;
  });
}
