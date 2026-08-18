import { describe, expect, it } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../apps/api/src/createApp.ts';
import {
  EVIDENCE_CLINICAL_ENGINE_CONNECTED,
  EVIDENCE_DISTRIBUTED_RATE_LIMITER,
  EVIDENCE_INGEST_FOUNDATION,
  EVIDENCE_MALWARE_SCANNER_CONNECTED,
  EVIDENCE_OCR_CONNECTED,
  EVIDENCE_PRODUCTION_OBJECT_STORE,
  EVIDENCE_PRODUCTION_WORKER,
  F2A_INFRASTRUCTURE_FOUNDATION,
} from '../../packages/evidence-ingest/src/index.ts';
import { F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION } from '../../packages/evidence-extract/src/index.ts';

async function getReady(): Promise<{ status: number; json: Record<string, unknown> }> {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/ready`);
    return { status: res.status, json: (await res.json()) as Record<string, unknown> };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

describe('F2A readiness truthfulness', () => {
  it('keeps /ready 503 with foundation true and production flags false', async () => {
    const res = await getReady();
    expect(res.status).toBe(503);
    expect(res.json.ready).toBe(false);
    expect(res.json.evidenceIngestFoundation).toBe(EVIDENCE_INGEST_FOUNDATION);
    expect(res.json.f2aInfrastructureFoundation).toBe(F2A_INFRASTRUCTURE_FOUNDATION);
    expect(res.json.productionObjectStore).toBe(EVIDENCE_PRODUCTION_OBJECT_STORE);
    expect(res.json.malwareScanner).toBe(EVIDENCE_MALWARE_SCANNER_CONNECTED);
    expect(res.json.distributedRateLimiter).toBe(EVIDENCE_DISTRIBUTED_RATE_LIMITER);
    expect(res.json.productionWorker).toBe(EVIDENCE_PRODUCTION_WORKER);
    expect(res.json.ocr).toBe(EVIDENCE_OCR_CONNECTED);
    expect(res.json.clinicalEngine).toBe(EVIDENCE_CLINICAL_ENGINE_CONNECTED);
    expect(res.json.productionObjectStore).toBe(false);
    expect(res.json.malwareScanner).toBe(false);
    expect(res.json.distributedRateLimiter).toBe(false);
    expect(res.json.productionWorker).toBe(false);
    expect(res.json.ocr).toBe(false);
    expect(res.json.clinicalEngine).toBe(false);
    expect(res.json.f3aExtractionCandidateFoundation).toBe(true);
    expect(res.json.f3bOpenSourceOcrAdapterFoundation).toBe(F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION);
    expect(res.json.ocrAdapter).toBe(false);
    expect(res.json.extractProduction).toBe(false);
    expect(res.json.ocr).toBe(false);
  });
});
