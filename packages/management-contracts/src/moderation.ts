import { FoundationStatus } from '@ehas2/shared';
import type {
  DoctorFeedback,
  FeedbackModerationDecision,
  FeedbackReasonCode,
  FeedbackSubmitDraft,
  FeedbackStatus,
} from './feedback.js';
import { FeedbackCategory } from './feedback.js';

export type ModerationFinding = {
  reasonCode: FeedbackReasonCode;
  confidence: number;
  rulesVersion: string;
  detail: string;
};

export type ModerationResult = {
  decision: FeedbackModerationDecision;
  status: FeedbackStatus;
  reasonCode: FeedbackReasonCode;
  confidence: number;
  rulesVersion: string;
  humanReviewRequired: boolean;
  appealPath: 'support_reconsideration';
  auditNote: string;
  escalation: DoctorFeedback['escalation'];
  publishTestimonial: boolean;
};

export interface FeedbackValidator {
  validate(draft: FeedbackSubmitDraft): ModerationFinding | null;
}

export interface SpamDetector {
  detect(draft: FeedbackSubmitDraft): ModerationFinding | null;
}

export interface DuplicateDetector {
  detect(
    draft: FeedbackSubmitDraft,
    recentExactHashes: ReadonlySet<string>,
  ): ModerationFinding | null;
}

export interface SensitiveDataDetector {
  detect(draft: FeedbackSubmitDraft): ModerationFinding | null;
}

export interface AbuseClassifier {
  classify(draft: FeedbackSubmitDraft): ModerationFinding | null;
}

export interface SecurityEscalationPolicy {
  shouldEscalate(draft: FeedbackSubmitDraft): ModerationFinding | null;
}

export const FEEDBACK_RULES_VERSION = 'deterministic-v1' as const;

const EXECUTABLE_HINT =
  /\b(cmd\.exe|powershell|wget\s+http|curl\s+http|<script|javascript:|data:text\/html)\b/i;
const MALICIOUS_LINK = /\bhttps?:\/\/[^\s]+/i;
const SECURITY_HINT =
  /\b(sql\s*injection|xss|ransomware|credential\s*stuff|breach|exploit\s*payload)\b/i;
const ABUSE_HINT = /\b(kill\s+you|bomb\s+threat|i\s+will\s+hack)\b/i;

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

function hashDraft(draft: FeedbackSubmitDraft): string {
  return normalizeText(`${draft.category}|${draft.title}|${draft.description}`);
}

export class DeterministicFeedbackValidator implements FeedbackValidator {
  validate(draft: FeedbackSubmitDraft): ModerationFinding | null {
    const title = draft.title?.trim() ?? '';
    const description = draft.description?.trim() ?? '';
    if (!title || !description) {
      return {
        reasonCode: 'EMPTY_SUBMISSION',
        confidence: 1,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Title and description are required.',
      };
    }
    if (title.length < 3 || description.length < 8) {
      return {
        reasonCode: 'MEANINGLESS_SUBMISSION',
        confidence: 0.95,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Submission too short to be meaningful.',
      };
    }
    if (!Object.values(FeedbackCategory).includes(draft.category)) {
      return {
        reasonCode: 'MEANINGLESS_SUBMISSION',
        confidence: 1,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Unknown category.',
      };
    }
    return null;
  }
}

export class DeterministicSpamDetector implements SpamDetector {
  detect(draft: FeedbackSubmitDraft): ModerationFinding | null {
    const text = `${draft.title} ${draft.description}`;
    if (/(.)\1{12,}/.test(text) || /\b(buy now|crypto airdrop|viagra)\b/i.test(text)) {
      return {
        reasonCode: 'AUTOMATED_SPAM',
        confidence: 0.92,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'High-confidence spam pattern.',
      };
    }
    return null;
  }
}

export class DeterministicDuplicateDetector implements DuplicateDetector {
  detect(
    draft: FeedbackSubmitDraft,
    recentExactHashes: ReadonlySet<string>,
  ): ModerationFinding | null {
    const h = hashDraft(draft);
    if (recentExactHashes.has(h)) {
      return {
        reasonCode: 'EXACT_DUPLICATE_FLOOD',
        confidence: 1,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Exact duplicate of a recent submission.',
      };
    }
    return null;
  }
}

