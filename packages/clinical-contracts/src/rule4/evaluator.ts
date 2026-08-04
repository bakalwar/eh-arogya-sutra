import { rule4EmptyResultFingerprintV1Hash } from './emptyResultFingerprintV1.js';
import { rule4Fingerprint } from './fingerprint.js';

import type { Rule4InputContract } from './input.js';
import {
  isRule4Phase2SafetyContract,
  toPhase2VerifiedAge,
  validateRule4InputContract,
} from './input.js';
import type { Rule4Result, Rule4SafetyGateOutput, Rule4SlotResult } from './output.js';
import { validateRule4OutputCodes } from './outputCodeValidation.js';
import { evaluateRule4SafetyGate } from './safety/evaluateSafetyGate.js';
import { evaluateEvidenceAdapter } from './evidence/evaluateEvidenceAdapter.js';
import type { Rule4EvidenceAdapterOutput } from './evidence/types.js';
import { evaluatePolarityAdapter } from './polarity/evaluatePolarityAdapter.js';
import type { Rule4PolarityAdapterOutput } from './polarity/types.js';
import { evaluatePhaseAdapter } from './phase/evaluatePhaseAdapter.js';
import type { Rule4PhaseAdapterOutput } from './phase/types.js';
import { evaluateSeverityAdapter } from './severity/evaluateSeverityAdapter.js';
import type { Rule4SeverityAdapterOutput } from './severity/types.js';
import { evaluateEligibilityAdapter } from './eligibility/evaluateEligibilityAdapter.js';
import type { Rule4EligibilityAdapterOutput } from './eligibility/types.js';
import { evaluateSelectionAdapter } from './selection/evaluateSelectionAdapter.js';
import type { Rule4SelectionAdapterOutput } from './selection/types.js';
import { evaluatePediatricOverlayAdapter } from './pediatricOverlay/evaluatePediatricOverlayAdapter.js';
import type { Rule4PediatricOverlayAdapterOutput } from './pediatricOverlay/types.js';
import { evaluateDoctorReviewAdapter } from './doctorReview/evaluateDoctorReviewAdapter.js';
import type { Rule4DoctorReviewAdapterOutput } from './doctorReview/types.js';
import {
  RULE4_CONTRACT_VERSION,
  RULE4_CONTRACT_VERSION_PHASE2,
  RULE4_DEFAULT_ENGINE_MODE,
  type Rule4EngineMode,
  type Rule4PotencyStatus,
} from './version.js';

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => (v === undefined ? null : v));
}

/** Phase 1 only — input serialization is not canonical cross-language. */
function fingerprintPhase1Result(body: Record<string, unknown>): string {
  return rule4Fingerprint(body);
}

export function parseRule4EngineMode(raw: string | null | undefined): Rule4EngineMode {
  if (raw === undefined || raw === null || raw.trim() === '') {
    return RULE4_DEFAULT_ENGINE_MODE;
  }
  const v = raw.trim().toLowerCase();
  if (v === 'off' || v === 'shadow' || v === 'active') {
    return v;
  }
  throw new Error('RULE4_ENGINE_MODE_INVALID');
}

function mapSafetyGateOutput(
  safety: ReturnType<typeof evaluateRule4SafetyGate>,
): Rule4SafetyGateOutput {
  return {
    safetyGateStatus: safety.safetyGateStatus,
    safetyStatus: safety.safetyStatus,
    prescriptionStatus: safety.prescriptionStatus,
    holdStatus: safety.holdStatus,
    patientWideHold: safety.patientWideHold,
    urgentEscalationRequired: safety.urgentEscalationRequired,
    analysisStatus: safety.analysisStatus,
    clinicalPrescriptionSummary: safety.clinicalPrescriptionSummary,
    d13HardStopActive: safety.d13HardStopActive,
    safetyNoticeKey: safety.safetyNoticeKey,
    safetyClearForFutureCascade: safety.safetyClearForFutureCascade,
    deterministicSafetyFingerprint: safety.deterministicSafetyFingerprint,
    reasonCodes: safety.reasonCodes,
    limitationCodes: safety.limitationCodes,
    ageVerificationStatus: safety.ageResolution.verificationStatus,
    pediatricBand: safety.ageResolution.pediatricBand,
  };
}

function slotOutcomeFromSafety(
  safety: ReturnType<typeof evaluateRule4SafetyGate>,
): Pick<Rule4SlotResult, 'potencyStatus' | 'reasonCodes' | 'limitationCodes'> {
  if (safety.patientWideHold || safety.d13HardStopActive) {
    return {
      potencyStatus: 'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE',
      reasonCodes: ['BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE', ...safety.reasonCodes],
      limitationCodes: safety.limitationCodes,
    };
  }
  if (
    safety.ageResolution.verificationStatus === 'MISSING' ||
    safety.ageResolution.verificationStatus === 'INVALID' ||
    safety.ageResolution.verificationStatus === 'CONTRADICTORY' ||
    safety.ageResolution.verificationStatus === 'UNRESOLVED'
  ) {
    return {
      potencyStatus: 'UNRESOLVED',
      reasonCodes: [...new Set([...safety.ageResolution.reasonCodes, ...safety.reasonCodes])],
      limitationCodes: safety.limitationCodes,
    };
  }
  if (safety.safetyClearForFutureCascade) {
    return {
      potencyStatus: 'NOT_EVALUATED',
      reasonCodes: ['RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED', ...safety.reasonCodes],
      limitationCodes: ['PHASE1_NO_CLINICAL_EVALUATION', ...safety.limitationCodes],
    };
  }
  return {
    potencyStatus: 'UNRESOLVED',
    reasonCodes: [...new Set(safety.reasonCodes)],
    limitationCodes: safety.limitationCodes,
  };
}

