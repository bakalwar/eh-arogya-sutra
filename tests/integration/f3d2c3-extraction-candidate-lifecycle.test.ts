import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  EvidenceService,
  FactCandidateService,
  PatientService,
  ConsultationService,
  closePool,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { F3cReviewedCueSourceService } from '../../packages/database/src/services/f3cReviewedCueSourceService.ts';
import {
  f3cReviewedCueSourceLockKey,
  lockF3cReviewedCueSource,
} from '../../packages/database/src/services/cueSourceLock.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import { DeterministicFakeExtractor } from '../../packages/evidence-extract/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3c_test');
const extractEnv = {
  ...env,
  EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
  EHAS2_F3C_CANDIDATE_REVIEW: '1',
  EHAS2_F3D_FACT_CANDIDATES: '1',
};
let dbReady = false;
resetMemoryFakeObjectStore();
const store = new MemoryFakeObjectStore();
const patients = new PatientService();
const consultations = new ConsultationService();
const cues = new F3cReviewedCueSourceService();
const facts = new FactCandidateService();

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

beforeAll(async () => {
  Object.assign(process.env, extractEnv);
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
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2C3 tests');
  }
}

function evidenceService(version = '1.0.0-f3a'): EvidenceService {
  return new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner('CLEAN'),
    rateLimiter: new MemoryRateLimiter(),
    extractor: new DeterministicFakeExtractor(version),
  });
}

function sortCandidateIds(ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

async function seedTenants(): Promise<{ doctorA: TenantContext }> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic C3 Doctor A',
        actorId: '00000000-0000-4000-8000-0000000003c1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic C3 Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic C3 Clinic A', actorId: uA.id },
    );
    await query('COMMIT');
    const mA = await memberships.create(
      { query },
      { userId: uA.id, organizationId: oA.id, clinicId: cA.id, status: 'ACTIVE', actorId: uA.id },
    );
    await memberships.assignRole({ query }, { membershipId: mA.id, roleCode: 'Doctor' });
    return {
      doctorA: {
        organizationId: oA.id,
        clinicId: cA.id,
        actorId: uA.id,
        actorRole: 'Doctor',
        membershipStatus: 'ACTIVE' as const,
        allowPatientPhi: true,
      },
    };
  }, env);
}

async function storedExtracted(
  tenant: TenantContext,
  service: EvidenceService,
): Promise<{
  itemId: string;
  consultationId: string;
  patientId: string;
  englishId: string;
  hindiId: string;
}> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic C3 Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'synthetic c3 fixture' },
    env,
  );
  const item = await service.initiate(
    tenant,
    {
      consultationId: consultation.id,
      evidenceType: 'BLOOD_REPORT',
      sourceType: 'DOCTOR_UPLOAD',
      filename: 'lab.png',
      declaredMime: 'image/png',
    },
    env,
  );
  await service.receiveBytes(tenant, consultation.id, item.id, PNG, env);
  await service.enqueueExtractCandidates(tenant, item.id, new Date(), extractEnv);
  await service.runDueJobs(tenant, 'ehas2-f3d2c3-worker', new Date(), extractEnv);
  const candidates = await service.listExtractionCandidates(tenant, item.id, extractEnv);
  const english = candidates.find((c) => c.rawText === 'Hemoglobin');
  const hindi = candidates.find((c) => c.rawText === 'हीमोग्लोबिन');
  if (!english?.id || !hindi?.id) {
    throw new Error('BLOCKED: expected synthetic English and Hindi candidates');
  }
  return {
    itemId: item.id,
    consultationId: consultation.id,
    patientId: patient.id,
    englishId: english.id,
    hindiId: hindi.id,
  };
}

async function holdLifecycleLock(
  tenant: TenantContext,
  candidateId: string,
): Promise<{ release: () => void; held: Promise<void> }> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let signalAcquired!: () => void;
  const acquired = new Promise<void>((resolve) => {
    signalAcquired = resolve;
  });
  const held = withTenantTransaction(
    tenant,
    async (tx) => {
      await lockF3cReviewedCueSource(tx, tenant, candidateId);
      signalAcquired();
      await gate;
    },
    env,
  );
  await acquired;
  return { release, held };
}

async function assertLifecycleLockHeld(tenant: TenantContext, candidateId: string): Promise<void> {
  const key = f3cReviewedCueSourceLockKey({
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    candidateId,
  });
  await withTenantTransaction(
    tenant,
    async (tx) => {
      const r = await tx.query<{ ok: boolean }>(
        `SELECT pg_try_advisory_xact_lock(hashtextextended($1::text, $2::bigint)) AS ok`,
        [key, 0],
      );
      expect(r.rows[0]?.ok).toBe(false);
    },
    env,
  );
}