export class DeterministicSensitiveDataDetector implements SensitiveDataDetector {
  detect(draft: FeedbackSubmitDraft): ModerationFinding | null {
    const text = `${draft.title} ${draft.description} ${draft.affectedFeatureOrPage}`;
    if (EXECUTABLE_HINT.test(text)) {
      return {
        reasonCode: 'PROHIBITED_EXECUTABLE',
        confidence: 0.97,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Prohibited executable content pattern.',
      };
    }
    if (/\b(otp\s*[:=]|password\s*[:=]|bearer\s+[a-z0-9._-]{20,})\b/i.test(text)) {
      return {
        reasonCode: 'MALICIOUS_PAYLOAD',
        confidence: 0.9,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Credential-like payload detected.',
      };
    }
    // Ambiguous clinical/PHI-looking free text → human review, not auto-reject.
    if (/\b(mrn|patient\s+id\s*[:=]|diagnosis\s*[:=])/i.test(text)) {
      return {
        reasonCode: 'LOW_CONFIDENCE',
        confidence: 0.45,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Possible sensitive clinical identifiers — needs review.',
      };
    }
    return null;
  }
}

export class DeterministicAbuseClassifier implements AbuseClassifier {
  classify(draft: FeedbackSubmitDraft): ModerationFinding | null {
    const text = `${draft.title} ${draft.description}`;
    if (ABUSE_HINT.test(text)) {
      return {
        reasonCode: 'ABUSE_QUARANTINE',
        confidence: 0.88,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail: 'Threatening language — quarantine, do not discard.',
      };
    }
    return null;
  }
}

export class DeterministicSecurityEscalationPolicy implements SecurityEscalationPolicy {
  shouldEscalate(draft: FeedbackSubmitDraft): ModerationFinding | null {
    const text = `${draft.title} ${draft.description}`;
    if (
      SECURITY_HINT.test(text) ||
      (MALICIOUS_LINK.test(text) && /\b(exploit|payload|hack)\b/i.test(text))
    ) {
      return {
        reasonCode: 'SECURITY_SIGNAL',
        confidence: 0.85,
        rulesVersion: FEEDBACK_RULES_VERSION,
        detail:
          'Security-related feedback — escalate without exposing attack details to Management UI.',
      };
    }
    return null;
  }
}

export type FeedbackModerationServiceOptions = {
  recentExactHashes?: ReadonlySet<string>;
  validator?: FeedbackValidator;
  spamDetector?: SpamDetector;
  duplicateDetector?: DuplicateDetector;
  sensitiveDataDetector?: SensitiveDataDetector;
  abuseClassifier?: AbuseClassifier;
  securityPolicy?: SecurityEscalationPolicy;
};

/**
 * Provider-neutral moderation — deterministic rules only in Phase 2A-M.
 * No AI moderation provider. Valid negative feedback is accepted privately.
 * Positive feedback is never auto-published.
 */
export class FeedbackModerationService {
  private readonly validator: FeedbackValidator;
  private readonly spamDetector: SpamDetector;
  private readonly duplicateDetector: DuplicateDetector;
  private readonly sensitiveDataDetector: SensitiveDataDetector;
  private readonly abuseClassifier: AbuseClassifier;
  private readonly securityPolicy: SecurityEscalationPolicy;
  private readonly recentExactHashes: ReadonlySet<string>;

  constructor(options: FeedbackModerationServiceOptions = {}) {
    this.validator = options.validator ?? new DeterministicFeedbackValidator();
    this.spamDetector = options.spamDetector ?? new DeterministicSpamDetector();
    this.duplicateDetector = options.duplicateDetector ?? new DeterministicDuplicateDetector();
    this.sensitiveDataDetector =
      options.sensitiveDataDetector ?? new DeterministicSensitiveDataDetector();
    this.abuseClassifier = options.abuseClassifier ?? new DeterministicAbuseClassifier();
    this.securityPolicy = options.securityPolicy ?? new DeterministicSecurityEscalationPolicy();
    this.recentExactHashes = options.recentExactHashes ?? new Set();
  }

