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
  | 'candidate_review_result';

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
  };
}

let totals = emptyTotals();
const malwareCounts = { CLEAN: 0, INFECTED: 0, UNAVAILABLE: 0 };
const rejectedByCode = new Map<string, number>();

const FORBIDDEN_LOG_KEYS =
  /filename|objectKey|object_key|presign|patientName|displayName|token|secret|stack|SQL|raw_text|extracted_text|extractedText|ocrText|ocr_text|candidate_text/i;

export function assertEvidenceMetricSafe(metric: EvidenceSafeMetric): void {
  const blob = JSON.stringify(metric);
  if (FORBIDDEN_LOG_KEYS.test(blob)) {
    throw new Error('PHI_OR_SECRET_IN_METRIC');
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
