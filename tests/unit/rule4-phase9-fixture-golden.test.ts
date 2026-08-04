import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  rule4PediatricOverlayFingerprintV1Hash,
  rule4PediatricOverlayFingerprintV1Payload,
} from '../../packages/clinical-contracts/src/rule4/pediatricOverlay/pediatricOverlayFingerprintV1.js';
import {
  evaluatePediatricOverlayFromScenario,
  findPediatricOverlayScenario,
  loadRule4PediatricOverlayFixture,
} from './rule4-pediatric-overlay-fixture-loader.ts';

describe('Rule 4 Phase 9 fingerprint references', () => {
  const fixture = loadRule4PediatricOverlayFixture();

  it('fixed fingerprint refs match independently authored payloads', () => {
    expect(fixture.fingerprintV1References.length).toBeGreaterThanOrEqual(8);
    for (const ref of fixture.fingerprintV1References) {
      const scenario = findPediatricOverlayScenario(fixture, ref.scenario_id);
      const { overlayOut, safetyFlags } = evaluatePediatricOverlayFromScenario(scenario);
      const payload = rule4PediatricOverlayFingerprintV1Payload({
        rulesetVersion: overlayOut.rulesetVersion,
        registryVersion: overlayOut.registryVersion,
        d13HsActive: safetyFlags.d13HsActive,
        patientWideHold: safetyFlags.patientWideHold,
        urgentEscalationRequired: safetyFlags.urgentEscalationRequired,
        slotResolutions: overlayOut.slotResolutions,
        reasonCodes: overlayOut.reasonCodes,
        limitationCodes: overlayOut.limitationCodes,
      });
      const hashFromPayload = createHash('sha256')
        .update(payload, 'utf8')
        .digest('hex')
        .toUpperCase();
      const hashFromFn = rule4PediatricOverlayFingerprintV1Hash({
        rulesetVersion: overlayOut.rulesetVersion,
        registryVersion: overlayOut.registryVersion,
        d13HsActive: safetyFlags.d13HsActive,
        patientWideHold: safetyFlags.patientWideHold,
        urgentEscalationRequired: safetyFlags.urgentEscalationRequired,
        slotResolutions: overlayOut.slotResolutions,
        reasonCodes: overlayOut.reasonCodes,
        limitationCodes: overlayOut.limitationCodes,
      });
      expect(payload).toBe(ref.canonical_payload);
      expect(hashFromPayload).toBe(ref.pediatric_overlay_sha256);
      expect(hashFromFn).toBe(ref.pediatric_overlay_sha256);
      expect(ref.canonical_payload).toContain('rule4-pediatric-overlay-fingerprint-v1');
    }
  });

  it('reference fingerprints are pairwise distinct for coverage axes', () => {
    const byId = new Map(
      fixture.fingerprintV1References.map((r) => [r.reference_id, r.pediatric_overlay_sha256]),
    );
    const required = [
      'ref-p13c-d5-allow',
      'ref-p13c-d10-restrict-pass',
      'ref-p13c-d30-prohibit',
      'ref-p13d-d30-restrict-pass',
      'ref-p13e-pass-through',
      'ref-p13b-d13hs',
      'ref-p13b-crisis-d13hs',
      'ref-phase8-fp-mismatch',
    ];
    for (const id of required) {
      expect(byId.has(id)).toBe(true);
    }
    const hashes = required.map((id) => byId.get(id)!);
    expect(new Set(hashes).size).toBe(hashes.length);
    expect(byId.get('ref-p13c-d10-restrict-pass')).not.toBe(byId.get('ref-p13c-d30-prohibit'));
    expect(byId.get('ref-p13c-d30-prohibit')).not.toBe(byId.get('ref-p13d-d30-restrict-pass'));
    expect(byId.get('ref-p13e-pass-through')).not.toBe(byId.get('ref-p13c-d10-restrict-pass'));
    expect(byId.get('ref-p13b-d13hs')).not.toBe(byId.get('ref-p13b-crisis-d13hs'));
    expect(byId.get('ref-phase8-fp-mismatch')).not.toBe(byId.get('ref-p13c-d5-allow'));

    const safetyHold = findPediatricOverlayScenario(fixture, 'safety-hold-blocks');
    const { overlayOut: holdOut, safetyFlags: holdFlags } =
      evaluatePediatricOverlayFromScenario(safetyHold);
    const holdHash = rule4PediatricOverlayFingerprintV1Hash({
      rulesetVersion: holdOut.rulesetVersion,
      registryVersion: holdOut.registryVersion,
      ...holdFlags,
      slotResolutions: holdOut.slotResolutions,
      reasonCodes: holdOut.reasonCodes,
      limitationCodes: holdOut.limitationCodes,
    });
    expect(holdHash).not.toBe(byId.get('ref-p13b-d13hs'));
  });
});
