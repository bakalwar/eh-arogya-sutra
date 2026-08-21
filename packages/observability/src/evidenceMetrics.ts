export type EvidenceSafeMetricName =
  | 'ingest_created'
  | 'ingest_rejected'
  | 'malware_result'
  | 'queue_depth'
  | 'queue_oldest_age_ms'
  | 'lease_reclaim'
  | 'delete_latency_ms'
  | 'verify_latency_ms'
  | 'dead_count'
  | 'db_object_mismatch'
  | 'rate_limit_denial'
  | 'cross_tenant_denial'
  | 'extract_result'
  | 'extract_latency_ms'
  | 'candidate_review_result'
  | 'fact_candidate_result'
  | 'fact_verification_result'
  | 'fact_analysis_acceptance_result';

export type EvidenceSafeMetric = {
  name: EvidenceSafeMetricName;
  code?: string;
  malware?: 'CLEAN' | 'INFECTED' | 'UNAVAILABLE';
  count?: number;
  ms?: number;
};

type Totals = Record<EvidenceSafeMetricName, number>;

function emptyTotals(): Totals {
  return {
    ingest_created: 0,
    ingest_rejected: 0,
    malware_result: 0,
    queue_depth: 0,
    queue_oldest_age_ms: 0,
    lease_reclaim: 0,
    delete_latency_ms: 0,
    verify_latency_ms: 0,
    dead_count: 0,
    db_object_mismatch: 0,
    rate_limit_denial: 0,
    cross_tenant_denial: 0,
    extract_result: 0,
    extract_latency_ms: 0,
    candidate_review_result: 0,
    fact_candidate_result: 0,
    fact_verification_result: 0,
    fact_analysis_acceptance_result: 0,
  };
}

let totals = emptyTotals();
const malwareCounts = { CLEAN: 0, INFECTED: 0, UNAVAILABLE: 0 };
const rejectedByCode = new Map<string, number>();

const METRIC_NAMES = new Set<string>([
  'ingest_created',
  'ingest_rejected',
  'malware_result',
  'queue_depth',
  'queue_oldest_age_ms',
  'lease_reclaim',
  'delete_latency_ms',
  'verify_latency_ms',
  'dead_count',
  'db_object_mismatch',
  'rate_limit_denial',
  'cross_tenant_denial',
  'extract_result',
  'extract_latency_ms',
  'candidate_review_result',
  'fact_candidate_result',
  'fact_verification_result',
  'fact_analysis_acceptance_result',
]);

const MAX_CODE_CHARS = 64;
const MAX_METRIC_DEPTH = 1;
const BOUNDED_CODE = /^[A-Z][A-Z0-9_]{1,63}$/;

const CANDIDATE_REVIEW_RESULT_CODES = new Set([
  'ACCEPT_AS_SOURCE_TEXT',
  'CORRECT_SOURCE_TEXT',
  'REJECT_SOURCE_TEXT',
  'MARK_UNRESOLVED',
]);

const FACT_CANDIDATE_RESULT_CODES = new Set([
  'IDEMPOTENT_REPLAY',
  'IDENTITY_REPLAY',
  'MATERIALIZED',
]);

const FACT_VERIFICATION_RESULT_CODES = new Set(['IDEMPOTENT_REPLAY', 'MATERIALIZED']);
const FACT_ANALYSIS_ACCEPTANCE_RESULT_CODES = new Set(['IDEMPOTENT_REPLAY', 'MATERIALIZED']);

const INGEST_CREATED_CODES = new Set(['INTAKE_CREATED']);

const INGEST_REJECTED_CODES = new Set([
  'FILENAME_REJECTED',
  'EXTENSION_REJECTED',
  'MIME_REJECTED',
  'EMPTY_FILE',
  'SIZE_REJECTED',
  'MAGIC_BYTE_REJECTED',
  'MIME_EXTENSION_MISMATCH',
  'MIME_MISMATCH',
  'STRUCTURE_REJECTED',
  'TRAILING_PAYLOAD_REJECTED',
  'ARCHIVE_REJECTED',
  'EXECUTABLE_REJECTED',
  'DICOM_REJECTED',
  'HTML_OR_SCRIPT_REJECTED',
  'SVG_OR_XML_REJECTED',
  'POLYGLOT_REJECTED',
  'SHA_MISMATCH',
  'MALWARE_INFECTED',
  'MALWARE_UNAVAILABLE',
  'EVIDENCE_LIMIT',
  'EVIDENCE_NOT_ACCEPTING_BYTES',
  'STAGING_UNAVAILABLE',
  'STAGING_CREATE_FAILED',
  'STREAM_ABORTED',
  'CONTENT_LENGTH_MISMATCH',
  'Invalid evidenceType',
  'Invalid sourceType',
  'Validation failed',
]);

