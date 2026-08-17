export {
  EVIDENCE_TYPES,
  EVIDENCE_SOURCE_TYPES,
  EVIDENCE_PROCESSING_STATUSES,
  EXTRACTION_STATUS_F1,
  CONFIDENCE_POSTURE_F1,
  CLINICAL_AUTHORITY_F1,
  ALLOWED_EXTENSIONS,
  ALLOWED_DECLARED_MIME,
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_PER_CONSULTATION,
  MAX_SANITIZED_FILENAME_LENGTH,
  EVIDENCE_TTL_MINUTES,
  DETECTED_MIME,
  SELECTOR_FORBIDDEN_FIELD_NAMES,
} from './types.js';
export type {
  EvidenceType,
  EvidenceSourceType,
  EvidenceProcessingStatus,
  DetectedMime,
  FileValidationResult,
  FileValidationSuccess,
  FileValidationFailure,
  EvidenceObjectStore,
  MalwareScanResult,
  MalwareScanner,
  EvidenceMetadata,
} from './types.js';
export {
  sanitizeEvidenceFilename,
  extensionOf,
  validateEvidenceBytes,
  buildEvidenceObjectKey,
} from './validateFile.js';
export {
  MemoryFakeObjectStore,
  getMemoryFakeObjectStore,
  resetMemoryFakeObjectStore,
} from './objectStore.js';
export {
  UnavailableMalwareScanner,
  defaultMalwareScanner,
  assertMalwareUnavailableIsNotClean,
} from './malwareScan.js';

export const EVIDENCE_INGEST_FOUNDATION = true as const;
export const EVIDENCE_OCR_CONNECTED = false as const;
export const EVIDENCE_CLINICAL_ENGINE_CONNECTED = false as const;
export const EVIDENCE_PRODUCTION_OBJECT_STORE = false as const;
export const EVIDENCE_MALWARE_SCANNER_CONNECTED = false as const;