  moderate(draft: FeedbackSubmitDraft): ModerationResult {
    const empty = this.validator.validate(draft);
    if (
      empty &&
      (empty.reasonCode === 'EMPTY_SUBMISSION' || empty.reasonCode === 'MEANINGLESS_SUBMISSION')
    ) {
      return this.reject(empty, 'REJECTED_WITH_REASON');
    }

    const spam = this.spamDetector.detect(draft);
    if (spam && spam.confidence >= 0.9) {
      return this.reject(spam, 'SPAM_REJECTED');
    }

    const dup = this.duplicateDetector.detect(draft, this.recentExactHashes);
    if (dup) {
      return {
        decision: 'DUPLICATE_LINKED',
        status: 'DUPLICATE_LINKED',
        reasonCode: dup.reasonCode,
        confidence: dup.confidence,
        rulesVersion: dup.rulesVersion,
        humanReviewRequired: true,
        appealPath: 'support_reconsideration',
        auditNote: dup.detail,
        escalation: noneEscalation(),
        publishTestimonial: false,
      };
    }

    const execOrPayload = this.sensitiveDataDetector.detect(draft);
    if (
      execOrPayload &&
      (execOrPayload.reasonCode === 'PROHIBITED_EXECUTABLE' ||
        execOrPayload.reasonCode === 'MALICIOUS_PAYLOAD') &&
      execOrPayload.confidence >= 0.9
    ) {
      return this.reject(execOrPayload, 'REJECTED_WITH_REASON');
    }

    const security = this.securityPolicy.shouldEscalate(draft);
    if (security && security.confidence >= 0.8) {
      return {
        decision: 'SECURITY_ESCALATED',
        status: 'SECURITY_ESCALATED',
        reasonCode: security.reasonCode,
        confidence: security.confidence,
        rulesVersion: security.rulesVersion,
        humanReviewRequired: true,
        appealPath: 'support_reconsideration',
        auditNote: security.detail,
        escalation: {
          escalated: true,
          escalationKind: 'security',
          safeStatus: 'Security review requested',
          securityIncidentRef: null,
        },
        publishTestimonial: false,
      };
    }

    const abuse = this.abuseClassifier.classify(draft);
    if (abuse && abuse.confidence >= 0.8) {
      return {
        decision: 'ABUSIVE_QUARANTINED',
        status: 'ABUSIVE_QUARANTINED',
        reasonCode: abuse.reasonCode,
        confidence: abuse.confidence,
        rulesVersion: abuse.rulesVersion,
        humanReviewRequired: true,
        appealPath: 'support_reconsideration',
        auditNote: abuse.detail,
        escalation: {
          escalated: true,
          escalationKind: 'support',
          safeStatus: 'Quarantined for safety review',
          securityIncidentRef: null,
        },
        publishTestimonial: false,
      };
    }

    if (
      (spam && spam.confidence < 0.9) ||
      (execOrPayload && execOrPayload.reasonCode === 'LOW_CONFIDENCE') ||
      (security && security.confidence < 0.8)
    ) {
      const finding = execOrPayload ?? spam ?? security!;
      return {
        decision: 'NEEDS_REVIEW',
        status: 'NEEDS_REVIEW',
        reasonCode: 'LOW_CONFIDENCE',
        confidence: finding.confidence,
        rulesVersion: finding.rulesVersion,
        humanReviewRequired: true,
        appealPath: 'support_reconsideration',
        auditNote: finding.detail,
        escalation: noneEscalation(),
        publishTestimonial: false,
      };
    }

    const rating = draft.rating ?? null;
    const isNegative = rating !== null && rating <= 2;
    // Valid positive, neutral, and negative feedback is accepted privately.
    // Public testimonial is never auto-published (see evaluateTestimonialPublication).
    return {
      decision: 'ACCEPTED_PRIVATE',
      status: 'ACCEPTED_PRIVATE',
      reasonCode: isNegative ? 'NEGATIVE_ACCEPTED_PRIVATE' : 'POSITIVE_PRIVATE_ONLY',
      confidence: 1,
      rulesVersion: FEEDBACK_RULES_VERSION,
      humanReviewRequired: false,
      appealPath: 'support_reconsideration',
      auditNote: 'Valid feedback accepted privately regardless of sentiment.',
      escalation: noneEscalation(),
      publishTestimonial: false,
    };
  }

