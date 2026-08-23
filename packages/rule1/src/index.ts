export {
  RULE1_BP_LYMPHATIC_SYSTOLIC_MAX_EXCLUSIVE,
  RULE1_BP_LYMPHATIC_WEIGHT,
  RULE1_BP_SANGUINE_SYSTOLIC_MIN,
  RULE1_BP_SANGUINE_WEIGHT,
  RULE1_FAILURE_CODES,
  RULE1_FORBIDDEN_OUTPUT_TOKENS,
  RULE1_INPUT_KEY_ORDER,
  RULE1_MIXED_SUBTYPES,
  RULE1_OUTPUT_KEY_ORDER,
  RULE1_PRIMARY_TEMPERAMENTS,
  RULE1_PRODUCTION_MAPPING_REGISTRY,
  RULE1_PROFILE_STATUSES,
  RULE1_REASON_CODES,
  RULE1_REPRESENTATION_ORDER,
} from './constants.js';
export type {
  Rule1FailureCode,
  Rule1MixedSubtype,
  Rule1PrimaryTemperament,
  Rule1ProfileStatus,
} from './constants.js';

export {
  RULE1_OWNER_APPROVED_FEATURE_CATALOG,
  catalogFingerprintMaterial,
  countCatalogByTemperament,
  getCatalogEntry,
} from './catalog.js';
export type { Rule1CatalogEntry, Rule1EvidenceKind, Rule1ThermalAxis } from './catalog.js';

export { Rule1EvaluationError } from './errors.js';
export { evaluateRule1Shadow } from './evaluate.js';
export { computeHamiltonPercentages, sumPercentages } from './hamilton.js';
export { computeCatalogFingerprint } from './fingerprint.js';
export { validateRule1Input } from './validateInput.js';

export type {
  Rule1AcceptedContribution,
  Rule1EvidenceBinding,
  Rule1ExcludedEvidence,
  Rule1Input,
  Rule1Output,
  Rule1PercentageMap,
  Rule1RankedPercentageEntry,
  Rule1ScoreMap,
  Rule1StructuredVitals,
  Rule1SystolicBpVital,
} from './types.js';

export {
  RULE1_CATALOG_VERSION,
  RULE1_CONTRACT_DOCUMENT_VERSION,
  RULE1_DISPLAY_TITLE,
  RULE1_INPUT_CONTRACT_VERSION,
  RULE1_INPUT_SCHEMA_VERSION,
  RULE1_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION,
  RULE1_ORCHESTRATION_STATUS,
  RULE1_OUTPUT_CONTRACT_VERSION,
  RULE1_PERCENTAGE_ALGORITHM,
  RULE1_PRESCRIPTION_EFFECT,
  RULE1_RULE_CONTRACT_VERSION,
  RULE1_RULE_IDENTITY,
  RULE1_RULE_NUMBER,
  RULE1_RUNTIME_STATUS,
  RULE1_SCORING_ALGORITHM_VERSION,
} from './version.js';
