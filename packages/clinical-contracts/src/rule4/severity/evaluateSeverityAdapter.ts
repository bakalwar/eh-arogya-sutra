import { evaluateQuarantineProbe, validateQuarantineProbeShape } from '../evidence/quarantine.js';
import { RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY } from '../version.js';
import {
  applySeverityBindingGate,
  TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION,
  trustedSyntheticSeverityBindingBypassActive,
} from './bindingGate.js';
import { validateAssertionBoundTargetRoles } from './assertionBinding.js';
import { applyCrossRoleLeakageGuard } from './crossRoleLeakageGuard.js';
import { applyUpstreamContextBoundary } from './upstreamContextBoundary.js';
import { validateSeverityOutputCodes } from './severityCodeValidation.js';
import { fingerprintFromSeverityOutput } from './severityFingerprintV1.js';
import { resolveSeverityForSlot } from './resolveSlotSeverity.js';
import type {
  Rule4SeverityAdapterInput,
  Rule4SeverityAdapterOutput,
  Rule4SeverityEvaluationContext,
  Rule4SlotSeverityResolution,
} from './types.js';

export class Rule4SeverityAdapterValidationError extends Error {
  readonly code = 'RULE4_SEVERITY_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4SeverityAdapterValidationError';
  }
}

export function validateSeverityAdapterInput(input: Rule4SeverityAdapterInput): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY) {
    throw new Rule4SeverityAdapterValidationError(
      'contractVersion not supported for Phase 6 structured severity',
    );
  }
  if (!input.rulesetVersion || !input.registryVersion) {
    throw new Rule4SeverityAdapterValidationError('rulesetVersion and registryVersion required');
  }
  if (!Array.isArray(input.formulaSeverityRecords) || !Array.isArray(input.formulaSlotIds)) {
    throw new Rule4SeverityAdapterValidationError(
      'formulaSeverityRecords and formulaSlotIds required',
    );
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4SeverityAdapterValidationError('label must be SYNTHETIC or PRODUCTION');
  }
  if (input.trustedSyntheticBindingBypass === true && input.label !== 'SYNTHETIC') {
    throw new Rule4SeverityAdapterValidationError(
      'trustedSyntheticBindingBypass requires label SYNTHETIC',
    );
  }
  if (input.label === 'PRODUCTION' && input.trustedSyntheticBindingBypass === true) {
    throw new Rule4SeverityAdapterValidationError(
      'trustedSyntheticBindingBypass prohibited for PRODUCTION',
    );
  }
  validateQuarantineProbeShape(input.quarantineProbe);
  try {
    validateAssertionBoundTargetRoles(input.formulaSeverityRecords);
  } catch {
    throw new Rule4SeverityAdapterValidationError('RULE4_SEVERITY_BOUND_TARGET_ROLE_INVALID');
  }
}

function applySafetyGate(
  slots: Rule4SlotSeverityResolution[],
  context: Rule4SeverityEvaluationContext,
): Rule4SlotSeverityResolution[] {
  const sg = context.safetyGate;
  if (!sg?.patientWideHold && !sg?.d13HardStopActive) {
    return slots;
  }
  return slots.map((s) => ({
    ...s,
    severityStatus: 'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE',
    severityScore: null,
    severityBand: null,
    severityResolutionSource: 'NONE',
    reasonCodes: [
      ...new Set(['BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE', ...s.reasonCodes, ...sg.reasonCodes]),
    ].sort(),
    limitationCodes: [...new Set([...s.limitationCodes, ...sg.limitationCodes])].sort(),
  }));
}

export function evaluateSeverityAdapter(
  input: Rule4SeverityAdapterInput,
  context: Rule4SeverityEvaluationContext = {},
): Rule4SeverityAdapterOutput {
  validateSeverityAdapterInput(input);
  const bindingGateMandatory = context.bindingGateMandatory !== false;
  const quarantine = evaluateQuarantineProbe(input.quarantineProbe);

  const bySlot = new Map(input.formulaSeverityRecords.map((r) => [r.formulaSlotId, r]));
  let slots: Rule4SlotSeverityResolution[] = input.formulaSlotIds.map((id) => {
    const rec = bySlot.get(id);
    if (!rec) {
      return {
        formulaSlotId: id,
        formulaTargetId: null,
        targetRole: 'STANDARD_FORMULA_TARGET',
        severityStatus: 'TARGET_BINDING_MISSING',
        severityScore: null,
        severityBand: null,
        severityResolutionSource: 'NONE',
        bindingStatus: 'NOT_EVALUATED',
        evidenceItemIds: [],
        corroboratingSourceIds: [],
        selectedCascade: null,
        selectedDilution: null,
        reasonCodes: ['SEVERITY_VALUE_MISSING'],
        limitationCodes: ['PHASE6_NO_NUMERIC_CASCADE'],
        upstreamContextStatus: 'NOT_EVALUATED',
      };
    }
    return resolveSeverityForSlot(rec);
  });

  slots = applyCrossRoleLeakageGuard(slots, input.formulaSeverityRecords, input);
  slots = applySeverityBindingGate(slots, input, context.evidenceAdapter ?? null, {
    bindingGateMandatory,
  });
  slots = applyUpstreamContextBoundary(
    slots,
    context.polarityRouting ?? null,
    context.phaseResolution ?? null,
  );
  slots = applySafetyGate(slots, context);

  const reasonCodes = [...quarantine.reasonCodes, ...slots.flatMap((s) => s.reasonCodes)];
  let limitationCodes = [
    ...(quarantine.blocked ? ['PHASE6_NO_NUMERIC_CASCADE'] : []),
    ...slots.flatMap((s) => s.limitationCodes),
  ];
  if (
    !bindingGateMandatory &&
    trustedSyntheticSeverityBindingBypassActive(input) &&
    slots.some((s) =>
      s.limitationCodes.includes(TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION),
    )
  ) {
    limitationCodes = [...limitationCodes, TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION];
  }

  const core: Rule4SeverityAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    automaticSeverityRuntime: false,
    automaticFreeTextSeverityRuntime: false,
    automaticLabVitalSeverityRuntime: false,
    automaticPotencyRuntime: false,
    automaticPrescriptionIssuanceRuntime: false,
    prescriptionIssueAllowed: false,
    currentRuntimePotencyDelta: 'NONE',
    finalDoctorApprovalRequired: true,
    registryQ13SelectorStatus: 'NOT_EXECUTABLE_AS_Q13_SELECTOR',
    slotResolutions: slots,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
    deterministicSeverityResolutionFingerprint: '',
  };

  core.deterministicSeverityResolutionFingerprint = fingerprintFromSeverityOutput(core);
  validateSeverityOutputCodes(core);
  return core;
}
