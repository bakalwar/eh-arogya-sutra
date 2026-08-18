import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  EvidenceService,
  PatientService,
  ConsultationService,
  closePool,
  getOrderedMigrationIds,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ValidationError,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import {
  DeterministicFakeExtractor,
  NeverSettlingExtractor,
  extractJobsEnabled,
} from '../../packages/evidence-extract/src/index.ts';
import {
  recordEvidenceEvent,
  resetEvidenceMetrics,
  snapshotEvidenceMetrics,
} from '../../packages/observability/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_extract_test');
const extractEnv = { ...env, EHAS2_EVIDENCE_EXTRACT_JOBS: '1' };
let dbReady = false;
resetMemoryFakeObjectStore();
const store = new MemoryFakeObjectStore();
const patients = new PatientService();
const consultations = new ConsultationService();

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
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
  if (!dbReady) throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3A extract tests');
}

function evidenceService(mode: 'CLEAN' | 'INFECTED' | 'UNAVAILABLE' = 'CLEAN'): EvidenceService {
  return new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner(mode),
    rateLimiter: new MemoryRateLimiter(),
    extractor: new DeterministicFakeExtractor(),
    onSafeMetric: recordEvidenceEvent,
  });
}

async function seedTenants(): Promise<{ doctorA: TenantContext; doctorB: TenantContext }> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic Extract Doctor A',
        actorId: '00000000-0000-4000-8000-0000000000c1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic Extract Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic Extract Clinic A', actorId: uA.id },
    );
    await query('COMMIT');
    const mA = await memberships.create(
      { query },
      { userId: uA.id, organizationId: oA.id, clinicId: cA.id, status: 'ACTIVE', actorId: uA.id },
    );
    await memberships.assignRole({ query }, { membershipId: mA.id, roleCode: 'Doctor' });

    const uB = await users.create(
      { query },
      {
        displayName: 'Synthetic Extract Doctor B',
        actorId: '00000000-0000-4000-8000-0000000000c2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic Extract Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic Extract Clinic B', actorId: uB.id },
    );
    await query('COMMIT');
    const mB = await memberships.create(
      { query },
      { userId: uB.id, organizationId: oB.id, clinicId: cB.id, status: 'ACTIVE', actorId: uB.id },
    );
    await memberships.assignRole({ query }, { membershipId: mB.id, roleCode: 'Doctor' });

    return {
      doctorA: {
        organizationId: oA.id,
        clinicId: cA.id,
        actorId: uA.id,
        actorRole: 'Doctor',
        membershipStatus: 'ACTIVE' as const,
        allowPatientPhi: true,
      },
      doctorB: {
        organizationId: oB.id,
        clinicId: cB.id,
        actorId: uB.id,
        actorRole: 'Doctor',
        membershipStatus: 'ACTIVE' as const,
        allowPatientPhi: true,
      },
    };
  }, env);
}

async function storedEvidence(
  tenant: TenantContext,
  service: EvidenceService,
  evidenceType: 'BLOOD_REPORT' | 'PATIENT_PHOTO' | 'CT' = 'BLOOD_REPORT',
): Promise<{ itemId: string; consultationId: string }> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic Extract Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'synthetic extract fixture' },
    env,
  );
  const item = await service.initiate(
    tenant,
    {
      consultationId: consultation.id,
      evidenceType,
      sourceType: 'DOCTOR_UPLOAD',
      filename: evidenceType === 'BLOOD_REPORT' ? 'lab.png' : 'page.png',
      declaredMime: 'image/png',
    },
    env,
  );
  const stored = await service.receiveBytes(tenant, consultation.id, item.id, PNG, env);
  return { itemId: stored.id, consultationId: consultation.id };
}

