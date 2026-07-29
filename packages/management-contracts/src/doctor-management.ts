import { FoundationStatus, type FoundationStatusCode } from '@ehas2/shared';

export type DoctorVerificationStatus =
  'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'NOT_CONNECTED';

export type DoctorSubscriptionStatus =
  'NONE' | 'TRIAL' | 'ACTIVE_PAID' | 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'NOT_CONNECTED';

export type DoctorAccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'NOT_CONNECTED';

export type DoctorActivitySummary = {
  status: FoundationStatusCode;
  lastActiveAt: string | null;
  casesStartedCount: number | null;
  note: string;
};

export type DoctorSupportSummary = {
  status: FoundationStatusCode;
  openTickets: number | null;
  openFeedback: number | null;
  note: string;
};

/** Safe management profile — no patient records, clinical notes, OTP, or prescriptions. */
export type DoctorManagementSummary = {
  doctorId: string;
  displayNameSafe: string;
  clinicTenantId: string | null;
  accountStatus: DoctorAccountStatus;
  verificationStatus: DoctorVerificationStatus;
  subscriptionStatus: DoctorSubscriptionStatus;
  activity: DoctorActivitySummary;
  support: DoctorSupportSummary;
  dataSourceStatus: FoundationStatusCode;
};

export type DoctorManagementAction =
  | 'VIEW_SAFE_PROFILE'
  | 'VERIFICATION_REVIEW'
  | 'STATUS_MANAGE'
  | 'SUBSCRIPTION_VIEW'
  | 'SUPPORT_VIEW'
  | 'ACTIVITY_SUMMARY_VIEW';

export type DoctorManagementAuditEvent = {
  eventId: string;
  actorId: string;
  actorRole: string;
  scope: 'platform' | 'tenant';
  tenantId: string | null;
  action: DoctorManagementAction | string;
  targetDoctorId: string;
  previousState: string | null;
  newState: string | null;
  reason: string;
  timestamp: string;
  requestId: string;
  approvalMetadata?: Record<string, string>;
  result: 'allowed' | 'denied' | 'error' | 'not_implemented';
};

export function createNotConnectedDoctorSummary(doctorId: string): DoctorManagementSummary {
  return {
    doctorId,
    displayNameSafe: 'NOT_CONNECTED',
    clinicTenantId: null,
    accountStatus: 'NOT_CONNECTED',
    verificationStatus: 'NOT_CONNECTED',
    subscriptionStatus: 'NOT_CONNECTED',
    activity: {
      status: FoundationStatus.NOT_CONNECTED,
      lastActiveAt: null,
      casesStartedCount: null,
      note: 'Management services are not connected.',
    },
    support: {
      status: FoundationStatus.NOT_CONNECTED,
      openTickets: null,
      openFeedback: null,
      note: 'Management services are not connected.',
    },
    dataSourceStatus: FoundationStatus.NOT_CONNECTED,
  };
}
