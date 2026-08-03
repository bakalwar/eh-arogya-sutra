import type { Rule4ReasonCodeEntry, Rule4LimitationCodeEntry } from './reasonCodes.js';

/** Phase 2 safety subset — fixtures/rule4/reason-code-registry.phase2-safety-subset.v1.json */
export const RULE4_PHASE2_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  { code: 'VERIFIED_AGE_MISSING', namespace: 'reason', source: 'Q14-CLOSE Q14-I' },
  { code: 'VERIFIED_AGE_INVALID', namespace: 'reason', source: 'Q14-CLOSE Q14-I' },
  { code: 'VERIFIED_AGE_CONTRADICTORY', namespace: 'reason', source: 'Q14-CLOSE Q14-I' },
  { code: 'PRESCRIPTION_HOLD', namespace: 'reason', source: 'Q15-E / Q06C / Q16-H' },
  { code: 'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE', namespace: 'reason', source: 'Q09-CLOSE Q9-Q' },
  { code: 'BP_CRISIS_PATIENT_WIDE', namespace: 'reason', source: 'Q06C crisis gate' },
  { code: 'SOURCE_DECLARED_CRITICAL_FINDING', namespace: 'reason', source: 'Q16-H' },
  { code: 'FROZEN_RED_FLAG_ESCALATION', namespace: 'reason', source: 'Q16-H / Q3F-Q4F' },
  { code: 'PATIENT_WIDE_CONTRAINDICATION_HOLD', namespace: 'reason', source: 'Q15-E' },
  { code: 'EXPLICIT_PRESCRIPTION_HOLD', namespace: 'reason', source: 'Q15-E' },
  {
    code: 'RULE4_SAFETY_GATE_CLEAR_FOR_FUTURE_CASCADE',
    namespace: 'reason',
    source: 'Phase 2 safety gate',
  },
  { code: 'RULE4_SAFETY_GATE_EVALUATED', namespace: 'reason', source: 'Phase 2 safety gate' },
  { code: 'D13_HS_UNDER_ONE_HARD_STOP', namespace: 'reason', source: 'D13-HS' },
  { code: 'RAW_LAB_KEYWORD_NOT_EXECUTABLE', namespace: 'reason', source: 'Q16-H catalog boundary' },
  { code: 'UNKNOWN_CRITICAL_FLAG_CODE', namespace: 'reason', source: 'Q16-H Phase 2 allowlist' },
  { code: 'CRITICAL_FINDING_INPUT_INVALID', namespace: 'reason', source: 'Q16-H structured input' },
  {
    code: 'UPSTREAM_AGE_BAND_PROVENANCE_MISSING',
    namespace: 'reason',
    source: 'Phase 2 age provenance',
  },
  {
    code: 'UPSTREAM_AGE_BAND_INVALID_SUPPORTING',
    namespace: 'reason',
    source: 'Phase 2 age provenance',
  },
  {
    code: 'UPSTREAM_AGE_SOURCE_NOT_AUTHORIZED',
    namespace: 'reason',
    source: 'Q14-H / Phase 2 upstream age provenance',
  },
];

export const RULE4_PHASE2_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'NON_BP_CRITICAL_CATALOG_NOT_EXECUTABLE',
    namespace: 'limitation',
    source: 'Q16-H SEPARATE_SAFETY_DATA_FREEZE_PENDING',
  },
  {
    code: 'BP_EVIDENCE_NOT_CRISIS_COMPARABLE',
    namespace: 'limitation',
    source: 'Q06C evidence taxonomy',
  },
  {
    code: 'PHASE2_NO_POTENCY_CASCADE',
    namespace: 'limitation',
    source: 'Phase 2 implementation boundary',
  },
  {
    code: 'CRITICAL_FLAG_CODE_NOT_IN_PHASE2_ALLOWLIST',
    namespace: 'limitation',
    source: 'Q16-H Phase 2 allowlist',
  },
  {
    code: 'UPSTREAM_AGE_BAND_PROVENANCE_REQUIRED',
    namespace: 'limitation',
    source: 'Phase 2 age provenance',
  },
  {
    code: 'DOB_UPSTREAM_PEDIATRIC_BAND_CONFLICT',
    namespace: 'limitation',
    source: 'Q14-I / Phase 2 age contradiction',
  },
];
