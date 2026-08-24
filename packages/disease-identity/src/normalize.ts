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
  private readonly keyToRaw = new Map<string, Set<string>>();

  register(
    mappedSourceLabel: string,
    rawCode: string,
    result: Extract<NormalizationResult, { ok: true }>,
  ): void {
    const key = result.normalizedIdentityKey;
    const bucket = this.keyToRaw.get(key) ?? new Set<string>();
    bucket.add(rawCode);
    this.keyToRaw.set(key, bucket);
    if (bucket.size > 1) {
      const variants = [...bucket].sort();
      const allPresentationVariants = variants.every((variant) => {
        const renormalized = normalizeMappedIdentity(mappedSourceLabel, variant);
        return renormalized.ok && renormalized.normalizedIdentityKey === key;
      });
      if (!allPresentationVariants) {
        throw new DiseaseIdentityError(
          NORMALIZATION_COLLISION,
          `Normalization collision for ${key}: ${variants.join(', ')}`,
        );
      }
    }
  }
}

export function isCanonicalNamespace(value: string): value is CanonicalNamespace {
  return (CANONICAL_NAMESPACES as readonly string[]).includes(value);
}
