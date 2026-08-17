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

export type EvidenceObjectStore = {
  readonly provider: 'memory_fake';
  readonly productionReady: false;
  readonly publicUrlsForbidden: true;
  put(objectKey: string, bytes: Uint8Array): Promise<void>;
  get(objectKey: string): Promise<Uint8Array | null>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
};

export type MalwareScanResult = 'UNAVAILABLE' | 'INFECTED' | 'CLEAN';

export type MalwareScanner = {
  scan(_objectKey: string): Promise<MalwareScanResult>;
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
