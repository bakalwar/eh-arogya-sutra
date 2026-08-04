import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalStableDumps } from '../../packages/clinical-contracts/src/rule4/canonicalJson.js';
import { evaluateDoctorReviewAdapter } from '../../packages/clinical-contracts/src/rule4/doctorReview/evaluateDoctorReviewAdapter.js';
import { buildReviewAuditEvent } from '../../packages/clinical-contracts/src/rule4/doctorReview/auditEvents.js';
import { rule4ReviewAuditEventFingerprintV1Hash } from '../../packages/clinical-contracts/src/rule4/doctorReview/doctorReviewFingerprintV1.js';
import {
  doctorReviewContextFromScenario,
  doctorReviewInputFromScenario,
  loadRule4DoctorReviewFixture,
} from './rule4-doctor-review-fixture-loader.ts';

describe('Rule 4 Phase 10 audit event fingerprint golden refs', () => {
  const fixture = loadRule4DoctorReviewFixture();
  const refs = fixture.auditEventFingerprintV1References ?? [];

  it.each(refs.map((r) => [r.reference_id, r] as const))('audit ref %s', (_id, ref) => {
    const scenario = fixture.scenarios.find((s) => s.id === ref.scenario_id)!;
    const input = doctorReviewInputFromScenario(scenario);
    const out = evaluateDoctorReviewAdapter(input, doctorReviewContextFromScenario(scenario));
    const event = out.shadowAuditEvents.find((e) => e.eventType === ref.event_type);
    expect(event).toBeDefined();
    const canon = canonicalStableDumps({
      fingerprint_version: 'rule4-review-audit-event-fingerprint-v1',
      clinic_id: event!.clinicId,
      consultation_id: event!.consultationId,
      decision_fingerprint: event!.decisionFingerprint,
      doctor_id: event!.doctorId,
      draft_version: event!.draftVersion,
      event_type: event!.eventType,
      organization_id: event!.organizationId,
      reason_codes: [...event!.reasonCodes].sort(),
      timestamp: event!.timestamp,
    });
    expect(ref.canonical_payload).toBe(canon);
    expect(event!.auditEventFingerprint).toBe(ref.audit_event_sha256.toUpperCase());
    const digest = createHash('sha256')
      .update(ref.canonical_payload, 'utf8')
      .digest('hex')
      .toUpperCase();
    expect(digest).toBe(ref.audit_event_sha256.toUpperCase());
  });
});

describe('Rule 4 Phase 10 audit event determinism', () => {
  it('same input yields identical audit event fingerprint', () => {
    const fixture = loadRule4DoctorReviewFixture();
    const scenario = fixture.scenarios.find((s) => s.id === 'valid-adult-approve')!;
    const input = doctorReviewInputFromScenario(scenario);
    const ctx = doctorReviewContextFromScenario(scenario);
    const a = evaluateDoctorReviewAdapter(input, ctx);
    const b = evaluateDoctorReviewAdapter(input, ctx);
    const ea = a.shadowAuditEvents.find((e) => e.eventType === 'APPROVAL_RECORDED')!;
    const eb = b.shadowAuditEvents.find((e) => e.eventType === 'APPROVAL_RECORDED')!;
    expect(ea.auditEventFingerprint).toBe(eb.auditEventFingerprint);
  });

  it('actor change alters audit event fingerprint', () => {
    const fixture = loadRule4DoctorReviewFixture();
    const scenario = fixture.scenarios.find((s) => s.id === 'valid-adult-approve')!;
    const baseIn = doctorReviewInputFromScenario(scenario);
    const ctx = doctorReviewContextFromScenario(scenario);
    const out = evaluateDoctorReviewAdapter(baseIn, ctx);
    const fp = out.deterministicDoctorReviewFingerprint;
    const ra = baseIn.reviewerAuthority;
    const base = buildReviewAuditEvent({
      eventType: 'APPROVAL_RECORDED',
      consultationId: baseIn.consultationId,
      draftVersion: baseIn.draftVersion,
      doctorId: ra.doctorId,
      organizationId: ra.organizationId,
      clinicId: ra.clinicId,
      timestamp: ra.reviewTimestamp,
      decisionFingerprint: fp,
      reasonCodes: out.reasonCodes,
    });
    const tampered = buildReviewAuditEvent({
      ...{
        eventType: 'APPROVAL_RECORDED' as const,
        consultationId: baseIn.consultationId,
        draftVersion: baseIn.draftVersion,
        doctorId: 'dr-other',
        organizationId: ra.organizationId,
        clinicId: ra.clinicId,
        timestamp: ra.reviewTimestamp,
        decisionFingerprint: fp,
        reasonCodes: out.reasonCodes,
      },
    });
    expect(base.auditEventFingerprint).not.toBe(tampered.auditEventFingerprint);
    expect(rule4ReviewAuditEventFingerprintV1Hash).toBeDefined();
  });
});
