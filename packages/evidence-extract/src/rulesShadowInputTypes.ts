/**
 * F3D-2E2 deterministic Rules-shadow-input DTO foundation.
 * Non-persistent, analysis-eligibility → shadow-input envelope only.
 * Does not execute Rules, infer disease, map medicine, or activate readiness.
 */

export const RULES_SHADOW_INPUT_AUTHORITY = 'SOURCE_LINKED_FACT_RULES_SHADOW_INPUT_ONLY' as const;
export const RULES_SHADOW_INPUT_SCHEMA_VERSION = 'f3d2e2-rules-shadow-input-v1' as const;
export const RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION =
  'f3d2e1-analysis-acceptance-v1' as const;

export const MAX_RULES_SHADOW_INPUT_FACTS = 128 as const;
export const MAX_RULES_SHADOW_INPUT_NORMS_PER_FACT = 32 as const;
export const MAX_RULES_SHADOW_INPUT_TOTAL_NORMS = 512 as const;

export const RULES_SHADOW_INPUT_REASON_CODES = [
  'NO_ELIGIBLE_FACTS',
  'CONTRADICTORY_INPUT',
  'STALE_INPUT',
  'INPUT_BINDING_INVALID',
  'UNSUPPORTED_NORMALIZATION',
  'FACT_CAP_OVERFLOW',
  'NORM_PER_FACT_OVERFLOW',
  'TOTAL_NORM_CAP_OVERFLOW',
  'MALFORMED_UNICODE',
  'UNKNOWN_INPUT_KEY',
] as const;
export type RulesShadowInputReasonCode = (typeof RULES_SHADOW_INPUT_REASON_CODES)[number];

export type RulesShadowInputNormalizedSignal = {
  normalizationId: string;
  normalizationIdentityFingerprint: string;
  normalizationKind: 'UNIT_ALIAS' | 'DURATION_PHRASE' | 'NEGATION_CUE';
  canonicalLabel: string;
  /** Exact structured numeric value from the bound ACTIVE fact, when present. */
  structuredNumericValue: string | null;
  /** Exact source-preserving unit alias from UNIT_ALIAS canonicalLabel when kind matches. */
  exactUnitAlias: string | null;
  /** Exact duration label from DURATION_PHRASE canonicalLabel when kind matches. */
  durationLabel: string | null;
  negationScope: 'SCOPE_UNRESOLVED' | null;
  cueEntryIds: readonly string[];
  limitationCodes: readonly string[];
};

export type RulesShadowInputFactEnvelope = {
  factCandidateId: string;
  acceptanceEventId: string;
  verificationEventId: string;
  sourceChannel: string;
  sourceField: string;
  sourceIdentityFingerprint: string;
  sourceContentFingerprint: string;
  normalizationSnapshotFingerprint: string;
  acceptanceContractVersion: typeof RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION;
  packId: string;
  packVersion: string;
  packContentChecksum: string;
  parserVersion: string;
  parserFingerprint: string;
  normalizerMethod: string;
  normalizerVersion: string;
  normalizerFingerprint: string;
  decisionStatus: 'ACTIVE';
  limitationCodes: readonly string[];
  normalizedSignals: readonly RulesShadowInputNormalizedSignal[];
};

export type RulesShadowInputDto = {
  schemaVersion: typeof RULES_SHADOW_INPUT_SCHEMA_VERSION;
  authorityScope: typeof RULES_SHADOW_INPUT_AUTHORITY;
  clinicallyUsed: false;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  treatingDoctorId: string;
  consultationInputFingerprint: string;
  createdFromContractVersion: typeof RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION;
  limitationCodes: readonly string[];
  facts: readonly RulesShadowInputFactEnvelope[];
};

export type BuildRulesShadowInputResult =
  { ok: true; dto: RulesShadowInputDto } | { ok: false; reasonCode: RulesShadowInputReasonCode };
