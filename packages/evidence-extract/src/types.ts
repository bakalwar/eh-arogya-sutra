/**
 * F3A source-linked extraction candidate contracts.
 * Candidates are never clinical conclusions. Selector firewall: this module
 * must not declare medicine, formula, potency, dose, or disease-selection fields.
 */

import type { EvidenceType } from '@ehas2/evidence-ingest';

export const F3A_EXTRACTION_CANDIDATE_FOUNDATION = true as const;
export const F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION = true as const;
export const EVIDENCE_EXTRACT_PRODUCTION = false as const;
export const EVIDENCE_OCR_ADAPTER_CONNECTED = false as const;

export const CONTENT_INTENTS = [
  'WRITTEN_REPORT_DOCUMENT',
  'WRITTEN_REPORT_PAGE_IMAGE',
  'DIAGNOSTIC_IMAGE',
  'PATIENT_PHOTO',
  'UNCLASSIFIED',
] as const;
export type ContentIntent = (typeof CONTENT_INTENTS)[number];

export const CANDIDATE_TYPES = [
  'DOCUMENT_METADATA',
  'PAGE_BLOCK_TEXT',
  'REPORT_HEADING',
  'TEST_ANALYTE_LABEL',
  'TEXTUAL_VALUE',
  'UNIT',
  'REFERENCE_RANGE_TEXT',
  'DATE',
  'REPORT_SECTION',
  'WRITTEN_IMPRESSION_TEXT',
  'CONFIDENCE_OR_LIMITATION',
] as const;

export type CandidateType = (typeof CANDIDATE_TYPES)[number];

export const CANDIDATE_STATUSES = ['EXTRACTED_UNVERIFIED', 'REJECTED', 'SUPERSEDED'] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const VERIFICATION_POSTURE_F3A = 'UNVERIFIED' as const;

export const EXTRACTION_METHODS = [
  'DETERMINISTIC_FIXTURE',
  'PDF_TEXT_LAYER',
  'TESSERACT_OCR',
  'TWO_STAGE_PIPELINE',
] as const;
export type ExtractionMethod = (typeof EXTRACTION_METHODS)[number];

export const LIMITATION_CODES = [
  'SCANNER_NOT_CLEAN',
  'EXTRACTION_NOT_CONNECTED',
  'MALFORMED_DOCUMENT',
  'UNSUPPORTED_TYPE',
  'PHOTO_DIAGNOSIS_FORBIDDEN',
  'IMAGE_INTERPRETATION_FORBIDDEN',
  'TIMEOUT',
  'LOW_CONFIDENCE',
  'PARTIAL_EXTRACTION',
  'ORIGINAL_UNAVAILABLE',
  'BYTE_LIMIT',
  'PAGE_LIMIT',
  'TEXT_LIMIT',
  'DUPLICATE_RUN',
  'SUPERSEDED_BY_NEWER_EXTRACTOR',
  'SYNTHETIC_FIXTURE_ONLY',
  'NOT_AUTHORITATIVE',
  'NO_TRANSLATION',
  'UNSUPPORTED_LANGUAGE',
  'DOCUMENT_INTENT_REQUIRED',
  'RETENTION_CAP_REACHED',
  'TOOLCHAIN_HASH_MISMATCH',
] as const;

export type LimitationCode = (typeof LIMITATION_CODES)[number];

export const SCRIPT_HINTS = ['Latn', 'Deva', 'Mixed', 'Unknown'] as const;
export type ScriptHint = (typeof SCRIPT_HINTS)[number];

export const MAX_EXTRACT_PAGES = 20;
export const MAX_EXTRACT_CANDIDATES = 80;
export const MAX_RAW_CHARS = 500;
export const MAX_NORMALIZED_CHARS = 500;
export const MAX_UNIT_CHARS = 32;
export const MAX_RANGE_CHARS = 120;
export const MAX_HEADING_CHARS = 200;
export const EXTRACT_TIMEOUT_MS = 5_000;
export const EXTRACT_JOB_TIMEOUT_MS = 120_000;
export const EXTRACT_PAGE_OCR_TIMEOUT_MS = 30_000;
export const MAX_CANDIDATES_PER_EVIDENCE = 240;
export const MAX_EXTRACTION_RUNS_PER_EVIDENCE = 48;
export const MAGIC_PREFIX_MAX = 16;

export const RETENTION_JOB_TYPES = ['DELETE_ORIGINAL', 'VERIFY_DELETION'] as const;
export const EXTRACT_JOB_TYPE = 'EXTRACT_CANDIDATES' as const;
export type EvidenceJobType = (typeof RETENTION_JOB_TYPES)[number] | typeof EXTRACT_JOB_TYPE;

export type SourceLocator = {
  page: number;
  blockIndex?: number;
  bbox?: { x: number; y: number; w: number; h: number };
};

export const CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES = [
  'medicineCode',
  'medicine_code',
  'formula',
  'oralFormula',
  'potency',
  'dose',
  'dosage',
  'diseaseId',
  'disease_id',
  'selectedDisease',
  'clinicalAuthority',
  'affectsClinicalSelection',
  'ocrText',
  'extractedText',
  'analyzeComplete',
] as const;

/** Persisted/API candidate DTO — IDs, bounded text, source locator. No original bytes. */
export type ExtractionCandidateDto = {
  id?: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  extractionRunId?: string;
  pageNumber: number;
  sourceLocator: SourceLocator;
  candidateType: CandidateType;
  rawText: string;
  normalizedText: string | null;
  unitText: string | null;
  referenceRangeText: string | null;
  method: ExtractionMethod;
  extractorName: string;
  extractorVersion: string;
  modelOrLangpackVersion: string;
  confidence: number | null;
  status: CandidateStatus;
  limitationCodes: readonly LimitationCode[];
  contentFingerprint: string;
  verificationPosture: typeof VERIFICATION_POSTURE_F3A;
  scriptHint: ScriptHint;
  createdAt?: string;
};

export type ExtractionRequest = {
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  evidenceType: EvidenceType;
  declaredMime: string;
  detectedMime: string | null;
  byteSize: number;
  contentSha256: string | null;
  magicPrefix: Uint8Array;
  contentIntent?: ContentIntent;
  bytes?: Uint8Array;
  abortSignal?: AbortSignal;
};

export type ExtractionSuccess = {
  ok: true;
  method: ExtractionMethod;
  extractorName: string;
  extractorVersion: string;
  modelOrLangpackVersion: string;
  extractorFingerprint: string;
  limitationCodes: readonly LimitationCode[];
  candidates: ExtractionCandidateDto[];
};

export type ExtractionRefusal = {
  ok: false;
  code: LimitationCode;
  method: ExtractionMethod;
  extractorName: string;
  extractorVersion: string;
  modelOrLangpackVersion: string;
  extractorFingerprint: string;
  limitationCodes: readonly LimitationCode[];
  candidates: [];
};

export type ExtractionResult = ExtractionSuccess | ExtractionRefusal;

export type ExtractionProvider = {
  readonly name: string;
  readonly version: string;
  readonly modelOrLangpackVersion: string;
  readonly method: ExtractionMethod;
  readonly productionReady: false;
  readonly ocrConnected: false;
  extract(input: ExtractionRequest): Promise<ExtractionResult>;
};
