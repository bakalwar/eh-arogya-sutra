import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import {
  ConsultationIntakeService,
  ConsultationService,
  EMPTY_FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_FINGERPRINT,
  FactAnalysisAcceptanceService,
  FactCandidateService,
  FactNormalizationService,
  FactVerificationService,
  PatientService,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  closePool,
  factAnalysisAcceptanceSubjectLockKey,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2e1_test');
const factEnv = { ...env, EHAS2_F3D_FACT_CANDIDATES: '1' };
const EMPTY_FP = EMPTY_FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_FINGERPRINT;
const BAD_FP = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const META_FP = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const normService = new FactNormalizationService();
const d5 = new FactVerificationService({ onSafeMetric: recordEvidenceEvent });
const e1 = new FactAnalysisAcceptanceService({ onSafeMetric: recordEvidenceEvent });

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
  Object.assign(process.env, factEnv);
  try {
    const client = new pg.Client({ connectionString: env.EHAS2_DATABASE_URL });
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
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2E1 DB binding tests');
  }
}

async function seedDoctor(): Promise<TenantContext> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const user = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2E1 Binding Doctor',
        actorId: '00000000-0000-4000-8000-0000000006f1',
      },
    );
    const organization = await orgs.create(
      { query },
      { name: 'Synthetic F3D2E1 Binding Org', actorId: user.id },
    );
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [organization.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const clinic = await orgs.createClinic(
      { query },
      { organizationId: organization.id, name: 'Synthetic Binding Clinic', actorId: user.id },
    );
    await query('COMMIT');
    const membership = await memberships.create(
      { query },
      {
        userId: user.id,
        organizationId: organization.id,
        clinicId: clinic.id,
        status: 'ACTIVE',
        actorId: user.id,
      },
    );
    await memberships.assignRole({ query }, { membershipId: membership.id, roleCode: 'Doctor' });
    return {
      organizationId: organization.id,
      clinicId: clinic.id,
      actorId: user.id,
      actorRole: 'Doctor',
      membershipStatus: 'ACTIVE',
      allowPatientPhi: true,
    };
  }, env);
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

async function openEmptyVerifiedFact(doctor: TenantContext, label: string) {
  const patient = await patients.create(
    doctor,
    { displayName: `Synthetic Binding ${label}`, dateOfBirth: '1990-01-01' },
    {},
    env,
  );
  const consultation = await consultations.create(
    doctor,
    { patientId: patient.id, chiefComplaintText: 'xzyqv zqwrv plmkj' },
    env,
  );
  await intake.patch(
    doctor,
    consultation.id,
    {
      chiefComplaintText: 'xzyqv zqwrv plmkj',
      idempotencyKey: `e1-bind-patch-${label}-${consultation.id}`,
    },
    env,
  );
  const fact = await factService().materialize(
    doctor,
    consultation.id,
    {
      sourceChannel: 'DOCTOR_DECLARED',
      sourceField: 'CHIEF_COMPLAINT',
      idempotencyKey: `e1-bind-fact-${label}-${consultation.id}`,
    },
    factEnv,
  );
  const normalized = await normService.materializeFactNormalizations(
    doctor,
    {
      sourceFactCandidateId: fact.id,
      idempotencyKey: `e1-bind-norm-${label}-${fact.id}`,
    },
    env,
  );
  expect(normalized.normalizations).toHaveLength(0);
  const verification = await d5.reviewSourceLinkedFact(
    doctor,
    {
      factCandidateId: fact.id,
      action: 'ACCEPT_SOURCE_LINKED_FACT',
      reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
      idempotencyKey: `e1-bind-d5-${label}-${fact.id}`,
    },
    env,
  );
  return { patient, consultation, fact, verification };
}

async function openAppTx(doctor: TenantContext): Promise<pg.Client> {
  const client = new pg.Client({ connectionString: env.EHAS2_DATABASE_URL });
  await client.connect();
  await client.query('BEGIN');
  await client.query('SET LOCAL ROLE ehas2_app');
  await client.query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [doctor.organizationId]);
  await client.query(`SELECT set_config('ehas2.clinic_id', $1, true)`, [doctor.clinicId]);
  await client.query(`SELECT set_config('ehas2.actor_id', $1, true)`, [doctor.actorId]);
  await client.query(`SELECT set_config('ehas2.actor_role', 'Doctor', true)`);
  return client;
}

type Prepared = Awaited<ReturnType<typeof openEmptyVerifiedFact>>;

