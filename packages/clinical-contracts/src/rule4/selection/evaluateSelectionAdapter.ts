import { evaluateQuarantineProbe, validateQuarantineProbeShape } from '../evidence/quarantine.js';
import { fingerprintFromEligibilityOutput } from '../eligibility/eligibilityFingerprintV1.js';
import { RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION } from '../version.js';
import { fingerprintFromSelectionOutput } from './selectionFingerprintV1.js';
import { validateSelectionOutputCodes } from './selectionCodeValidation.js';
import { resolveSlotSelection } from './resolveSlotSelection.js';
import type {
  Rule4SelectionAdapterInput,
  Rule4SelectionAdapterOutput,
  Rule4SelectionEvaluationContext,
} from './types.js';

export class Rule4SelectionAdapterValidationError extends Error {
  readonly code = 'RULE4_SELECTION_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4SelectionAdapterValidationError';
  }
}

export function validateSelectionAdapterInput(input: Rule4SelectionAdapterInput): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION) {
    throw new Rule4SelectionAdapterValidationError(
      'contractVersion not supported for Phase 8 numeric selection',
    );
  }
  if (!input.rulesetVersion || !input.registryVersion) {
    throw new Rule4SelectionAdapterValidationError('rulesetVersion and registryVersion required');
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4SelectionAdapterValidationError('label must be SYNTHETIC or PRODUCTION');
  }
  if (input.trustedSyntheticSelectionBypass === true && input.label !== 'SYNTHETIC') {
    throw new Rule4SelectionAdapterValidationError(
      'trustedSyntheticSelectionBypass requires label SYNTHETIC',
    );
  }
  validateQuarantineProbeShape(input.quarantineProbe);
}

export function evaluateSelectionAdapter(
  input: Rule4SelectionAdapterInput,
  context: Rule4SelectionEvaluationContext = {},
): Rule4SelectionAdapterOutput {
  validateSelectionAdapterInput(input);
  const quarantine = evaluateQuarantineProbe(input.quarantineProbe);
  const bySlot = new Map(input.slotSelectionRecords.map((r) => [r.formulaSlotId, r]));

  const slotResolutions = input.formulaSlotIds.map((id) =>
    resolveSlotSelection(bySlot.get(id), id, input, context),
  );

  const upstreamFp = context.eligibilityResolution
    ? fingerprintFromEligibilityOutput(context.eligibilityResolution)
    : null;

  const reasonCodes = [
    ...quarantine.reasonCodes,
    ...slotResolutions.flatMap((s) => s.reasonCodes),
    'NUMERIC_SELECTION_SHADOW_DRAFT_ONLY',
    'SELECTION_NOT_PRESCRIPTION_ISSUANCE',
    ...(input.label === 'PRODUCTION' ? ['PRODUCTION_SELECTION_UPSTREAM_CHAIN_NOT_CONNECTED'] : []),
  ];

  const limitationCodes = [
    ...(quarantine.blocked ? ['SHADOW_DRAFT_NUMERIC_SELECTION_ONLY'] : []),
    ...slotResolutions.flatMap((s) => s.limitationCodes),
    'SHADOW_DRAFT_NUMERIC_SELECTION_ONLY',
    ...(input.label === 'SYNTHETIC' && input.trustedSyntheticSelectionBypass
      ? ['TRUSTED_SYNTHETIC_SELECTION_BYPASS_TEST_ONLY']
      : []),
  ];

  const core: Rule4SelectionAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    automaticNumericPotencyRuntime: false,
    automaticPrescriptionIssuanceRuntime: false,
    prescriptionIssueAllowed: false,
    finalDoctorApprovalRequired: true,
    currentRuntimePotencyDelta: 'NONE',
    slotResolutions,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
    deterministicNumericSelectionFingerprint: '',
  };

  core.deterministicNumericSelectionFingerprint = fingerprintFromSelectionOutput(core, upstreamFp);
  validateSelectionOutputCodes(core);
  return core;
}