const MALWARE_CODES = new Set(['CLEAN', 'INFECTED', 'UNAVAILABLE']);

const RATE_LIMIT_CODES = new Set(['RATE_LIMITED', 'RATE_LIMIT_UNAVAILABLE']);

const CROSS_TENANT_CODES = new Set(['NOT_FOUND']);

const LEASE_RECLAIM_CODES = new Set(['LEASE_RECLAIM']);

const DB_OBJECT_MISMATCH_CODES = new Set(['STORE_UNAVAILABLE', 'BYTES_PRESENT_MISMATCH']);

const EXTRACT_RESULT_CODES = new Set([
  'EXTRACTED_UNVERIFIED',
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
]);

const DEAD_COUNT_CODES = new Set([
  'JOB_FAILED',
  'EXTRACTION_TIMEOUT',
  'STORE_UNAVAILABLE',
  'SCANNER_UNAVAILABLE',
  'SCANNER_TIMEOUT',
  'OBJECT_STORE_UNAVAILABLE',
  ...EXTRACT_RESULT_CODES,
]);

const FORBIDDEN_KEY_NORMALIZED = new Set([
  'filename',
  'filepath',
  'objectkey',
  'objecturl',
  'presign',
  'patientname',
  'displayname',
  'token',
  'secret',
  'credential',
  'stack',
  'sql',
  'rawtext',
  'extractedtext',
  'ocrtext',
  'candidatetext',
  'assertedtext',
  'assertedvalue',
  'originalsourcespan',
  'sourcetext',
  'correctedtext',
  'complaint',
  'complainttext',
  'labvalue',
  'labtext',
  'path',
  'url',
]);

const SCHEMA_BY_METRIC: Record<
  EvidenceSafeMetricName,
  { keys: ReadonlySet<string>; codes?: ReadonlySet<string>; malware?: boolean }
> = {
  ingest_created: { keys: new Set(['name', 'code']), codes: INGEST_CREATED_CODES },
  ingest_rejected: { keys: new Set(['name', 'code']), codes: INGEST_REJECTED_CODES },
  malware_result: {
    keys: new Set(['name', 'code', 'malware']),
    codes: MALWARE_CODES,
    malware: true,
  },
  queue_depth: { keys: new Set(['name', 'count']) },
  queue_oldest_age_ms: { keys: new Set(['name', 'ms', 'count']) },
  lease_reclaim: { keys: new Set(['name', 'code']), codes: LEASE_RECLAIM_CODES },
  delete_latency_ms: { keys: new Set(['name', 'ms', 'count']) },
  verify_latency_ms: { keys: new Set(['name', 'ms', 'count']) },
  dead_count: { keys: new Set(['name', 'code']), codes: DEAD_COUNT_CODES },
  db_object_mismatch: { keys: new Set(['name', 'code']), codes: DB_OBJECT_MISMATCH_CODES },
  rate_limit_denial: { keys: new Set(['name', 'code']), codes: RATE_LIMIT_CODES },
  cross_tenant_denial: { keys: new Set(['name', 'code']), codes: CROSS_TENANT_CODES },
  extract_result: { keys: new Set(['name', 'code']), codes: EXTRACT_RESULT_CODES },
  extract_latency_ms: { keys: new Set(['name', 'ms', 'count']) },
  candidate_review_result: {
    keys: new Set(['name', 'code']),
    codes: CANDIDATE_REVIEW_RESULT_CODES,
  },
  fact_candidate_result: {
    keys: new Set(['name', 'code']),
    codes: FACT_CANDIDATE_RESULT_CODES,
  },
  fact_verification_result: {
    keys: new Set(['name', 'code']),
    codes: FACT_VERIFICATION_RESULT_CODES,
  },
  fact_analysis_acceptance_result: {
    keys: new Set(['name', 'code']),
    codes: FACT_ANALYSIS_ACCEPTANCE_RESULT_CODES,
  },
};

