/**
 * Log JSON cho debug cv-improve — truncate để không nổ terminal / log aggregation.
 */
export function summarizeJsonForLog(value: unknown, maxChars = 3500): string {
  try {
    const s = JSON.stringify(value, null, 0);
    if (s.length <= maxChars) return s;
    return `${s.slice(0, maxChars)}… [truncated, total ${s.length} chars]`;
  } catch {
    return `[unstringifiable: ${String(value)}]`;
  }
}

export function describeUnknownJson(value: unknown): {
  typeof: string;
  isArray: boolean;
  keys: string[] | null;
  stringPreview: string | null;
} {
  const t = value === null ? "null" : typeof value;
  if (value !== null && typeof value === "object") {
    if (Array.isArray(value)) {
      return {
        typeof: "object",
        isArray: true,
        keys: null,
        stringPreview: `[array length ${value.length}]`,
      };
    }
    return {
      typeof: "object",
      isArray: false,
      keys: Object.keys(value as object).slice(0, 40),
      stringPreview: null,
    };
  }
  if (typeof value === "string") {
    const v = value as string;
    const preview =
      v.length > 200 ? `${v.slice(0, 200)}… [string ${v.length} chars]` : v;
    return { typeof: t, isArray: false, keys: null, stringPreview: preview };
  }
  return { typeof: t, isArray: false, keys: null, stringPreview: null };
}
