/** Cross-language canonical JSON (matches Python json.dumps sort_keys, compact separators, UTF-8). */

function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortKeysDeep(obj[key]);
  }
  return sorted;
}

export function canonicalStableDumps(obj: unknown): string {
  const normalized = sortKeysDeep(obj);
  return JSON.stringify(normalized);
}
