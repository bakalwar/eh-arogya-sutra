import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluateDoctorReviewAdapter } from '../../packages/clinical-contracts/src/rule4/doctorReview/evaluateDoctorReviewAdapter.js';
import {
  RULE4_DOCTOR_REVIEW_FIXTURE_PATH,
  RULE4_DOCTOR_REVIEW_FIXTURE_SHA256,
  doctorReviewContextFromScenario,
  doctorReviewExpectedView,
  doctorReviewInputFromScenario,
  loadRule4DoctorReviewFixture,
} from './rule4-doctor-review-fixture-loader.ts';

describe('Rule 4 Phase 10 fixture golden SHA', () => {
  it('fixture bytes unchanged', () => {
    const sha = createHash('sha256')
      .update(readFileSync(RULE4_DOCTOR_REVIEW_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    expect(sha).toBe(RULE4_DOCTOR_REVIEW_FIXTURE_SHA256);
  });
});

describe('Rule 4 Phase 10 doctor review scenario parity', () => {
  const fixture = loadRule4DoctorReviewFixture();

  it('scenario count', () => {
    expect(fixture.scenarios.length).toBe(fixture.scenarioCount);
    expect(fixture.scenarioCount).toBeGreaterThanOrEqual(71);
  });

  it.each(fixture.scenarios.map((s) => [s.id, s] as const))('parity %s', (_id, scenario) => {
    const out = evaluateDoctorReviewAdapter(
      doctorReviewInputFromScenario(scenario),
      doctorReviewContextFromScenario(scenario),
    );
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(out.automaticIssuanceRuntime).toBe(false);
    expect(out.prescriptionIssueAllowed).toBe(false);
    expect(out.finalDoctorApprovalRequired).toBe(true);
    const view = doctorReviewExpectedView(out);
    for (const [key, expected] of Object.entries(scenario.expected)) {
      if (key === 'reason_includes') {
        for (const r of expected as string[]) {
          expect(view.reason_codes).toContain(r);
        }
      } else if (key === 'audit_event_types') {
        const types = out.shadowAuditEvents.map((e) => e.eventType).sort();
        expect(types).toEqual([...(expected as string[])].sort());
      } else {
        expect(view[key]).toBe(expected);
      }
    }
  });
});
