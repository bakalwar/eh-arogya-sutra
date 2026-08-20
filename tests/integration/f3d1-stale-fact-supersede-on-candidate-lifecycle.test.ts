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
import {
  f3cReviewedCueSourceLockKey,
  lockF3cReviewedCueSource,
} from '../../packages/database/src/services/cueSourceLock.ts';
import { PgFactCandidateRepository } from '../../packages/database/src/repositories/factCandidate.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import { DeterministicFakeExtractor } from '../../packages/evidence-extract/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d_test');
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
const facts = new FactCandidateService();
const factRepo = new PgFactCandidateRepository();

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
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-1 stale-fact tests');
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

function sortIds(ids: readonly string[]): string[] {
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
        displayName: 'Synthetic StaleFact Doctor A',
        actorId: '00000000-0000-4000-8000-0000000000f1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic StaleFact Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic StaleFact Clinic A', actorId: uA.id },
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
  englishId: string;
  hindiId: string;
}> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic StaleFact Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'synthetic stale fact fixture' },
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
  await service.runDueJobs(tenant, 'ehas2-stale-f3d1-worker', new Date(), extractEnv);
  const candidates = await service.listExtractionCandidates(tenant, item.id, extractEnv);
  const english = candidates.find((c) => c.rawText === 'Hemoglobin');
  const hindi = candidates.find((c) => c.rawText === 'हीमोग्लोबिन');
  if (!english?.id || !hindi?.id) {
    throw new Error('BLOCKED: expected synthetic English and Hindi candidates');
  }
  return {
    itemId: item.id,
    consultationId: consultation.id,
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

describe('F3D-1 stale fact supersede on candidate lifecycle (isolated PostgreSQL)', () => {
  it('supersedeRuns marks linked ACTIVE facts SUPERSEDED; list keeps full history; rematerialize fails; reviews stay ACTIVE', async () => {
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
        idempotencyKey: `stale-accept-${fixture.englishId}`,
      },
      extractEnv,
    );
    expect(accept.decisionStatus).toBe('ACTIVE');

    const factOk = await facts.materialize(
      doctorA,
      fixture.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: fixture.itemId,
        candidateId: fixture.englishId,
        idempotencyKey: `stale-fact-${fixture.englishId}`,
      },
      extractEnv,
    );
    expect(factOk.decisionStatus).toBe('ACTIVE');
    expect(factOk.extractionCandidateId).toBe(fixture.englishId);

    const v2 = evidenceService('1.0.1-stale');
    await v2.enqueueExtractCandidates(doctorA, fixture.itemId, new Date(), extractEnv);
    await v2.runDueJobs(doctorA, 'ehas2-stale-f3d1-worker-v2', new Date(), extractEnv);

    const listed = await facts.list(doctorA, fixture.consultationId, extractEnv);
    const linked = listed.filter((f) => f.extractionCandidateId === fixture.englishId);
    expect(linked.length).toBeGreaterThanOrEqual(1);
    expect(
      linked.every((f) => (f.id === factOk.id ? f.decisionStatus === 'SUPERSEDED' : true)),
    ).toBe(true);
    expect(linked.some((f) => f.id === factOk.id && f.decisionStatus === 'SUPERSEDED')).toBe(true);
    expect(linked.some((f) => f.id === factOk.id && f.decisionStatus === 'ACTIVE')).toBe(false);
    expect(listed.some((f) => f.decisionStatus === 'SUPERSEDED')).toBe(true);

    await expect(
      facts.materialize(
        doctorA,
        fixture.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: fixture.itemId,
          candidateId: fixture.englishId,
          idempotencyKey: `stale-fact-${fixture.englishId}`,
        },
        extractEnv,
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
          idempotencyKey: `stale-fact-newkey-${fixture.englishId}`,
        },
        extractEnv,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const reviews = await service.listCandidateReviews(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      extractEnv,
    );
    expect(reviews.some((r) => r.id === accept.id && r.decisionStatus === 'ACTIVE')).toBe(true);
  }, 180_000);

  it('concurrent materialize waits on lifecycle lock; unrelated later candidate remains independent', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService('1.0.0-stale-lock');
    const fixture = await storedExtracted(doctorA, service);
    const [firstId, secondId] = sortIds([fixture.englishId, fixture.hindiId]);

    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `stale-lock-accept-en-${fixture.englishId}`,
      },
      extractEnv,
    );
    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.hindiId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `stale-lock-accept-hi-${fixture.hindiId}`,
      },
      extractEnv,
    );

    const holder = await holdLifecycleLock(doctorA, firstId);

    let materializeSettled = false;
    const materializePromise = facts
      .materialize(
        doctorA,
        fixture.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: fixture.itemId,
          candidateId: firstId,
          idempotencyKey: `stale-lock-mat-${firstId}`,
        },
        extractEnv,
      )
      .finally(() => {
        materializeSettled = true;
      });

    await assertLifecycleLockHeld(doctorA, firstId);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(materializeSettled).toBe(false);

    const secondFact = await facts.materialize(
      doctorA,
      fixture.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: fixture.itemId,
        candidateId: secondId,
        idempotencyKey: `stale-lock-mat-${secondId}`,
      },
      extractEnv,
    );
    expect(secondFact.decisionStatus).toBe('ACTIVE');
    expect(secondFact.extractionCandidateId).toBe(secondId);
    expect(materializeSettled).toBe(false);

    holder.release();
    await holder.held;
    const firstFact = await materializePromise;
    expect(materializeSettled).toBe(true);
    expect(firstFact.decisionStatus).toBe('ACTIVE');
    expect(firstFact.extractionCandidateId).toBe(firstId);

    const v2 = evidenceService('1.0.1-stale-lock');
    await v2.enqueueExtractCandidates(doctorA, fixture.itemId, new Date(), extractEnv);
    await v2.runDueJobs(doctorA, 'ehas2-stale-f3d1-worker-lock', new Date(), extractEnv);

    const listed = await facts.list(doctorA, fixture.consultationId, extractEnv);
    expect(listed.some((f) => f.id === firstFact.id && f.decisionStatus === 'SUPERSEDED')).toBe(
      true,
    );
    expect(listed.some((f) => f.id === secondFact.id && f.decisionStatus === 'SUPERSEDED')).toBe(
      true,
    );
    expect(listed.filter((f) => f.id === firstFact.id || f.id === secondFact.id)).toHaveLength(2);
  }, 180_000);

  it('supersedeRuns waits for sorted fact-identity locks; candidate and fact stay unchanged until locks acquired', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService('1.0.0-stale-factlock');
    const fixture = await storedExtracted(doctorA, service);
    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `stale-factlock-accept-${fixture.englishId}`,
      },
      extractEnv,
    );
    const factOk = await facts.materialize(
      doctorA,
      fixture.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: fixture.itemId,
        candidateId: fixture.englishId,
        idempotencyKey: `stale-factlock-mat-${fixture.englishId}`,
      },
      extractEnv,
    );

    let releaseFact!: () => void;
    const factGate = new Promise<void>((resolve) => {
      releaseFact = resolve;
    });
    let factLockAcquired!: () => void;
    const factAcquired = new Promise<void>((resolve) => {
      factLockAcquired = resolve;
    });
    const factHeld = withTenantTransaction(
      doctorA,
      async (tx) => {
        await factRepo.lockIdentity(tx, factOk.sourceIdentityFingerprint);
        factLockAcquired();
        await factGate;
      },
      env,
    );
    await factAcquired;

    let supersedeSettled = false;
    const v2 = evidenceService('1.0.1-stale-factlock');
    await v2.enqueueExtractCandidates(doctorA, fixture.itemId, new Date(), extractEnv);
    const jobPromise = v2
      .runDueJobs(doctorA, 'ehas2-stale-f3d1-worker-factlock', new Date(), extractEnv)
      .finally(() => {
        supersedeSettled = true;
      });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(supersedeSettled).toBe(false);

    const midCandidates = await service.listExtractionCandidates(
      doctorA,
      fixture.itemId,
      extractEnv,
    );
    expect(midCandidates.find((c) => c.id === fixture.englishId)?.status).toBe(
      'EXTRACTED_UNVERIFIED',
    );
    const midList = await facts.list(doctorA, fixture.consultationId, extractEnv);
    expect(midList.find((f) => f.id === factOk.id)?.decisionStatus).toBe('ACTIVE');

    releaseFact();
    await factHeld;
    await jobPromise;
    expect(supersedeSettled).toBe(true);

    const afterCandidates = await v2.listExtractionCandidates(doctorA, fixture.itemId, extractEnv);
    expect(afterCandidates.find((c) => c.id === fixture.englishId)?.status).toBe('SUPERSEDED');
    const afterList = await facts.list(doctorA, fixture.consultationId, extractEnv);
    expect(afterList.find((f) => f.id === factOk.id)?.decisionStatus).toBe('SUPERSEDED');
  }, 180_000);
});