function buildPhase1EmptySlots(input: Rule4InputContract): Rule4SlotResult[] {
  return input.formulaSlots.map((slot) => ({
    formulaSlotId: slot.formulaSlotId,
    formulaTargetId: slot.formulaTargetId,
    potencyStatus: 'NOT_EVALUATED' as const,
    selectedDilution: null,
    selectedCascade: null,
    reasonCodes: ['RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED'] as const,
    limitationCodes: ['PHASE1_NO_CLINICAL_EVALUATION'] as const,
    evidenceItemIds: [...slot.structuredEvidenceItemIds],
  }));
}

function evaluatePhase2Safety(input: Rule4InputContract): Rule4Result {
  const phase2Input = isRule4Phase2SafetyContract(input)
    ? input
    : {
        ...input,
        contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
        verifiedAge: toPhase2VerifiedAge(input.verifiedAge),
      };

  const safety = evaluateRule4SafetyGate({
    ...phase2Input,
    contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
    verifiedAge: toPhase2VerifiedAge(phase2Input.verifiedAge),
  });

  const slotTemplate = slotOutcomeFromSafety(safety);
  const slots: Rule4SlotResult[] = input.formulaSlots.map((slot) => ({
    formulaSlotId: slot.formulaSlotId,
    formulaTargetId: slot.formulaTargetId,
    potencyStatus: slotTemplate.potencyStatus as Rule4PotencyStatus,
    selectedDilution: null,
    selectedCascade: null,
    reasonCodes: [...new Set(slotTemplate.reasonCodes)],
    limitationCodes: [...new Set(slotTemplate.limitationCodes)],
    evidenceItemIds: [...slot.structuredEvidenceItemIds],
  }));

  const topReason = [...new Set([...safety.reasonCodes, ...slotTemplate.reasonCodes])];
  const topLimitation = [...new Set(safety.limitationCodes)];

  const core = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    executionStatus: 'NOT_IMPLEMENTED' as const,
    engineMode: input.engineMode,
    automaticPotencyRuntime: false as const,
    automaticPrescriptionIssuanceRuntime: false as const,
    currentRuntimePotencyDelta: 'NONE' as const,
    currentRuntimeIssuanceDelta: 'NONE' as const,
    finalDoctorApprovalRequired: true as const,
    prescriptionIssueAllowed: false as const,
    slots,
    reasonCodes: topReason,
    limitationCodes: topLimitation,
    safetyGate: mapSafetyGateOutput(safety),
  };

  validateRule4OutputCodes(core);

  return {
    ...core,
    deterministicFingerprint: rule4EmptyResultFingerprintV1Hash({
      contractVersion: input.contractVersion,
      rulesetVersion: input.rulesetVersion,
      executionStatus: 'NOT_IMPLEMENTED',
      engineMode: input.engineMode,
      prescriptionIssueAllowed: false,
      deterministicSafetyFingerprint: safety.deterministicSafetyFingerprint,
      slots: slots.map((s) => ({
        formulaSlotId: s.formulaSlotId,
        potencyStatus: s.potencyStatus,
        reasonCodes: s.reasonCodes,
        limitationCodes: s.limitationCodes,
      })),
    }),
  };
}

/** Phase 1 empty evaluator — unchanged for phase-1 contract without safety extension. */
export function evaluateRule4Empty(input: Rule4InputContract): Rule4Result {
  validateRule4InputContract(input);
  if (input.engineMode === 'active') {
    throw new Error('RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED');
  }

  if (
    input.contractVersion === RULE4_CONTRACT_VERSION_PHASE2 ||
    input.bpReadings != null ||
    input.structuredCriticalFindings != null ||
    input.structuredFrozenRedFlags != null ||
    input.rawLabKeywordPresent != null
  ) {
    return evaluatePhase2Safety(input);
  }

  const slots = buildPhase1EmptySlots(input);

  const core = {
    contractVersion: RULE4_CONTRACT_VERSION,
    rulesetVersion: input.rulesetVersion,
    executionStatus: 'NOT_IMPLEMENTED' as const,
    engineMode: input.engineMode,
    automaticPotencyRuntime: false as const,
    automaticPrescriptionIssuanceRuntime: false as const,
    currentRuntimePotencyDelta: 'NONE' as const,
    currentRuntimeIssuanceDelta: 'NONE' as const,
    finalDoctorApprovalRequired: true as const,
    prescriptionIssueAllowed: false as const,
    slots,
    reasonCodes: ['RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED'] as const,
    limitationCodes: ['PHASE1_NO_CLINICAL_EVALUATION'] as const,
  };

  validateRule4OutputCodes(core);

  return {
    ...core,
    deterministicFingerprint: fingerprintPhase1Result({
      ...core,
      inputFingerprint: stableJson(input),
    }),
  };
}

