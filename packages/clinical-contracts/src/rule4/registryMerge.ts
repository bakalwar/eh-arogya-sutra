export type Rule4RegistryEntry = {
  code: string;
  namespace: 'reason' | 'limitation';
  source: string;
};

export class Rule4RegistryMergeError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function mergeRule4RegistryEntries(
  phase1: readonly Rule4RegistryEntry[],
  phase2: readonly Rule4RegistryEntry[],
): Rule4RegistryEntry[] {
  const merged = new Map<string, Rule4RegistryEntry>();
  for (const entry of [...phase1, ...phase2]) {
    const existing = merged.get(entry.code);
    if (!existing) {
      merged.set(entry.code, entry);
      continue;
    }
    if (existing.namespace !== entry.namespace) {
      throw new Rule4RegistryMergeError('RULE4_REGISTRY_MERGE_NAMESPACE_CONFLICT');
    }
    if (existing.source !== entry.source) {
      throw new Rule4RegistryMergeError('RULE4_REGISTRY_MERGE_SOURCE_CONFLICT');
    }
  }
  return [...merged.values()];
}
