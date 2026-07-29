import { FoundationStatus } from '@ehas2/shared';

/**
 * Temporary report processing lifecycle — original files are never permanently stored.
 * Storage/OCR are NOT implemented in Phase 2A-D.
 */
export const TEMP_REPORT_LIFECYCLE_STATES = [
  'Selected',
  'Validated',
  'TemporarilyReceived',
  'MalwareCheck',
  'OcrExtraction',
  'StructuredFindings',
  'DoctorVerification',
  'ClinicalAnalysis',
  'OriginalDeleted',
  'DeletionVerified',
  'ProcessingClosed',
] as const;

export type TempReportLifecycleState = (typeof TEMP_REPORT_LIFECYCLE_STATES)[number];

export type TempReportCleanupTrigger =
  'success' | 'error' | 'timeout' | 'user_cancellation' | 'orphan_cleanup';

export type TempReportProcessingContext = {
  processingId: string;
  tenantId: string;
  clinicId: string;
  doctorId: string;
  consultationId: string | null;
  state: TempReportLifecycleState;
  ttlExpiresAt: string;
  mimeValidated: boolean;
  sizeLimitBytes: number;
  publicUrlAllowed: false;
  permanentThumbnailAllowed: false;
  browserPersistentCacheAllowed: false;
  logReportContentAllowed: false;
  encryptedInTransitRequired: true;
  encryptedTempStorageRequired: true;
  cleanupRequiredOn: readonly TempReportCleanupTrigger[];
};

export type DeletionVerificationStatus =
  'PENDING' | 'VERIFIED' | 'DELETION_VERIFICATION_FAILED' | 'ESCALATED';

export type ReportDeletionPolicy = {
  maxRetryCount: number;
  maxRetentionWindowMinutes: number;
  escalationThresholdMinutes: number;
  incidentSeverity: 'SEV-2' | 'SEV-3';
  silentSuccessForbidden: true;
  broadDeleteCommandsForbidden: true;
};

export const DEFAULT_REPORT_DELETION_POLICY: ReportDeletionPolicy = {
  maxRetryCount: 5,
  maxRetentionWindowMinutes: 60,
  escalationThresholdMinutes: 30,
  incidentSeverity: 'SEV-2',
  silentSuccessForbidden: true,
  broadDeleteCommandsForbidden: true,
};

export type SafeDeletionFailureAlert = {
  alertId: string;
  processingId: string;
  tenantId: string;
  status: 'DELETION_VERIFICATION_FAILED';
  severity: ReportDeletionPolicy['incidentSeverity'];
  retryCount: number;
  escalatedToSuperAdminOps: boolean;
  /** Report contents must never appear in alerts. */
  reportContentPresent: false;
  doctorSafeStatus: string;
  createdAt: string;
};

export type ReportCleanupAuditEvent = {
  eventId: string;
  processingId: string;
  trigger: TempReportCleanupTrigger | 'deletion_retry' | 'escalation';
  previousState: TempReportLifecycleState | null;
  newState: TempReportLifecycleState | DeletionVerificationStatus;
  timestamp: string;
  requestId: string;
  reportContentPresent: false;
};

export type ProhibitedPersistentReportArtifact =
  | 'pdf'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'report_photograph'
  | 'patient_photograph'
  | 'clinical_image'
  | 'thumbnail'
  | 'preview_copy'
  | 'ocr_source_image'
  | 'base64_content'
  | 'browser_persistent_cache'
  | 'application_backup_blob'
  | 'analytics_payload'
  | 'log_content';

export const PROHIBITED_PERSISTENT_REPORT_ARTIFACTS: readonly ProhibitedPersistentReportArtifact[] =
  [
    'pdf',
    'jpg',
    'jpeg',
    'png',
    'report_photograph',
    'patient_photograph',
    'clinical_image',
    'thumbnail',
    'preview_copy',
    'ocr_source_image',
    'base64_content',
    'browser_persistent_cache',
    'application_backup_blob',
    'analytics_payload',
    'log_content',
  ];

/** After processing, only safe metadata may remain — never original identity-bearing filenames. */
export type PersistedReportProcessingMetadata = {
  processingId: string;
  safeReportType: string;
  processingTimestamp: string;
  verificationStatus: string;
  extractionConfidence: number | null;
  sourceCategory: string;
  processingEngineVersion: string | null;
  deletionVerificationStatus: DeletionVerificationStatus;
  originalFilenameRetained: false;
  originalBytesRetained: false;
};

export function createTempReportProcessingContext(input: {
  processingId: string;
  tenantId: string;
  clinicId: string;
  doctorId: string;
  consultationId?: string | null;
  ttlExpiresAt: string;
  sizeLimitBytes?: number;
}): TempReportProcessingContext {
  return {
    processingId: input.processingId,
    tenantId: input.tenantId,
    clinicId: input.clinicId,
    doctorId: input.doctorId,
    consultationId: input.consultationId ?? null,
    state: 'Selected',
    ttlExpiresAt: input.ttlExpiresAt,
    mimeValidated: false,
    sizeLimitBytes: input.sizeLimitBytes ?? 15 * 1024 * 1024,
    publicUrlAllowed: false,
    permanentThumbnailAllowed: false,
    browserPersistentCacheAllowed: false,
    logReportContentAllowed: false,
    encryptedInTransitRequired: true,
    encryptedTempStorageRequired: true,
    cleanupRequiredOn: ['success', 'error', 'timeout', 'user_cancellation', 'orphan_cleanup'],
  };
}

export function requiresCleanup(trigger: TempReportCleanupTrigger): boolean {
  return (
    trigger === 'success' ||
    trigger === 'error' ||
    trigger === 'timeout' ||
    trigger === 'user_cancellation' ||
    trigger === 'orphan_cleanup'
  );
}

export function createDeletionFailureAlert(input: {
  alertId: string;
  processingId: string;
  tenantId: string;
  retryCount: number;
  createdAt: string;
  policy?: ReportDeletionPolicy;
}): SafeDeletionFailureAlert {
  const policy = input.policy ?? DEFAULT_REPORT_DELETION_POLICY;
  return {
    alertId: input.alertId,
    processingId: input.processingId,
    tenantId: input.tenantId,
    status: 'DELETION_VERIFICATION_FAILED',
    severity: policy.incidentSeverity,
    retryCount: input.retryCount,
    escalatedToSuperAdminOps: input.retryCount >= policy.maxRetryCount,
    reportContentPresent: false,
    doctorSafeStatus: 'Report processing cleanup requires attention.',
    createdAt: input.createdAt,
  };
}

export class TemporaryReportProcessingService {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  static process(_input: unknown): never {
    const err = new Error('TemporaryReportProcessingService: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}
