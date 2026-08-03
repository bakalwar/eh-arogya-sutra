import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluateSeverityAdapter } from '../../packages/clinical-contracts/src/rule4/severity/evaluateSeverityAdapter.js';
import {
  rule4SeverityResolutionFingerprintV1Hash,
  rule4SeverityResolutionFingerprintV1Payload,
} from '../../packages/clinical-contracts/src/rule4/severity/severityFingerprintV1.js';
import {
  loadRule4SeverityResolutionFixture,
  RULE4_SEVERITY_FIXTURE_PATH,
  RULE4_SEVERITY_FIXTURE_SHA256,
  severityAdapterInputFromFixture,
  severityEvaluationContextFromFixture,
} from './rule4-severity-fixture-loader.ts';

describe('Rule 4 Phase 6 golden fixture immutability', () => {
  const fixture = loadRule4SeverityResolutionFixture();

  it('fixture SHA-256 stable', () => {
    const sha = createHash('sha256')
      .update(readFileSync(RULE4_SEVERITY_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    if (RULE4_SEVERITY_FIXTURE_SHA256) {
      expect(sha).toBe(RULE4_SEVERITY_FIXTURE_SHA256);
    }
    expect(fixture.scenarioCount).toBe(fixture.scenarios.length);
    expect(fixture.scenarios.length).toBeGreaterThanOrEqual(63);
  });

  it.each(fixture.fingerprintV1References.map((r) => [r.reference_id, r] as const))(
    'fingerprint ref %s',
    (_id, ref) => {
      const scenario = fixture.scenarios.find((s) => s.id === ref.scenario_id);
      expect(scenario).toBeDefined();
      const out = evaluateSeverityAdapter(
        severityAdapterInputFromFixture(scenario!),
        severityEvaluationContextFromFixture(scenario!),
      );
      const hash = rule4SeverityResolutionFingerprintV1Hash({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        slotResolutions: out.slotResolutions,
        reasonCodes: out.reasonCodes,
        limitationCodes: out.limitationCodes,
      });
      expect(hash).toBe(ref.severity_resolution_sha256);
      const payload = rule4SeverityResolutionFingerprintV1Payload({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        slotResolutions: out.slotResolutions,
        reasonCodes: out.reasonCodes,
        limitationCodes: out.limitationCodes,
      });
      expect(payload).toBe(ref.canonical_payload);
    },
  );
});
