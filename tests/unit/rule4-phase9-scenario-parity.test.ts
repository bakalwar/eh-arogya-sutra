import { describe, expect, it } from 'vitest';
import { evaluatePediatricOverlayAdapter } from '../../packages/clinical-contracts/src/rule4/pediatricOverlay/evaluatePediatricOverlayAdapter.js';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import { fingerprintFromSelectionOutput } from '../../packages/clinical-contracts/src/rule4/selection/selectionFingerprintV1.js';
import {
  buildOverlayInputFromScenario,
  loadPhase8ScenarioByRef,
  loadRule4PediatricOverlayFixture,
  overlayContextFromScenario,
  overlaySlotView,
  RULE4_PEDIATRIC_OVERLAY_FIXTURE_SHA256,
} from './rule4-pediatric-overlay-fixture-loader.ts';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { RULE4_PEDIATRIC_OVERLAY_FIXTURE_PATH } from './rule4-pediatric-overlay-fixture-loader.ts';

describe('Rule 4 Phase 9 fixture golden SHA', () => {
  it('fixture bytes unchanged', () => {
    const sha = createHash('sha256')
      .update(readFileSync(RULE4_PEDIATRIC_OVERLAY_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    expect(sha).toBe(RULE4_PEDIATRIC_OVERLAY_FIXTURE_SHA256);
  });
});

describe('Rule 4 Phase 9 pediatric overlay scenario parity', () => {
  const fixture = loadRule4PediatricOverlayFixture();

  it('scenario count', () => {
    expect(fixture.scenarios.length).toBe(fixture.scenarioCount);
    expect(fixture.scenarioCount).toBeGreaterThanOrEqual(56);
  });

  it.each(fixture.scenarios.map((s) => [s.id, s] as const))('parity %s', (_id, scenario) => {
    const p8 = loadPhase8ScenarioByRef(scenario.phase8_ref);
    const selOut = evaluateSelectionAdapter(p8.input, p8.context);
    const fp = fingerprintFromSelectionOutput(
      selOut,
      selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
    );
    const targetId =
      scenario.slot_target_override ?? selOut.slotResolutions[0]?.formulaTargetId ?? 't1';
    const overlayIn = buildOverlayInputFromScenario(scenario, fp, targetId);
    const overlayOut = evaluatePediatricOverlayAdapter(
      overlayIn,
      overlayContextFromScenario(scenario, selOut),
    );
    expect(overlayOut.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(overlayOut.automaticPediatricOverlayRuntime).toBe(false);
    expect(overlayOut.prescriptionIssueAllowed).toBe(false);
    expect(overlayOut.finalDoctorApprovalRequired).toBe(true);
    const view = overlaySlotView(overlayOut, 's1');
    for (const [key, expected] of Object.entries(scenario.expected)) {
      if (key === 'reason_includes') {
        for (const r of expected as string[]) {
          expect(view.reason_codes).toContain(r);
        }
      } else {
        expect(view[key]).toBe(expected);
      }
    }
  });
});

describe('Rule 4 Phase 9 shadow public equivalence', () => {
  it('public Rule4Result slots remain null selection', async () => {
    const { evaluateRule4ShadowBundle } =
      await import('../../packages/clinical-contracts/src/rule4/evaluator.js');
    const fixture = loadRule4PediatricOverlayFixture();
    const row = fixture.scenarios.find((s) => s.id === 'p13c-d5-allow')!;
    const p8 = loadPhase8ScenarioByRef(row.phase8_ref);
    const selOut = evaluateSelectionAdapter(p8.input, p8.context);
    const fp = fingerprintFromSelectionOutput(
      selOut,
      selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
    );
    const overlayIn = buildOverlayInputFromScenario(
      row,
      fp,
      selOut.slotResolutions[0]!.formulaTargetId!,
    );
    const verifiedAge = overlayContextFromScenario(row, selOut).verifiedAge!;
    const bundle = evaluateRule4ShadowBundle({
      contractVersion: 'ehas2-rule4-contract-v1-phase2-safety',
      caseId: 'c1',
      consultationId: null,
      rulesetVersion: 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469',
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
      verifiedAge,
      patientWideSafety: {},
      structuredEvidenceItemIds: [],
      selectionAdapter: p8.input,
      pediatricOverlayAdapter: overlayIn,
    });
    expect(bundle.pediatricOverlayResolution).not.toBeNull();
    expect(bundle.result.slots[0]?.selectedDilution).toBeNull();
    expect(bundle.result.slots[0]?.selectedCascade).toBeNull();
  });
});
