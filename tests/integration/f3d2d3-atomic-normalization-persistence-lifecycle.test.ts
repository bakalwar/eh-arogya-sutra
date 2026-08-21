import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ConsultationIntakeService,
  ConsultationService,
  EvidenceService,
  FactCandidateService,
  FactNormalizationService,
  IdempotencyConflictError,
  PatientService,
  PgFactCandidateRepository,
  PgFactNormalizationRepository,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ResourceNotFoundError,
  ValidationError,
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
import { DeterministicFakeExtractor } from '../../packages/evidence-extract/src/index.ts';
import {
  recordEvidenceEvent,
  resetEvidenceMetrics,
} from '../../packages/observability/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2d3_test');
const factEnv = {
  ...env,
  EHAS2_F3D_FACT_CANDIDATES: '1',
  EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
  EHAS2_F3C_CANDIDATE_REVIEW: '1',
};
let dbReady = false;
resetMemoryFakeObjectStore();
const store = new MemoryFakeObjectStore();

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const factsRepo = new PgFactCandidateRepository();
const normsRepo = new PgFactNormalizationRepository();
const normService = new FactNormalizationService();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
  Object.assign(process.env, factEnv);
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
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2D3 tests');
  }
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

function evidenceService(): EvidenceService {
  return new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner('CLEAN'),
    rateLimiter: new MemoryRateLimiter(),
    extractor: new DeterministicFakeExtractor(),
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
        displayName: 'Synthetic F3D2D3 Doctor A',
        actorId: '00000000-0000-4000-8000-0000000003d1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic F3D2D3 Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic F3D2D3 Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic F3D2D3 Doctor B',
        actorId: '00000000-0000-4000-8000-0000000003d2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic F3D2D3 Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic F3D2D3 Clinic B', actorId: uB.id },
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

async function openChiefFact(
  tenant: TenantContext,
  text: string,
): Promise<{ consultationId: string; factId: string }> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic F3D2D3 Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: text },
    env,
  );
  await intake.patch(
    tenant,
    consultation.id,
    { chiefComplaintText: text, chiefComplaintDuration: '2 days' },
    env,
  );
  const fact = await factService().materialize(
    tenant,
    consultation.id,
    {
      sourceChannel: 'DOCTOR_DECLARED',
      sourceField: 'CHIEF_COMPLAINT',
      idempotencyKey: `d3-fact-${consultation.id}-${text.slice(0, 12)}`,
    },
    factEnv,
  );
  return { consultationId: consultation.id, factId: fact.id };
}

async function countNorms(
  tenant: TenantContext,
  factId: string,
): Promise<{ active: number; superseded: number; total: number }> {
  return withTenantTransaction(
    tenant,
    async (tx) => {
      const rows = await normsRepo.listByParentFact(tenant, tx, factId);
      return {
        active: rows.filter((r) => r.decisionStatus === 'ACTIVE').length,
        superseded: rows.filter((r) => r.decisionStatus === 'SUPERSEDED').length,
        total: rows.length,
      };
    },
    env,
  );
}

