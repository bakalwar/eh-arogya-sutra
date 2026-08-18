import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConsultationService,
  EvidenceService,
  PatientService,
  PgExtractionRepository,
  closePool,
  getOrderedMigrationIds,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import {
  extractOcrJobsEnabled,
  MAX_EXTRACTION_RUNS_PER_EVIDENCE,
  sha256Hex,
} from '../../packages/evidence-extract/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';
import {
  bornDigitalEnglishPdf,
  bornDigitalHindiPdf,
  passwordProtectedPdf,
} from '../../tools/extract-fixtures/synthetic/bornDigitalPdf.js';

const env = isolatedPostgresTestEnv('ehas2_phase_ocr_test');
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
  contentIntent:
    | 'WRITTEN_REPORT_DOCUMENT'
    | 'WRITTEN_REPORT_PAGE_IMAGE'
    | 'DIAGNOSTIC_IMAGE'
    | 'PATIENT_PHOTO'
    | 'UNCLASSIFIED' = 'WRITTEN_REPORT_DOCUMENT',
  evidenceType: 'BLOOD_REPORT' | 'XRAY' | 'CT' | 'MRI' | 'USG' | 'PATIENT_PHOTO' = 'BLOOD_REPORT',
): Promise<{ itemId: string; patientId: string; consultationId: string }> {
  const service = new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner('CLEAN'),
    rateLimiter: new MemoryRateLimiter(),
  });
  const patient = await patients.create(
    tenant,
    { displayName: 'OCR Synthetic Patient', dateOfBirth: '1990-01-01' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'F3B OCR synthetic PDF' },
    env,
  );
  const item = await service.initiate(
    tenant,
    {
      consultationId: consultation.id,
      evidenceType,
      sourceType: 'DOCTOR_UPLOAD',
      filename: 'synthetic-report.pdf',
      declaredMime: 'application/pdf',
    },
    env,
  );
  await service.setEvidenceContentIntentForTest(tenant, item.id, contentIntent, env);
  await service.receiveBytes(tenant, consultation.id, item.id, pdfBytes, env);
  return { itemId: item.id, patientId: patient.id, consultationId: consultation.id };
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
    const { itemId } = await storedPdf(tenant, bornDigitalEnglishPdf());
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
    const { itemId: hindiId } = await storedPdf(tenant, bornDigitalHindiPdf());
    await service.enqueueExtractCandidates(tenant, hindiId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-ocr-hi', new Date(), ocrEnv);
    const hindiCandidates = await service.listExtractionCandidates(tenant, hindiId, ocrEnv);
    expect(
      hindiCandidates.some((c) => c.rawText.includes('हीमोग्लोबिन') || c.rawText.includes('g/dL')),
    ).toBe(true);

    const { itemId: blockedId } = await storedPdf(tenant, bornDigitalEnglishPdf(), 'UNCLASSIFIED');
    await service.enqueueExtractCandidates(tenant, blockedId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-ocr-block', new Date(), ocrEnv);
    const blocked = await service.listExtractionCandidates(tenant, blockedId, ocrEnv);
    expect(blocked.filter((c) => c.status === 'EXTRACTED_UNVERIFIED')).toHaveLength(0);
  }, 180_000);

  it('does not treat CT/MRI/USG/XRAY labels as OCR authorization', async () => {
    requireDb();
    const tenant = await seedDoctor();
    const service = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
    });
    const { itemId } = await storedPdf(tenant, bornDigitalEnglishPdf(), 'UNCLASSIFIED', 'CT');
    await service.enqueueExtractCandidates(tenant, itemId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-ct', new Date(), ocrEnv);
    const candidates = await service.listExtractionCandidates(tenant, itemId, ocrEnv);
    expect(candidates.filter((c) => c.status === 'EXTRACTED_UNVERIFIED')).toHaveLength(0);
  }, 180_000);

  it('refuses diagnostic images and patient photos', async () => {
    requireDb();
    const tenant = await seedDoctor();
    const service = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
    });
    const diagnostic = await storedPdf(tenant, bornDigitalEnglishPdf(), 'DIAGNOSTIC_IMAGE', 'XRAY');
    await service.enqueueExtractCandidates(tenant, diagnostic.itemId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-diag', new Date(), ocrEnv);
    expect(
      (await service.listExtractionCandidates(tenant, diagnostic.itemId, ocrEnv)).filter(
        (c) => c.status === 'EXTRACTED_UNVERIFIED',
      ),
    ).toHaveLength(0);

    const photo = await storedPdf(
      tenant,
      bornDigitalEnglishPdf(),
      'PATIENT_PHOTO',
      'PATIENT_PHOTO',
    );
    await service.enqueueExtractCandidates(tenant, photo.itemId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-photo', new Date(), ocrEnv);
    expect(
      (await service.listExtractionCandidates(tenant, photo.itemId, ocrEnv)).filter(
        (c) => c.status === 'EXTRACTED_UNVERIFIED',
      ),
    ).toHaveLength(0);
  }, 180_000);

  it('is concurrent-duplicate safe and fail-closed at retention cap without deletes', async () => {
    requireDb();
    const tenant = await seedDoctor();
    const service = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
    });
    const stored = await storedPdf(tenant, bornDigitalEnglishPdf());
    await service.enqueueExtractCandidates(tenant, stored.itemId, new Date(), ocrEnv);
    const [a, b] = await Promise.all([
      service.runDueJobs(tenant, 'ehas2-f3b-c1', new Date(), ocrEnv),
      service.runDueJobs(tenant, 'ehas2-f3b-c2', new Date(), ocrEnv),
    ]);
    expect(a.failed + b.failed).toBe(0);
    expect(JSON.stringify({ a, b })).not.toMatch(/23505|unique violation/i);
    const runs = await service.listExtractionRuns(tenant, stored.itemId, ocrEnv);
    const active = runs.filter((r) => r.status !== 'SUPERSEDED');
    expect(active.length).toBe(1);
    const replay = await service.runDueJobs(tenant, 'ehas2-f3b-replay', new Date(), ocrEnv);
    expect(replay.failed).toBe(0);
    const replayRuns = await service.listExtractionRuns(tenant, stored.itemId, ocrEnv);
    expect(replayRuns.filter((r) => r.status !== 'SUPERSEDED').length).toBe(1);

    const other = await storedPdf(tenant, bornDigitalHindiPdf());
    await service.enqueueExtractCandidates(tenant, other.itemId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-other', new Date(), ocrEnv);
    const otherRuns = await service.listExtractionRuns(tenant, other.itemId, ocrEnv);
    expect(otherRuns.length).toBeGreaterThanOrEqual(1);
    expect(otherRuns[0]?.evidenceItemId ?? other.itemId).toBe(other.itemId);
    const beforeCap = runs.length;
    const repo = new PgExtractionRepository();
    await withTenantTransaction(
      tenant,
      async (tx) => {
        const current = await repo.countRunsForEvidence(tenant, tx, stored.itemId);
        for (let i = current; i < MAX_EXTRACTION_RUNS_PER_EVIDENCE; i += 1) {
          await repo.insertRun(tenant, tx, {
            patientId: stored.patientId,
            consultationId: stored.consultationId,
            evidenceItemId: stored.itemId,
            jobId: null,
            extractorName: 'cap-filler',
            extractorVersion: `cap-${i}`,
            modelOrLangpackVersion: 'none',
            method: 'DETERMINISTIC_FIXTURE',
            extractorFingerprint: sha256Hex(`retention-cap-${i}`),
            inputContentSha256: null,
            status: 'REJECTED',
            limitationCodes: ['SYNTHETIC_FIXTURE_ONLY'],
            candidateCount: 0,
          });
        }
      },
      ocrEnv,
    );
    const cappedRuns = await service.listExtractionRuns(tenant, stored.itemId, ocrEnv);
    expect(cappedRuns.length).toBe(MAX_EXTRACTION_RUNS_PER_EVIDENCE);
    await service.enqueueExtractCandidates(tenant, stored.itemId, new Date(), ocrEnv);
    await service.runDueJobs(tenant, 'ehas2-f3b-cap', new Date(), ocrEnv);
    const after = await service.listExtractionRuns(tenant, stored.itemId, ocrEnv);
    expect(after.length).toBe(MAX_EXTRACTION_RUNS_PER_EVIDENCE);
    expect(after.length).toBeGreaterThanOrEqual(beforeCap);
  }, 180_000);

  it('rejects password PDFs without leaking report text into job results', async () => {
    requireDb();
    const tenant = await seedDoctor();
    const service = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
    });
    const { itemId } = await storedPdf(tenant, passwordProtectedPdf());
    await service.enqueueExtractCandidates(tenant, itemId, new Date(), ocrEnv);
    const ran = await service.runDueJobs(tenant, 'ehas2-f3b-pw', new Date(), ocrEnv);
    expect(JSON.stringify(ran)).not.toMatch(/Hemoglobin|हीमोग्लोबिन/);
    const candidates = await service.listExtractionCandidates(tenant, itemId, ocrEnv);
    expect(candidates.filter((c) => c.status === 'EXTRACTED_UNVERIFIED')).toHaveLength(0);
  }, 180_000);
});