async function insertEmptyAcceptance(
  client: pg.Client,
  doctor: TenantContext,
  prepared: Prepared,
  fingerprint = EMPTY_FP,
  count = 0,
): Promise<string> {
  const r = await client.query(
    `INSERT INTO clinical_fact_analysis_acceptance_events (
       organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
       source_channel, source_field, source_identity_fingerprint, content_fingerprint,
       verification_event_id, normalization_snapshot_fingerprint, normalization_count,
       action, authority_scope, reason_code, decision_status, supersedes_acceptance_id,
       actor_id, actor_role, clinically_used, acceptance_contract_version,
       pack_id, pack_version, pack_content_checksum, parser_version, parser_fingerprint,
       normalizer_method, normalizer_version, normalizer_fingerprint
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
       'ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY',
       'SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY',
       'SOURCE_LINKED_FACT_ANALYSIS_ACCEPTED','ACTIVE',NULL,$13,'Doctor',false,
       'f3d2e1-analysis-acceptance-v1','synthetic-pack','1.0',$14,'parser-v1',$14,
       'OWNER_FROZEN_SOURCE_PRESERVING_V1','1',$14
     ) RETURNING id`,
    [
      doctor.organizationId,
      doctor.clinicId,
      prepared.fact.patientId,
      prepared.fact.consultationId,
      prepared.fact.id,
      prepared.fact.sourceChannel,
      prepared.fact.sourceField,
      prepared.fact.sourceIdentityFingerprint,
      prepared.fact.contentFingerprint,
      prepared.verification.id,
      fingerprint,
      count,
      doctor.actorId,
      META_FP,
    ],
  );
  return String((r.rows[0] as { id: string }).id);
}

async function insertSyntheticNorm(
  client: pg.Client,
  doctor: TenantContext,
  prepared: Prepared,
): Promise<void> {
  await client.query(
    `INSERT INTO clinical_fact_normalizations (
       organization_id, clinic_id, patient_id, consultation_id, source_fact_candidate_id,
       source_identity_fingerprint, normalization_identity_fingerprint,
       source_channel, source_field, normalization_kind, canonical_label,
       cue_entry_ids, pack_id, pack_version, pack_content_checksum,
       parser_version, parser_fingerprint, normalizer_method, normalizer_version,
       normalizer_fingerprint, authority_scope, decision_status, limitation_codes,
       clinically_used, actor_id, actor_role
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,'NEGATION_CUE','synthetic-new-norm',
       ARRAY[]::text[],'synthetic-pack','1.0',$10,'parser-v1',$10,
       'OWNER_FROZEN_SOURCE_PRESERVING_V1','1',$10,
       'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE','{}'::text[],false,$11,'Doctor'
     )`,
    [
      doctor.organizationId,
      doctor.clinicId,
      prepared.fact.patientId,
      prepared.fact.consultationId,
      prepared.fact.id,
      prepared.fact.sourceIdentityFingerprint,
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      prepared.fact.sourceChannel,
      prepared.fact.sourceField,
      META_FP,
      doctor.actorId,
    ],
  );
}

function isBindingFailure(err: unknown): boolean {
  return /FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID|FACT_VERIFICATION_SNAPSHOT_INVALID/i.test(
    err instanceof Error ? err.message : String(err),
  );
}

async function waitForAdvisoryWaiter(timeoutMs = 10_000): Promise<boolean> {
  const probe = new pg.Client({ connectionString: env.EHAS2_DATABASE_URL });
  await probe.connect();
  try {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const r = await probe.query(
        `SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted LIMIT 1`,
      );
      if ((r.rowCount ?? 0) > 0) return true;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return false;
  } finally {
    await probe.end();
  }
}

