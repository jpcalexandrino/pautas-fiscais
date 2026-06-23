/**
 * Extracts raw text containing the JSON payload from the API response object.
 */
export function extractRawText(data: { success?: boolean; data?: unknown } | any): string {
  if (!data) return '';
  if (data.data && typeof data.data === 'object' && 'data' in data.data) {
    const nested = (data.data as { data: unknown }).data;
    return typeof nested === 'string' ? nested : JSON.stringify(nested);
  }
  if (data.data) {
    return typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
  }
  return typeof data === 'string' ? data : JSON.stringify(data);
}

/**
 * Parses and repairs raw JSON strings, handling markdown wrapping and truncated arrays.
 */
export function parseJsonResponse<T = any>(raw: string): T[] {
  if (!raw) return [];
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    const direct = JSON.parse(cleaned);
    const items = Array.isArray(direct) ? direct : (direct.itens || direct.items || []);
    if (Array.isArray(items)) return items;
  } catch { /* ignore */ }
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
  }
  return parseTruncatedJsonArray<T>(cleaned);
}

/**
 * Parses a potentially truncated JSON array by checking balanced braces.
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
      if (char === '\\') isEscaped = !isEscaped;
      else isEscaped = false;
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
        } catch { /* ignore */ }
        objectStart = -1;
      }
    }
  }
  return items;
}
