import {
  CANONICAL_NAMESPACES,
  MAX_FIELD_LENGTH,
  SOURCE_LABEL_TO_NAMESPACE,
  type CanonicalNamespace,
} from './constants.js';
import { DiseaseIdentityError, FIELD_TOO_LONG, NORMALIZATION_COLLISION } from './errors.js';
import { nfcNormalize } from './canonicalJson.js';
import type { NormalizationResult } from './types.js';

function assertBounded(value: string, label: string): void {
  if (value.length > MAX_FIELD_LENGTH) {
    throw new DiseaseIdentityError(FIELD_TOO_LONG, `${label} exceeds ${MAX_FIELD_LENGTH}`);
  }
}

function stripOptionalPrefix(raw: string, prefix: string): string {
  const upper = raw.toUpperCase();
  const normalizedPrefix = prefix.toUpperCase();
  if (upper.startsWith(normalizedPrefix)) {
    return raw.slice(prefix.length);
  }
  return raw;
}

export function resolveCanonicalNamespace(sourceLabel: string): CanonicalNamespace | null {
  const trimmed = nfcNormalize(sourceLabel.trim());
  assertBounded(trimmed, 'sourceLabel');
  return SOURCE_LABEL_TO_NAMESPACE[trimmed.toUpperCase()] ?? null;
}

export function normalizeSourceCode(
  sourceNamespace: CanonicalNamespace,
  rawCode: string,
): NormalizationResult {
  const trimmed = nfcNormalize(rawCode.trim());
  assertBounded(trimmed, 'sourceCode');
  if (trimmed.length === 0) {
    return { ok: false, reason: 'INVALID_CODE' };
  }

  let code = trimmed;
  switch (sourceNamespace) {
    case 'ICD10':
      code = trimmed.toUpperCase();
      break;
    case 'OMIM':
      code = stripOptionalPrefix(trimmed, 'OMIM:');
      break;
    case 'ORPHANET':
      code = stripOptionalPrefix(trimmed, 'ORPHA:');
      break;
    case 'MESH':
      code = stripOptionalPrefix(trimmed, 'MESH:').toUpperCase();
      break;
    default:
      return { ok: false, reason: 'INVALID_NAMESPACE' };
  }

  if (code.length === 0) {
    return { ok: false, reason: 'INVALID_CODE' };
  }

  return {
    ok: true,
    sourceNamespace,
    sourceCode: code,
    normalizedIdentityKey: `${sourceNamespace}|${code}`,
  };
}

export function normalizeMappedIdentity(
  mappedSourceLabel: string,
  mappedCodeRaw: string,
): NormalizationResult {
  const namespace = resolveCanonicalNamespace(mappedSourceLabel);
  if (namespace === null) {
    return { ok: false, reason: 'INVALID_NAMESPACE' };
  }
  return normalizeSourceCode(namespace, mappedCodeRaw);
}

export class NormalizationCollisionRegistry {
  private readonly keyToVariants = new Map<
    string,
    Array<{ mappedSourceLabel: string; rawCode: string }>
  >();

  register(mappedSourceLabel: string, rawCode: string): void {
    const normalized = normalizeMappedIdentity(mappedSourceLabel, rawCode);
    if (!normalized.ok) {
      return;
    }

    const key = normalized.normalizedIdentityKey;
    const bucket = this.keyToVariants.get(key) ?? [];

    for (const existing of bucket) {
      if (existing.mappedSourceLabel === mappedSourceLabel && existing.rawCode !== rawCode) {
        const alternate = normalizeMappedIdentity(existing.mappedSourceLabel, rawCode);
        const reverse = normalizeMappedIdentity(mappedSourceLabel, existing.rawCode);
        const presentationEquivalent =
          alternate.ok &&
          reverse.ok &&
          alternate.normalizedIdentityKey === key &&
          reverse.normalizedIdentityKey === key;
        if (!presentationEquivalent) {
          throw new DiseaseIdentityError(
            NORMALIZATION_COLLISION,
            `Incompatible normalization variants for ${key}: ${existing.rawCode}, ${rawCode}`,
          );
        }
      }
    }

    const duplicate = bucket.some(
      (entry) => entry.mappedSourceLabel === mappedSourceLabel && entry.rawCode === rawCode,
    );
    if (!duplicate) {
      bucket.push({ mappedSourceLabel, rawCode });
      this.keyToVariants.set(key, bucket);
    }
  }
}

export function isCanonicalNamespace(value: string): value is CanonicalNamespace {
  return (CANONICAL_NAMESPACES as readonly string[]).includes(value);
}
