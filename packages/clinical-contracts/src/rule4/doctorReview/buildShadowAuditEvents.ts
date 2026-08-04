import { buildReviewAuditEvent } from './auditEvents.js';
import type {
  Rule4DoctorAction,
  Rule4DoctorReviewAdapterOutput,
  Rule4ReviewAuditEventType,
} from './types.js';

export function buildShadowAuditEvents(input: {
  doctorAction: Rule4DoctorAction;
  consultationId: string;
  draftVersion: string;
  doctorId: string;
  organizationId: string;
  clinicId: string;
  reviewTimestamp: string;
  decisionFingerprint: string;
  reasonCodes: readonly string[];
  output: Pick<
    Rule4DoctorReviewAdapterOutput,
    'doctorReviewStatus' | 'issuanceEligibilityStatus' | 'engineRevalidationStatus'
  >;
  superseded: boolean;
}): Array<ReturnType<typeof buildReviewAuditEvent>> {
  const events: Rule4ReviewAuditEventType[] = [];
  const { doctorAction, output, superseded } = input;

  if (doctorAction === 'MODIFY' || doctorAction === 'EXCLUDE_UNRESOLVED_SLOT') {
    events.push('MODIFICATION_PROPOSED');
    events.push('REVALIDATION_REQUIRED');
  }
  if (doctorAction === 'REJECT') {
    events.push('REVIEW_REJECTED');
  }
  if (doctorAction === 'REQUEST_REASSESSMENT') {
    events.push('REASSESSMENT_REQUESTED');
  }
  if (superseded) {
    events.push('APPROVAL_SUPERSEDED');
  }
  if (
    output.engineRevalidationStatus === 'REQUIRED_PENDING' ||
    output.engineRevalidationStatus === 'FAILED'
  ) {
    if (!events.includes('REVALIDATION_REQUIRED')) {
      events.push('REVALIDATION_REQUIRED');
    }
  }
  if (
    doctorAction === 'APPROVE' &&
    output.doctorReviewStatus === 'REVIEW_RECORDED' &&
    output.issuanceEligibilityStatus === 'ISSUANCE_ELIGIBLE'
  ) {
    events.push('APPROVAL_RECORDED');
  }
  if (output.issuanceEligibilityStatus === 'ISSUANCE_BLOCKED') {
    events.push('ISSUANCE_BLOCKED');
  }
  events.push('ISSUANCE_ELIGIBILITY_EVALUATED');

  const unique = [...new Set(events)];
  return unique.map((eventType) =>
    buildReviewAuditEvent({
      eventType,
      consultationId: input.consultationId,
      draftVersion: input.draftVersion,
      doctorId: input.doctorId,
      organizationId: input.organizationId,
      clinicId: input.clinicId,
      timestamp: input.reviewTimestamp,
      decisionFingerprint: input.decisionFingerprint,
      reasonCodes: input.reasonCodes,
    }),
  );
}
