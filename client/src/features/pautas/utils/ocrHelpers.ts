export const priceRegex = /^\s*(?:R\$\s*)?\d+(?:[\.,\s]\d+)*[\.,]\s*\d{1,2}\s*$/i;

/**
 * Normaliza e higieniza strings de preços vindas do OCR (ex: "1004,0 0" -> "1004,00", "R$ 1.004 , 00" -> "1004,00").
 * Remove espaços em branco espúrios entre os dígitos e separadores decimais.
 */
export function cleanPriceString(val?: string | null): string {
  if (!val) return '';
  const cleaned = String(val)
    .replace(/R\$\s*/gi, '')
    .trim();
  
  // Se for uma string no formato numérico com espaços entre dígitos (ex: "1004,0 0" ou "1 004,00")
  if (/^\d[\d\s\.,]*\d$/.test(cleaned) || /^\d+[\.,]\s*\d/.test(cleaned)) {
    return cleaned.replace(/\s+/g, '');
  }
  return cleaned;
}

export function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeText(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^0-9a-z ]/g, '');
}

export function isCodeOrPrice(val: string, colIdx?: number): boolean {
  if (!val) return true;

  // Preço explícito (R$ 3,99 ou 3,99)
  if (priceRegex.test(val)) return true;

  // Código NCM (ex: 03.011.00, 03.010.01 ou 8 dígitos numéricos)
  if (/^\d{2}\.\d{3}\.\d{2}$/.test(val) || /^\d{8}$/.test(val)) return true;

  // Código fiscal / pontuado / estruturado (ex: 03.012.0031.00213, 03.011.00)
  if (/^\d+(?:[\.-]\d+){2,}$/.test(val)) return true;

  // Código de barras / GTIN / EAN (12 a 14 dígitos numéricos)
  if (/^\d{12,14}$/.test(val)) return true;

  // Número de item/chave na primeira coluna (ex: 2.3, 3.47, 4.24, 1.158 ou números inteiros simples na col 0)
  if (colIdx === 0 && (/^\d+(?:\.\d+)?$/.test(val) || /^\d+$/.test(val))) return true;

  return false;
}

export function cleanDescriptionNoise(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\s–\-\|]*\bANEXO\s+[\w\d\s]+?\bATO\s+NORMATIVO.*$/i, '')
    .replace(/[\s–\-\|]*\bATO\s+NORMATIVO\s+UNATRI.*$/i, '')
    .replace(/[\s–\-\|]*\bATO\s+NORMATIVO\s+N[ººo]?.*$/i, '')
    .trim();
}

