export {
  evaluateSeverityAdapter,
  Rule4SeverityAdapterValidationError,
  validateSeverityAdapterInput,
} from './evaluateSeverityAdapter.js';
export { applyCrossRoleLeakageGuard } from './crossRoleLeakageGuard.js';
export { resolveAssertionBinding, validateAssertionBoundTargetRoles } from './assertionBinding.js';
export { applyUpstreamContextBoundary } from './upstreamContextBoundary.js';
export {
  applySeverityBindingGate,
  TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION,
  trustedSyntheticSeverityBindingBypassActive,
} from './bindingGate.js';
export { resolveSeverityForSlot } from './resolveSlotSeverity.js';
export {
  fingerprintFromSeverityOutput,
  rule4SeverityResolutionFingerprintV1Hash,
  rule4SeverityResolutionFingerprintV1Payload,
  RULE4_SEVERITY_RESOLUTION_FINGERPRINT_V1,
} from './severityFingerprintV1.js';
export { validateSeverityOutputCodes } from './severityCodeValidation.js';
export {
  bandFromScore,
  bandsMatch,
  isValidBand,
  isValidIntegerScore,
  RULE4_SEVERITY_BAND_VALUES,
} from './severityScale.js';
export type {
  Rule4FormulaSeverityRecord,
  Rule4SeverityAdapterInput,
  Rule4SeverityAdapterOutput,
  Rule4SeverityEvaluationContext,
  Rule4SeverityEvidenceAssertion,
  Rule4SeverityEvidenceSourceTier,
  Rule4SeverityResolutionSource,
  Rule4SeverityStatus,
  Rule4SlotSeverityResolution,
} from './types.js';
export {
  RULE4_SEVERITY_EVIDENCE_SOURCE_TIER_VALUES,
  RULE4_SEVERITY_RESOLUTION_SOURCE_VALUES,
  RULE4_SEVERITY_STATUS_VALUES,
} from './types.js';