describe('F3A source-linked extraction candidates', () => {
  it('registers migration 012 without expanding production extraction_status', () => {
    expect(getOrderedMigrationIds()).toContain('014_f3c_candidate_review');
    expect(getOrderedMigrationIds()).toHaveLength(14);
    expect(extractJobsEnabled(env)).toBe(false);
  });

  it('persists unverified candidates from CLEAN synthetic reports and keeps authority locked', async () => {
    requireDb();
    resetEvidenceMetrics();
    const { doctorA, doctorB } = await seedTenants();
    const service = evidenceService('CLEAN');
    const { itemId } = await storedEvidence(doctorA, service, 'BLOOD_REPORT');
    await service.enqueueExtractCandidates(doctorA, itemId, new Date(), extractEnv);
    const ran = await service.runDueJobs(doctorA, 'ehas2-f3a-worker', new Date(), extractEnv);
    expect(ran.succeeded).toBeGreaterThanOrEqual(1);
    const candidates = await service.listExtractionCandidates(doctorA, itemId, extractEnv);
    expect(candidates.length).toBeGreaterThan(3);
    expect(candidates.every((c) => c.status === 'EXTRACTED_UNVERIFIED')).toBe(true);
    expect(candidates.every((c) => c.verificationPosture === 'UNVERIFIED')).toBe(true);
    expect(candidates.some((c) => c.rawText === 'हीमोग्लोबिन')).toBe(true);
    expect(candidates.some((c) => c.rawText === 'Hemoglobin')).toBe(true);
    expect(JSON.stringify(candidates)).not.toMatch(/object_key|ehas2\/[0-9a-f-]{36}/);
    const item = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT extraction_status, clinical_authority, confidence_posture
           FROM clinical_evidence_items WHERE id = $1`,
          [itemId],
        );
        return r.rows[0] as {
          extraction_status: string;
          clinical_authority: string;
          confidence_posture: string;
        };
      },
      env,
    );
    expect(item.extraction_status).toBe('NOT_AUTHORIZED');
    expect(item.clinical_authority).toBe('NOT_AUTHORITATIVE');
    expect(item.confidence_posture).toBe('NONE');
    expect(await service.countStructuredFindingsForEvidence(doctorA, itemId, env)).toBe(0);
    const other = await service.listExtractionCandidates(doctorB, itemId, extractEnv);
    expect(other).toEqual([]);
    const snap = snapshotEvidenceMetrics();
    expect(JSON.stringify(snap)).not.toMatch(/हीमोग्लोबिन|Hemoglobin|lab\.png/);
  });

  it('is idempotent for the same extractor fingerprint and supersedes a new version', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const first = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
      extractor: new DeterministicFakeExtractor('1.0.0-f3a'),
    });
    const { itemId } = await storedEvidence(doctorA, first, 'BLOOD_REPORT');
    await first.enqueueExtractCandidates(doctorA, itemId, new Date(), extractEnv);
    await first.runDueJobs(doctorA, 'ehas2-f3a-w1', new Date(), extractEnv);
    await first.enqueueExtractCandidates(doctorA, itemId, new Date(), extractEnv);
    await first.runDueJobs(doctorA, 'ehas2-f3a-w1', new Date(), extractEnv);
    const firstPass = await first.listExtractionCandidates(doctorA, itemId, extractEnv);
    const activeFirst = firstPass.filter((c) => c.status === 'EXTRACTED_UNVERIFIED');
    expect(activeFirst.length).toBe(firstPass.length);

    const second = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
      extractor: new DeterministicFakeExtractor('1.0.1-f3a'),
    });
    await second.enqueueExtractCandidates(doctorA, itemId, new Date(), extractEnv);
    await second.runDueJobs(doctorA, 'ehas2-f3a-w2', new Date(), extractEnv);
    const all = await second.listExtractionCandidates(doctorA, itemId, extractEnv);
    expect(all.some((c) => c.status === 'SUPERSEDED')).toBe(true);
    expect(
      all.some((c) => c.status === 'EXTRACTED_UNVERIFIED' && c.extractorVersion === '1.0.1-f3a'),
    ).toBe(true);
  });

  it('refuses extraction without CLEAN and for patient photographs', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const clean = evidenceService('CLEAN');
    const { itemId } = await storedEvidence(doctorA, clean, 'BLOOD_REPORT');
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_evidence_items SET malware_scan_result = 'UNAVAILABLE' WHERE id = $1`,
          [itemId],
        );
      },
      env,
    );
    await clean.enqueueExtractCandidates(doctorA, itemId, new Date(), extractEnv);
    await clean.runDueJobs(doctorA, 'ehas2-f3a-unclean', new Date(), extractEnv);
    expect(await clean.listExtractionCandidates(doctorA, itemId, extractEnv)).toEqual([]);

    const photos = evidenceService('CLEAN');
    const photo = await storedEvidence(doctorA, photos, 'PATIENT_PHOTO');
    await photos.enqueueExtractCandidates(doctorA, photo.itemId, new Date(), extractEnv);
    await photos.runDueJobs(doctorA, 'ehas2-f3a-photo', new Date(), extractEnv);
    expect(await photos.listExtractionCandidates(doctorA, photo.itemId, extractEnv)).toEqual([]);
  });

  it('does not claim extract jobs unless explicitly enabled and times out never-settling extractors', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const disabled = evidenceService('CLEAN');
    const { itemId } = await storedEvidence(doctorA, disabled, 'BLOOD_REPORT');
    await expect(
      disabled.enqueueExtractCandidates(doctorA, itemId, new Date(), env),
    ).rejects.toBeInstanceOf(ValidationError);
    const enabled = evidenceService('CLEAN');
    await enabled.enqueueExtractCandidates(doctorA, itemId, new Date(), extractEnv);
    const skipped = await enabled.runDueJobs(doctorA, 'ehas2-f3a-off', new Date(), env);
    expect(skipped.processed).toBe(0);

    const hanging = new EvidenceService({
      store,
      malwareScanner: new DeterministicMalwareScanner('CLEAN'),
      rateLimiter: new MemoryRateLimiter(),
      extractor: new NeverSettlingExtractor(),
    });
    const hangingResult = await hanging.runDueJobs(
      doctorA,
      'ehas2-f3a-timeout',
      new Date(),
      extractEnv,
    );
    expect(hangingResult.failed + hangingResult.dead).toBeGreaterThanOrEqual(1);
  }, 20_000);

  it('keeps candidates after original deletion', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService('CLEAN');
    const { itemId } = await storedEvidence(doctorA, service, 'CT');
    await service.enqueueExtractCandidates(doctorA, itemId, new Date(), extractEnv);
    await service.runDueJobs(doctorA, 'ehas2-f3a-ct', new Date(), extractEnv);
    const before = await service.listExtractionCandidates(doctorA, itemId, extractEnv);
    expect(before.some((c) => c.candidateType === 'WRITTEN_IMPRESSION_TEXT')).toBe(true);
    await service.runDueJobs(doctorA, 'ehas2-f3a-delete', new Date(Date.now() + 61 * 60_000), env);
    const after = await service.listExtractionCandidates(doctorA, itemId, extractEnv);
    expect(after.length).toBe(before.length);
  });
});