describe('F3D-2C3 extraction-candidate lifecycle eligibility (isolated PostgreSQL)', () => {
  it('C2 and F3D-1 require EXTRACTED_UNVERIFIED; REJECTED and SUPERSEDED fail closed; reviews stay ACTIVE', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const fixture = await storedExtracted(doctorA, service);
    const accept = await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c3-accept-${fixture.englishId}`,
      },
      extractEnv,
    );
    expect(accept.decisionStatus).toBe('ACTIVE');

    const ok = await cues.parseF3cReviewedSourceCues(
      doctorA,
      {
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        candidateId: fixture.englishId,
      },
      env,
    );
    expect(ok.reviewEventId).toBe(accept.id);

    const factOk = await facts.materialize(
      doctorA,
      fixture.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: fixture.itemId,
        candidateId: fixture.englishId,
        idempotencyKey: `c3-fact-ok-${fixture.englishId}`,
      },
      extractEnv,
    );
    expect(factOk.extractionCandidateId).toBe(fixture.englishId);

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_evidence_extraction_candidates SET status = 'REJECTED' WHERE id = $1`,
          [fixture.englishId],
        );
      },
      env,
    );

    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: fixture.itemId,
          candidateId: fixture.englishId,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    await expect(
      facts.materialize(
        doctorA,
        fixture.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: fixture.itemId,
          candidateId: fixture.englishId,
          idempotencyKey: `c3-fact-rejected-${fixture.englishId}`,
        },
        extractEnv,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const reviewsAfterReject = await service.listCandidateReviews(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      extractEnv,
    );
    expect(
      reviewsAfterReject.some((r) => r.id === accept.id && r.decisionStatus === 'ACTIVE'),
    ).toBe(true);

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_evidence_extraction_candidates SET status = 'EXTRACTED_UNVERIFIED' WHERE id = $1`,
          [fixture.englishId],
        );
      },
      env,
    );

    const v2 = evidenceService('1.0.1-f3a');
    await v2.enqueueExtractCandidates(doctorA, fixture.itemId, new Date(), extractEnv);
    await v2.runDueJobs(doctorA, 'ehas2-f3d2c3-worker-v2', new Date(), extractEnv);
    const after = await v2.listExtractionCandidates(doctorA, fixture.itemId, extractEnv);
    const old = after.find((c) => c.id === fixture.englishId);
    expect(old?.status).toBe('SUPERSEDED');

    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: fixture.itemId,
          candidateId: fixture.englishId,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    await expect(
      facts.materialize(
        doctorA,
        fixture.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: fixture.itemId,
          candidateId: fixture.englishId,
          idempotencyKey: `c3-fact-superseded-${fixture.englishId}`,
        },
        extractEnv,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const reviewsAfterSuper = await service.listCandidateReviews(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      extractEnv,
    );
    expect(reviewsAfterSuper.some((r) => r.id === accept.id && r.decisionStatus === 'ACTIVE')).toBe(
      true,
    );
  }, 180_000);

  it('supersedeRuns waits on sorted lifecycle lock; unrelated later candidate lock does not block', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService('1.0.0-c3-lock');
    const fixture = await storedExtracted(doctorA, service);
    const [firstId, secondId] = sortCandidateIds([fixture.englishId, fixture.hindiId]);

    const holder = await holdLifecycleLock(doctorA, firstId);

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await lockF3cReviewedCueSource(tx, doctorA, secondId);
      },
      env,
    );

    let supersedeSettled = false;
    const v2 = evidenceService('1.0.1-c3-lock');
    await v2.enqueueExtractCandidates(doctorA, fixture.itemId, new Date(), extractEnv);
    const jobPromise = v2
      .runDueJobs(doctorA, 'ehas2-f3d2c3-worker-lock', new Date(), extractEnv)
      .finally(() => {
        supersedeSettled = true;
      });

    await assertLifecycleLockHeld(doctorA, firstId);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(supersedeSettled).toBe(false);

    holder.release();
    await holder.held;
    await jobPromise;
    expect(supersedeSettled).toBe(true);

    const after = await v2.listExtractionCandidates(doctorA, fixture.itemId, extractEnv);
    expect(after.find((c) => c.id === fixture.englishId)?.status).toBe('SUPERSEDED');
    expect(after.find((c) => c.id === fixture.hindiId)?.status).toBe('SUPERSEDED');
    expect(
      after.some(
        (c) => c.status === 'EXTRACTED_UNVERIFIED' && c.extractorVersion === '1.0.1-c3-lock',
      ),
    ).toBe(true);
  }, 180_000);
});
