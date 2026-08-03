import type { Rule4ReasonCodeEntry, Rule4LimitationCodeEntry } from './reasonCodes.js';

/** Phase 3 evidence subset — fixtures/rule4/reason-code-registry.phase3-evidence-subset.v1.json */
export const RULE4_PHASE3_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  { code: 'D08_DOCUMENT_GATE_FAILED', namespace: 'reason', source: 'Q07C-CLOSE-D08 D08-G' },
  { code: 'ITEM_BELOW_CONFIDENCE_THRESHOLD', namespace: 'reason', source: 'Q07C-CLOSE-D08 D08-G' },
  { code: 'UNKNOWN_SOURCE_TYPE', namespace: 'reason', source: 'Q07C-CLOSE-D08 D08-J' },
  { code: 'MISSING_CONFIDENCE_SCORE', namespace: 'reason', source: 'Q07C-CLOSE-D08 D08-J' },
  {
    code: 'UNCALIBRATED_MODEL_BLOCKED_PRE_EXECUTION',
    namespace: 'reason',
    source: 'Q07C-CLOSE-D08 D08-K Option C',
  },
  { code: 'CLINICAL_PHOTO_NOT_USABLE_ALONE', namespace: 'reason', source: 'Q07C-CLOSE-D08 D08-I' },
  {
    code: 'RULE3_BINDING_PORT_NOT_RESOLVED',
    namespace: 'reason',
    source: 'Q16-CLOSE Q16-C / Rule 3 port',
  },
  { code: 'MISSING_MANDATORY_BINDING_FIELD', namespace: 'reason', source: 'Q16-CLOSE Q16-C' },
  {
    code: 'CROSS_FORMULA_REPORT_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q16-CLOSE Q16-F / Q15-C',
  },
  { code: 'ORGAN_SYSTEM_BINDING_MISMATCH', namespace: 'reason', source: 'Q07C-D07P-MICRO Q-D' },
  { code: 'ANATOMICAL_SITE_BINDING_MISMATCH', namespace: 'reason', source: 'Q07C-D07P-MICRO Q-D' },
  { code: 'PATHOLOGY_ID_BINDING_MISMATCH', namespace: 'reason', source: 'Q07C-D07P-MICRO Q-D' },
  {
    code: 'PATHOLOGY_PARENT_GROUP_MATCH_NOT_EXECUTABLE',
    namespace: 'reason',
    source: 'Q07C-D07P-MICRO Q-I / Phase 3 boundary',
  },
  { code: 'NEGATED_ASSERTION_EXCLUDED', namespace: 'reason', source: 'Q07C-D07P-MICRO Q-F' },
  { code: 'SUSPECTED_ASSERTION_EXCLUDED', namespace: 'reason', source: 'Q07C-CLOSE-D04' },
  { code: 'HISTORICAL_ONLY_EXCLUDED', namespace: 'reason', source: 'Q16-CLOSE Q16-G' },
  { code: 'AMBIGUOUS_ASSERTION_EXCLUDED', namespace: 'reason', source: 'Q07C-CLOSE-D04' },
  { code: 'FORMULA_RELEVANCE_NOT_DIRECT', namespace: 'reason', source: 'Q07C-CLOSE-D04' },
  { code: 'DATASET_TAXONOMY_SUPPORTING_ONLY', namespace: 'reason', source: 'Q07C-CLOSE-D08 D08-F' },
  { code: 'CONTRADICTORY_EVIDENCE', namespace: 'reason', source: 'Q15-CLOSE Q15-H' },
  {
    code: 'GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q16-CLOSE Q16-M / Q16-P',
  },
  { code: 'REPORT_KEYWORD_SELECTOR_BLOCKED', namespace: 'reason', source: 'Q16-CLOSE Q16-P' },
  { code: 'EVIDENCE_SUPERSEDED', namespace: 'reason', source: 'Q16-CLOSE Q16-G' },
  { code: 'INVALID_NOT_USABLE', namespace: 'reason', source: 'Q07C-CLOSE-D08 D08-H' },
  { code: 'CHIEF_COMPLAINT_SUPPORTING_ONLY', namespace: 'reason', source: 'Q16-CLOSE Q16-I' },
  {
    code: 'SUPERSESSION_TIMESTAMP_NOT_COMPARABLE',
    namespace: 'reason',
    source: 'Q16-CLOSE Q16-G Phase 3 supersession',
  },
];

export const RULE4_PHASE3_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'PHASE3_NO_POTENCY_CASCADE',
    namespace: 'limitation',
    source: 'Phase 3 evidence adapter',
  },
  {
    code: 'TIER4A_SUPPORTED_CANDIDATE_ONLY',
    namespace: 'limitation',
    source: 'Q07C-CLOSE-D08 D08-E',
  },
  {
    code: 'DATASET_TAXONOMY_SUPPORTING_ONLY',
    namespace: 'limitation',
    source: 'Q07C-CLOSE-D08 D08-F',
  },
  {
    code: 'TIER3_PATHOLOGY_MAPPING_DATA_ASSET_NOT_EXECUTABLE',
    namespace: 'limitation',
    source: 'Q07C-CLOSE-D14 / Phase 3 boundary',
  },
  {
    code: 'SUPERSESSION_SKIPPED_INVALID_TIMESTAMP',
    namespace: 'limitation',
    source: 'Q16-CLOSE Q16-G Phase 3 supersession',
  },
  {
    code: 'SUPERSESSION_SAME_TIMESTAMP_NO_CLINICAL_WINNER',
    namespace: 'limitation',
    source: 'Q16-CLOSE Q16-G Phase 3 supersession',
  },
];
