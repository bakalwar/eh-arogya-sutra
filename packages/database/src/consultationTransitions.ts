import { InvalidConsultationTransitionError } from './domainErrors.js';

export const CONSULTATION_STATUSES = [
  'DRAFT',
  'IN_PROGRESS',
  'AWAITING_REPORT_VERIFICATION',
  'ANALYZED',
  'PENDING_CLINICIAN_REVIEW',
  'COMPLETED',
  'CANCELLED',
] as const;

export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

const ALLOWED: Record<ConsultationStatus, readonly ConsultationStatus[]> = {
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['AWAITING_REPORT_VERIFICATION', 'ANALYZED', 'CANCELLED'],
  AWAITING_REPORT_VERIFICATION: ['ANALYZED', 'IN_PROGRESS', 'CANCELLED'],
  ANALYZED: ['PENDING_CLINICIAN_REVIEW', 'CANCELLED'],
  PENDING_CLINICIAN_REVIEW: ['COMPLETED', 'ANALYZED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertValidConsultationTransition(
  from: ConsultationStatus,
  to: ConsultationStatus,
): void {
  if (!ALLOWED[from]?.includes(to)) {
    throw new InvalidConsultationTransitionError(`${from} -> ${to}`);
  }
}

export function isTerminalConsultationStatus(status: ConsultationStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/** Fields mutable only while consultation is not terminal. */
export function consultationAllowsFieldUpdate(status: ConsultationStatus): boolean {
  return (
    status === 'DRAFT' || status === 'IN_PROGRESS' || status === 'AWAITING_REPORT_VERIFICATION'
  );
}