describe('F3D-2E1 analysis-acceptance deferred DB binding', () => {
  it('TS lock key matches the SQL lock key', async () => {
    requireDb();
    const org = '11111111-1111-4111-8111-111111111111';
    const clinic = '22222222-2222-4222-8222-222222222222';
    const fact = '33333333-3333-4333-8333-333333333333';
    const ts = factAnalysisAcceptanceSubjectLockKey(org, clinic, fact);
    const sql = await withAdminClient(async (query) => {
      const r = await query(
        `SELECT ehas2_fact_analysis_acceptance_subject_lock_key($1::uuid,$2::uuid,$3::uuid) AS key`,
        [org, clinic, fact],
      );
      return String((r.rows[0] as { key: string }).key);
    }, env);
    expect(ts).toBe(sql);
    expect(ts).toBe(`ehas2:fact-analysis-acceptance:v1:${org}:${clinic}:${fact}`);
  });

  it('rejects a wrong snapshot fingerprint at COMMIT under ehas2_app', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const prepared = await openEmptyVerifiedFact(doctor, 'bad-fp');
    const client = await openAppTx(doctor);
    try {
      await insertEmptyAcceptance(client, doctor, prepared, BAD_FP, 0);
      await expect(client.query('COMMIT')).rejects.toSatisfy(isBindingFailure);
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  it('rejects a normalization count mismatch at COMMIT under ehas2_app', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const prepared = await openEmptyVerifiedFact(doctor, 'bad-count');
    const client = await openAppTx(doctor);
    try {
      await insertEmptyAcceptance(client, doctor, prepared, EMPTY_FP, 1);
      await expect(client.query('COMMIT')).rejects.toSatisfy(isBindingFailure);
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  it('concurrent direct acceptance inserts leave exactly one ACTIVE row', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const prepared = await openEmptyVerifiedFact(doctor, 'two-active');
    const a = await openAppTx(doctor);
    const b = await openAppTx(doctor);
    try {
      await insertEmptyAcceptance(a, doctor, prepared);
      const bInsert = insertEmptyAcceptance(b, doctor, prepared);
      await a.query('COMMIT');
      await expect(bInsert).rejects.toBeTruthy();
      await b.query('ROLLBACK').catch(() => undefined);
      const active = await withAdminClient(async (query) => {
        const r = await query(
          `SELECT count(*)::int AS count
           FROM clinical_fact_analysis_acceptance_events
           WHERE fact_candidate_id=$1 AND decision_status='ACTIVE'`,
          [prepared.fact.id],
        );
        return Number((r.rows[0] as { count: number }).count);
      }, env);
      expect(active).toBe(1);
    } finally {
      await a.end().catch(() => undefined);
      await b.end().catch(() => undefined);
    }
  });

  it('service concurrency serializes replacements to one ACTIVE acceptance', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const prepared = await openEmptyVerifiedFact(doctor, 'service-race');
    const settled = await Promise.allSettled([
      e1.materializeFactAnalysisAcceptance(
        doctor,
        {
          sourceFactCandidateId: prepared.fact.id,
          idempotencyKey: `e1-race-a-${prepared.fact.id}`,
        },
        env,
      ),
      e1.materializeFactAnalysisAcceptance(
        doctor,
        {
          sourceFactCandidateId: prepared.fact.id,
          idempotencyKey: `e1-race-b-${prepared.fact.id}`,
        },
        env,
      ),
    ]);
    expect(settled.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
    const state = await withAdminClient(async (query) => {
      const r = await query(
        `SELECT decision_status FROM clinical_fact_analysis_acceptance_events
         WHERE fact_candidate_id=$1`,
        [prepared.fact.id],
      );
      return r.rows;
    }, env);
    expect(state).toHaveLength(2);
    expect(state.filter((r) => r.decision_status === 'ACTIVE')).toHaveLength(1);
  });

  it('READ COMMITTED waiter blocks on acceptance lock then fails after holder commits acceptance', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const prepared = await openEmptyVerifiedFact(doctor, 'visibility');
    const holder = await openAppTx(doctor);
    const waiter = await openAppTx(doctor);
    try {
      await holder.query(
        `SELECT ehas2_fact_analysis_acceptance_lock_subject($1::uuid,$2::uuid,$3::uuid)`,
        [doctor.organizationId, doctor.clinicId, prepared.fact.id],
      );
      await insertSyntheticNorm(waiter, doctor, prepared);
      const waiterCommit = waiter.query('COMMIT');
      expect(await waitForAdvisoryWaiter()).toBe(true);

      await insertEmptyAcceptance(holder, doctor, prepared);
      await holder.query('COMMIT');
      await expect(waiterCommit).rejects.toSatisfy(isBindingFailure);

      const state = await withAdminClient(async (query) => {
        const ar = await query(
          `SELECT normalization_count FROM clinical_fact_analysis_acceptance_events
           WHERE fact_candidate_id=$1 AND decision_status='ACTIVE'`,
          [prepared.fact.id],
        );
        const nr = await query(
          `SELECT count(*)::int AS count FROM clinical_fact_normalizations
           WHERE source_fact_candidate_id=$1 AND decision_status='ACTIVE'`,
          [prepared.fact.id],
        );
        return {
          acceptanceCount: Number(
            (ar.rows[0] as { normalization_count: number }).normalization_count,
          ),
          normCount: Number((nr.rows[0] as { count: number }).count),
        };
      }, env);
      expect(state).toEqual({ acceptanceCount: 0, normCount: 0 });
    } finally {
      await holder.end().catch(() => undefined);
      await waiter.end().catch(() => undefined);
    }
  });
});
