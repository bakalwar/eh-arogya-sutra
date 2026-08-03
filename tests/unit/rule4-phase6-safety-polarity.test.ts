import { describe, expect, it } from 'vitest';
import type { Rule4PhaseAdapterOutput } from '../../packages/clinical-contracts/src/rule4/phase/types.js';
import type { Rule4PolarityAdapterOutput } from '../../packages/clinical-contracts/src/rule4/polarity/types.js';
import type { Rule4SafetyGateOutput } from '../../packages/clinical-contracts/src/rule4/output.js';
import { evaluateSeverityAdapter } from '../../packages/clinical-contracts/src/rule4/severity/evaluateSeverityAdapter.js';
import { RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REGISTRY = 'rule4-reason-codes-phase6-structured-severity-subset-v1';

const baseInput = {
  contractVersion: RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY,
  rulesetVersion: RULESET,
  registryVersion: REGISTRY,
  label: 'SYNTHETIC' as const,
  trustedSyntheticBindingBypass: true as const,
  formulaSlotIds: ['s1'],
  formulaSeverityRecords: [
    {
      formulaSlotId: 's1',
      formulaTargetId: 't1',
      targetRole: 'STANDARD_FORMULA_TARGET' as const,
      severityEvidenceAssertions: [
        {
          evidenceItemId: 'e1',
          severityScore: 5,
          severityBand: 'MODERATE' as const,
          sourceTier: 'DOCTOR_STRUCTURED' as const,
          dedupeKey: 'd1',
          sequenceToken: 't1',
          parentSourceId: 'ps-doc',
        },
      ],
    },
  ],
};

function safetyHold(reasonCodes: string[]): Rule4SafetyGateOutput {
  return {
    safetyGateStatus: 'BLOCKED',
    safetyStatus: 'ACUTE_RED_FLAG',
    prescriptionStatus: 'HOLD',
    holdStatus: 'ACTIVE',
    patientWideHold: true,
    urgentEscalationRequired: true,
    analysisStatus: 'COMPLETE',
    clinicalPrescriptionSummary: 'NOT_GENERATED',
    d13HardStopActive: false,
    safetyNoticeKey: null,
    safetyClearForFutureCascade: false,
    deterministicSafetyFingerprint: 'test',
    reasonCodes,
    limitationCodes: [],
    ageVerificationStatus: 'VERIFIED',
    pediatricBand: null,
  };
}

function d13HardStop(): Rule4SafetyGateOutput {
  return {
    ...safetyHold(['PRESCRIPTION_HOLD']),
    d13HardStopActive: true,
    safetyNoticeKey: 'D13_HS_UNDER_ONE',
    patientWideHold: false,
  };
}

function polarityRouting(pathway: string): Rule4PolarityAdapterOutput {
  return {
    contractVersion: 'ehas2-rule4-contract-v1-phase4-polarity',
    rulesetVersion: RULESET,
    registryVersion: 'rule4-reason-codes-phase4-polarity-subset-v1',
    executionStatus: 'NOT_IMPLEMENTED',
    currentRuntimePotencyDelta: 'NONE',
    slotRoutings: [
      {
        formulaSlotId: 's1',
        formulaTargetId: 't1',
        rule2RecordId: 'r2-1',
        diseasePolarity: 'POSITIVE',
        requiredTherapeuticPolarity: 'NEGATIVE',
        resolutionStatus: 'RESOLVED',
        pathway: pathway as Rule4PolarityAdapterOutput['slotRoutings'][0]['pathway'],
        potencyStatus: 'NOT_EVALUATED',
        selectedCascade: null,
        selectedDilution: null,
        reasonCodes: [],
        limitationCodes: ['PHASE4_NO_NUMERIC_CASCADE'],
      },
    ],
    reasonCodes: [],
    limitationCodes: [],
    deterministicPolarityRoutingFingerprint: 'test',
  };
}

function phaseUnresolved(): Rule4PhaseAdapterOutput {
  return {
    contractVersion: 'ehas2-rule4-contract-v1-phase5-structured-phase',
    rulesetVersion: RULESET,
    registryVersion: 'rule4-reason-codes-phase5-structured-phase-subset-v1',
    executionStatus: 'NOT_IMPLEMENTED',
    automaticPhaseRuntime: false,
    automaticFlareSplitRuntime: false,
    automaticPotencyRuntime: false,
    automaticPrescriptionIssuanceRuntime: false,
    prescriptionIssueAllowed: false,
    currentRuntimePotencyDelta: 'NONE',
    finalDoctorApprovalRequired: true,
    slotResolutions: [
      {
        formulaSlotId: 's1',
        formulaTargetId: 't1',
        targetRole: 'STANDARD_FORMULA_TARGET',
        phaseStatus: 'MISSING_EVIDENCE',
        resolvedPhase: null,
        phaseResolutionSource: 'NONE',
        calculatedDurationDays: null,
        suppliedDurationDays: null,
        durationConsistencyStatus: 'NONE',
        baselinePhase: null,
        currentManifestationPhase: null,
        flareStatus: 'NOT_APPLICABLE',
        evidenceItemIds: [],
        selectedCascade: null,
        selectedDilution: null,
        reasonCodes: ['PHASE_EVIDENCE_MISSING'],
        limitationCodes: ['PHASE5_NO_NUMERIC_CASCADE'],
      },
    ],
    reasonCodes: ['PHASE_EVIDENCE_MISSING'],
    limitationCodes: ['PHASE5_NO_NUMERIC_CASCADE'],
    deterministicPhaseResolutionFingerprint: 'phase-unresolved',
  };
}

describe('Rule 4 Phase 6 safety/polarity/phase precedence', () => {
  it('crisis patient-wide hold blocks severity after resolve', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      safetyGate: safetyHold(['PRESCRIPTION_HOLD']),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
    expect(out.slotResolutions[0]?.severityScore).toBeNull();
    expect(out.slotResolutions[0]?.selectedCascade).toBeNull();
  });

  it('D13-HS hard stop blocks severity', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      safetyGate: d13HardStop(),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
  });

  it('explicit patient-wide hold blocks valid severity', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      safetyGate: safetyHold(['PRESCRIPTION_HOLD']),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityBand).toBeNull();
  });

  it('NEUTRAL polarity does not open potency; severity may audit-resolve', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('NEUTRAL_NON_POTENCY'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityStatus).toBe('RESOLVED_NUMERIC');
    expect(out.slotResolutions[0]?.upstreamContextStatus).toBe('AUDIT_ONLY_NON_POTENCY_CONTEXT');
    expect(out.automaticPotencyRuntime).toBe(false);
    expect(out.slotResolutions[0]?.selectedCascade).toBeNull();
  });

  it('SUPPORT_ONLY pathway does not open potency', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('SUPPORT_ONLY_NON_POTENCY'),
      bindingGateMandatory: false,
    });
    expect(out.prescriptionIssueAllowed).toBe(false);
    expect(out.slotResolutions[0]?.selectedDilution).toBeNull();
  });

  it('UNRESOLVED polarity does not open potency', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('UNRESOLVED_NO_CASCADE'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityScore).toBe(5);
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
  });

  it('POLARITY_CONTRADICTORY context does not repair severity into cascade', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('POLARITY_CONTRADICTORY'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityStatus).toBe('RESOLVED_NUMERIC');
    expect(out.slotResolutions[0]?.selectedCascade).toBeNull();
  });

  it('unresolved phase context does not block structured severity audit', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      phaseResolution: phaseUnresolved(),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityStatus).toBe('RESOLVED_NUMERIC');
    expect(out.slotResolutions[0]?.selectedDilution).toBeNull();
  });

  it('valid GROUP polarity + unresolved phase + valid severity', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP'),
      phaseResolution: phaseUnresolved(),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityBand).toBe('MODERATE');
    expect(out.slotResolutions[0]?.upstreamContextStatus).toBe('AUDIT_ONLY_UPSTREAM_UNRESOLVED');
    expect(out.finalDoctorApprovalRequired).toBe(true);
  });

  it('safety block wins over resolved severity', () => {
    const out = evaluateSeverityAdapter(baseInput, {
      safetyGate: safetyHold(['PRESCRIPTION_HOLD']),
      polarityRouting: polarityRouting('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP'),
      phaseResolution: phaseUnresolved(),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.severityStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
    expect(out.reasonCodes).toContain('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
  });
});
