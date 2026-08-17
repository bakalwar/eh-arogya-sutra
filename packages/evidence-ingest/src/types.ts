/**
 * F1 evidence ingest types.
 * Selector firewall: this module must not declare medicine, formula, potency,
 * dose, or disease-selection fields. Originals are never clinical authority.
 */

export const EVIDENCE_TYPES = [
  'PATIENT_PHOTO',
  'USG',
  'CT',
  'MRI',
  'BLOOD_REPORT',
  'XRAY',
  'OTHER_INVESTIGATION',
  'CLINICAL_IMAGE',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_SOURCE_TYPES = ['DOCTOR_UPLOAD', 'PATIENT_SUPPLIED', 'CLINIC_SCAN'] as const;

export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number];

export const EVIDENCE_PROCESSING_STATUSES = [
  'INTAKE_CREATED',
  'BYTES_RECEIVED',
  'VALIDATING',
  'REJECTED',
  'QUARANTINED',
  'STORED_TEMP',
  'MALWARE_PENDING',
  'EXPIRED',
  'DELETE_PENDING',
  'DELETED',
  'DELETION_VERIFIED',
] as const;

export type EvidenceProcessingStatus = (typeof EVIDENCE_PROCESSING_STATUSES)[number];

export const EXTRACTION_STATUS_F1 = 'NOT_AUTHORIZED' as const;
export const CONFIDENCE_POSTURE_F1 = 'NONE' as const;
export const CLINICAL_AUTHORITY_F1 = 'NOT_AUTHORITATIVE' as const;

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'] as const;
export const ALLOWED_DECLARED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
export const MAX_EVIDENCE_PER_CONSULTATION = 20;
export const MAX_SANITIZED_FILENAME_LENGTH = 120;
export const EVIDENCE_TTL_MINUTES = 60;
export const DELETION_VERIFY_SLA_MS = 5 * 60_000;
export const WORKER_POLL_INTERVAL_MIN_MS = 15_000;
export const WORKER_POLL_INTERVAL_MAX_MS = 30_000;
export const WORKER_POLL_INTERVAL_DEFAULT_MS = 20_000;
export const WORKER_CLAIM_BATCH = 20;
export const MAGIC_PREFIX_MAX_BYTES = 256;
export const STREAMING_STAGING_CLASSIFICATION = 'TEST_OR_LOCAL_STAGING_NOT_PRODUCTION' as const;

export const ENCRYPTION_POSTURES = [
  'PROVIDER_SSE',
  'SSE_KMS_CMEK',
  'ENVELOPE_V1',
  'NOT_PRODUCTION',
] as const;
export type EncryptionPosture = (typeof ENCRYPTION_POSTURES)[number];

export const FORBIDDEN_OBJECT_STORE_METHODS = [
  'getPublicUrl',
  'publicUrl',
  'presign',
  'presignedUrl',
  'createPresignedUrl',
  'getSignedUrl',
  'cdnUrl',
  'browserDownload',
] as const;

export const DETECTED_MIME = {
  pdf: 'application/pdf',
  jpeg: 'image/jpeg',
  png: 'image/png',
} as const;

export type DetectedMime = (typeof DETECTED_MIME)[keyof typeof DETECTED_MIME];

export type FileValidationFailure = {
  ok: false;
  code: string;
};

export type FileValidationSuccess = {
  ok: true;
  filenameSanitized: string;
  extension: 'pdf' | 'jpg' | 'jpeg' | 'png';
  declaredMime: string;
  detectedMime: DetectedMime;
  byteSize: number;
  contentSha256: string;
};

export type FileValidationResult = FileValidationSuccess | FileValidationFailure;

export type ObjectStoreHead = {
  exists: boolean;
  byteSize: number | null;
  encryptionPosture: EncryptionPosture;
};

export type ObjectStoreHealth = {
  ok: boolean;
  productionReady: false;
  publicUrls: false;
  durableProduction: false;
  encryptionPosture: EncryptionPosture;
};

export type ObjectStoreCapabilities = {
  publicUrl: false;
  cdn: false;
  permanentRetention: false;
  browserDownloadRoute: false;
};

export type PrivateObjectReference = {
  objectKey: string;
};

export type EvidenceObjectStore = {
  readonly provider: 'memory_fake' | 'memory_fault' | 'unavailable';
  readonly productionReady: false;
  readonly publicUrlsForbidden: true;
  readonly encryptionPosture: EncryptionPosture;
  readonly capabilities: ObjectStoreCapabilities;
  put(objectKey: string, bytes: Uint8Array): Promise<void>;
  putStream(objectKey: string, body: AsyncIterable<Uint8Array>): Promise<void>;
  readForMalwareScan(objectKey: string, maxBytes?: number): Promise<Uint8Array | null>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
  head(objectKey: string): Promise<ObjectStoreHead>;
  abortPartial(objectKey: string): Promise<void>;
  health(): Promise<ObjectStoreHealth>;
};

export type MalwareScanResult = 'UNAVAILABLE' | 'INFECTED' | 'CLEAN';

export type MalwareScanner = {
  readonly productionReady: false;
  scan(ref: PrivateObjectReference): Promise<MalwareScanResult>;
};

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; code: 'RATE_LIMITED'; retryAfterSec: number }
  | { ok: false; code: 'RATE_LIMIT_UNAVAILABLE'; retryAfterSec: number };

export type DurableRateLimiter = {
  readonly adapter: 'memory_test_or_dev' | 'unavailable';
  readonly productionReady: false;
  readonly distributedReady: false;
  tryInitiate(input: {
    actorId: string;
    organizationId: string;
    clinicId: string;
    consultationId: string;
  }): Promise<RateLimitDecision>;
  acquireUploadLease(input: { actorId: string }): Promise<RateLimitDecision & { leaseId?: string }>;
  releaseUploadLease(leaseId: string): Promise<void>;
  consumeBytes(actorId: string, bytes: number): Promise<RateLimitDecision>;
  releaseBytes(actorId: string, bytes: number): Promise<void>;
};

/** Metadata persisted after ingest — no selector / OCR / interpretation fields. */
export type EvidenceMetadata = {
  id: string;
  publicId: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  submittedByActorId: string;
  evidenceType: EvidenceType;
  sourceType: EvidenceSourceType;
  filenameSanitized: string;
  originalFilenameRetained: false;
  declaredMime: string;
  detectedMime: string | null;
  byteSize: number | null;
  contentSha256: string | null;
  capturedOrIssuedOn: string | null;
  ingestedAt: string;
  processingStatus: EvidenceProcessingStatus;
  extractionStatus: typeof EXTRACTION_STATUS_F1;
  confidencePosture: typeof CONFIDENCE_POSTURE_F1;
  clinicalAuthority: typeof CLINICAL_AUTHORITY_F1;
  sourceAuditEventId: string | null;
  rejectionCode: string | null;
  rejectionReasonSafe: string | null;
  retentionClass: 'TEMPORARY_ORIGINAL';
  expiresAt: string;
  deletedAt: string | null;
  deletionVerificationStatus: string;
  malwareScanResult: MalwareScanResult;
};

export const SELECTOR_FORBIDDEN_FIELD_NAMES = [
  'medicineCode',
  'medicine_code',
  'formula',
  'oralFormula',
  'potency',
  'dose',
  'dosage',
  'diseaseId',
  'disease_id',
  'ocrText',
  'extractedText',
  'analyzeComplete',
] as const;
