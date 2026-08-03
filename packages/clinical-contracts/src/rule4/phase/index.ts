export * from './types.js';
export { inclusiveDurationDays, isValidPositiveIntegerDuration } from './durationCalendar.js';
export { fallbackPhaseFromDurationDays } from './dayBands.js';
export { resolvePhaseForSlot } from './resolveSlotPhase.js';
export {
  applyPhaseBindingGate,
  applyPolarityContradictionBlock,
  TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION,
  trustedSyntheticPhaseBindingBypassActive,
} from './bindingGate.js';
export {
  RULE4_PHASE_RESOLUTION_FINGERPRINT_V1,
  buildRule4PhaseResolutionFingerprintV1Payload,
  fingerprintFromPhaseOutput,
  rule4PhaseResolutionFingerprintV1Hash,
} from './phaseFingerprintV1.js';
export { validatePhaseOutputCodes } from './phaseCodeValidation.js';
export {
  evaluatePhaseAdapter,
  Rule4PhaseAdapterValidationError,
  validatePhaseAdapterInput,
} from './evaluatePhaseAdapter.js';
