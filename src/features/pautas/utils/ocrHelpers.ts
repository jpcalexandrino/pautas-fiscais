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

export function inferItemDescription(row: string[], headers: string[], colIdx: number, uf: string): string {
  const ufUpper = uf.toUpperCase();
  
  if (ufUpper === 'PR') {
    const marcaIdx = headers.findIndex(h => h.includes('MARCA_PRODUTO') || h.includes('MARCAS'));
    const marcaText = marcaIdx !== -1 ? row[marcaIdx] : row[1] || '';
    const embalagemText = headers[colIdx] || '';
    return `${marcaText} - ${embalagemText}`.trim().replace(/\s+/g, ' ');
  }
  
  const marcaIdx = headers.findIndex(h => h.includes('MARCA_PRODUTO') || h.includes('MARCA') || h.includes('DESCRICAO') || h.includes('PRODUTO'));
  const embalagemIdx = headers.findIndex(h => h.includes('EMBALAGEM') || h.includes('VOLUME'));
  
  let parts: string[] = [];
  if (marcaIdx !== -1 && row[marcaIdx]) parts.push(row[marcaIdx]);
  if (embalagemIdx !== -1 && row[embalagemIdx] && embalagemIdx !== colIdx) parts.push(row[embalagemIdx]);
  
  // Ignora cabeçalhos genéricos de preço (ex: PRECO_SUGERIDO, VALOR_PMPF) ou cabeçalhos genéricos como 'COLUNA 1'
  const isGenericPriceHeader = headers[colIdx] && /preco|valor|pmpf|pauta|custo|sugerido/i.test(headers[colIdx]);
  const isGenericColumnName = headers[colIdx] && /coluna|column|\bcol\b/i.test(headers[colIdx]);
  
  if (headers[colIdx] && !isGenericPriceHeader && !isGenericColumnName && headers[colIdx] !== headers[marcaIdx] && headers[colIdx] !== headers[embalagemIdx]) {
    parts.push(headers[colIdx]);
  }

  // Se não encontrou cabeçalho de marca específico, busca a célula de texto mais longa (que representa a descrição do produto)
  if (marcaIdx === -1) {
    let longestVal = '';
    for (let i = 0; i < row.length; i++) {
      if (i === colIdx) continue;
      const val = (row[i] || '').trim();
      // Ignora células vazias, preços ou predominantemente numéricas
      if (!val || priceRegex.test(val) || /^\d+$/.test(val.replace(/[\.\-\s]/g, ''))) continue;
      if (val.length > longestVal.length) {
        longestVal = val;
      }
    }
    if (longestVal) {
      parts.push(longestVal);
    }
  }
  
  // Busca por qualquer célula na linha que contenha padrão de volume (ex: 330ml, 330 ml, 500ml)
  const volumeRegex = /\b\d+(?:[\.,]\d+)?\s*(?:ml|l|g|kg)\b/i;
  const numberOnlyVolumeRegex = /\b(210|250|269|275|300|310|330|350|355|400|450|473|500|550|600|750|960|1000|1500|2000)\b/;
  
  let volumeFound = '';
  for (let i = 0; i < row.length; i++) {
    if (i === colIdx || i === marcaIdx || i === embalagemIdx) continue;
    const cellValue = (row[i] || '').trim();
    
    if (volumeRegex.test(cellValue)) {
      const match = cellValue.match(volumeRegex);
      if (match) {
        volumeFound = match[0];
        break;
      }
    } else if (numberOnlyVolumeRegex.test(cellValue)) {
      const match = cellValue.match(numberOnlyVolumeRegex);
      if (match) {
        volumeFound = match[0] + 'ml';
        break;
      }
    }
  }

  // Se encontramos um volume na linha e ele ainda não faz parte de nenhuma das strings incluídas
  if (volumeFound && !parts.some(p => p.toLowerCase().includes(volumeFound.toLowerCase()))) {
    parts.push(volumeFound);
  }
  
  if (parts.length === 0) {
    parts = row.filter((_, idx) => idx !== colIdx && idx !== 0);
  }
  
  return parts.join(' - ').trim().replace(/\s+/g, ' ');
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
