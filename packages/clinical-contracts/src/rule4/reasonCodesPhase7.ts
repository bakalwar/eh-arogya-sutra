import type { Rule4LimitationCodeEntry, Rule4ReasonCodeEntry } from './reasonCodes.js';

export const RULE4_PHASE7_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  {
    code: 'ELIGIBILITY_ALONE_NOT_A_POTENCY_SELECTOR',
    namespace: 'reason',
    source: 'Phase 7 boundary',
  },
  {
    code: 'FAMILY_ELIGIBILITY_NOT_NUMERIC_SELECTION',
    namespace: 'reason',
    source: 'Phase 7 boundary',
  },
  { code: 'NEG_COMMON_GATES_INCOMPLETE', namespace: 'reason', source: 'Q8-B' },
  { code: 'SEVERITY_UPSTREAM_MISSING', namespace: 'reason', source: 'Q13 upstream' },
  { code: 'D1_PROHIBITED_HIGH_SEVERITY', namespace: 'reason', source: 'Q8-E' },
  { code: 'D1_HYPOFUNCTION_EVIDENCE_MISSING', namespace: 'reason', source: 'Q8-C' },
  { code: 'D2_RESTRICTED_GATES_INCOMPLETE', namespace: 'reason', source: 'Q8-D Q8-E' },
  { code: 'D2_MODERATING_EVIDENCE_MISSING', namespace: 'reason', source: 'Q8-D' },
  {
    code: 'CROSS_FORMULA_ELIGIBILITY_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q15 isolation',
  },
  { code: 'D30F_INCOMPLETE', namespace: 'reason', source: 'Q07C-D30F' },
  { code: 'TIER3_PATHOLOGY_MAPPING_PENDING', namespace: 'reason', source: 'Q7-D14' },
  { code: 'TIER3_SUGGESTIVE_ONLY', namespace: 'reason', source: 'Q7-D14' },
  { code: 'DAY_91_ALONE_INSUFFICIENT', namespace: 'reason', source: 'Q07C-D60F' },
  { code: 'FORMULA_BP_READING_MISSING', namespace: 'reason', source: 'Q06C formula BP' },
  { code: 'FORMULA_BP_NOT_VERIFIED', namespace: 'reason', source: 'Q06C formula BP' },
  { code: 'FORMULA_BP_TARGET_MISMATCH', namespace: 'reason', source: 'Q06C formula BP' },
  { code: 'FORMULA_BP_BINDING_MISSING', namespace: 'reason', source: 'Q06C formula BP' },
  { code: 'FORMULA_BP_STAGE1_NOT_MET', namespace: 'reason', source: 'Q06C CLOSE-D01' },
  { code: 'FORMULA_BP_STAGE2_NOT_MET', namespace: 'reason', source: 'Q07C-D30F Path A' },
  { code: 'UPSTREAM_POLARITY_MISSING', namespace: 'reason', source: 'Phase 7 upstream' },
  { code: 'ELIGIBILITY_PATHWAY_NOT_EVALUATED', namespace: 'reason', source: 'Phase 7' },
  {
    code: 'PRODUCTION_ELIGIBILITY_STRUCTURED_INPUT_REQUIRED',
    namespace: 'reason',
    source: 'Phase 7 production boundary',
  },
  { code: 'TEMPERAMENT_ALONE_CANNOT_QUALIFY_FAMILY', namespace: 'reason', source: 'Q17 Q8-G' },
  { code: 'NERVOUS_ALONE_CANNOT_QUALIFY_D3_D5', namespace: 'reason', source: 'CLOSE-D05' },
];

export const RULE4_PHASE7_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'PHASE7_NO_NUMERIC_SELECTION',
    namespace: 'limitation',
    source: 'Phase 7 candidate eligibility only',
  },
  {
    code: 'TRUSTED_SYNTHETIC_ELIGIBILITY_BYPASS_TEST_ONLY',
    namespace: 'limitation',
    source: 'Phase 7 synthetic fixtures',
  },
  {
    code: 'PHASE8_TEMPERAMENT_TIE_BREAK_DEFERRED',
    namespace: 'limitation',
    source: 'Q8-G deferred to Phase 8',
  },
];