export function inferItemDescription(row: string[], headers: string[], colIdx: number, uf: string): string {
  const ufUpper = (uf || '').toUpperCase();
  const safeHeaders = headers || [];
  
  let result = '';

  // 1. Paraná (PR) - Estrutura de matriz onde o cabeçalho da coluna de preço contém a embalagem/volume
  if (ufUpper === 'PR') {
    const marcaIdx = safeHeaders.findIndex(h => h.includes('MARCA_PRODUTO') || h.includes('MARCA') || h.includes('PRODUTO'));
    const marcaText = (marcaIdx !== -1 && row[marcaIdx]) ? row[marcaIdx] : (row[1] || row[0] || '');
    const embalagemText = (safeHeaders[colIdx] || '').replace(/_/g, ' ').trim();
    const isGenericPrice = /preco|valor|pmpf|pauta|custo|sugerido/i.test(embalagemText);
    if (marcaText && embalagemText && !isGenericPrice) {
      result = `${marcaText} - ${embalagemText}`.trim().replace(/\s+/g, ' ');
    }
  }

  // 2. Se a linha já tem subcabeçalho pré-formatado (ex: Sergipe "PRODUTO (Subcabeçalho)")
  const firstCol = row[0] ? row[0].trim() : '';
  if (!result && ufUpper === 'SE' && firstCol.includes('(') && firstCol.includes(')')) {
    result = firstCol;
  }

  if (!result) {
    // 3. Busca por colunas explícitas de produto (NOME, PRODUTO, DESCRICAO, ESPECIFICACAO)
    const prodIdx = safeHeaders.findIndex(h => /PRODUTO|DESCRICAO|DESCRIÇÃO|NOME|ESPECIFICAÇÃO|ESPECIFICACAO|DISCRIMINAÇÃO|DISCRIMINACAO/i.test(h) && !/NCM|COD|CÓD|CODIGO|CÓDIGO|ID|ITEM|CHAVE|FISCAL|MARCA/i.test(h));
    const marcaIdx = safeHeaders.findIndex(h => /\bMARCA\b|FABRICANTE/i.test(h) && !/PRODUTO|DESCRICAO|DESCRIÇÃO|NOME|NCM|COD|CÓD|CODIGO|CÓDIGO|ID|ITEM|CHAVE|FISCAL/i.test(h));
    const embalagemIdx = safeHeaders.findIndex(h => /EMBALAGEM|RECIPIENTE|TIPO/i.test(h) && !/PRODUTO|MARCA|PRECO|PREÇO|VALOR|COD|CÓD|CODIGO|CÓDIGO|FISCAL/i.test(h));
    const volumeIdx = safeHeaders.findIndex(h => /VOLUME|CAPACIDADE|CONTEUDO|CONTEÚDO/i.test(h));

    const explicitParts: string[] = [];

    // Prioriza primeiro a descrição/nome principal do produto
    if (prodIdx !== -1 && row[prodIdx] && prodIdx !== colIdx) {
      const val = row[prodIdx].trim();
      if (val && !isCodeOrPrice(val, prodIdx)) explicitParts.push(val);
    }

    if (embalagemIdx !== -1 && row[embalagemIdx] && embalagemIdx !== colIdx && embalagemIdx !== prodIdx && embalagemIdx !== marcaIdx) {
      const val = row[embalagemIdx].trim();
      if (val && !isCodeOrPrice(val, embalagemIdx)) explicitParts.push(val);
    }

    if (volumeIdx !== -1 && row[volumeIdx] && volumeIdx !== colIdx && volumeIdx !== prodIdx && volumeIdx !== marcaIdx && volumeIdx !== embalagemIdx) {
      const val = row[volumeIdx].trim();
      if (val && !isCodeOrPrice(val, volumeIdx)) explicitParts.push(val);
    }

    if (explicitParts.length > 0) {
      result = explicitParts.join(' - ').trim().replace(/\s+/g, ' ');
    }
  }

  if (!result) {
    // 4. Varredura sequencial inteligente (coleta todas as colunas de texto descritivo na ordem em que aparecem)
    const textParts: string[] = [];

    for (let i = 0; i < row.length; i++) {
      if (i === colIdx) continue; // Ignora a coluna de preço clicada

      const header = (safeHeaders[i] || '').toUpperCase();
      if (/NCM|CEST|CNPJ|GTIN|EAN|CHAVE|CODIGO|CÓDIGO|\bCOD\b|\bCÓD\b|FISCAL|ITEM|VALOR|PRECO|PREÇO|PMPF|PAUTA|MARCA|FABRICANTE/i.test(header)) {
        continue;
      }

      const val = (row[i] || '').trim();
      if (!val) continue;

      if (isCodeOrPrice(val, i)) continue;

      // Evita duplicidade e sobreposição
      const normVal = val.toLowerCase();
      if (!textParts.some(p => p.toLowerCase().includes(normVal) || normVal.includes(p.toLowerCase()))) {
        textParts.push(val);
      }
    }

    if (textParts.length > 0) {
      result = textParts.join(' - ').trim().replace(/\s+/g, ' ');
    }
  }

  if (!result) {
    // Fallback extremo caso nenhuma célula tenha passado pelos filtros
    result = row
      .filter((cell, idx) => idx !== colIdx && cell.trim() && !priceRegex.test(cell))
      .join(' - ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  return cleanDescriptionNoise(result);
}

/**
 * Extracts a numeric volume and unit from a string.
 * E.g., "Coca Cola 350ml" -> { value: 350, unit: 'ml' }
 * E.g., "1.5L" -> { value: 1.5, unit: 'l' }
 */
export interface ParsedVolume {
  value: number;
  unit: string;
  minVal?: number;
  maxVal?: number;
}

/**
 * Extracts a numeric volume and unit from a string.
 * E.g., "Coca Cola 350ml" -> { value: 350, unit: 'ml' }
 * E.g., "de 271 a 360 ml" -> { value: 360, unit: 'ml', minVal: 271, maxVal: 360 }
 */
export function parseVolume(str: string): ParsedVolume | null {
  if (!str) return null;
  const norm = str.toLowerCase();

  // Detecta faixas de volume como "de 271 a 360 ml", "de 251-360ml", "271 a 360 ml"
  const rangeMatch = norm.match(/(?:de\s+)?(\d+)\s*(?:a|à|-)\s*(\d+)\s*(ml|l(?:itros?)?)\b/);
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1]);
    const maxVal = parseFloat(rangeMatch[2]);
    const unit = rangeMatch[3].startsWith('l') ? 'l' : 'ml';
    return { value: maxVal, unit, minVal, maxVal };
  }

  // Regex para valor único e.g. 350ml, 350 ml, 1.5l, 1.5 l, 1,5l, 2 litros
  const match = norm.match(/\b(\d+(?:[\.,]\d+)?)\s*(ml|l(?:itros?)?)\b/);
  if (match) {
    const val = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].startsWith('l') ? 'l' : 'ml';
    return { value: val, unit };
  }
  return null;
}

/**
 * Normalizes packaging terms to check for similarity.
 */