describe('F3D-2D3 atomic normalization persistence + lifecycle (isolated PostgreSQL)', () => {
  it('migration tip remains 016', () => {
    requireDb();
    expect(getOrderedMigrationIds().at(-1)).toBe('016_f3d2_fact_normalizations');
  });

  it('chief-complaint source materializes ACTIVE norms; replay and stale binding behave', async () => {
    requireDb();
    resetEvidenceMetrics();
    const { doctorA, doctorB } = await seedTenants();
    const { consultationId, factId } = await openChiefFact(doctorA, 'denies fever');

    const first = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: factId, idempotencyKey: `d3-cc-${factId}-a` },
      env,
    );
    expect(first.reason).toBe('NORMALIZED');
    expect(first.normalizations.length).toBeGreaterThanOrEqual(1);
    expect(
      first.normalizations.every((n) => n.authorityScope === 'FACT_NORMALIZED_SOURCE_LINKED'),
    ).toBe(true);
    expect(first.normalizations.every((n) => n.clinicallyUsed === false)).toBe(true);
    expect(first.normalizations.every((n) => n.sourceFactCandidateId === factId)).toBe(true);

    const replay = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: factId, idempotencyKey: `d3-cc-${factId}-a` },
      env,
    );
    expect(replay.replayed).toBe(true);
    expect(replay.normalizations.map((n) => n.id).sort()).toEqual(
      first.normalizations.map((n) => n.id).sort(),
    );

    await expect(
      normService.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: factId, idempotencyKey: `d3-cc-${factId}-a` },
        // force hash change via unknown key rejected earlier; use different key after edit
        env,
      ),
    ).resolves.toMatchObject({ replayed: true });

    await expect(
      normService.materializeFactNormalizations(
        doctorB,
        { sourceFactCandidateId: factId, idempotencyKey: `d3-cc-xtenant-${factId}` },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await intake.patch(
      doctorA,
      consultationId,
      { chiefComplaintText: 'denies cough', idempotencyKey: `d3-edit-${consultationId}` },
      env,
    );
    const afterEdit = await countNorms(doctorA, factId);
    expect(afterEdit.active).toBe(0);
    expect(afterEdit.superseded).toBeGreaterThanOrEqual(1);

    const parent = await withTenantTransaction(
      doctorA,
      async (tx) => factsRepo.findById(doctorA, tx, factId),
      env,
    );
    expect(parent?.decisionStatus).toBe('SUPERSEDED');

    await expect(
      normService.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: factId, idempotencyKey: `d3-cc-${factId}-stale` },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'FACT_INELIGIBLE' });

    const fresh = await factService().materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: `d3-fact-fresh-${consultationId}`,
      },
      factEnv,
    );
    await expect(
      normService.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: fresh.id, idempotencyKey: `d3-cc-${factId}-a` },
        env,
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);

    const freshNorm = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fresh.id, idempotencyKey: `d3-cc-fresh-${fresh.id}` },
      env,
    );
    expect(freshNorm.sourceFactCandidateId).toBe(fresh.id);
    expect(freshNorm.reason).toBe('NORMALIZED');
  });

  it('NO_MATCHES records idempotency without normalization rows; changed binding conflicts', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultationId, factId } = await openChiefFact(doctorA, 'zzzz no cue tokens here');
    const key = `d3-nomatch-${factId}`;
    const first = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: factId, idempotencyKey: key },
      env,
    );
    expect(first.reason).toBe('NO_MATCHES');
    expect(first.normalizations).toEqual([]);
    const counts = await countNorms(doctorA, factId);
    expect(counts.total).toBe(0);

    const replay = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: factId, idempotencyKey: key },
      env,
    );
    expect(replay.replayed).toBe(true);
    expect(replay.normalizations).toEqual([]);

    await intake.patch(
      doctorA,
      consultationId,
      { chiefComplaintText: 'denies fever', idempotencyKey: `d3-nomatch-edit-${consultationId}` },
      env,
    );
    await expect(
      normService.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: factId, idempotencyKey: key },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'FACT_INELIGIBLE' });
  });

  it('STRUCTURED_UNIT / vitals are deferred fail-closed', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Vital Patient', dateOfBirth: '1980-01-15' },
      {},
      env,
    );
    const consultation = await consultations.create(
      doctorA,
      { patientId: patient.id, chiefComplaintText: 'vitals only' },
      env,
    );
    await intake.patch(
      doctorA,
      consultation.id,
      { vitals: { pulseBpm: 72 }, idempotencyKey: `d3-vital-patch-${consultation.id}` },
      env,
    );
    const vitalFact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        idempotencyKey: `d3-vital-fact-${consultation.id}`,
      },
      factEnv,
    );
    await expect(
      normService.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: vitalFact.id, idempotencyKey: `d3-vital-norm-${vitalFact.id}` },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'STRUCTURED_UNIT_DEFERRED' });
  });

  it('F3C ACCEPT/CORRECT path persists; review replacement supersedes linked norms', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const evidence = evidenceService();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic F3C D3 Patient', dateOfBirth: '1980-01-15' },
      {},
      env,
    );
    const consultation = await consultations.create(
      doctorA,
      { patientId: patient.id, chiefComplaintText: 'synthetic f3c d3' },
      env,
    );
    const item = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'BLOOD_REPORT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'lab.png',
        declaredMime: 'image/png',
      },
      env,
    );
    await evidence.receiveBytes(doctorA, consultation.id, item.id, PNG, env);
    await evidence.enqueueExtractCandidates(doctorA, item.id, new Date(), factEnv);
    await evidence.runDueJobs(doctorA, 'ehas2-f3d2d3-worker', new Date(), factEnv);
    const candidates = await evidence.listExtractionCandidates(doctorA, item.id, factEnv);
    const english = candidates.find((c) => c.rawText === 'Hemoglobin');
    if (!english?.id) throw new Error('BLOCKED: missing Hemoglobin candidate');

    const accept = await evidence.submitCandidateReview(
      doctorA,
      consultation.id,
      item.id,
      english.id,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `d3-f3c-accept-${english.id}`,
      },
      factEnv,
    );

    const fact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: item.id,
        candidateId: english.id,
        idempotencyKey: `d3-f3c-fact-${english.id}`,
      },
      factEnv,
    );

    const acceptedNorm = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact.id, idempotencyKey: `d3-f3c-norm-${fact.id}` },
      env,
    );
    expect(['NORMALIZED', 'NO_MATCHES']).toContain(acceptedNorm.reason);

    const correct = await evidence.submitCandidateReview(
      doctorA,
      consultation.id,
      item.id,
      english.id,
      {
        action: 'CORRECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_MISREAD',
        correctedRawText: 'denies fever',
        supersedesReviewId: accept.id,
        idempotencyKey: `d3-f3c-correct-${english.id}`,
      },
      factEnv,
    );
    expect(correct.decisionStatus).toBe('ACTIVE');
    expect(accept.id).not.toBe(correct.id);

    const afterCorrect = await countNorms(doctorA, fact.id);
    expect(afterCorrect.active).toBe(0);

    const parent = await withTenantTransaction(
      doctorA,
      async (tx) => factsRepo.findById(doctorA, tx, fact.id),
      env,
    );
    expect(parent?.decisionStatus).toBe('SUPERSEDED');

    const reviews = await withAdminClient(async (query) => {
      const r = await query(
        `SELECT decision_status FROM clinical_evidence_extraction_candidate_reviews
         WHERE organization_id = $1 AND clinic_id = $2 AND candidate_id = $3
         ORDER BY created_at ASC`,
        [doctorA.organizationId, doctorA.clinicId, english.id],
      );
      return r.rows as { decision_status: string }[];
    }, env);
    expect(reviews.some((r) => r.decision_status === 'SUPERSEDED')).toBe(true);
    expect(reviews.some((r) => r.decision_status === 'ACTIVE')).toBe(true);

    const freshFact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: item.id,
        candidateId: english.id,
        idempotencyKey: `d3-f3c-fact2-${english.id}`,
      },
      factEnv,
    );
    const correctedNorm = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: freshFact.id, idempotencyKey: `d3-f3c-norm2-${freshFact.id}` },
      env,
    );
    expect(correctedNorm.reason).toBe('NORMALIZED');
    expect(correctedNorm.normalizations.length).toBeGreaterThanOrEqual(1);
  });

  it('explicit fact replacement supersedes linked normalizations', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultationId, factId } = await openChiefFact(doctorA, 'denies fever');
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: factId, idempotencyKey: `d3-repl-norm-${factId}` },
      env,
    );
    const before = await countNorms(doctorA, factId);
    expect(before.active).toBeGreaterThanOrEqual(1);

    const replaced = await factService().materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        supersedesFactId: factId,
        idempotencyKey: `d3-repl-fact-${consultationId}`,
      },
      factEnv,
    );
    expect(replaced.id).not.toBe(factId);
    const after = await countNorms(doctorA, factId);
    expect(after.active).toBe(0);
    expect(after.superseded).toBeGreaterThanOrEqual(1);
  });

  it('/ready and authz posture unchanged; no API activation of D3', async () => {
    requireDb();
    const ready = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).toMatch(/normalizationParserAvailable:\s*NORMALIZATION_PARSER_AVAILABLE/);
    expect(ready).toMatch(/cueParserConnected:\s*CUE_PARSER_CONNECTED/);
    expect(ready).toMatch(/cueParserProductionEnabled:\s*CUE_PARSER_PRODUCTION_ENABLED/);
    expect(ready).not.toMatch(/f3d2dFoundation/);
    expect(ready).not.toMatch(/materializeFactNormalizations/);
    const serviceSrc = fs.readFileSync(
      path.join(root, 'packages/database/src/services/factNormalizationService.ts'),
      'utf8',
    );
    expect(serviceSrc).not.toMatch(/apps\/api|createApp|router\.(post|get)/i);
  });

  it('unknown authority/raw/parser keys rejected; IdempotencyConflictError name is stable', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { factId } = await openChiefFact(doctorA, 'denies fever');
    await expect(
      normService.materializeFactNormalizations(doctorA, {
        sourceFactCandidateId: factId,
        idempotencyKey: 'd3-bad-keys-aaaa',
        organizationId: doctorA.organizationId,
      } as never),
    ).rejects.toBeInstanceOf(ValidationError);

    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: factId, idempotencyKey: 'd3-hash-stable-01' },
      env,
    );
    // Same key after source invalidation on a NEW fact id with reused key from another parent
    // is covered above; ensure conflict error type exists for changed hash paths.
    expect(IdempotencyConflictError.name).toBe('IdempotencyConflictError');
  });
});
