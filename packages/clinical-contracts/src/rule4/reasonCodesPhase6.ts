import type { Rule4LimitationCodeEntry, Rule4ReasonCodeEntry } from './reasonCodes.js';

export const RULE4_PHASE6_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  { code: 'SEVERITY_SCORE_BAND_MISMATCH', namespace: 'reason', source: 'Q13-CLOSE Q13-T / D10-K' },
  {
    code: 'GLOBAL_SEVERITY_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q13-CLOSE Q13-S',
  },
  {
    code: 'CROSS_FORMULA_SEVERITY_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q13-CLOSE Q13-S',
  },
  {
    code: 'SEVERITY_ALONE_NOT_A_POTENCY_SELECTOR',
    namespace: 'reason',
    source: 'Q13-CLOSE Q13-F',
  },
  {
    code: 'PRODUCTION_SEVERITY_RESOLUTION_NOT_CONNECTED',
    namespace: 'reason',
    source: 'Phase 6 binding gate',
  },
  {
    code: 'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q12-CLOSE Q12-J',
  },
  {
    code: 'TARGET_BINDING_MISSING',
    namespace: 'reason',
    source: 'Q13-CLOSE Q13-S / D10-J',
  },
  {
    code: 'PARTIAL_SEVERITY_RESOLUTION_REQUIRES_DOCTOR_REVIEW',
    namespace: 'reason',
    source: 'Q13-CLOSE Q13-M',
  },
];

export const RULE4_PHASE6_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'PHASE6_NO_NUMERIC_CASCADE',
    namespace: 'limitation',
    source: 'Phase 6 structured severity only',
  },
  {
    code: 'PHASE6_UPSTREAM_CONTEXT_BOUNDARY',
    namespace: 'limitation',
    source: 'Phase 6 upstream polarity/phase context boundary',
  },
];
