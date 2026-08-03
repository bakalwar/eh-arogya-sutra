import { describe, expect, it } from 'vitest';
import type { Rule4PolarityAdapterOutput } from '../../packages/clinical-contracts/src/rule4/polarity/types.js';
import type { Rule4SafetyGateOutput } from '../../packages/clinical-contracts/src/rule4/output.js';
import { evaluatePhaseAdapter } from '../../packages/clinical-contracts/src/rule4/phase/evaluatePhaseAdapter.js';
import { RULE4_CONTRACT_VERSION_PHASE5_STRUCTURED_PHASE } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REGISTRY = 'rule4-reason-codes-phase5-structured-phase-subset-v1';

const baseInput = {
  contractVersion: RULE4_CONTRACT_VERSION_PHASE5_STRUCTURED_PHASE,
  rulesetVersion: RULESET,
  registryVersion: REGISTRY,
  label: 'SYNTHETIC' as const,
  trustedSyntheticBindingBypass: true as const,
  formulaSlotIds: ['s1'],
  formulaPhaseRecords: [
    {
      formulaSlotId: 's1',
      formulaTargetId: 't1',
      targetRole: 'STANDARD_FORMULA_TARGET' as const,
      rawDurationDays: 10,
      phaseEvidenceAssertions: [],
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

describe('Rule 4 Phase 5 safety and polarity precedence', () => {
  it('crisis patient-wide hold blocks phase resolution', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      safetyGate: safetyHold(['PRESCRIPTION_HOLD']),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
    expect(out.slotResolutions[0]?.resolvedPhase).toBeNull();
    expect(out.slotResolutions[0]?.selectedCascade).toBeNull();
    expect(out.slotResolutions[0]?.selectedDilution).toBeNull();
  });

  it('D13-HS hard stop blocks phase resolution', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      safetyGate: d13HardStop(),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
    expect(out.slotResolutions[0]?.resolvedPhase).toBeNull();
  });

  it('patient-wide hold blocks even when phase would resolve', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      safetyGate: safetyHold(['PRESCRIPTION_HOLD']),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
  });

  it('NEUTRAL polarity does not open potency; phase may remain audit-only', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      polarityRouting: polarityRouting('NEUTRAL_NON_POTENCY'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.resolvedPhase).toBe('ACUTE');
    expect(out.slotResolutions[0]?.selectedCascade).toBeNull();
    expect(out.automaticPotencyRuntime).toBe(false);
  });

  it('SUPPORT_ONLY pathway does not open potency', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      polarityRouting: polarityRouting('SUPPORT_ONLY_NON_POTENCY'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.selectedDilution).toBeNull();
    expect(out.prescriptionIssueAllowed).toBe(false);
  });

  it('UNRESOLVED polarity does not open potency', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      polarityRouting: polarityRouting('UNRESOLVED_NO_CASCADE'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.selectedCascade).toBeNull();
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
  });

  it('POLARITY_CONTRADICTORY blocks phase after resolution', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      polarityRouting: polarityRouting('POLARITY_CONTRADICTORY'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('BLOCKED_BY_POLARITY_CONTRADICTION');
    expect(out.slotResolutions[0]?.resolvedPhase).toBeNull();
    expect(out.slotResolutions[0]?.reasonCodes).toContain('POLARITY_SAME_TARGET_CONTRADICTION');
  });

  it('valid GROUP polarity allows phase audit resolution with binding bypass off', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      polarityRouting: polarityRouting('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('RESOLVED_BY_DAY_BAND');
    expect(out.slotResolutions[0]?.selectedDilution).toBeNull();
  });

  it('safety block wins over valid phase and polarity', () => {
    const out = evaluatePhaseAdapter(baseInput, {
      safetyGate: safetyHold(['PRESCRIPTION_HOLD']),
      polarityRouting: polarityRouting('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP'),
      bindingGateMandatory: false,
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
  });
});
