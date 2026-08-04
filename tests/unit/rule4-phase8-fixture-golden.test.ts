import { describe, expect, it } from 'vitest';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import { rule4NumericSelectionFingerprintV1Hash } from '../../packages/clinical-contracts/src/rule4/selection/selectionFingerprintV1.js';
import { fingerprintFromEligibilityOutput } from '../../packages/clinical-contracts/src/rule4/eligibility/eligibilityFingerprintV1.js';
import {
  loadRule4NumericSelectionFixture,
  selectionAdapterInputFromFixture,
  selectionEvaluationContextFromFixture,
} from './rule4-numeric-selection-fixture-loader.ts';

describe('Rule 4 Phase 8 fingerprint references', () => {
  const fixture = loadRule4NumericSelectionFixture();

  it('fixed fingerprint refs match independently authored payloads', () => {
    for (const ref of fixture.fingerprintV1References) {
      const scenario = fixture.scenarios.find((s) => s.id === ref.scenario_id);
      expect(scenario).toBeDefined();
      const ctx = selectionEvaluationContextFromFixture(scenario!);
      const out = evaluateSelectionAdapter(selectionAdapterInputFromFixture(scenario!), ctx);
      const upstream = ctx.eligibilityResolution
        ? fingerprintFromEligibilityOutput(ctx.eligibilityResolution)
        : null;
      const hash = rule4NumericSelectionFingerprintV1Hash({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        upstreamEligibilityFingerprint: upstream,
        slotResolutions: out.slotResolutions,
        reasonCodes: out.reasonCodes,
        limitationCodes: out.limitationCodes,
      });
      expect(hash).toBe(ref.numeric_selection_sha256);
      expect(ref.canonical_payload).toContain('rule4-numeric-selection-fingerprint-v1');
    }
  });
});
