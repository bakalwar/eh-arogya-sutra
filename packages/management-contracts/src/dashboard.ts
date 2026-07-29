import { FoundationStatus, type FoundationStatusCode } from '@ehas2/shared';

export const MANAGEMENT_CONTRACTS_VERSION = '0.1.0-phase2am' as const;
export const MANAGEMENT_SERVICES_STATUS = FoundationStatus.NOT_CONNECTED;

export type MetricDataSourceStatus =
  | typeof FoundationStatus.NOT_IMPLEMENTED
  | typeof FoundationStatus.NOT_CONNECTED
  | 'AVAILABLE'
  | 'DEGRADED';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'UNKNOWN';

export type MetricTimeRange = {
  from: string | null;
  to: string | null;
  label: string;
};

/**
 * Every Management dashboard metric must carry definition + availability metadata.
 * Do not invent numeric values — use NOT_IMPLEMENTED / NOT_CONNECTED or truthful zero only.
 */
export type ManagementMetric<T = number | null> = {
  key: string;
  definition: string;
  timeRange: MetricTimeRange;
  currency?: CurrencyCode;
  value: T;
  lastUpdatedAt: string | null;
  dataSourceStatus: MetricDataSourceStatus;
  unavailableReason?: string;
};

export type ManagementDashboardContract = {
  status: FoundationStatusCode;
  message: string;
  generatedAt: string;
  metrics: {
    totalRegisteredDoctors: ManagementMetric;
    verifiedDoctors: ManagementMetric;
    verificationPending: ManagementMetric;
    activeDoctors: ManagementMetric;
    inactiveDoctors: ManagementMetric;
    trialDoctors: ManagementMetric;
    paidDoctors: ManagementMetric;
    pendingSubscriptions: ManagementMetric;
    expiredSubscriptions: ManagementMetric;
    successfulPayments: ManagementMetric;
    failedPayments: ManagementMetric;
    refunds: ManagementMetric;
    grossMonthlyRevenue: ManagementMetric;
    providerFees: ManagementMetric;
    refundsTotal: ManagementMetric;
    netMonthlyRevenue: ManagementMetric;
    openSupportTickets: ManagementMetric;
    overdueSupportTickets: ManagementMetric;
    feedbackCount: ManagementMetric;
    unresolvedDoctorProblems: ManagementMetric;
    referralCount: ManagementMetric;
    onboardingCompletion: ManagementMetric;
    privacySafeFeatureAdoption: ManagementMetric;
  };
};

function unavailableMetric(
  key: string,
  definition: string,
  currency?: CurrencyCode,
): ManagementMetric {
  return {
    key,
    definition,
    timeRange: { from: null, to: null, label: 'not_connected' },
    currency,
    value: null,
    lastUpdatedAt: null,
    dataSourceStatus: FoundationStatus.NOT_CONNECTED,
    unavailableReason: 'Management services are not connected.',
  };
}

/** Truthful empty dashboard shell — no invented figures. */
export function createNotConnectedManagementDashboard(
  generatedAt = new Date().toISOString(),
): ManagementDashboardContract {
  return {
    status: FoundationStatus.NOT_CONNECTED,
    message: 'Management services are not connected.',
    generatedAt,
    metrics: {
      totalRegisteredDoctors: unavailableMetric(
        'totalRegisteredDoctors',
        'Count of doctor accounts registered on the platform.',
      ),
      verifiedDoctors: unavailableMetric(
        'verifiedDoctors',
        'Doctors who completed verification review successfully.',
      ),
      verificationPending: unavailableMetric(
        'verificationPending',
        'Doctors awaiting verification review.',
      ),
      activeDoctors: unavailableMetric('activeDoctors', 'Doctors marked active for clinical use.'),
      inactiveDoctors: unavailableMetric(
        'inactiveDoctors',
        'Doctors marked inactive or suspended.',
      ),
      trialDoctors: unavailableMetric('trialDoctors', 'Doctors currently on free trial.'),
      paidDoctors: unavailableMetric('paidDoctors', 'Doctors on a paid subscription plan.'),
      pendingSubscriptions: unavailableMetric(
        'pendingSubscriptions',
        'Subscriptions awaiting activation or payment confirmation.',
      ),
      expiredSubscriptions: unavailableMetric(
        'expiredSubscriptions',
        'Subscriptions past end date without renewal.',
      ),
      successfulPayments: unavailableMetric(
        'successfulPayments',
        'Payments confirmed by provider evidence.',
      ),
      failedPayments: unavailableMetric(
        'failedPayments',
        'Payments that failed provider confirmation.',
      ),
      refunds: unavailableMetric('refunds', 'Refund cases in controlled refund workflow.'),
      grossMonthlyRevenue: unavailableMetric(
        'grossMonthlyRevenue',
        'Gross collected revenue for the calendar month before fees/refunds.',
        'INR',
      ),
      providerFees: unavailableMetric(
        'providerFees',
        'Payment provider fees for the calendar month.',
        'INR',
      ),
      refundsTotal: unavailableMetric(
        'refundsTotal',
        'Total refunded amount for the calendar month.',
        'INR',
      ),
      netMonthlyRevenue: unavailableMetric(
        'netMonthlyRevenue',
        'Gross minus provider fees minus refunds for the calendar month.',
        'INR',
      ),
      openSupportTickets: unavailableMetric(
        'openSupportTickets',
        'Support tickets not yet resolved or closed.',
      ),
      overdueSupportTickets: unavailableMetric(
        'overdueSupportTickets',
        'Open tickets past SLA target.',
      ),
      feedbackCount: unavailableMetric('feedbackCount', 'Doctor feedback submissions in range.'),
      unresolvedDoctorProblems: unavailableMetric(
        'unresolvedDoctorProblems',
        'Doctor-reported problems still open.',
      ),
      referralCount: unavailableMetric('referralCount', 'Verified referral events in range.'),
      onboardingCompletion: unavailableMetric(
        'onboardingCompletion',
        'Share of doctors completing onboarding steps (privacy-safe).',
      ),
      privacySafeFeatureAdoption: unavailableMetric(
        'privacySafeFeatureAdoption',
        'Privacy-safe feature adoption aggregates (no PHI).',
      ),
    },
  };
}
