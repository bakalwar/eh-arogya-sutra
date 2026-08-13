export {
  RULE9_APPLICABILITY_STATES,
  RULE9_COMPLEXITY_APPROVAL_TOKEN,
  RULE9_COMPLEXITY_APPROVED_KEY_ORDER,
  RULE9_COMPLEXITY_NONSUCCESS_STATUSES,
  RULE9_COMPLEXITY_TIERS,
  RULE9_COUNT_VALIDATION_STATES,
  RULE9_FAILURE_CODES,
  RULE9_INPUT_KEY_ORDER,
  RULE9_MIXTURE_KEY_ORDER,
  RULE9_OUTCOMES,
  RULE9_OUTPUT_KEY_ORDER,
  RULE9_PACKAGE_KEY_ORDER,
  RULE9_PRODUCTION_MAPPING_REGISTRY,
  RULE9_REASON_CODES,
  RULE9_RULE_IDENTITIES,
  RULE9_TIER_TO_COUNT,
} from './constants.js';
export type {
  Rule9ComplexityTier,
  Rule9CountValidationState,
  Rule9FailureCode,
  Rule9Outcome,
} from './constants.js';
export { Rule9EvaluationError } from './errors.js';
export { evaluateRule9Shadow } from './evaluate.js';
export type {
  Rule9ComplexityTierRef,
  Rule9Input,
  Rule9OralMixture,
  Rule9Output,
  Rule9ProposedOralComposition,
  Rule9RuleEnvelope,
  Rule9ShadowPackage,
  Rule9UpstreamApplicability,
  Rule9UpstreamRuleState,
} from './types.js';
export {
  RULE9_CONTRACT_DOCUMENT_VERSION,
  RULE9_DISPLAY_TITLE,
  RULE9_INPUT_CONTRACT_VERSION,
  RULE9_ORCHESTRATION_STATUS,
  RULE9_OUTPUT_CONTRACT_VERSION,
  RULE9_PRESCRIPTION_EFFECT,
  RULE9_RULE_IDENTITY,
  RULE9_RULE_NUMBER,
  RULE9_RUNTIME_STATUS,
} from './version.js';
