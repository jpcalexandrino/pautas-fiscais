export const priceRegex = /^\s*(?:R\$\s*)?\d+[\.,]\d{2}\s*$/i;

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

  // Código de barras / GTIN / EAN (12 a 14 dígitos numéricos)
  if (/^\d{12,14}$/.test(val)) return true;

  // Número de item/chave na primeira coluna (ex: 2.3, 3.47, 4.24, 1.158 ou números inteiros simples na col 0)
  if (colIdx === 0 && (/^\d+(?:\.\d+)?$/.test(val) || /^\d+$/.test(val))) return true;

  return false;
}

export function inferItemDescription(row: string[], headers: string[], colIdx: number, uf: string): string {
  const ufUpper = (uf || '').toUpperCase();
  const safeHeaders = headers || [];
  
  // 1. Paraná (PR) - Estrutura de matriz onde o cabeçalho da coluna de preço contém a embalagem/volume
  if (ufUpper === 'PR') {
    const marcaIdx = safeHeaders.findIndex(h => h.includes('MARCA_PRODUTO') || h.includes('MARCA') || h.includes('PRODUTO'));
    const marcaText = (marcaIdx !== -1 && row[marcaIdx]) ? row[marcaIdx] : (row[1] || row[0] || '');
    const embalagemText = (safeHeaders[colIdx] || '').replace(/_/g, ' ').trim();
    const isGenericPrice = /preco|valor|pmpf|pauta|custo|sugerido/i.test(embalagemText);
    if (marcaText && embalagemText && !isGenericPrice) {
      return `${marcaText} - ${embalagemText}`.trim().replace(/\s+/g, ' ');
    }
  }

  // 2. Se a linha já tem subcabeçalho pré-formatado (ex: Sergipe "PRODUTO (Subcabeçalho)")
  const firstCol = row[0] ? row[0].trim() : '';
  if (ufUpper === 'SE' && firstCol.includes('(') && firstCol.includes(')')) {
    return firstCol;
  }

  // 3. Se temos cabeçalhos explícitos conhecidos (ex: DESCRICAO_PRODUTO, EMBALAGEM, VOLUME)
  const marcaIdx = safeHeaders.findIndex(h => /PRODUTO|MARCA|DESCRICAO|DESCRIÇÃO/i.test(h) && !/NCM|COD|ID|ITEM|CHAVE/i.test(h));
  const embalagemIdx = safeHeaders.findIndex(h => /EMBALAGEM|RECIPIENTE|TIPO/i.test(h) && !/PRODUTO|MARCA|PRECO|VALOR/i.test(h));
  const volumeIdx = safeHeaders.findIndex(h => /VOLUME|CAPACIDADE|CONTEUDO|CONTEÚDO/i.test(h));

  const explicitParts: string[] = [];
  if (marcaIdx !== -1 && row[marcaIdx] && marcaIdx !== colIdx) {
    const val = row[marcaIdx].trim();
    if (val && !isCodeOrPrice(val, marcaIdx)) explicitParts.push(val);
  }
  if (embalagemIdx !== -1 && row[embalagemIdx] && embalagemIdx !== colIdx && embalagemIdx !== marcaIdx) {
    const val = row[embalagemIdx].trim();
    if (val && !isCodeOrPrice(val, embalagemIdx)) explicitParts.push(val);
  }
  if (volumeIdx !== -1 && row[volumeIdx] && volumeIdx !== colIdx && volumeIdx !== marcaIdx && volumeIdx !== embalagemIdx) {
    const val = row[volumeIdx].trim();
    if (val && !isCodeOrPrice(val, volumeIdx)) explicitParts.push(val);
  }

  // Se extraímos com sucesso pelo menos a descrição do produto e embalagem/volume por cabeçalhos explícitos
  if (explicitParts.length >= 2 || (explicitParts.length === 1 && marcaIdx !== -1)) {
    return explicitParts.join(' - ').trim().replace(/\s+/g, ' ');
  }

  // 4. Varredura sequencial inteligente (coleta todas as colunas de texto descritivo na ordem em que aparecem)
  const textParts: string[] = [];

  for (let i = 0; i < row.length; i++) {
    if (i === colIdx) continue; // Ignora a coluna de preço clicada

    const header = (safeHeaders[i] || '').toUpperCase();
    if (/NCM|CEST|CNPJ|GTIN|EAN|CHAVE|CODIGO|CÓDIGO|\bCOD\b|ITEM|VALOR|PRECO|PREÇO|PMPF|PAUTA/i.test(header)) {
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
    return textParts.join(' - ').trim().replace(/\s+/g, ' ');
  }

  // Fallback extremo caso nenhuma célula tenha passado pelos filtros
  return row
    .filter((cell, idx) => idx !== colIdx && cell.trim() && !priceRegex.test(cell))
    .join(' - ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Extracts a numeric volume and unit from a string.
 * E.g., "Coca Cola 350ml" -> { value: 350, unit: 'ml' }
 * E.g., "1.5L" -> { value: 1.5, unit: 'l' }
 */
export function parseVolume(str: string): { value: number; unit: string } | null {
  const norm = str.toLowerCase();
  // Regex to match e.g. 350ml, 350 ml, 1.5l, 1.5 l, 1,5l, 2 litros, 2 lit, 2litros
  const match = norm.match(/\b(\d+(?:[\.,]\d+)?)\s*(ml|l(?:itros?)?)\b/);
  if (match) {
    const val = parseFloat(match[1].replace(',', '.'));
    let unit = match[2];
    if (unit.startsWith('l')) {
      unit = 'l';
    } else {
      unit = 'ml';
    }
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

/**
 * Calculates a match score between an inferred description from OCR and a product.
 * Returns a number where higher means a better match.
 */
export function calculateProductMatchScore(
  inferredDesc: string,
  product: { descricao_interna: string; embalagem?: string; conteudo_volume?: number }
): number {
  const normInferred = normalizeText(inferredDesc);
  const normProductDesc = normalizeText(product.descricao_interna);

  if (!normInferred || !normProductDesc) return 0;

  // Split inferred description into words
  const inferredWords = normInferred.split(/\s+/).filter(w => w.length >= 2);
  const productWords = normProductDesc.split(/\s+/).filter(w => w.length >= 2);

  if (inferredWords.length === 0 || productWords.length === 0) return 0;

  // Base score: number of overlapping words
  let wordMatches = 0;
  productWords.forEach(word => {
    if (inferredWords.includes(word)) {
      wordMatches += 2.0; // Perfect word match
    } else if (inferredWords.some(iw => iw.includes(word) || word.includes(iw))) {
      wordMatches += 0.8; // Partial sub-word match
    }
  });

  let score = wordMatches;

  // Parse volumes
  const inferredVol = parseVolume(inferredDesc);
  const productVol = product.conteudo_volume != null
    ? { value: product.conteudo_volume, unit: product.conteudo_volume < 10 ? 'l' : 'ml' }
    : parseVolume(product.descricao_interna);

  if (inferredVol && productVol) {
    // Convert both to ml for easy comparison
    const infVolMl = inferredVol.unit === 'l' ? inferredVol.value * 1000 : inferredVol.value;
    const prodVolMl = productVol.unit === 'l' ? productVol.value * 1000 : productVol.value;

    // Check if volumes match
    if (Math.abs(infVolMl - prodVolMl) < 5) {
      // Strong volume match bonus
      score += 15.0;
    } else {
      // Penalty for mismatched volumes
      score -= 20.0;
    }
  } else if (inferredVol || productVol) {
    // If one specifies volume and the other doesn't, moderate penalty
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
