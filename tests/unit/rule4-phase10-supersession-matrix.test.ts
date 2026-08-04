import { describe, expect, it } from 'vitest';
import { evaluateDoctorReviewAdapter } from '../../packages/clinical-contracts/src/rule4/doctorReview/evaluateDoctorReviewAdapter.js';
import {
  doctorReviewContextFromScenario,
  doctorReviewInputFromScenario,
  loadRule4DoctorReviewFixture,
} from './rule4-doctor-review-fixture-loader.ts';

const SUPERSESSION_SCENARIO_IDS = [
  'approval-superseded-content-hash',
  'approval-superseded-slot-removed',
  'approval-superseded-slot-added',
  'supersession-prior-approved-newer-draft',
  'supersession-expected-draft-version-stale',
  'stale-evidence-fingerprint',
  'supersession-phase8-selection-drift',
  'supersession-phase9-pediatric-drift',
  'ruleset-registry-mismatch',
] as const;

describe('Rule 4 Phase 10 supersession scenario matrix', () => {
  const fixture = loadRule4DoctorReviewFixture();

  it.each(SUPERSESSION_SCENARIO_IDS.map((id) => [id] as const))(
    '%s blocks with supersede',
    (id) => {
      const scenario = fixture.scenarios.find((s) => s.id === id)!;
      const out = evaluateDoctorReviewAdapter(
        doctorReviewInputFromScenario(scenario),
        doctorReviewContextFromScenario(scenario),
      );
      expect(out.issuanceEligibilityStatus).toBe('ISSUANCE_BLOCKED');
      expect(out.prescriptionIssueAllowed).toBe(false);
      expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
      expect(out.reasonCodes).toContain('APPROVAL_SUPERSEDED');
      const types = out.shadowAuditEvents.map((e) => e.eventType);
      expect(types).toContain('APPROVAL_SUPERSEDED');
      expect(out.doctorReviewStatus).not.toBe('ISSUED');
    },
  );

  it('review-version-conflict is idempotency-only (not supersession)', () => {
    const scenario = fixture.scenarios.find((s) => s.id === 'review-version-conflict')!;
    const out = evaluateDoctorReviewAdapter(
      doctorReviewInputFromScenario(scenario),
      doctorReviewContextFromScenario(scenario),
    );
    expect(out.reasonCodes).toContain('REVIEW_VERSION_CONFLICT');
    expect(out.reasonCodes).not.toContain('APPROVAL_SUPERSEDED');
  });
});
