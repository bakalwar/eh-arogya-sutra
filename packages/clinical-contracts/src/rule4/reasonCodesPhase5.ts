import type { Rule4LimitationCodeEntry, Rule4ReasonCodeEntry } from './reasonCodes.js';

export const RULE4_PHASE5_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  { code: 'PHASE_EVIDENCE_MISSING', namespace: 'reason', source: 'Q12-CLOSE Q12-E' },
  { code: 'PHASE_EVIDENCE_INVALID', namespace: 'reason', source: 'Q12-CLOSE Q12-E' },
  { code: 'PHASE_EVIDENCE_AMBIGUOUS', namespace: 'reason', source: 'Q12-CLOSE Q12-E' },
  { code: 'PHASE_CONTRADICTORY', namespace: 'reason', source: 'Q12-CLOSE Q12-S' },
  {
    code: 'CROSS_FORMULA_PHASE_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q12-CLOSE Q12-S',
  },
  {
    code: 'PHASE_ALONE_NOT_A_POTENCY_SELECTOR',
    namespace: 'reason',
    source: 'Q12-CLOSE Q12-F',
  },
  {
    code: 'PRODUCTION_PHASE_RESOLUTION_NOT_CONNECTED',
    namespace: 'reason',
    source: 'Phase 5 binding gate',
  },
  {
    code: 'LEGACY_MISSING_PHASE_ACUTE_DEFAULT_REJECTED',
    namespace: 'reason',
    source: 'Q12-CLOSE Q12-Q',
  },
  {
    code: 'LEGACY_PHASE_KEYWORD_SELECTOR_BLOCKED',
    namespace: 'reason',
    source: 'Q12-CLOSE Q12-Q',
  },
  {
    code: 'PARTIAL_PHASE_RESOLUTION_REQUIRES_DOCTOR_REVIEW',
    namespace: 'reason',
    source: 'Q12-CLOSE Q12-M',
  },
];

export const RULE4_PHASE5_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'PHASE5_NO_NUMERIC_CASCADE',
    namespace: 'limitation',
    source: 'Phase 5 structured phase only',
  },
];
