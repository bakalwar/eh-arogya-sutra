import { RULE4_CONTRACT_VERSION_PHASE9_PEDIATRIC_OVERLAY } from '../version.js';
import { fingerprintFromPediatricOverlayOutput } from './pediatricOverlayFingerprintV1.js';
import { resolveSlotPediatricOverlay } from './resolveSlotPediatricOverlay.js';
import { validatePediatricOverlayOutputCodes } from './overlayCodeValidation.js';
import type {
  Rule4PediatricOverlayAdapterInput,
  Rule4PediatricOverlayAdapterOutput,
  Rule4PediatricOverlayEvaluationContext,
} from './types.js';

export class Rule4PediatricOverlayAdapterValidationError extends Error {
  readonly code = 'RULE4_PEDIATRIC_OVERLAY_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4PediatricOverlayAdapterValidationError';
  }
}

export function validatePediatricOverlayAdapterInput(
  input: Rule4PediatricOverlayAdapterInput,
): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE9_PEDIATRIC_OVERLAY) {
    throw new Rule4PediatricOverlayAdapterValidationError(
      'contractVersion not supported for Phase 9 pediatric overlay',
    );
  }
  if (!input.rulesetVersion || !input.registryVersion) {
    throw new Rule4PediatricOverlayAdapterValidationError(
      'rulesetVersion and registryVersion required',
    );
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4PediatricOverlayAdapterValidationError('label must be SYNTHETIC or PRODUCTION');
  }
}

export function evaluatePediatricOverlayAdapter(
  input: Rule4PediatricOverlayAdapterInput,
  context: Rule4PediatricOverlayEvaluationContext = {},
): Rule4PediatricOverlayAdapterOutput {
  validatePediatricOverlayAdapterInput(input);
  const bySlot = new Map(input.slotOverlayRecords.map((r) => [r.formulaSlotId, r]));
  const meta = { rulesetVersion: input.rulesetVersion, registryVersion: input.registryVersion };

  const slotResolutions = input.formulaSlotIds.map((id) =>
    resolveSlotPediatricOverlay(bySlot.get(id), id, input.label, context, meta),
  );

  const reasonCodes = [
    'PEDIATRIC_OVERLAY_SHADOW_DRAFT_ONLY',
    'PEDIATRIC_OVERLAY_NOT_PRESCRIPTION_ISSUANCE',
    ...slotResolutions.flatMap((s) => s.reasonCodes),
    ...(input.label === 'PRODUCTION' ? ['PRODUCTION_PEDIATRIC_OVERLAY_NOT_EVALUATED'] : []),
  ];

  const limitationCodes = [
    'SHADOW_PEDIATRIC_DRAFT_OVERLAY_ONLY',
    ...slotResolutions.flatMap((s) => s.limitationCodes),
  ];

  const safetyFlags = {
    d13HsActive: Boolean(context.safetyGate?.d13HardStopActive),
    patientWideHold: Boolean(context.safetyGate?.patientWideHold),
    urgentEscalationRequired: Boolean(context.safetyGate?.urgentEscalationRequired),
  };

  const core: Rule4PediatricOverlayAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    automaticPediatricOverlayRuntime: false,
    automaticPrescriptionIssuanceRuntime: false,
    prescriptionIssueAllowed: false,
    finalDoctorApprovalRequired: true,
    currentRuntimePotencyDelta: 'NONE',
    slotResolutions,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
    deterministicPediatricOverlayFingerprint: '',
  };

  validatePediatricOverlayOutputCodes(core);

  const fp = fingerprintFromPediatricOverlayOutput(core, safetyFlags);
  return { ...core, deterministicPediatricOverlayFingerprint: fp };
}
