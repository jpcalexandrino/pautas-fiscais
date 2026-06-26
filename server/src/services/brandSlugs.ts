/**
 * Termos identificadores da marca que devem estar presentes numa linha
 * do PDF de pauta fiscal para que ela seja considerada relevante.
 *
 * Usado tanto para filtrar o texto extraído quanto para orientar a IA
 * sobre onde ancorar a descrição do produto na linha.
 */
export const BRAND_SLUGS: string[] = [
  'imperio',
  'império',
  'cidade imperial',
  'puro malte pilsen',
  'macedonia',
  'macedônia',
  '3.0',
];

/**
 * Remove anotações geradas pelo filterTextByBrandSlugs ([CTX_ESQ: ...] e [PRODUTO: ...])
 * para que a descricao_estado enviada ao banco e ao matching seja limpa.
 *
 * Quando há [PRODUTO: Império Pilsen | 134 | 42,56], extrai apenas os segmentos
 * que contêm letras (o nome do produto), descartando códigos numéricos e valores.
 */
export function stripAnnotations(text: string): string {
  let ctxEsq = '';
  let produto = '';

  // Procura por [CTX_ESQ: ...]
  const ctxMatch = text.match(/\[CTX_ESQ:\s*([^\]]+)\]/i);
  if (ctxMatch) {
    ctxEsq = ctxMatch[1].trim();
  }

  // Procura por [PRODUTO: ...]
  const produtoMatch = text.match(/\[PRODUTO:\s*([^\]]+)\]/i);
  if (produtoMatch) {
    produto = produtoMatch[1].trim();
  }

  if (produto) {
    const cleanProduto = produto.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
    if (ctxEsq) {
      return `${ctxEsq} ${cleanProduto}`.trim();
    }
    return cleanProduto;
  }

  // Caso não tenha as marcações esperadas, limpa possíveis tags residuais
  let clean = text;
  if (ctxMatch) {
    clean = clean.replace(/\[CTX_ESQ:[^\]]*\]/gi, '');
  }
  clean = clean.replace(/\[PRODUTO:\s*([^\]]+)\]/gi, '$1');
  clean = clean.replace(/\|/g, ' ').replace(/\s+/g, ' ');

  return clean.trim();
}