function failMetric(): never {
  throw new Error('PHI_OR_SECRET_IN_METRIC');
}

function normalizeMetricKey(key: string): string {
  return key.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
}

function isForbiddenMetricKey(key: string): boolean {
  const lower = key.toLowerCase();
  const normalized = normalizeMetricKey(key);
  if (FORBIDDEN_KEY_NORMALIZED.has(lower) || FORBIDDEN_KEY_NORMALIZED.has(normalized)) {
    return true;
  }
  if (normalized.includes('complaint') || normalized.includes('credential')) {
    return true;
  }
  return false;
}

function assertBoundedNumber(value: unknown, max: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    failMetric();
  }
}

function assertBoundedCode(code: unknown, allowed: ReadonlySet<string>): void {
  if (typeof code !== 'string') failMetric();
  if (code.length < 1 || code.length > MAX_CODE_CHARS) failMetric();
  if (!allowed.has(code)) failMetric();
  if (BOUNDED_CODE.test(code)) return;
  if (allowed === INGEST_REJECTED_CODES) return;
  failMetric();
}

function assertKeysAndShape(metric: Record<string, unknown>, depth: number): void {
  if (depth > MAX_METRIC_DEPTH) failMetric();
  for (const [key, value] of Object.entries(metric)) {
    if (isForbiddenMetricKey(key)) failMetric();
    if (value !== null && typeof value === 'object') failMetric();
    if (typeof value === 'string' && key !== 'name' && key !== 'code' && key !== 'malware') {
      failMetric();
    }
  }
}

export function assertEvidenceMetricSafe(metric: unknown): void {
  if (metric === null || typeof metric !== 'object' || Array.isArray(metric)) {
    failMetric();
  }
  const payload = metric as Record<string, unknown>;
  assertKeysAndShape(payload, 0);
  const name = payload.name;
  if (typeof name !== 'string' || !METRIC_NAMES.has(name)) {
    failMetric();
  }
  const schema = SCHEMA_BY_METRIC[name as EvidenceSafeMetricName];
  for (const key of Object.keys(payload)) {
    if (!schema.keys.has(key)) failMetric();
  }
  if (schema.malware) {
    if (typeof payload.malware !== 'string' || !MALWARE_CODES.has(payload.malware)) {
      failMetric();
    }
    if (payload.code !== undefined) {
      assertBoundedCode(payload.code, MALWARE_CODES);
      if (payload.code !== payload.malware) failMetric();
    }
  } else if ('malware' in payload) {
    failMetric();
  } else if (schema.codes) {
    if (typeof payload.code !== 'string') failMetric();
    assertBoundedCode(payload.code, schema.codes);
  } else if ('code' in payload) {
    failMetric();
  }
  if ('count' in payload) {
    if (!schema.keys.has('count')) failMetric();
    assertBoundedNumber(payload.count, 1_000_000_000);
  }
  if ('ms' in payload) {
    if (!schema.keys.has('ms')) failMetric();
    assertBoundedNumber(payload.ms, 604_800_000);
  }
}

export function recordEvidenceEvent(metric: EvidenceSafeMetric): void {
  assertEvidenceMetricSafe(metric);
  totals[metric.name] += metric.count ?? 1;
  if (metric.name === 'malware_result' && metric.malware) {
    malwareCounts[metric.malware] += 1;
  }
  if (metric.name === 'ingest_rejected' && metric.code) {
    rejectedByCode.set(metric.code, (rejectedByCode.get(metric.code) ?? 0) + 1);
  }
}

export function snapshotEvidenceMetrics(): {
  totals: Totals;
  malware: typeof malwareCounts;
  rejectedByCode: Record<string, number>;
} {
  return {
    totals: { ...totals },
    malware: { ...malwareCounts },
    rejectedByCode: Object.fromEntries(rejectedByCode),
  };
}

export function resetEvidenceMetrics(): void {
  totals = emptyTotals();
  malwareCounts.CLEAN = 0;
  malwareCounts.INFECTED = 0;
  malwareCounts.UNAVAILABLE = 0;
  rejectedByCode.clear();
}