export function normalizePackaging(pkg: string): string {
  const norm = normalizeText(pkg);
  if (/lata|lt/i.test(norm)) return 'lata';
  if (/pet/i.test(norm)) return 'pet';
  if (/garrafa|glass|vidro|gf/i.test(norm)) return 'garrafa';
  if (/latao/i.test(norm)) return 'latao';
  return norm;
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

export function extractGtin(text?: string | null): string | null {
  if (!text) return null;
  const match = String(text).match(/\b(789\d{10}|\d{13,14})\b/);
  return match ? match[1] : null;
}

export function extractGtinFromRow(row: string[], headers: string[] = []): string | null {
  if (!row || !Array.isArray(row)) return null;

  // 1. Primeiro tenta por cabeçalhos explícitos de GTIN/EAN/BARRA
  if (headers && headers.length > 0) {
    const gtinHeaderIdx = headers.findIndex(h => /GTIN|EAN|BARRA|CÓDIGO DE BARRAS|CODIGO DE BARRAS|COD\. BARRAS/i.test(h));
    if (gtinHeaderIdx !== -1 && row[gtinHeaderIdx]) {
      const gtin = extractGtin(row[gtinHeaderIdx]);
      if (gtin) return gtin;
    }
  }

  // 2. Busca em todas as células da linha por um código de barras de 13 a 14 dígitos
  for (const cell of row) {
    const gtin = extractGtin(cell);
    if (gtin) return gtin;
  }

  return null;
}

/**
 * Calculates a match score between an inferred description from OCR and a product.
 * Returns a number where higher means a better match.
 */
export function calculateProductMatchScore(
  inferredDesc: string,
  product: { descricao_interna: string; gtin_13?: string; embalagem?: string; conteudo_volume?: number },
  rowGtin?: string | null
): number {
  const normInferred = normalizeText(inferredDesc);
  const normProductDesc = normalizeText(product.descricao_interna);

  // 1. Checagem por GTIN (Prioridade Máxima Absoluta)
  const inferredGtin = rowGtin || extractGtin(inferredDesc);
  const productGtin = product.gtin_13 ? extractGtin(product.gtin_13) : null;

  if (inferredGtin && productGtin) {
    if (inferredGtin === productGtin) {
      return 100.0; // Match Perfeito por GTIN — Vitória Instantânea!
    } else {
      // Penalidade se ambos têm GTIN mas são diferentes
      return -50.0;
    }
  }

  if (!normInferred || !normProductDesc) return 0;

  // Split inferred description into words
  const inferredWords = normInferred.split(/\s+/).filter(w => w.length >= 2);
  const productWords = normProductDesc.split(/\s+/).filter(w => w.length >= 2);

  if (inferredWords.length === 0 || productWords.length === 0) return 0;

  // Base score: number of overlapping words with Levenshtein typo tolerance
  let wordMatches = 0;
  productWords.forEach(word => {
    if (inferredWords.includes(word)) {
      wordMatches += 2.5; // Match exato de palavra
    } else {
      // Procura palavra mais similar por distância de Levenshtein (para pegar erros de digitação como Larger x Lager)
      let maxSim = 0;
      for (const iw of inferredWords) {
        const sim = wordSimilarity(iw, word);
        if (sim > maxSim) maxSim = sim;
      }

      if (maxSim >= 0.65) {
        wordMatches += 2.0 * maxSim; // Bônus alto para erros de digitação leves
      } else if (inferredWords.some(iw => iw.includes(word) || word.includes(iw))) {
        wordMatches += 0.8; // Match parcial de sub-palavra
      }
    }
  });

  let score = wordMatches;

  // Parse volumes
  const inferredVol = parseVolume(inferredDesc);
  const productVol = product.conteudo_volume != null
    ? { value: product.conteudo_volume, unit: product.conteudo_volume < 10 ? 'l' : 'ml' }
    : parseVolume(product.descricao_interna);

  if (inferredVol && productVol) {
    // Converte volumes e limites da faixa para ml
    const infVolMl = inferredVol.unit === 'l' ? inferredVol.value * 1000 : inferredVol.value;
    const infMinMl = inferredVol.minVal != null ? (inferredVol.unit === 'l' ? inferredVol.minVal * 1000 : inferredVol.minVal) : infVolMl;
    const infMaxMl = inferredVol.maxVal != null ? (inferredVol.unit === 'l' ? inferredVol.maxVal * 1000 : inferredVol.maxVal) : infVolMl;

    const prodVolMl = productVol.unit === 'l' ? productVol.value * 1000 : productVol.value;

    // Se o produto está dentro da faixa de volume (com margem de tolerância de 5ml)
    if (prodVolMl >= infMinMl - 5 && prodVolMl <= infMaxMl + 5) {
      score += 15.0; // Bônus forte de volume dentro da faixa
    } else {
      score -= 20.0; // Penalidade se o volume está fora da faixa
    }
  } else if (inferredVol || productVol) {
    score -= 2.0;
  }

  // Check packaging match
  const inferredPkg = /lata|lt\b/i.test(inferredDesc) ? 'lata' : (/pet/i.test(inferredDesc) ? 'pet' : (/garrafa|vidro|gf\b/i.test(inferredDesc) ? 'garrafa' : ''));
  const productPkg = product.embalagem ? normalizePackaging(product.embalagem) : '';

  if (inferredPkg && productPkg) {
    if (inferredPkg === productPkg) {
      score += 5.0;
    } else {
      // Penalty for mismatching packaging
      score -= 5.0;
    }
  }

  return score;
}
