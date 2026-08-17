export {
  F3A_EXTRACTION_CANDIDATE_FOUNDATION,
  EVIDENCE_EXTRACT_PRODUCTION,
  EVIDENCE_OCR_ADAPTER_CONNECTED,
  CANDIDATE_TYPES,
  CANDIDATE_STATUSES,
  VERIFICATION_POSTURE_F3A,
  EXTRACTION_METHODS,
  LIMITATION_CODES,
  SCRIPT_HINTS,
  MAX_EXTRACT_PAGES,
  MAX_EXTRACT_CANDIDATES,
  MAX_RAW_CHARS,
  MAX_NORMALIZED_CHARS,
  MAX_UNIT_CHARS,
  MAX_RANGE_CHARS,
  MAX_HEADING_CHARS,
  EXTRACT_TIMEOUT_MS,
  MAGIC_PREFIX_MAX,
  RETENTION_JOB_TYPES,
  EXTRACT_JOB_TYPE,
  CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES,
} from './types.js';
export type {
  CandidateType,
  CandidateStatus,
  ExtractionMethod,
  LimitationCode,
  ScriptHint,
  SourceLocator,
  ExtractionCandidateDto,
  ExtractionRequest,
  ExtractionResult,
  ExtractionSuccess,
  ExtractionRefusal,
  ExtractionProvider,
  EvidenceJobType,
} from './types.js';
export {
  sha256Hex,
  extractorFingerprint,
  candidateContentFingerprint,
  assertNoStorageInLocator,
} from './fingerprint.js';
export {
  detectScriptHint,
  boundRawText,
  normalizeCandidateText,
  boundUnit,
  boundRange,
} from './normalize.js';
export { extractJobsEnabled, claimableEvidenceJobTypes } from './flags.js';
export {
  DeterministicFakeExtractor,
  NeverSettlingExtractor,
  defaultDeterministicExtractor,
} from './fakeExtractor.js';
