import type { CanonicalNamespace } from './constants.js';
import { nfcNormalize } from './canonicalJson.js';
import { normalizeMappedIdentity, resolveCanonicalNamespace } from './normalize.js';
import type { NormalizationResult } from './types.js';

export type BridgeNamespaceEvidence = {
  readonly sourceLabel: string;
  readonly mappedCodeRaw: string;
};

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

/**
 * Resolve namespace for a DB disease row.
 * When any bridge evidence links the row (including ambiguous), use bridge namespaces
 * without selecting a primary disease. Conflicting namespaces → UNRESOLVED + flag.
 * DB-only rows may use approved deterministic prefix/pattern rules only — never default ICD10.
 */
export function resolveDbRowNamespace(input: {
  readonly icd10_code: string | null;
  /** @deprecated Prefer bridgeEvidenceRows — retained for back-compat test helpers. */
  readonly bridgeSourceLabel?: string | null;
  readonly bridgeMappedCodeRaw?: string | null;
  readonly bridgeNamespaces?: readonly CanonicalNamespace[];
  readonly bridgeEvidenceRows?: readonly BridgeNamespaceEvidence[];
}): DbNamespaceResolution {
  const evidenceRows: readonly BridgeNamespaceEvidence[] =
    input.bridgeEvidenceRows ??
    (input.bridgeSourceLabel && input.bridgeMappedCodeRaw
      ? [{ sourceLabel: input.bridgeSourceLabel, mappedCodeRaw: input.bridgeMappedCodeRaw }]
      : []);

  if (evidenceRows.length > 0) {
    const normalizedEvidence: Array<{
      sourceLabel: string;
      mappedCodeRaw: string;
      normalization: NormalizationResult & { ok: true };
    }> = [];
    const namespaces = new Set<CanonicalNamespace>();

    for (const row of evidenceRows) {
      const bridgeNorm = normalizeMappedIdentity(row.sourceLabel, row.mappedCodeRaw);
      if (bridgeNorm.ok) {
        namespaces.add(bridgeNorm.sourceNamespace);
        normalizedEvidence.push({
          sourceLabel: row.sourceLabel,
          mappedCodeRaw: row.mappedCodeRaw,
          normalization: bridgeNorm,
        });
      }
    }

    // Also consider explicitly supplied bridgeNamespaces (e.g. from caller aggregation).
    for (const ns of input.bridgeNamespaces ?? []) {
      namespaces.add(ns);
    }

    if (namespaces.size > 1) {
      return {
        kind: 'UNRESOLVED',
        sourceCodeRaw: null,
        reason: 'NAMESPACE_CONFLICT',
      };
    }

    if (normalizedEvidence.length > 0 && namespaces.size === 1) {
      const chosen = normalizedEvidence[0]!;
      return {
        kind: 'RESOLVED',
        sourceLabel: chosen.sourceLabel,
        sourceCodeRaw: chosen.mappedCodeRaw,
        normalization: chosen.normalization,
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
