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
  DELETION_VERIFY_SLA_MS,
  WORKER_POLL_INTERVAL_MIN_MS,
  WORKER_POLL_INTERVAL_MAX_MS,
  WORKER_POLL_INTERVAL_DEFAULT_MS,
  WORKER_CLAIM_BATCH,
  MAGIC_PREFIX_MAX_BYTES,
  STREAMING_STAGING_CLASSIFICATION,
  DETECTED_MIME,
  SELECTOR_FORBIDDEN_FIELD_NAMES,
  ENCRYPTION_POSTURES,
  FORBIDDEN_OBJECT_STORE_METHODS,
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
  ObjectStoreHead,
  ObjectStoreHealth,
  ObjectStoreCapabilities,
  PrivateObjectReference,
  MalwareScanResult,
  MalwareScanner,
  EvidenceMetadata,
  EncryptionPosture,
  DurableRateLimiter,
  RateLimitDecision,
} from './types.js';
export {
  sanitizeEvidenceFilename,
  extensionOf,
  validateEvidenceBytes,
  buildEvidenceObjectKey,
} from './validateFile.js';
export {
  MemoryFakeObjectStore,
  FaultInjectingObjectStore,
  UnavailableObjectStore,
  getMemoryFakeObjectStore,
  resetMemoryFakeObjectStore,
  assertNoPublicObjectStoreApi,
} from './objectStore.js';
export {
  UnavailableMalwareScanner,
  DeterministicMalwareScanner,
  defaultMalwareScanner,
  assertMalwareUnavailableIsNotClean,
  assertMalwareGateSatisfied,
  normalizeMalwareScanResult,
  scanPrivateObject,
} from './malwareScan.js';
export {
  evaluateEncryptionPosture,
  assertEncryptionPosture,
  TEST_ADAPTER_ENCRYPTION,
} from './encryption.js';
export {
  StreamIngestError,
  stageBoundedStream,
  bytesAsStream,
  stagingOpenCount,
  disposeAllStagingForTests,
} from './streamIngest.js';
export type { StagedEvidenceBytes } from './streamIngest.js';
export {
  MemoryRateLimiter,
  UnavailableRateLimiter,
  unavailableEvidenceRateLimiter,
  getMemoryEvidenceRateLimiter,
  resetMemoryEvidenceRateLimiter,
  resolveEvidenceRateLimiter,
  isProductionRuntime,
  RATE_LIMIT_TEST_DEFAULTS,
  clampPollIntervalMs,
  jobBackoffMs,
} from './rateLimit.js';

export const EVIDENCE_INGEST_FOUNDATION = true as const;
export const F2A_INFRASTRUCTURE_FOUNDATION = true as const;
export const EVIDENCE_OCR_CONNECTED = false as const;
export const EVIDENCE_CLINICAL_ENGINE_CONNECTED = false as const;
export const EVIDENCE_PRODUCTION_OBJECT_STORE = false as const;
export const EVIDENCE_MALWARE_SCANNER_CONNECTED = false as const;
export const EVIDENCE_DISTRIBUTED_RATE_LIMITER = false as const;
export const EVIDENCE_PRODUCTION_WORKER = false as const;
