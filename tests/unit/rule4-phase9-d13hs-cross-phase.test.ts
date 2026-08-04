import { describe, expect, it } from 'vitest';
import { evaluateRule4ShadowBundle } from '../../packages/clinical-contracts/src/rule4/evaluator.js';
import {
  buildOverlayInputFromScenario,
  evaluatePediatricOverlayFromScenario,
  findPediatricOverlayScenario,
  loadPhase8ScenarioByRef,
  loadRule4PediatricOverlayFixture,
  verifiedAgeInputFromScenario,
} from './rule4-pediatric-overlay-fixture-loader.ts';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import { fingerprintFromSelectionOutput } from '../../packages/clinical-contracts/src/rule4/selection/selectionFingerprintV1.js';
import { RULE4_CONTRACT_VERSION_PHASE2 } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';

describe('Rule 4 Phase 9 D13-HS cross-phase regression', () => {
  const fixture = loadRule4PediatricOverlayFixture();

  function shadowBundleForScenario(
    scenarioId: string,
    extra: {
      bpReadings?: NonNullable<
        import('../../packages/clinical-contracts/src/rule4/input.js').Rule4InputContract['bpReadings']
      >;
    } = {},
  ) {
    const scenario = findPediatricOverlayScenario(fixture, scenarioId);
    const p8 = loadPhase8ScenarioByRef(scenario.phase8_ref);
    const selOut = evaluateSelectionAdapter(p8.input, p8.context);
    const fp = fingerprintFromSelectionOutput(
      selOut,
      selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
    );
    const targetId =
      scenario.slot_target_override ?? selOut.slotResolutions[0]?.formulaTargetId ?? 't1';
    const overlayIn = buildOverlayInputFromScenario(scenario, fp, targetId);
    return evaluateRule4ShadowBundle({
      contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
      caseId: 'phase9-d13hs-cross',
      consultationId: 'consult-1',
      rulesetVersion: RULESET,
      engineMode: 'shadow',
      label: 'SYNTHETIC',
      formulaSlots: [
        {
          formulaSlotId: 's1',
          formulaTargetId: 't1',
          polarityRef: null,
          organTargetRef: null,
          temperamentRef: null,
          phaseRef: null,
          severityRef: null,
          structuredEvidenceItemIds: [],
        },
      ],
      verifiedAge: verifiedAgeInputFromScenario(scenario),
      patientWideSafety: {},
      structuredEvidenceItemIds: [],
      bpReadings: extra.bpReadings ?? [],
      selectionAdapter: p8.input,
      pediatricOverlayAdapter: overlayIn,
    });
  }

  it('P13-A under-one: Phase 2 NOT_GENERATED + overlay null draft (no Phase 8 leak in overlay)', () => {
    const bundle = shadowBundleForScenario('p13a-d5-d13hs');
    expect(bundle.result.safetyGate?.clinicalPrescriptionSummary).toBe('NOT_GENERATED');
    expect(bundle.result.safetyGate?.prescriptionStatus).toBe('BLOCKED');
    expect(bundle.result.safetyGate?.d13HardStopActive).toBe(true);
    expect(bundle.result.slots[0]?.selectedDilution).toBeNull();
    expect(bundle.result.slots[0]?.selectedCascade).toBeNull();
    const overlaySlot = bundle.pediatricOverlayResolution?.slotResolutions[0];
    expect(overlaySlot?.pediatricOverlayStatus).toBe('BLOCKED_D13_HS');
    expect(overlaySlot?.finalDraftDilution).toBeNull();
    expect(overlaySlot?.finalDraftCascade).toBeNull();
    expect(overlaySlot?.baseSelectedDilution).toBeNull();
    expect(overlaySlot?.baseSelectedCascade).toBeNull();
    expect(overlaySlot?.phase8SelectionFingerprint).toBeNull();
  });

  it('P13-B under-one with BP crisis: urgent escalation preserved + overlay blocked', () => {
    const bundle = shadowBundleForScenario('p13b-crisis-d13hs', {
      bpReadings: [
        {
          systolic: 181,
          diastolic: 85,
          unit: 'mmHg',
          evidenceStatus: 'VERIFIED_CURRENT_READING',
          sourceKind: 'STRUCTURED',
          measuredAt: null,
        },
      ],
    });
    expect(bundle.result.safetyGate?.clinicalPrescriptionSummary).toBe('NOT_GENERATED');
    expect(bundle.result.safetyGate?.prescriptionStatus).toBe('BLOCKED');
    expect(bundle.result.safetyGate?.d13HardStopActive).toBe(true);
    expect(bundle.result.safetyGate?.urgentEscalationRequired).toBe(true);
    expect(bundle.result.safetyGate?.patientWideHold).toBe(true);
    const overlaySlot = bundle.pediatricOverlayResolution?.slotResolutions[0];
    expect(overlaySlot?.pediatricOverlayStatus).toBe('BLOCKED_D13_HS');
    expect(overlaySlot?.finalDraftDilution).toBeNull();
    expect(overlaySlot?.finalDraftCascade).toBeNull();
  });

  it('shadow overlay runtime flags unchanged', () => {
    const scenario = findPediatricOverlayScenario(fixture, 'p13c-d10-restrict-pass');
    const { overlayOut } = evaluatePediatricOverlayFromScenario(scenario);
    expect(overlayOut.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(overlayOut.automaticPediatricOverlayRuntime).toBe(false);
    expect(overlayOut.prescriptionIssueAllowed).toBe(false);
    expect(overlayOut.finalDoctorApprovalRequired).toBe(true);
  });
});
