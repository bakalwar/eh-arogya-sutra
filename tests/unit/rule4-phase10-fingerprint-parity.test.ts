import { describe, expect, it } from 'vitest';
import { evaluateDoctorReviewAdapter } from '../../packages/clinical-contracts/src/rule4/doctorReview/evaluateDoctorReviewAdapter.js';
import {
  rule4DoctorReviewFingerprintV1Hash,
  rule4DoctorReviewFingerprintV1Payload,
} from '../../packages/clinical-contracts/src/rule4/doctorReview/doctorReviewFingerprintV1.js';
import { RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE } from '../../packages/clinical-contracts/src/rule4/version.js';
import {
  doctorReviewContextFromScenario,
  doctorReviewInputFromScenario,
  loadRule4DoctorReviewFixture,
} from './rule4-doctor-review-fixture-loader.ts';

describe('Rule 4 Phase 10 fingerprint golden refs', () => {
  const fixture = loadRule4DoctorReviewFixture();

  it.each(fixture.fingerprintV1References.map((r) => [r.reference_id, r] as const))(
    (_refId, ref) => {
      const scenario = fixture.scenarios.find((s) => s.id === ref.scenario_id)!;
      const input = doctorReviewInputFromScenario(scenario);
      const out = evaluateDoctorReviewAdapter(input, doctorReviewContextFromScenario(scenario));
      const payload = rule4DoctorReviewFingerprintV1Payload({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        doctorAction: input.doctorAction,
        consultationId: input.consultationId,
        draftVersion: input.draftVersion,
        doctorId: input.reviewerAuthority.doctorId,
        output: out,
      });
      expect(payload).toBe(ref.canonical_payload);
      const digest = rule4DoctorReviewFingerprintV1Hash({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        doctorAction: input.doctorAction,
        consultationId: input.consultationId,
        draftVersion: input.draftVersion,
        doctorId: input.reviewerAuthority.doctorId,
        output: out,
      });
      expect(digest).toBe(ref.doctor_review_sha256.toUpperCase());
      expect(out.deterministicDoctorReviewFingerprint).toBe(digest);
    },
  );
});

describe('Rule 4 Phase 10 fingerprint tamper resistance', () => {
  it('actor and consultation binding change digest', () => {
    const fixture = loadRule4DoctorReviewFixture();
    const scenario = fixture.scenarios.find((s) => s.id === 'valid-adult-approve')!;
    const baseIn = doctorReviewInputFromScenario(scenario);
    const ctx = doctorReviewContextFromScenario(scenario);
    const a = evaluateDoctorReviewAdapter(baseIn, ctx);
    const b = evaluateDoctorReviewAdapter(
      {
        ...baseIn,
        consultationId: 'cons-tampered',
        reviewerAuthority: { ...baseIn.reviewerAuthority, consultationId: 'cons-tampered' },
      },
      ctx,
    );
    expect(a.deterministicDoctorReviewFingerprint).not.toBe(b.deterministicDoctorReviewFingerprint);
  });

  it('wrong contract version rejected', () => {
    const fixture = loadRule4DoctorReviewFixture();
    const scenario = fixture.scenarios[0]!;
    const input = doctorReviewInputFromScenario(scenario);
    expect(() =>
      evaluateDoctorReviewAdapter(
        { ...input, contractVersion: RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE + '-x' },
        doctorReviewContextFromScenario(scenario),
      ),
    ).toThrow();
  });
});
