import type { CanonicalNamespace } from './constants.js';
import { nfcNormalize } from './canonicalJson.js';
import { normalizeMappedIdentity, resolveCanonicalNamespace } from './normalize.js';
import type { NormalizationResult } from './types.js';

export type DbNamespaceResolution =
  | {
      readonly kind: 'RESOLVED';
      readonly sourceLabel: string;
      readonly sourceCodeRaw: string;
      readonly normalization: NormalizationResult & { ok: true };
      readonly reason: 'BRIDGE_EVIDENCED' | 'DB_CODE_PREFIX' | 'DB_CODE_ICD10_PATTERN';
    }
  | {
      readonly kind: 'UNRESOLVED';
      readonly sourceCodeRaw: string | null;
      readonly reason: 'DB_ONLY_NO_EVIDENCE' | 'NAMESPACE_CONFLICT' | 'INVALID_CODE' | 'EMPTY_CODE';
    };

function inferNamespaceFromDbCode(rawCode: string): CanonicalNamespace | null {
  const trimmed = nfcNormalize(rawCode.trim());
  if (trimmed.length === 0) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('OMIM:')) {
    return 'OMIM';
  }
  if (upper.startsWith('ORPHA:') || upper.startsWith('ORPHANET:')) {
    return 'ORPHANET';
  }
  if (upper.startsWith('MESH:')) {
    return 'MESH';
  }
  if (/^[A-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?$/.test(upper)) {
    return 'ICD10';
  }
  return null;
}

export function resolveDbRowNamespace(input: {
  readonly icd10_code: string | null;
  readonly bridgeSourceLabel: string | null;
  readonly bridgeMappedCodeRaw: string | null;
  readonly bridgeNamespaces: readonly CanonicalNamespace[];
}): DbNamespaceResolution {
  if (input.bridgeSourceLabel && input.bridgeMappedCodeRaw) {
    const bridgeNorm = normalizeMappedIdentity(input.bridgeSourceLabel, input.bridgeMappedCodeRaw);
    if (bridgeNorm.ok) {
      const uniqueBridgeNamespaces = [...new Set(input.bridgeNamespaces)];
      if (
        uniqueBridgeNamespaces.length > 1 &&
        !uniqueBridgeNamespaces.every((ns) => ns === bridgeNorm.sourceNamespace)
      ) {
        return {
          kind: 'UNRESOLVED',
          sourceCodeRaw: input.icd10_code,
          reason: 'NAMESPACE_CONFLICT',
        };
      }
      return {
        kind: 'RESOLVED',
        sourceLabel: input.bridgeSourceLabel,
        sourceCodeRaw: input.bridgeMappedCodeRaw,
        normalization: bridgeNorm,
        reason: 'BRIDGE_EVIDENCED',
      };
    }
  }

  const raw = input.icd10_code?.trim() ?? '';
  if (raw.length === 0) {
    return { kind: 'UNRESOLVED', sourceCodeRaw: null, reason: 'EMPTY_CODE' };
  }

  const inferred = inferNamespaceFromDbCode(raw);
  if (inferred === null) {
    return { kind: 'UNRESOLVED', sourceCodeRaw: raw, reason: 'DB_ONLY_NO_EVIDENCE' };
  }

  const label =
    inferred === 'ICD10'
      ? 'ICD10'
      : inferred === 'OMIM'
        ? 'OMIM'
        : inferred === 'ORPHANET'
          ? 'ORPHANET'
          : 'MESH';

  const normalized = normalizeMappedIdentity(label, raw);
  if (!normalized.ok) {
    return { kind: 'UNRESOLVED', sourceCodeRaw: raw, reason: 'INVALID_CODE' };
  }

  return {
    kind: 'RESOLVED',
    sourceLabel: label,
    sourceCodeRaw: raw,
    normalization: normalized,
    reason: inferred === 'ICD10' ? 'DB_CODE_ICD10_PATTERN' : 'DB_CODE_PREFIX',
  };
}

export function mappedRawKey(sourceLabel: string, mappedCodeRaw: string): string {
  return `${nfcNormalize(sourceLabel.trim())}\u0000${nfcNormalize(mappedCodeRaw)}`;
}

export function assertApprovedSourceLabel(label: string): void {
  if (resolveCanonicalNamespace(label) === null) {
    throw new Error(`Unsupported source label ${label}`);
  }
}
