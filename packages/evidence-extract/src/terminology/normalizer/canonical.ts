import { createHash } from 'node:crypto';
import {
  FACT_NORMALIZATION_AUTHORITY_SCOPE,
  type FactNormalizationKind,
  type FactNormalizationLimitationCode,
} from '../../factNormalizationTypes.js';
import {
  FACT_NORMALIZATION_IDENTITY_CANONICALIZATION,
  FACT_NORMALIZER_METHOD,
  FACT_NORMALIZER_VERSION,
} from './types.js';

export function nfc(value: string): string {
  return value.normalize('NFC');
}

export function sha256Utf8(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Deterministic normalizerFingerprint — binds method/version/identity contract only. */
export function computeNormalizerFingerprint(): string {
  return sha256Utf8(
    `${FACT_NORMALIZER_METHOD}|${FACT_NORMALIZER_VERSION}|${FACT_NORMALIZATION_IDENTITY_CANONICALIZATION}`,
  );
}

function canonicalizeValue(value: unknown): unknown {
  if (typeof value === 'string') return nfc(value);
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Error('INVALID_IDENTITY_CANONICAL');
    }
    return value;
  }
  if (typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = canonicalizeValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  throw new Error('INVALID_IDENTITY_CANONICAL');
}

export function canonicalIdentityJson(body: Record<string, unknown>): string {
  return JSON.stringify(canonicalizeValue(body));
}

export type NormalizationIdentityParts = {
  readonly sourceIdentityFingerprint: string;
  readonly normalizationKind: FactNormalizationKind;
  readonly canonicalLabel: string;
  readonly negationScope: string | null;
  readonly cueEntryIds: readonly string[];
  readonly packId: string;
  readonly packVersion: string;
  readonly packContentChecksum: string;
  readonly parserVersion: string;
  readonly parserFingerprint: string;
  readonly normalizerMethod: string;
  readonly normalizerVersion: string;
  readonly normalizerFingerprint: string;
  readonly limitationCodes: readonly FactNormalizationLimitationCode[];
};

export function computeNormalizationIdentityFingerprint(parts: NormalizationIdentityParts): string {
  const cueEntryIds = [...new Set(parts.cueEntryIds.map(nfc))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const limitationCodes = [...new Set(parts.limitationCodes.map(nfc))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const body = {
    authorityScope: FACT_NORMALIZATION_AUTHORITY_SCOPE,
    canonicalLabel: parts.canonicalLabel,
    cueEntryIds,
    identityCanonicalization: FACT_NORMALIZATION_IDENTITY_CANONICALIZATION,
    limitationCodes,
    negationScope: parts.negationScope,
    normalizationKind: parts.normalizationKind,
    normalizerFingerprint: parts.normalizerFingerprint,
    normalizerMethod: parts.normalizerMethod,
    normalizerVersion: parts.normalizerVersion,
    packContentChecksum: parts.packContentChecksum,
    packId: parts.packId,
    packVersion: parts.packVersion,
    parserFingerprint: parts.parserFingerprint,
    parserVersion: parts.parserVersion,
    sourceIdentityFingerprint: parts.sourceIdentityFingerprint,
  };
  return sha256Utf8(canonicalIdentityJson(body));
}
