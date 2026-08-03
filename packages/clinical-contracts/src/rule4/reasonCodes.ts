import { Rule4UnknownCodeError } from './outputCodeValidation.js';
import {
  RULE4_PHASE2_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE2_REASON_CODE_REGISTRY,
} from './reasonCodesPhase2.js';
import {
  RULE4_PHASE3_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE3_REASON_CODE_REGISTRY,
} from './reasonCodesPhase3.js';
import {
  RULE4_PHASE4_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE4_REASON_CODE_REGISTRY,
} from './reasonCodesPhase4.js';
import {
  RULE4_PHASE5_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE5_REASON_CODE_REGISTRY,
} from './reasonCodesPhase5.js';
import {
  RULE4_PHASE6_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE6_REASON_CODE_REGISTRY,
} from './reasonCodesPhase6.js';
import {
  RULE4_PHASE7_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE7_REASON_CODE_REGISTRY,
} from './reasonCodesPhase7.js';

export type Rule4ReasonCodeEntry = {
  code: string;
  namespace: 'reason';
  source: string;
};

export type Rule4LimitationCodeEntry = {
  code: string;
  namespace: 'limitation';
  source: string;
};

/** Phase 1 foundation subset — aligned with fixtures/rule4/reason-code-registry.phase1-foundation-subset.v1.json */
export const RULE4_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  {
    code: 'RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED',
    namespace: 'reason',
    source: 'Phase 1 implementation',
  },
  {
    code: 'RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED',
    namespace: 'reason',
    source: 'Phase 1 feature gate',
  },
  { code: 'RULE4_ENGINE_MODE_INVALID', namespace: 'reason', source: 'Phase 1 feature gate' },
  { code: 'UPSTREAM_TARGET_POLARITY_NOT_RESOLVED', namespace: 'reason', source: 'Q09-CLOSE Q9-K' },
  { code: 'REGISTRY_Q9_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q09-CLOSE Q9-P' },
  { code: 'REGISTRY_Q10_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q10-CLOSE Q10-L' },
  { code: 'REGISTRY_Q11_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q11-CLOSE Q11-L' },
  { code: 'REGISTRY_Q12_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q12-CLOSE Q12-Q' },
  { code: 'REGISTRY_Q13_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q13-CLOSE Q13-R' },
  { code: 'REGISTRY_Q14_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q14-CLOSE Q14-O' },
  { code: 'REGISTRY_Q15_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q15-CLOSE Q15-M' },
  { code: 'REGISTRY_Q16_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q16-CLOSE Q16-M' },
  { code: 'REGISTRY_Q17_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q17-CLOSE Q17-N' },
  { code: 'REGISTRY_Q18_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q18-CLOSE Q18-L' },
  {
    code: 'LEGACY_AUTO_DILUTION_NOT_ISSUANCE_AUTHORITY',
    namespace: 'reason',
    source: 'Q18-CLOSE Q18-L',
  },
  { code: 'MDE_COMPLETION_NOT_ISSUANCE_AUTHORITY', namespace: 'reason', source: 'Q18-CLOSE Q18-L' },
  { code: 'CROSS_FORMULA_POTENCY_LEAKAGE_BLOCKED', namespace: 'reason', source: 'Q15-CLOSE Q15-C' },
  { code: 'SEVERITY_VALUE_MISSING', namespace: 'reason', source: 'Q07C-D10 D10-B' },
  { code: 'INVALID_SEVERITY_NUMERIC_VALUE', namespace: 'reason', source: 'Q07C-D10 D10-B' },
  { code: 'SEVERITY_EVIDENCE_AMBIGUOUS', namespace: 'reason', source: 'Q13-CLOSE Q13-T' },
  {
    code: 'ACUTE_CHRONIC_TARGET_SEPARATION_FAILED',
    namespace: 'reason',
    source: 'Q12-CLOSE Q12-J',
  },
  { code: 'VAGUE_TIMELINE_NOT_EXECUTABLE', namespace: 'reason', source: 'Q12-CLOSE Q12-N' },
  {
    code: 'PEDIATRIC_RESTRICT_JUSTIFICATION_MISSING',
    namespace: 'reason',
    source: 'Q18-CLOSE Q18-I',
  },
  {
    code: 'GLOBAL_TEXT_NOT_RULE4_SELECTOR_INPUT',
    namespace: 'reason',
    source: 'Q16-CLOSE Q16-B implementation boundary',
  },
  {
    code: 'REGISTRY_POTENCY_SELECTOR_NOT_EXECUTABLE',
    namespace: 'reason',
    source: 'Q16-CLOSE Q16-M / freeze register',
  },
];

