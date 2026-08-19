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
import {
  F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION,
  F3C_CANDIDATE_REVIEW_FOUNDATION,
  F3D_FACT_CANDIDATE_FOUNDATION,
  F3D2_TERMINOLOGY_PACK_FOUNDATION,
} from '../../packages/evidence-extract/src/index.ts';

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
    expect(res.json.f3cCandidateReviewFoundation).toBe(F3C_CANDIDATE_REVIEW_FOUNDATION);
    expect(res.json.f3dFactCandidateFoundation).toBe(F3D_FACT_CANDIDATE_FOUNDATION);
    expect(res.json.f3d2TerminologyPackFoundation).toBe(F3D2_TERMINOLOGY_PACK_FOUNDATION);
    expect(res.json.cueParserFoundation).toBe(true);
    expect(res.json.cueParserConnected).toBe(false);
    expect(res.json.cueParserProductionEnabled).toBe(false);
    expect(res.json.terminologyProductionEntryCount).toBe(45);
    expect(res.json.ownerTerminologyFreezePending).toBe(false);
    expect(res.json.terminologyPackFrozen).toBe(true);
    expect(res.json.terminologyPackValid).toBe(true);
    expect(res.json.normalizationParserAvailable).toBe(false);
    expect(JSON.stringify(res.json)).not.toMatch(/zxq-alias|bukhar|Hemoglobin/);
    expect(JSON.stringify(res.json)).not.toMatch(
      /68f65b133dbf91077fe3a962d6f6755e2714e10c0ec317ec35605348b48d5b20/,
    );
    expect(JSON.stringify(res.json)).not.toMatch(
      /b3abc204139186c7c666a6bcd1c529117bda1bc2da9f2eac6a377d57914083a5/,
    );
    expect(JSON.stringify(res.json)).not.toMatch(/EHAS2_F3D2_PACK_APPROVAL/);
    expect(JSON.stringify(res.json)).not.toMatch(/ehas2-owner-cue-pack\.v1\.0\.0\.json/);
    expect(JSON.stringify(res.json)).not.toMatch(/नहीं है|dheere dheere|mmHg/);
    expect(res.json.ocrAdapter).toBe(false);
    expect(res.json.extractProduction).toBe(false);
    expect(res.json.ocr).toBe(false);
  });
});
