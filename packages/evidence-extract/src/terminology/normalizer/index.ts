export {
  F3D2D2_DETERMINISTIC_NORMALIZER_FOUNDATION,
  F3D2D2_PERSISTENCE_CONNECTED,
  F3D2D2_PRODUCTION_WRITER_CONNECTED,
  FACT_NORMALIZER_METHOD,
  FACT_NORMALIZER_VERSION,
  FACT_NORMALIZATION_IDENTITY_CANONICALIZATION,
  MAX_NORMALIZER_DRAFTS,
  MAX_DRAFT_CUE_ENTRY_IDS,
  NORMALIZER_CUE_SOURCE_COMBINATIONS,
  NORMALIZER_STRUCTURED_VITAL_FIELDS,
  NORMALIZER_FAILURE_CODES,
  NORMALIZER_FORBIDDEN_INPUT_KEYS,
} from './types.js';
export type {
  FactNormalizationDraft,
  NormalizeSourceLinkedFactInput,
  NormalizeCueResultInput,
  NormalizeStructuredUnitInput,
  NormalizeSourceLinkedFactResult,
  NormalizeSourceLinkedFactSuccess,
  NormalizeSourceLinkedFactFailure,
  NormalizerFailureCode,
  NormalizerSuccessReason,
  NormalizerStructuredVitalField,
  NormalizerUnitPosture,
} from './types.js';
export {
  computeNormalizerFingerprint,
  computeNormalizationIdentityFingerprint,
} from './canonical.js';
export { normalizeSourceLinkedFact } from './normalize.js';