  /**
   * Build a feedback record shell. Transmission/persistence remain NOT_CONNECTED.
   */
  buildFeedbackRecord(input: {
    feedbackId: string;
    doctorPrincipalId: string;
    tenantId: string | null;
    draft: FeedbackSubmitDraft;
    requestId: string;
    now?: string;
  }): { feedback: DoctorFeedback; moderation: ModerationResult; transmission: 'NOT_CONNECTED' } {
    const moderation = this.moderate(input.draft);
    const now = input.now ?? new Date().toISOString();
    const feedback: DoctorFeedback = {
      feedbackId: input.feedbackId,
      doctorPrincipalId: input.doctorPrincipalId,
      tenantId: input.tenantId,
      createdAt: now,
      updatedAt: now,
      category: input.draft.category,
      rating: input.draft.rating ?? null,
      title: input.draft.title.trim(),
      description: input.draft.description.trim(),
      affectedFeatureOrPage: input.draft.affectedFeatureOrPage.trim(),
      problemOrSuggestion: input.draft.problemOrSuggestion,
      reproducibility: input.draft.reproducibility,
      attachmentConsent: {
        screenshotConsent: input.draft.screenshotConsent === true,
      },
      contactPermission: input.draft.contactPermission === true,
      testimonialConsent: {
        publicTestimonialConsent: input.draft.publicTestimonialConsent === true,
        withdrawable: true,
        publicationRequiresManualApproval: true,
      },
      status: moderation.status,
      moderationDecision: moderation.decision,
      moderationReasonCode: moderation.reasonCode,
      moderationConfidence: moderation.confidence,
      moderationRulesVersion: moderation.rulesVersion,
      assigned: { assignedTeam: null, assignedTo: null, assignedAt: null },
      supportTicketId: null,
      escalation: moderation.escalation,
      diagnostics: {
        appVersion: input.draft.diagnostics?.appVersion ?? null,
        routeTemplate: input.draft.diagnostics?.routeTemplate ?? '/feedback',
        timestamp: now,
        browserDeviceClass: input.draft.diagnostics?.browserDeviceClass ?? null,
        safeErrorCode: input.draft.diagnostics?.safeErrorCode ?? null,
        requestId: input.requestId,
        tenantId: input.tenantId,
      },
      patientContentPresent: false,
    };
    return {
      feedback,
      moderation,
      transmission: FoundationStatus.NOT_CONNECTED,
    };
  }

  private reject(
    finding: ModerationFinding,
    decision: 'SPAM_REJECTED' | 'REJECTED_WITH_REASON',
  ): ModerationResult {
    return {
      decision,
      status: decision,
      reasonCode: finding.reasonCode,
      confidence: finding.confidence,
      rulesVersion: finding.rulesVersion,
      humanReviewRequired: decision !== 'SPAM_REJECTED',
      appealPath: 'support_reconsideration',
      auditNote: finding.detail,
      escalation: noneEscalation(),
      publishTestimonial: false,
    };
  }
}

function noneEscalation(): DoctorFeedback['escalation'] {
  return {
    escalated: false,
    escalationKind: 'none',
    safeStatus: 'none',
    securityIncidentRef: null,
  };
}

/**
 * Public testimonial is separate from private feedback.
 * Requires explicit consent AND manual approval. Never auto-publish.
 */
export function evaluateTestimonialPublication(input: {
  publicTestimonialConsent: boolean;
  manualApprovalGranted: boolean;
}): {
  allowed: boolean;
  decision: FeedbackModerationDecision;
  reasonCode: FeedbackReasonCode;
} {
  if (!input.publicTestimonialConsent) {
    return {
      allowed: false,
      decision: 'PUBLICATION_CONSENT_REQUIRED',
      reasonCode: 'TESTIMONIAL_CONSENT_MISSING',
    };
  }
  if (!input.manualApprovalGranted) {
    return {
      allowed: false,
      decision: 'PUBLICATION_CONSENT_REQUIRED',
      reasonCode: 'TESTIMONIAL_CONSENT_MISSING',
    };
  }
  return {
    allowed: true,
    decision: 'PUBLISHED_TESTIMONIAL',
    reasonCode: 'POSITIVE_PRIVATE_ONLY',
  };
}

/** Audit sink contract — no real persistence in Phase 2A-M. */
export type ManagementAuditEvent = {
  actorId: string;
  actorRole: string;
  tenantOrPlatformScope: 'platform' | 'tenant';
  action: string;
  target: string;
  previousState: string | null;
  newState: string | null;
  reason: string;
  timestamp: string;
  requestId: string;
  approvalMetadata?: Record<string, string>;
  result: string;
};

export class InMemoryManagementAuditSink {
  readonly events: ManagementAuditEvent[] = [];

  record(event: ManagementAuditEvent): void {
    this.events.push(event);
  }

  /** Management Admin cannot delete their own audit trail. */
  deleteOwnTrail(_actorId: string): never {
    const err = new Error('Audit trail deletion is forbidden');
    (err as Error & { code: string }).code = 'AUDIT_DELETE_FORBIDDEN';
    throw err;
  }
}
