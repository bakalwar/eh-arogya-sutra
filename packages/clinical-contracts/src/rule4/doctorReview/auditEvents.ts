import { rule4ReviewAuditEventFingerprintV1Hash } from './doctorReviewFingerprintV1.js';
import type { Rule4ReviewAuditEvent, Rule4ReviewAuditEventType } from './types.js';

export function buildReviewAuditEvent(input: {
  eventType: Rule4ReviewAuditEventType;
  consultationId: string;
  draftVersion: string;
  doctorId: string;
  organizationId: string;
  clinicId: string;
  timestamp: string;
  reasonCodes: readonly string[];
  decisionFingerprint: string;
}): Rule4ReviewAuditEvent & { auditEventFingerprint: string } {
  const base: Rule4ReviewAuditEvent = {
    eventType: input.eventType,
    consultationId: input.consultationId,
    draftVersion: input.draftVersion,
    doctorId: input.doctorId,
    organizationId: input.organizationId,
    clinicId: input.clinicId,
    timestamp: input.timestamp,
    decisionFingerprint: input.decisionFingerprint,
    reasonCodes: [...input.reasonCodes].sort(),
  };
  const auditEventFingerprint = rule4ReviewAuditEventFingerprintV1Hash({
    clinic_id: input.clinicId,
    consultation_id: input.consultationId,
    decision_fingerprint: input.decisionFingerprint,
    doctor_id: input.doctorId,
    draft_version: input.draftVersion,
    event_type: input.eventType,
    organization_id: input.organizationId,
    reason_codes: base.reasonCodes,
    timestamp: input.timestamp,
  });
  return { ...base, auditEventFingerprint };
}
