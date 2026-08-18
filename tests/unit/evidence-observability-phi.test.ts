import { describe, expect, it } from 'vitest';
import {
  recordEvidenceEvent,
  resetEvidenceMetrics,
  snapshotEvidenceMetrics,
  assertEvidenceMetricSafe,
} from '../../packages/observability/src/index.ts';

describe('F2A PHI-safe evidence metrics', () => {
  it('records codes and malware enums only', () => {
    resetEvidenceMetrics();
    recordEvidenceEvent({ name: 'ingest_created', code: 'INTAKE_CREATED' });
    recordEvidenceEvent({ name: 'ingest_rejected', code: 'SIZE_REJECTED' });
    recordEvidenceEvent({ name: 'malware_result', malware: 'UNAVAILABLE' });
    recordEvidenceEvent({ name: 'rate_limit_denial', code: 'RATE_LIMIT_UNAVAILABLE' });
    recordEvidenceEvent({ name: 'extract_result', code: 'EXTRACTED_UNVERIFIED' });
    const snap = snapshotEvidenceMetrics();
    expect(snap.totals.ingest_created).toBe(1);
    expect(snap.totals.ingest_rejected).toBe(1);
    expect(snap.malware.UNAVAILABLE).toBe(1);
    expect(snap.totals.extract_result).toBe(1);
    expect(JSON.stringify(snap)).not.toMatch(/patient|filename|\.png|ehas2\/[0-9a-f-]{36}/i);
  });

  it('rejects unsafe metric payloads', () => {
    expect(() =>
      assertEvidenceMetricSafe({ name: 'ingest_created', code: 'filename=lab.png' }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
  });

  it('allows approved F3C source-text action codes without treating them as PHI keys', () => {
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'candidate_review_result',
        code: 'ACCEPT_AS_SOURCE_TEXT',
      }),
    ).not.toThrow();
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'candidate_review_result',
        code: 'CORRECT_SOURCE_TEXT',
      }),
    ).not.toThrow();
    recordEvidenceEvent({ name: 'candidate_review_result', code: 'ACCEPT_AS_SOURCE_TEXT' });
    recordEvidenceEvent({ name: 'candidate_review_result', code: 'CORRECT_SOURCE_TEXT' });
  });

  it('rejects source_text used as a metadata key', () => {
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'candidate_review_result',
        code: 'ACCEPT_AS_SOURCE_TEXT',
        source_text: 'synthetic headache',
      } as never),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
  });

  it('rejects source or report text used as a free-form value', () => {
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'ingest_created',
        code: 'synthetic headache from lab report page 1',
      }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'fact_candidate_result',
        code: 'MATERIALIZED',
        notes: 'Hemoglobin 13.2 g/dL',
      } as never),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
  });

  it('rejects candidate, asserted, and corrected text fields recursively', () => {
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'candidate_review_result',
        code: 'ACCEPT_AS_SOURCE_TEXT',
        candidate_text: 'Hemoglobin',
      } as never),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'fact_candidate_result',
        code: 'MATERIALIZED',
        asserted_text: 'synthetic headache',
      } as never),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'fact_candidate_result',
        code: 'MATERIALIZED',
        asserted_value: '13.2',
      } as never),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'candidate_review_result',
        code: 'CORRECT_SOURCE_TEXT',
        corrected_text: 'Haemoglobin',
      } as never),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'ingest_created',
        code: 'INTAKE_CREATED',
        nested: { original_source_span: 'synthetic headache' },
      } as never),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
  });

  it('fails closed for unknown metric names and codes', () => {
    expect(() =>
      assertEvidenceMetricSafe({ name: 'unknown_metric', code: 'INTAKE_CREATED' }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'candidate_review_result',
        code: 'UNKNOWN_REVIEW_CODE',
      }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({
        name: 'fact_candidate_result',
        code: 'UNKNOWN_FACT_CODE',
      }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({ name: 'ingest_created', code: 'NOT_A_REAL_CODE' }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
  });

  it('fails closed for oversized codes and values', () => {
    const oversized = `CODE_${'X'.repeat(80)}`;
    expect(() => assertEvidenceMetricSafe({ name: 'ingest_created', code: oversized })).toThrow(
      /PHI_OR_SECRET_IN_METRIC/,
    );
    expect(() =>
      assertEvidenceMetricSafe({ name: 'queue_depth', count: Number.POSITIVE_INFINITY }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
    expect(() =>
      assertEvidenceMetricSafe({ name: 'extract_latency_ms', ms: -1, count: 0 }),
    ).toThrow(/PHI_OR_SECRET_IN_METRIC/);
  });
});
