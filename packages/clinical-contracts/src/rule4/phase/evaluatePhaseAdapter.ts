import { evaluateQuarantineProbe, validateQuarantineProbeShape } from '../evidence/quarantine.js';
import { RULE4_CONTRACT_VERSION_PHASE5_STRUCTURED_PHASE } from '../version.js';
import {
  applyPhaseBindingGate,
  applyPolarityContradictionBlock,
  TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION,
  trustedSyntheticPhaseBindingBypassActive,
} from './bindingGate.js';
import { validatePhaseOutputCodes } from './phaseCodeValidation.js';
import { fingerprintFromPhaseOutput } from './phaseFingerprintV1.js';
import { resolvePhaseForSlot } from './resolveSlotPhase.js';
import type {
  Rule4PhaseAdapterInput,
  Rule4PhaseAdapterOutput,
  Rule4PhaseEvaluationContext,
  Rule4SlotPhaseResolution,
} from './types.js';

export class Rule4PhaseAdapterValidationError extends Error {
  readonly code = 'RULE4_PHASE_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4PhaseAdapterValidationError';
  }
}

export function validatePhaseAdapterInput(input: Rule4PhaseAdapterInput): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE5_STRUCTURED_PHASE) {
    throw new Rule4PhaseAdapterValidationError(
      'contractVersion not supported for Phase 5 structured phase',
    );
  }
  if (!input.rulesetVersion || !input.registryVersion) {
    throw new Rule4PhaseAdapterValidationError('rulesetVersion and registryVersion required');
  }
  if (!Array.isArray(input.formulaPhaseRecords) || !Array.isArray(input.formulaSlotIds)) {
    throw new Rule4PhaseAdapterValidationError('formulaPhaseRecords and formulaSlotIds required');
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4PhaseAdapterValidationError('label must be SYNTHETIC or PRODUCTION');
  }
  if (input.trustedSyntheticBindingBypass === true && input.label !== 'SYNTHETIC') {
    throw new Rule4PhaseAdapterValidationError(
      'trustedSyntheticBindingBypass requires label SYNTHETIC',
    );
  }
  if (input.label === 'PRODUCTION' && input.trustedSyntheticBindingBypass === true) {
    throw new Rule4PhaseAdapterValidationError(
      'trustedSyntheticBindingBypass prohibited for PRODUCTION',
    );
  }
  validateQuarantineProbeShape(input.quarantineProbe);
}

function applySafetyGate(
  slots: Rule4SlotPhaseResolution[],
  context: Rule4PhaseEvaluationContext,
): Rule4SlotPhaseResolution[] {
  const sg = context.safetyGate;
  if (!sg?.patientWideHold && !sg?.d13HardStopActive) {
    return slots;
  }
  return slots.map((s) => ({
    ...s,
    phaseStatus: 'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE',
    resolvedPhase: null,
    phaseResolutionSource: 'NONE',
    reasonCodes: [
      ...new Set(['BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE', ...s.reasonCodes, ...sg.reasonCodes]),
    ].sort(),
    limitationCodes: [...new Set([...s.limitationCodes, ...sg.limitationCodes])].sort(),
  }));
}

export function evaluatePhaseAdapter(
  input: Rule4PhaseAdapterInput,
  context: Rule4PhaseEvaluationContext = {},
): Rule4PhaseAdapterOutput {
  validatePhaseAdapterInput(input);
  const bindingGateMandatory = context.bindingGateMandatory !== false;
  const quarantine = evaluateQuarantineProbe(input.quarantineProbe);

  const bySlot = new Map(input.formulaPhaseRecords.map((r) => [r.formulaSlotId, r]));
  let slots: Rule4SlotPhaseResolution[] = input.formulaSlotIds.map((id) => {
    const rec = bySlot.get(id);
    if (!rec) {
      return {
        formulaSlotId: id,
        formulaTargetId: null,
        phaseStatus: 'TARGET_BINDING_MISSING',
        resolvedPhase: null,
        phaseResolutionSource: 'NONE',
        calculatedDurationDays: null,
        suppliedDurationDays: null,
        durationConsistencyStatus: 'NONE',
        baselinePhase: null,
        currentManifestationPhase: null,
        targetRole: 'STANDARD_FORMULA_TARGET',
        flareStatus: 'NOT_APPLICABLE',
        evidenceItemIds: [],
        selectedCascade: null,
        selectedDilution: null,
        reasonCodes: ['PHASE_EVIDENCE_MISSING'],
        limitationCodes: ['PHASE5_NO_NUMERIC_CASCADE'],
      };
    }
    return resolvePhaseForSlot(rec);
  });

  slots = applyPhaseBindingGate(
    slots,
    input,
    context.evidenceAdapter ?? null,
    context.polarityRouting ?? null,
    { bindingGateMandatory },
  );
  slots = applyPolarityContradictionBlock(slots, context.polarityRouting ?? null);
  slots = applySafetyGate(slots, context);

  const reasonCodes = [...quarantine.reasonCodes, ...slots.flatMap((s) => s.reasonCodes)];
  let limitationCodes = [
    ...(quarantine.blocked ? ['PHASE5_NO_NUMERIC_CASCADE'] : []),
    ...slots.flatMap((s) => s.limitationCodes),
  ];
  if (
    !bindingGateMandatory &&
    trustedSyntheticPhaseBindingBypassActive(input) &&
    slots.some((s) => s.limitationCodes.includes(TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION))
  ) {
    limitationCodes = [...limitationCodes, TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION];
  }

  const core: Rule4PhaseAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    automaticPhaseRuntime: false,
    automaticFlareSplitRuntime: false,
    automaticPotencyRuntime: false,
    automaticPrescriptionIssuanceRuntime: false,
    prescriptionIssueAllowed: false,
    currentRuntimePotencyDelta: 'NONE',
    finalDoctorApprovalRequired: true,
    slotResolutions: slots,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
    deterministicPhaseResolutionFingerprint: '',
  };

  core.deterministicPhaseResolutionFingerprint = fingerprintFromPhaseOutput(core);
  validatePhaseOutputCodes(core);
  return core;
}
