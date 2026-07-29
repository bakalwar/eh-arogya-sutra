export {
  MANAGEMENT_CONTRACTS_VERSION,
  MANAGEMENT_SERVICES_STATUS,
  createNotConnectedManagementDashboard,
} from './dashboard.js';
export type {
  MetricDataSourceStatus,
  CurrencyCode,
  MetricTimeRange,
  ManagementMetric,
  ManagementDashboardContract,
} from './dashboard.js';

export { createNotConnectedDoctorSummary } from './doctor-management.js';
export type {
  DoctorVerificationStatus,
  DoctorSubscriptionStatus,
  DoctorAccountStatus,
  DoctorActivitySummary,
  DoctorSupportSummary,
  DoctorManagementSummary,
  DoctorManagementAction,
  DoctorManagementAuditEvent,
} from './doctor-management.js';

export { createNotConnectedRevenueSummary } from './payments.js';
export type {
  SubscriptionSummary,
  PaymentSummary,
  PaymentFailure,
  RefundSummary,
  RevenueSummary,
  MonthlyEarning,
  SettlementSummary,
  InvoiceSummary,
  ManualPaymentAdjustment,
} from './payments.js';

export {
  FeedbackCategory,
  FEEDBACK_CATEGORIES,
  SUPPORT_WORKFLOW_STATUSES,
  SECURITY_FEEDBACK_WORKFLOW,
} from './feedback.js';
export type {
  FeedbackCategoryName,
  FeedbackRating,
  FeedbackStatus,
  FeedbackModerationDecision,
  FeedbackReasonCode,
  FeedbackDiagnosticContext,
  FeedbackAttachmentConsent,
  TestimonialConsent,
  FeedbackAssignment,
  FeedbackResponse,
  FeedbackEscalation,
  FeedbackAuditEvent,
  DoctorFeedback,
  FeedbackSubmitDraft,
} from './feedback.js';

export {
  FEEDBACK_RULES_VERSION,
  DeterministicFeedbackValidator,
  DeterministicSpamDetector,
  DeterministicDuplicateDetector,
  DeterministicSensitiveDataDetector,
  DeterministicAbuseClassifier,
  DeterministicSecurityEscalationPolicy,
  FeedbackModerationService,
  InMemoryManagementAuditSink,
  evaluateTestimonialPublication,
} from './moderation.js';
export type {
  ModerationFinding,
  ModerationResult,
  FeedbackValidator,
  SpamDetector,
  DuplicateDetector,
  SensitiveDataDetector,
  AbuseClassifier,
  SecurityEscalationPolicy,
  FeedbackModerationServiceOptions,
  ManagementAuditEvent,
} from './moderation.js';

export {
  MANAGEMENT_ROUTES,
  MANAGEMENT_NAV_ITEMS,
  isManagementRoutePath,
  managementNavExcludesSuperAdminControls,
} from './navigation.js';
export type { ManagementRoutePath, ManagementNavItem } from './navigation.js';