export const RULE4_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE',
    namespace: 'limitation',
    source: 'Q07C-D11 D11-C',
  },
  { code: 'PEDIATRIC_1_5_POSOLOGY_LIMITATION', namespace: 'limitation', source: 'D13-G-A' },
  { code: 'PEDIATRIC_6_12_POSOLOGY_LIMITATION', namespace: 'limitation', source: 'D13-G-B' },
  { code: 'PEDIATRIC_UNDER_ONE_HARD_STOP', namespace: 'limitation', source: 'D13-HS' },
  {
    code: 'SEVERITY_AMBIGUOUS',
    namespace: 'limitation',
    source: 'Q13-CLOSE Q13-T (limitation only; not severity_status)',
  },
  {
    code: 'PHASE1_NO_CLINICAL_EVALUATION',
    namespace: 'limitation',
    source: 'Phase 1 implementation',
  },
];

export const RULE4_REASON_CODE_REGISTRY_MERGED: readonly Rule4ReasonCodeEntry[] = [
  ...RULE4_REASON_CODE_REGISTRY,
  ...RULE4_PHASE2_REASON_CODE_REGISTRY,
  ...RULE4_PHASE3_REASON_CODE_REGISTRY,
  ...RULE4_PHASE4_REASON_CODE_REGISTRY,
  ...RULE4_PHASE5_REASON_CODE_REGISTRY,
  ...RULE4_PHASE6_REASON_CODE_REGISTRY,
  ...RULE4_PHASE7_REASON_CODE_REGISTRY,
];

export const RULE4_LIMITATION_CODE_REGISTRY_MERGED: readonly Rule4LimitationCodeEntry[] = [
  ...RULE4_LIMITATION_CODE_REGISTRY,
  ...RULE4_PHASE2_LIMITATION_CODE_REGISTRY,
  ...RULE4_PHASE3_LIMITATION_CODE_REGISTRY,
  ...RULE4_PHASE4_LIMITATION_CODE_REGISTRY,
  ...RULE4_PHASE5_LIMITATION_CODE_REGISTRY,
  ...RULE4_PHASE6_LIMITATION_CODE_REGISTRY,
  ...RULE4_PHASE7_LIMITATION_CODE_REGISTRY,
];

export const RULE4_REASON_CODES = RULE4_REASON_CODE_REGISTRY_MERGED.map((e) => e.code);

export const RULE4_LIMITATION_CODES = RULE4_LIMITATION_CODE_REGISTRY_MERGED.map((e) => e.code);

export const RULE4_KNOWN_REASON_CODE_SET = new Set<string>(RULE4_REASON_CODES);

export const RULE4_KNOWN_LIMITATION_CODE_SET = new Set<string>(RULE4_LIMITATION_CODES);

export function assertKnownRule4ReasonCode(code: string): void {
  if (!RULE4_KNOWN_REASON_CODE_SET.has(code)) {
    throw new Rule4UnknownCodeError('RULE4_UNKNOWN_REASON_CODE');
  }
}

export function assertKnownRule4LimitationCode(code: string): void {
  if (!RULE4_KNOWN_LIMITATION_CODE_SET.has(code)) {
    throw new Rule4UnknownCodeError('RULE4_UNKNOWN_LIMITATION_CODE');
  }
}

export {
  RULE4_REGISTRY_VERSION,
  RULE4_REGISTRY_SCOPE,
  RULE4_REGISTRY_COMPLETE,
  RULE4_CLINICAL_REGISTRY_STATUS,
  RULE4_DOCUMENTATION_BASELINE_COMMIT,
  RULE4_UNKNOWN_CODE_POLICY,
  RULE4_FULL_REGISTRY_STATUS,
} from './version.js';

export const RULE4_DUPLICATE_SEMANTIC_REPORT = [
  {
    codes: ['SEVERITY_EVIDENCE_AMBIGUOUS', 'SEVERITY_AMBIGUOUS'],
    note: 'reason vs limitation namespaces; Q13-T forbids substituting severity_status with either.',
  },
] as const;

export const RULE4_LEGACY_FIELD_ALIASES = [
  {
    alias: 'reason_code',
    canonical: 'reason_codes',
    note: 'Singular diagnostic field in D10 tables; array reason_codes is canonical output shape.',
  },
] as const;
