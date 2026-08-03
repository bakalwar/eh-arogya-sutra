import { RULE4_CONTRACT_VERSION_PHASE4_POLARITY } from '../version.js';
import { evaluateQuarantineProbe, validateQuarantineProbeShape } from '../evidence/quarantine.js';
import {
  applyPolarityBindingGate,
  TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION,
  trustedSyntheticBindingBypassActive,
} from './bindingGate.js';
import { validatePolarityOutputCodes } from './polarityCodeValidation.js';
import { routePolarityForSlots } from './pathwayRouter.js';
import { fingerprintFromPolarityOutput } from './polarityFingerprintV1.js';
import type {
  Rule4PolarityAdapterInput,
  Rule4PolarityAdapterOutput,
  Rule4PolarityEvaluationContext,
  Rule4SlotPolarityRouting,
} from './types.js';

export class Rule4PolarityAdapterValidationError extends Error {
  readonly code = 'RULE4_POLARITY_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4PolarityAdapterValidationError';
  }
}

export function validatePolarityAdapterInput(input: Rule4PolarityAdapterInput): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE4_POLARITY) {
    throw new Rule4PolarityAdapterValidationError(
      'contractVersion not supported for Phase 4 polarity',
    );
  }
  if (!input.rulesetVersion || !input.registryVersion) {
    throw new Rule4PolarityAdapterValidationError('rulesetVersion and registryVersion required');
  }
  if (!Array.isArray(input.formulaPolarities) || !Array.isArray(input.formulaSlotIds)) {
    throw new Rule4PolarityAdapterValidationError('formulaPolarities and formulaSlotIds required');
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4PolarityAdapterValidationError('label must be SYNTHETIC or PRODUCTION');
  }
  if (input.trustedSyntheticBindingBypass === true) {
    if (input.label !== 'SYNTHETIC') {
      throw new Rule4PolarityAdapterValidationError(
        'trustedSyntheticBindingBypass requires label SYNTHETIC',
      );
    }
  }
  if (input.label === 'PRODUCTION' && input.trustedSyntheticBindingBypass === true) {
    throw new Rule4PolarityAdapterValidationError(
      'trustedSyntheticBindingBypass prohibited for PRODUCTION',
    );
  }
  if (input.casePolaritySummary?.mustNotDriveSelection === false) {
    throw new Rule4PolarityAdapterValidationError('casePolaritySummary must not drive selection');
  }
  validateQuarantineProbeShape(input.quarantineProbe);
}

function applySafetyGate(
  routings: Rule4SlotPolarityRouting[],
  context: Rule4PolarityEvaluationContext,
): Rule4SlotPolarityRouting[] {
  const sg = context.safetyGate;
  if (!sg) {
    return routings;
  }
  if (sg.patientWideHold || sg.d13HardStopActive) {
    return routings.map((r) => ({
      ...r,
      pathway: 'BLOCKED_BY_SAFETY_GATE',
      potencyStatus: 'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE',
      reasonCodes: [
        ...new Set(['BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE', ...r.reasonCodes, ...sg.reasonCodes]),
      ],
      limitationCodes: [...new Set([...r.limitationCodes, ...sg.limitationCodes])],
    }));
  }
  return routings;
}

export function evaluatePolarityAdapter(
  input: Rule4PolarityAdapterInput,
  context: Rule4PolarityEvaluationContext = {},
): Rule4PolarityAdapterOutput {
  validatePolarityAdapterInput(input);

  const bindingGateMandatory = context.bindingGateMandatory !== false;
  const quarantine = evaluateQuarantineProbe(input.quarantineProbe);
  let routings = routePolarityForSlots(input.formulaSlotIds, input.formulaPolarities);
  routings = applySafetyGate(routings, context);
  routings = applyPolarityBindingGate(routings, input, context.evidenceAdapter ?? null, {
    bindingGateMandatory,
  });

  const reasonCodes = [...quarantine.reasonCodes, ...routings.flatMap((r) => r.reasonCodes)];
  let limitationCodes = [
    ...(quarantine.blocked ? ['PHASE4_NO_NUMERIC_CASCADE'] : []),
    ...routings.flatMap((r) => r.limitationCodes),
  ];
  if (
    !bindingGateMandatory &&
    trustedSyntheticBindingBypassActive(input) &&
    routings.some((r) => r.limitationCodes.includes(TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION))
  ) {
    limitationCodes = [...limitationCodes, TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION];
  }

  const core: Rule4PolarityAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    currentRuntimePotencyDelta: 'NONE',
    slotRoutings: routings,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
    deterministicPolarityRoutingFingerprint: '',
  };

  core.deterministicPolarityRoutingFingerprint = fingerprintFromPolarityOutput(core);
  validatePolarityOutputCodes(core);
  return core;
}
