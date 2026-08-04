import { describe, expect, it } from 'vitest';
import { evaluateDoctorReviewAdapter } from '../../packages/clinical-contracts/src/rule4/doctorReview/evaluateDoctorReviewAdapter.js';
import { RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE } from '../../packages/clinical-contracts/src/rule4/version.js';
import { RULE4_PHASE10_REASON_CODE_REGISTRY } from '../../packages/clinical-contracts/src/rule4/reasonCodesPhase10.js';
import { assertKnownRule4ReasonCode } from '../../packages/clinical-contracts/src/rule4/reasonCodes.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REGISTRY = 'rule4-reason-codes-phase10-doctor-review-issuance-subset-v1';

function fullAuthenticity(overrides: Record<string, string> = {}) {
  return {
    draftVersion: 'dv-1',
    draftContentHash: 'hash-1',
    slotManifestFingerprint: 'slot-fp-1',
    evidenceFingerprint: 'ev-fp-1',
    polarityFingerprint: 'pol-fp-1',
    phaseFingerprint: 'phase-fp-1',
    severityFingerprint: 'sev-fp-1',
    eligibilityFingerprint: 'elig-fp-1',
    selectionFingerprint: 'sel-fp-1',
    pediatricFingerprint: 'ped-fp-1',
    clinicalSummaryFingerprint: 'sum-fp-1',
    rulesetVersion: RULESET,
    registryVersion: REGISTRY,
    ...overrides,
  };
}

function baseInput(overrides: Partial<Parameters<typeof evaluateDoctorReviewAdapter>[0]> = {}) {
  const auth = fullAuthenticity();
  return {
    contractVersion: RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE,
    rulesetVersion: RULESET,
    registryVersion: REGISTRY,
    label: 'SYNTHETIC' as const,
    consultationId: 'cons-1',
    draftVersion: 'dv-1',
    doctorAction: 'APPROVE' as const,
    slotManifest: [
      {
        formulaSlotId: 's1',
        formulaTargetId: 't1',
        medicated: true,
        slotPotencyStatus: 'RESOLVED_DRAFT',
        selectedDilution: '30C',
      },
    ],
    reviewerAuthority: {
      doctorId: 'dr-1',
      organizationId: 'org-1',
      clinicId: 'clinic-1',
      consultationId: 'cons-1',
      actorRole: 'DOCTOR',
      activeMembership: true,
      treatingDoctorBound: true,
      sessionAuthenticated: true,
      reviewTimestamp: '2026-04-01T12:00:00Z',
      professionalRegistrationVerified: true,
    },
    draftAuthenticity: auth,
    ...overrides,
  };
}

function binding() {
  return {
    consultationId: 'cons-1',
    doctorId: 'dr-1',
    organizationId: 'org-1',
    clinicId: 'clinic-1',
  };
}

describe('Rule 4 Phase 10 expected authenticity fail-closed', () => {
  it('missing expectedAuthenticity blocks APPROVE eligibility', () => {
    const out = evaluateDoctorReviewAdapter(baseInput(), { upstream: {} });
    expect(out.issuanceEligibilityStatus).toBe('ISSUANCE_BLOCKED');
    expect(out.prescriptionIssueAllowed).toBe(false);
    expect(out.reasonCodes).toContain('EXPECTED_DRAFT_AUTHENTICITY_MISSING');
    const evidence = out.issuanceGateResults.find((g) => g.gateId === 'EVIDENCE_CURRENT');
    expect(evidence?.outcome).toBe('MISSING_INPUT');
  });

  it('partial expected selection fingerprint blocks', () => {
    const expected = fullAuthenticity({ selectionFingerprint: '' });
    const out = evaluateDoctorReviewAdapter(baseInput(), {
      expectedAuthenticity: expected,
      expectedReviewerBinding: binding(),
    });
    expect(out.issuanceEligibilityStatus).toBe('ISSUANCE_BLOCKED');
    expect(out.reasonCodes).toContain('EXPECTED_AUTHENTICITY_FIELD_MISSING');
  });

  it('complete expected authenticity allows ISSUANCE_ELIGIBLE', () => {
    const auth = fullAuthenticity();
    const out = evaluateDoctorReviewAdapter(baseInput({ draftAuthenticity: auth }), {
      expectedAuthenticity: auth,
      expectedReviewerBinding: binding(),
    });
    expect(out.issuanceEligibilityStatus).toBe('ISSUANCE_ELIGIBLE');
    expect(out.shadowAuditEvents.map((e) => e.eventType)).toContain('APPROVAL_RECORDED');
  });

  it('content hash mismatch emits APPROVAL_SUPERSEDED', () => {
    const expected = fullAuthenticity();
    const out = evaluateDoctorReviewAdapter(
      baseInput({ draftAuthenticity: fullAuthenticity({ draftContentHash: 'hash-new' }) }),
      { expectedAuthenticity: expected, expectedReviewerBinding: binding() },
    );
    expect(out.reasonCodes).toContain('APPROVAL_SUPERSEDED');
    expect(out.shadowAuditEvents.map((e) => e.eventType)).toContain('APPROVAL_SUPERSEDED');
  });

  it('ClinicAdmin remains blocked', () => {
    const auth = fullAuthenticity();
    const out = evaluateDoctorReviewAdapter(
      baseInput({
        draftAuthenticity: auth,
        reviewerAuthority: {
          ...baseInput().reviewerAuthority,
          actorRole: 'CLINIC_ADMIN',
        },
      }),
      { expectedAuthenticity: auth, expectedReviewerBinding: binding() },
    );
    expect(out.issuanceEligibilityStatus).toBe('ISSUANCE_BLOCKED');
    expect(out.reasonCodes).toContain('CLINIC_ADMIN_CLINICAL_APPROVAL_FORBIDDEN');
  });

  it('PRODUCTION remains NOT_CONNECTED', () => {
    const auth = fullAuthenticity();
    const out = evaluateDoctorReviewAdapter(
      baseInput({ label: 'PRODUCTION', draftAuthenticity: auth }),
      {
        expectedAuthenticity: auth,
        expectedReviewerBinding: binding(),
      },
    );
    expect(out.issuanceEligibilityStatus).toBe('ISSUANCE_BLOCKED');
    expect(out.reasonCodes).toContain('PRODUCTION_DOCTOR_REVIEW_NOT_EVALUATED');
  });

  it('MODIFY emits modification audit events', () => {
    const auth = fullAuthenticity();
    const out = evaluateDoctorReviewAdapter(
      baseInput({
        doctorAction: 'MODIFY',
        modificationEnvelope: {
          originalDraftFingerprint: auth.draftContentHash,
          proposedDraftVersion: 'dv-2',
          justification: 'Clinical adjustment',
          changes: [],
        },
      }),
      { expectedAuthenticity: auth, expectedReviewerBinding: binding() },
    );
    const types = out.shadowAuditEvents.map((e) => e.eventType);
    expect(types).toContain('MODIFICATION_PROPOSED');
    expect(types).toContain('REVALIDATION_REQUIRED');
  });
});

describe('Rule 4 Phase 10 registry executable codes', () => {
  it.each(RULE4_PHASE10_REASON_CODE_REGISTRY.map((e) => e.code))(
    'phase10 code %s is known',
    (code) => {
      expect(() => assertKnownRule4ReasonCode(code)).not.toThrow();
    },
  );
});
