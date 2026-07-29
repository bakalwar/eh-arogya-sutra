/** Doctor feedback contracts — no patient content by default. */

export const FeedbackCategory = {
  Appreciation: 'Appreciation',
  Suggestion: 'Suggestion',
  Bug: 'Bug',
  DifficultyUsingApp: 'Difficulty Using App',
  PaymentProblem: 'Payment Problem',
  ReportUploadProblem: 'Report Upload Problem',
  PrescriptionDisplayProblem: 'Prescription Display Problem',
  AccountLoginProblem: 'Account/Login Problem',
  PerformanceProblem: 'Performance Problem',
  Other: 'Other',
} as const;

export type FeedbackCategoryName = (typeof FeedbackCategory)[keyof typeof FeedbackCategory];

export type FeedbackRating = 1 | 2 | 3 | 4 | 5 | null;

export type FeedbackStatus =
  | 'SUBMITTED'
  | 'VALIDATED'
  | 'ACCEPTED_PRIVATE'
  | 'NEEDS_REVIEW'
  | 'ASSIGNED'
  | 'INVESTIGATING'
  | 'WAITING_FOR_DOCTOR'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'SPAM_REJECTED'
  | 'DUPLICATE_LINKED'
  | 'ABUSIVE_QUARANTINED'
  | 'SECURITY_ESCALATED'
  | 'SUPPORT_TICKET_CREATED'
  | 'PUBLICATION_CONSENT_REQUIRED'
  | 'PUBLISHED_TESTIMONIAL'
  | 'REJECTED_WITH_REASON'
  | 'NOT_CONNECTED';

export type FeedbackModerationDecision =
  | 'ACCEPTED_PRIVATE'
  | 'NEEDS_REVIEW'
  | 'SPAM_REJECTED'
  | 'DUPLICATE_LINKED'
  | 'ABUSIVE_QUARANTINED'
  | 'SECURITY_ESCALATED'
  | 'SUPPORT_TICKET_CREATED'
  | 'PUBLICATION_CONSENT_REQUIRED'
  | 'PUBLISHED_TESTIMONIAL'
  | 'REJECTED_WITH_REASON';

export type FeedbackReasonCode =
  | 'VALID_FEEDBACK'
  | 'EMPTY_SUBMISSION'
  | 'MEANINGLESS_SUBMISSION'
  | 'AUTOMATED_SPAM'
  | 'EXACT_DUPLICATE_FLOOD'
  | 'MALICIOUS_PAYLOAD'
  | 'PROHIBITED_EXECUTABLE'
  | 'LOW_CONFIDENCE'
  | 'ABUSE_QUARANTINE'
  | 'SECURITY_SIGNAL'
  | 'TESTIMONIAL_CONSENT_MISSING'
  | 'NEGATIVE_ACCEPTED_PRIVATE'
  | 'POSITIVE_PRIVATE_ONLY'
  | 'TRANSMISSION_NOT_CONNECTED';

export type FeedbackDiagnosticContext = {
  appVersion: string | null;
  routeTemplate: string | null;
  timestamp: string;
  browserDeviceClass: string | null;
  safeErrorCode: string | null;
  requestId: string | null;
  tenantId: string | null;
};

export type FeedbackAttachmentConsent = {
  screenshotConsent: boolean;
  /** Off by default — never auto-attach clinical screenshots. */
};

export type TestimonialConsent = {
  publicTestimonialConsent: boolean;
  /** Doctor must explicitly opt in; default false. */
  withdrawable: true;
  publicationRequiresManualApproval: true;
};

export type FeedbackAssignment = {
  assignedTeam: string | null;
  assignedTo: string | null;
  assignedAt: string | null;
};

export type FeedbackResponse = {
  responseId: string;
  bodySafe: string;
  authorRole: string;
  createdAt: string;
};

export type FeedbackEscalation = {
  escalated: boolean;
  escalationKind: 'none' | 'support' | 'security';
  /** Safe status for Management Admin — never raw attack details. */
  safeStatus: string;
  securityIncidentRef: string | null;
};

export type FeedbackAuditEvent = {
  eventId: string;
  feedbackId: string;
  actorId: string;
  actorRole: string;
  action: string;
  previousStatus: FeedbackStatus | null;
  newStatus: FeedbackStatus | null;
  reasonCode: FeedbackReasonCode | null;
  timestamp: string;
  requestId: string;
  result: string;
};

export type DoctorFeedback = {
  feedbackId: string;
  doctorPrincipalId: string;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  category: FeedbackCategoryName;
  rating: FeedbackRating;
  title: string;
  description: string;
  affectedFeatureOrPage: string;
  problemOrSuggestion: 'problem' | 'suggestion' | 'other';
  reproducibility: 'always' | 'sometimes' | 'once' | 'unknown';
  attachmentConsent: FeedbackAttachmentConsent;
  contactPermission: boolean;
  testimonialConsent: TestimonialConsent;
  status: FeedbackStatus;
  moderationDecision: FeedbackModerationDecision | null;
  moderationReasonCode: FeedbackReasonCode | null;
  moderationConfidence: number | null;
  moderationRulesVersion: string | null;
  assigned: FeedbackAssignment;
  supportTicketId: string | null;
  escalation: FeedbackEscalation;
  diagnostics: FeedbackDiagnosticContext;
  /** Explicitly absent — never embed patient content. */
  patientContentPresent: false;
};

export type FeedbackSubmitDraft = {
  category: FeedbackCategoryName;
  rating?: FeedbackRating;
  title: string;
  description: string;
  affectedFeatureOrPage: string;
  problemOrSuggestion: 'problem' | 'suggestion' | 'other';
  reproducibility: 'always' | 'sometimes' | 'once' | 'unknown';
  screenshotConsent?: boolean;
  contactPermission?: boolean;
  publicTestimonialConsent?: boolean;
  diagnostics?: Partial<FeedbackDiagnosticContext>;
};

export const FEEDBACK_CATEGORIES: readonly FeedbackCategoryName[] = Object.values(FeedbackCategory);

export const SUPPORT_WORKFLOW_STATUSES: readonly FeedbackStatus[] = [
  'SUBMITTED',
  'VALIDATED',
  'ACCEPTED_PRIVATE',
  'NEEDS_REVIEW',
  'ASSIGNED',
  'INVESTIGATING',
  'WAITING_FOR_DOCTOR',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
];

export const SECURITY_FEEDBACK_WORKFLOW: readonly FeedbackStatus[] = [
  'SUBMITTED',
  'SECURITY_ESCALATED',
];
