/** Safe JSON parse — handles markdown fences and double-encoded strings. */
export function parseJsonSafe<T = unknown>(raw: unknown, label = 'response'): T | null {
  try {
    if (raw == null) return null;
    if (typeof raw === 'object') return raw as T;
    let text = String(raw).trim();
    if (!text) return null;
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    if (text.startsWith('"') && text.endsWith('"')) {
      try {
        const inner = JSON.parse(text);
        if (typeof inner === 'object' && inner !== null) return inner as T;
        if (typeof inner === 'string') {
          text = inner.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        }
      } catch {
        /* continue */
      }
    }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    return JSON.parse(text) as T;
  } catch (e) {
    console.error(`[parseJsonSafe] ${label}:`, e);
    return null;
  }
}
