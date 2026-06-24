function toStringOrJson(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function stripMarkdown(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * Extrai texto cru do objeto de resposta da API.
 */
export function extractRawText(data: { success?: boolean; data?: unknown } | any): string {
  if (!data) return '';
  if (data.data && typeof data.data === 'object' && 'data' in data.data) {
    return toStringOrJson((data.data as { data: unknown }).data);
  }
  if (data.data) {
    return toStringOrJson(data.data);
  }
  return toStringOrJson(data);
}

/**
 * Faz parsing de JSON, lidando com markdown e arrays truncados.
 */
export function parseJsonResponse<T = any>(raw: string): T[] {
  if (!raw) return [];
  const cleaned = stripMarkdown(raw);

  try {
    const direct = JSON.parse(cleaned);
    const items = Array.isArray(direct) ? direct : (direct.itens || direct.items || []);
    if (Array.isArray(items)) return items;
  } catch {
    // parsing direto falhou
  }

  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // parsing parcial falhou
    }
  }

  return parseTruncatedJsonArray<T>(cleaned);
}

/**
 * Parser tolerante para arrays JSON truncados.
 */
export function parseTruncatedJsonArray<T = any>(raw: string): T[] {
  const items: T[] = [];
  let braceCount = 0;
  let inString = false;
  let isEscaped = false;
  let objectStart = -1;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"' && !isEscaped) inString = !inString;
    if (inString) {
      isEscaped = char === '\\' ? !isEscaped : false;
      continue;
    }
    isEscaped = false;

    if (char === '{') {
      if (braceCount === 0) objectStart = i;
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && objectStart !== -1) {
        const objStr = raw.slice(objectStart, i + 1);
        try {
          const parsed = JSON.parse(objStr);
          if (parsed && typeof parsed === 'object') items.push(parsed as T);
        } catch {
          // objeto inválido, ignorar
        }
        objectStart = -1;
      }
    }
  }
  return items;
}