export function evaluateRule4Phase2Safety(input: Rule4InputContract): Rule4Result {
  validateRule4InputContract(input);
  if (input.engineMode === 'active') {
    throw new Error('RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED');
  }
  return evaluatePhase2Safety(input);
}

export type Rule4ShadowEvaluationBundle = {
  result: Rule4Result;
  evidenceAdapter: Rule4EvidenceAdapterOutput | null;
  polarityRouting: Rule4PolarityAdapterOutput | null;
  phaseResolution: Rule4PhaseAdapterOutput | null;
  severityResolution: Rule4SeverityAdapterOutput | null;
  eligibilityResolution: Rule4EligibilityAdapterOutput | null;
  selectionResolution: Rule4SelectionAdapterOutput | null;
  pediatricOverlayResolution: Rule4PediatricOverlayAdapterOutput | null;
  doctorReviewResolution: Rule4DoctorReviewAdapterOutput | null;
};

/**
 * Phase 2 public result unchanged; Phase 3 evidence envelope computed only in shadow when provided.
 */
export function evaluateRule4ShadowBundle(input: Rule4InputContract): Rule4ShadowEvaluationBundle {
  const result = evaluateRule4Empty(input);
  let evidenceAdapter: Rule4EvidenceAdapterOutput | null = null;
  let polarityRouting: Rule4PolarityAdapterOutput | null = null;
  let phaseResolution: Rule4PhaseAdapterOutput | null = null;
  let severityResolution: Rule4SeverityAdapterOutput | null = null;
  let eligibilityResolution: Rule4EligibilityAdapterOutput | null = null;
  let selectionResolution: Rule4SelectionAdapterOutput | null = null;
  let pediatricOverlayResolution: Rule4PediatricOverlayAdapterOutput | null = null;
  let doctorReviewResolution: Rule4DoctorReviewAdapterOutput | null = null;

  if (input.engineMode === 'shadow') {
    if (input.evidenceAdapter) {
      evidenceAdapter = evaluateEvidenceAdapter(input.evidenceAdapter);
    }
    if (input.polarityAdapter) {
      polarityRouting = evaluatePolarityAdapter(input.polarityAdapter, {
        safetyGate: result.safetyGate ?? null,
        evidenceAdapter,
        bindingGateMandatory: true,
      });
    }
    if (input.phaseAdapter) {
      phaseResolution = evaluatePhaseAdapter(input.phaseAdapter, {
        safetyGate: result.safetyGate ?? null,
        evidenceAdapter,
        polarityRouting,
        bindingGateMandatory: true,
      });
    }
    if (input.severityAdapter) {
      severityResolution = evaluateSeverityAdapter(input.severityAdapter, {
        safetyGate: result.safetyGate ?? null,
        evidenceAdapter,
        polarityRouting,
        phaseResolution,
        bindingGateMandatory: true,
      });
    }
    if (input.eligibilityAdapter) {
      eligibilityResolution = evaluateEligibilityAdapter(input.eligibilityAdapter, {
        safetyGate: result.safetyGate ?? null,
        evidenceAdapter,
        polarityRouting,
        phaseResolution,
        severityResolution,
        bindingGateMandatory: true,
      });
    }
    if (input.selectionAdapter) {
      selectionResolution = evaluateSelectionAdapter(input.selectionAdapter, {
        safetyGate: result.safetyGate ?? null,
        verifiedAge: input.verifiedAge,
        eligibilityResolution,
        evidenceAdapter: evidenceAdapter,
        evidenceItems: input.evidenceAdapter?.items ?? null,
        bindingGateMandatory: true,
      });
    }
    if (input.pediatricOverlayAdapter && selectionResolution) {
      pediatricOverlayResolution = evaluatePediatricOverlayAdapter(input.pediatricOverlayAdapter, {
        safetyGate: result.safetyGate ?? null,
        verifiedAge: input.verifiedAge,
        selectionResolution,
        upstreamEligibilityFingerprint:
          eligibilityResolution?.deterministicCandidateEligibilityFingerprint ?? null,
      });
    }
    if (input.doctorReviewAdapter) {
      doctorReviewResolution = evaluateDoctorReviewAdapter(
        input.doctorReviewAdapter,
        input.doctorReviewContext ?? {},
      );
    }
  }

  return {
    result,
    evidenceAdapter,
    polarityRouting,
    phaseResolution,
    severityResolution,
    eligibilityResolution,
    selectionResolution,
    pediatricOverlayResolution,
    doctorReviewResolution,
  };
}
