import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Rule4PhaseAdapterOutput } from '../../packages/clinical-contracts/src/rule4/phase/types.js';
import type { Rule4PolarityAdapterOutput } from '../../packages/clinical-contracts/src/rule4/polarity/types.js';
import type { Rule4SafetyGateOutput } from '../../packages/clinical-contracts/src/rule4/output.js';
import { evaluateSeverityAdapter } from '../../packages/clinical-contracts/src/rule4/severity/evaluateSeverityAdapter.js';
import {
  rule4SeverityResolutionFingerprintV1Hash,
  rule4SeverityResolutionFingerprintV1Payload,
} from '../../packages/clinical-contracts/src/rule4/severity/severityFingerprintV1.js';
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

function phaseResolved(): Rule4PhaseAdapterOutput {
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
        phaseStatus: 'RESOLVED_BY_EVIDENCE',
        resolvedPhase: 'ACUTE',
        phaseResolutionSource: 'STRUCTURED_EVIDENCE',
        calculatedDurationDays: null,
        suppliedDurationDays: null,
        durationConsistencyStatus: 'NONE',
        baselinePhase: null,
        currentManifestationPhase: null,
        flareStatus: 'NOT_APPLICABLE',
        evidenceItemIds: [],
        selectedCascade: null,
        selectedDilution: null,
        reasonCodes: [],
        limitationCodes: ['PHASE5_NO_NUMERIC_CASCADE'],
      },
    ],
    reasonCodes: [],
    limitationCodes: [],
    deterministicPhaseResolutionFingerprint: 'phase-resolved',
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

function fp(out: ReturnType<typeof evaluateSeverityAdapter>): string {
  return rule4SeverityResolutionFingerprintV1Hash({
    rulesetVersion: out.rulesetVersion,
    registryVersion: out.registryVersion,
    slotResolutions: out.slotResolutions,
    reasonCodes: out.reasonCodes,
    limitationCodes: out.limitationCodes,
  });
}

describe('Rule 4 Phase 6 severity fingerprint v1 collisions', () => {
  it('NEUTRAL vs UNRESOLVED polarity produce different fingerprints', () => {
    const neutral = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('NEUTRAL_NON_POTENCY'),
      bindingGateMandatory: false,
    });
    const unresolved = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('UNRESOLVED_NO_CASCADE'),
      bindingGateMandatory: false,
    });
    expect(neutral.slotResolutions[0]?.upstreamContextStatus).toBe(
      'AUDIT_ONLY_NON_POTENCY_CONTEXT',
    );
    expect(unresolved.slotResolutions[0]?.upstreamContextStatus).toBe(
      'AUDIT_ONLY_UPSTREAM_UNRESOLVED',
    );
    expect(fp(neutral)).not.toBe(fp(unresolved));
  });

  it('READY vs AUDIT upstream unresolved produce different fingerprints', () => {
    const ready = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP'),
      phaseResolution: phaseResolved(),
      bindingGateMandatory: false,
    });
    const audit = evaluateSeverityAdapter(baseInput, {
      polarityRouting: polarityRouting('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP'),
      phaseResolution: phaseUnresolved(),
      bindingGateMandatory: false,
    });
    expect(ready.slotResolutions[0]?.upstreamContextStatus).toBe(
      'READY_FOR_FUTURE_GATE_EVALUATION',
    );
    expect(audit.slotResolutions[0]?.upstreamContextStatus).toBe('AUDIT_ONLY_UPSTREAM_UNRESOLVED');
    expect(fp(ready)).not.toBe(fp(audit));
  });

  it('safety hold changes fingerprint vs clear', () => {
    const clear = evaluateSeverityAdapter(baseInput, { bindingGateMandatory: false });
    const held = evaluateSeverityAdapter(baseInput, {
      bindingGateMandatory: false,
      safetyGate: {
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
        reasonCodes: ['PRESCRIPTION_HOLD'],
        limitationCodes: [],
        ageVerificationStatus: 'VERIFIED',
        pediatricBand: null,
      } satisfies Rule4SafetyGateOutput,
    });
    expect(clear.slotResolutions[0]?.severityStatus).toBe('RESOLVED_NUMERIC');
    expect(held.slotResolutions[0]?.severityStatus).toBe('BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE');
    expect(fp(clear)).not.toBe(fp(held));
  });

  it('canonical payload stable under reordered input object keys', () => {
    const out = evaluateSeverityAdapter(baseInput, { bindingGateMandatory: false });
    const payloadA = rule4SeverityResolutionFingerprintV1Payload({
      rulesetVersion: out.rulesetVersion,
      registryVersion: out.registryVersion,
      slotResolutions: out.slotResolutions,
      reasonCodes: out.reasonCodes,
      limitationCodes: out.limitationCodes,
    });
    const shuffled = JSON.parse(payloadA) as Record<string, unknown>;
    const payloadB = JSON.stringify(shuffled);
    const hashA = createHash('sha256').update(payloadA, 'utf8').digest('hex').toUpperCase();
    const hashB = createHash('sha256').update(payloadB, 'utf8').digest('hex').toUpperCase();
    expect(hashA).toBe(hashB);
    expect(fp(out)).toBe(hashA);
  });
});
