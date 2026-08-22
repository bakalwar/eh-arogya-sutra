import { createHash } from 'node:crypto';
import type { RulesShadowInputDto } from '@ehas2/evidence-extract';

/** Fail-closed: string must already be NFC with no unpaired surrogates / zero-width / controls. */
export function assertRulesShadowInputNfcString(text: string, maxChars: number): void {
  if (typeof text !== 'string' || text.length === 0 || text.length > maxChars) {
    throw new Error('MALFORMED_UNICODE');
  }
  if (text.normalize('NFC') !== text) {
    throw new Error('MALFORMED_UNICODE');
  }
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code === 0) throw new Error('MALFORMED_UNICODE');
    if (code >= 0xd800 && code <= 0xdfff) throw new Error('MALFORMED_UNICODE');
    if (code >= 0x200b && code <= 0x200d) throw new Error('MALFORMED_UNICODE');
    if (code === 0xfeff) throw new Error('MALFORMED_UNICODE');
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
      throw new Error('MALFORMED_UNICODE');
    }
    if (code === 0x7f) throw new Error('MALFORMED_UNICODE');
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
  if (typeof value === 'string') {
    assertRulesShadowInputNfcString(value, 4096);
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) throw new Error('MALFORMED_UNICODE');
    return value;
  }
  if (typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = canonicalize(value[key]);
    }
    return out;
  }
  throw new Error('MALFORMED_UNICODE');
}

/** Identity body excludes runtime timestamps; fingerprint is SHA-256 of canonical JSON. */
export function buildRulesShadowInputFingerprint(
  dto: Omit<RulesShadowInputDto, 'consultationInputFingerprint'>,
): string {
  const body = canonicalize({
    schemaVersion: dto.schemaVersion,
    authorityScope: dto.authorityScope,
    clinicallyUsed: dto.clinicallyUsed,
    organizationId: dto.organizationId,
    clinicId: dto.clinicId,
    patientId: dto.patientId,
    consultationId: dto.consultationId,
    treatingDoctorId: dto.treatingDoctorId,
    createdFromContractVersion: dto.createdFromContractVersion,
    limitationCodes: [...dto.limitationCodes],
    facts: dto.facts.map((f: RulesShadowInputDto['facts'][number]) => ({
      factCandidateId: f.factCandidateId,
      acceptanceEventId: f.acceptanceEventId,
      verificationEventId: f.verificationEventId,
      sourceChannel: f.sourceChannel,
      sourceField: f.sourceField,
      sourceIdentityFingerprint: f.sourceIdentityFingerprint,
      sourceContentFingerprint: f.sourceContentFingerprint,
      normalizationSnapshotFingerprint: f.normalizationSnapshotFingerprint,
      acceptanceContractVersion: f.acceptanceContractVersion,
      packId: f.packId,
      packVersion: f.packVersion,
      packContentChecksum: f.packContentChecksum,
      parserVersion: f.parserVersion,
      parserFingerprint: f.parserFingerprint,
      normalizerMethod: f.normalizerMethod,
      normalizerVersion: f.normalizerVersion,
      normalizerFingerprint: f.normalizerFingerprint,
      decisionStatus: f.decisionStatus,
      limitationCodes: [...f.limitationCodes],
      normalizedSignals: f.normalizedSignals.map(
        (s: RulesShadowInputDto['facts'][number]['normalizedSignals'][number]) => ({
          normalizationId: s.normalizationId,
          normalizationIdentityFingerprint: s.normalizationIdentityFingerprint,
          normalizationKind: s.normalizationKind,
          canonicalLabel: s.canonicalLabel,
          structuredNumericValue: s.structuredNumericValue,
          exactUnitAlias: s.exactUnitAlias,
          durationLabel: s.durationLabel,
          negationScope: s.negationScope,
          cueEntryIds: [...s.cueEntryIds],
          limitationCodes: [...s.limitationCodes],
        }),
      ),
    })),
  });
  return createHash('sha256').update(JSON.stringify(body), 'utf8').digest('hex');
}

export function compareRulesShadowFactOrder(
  a: {
    sourceChannel: string;
    sourceField: string;
    factCandidateId: string;
    acceptanceEventId: string;
  },
  b: {
    sourceChannel: string;
    sourceField: string;
    factCandidateId: string;
    acceptanceEventId: string;
  },
): number {
  const keys: (keyof typeof a)[] = [
    'sourceChannel',
    'sourceField',
    'factCandidateId',
    'acceptanceEventId',
  ];
  for (const key of keys) {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
  }
  return 0;
}

export function compareRulesShadowNormOrder(
  a: {
    normalizationKind: string;
    canonicalLabel: string;
    normalizationIdentityFingerprint: string;
    normalizationId: string;
  },
  b: {
    normalizationKind: string;
    canonicalLabel: string;
    normalizationIdentityFingerprint: string;
    normalizationId: string;
  },
): number {
  const keys: (keyof typeof a)[] = [
    'normalizationKind',
    'canonicalLabel',
    'normalizationIdentityFingerprint',
    'normalizationId',
  ];
  for (const key of keys) {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
  }
  return 0;
}
