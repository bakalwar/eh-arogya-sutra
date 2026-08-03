import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  RULE4_ELIGIBILITY_FIXTURE_PATH,
  RULE4_ELIGIBILITY_FIXTURE_SHA256,
  loadRule4CandidateEligibilityFixture,
} from './rule4-eligibility-fixture-loader.ts';

describe('Rule 4 Phase 7 fixture golden', () => {
  it('fixture file SHA-256 is stable metadata', () => {
    const bytes = readFileSync(RULE4_ELIGIBILITY_FIXTURE_PATH);
    const sha = createHash('sha256').update(bytes).digest('hex').toUpperCase();
    const fixture = loadRule4CandidateEligibilityFixture();
    expect(fixture.scenarioCount).toBe(50);
    expect(fixture.scenarios).toHaveLength(50);
    expect(sha).toBe(RULE4_ELIGIBILITY_FIXTURE_SHA256);
  });

  it('has four fixed fingerprint references', () => {
    const fixture = loadRule4CandidateEligibilityFixture();
    expect(fixture.fingerprintV1References).toHaveLength(4);
    const ids = fixture.fingerprintV1References.map((r) => r.reference_id).sort();
    expect(ids).toEqual([
      'missing-gate-no-family',
      'neg-both-d1-d2',
      'pos-d30-family',
      'pos-d60-fallback-ready',
    ]);
  });
});
