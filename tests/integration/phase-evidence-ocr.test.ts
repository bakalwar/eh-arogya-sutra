import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConsultationService,
  EvidenceService,
  PatientService,
  closePool,
  getOrderedMigrationIds,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import { extractOcrJobsEnabled } from '../../packages/evidence-extract/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';
import {
  bornDigitalEnglishPdf,
  bornDigitalHindiPdf,
} from '../../tools/extract-fixtures/synthetic/bornDigitalPdf.js';

const env = isolatedPostgresTestEnv('ehas2_phase_extract_test');
const ocrEnv = {
  ...env,
  EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
  EHAS2_F3B_OCR_EXTRACT_JOBS: '1',
};
let dbReady = false;
resetMemoryFakeObjectStore();
const store = new MemoryFakeObjectStore();
const patients = new PatientService();
const consultations = new ConsultationService();

beforeAll(async () => {
  Object.assign(process.env, env);
  try {
    const pg = await import('pg');
    const Client =
      pg.default?.Client ?? (pg as unknown as { Client: typeof pg.default.Client }).Client;
    const client = new Client({ connectionString: env.EHAS2_DATABASE_URL });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    dbReady = true;
  } catch {
    dbReady = false;
  }
  if (!dbReady) return;
  await resetDatabaseSchema(env);
  await migrateUp(env);
}, 120_000);

afterAll(async () => {
  if (dbReady) await closePool();
});

function requireDb(): void {
  if (!dbReady) throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3B OCR tests');
}

async function seedDoctor(): Promise<TenantContext> {
  const { PgUserRepository, PgOrganizationRepository, PgMembershipRepository } =
    await import('../../packages/database/src/repositories/postgres.js');
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const u = await users.create(
      { query },
      {
        displayName: 'Synthetic OCR Doctor',
        actorId: '00000000-0000-4000-8000-0000000000f3',
      },
    );
    const o = await orgs.create({ query }, { name: 'Synthetic OCR Org', actorId: u.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [o.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const c = await orgs.createClinic(
      { query },
      { organizationId: o.id, name: 'Synthetic OCR Clinic', actorId: u.id },
    );
    await query('COMMIT');
    const m = await memberships.create(
      { query },
      { userId: u.id, organizationId: o.id, clinicId: c.id, status: 'ACTIVE', actorId: u.id },
    );
    await memberships.assignRole({ query }, { membershipId: m.id, roleCode: 'Doctor' });
    return {
      organizationId: o.id,
      clinicId: c.id,
      actorId: u.id,
      actorRole: 'Doctor',
      membershipStatus: 'ACTIVE',
      allowPatientPhi: true,
    };
  }, env);
}

async function storedPdf(
  tenant: TenantContext,
  pdfBytes: Uint8Array,
  contentIntent: 'WRITTEN_REPORT_DOCUMENT' | 'UNCLASSIFIED' = 'WRITTEN_REPORT_DOCUMENT',
): Promise<string> {
  const service = new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner('CLEAN'),
    rateLimiter: new MemoryRateLimiter(),
  });
  const patient = await patients.create(
    tenant,
    { displayName: 'OCR Synthetic Patient', dateOfBirth: '1990-01-01' },
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaint: 'F3B OCR synthetic PDF' },
    env,
  );
  const item = await service.initiate(
    tenant,
    {
      consultationId: consultation.id,
      evidenceType: 'LAB_REPORT',
      sourceType: 'UPLOAD',
      filename: 'synthetic-report.pdf',
      declaredMime: 'application/pdf',
    },
    env,
  );
  await service.setEvidenceContentIntentForTest(tenant, item.id, contentIntent, env);
  await service.receiveBytes(tenant, consultation.id, item.id, pdfBytes, env);
  return item.id;
}

describe('F3B open-source OCR extraction (non-production)', () => {
  it('registers migration 013 and keeps OCR jobs gated', () => {
    expect(getOrderedMigrationIds()).toContain('013_f3b_open_source_ocr');
    expect(extractOcrJobsEnabled(env)).toBe(false);
    expect(extractOcrJobsEnabled(ocrEnv)).toBe(true);
  });

  it('extracts born-digital English PDF candidates when OCR jobs enabled', async () => {
    requireDb();
    const tenant = await seedDoctor();
    const service = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
    });
    const itemId = await storedPdf(tenant, bornDigitalEnglishPdf());
    await service.enqueueExtractCandidates(tenant, itemId, new Date(), ocrEnv);
    const ran = await service.runDueJobs(tenant, 'ehas2-f3b-ocr-en', new Date(), ocrEnv);
    expect(ran.succeeded).toBeGreaterThanOrEqual(1);
    const candidates = await service.listExtractionCandidates(tenant, itemId, ocrEnv);
    expect(candidates.some((c) => c.rawText.includes('Hemoglobin'))).toBe(true);
    expect(candidates.every((c) => c.verificationPosture === 'UNVERIFIED')).toBe(true);
    expect(JSON.stringify(candidates)).not.toMatch(/object_key|presigned/);
  }, 180_000);

  it('extracts Hindi PDF text and rejects UNCLASSIFIED intent', async () => {
    requireDb();
    const tenant = await seedDoctor();
    const service = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
    });
    const hindiId = await storedPdf(tenant, bornDigitalHindiPdf());
    await service.enqueueExtractCandidates(tenant, hindiId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-ocr-hi', new Date(), ocrEnv);
    const hindiCandidates = await service.listExtractionCandidates(tenant, hindiId, ocrEnv);
    expect(
      hindiCandidates.some((c) => c.rawText.includes('हीमोग्लोबिन') || c.rawText.includes('g/dL')),
    ).toBe(true);

    const blockedId = await storedPdf(tenant, bornDigitalEnglishPdf(), 'UNCLASSIFIED');
    await service.enqueueExtractCandidates(tenant, blockedId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-ocr-block', new Date(), ocrEnv);
    const blocked = await service.listExtractionCandidates(tenant, blockedId, ocrEnv);
    expect(blocked.filter((c) => c.status === 'EXTRACTED_UNVERIFIED')).toHaveLength(0);
  }, 180_000);
});
