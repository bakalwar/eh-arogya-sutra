import { describe, expect, it } from 'vitest';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import { fingerprintFromSelectionOutput } from '../../packages/clinical-contracts/src/rule4/selection/selectionFingerprintV1.js';
import { evaluatePediatricOverlayAdapter } from '../../packages/clinical-contracts/src/rule4/pediatricOverlay/evaluatePediatricOverlayAdapter.js';
import {
  buildOverlayInputFromScenario,
  findPediatricOverlayScenario,
  loadPhase8ScenarioByRef,
  loadPhase8ScenarioByRefIncomplete,
  loadRule4PediatricOverlayFixture,
  overlayContextFromScenario,
  overlaySlotView,
} from './rule4-pediatric-overlay-fixture-loader.ts';
import { selectionEvaluationContextFromPhase8Context } from './rule4-numeric-selection-fixture-loader.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = resolve(import.meta.dirname, '../..');
const PHASE8_FIXTURE = JSON.parse(
  readFileSync(resolve(REPO, 'fixtures/rule4/numeric-selection-scenarios.v1.json'), 'utf8'),
) as { scenarios: Array<{ id: string; context?: Record<string, unknown> }> };

describe('Rule 4 Phase 9 Phase 8 context regression', () => {
  const fixture = loadRule4PediatricOverlayFixture();

  it('complete D3 context succeeds for p13c-d3-restrict-pass', () => {
    const scenario = findPediatricOverlayScenario(fixture, 'p13c-d3-restrict-pass');
    const p8 = loadPhase8ScenarioByRef('d3-selected');
    const selOut = evaluateSelectionAdapter(p8.input, p8.context);
    expect(selOut.slotResolutions[0]?.selectionStatus).toBe('RESOLVED_DRAFT_CANDIDATE');
    expect(selOut.slotResolutions[0]?.selectedDilution).toBe('D3');
    const fp = fingerprintFromSelectionOutput(
      selOut,
      selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
    );
    expect(fp).toMatch(/^[0-9A-F]{64}$/);
    const overlayOut = evaluatePediatricOverlayAdapter(
      buildOverlayInputFromScenario(scenario, fp, selOut.slotResolutions[0]!.formulaTargetId!),
      overlayContextFromScenario(scenario, selOut),
    );
    const view = overlaySlotView(overlayOut, 's1');
    expect(view.pediatric_overlay_status).toBe('OVERLAY_APPLIED');
    expect(view.final_draft_dilution).toBe('D3');
    expect(overlayOut.prescriptionIssueAllowed).toBe(false);
  });

  it('complete D5 context succeeds for p13c-d5-allow', () => {
    const scenario = findPediatricOverlayScenario(fixture, 'p13c-d5-allow');
    const p8 = loadPhase8ScenarioByRef('d5-selected');
    const selOut = evaluateSelectionAdapter(p8.input, p8.context);
    expect(selOut.slotResolutions[0]?.selectionStatus).toBe('RESOLVED_DRAFT_CANDIDATE');
    expect(selOut.slotResolutions[0]?.selectedDilution).toBe('D5');
    const overlayOut = evaluatePediatricOverlayAdapter(
      buildOverlayInputFromScenario(
        scenario,
        fingerprintFromSelectionOutput(
          selOut,
          selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
        ),
        selOut.slotResolutions[0]!.formulaTargetId!,
      ),
      overlayContextFromScenario(scenario, selOut),
    );
    const view = overlaySlotView(overlayOut, 's1');
    expect(view.pediatric_overlay_status).toBe('OVERLAY_APPLIED');
    expect(view.final_draft_dilution).toBe('D5');
  });

  it('missing evidence context fails Phase 8 auth for D5 allow band', () => {
    const scenario = findPediatricOverlayScenario(fixture, 'p13c-d5-allow');
    const p8Incomplete = loadPhase8ScenarioByRefIncomplete('d5-selected');
    const selOut = evaluateSelectionAdapter(p8Incomplete.input, p8Incomplete.context);
    expect(selOut.slotResolutions[0]?.selectionStatus).not.toBe('RESOLVED_DRAFT_CANDIDATE');
    const overlayOut = evaluatePediatricOverlayAdapter(
      buildOverlayInputFromScenario(
        scenario,
        fingerprintFromSelectionOutput(
          selOut,
          selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
        ),
        selOut.slotResolutions[0]?.formulaTargetId ?? 't1',
      ),
      overlayContextFromScenario(scenario, selOut),
    );
    expect(overlaySlotView(overlayOut, 's1').pediatric_overlay_status).toBe('PHASE8_AUTH_FAILED');
    expect(overlaySlotView(overlayOut, 's1').final_draft_dilution).toBeNull();
  });

  it('wrong evidence item fails selection binding for D3', () => {
    const row = PHASE8_FIXTURE.scenarios.find((s) => s.id === 'd3-selected')!;
    const ctx = selectionEvaluationContextFromPhase8Context(row.context);
    const items = [...(ctx.evidenceItems ?? [])];
    if (items[0]) {
      items[0] = { ...items[0], findingId: 'e-wrong' };
    }
    const badCtx = { ...ctx, evidenceItems: items };
    const p8 = loadPhase8ScenarioByRef('d3-selected');
    const selOut = evaluateSelectionAdapter(p8.input, badCtx);
    expect(selOut.slotResolutions[0]?.selectionStatus).not.toBe('RESOLVED_DRAFT_CANDIDATE');
  });

  it('Phase 8 fingerprint mismatch fails overlay auth', () => {
    const scenario = findPediatricOverlayScenario(fixture, 'phase8-fp-mismatch');
    const p8 = loadPhase8ScenarioByRef(scenario.phase8_ref);
    const selOut = evaluateSelectionAdapter(p8.input, p8.context);
    expect(selOut.slotResolutions[0]?.selectionStatus).toBe('RESOLVED_DRAFT_CANDIDATE');
    const overlayOut = evaluatePediatricOverlayAdapter(
      buildOverlayInputFromScenario(
        scenario,
        fingerprintFromSelectionOutput(
          selOut,
          selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
        ),
        selOut.slotResolutions[0]!.formulaTargetId!,
      ),
      overlayContextFromScenario(scenario, selOut),
    );
    const view = overlaySlotView(overlayOut, 's1');
    expect(view.pediatric_overlay_status).toBe('PHASE8_AUTH_FAILED');
    expect(view.reason_codes).toContain('PHASE8_SELECTION_FINGERPRINT_MISMATCH');
  });
});
