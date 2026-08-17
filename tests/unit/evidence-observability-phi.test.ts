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
});
