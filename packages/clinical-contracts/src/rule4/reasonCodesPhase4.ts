import type { Rule4LimitationCodeEntry, Rule4ReasonCodeEntry } from './reasonCodes.js';

export const RULE4_PHASE4_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  {
    code: 'RULE2_POLARITY_RECORD_INVALID',
    namespace: 'reason',
    source: 'rule-02-data-contract.md',
  },
  { code: 'RULE2_DISEASE_POLARITY_INVALID', namespace: 'reason', source: 'Q09-CLOSE Q9-Q' },
  { code: 'RULE2_THERAPEUTIC_POLARITY_INVALID', namespace: 'reason', source: 'Q09-CLOSE Q9-Q' },
  {
    code: 'RULE2_RESOLUTION_STATUS_INVALID',
    namespace: 'reason',
    source: 'rule-02-data-contract.md',
  },
  { code: 'RULE2_POLARITY_RECORD_MISSING', namespace: 'reason', source: 'Q09-CLOSE Q9-O' },
  { code: 'POLARITY_SAME_TARGET_CONTRADICTION', namespace: 'reason', source: 'Q09-CLOSE Q9-H' },
  { code: 'RULE2_THERAPEUTIC_POLARITY_MISMATCH', namespace: 'reason', source: 'Q09-CLOSE Q9-Q' },
  { code: 'RULE2_POLARITY_STATUS_AMBIGUOUS', namespace: 'reason', source: 'Q09-CLOSE Q9-Q' },
  {
    code: 'POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET',
    namespace: 'reason',
    source: 'Q10-CLOSE Q10-B',
  },
  {
    code: 'POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT',
    namespace: 'reason',
    source: 'Q11-CLOSE Q11-B',
  },
  {
    code: 'RULE4_POLARITY_PATHWAY_ROUTED',
    namespace: 'reason',
    source: 'Phase 4 polarity adapter',
  },
  {
    code: 'PRODUCTION_POLARITY_ROUTING_NOT_CONNECTED',
    namespace: 'reason',
    source: 'Phase 4 binding gate',
  },
  {
    code: 'CROSS_FORMULA_POLARITY_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q09-CLOSE Q9-Q',
  },
];

export const RULE4_PHASE4_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'PHASE4_NO_NUMERIC_CASCADE',
    namespace: 'limitation',
    source: 'Phase 4 polarity routing only',
  },
  {
    code: 'TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY',
    namespace: 'limitation',
    source: 'Phase 4 synthetic test bypass boundary',
  },
];
