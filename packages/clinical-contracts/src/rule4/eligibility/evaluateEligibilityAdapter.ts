import { evaluateQuarantineProbe, validateQuarantineProbeShape } from '../evidence/quarantine.js';
import { RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY } from '../version.js';
import { validateEligibilityOutputCodes } from './eligibilityCodeValidation.js';
import { fingerprintFromEligibilityOutput } from './eligibilityFingerprintV1.js';
import { resolveSlotEligibility } from './resolveSlotEligibility.js';
import type {
  Rule4EligibilityAdapterInput,
  Rule4EligibilityAdapterOutput,
  Rule4EligibilityEvaluationContext,
} from './types.js';

export class Rule4EligibilityAdapterValidationError extends Error {
  readonly code = 'RULE4_ELIGIBILITY_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4EligibilityAdapterValidationError';
  }
}

export function validateEligibilityAdapterInput(input: Rule4EligibilityAdapterInput): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY) {
    throw new Rule4EligibilityAdapterValidationError(
      'contractVersion not supported for Phase 7 candidate eligibility',
    );
  }
  if (!input.rulesetVersion || !input.registryVersion) {
    throw new Rule4EligibilityAdapterValidationError('rulesetVersion and registryVersion required');
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4EligibilityAdapterValidationError('label must be SYNTHETIC or PRODUCTION');
  }
  if (input.trustedSyntheticEligibilityBypass === true && input.label !== 'SYNTHETIC') {
    throw new Rule4EligibilityAdapterValidationError(
      'trustedSyntheticEligibilityBypass requires label SYNTHETIC',
    );
  }
  validateQuarantineProbeShape(input.quarantineProbe);
}

export function evaluateEligibilityAdapter(
  input: Rule4EligibilityAdapterInput,
  context: Rule4EligibilityEvaluationContext = {},
): Rule4EligibilityAdapterOutput {
  validateEligibilityAdapterInput(input);
  const quarantine = evaluateQuarantineProbe(input.quarantineProbe);
  const bySlot = new Map(input.formulaEligibilityRecords.map((r) => [r.formulaSlotId, r]));

  const slotResolutions = input.formulaSlotIds.map((id) =>
    resolveSlotEligibility(bySlot.get(id), id, input, context),
  );

  const reasonCodes = [
    ...quarantine.reasonCodes,
    ...slotResolutions.flatMap((s) => s.reasonCodes),
    'ELIGIBILITY_ALONE_NOT_A_POTENCY_SELECTOR',
    'FAMILY_ELIGIBILITY_NOT_NUMERIC_SELECTION',
    ...(input.label === 'PRODUCTION' ? ['PRODUCTION_ELIGIBILITY_STRUCTURED_INPUT_REQUIRED'] : []),
  ];

  const limitationCodes = [
    ...(quarantine.blocked ? ['PHASE7_NO_NUMERIC_SELECTION'] : []),
    ...slotResolutions.flatMap((s) => s.limitationCodes),
    'PHASE7_NO_NUMERIC_SELECTION',
    'PHASE8_TEMPERAMENT_TIE_BREAK_DEFERRED',
    ...(input.label === 'SYNTHETIC' && input.trustedSyntheticEligibilityBypass
      ? ['TRUSTED_SYNTHETIC_ELIGIBILITY_BYPASS_TEST_ONLY']
      : []),
  ];

  const core: Rule4EligibilityAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    automaticPotencyRuntime: false,
    automaticPrescriptionIssuanceRuntime: false,
    prescriptionIssueAllowed: false,
    currentRuntimePotencyDelta: 'NONE',
    finalDoctorApprovalRequired: true,
    selectionStatus: 'NOT_STARTED',
    slotResolutions,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
    deterministicCandidateEligibilityFingerprint: '',
  };

  core.deterministicCandidateEligibilityFingerprint = fingerprintFromEligibilityOutput(core);
  validateEligibilityOutputCodes(core);
  return core;
}
