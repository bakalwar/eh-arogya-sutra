/** Rule 1 v1 synthetic-shadow contract versions (owner-frozen implementation boundary). */
export const RULE1_INPUT_SCHEMA_VERSION = 'rule1-synthetic-shadow-input-v1' as const;
export const RULE1_RULE_CONTRACT_VERSION = 'rule1-temperament-contract-v1' as const;
export const RULE1_PERCENTAGE_ALGORITHM = 'RULE1_PERCENTAGE_HAMILTON_V1' as const;
export const RULE1_CATALOG_VERSION = 'rule1-owner-approved-feature-catalog-v1' as const;
export const RULE1_SCORING_ALGORITHM_VERSION = 'rule1-v1-synthetic-shadow-scoring-v1' as const;

export const RULE1_RULE_NUMBER = 1 as const;
export const RULE1_RULE_IDENTITY = 'TEMPERAMENT_ENGINE' as const;
export const RULE1_DISPLAY_TITLE = 'Temperament Engine' as const;

/** Package posture — not clinical activation. */
export const RULE1_ORCHESTRATION_STATUS = 'NOT_CONNECTED' as const;
export const RULE1_RUNTIME_STATUS = 'NOT_CONNECTED' as const;
export const RULE1_PRESCRIPTION_EFFECT = 'NONE' as const;
export const RULE1_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION = true as const;

/** Legacy export aliases retained for package meta only (not v1 evaluator I/O). */
export const RULE1_CONTRACT_DOCUMENT_VERSION = RULE1_RULE_CONTRACT_VERSION;
export const RULE1_INPUT_CONTRACT_VERSION = RULE1_INPUT_SCHEMA_VERSION;
export const RULE1_OUTPUT_CONTRACT_VERSION = 'rule1-synthetic-shadow-output-v1' as const;
