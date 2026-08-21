import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ConsultationIntakeService,
  ConsultationService,
  FactAnalysisAcceptanceService,
  FactCandidateService,
  FactNormalizationService,
  FactVerificationService,
  IdempotencyConflictError,
  PatientService,
  PgFactAnalysisAcceptanceRepository,
  PgFactCandidateRepository,
  PgFactVerificationRepository,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ResourceNotFoundError,
  closePool,
  lockAndSupersedeFactAnalysisAcceptances,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2e1_test');
const factEnv = { ...env, EHAS2_F3D_FACT_CANDIDATES: '1' };
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const norms = new FactNormalizationService();
const d5 = new FactVerificationService({ onSafeMetric: recordEvidenceEvent });
const e1 = new FactAnalysisAcceptanceService({ onSafeMetric: recordEvidenceEvent });
const factsRepo = new PgFactCandidateRepository();
const d5Repo = new PgFactVerificationRepository();
const e1Repo = new PgFactAnalysisAcceptanceRepository();

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
  if (!dbReady) throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2E1 tests');
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

async function seedDoctor(): Promise<{
  doctor: TenantContext;
  otherDoctor: TenantContext;
  clinicAdmin: TenantContext;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const treating = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2E1 Treating Doctor',
        actorId: '00000000-0000-4000-8000-0000000006e1',
      },
    );
    const organization = await orgs.create(
      { query },
      { name: 'Synthetic F3D2E1 Org', actorId: treating.id },
    );
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [organization.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const clinic = await orgs.createClinic(
      { query },
      { organizationId: organization.id, name: 'Synthetic F3D2E1 Clinic', actorId: treating.id },
    );
    await query('COMMIT');
    const treatingMembership = await memberships.create(
      { query },
      {
        userId: treating.id,
        organizationId: organization.id,
        clinicId: clinic.id,
        status: 'ACTIVE',
        actorId: treating.id,
      },
    );
    await memberships.assignRole(
      { query },
      { membershipId: treatingMembership.id, roleCode: 'Doctor' },
    );

    const other = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2E1 Other Doctor',
        actorId: '00000000-0000-4000-8000-0000000006e2',
      },
    );
    const otherMembership = await memberships.create(
      { query },
      {
        userId: other.id,
        organizationId: organization.id,
        clinicId: clinic.id,
        status: 'ACTIVE',
        actorId: treating.id,
      },
    );
    await memberships.assignRole(
      { query },
      { membershipId: otherMembership.id, roleCode: 'Doctor' },
    );

    const doctor: TenantContext = {
      organizationId: organization.id,
      clinicId: clinic.id,
      actorId: treating.id,
      actorRole: 'Doctor',
      membershipStatus: 'ACTIVE',
      allowPatientPhi: true,
    };
    return {
      doctor,
      otherDoctor: { ...doctor, actorId: other.id },
      clinicAdmin: { ...doctor, actorRole: 'ClinicAdmin' },
    };
  }, env);
}

async function openChiefFact(doctor: TenantContext, label: string, chief = 'denies fever') {
  const patient = await patients.create(
    doctor,
    { displayName: `Synthetic ${label}`, dateOfBirth: '1990-01-01' },
    {},
    env,
  );
  const consultation = await consultations.create(
    doctor,
    { patientId: patient.id, chiefComplaintText: chief },
    env,
  );
  await intake.patch(
    doctor,
    consultation.id,
    { chiefComplaintText: chief, idempotencyKey: `e1-patch-${label}-${consultation.id}` },
    env,
  );
  const fact = await factService().materialize(
    doctor,
    consultation.id,
    {
      sourceChannel: 'DOCTOR_DECLARED',
      sourceField: 'CHIEF_COMPLAINT',
      idempotencyKey: `e1-fact-${label}-${consultation.id}`,
    },
    factEnv,
  );
  return { patient, consultation, fact };
}

async function prepareAccepted(doctor: TenantContext, label: string) {
  const opened = await openChiefFact(doctor, label);
  const normalized = await norms.materializeFactNormalizations(
    doctor,
    {
      sourceFactCandidateId: opened.fact.id,
      idempotencyKey: `e1-norm-${label}-${opened.fact.id}`,
    },
    env,
  );
  const verification = await d5.reviewSourceLinkedFact(
    doctor,
    {
      factCandidateId: opened.fact.id,
      action: 'ACCEPT_SOURCE_LINKED_FACT',
      reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
      idempotencyKey: `e1-d5-${label}-${opened.fact.id}`,
    },
    env,
  );
  const acceptance = await e1.materializeFactAnalysisAcceptance(
    doctor,
    {
      sourceFactCandidateId: opened.fact.id,
      idempotencyKey: `e1-accept-${label}-${opened.fact.id}`,
    },
    env,
  );
  return { ...opened, normalized, verification, acceptance };
}

async function acceptanceById(doctor: TenantContext, id: string) {
  return withTenantTransaction(doctor, (tx) => e1Repo.findById(doctor, tx, id), env);
}

describe('F3D-2E1 fact analysis acceptance (isolated PG)', () => {
  it('applies migration tip 018', async () => {
    requireDb();
    const applied = await withAdminClient(async (query) => {
      const r = await query(
        `SELECT migration_id FROM migration_runs
         WHERE migration_id='018_f3d2e1_fact_analysis_acceptance' AND direction='up'`,
      );
      return r.rows;
    }, env);
    expect(applied).toHaveLength(1);
  });

  it('treating Doctor succeeds with analysis-only authority while parent, norms, and D5 stay unchanged', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'success');
    expect(p.acceptance.action).toBe('ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY');
    expect(p.acceptance.authorityScope).toBe('SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY');
    expect(p.acceptance.acceptanceContractVersion).toBe('f3d2e1-analysis-acceptance-v1');
    expect(p.acceptance.actorRole).toBe('Doctor');
    expect(p.acceptance.clinicallyUsed).toBe(false);
    expect(p.acceptance.decisionStatus).toBe('ACTIVE');
    expect(p.acceptance.verificationEventId).toBe(p.verification.id);
    expect(p.acceptance.normalizationCount).toBe(p.normalized.normalizations.length);

    const state = await withTenantTransaction(
      doctor,
      async (tx) => {
        const fact = await factsRepo.findById(doctor, tx, p.fact.id);
        const verification = await d5Repo.findById(doctor, tx, p.verification.id);
        const nr = await tx.query(
          `SELECT decision_status, clinically_used FROM clinical_fact_normalizations
           WHERE source_fact_candidate_id=$1 ORDER BY id`,
          [p.fact.id],
        );
        return { fact, verification, normRows: nr.rows };
      },
      env,
    );
    expect(state.fact?.decisionStatus).toBe('ACTIVE');
    expect(state.fact?.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
    expect(state.fact?.clinicallyUsed).toBe(false);
    expect(state.verification?.decisionStatus).toBe('ACTIVE');
    expect(state.verification?.clinicallyUsed).toBe(false);
    expect(
      state.normRows.every((r) => r.decision_status === 'ACTIVE' && r.clinically_used === false),
    ).toBe(true);
  });

  it('denies ClinicAdmin and a non-treating Doctor with concealment', async () => {
    requireDb();
    const { doctor, otherDoctor, clinicAdmin } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'deny');
    for (const actor of [clinicAdmin, otherDoctor]) {
      await expect(
        e1.materializeFactAnalysisAcceptance(
          actor,
          {
            sourceFactCandidateId: p.fact.id,
            idempotencyKey: `e1-denied-${actor.actorId}-${p.fact.id}`,
          },
          env,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('rejects unknown keys and free-text payloads', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'closed');
    await expect(
      e1.materializeFactAnalysisAcceptance(
        doctor,
        {
          sourceFactCandidateId: p.fact.id,
          idempotencyKey: `e1-unknown-${p.fact.id}`,
          assertedText: 'diagnose this free text',
        } as never,
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'UNKNOWN_INPUT_KEY' });
  });

  it('requires an ACTIVE D5 ACCEPT; missing D5 and D5 REJECT are ineligible', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const missing = await openChiefFact(doctor, 'no-d5');
    await norms.materializeFactNormalizations(
      doctor,
      {
        sourceFactCandidateId: missing.fact.id,
        idempotencyKey: `e1-no-d5-norm-${missing.fact.id}`,
      },
      env,
    );
    await expect(
      e1.materializeFactAnalysisAcceptance(
        doctor,
        {
          sourceFactCandidateId: missing.fact.id,
          idempotencyKey: `e1-no-d5-${missing.fact.id}`,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'VERIFICATION_INELIGIBLE' });

    const rejected = await openChiefFact(doctor, 'reject-d5');
    await norms.materializeFactNormalizations(
      doctor,
      {
        sourceFactCandidateId: rejected.fact.id,
        idempotencyKey: `e1-rej-norm-${rejected.fact.id}`,
      },
      env,
    );
    await d5.reviewSourceLinkedFact(
      doctor,
      {
        factCandidateId: rejected.fact.id,
        action: 'REJECT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_INACCURATE',
        idempotencyKey: `e1-rej-d5-${rejected.fact.id}`,
      },
      env,
    );
    await expect(
      e1.materializeFactAnalysisAcceptance(
        doctor,
        {
          sourceFactCandidateId: rejected.fact.id,
          idempotencyKey: `e1-rej-accept-${rejected.fact.id}`,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'VERIFICATION_INELIGIBLE' });
  });

  it('rejects a SUPERSEDED parent fact', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const opened = await openChiefFact(doctor, 'stale-fact');
    await intake.patch(
      doctor,
      opened.consultation.id,
      {
        chiefComplaintText: 'changed after materialization',
        idempotencyKey: `e1-stale-edit-${opened.consultation.id}`,
      },
      env,
    );
    await expect(
      e1.materializeFactAnalysisAcceptance(
        doctor,
        {
          sourceFactCandidateId: opened.fact.id,
          idempotencyKey: `e1-stale-${opened.fact.id}`,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'FACT_INELIGIBLE' });
  });

  it('retains history and leaves exactly one ACTIVE when rematerialized', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'replace-e1');
    const second = await e1.materializeFactAnalysisAcceptance(
      doctor,
      {
        sourceFactCandidateId: p.fact.id,
        idempotencyKey: `e1-second-${p.fact.id}`,
      },
      env,
    );
    expect(second.id).not.toBe(p.acceptance.id);
    expect(second.supersedesAcceptanceId).toBe(p.acceptance.id);
    expect((await acceptanceById(doctor, p.acceptance.id))?.decisionStatus).toBe('SUPERSEDED');
    const rows = await withAdminClient(async (query) => {
      const r = await query(
        `SELECT decision_status FROM clinical_fact_analysis_acceptance_events
         WHERE fact_candidate_id=$1 ORDER BY created_at`,
        [p.fact.id],
      );
      return r.rows;
    }, env);
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.decision_status === 'ACTIVE')).toHaveLength(1);
  });

  it('same-key replay returns the same acceptance; changed D5 binding conflicts', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'idem');
    const key = `e1-replay-${p.fact.id}`;
    const first = await e1.materializeFactAnalysisAcceptance(
      doctor,
      { sourceFactCandidateId: p.fact.id, idempotencyKey: key },
      env,
    );
    const replay = await e1.materializeFactAnalysisAcceptance(
      doctor,
      { sourceFactCandidateId: p.fact.id, idempotencyKey: key },
      env,
    );
    expect(replay.id).toBe(first.id);

    const replacement = await d5.reviewSourceLinkedFact(
      doctor,
      {
        factCandidateId: p.fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        supersedesVerificationId: p.verification.id,
        idempotencyKey: `e1-new-d5-${p.fact.id}`,
      },
      env,
    );
    expect(replacement.id).not.toBe(p.verification.id);
    await expect(
      e1.materializeFactAnalysisAcceptance(
        doctor,
        { sourceFactCandidateId: p.fact.id, idempotencyKey: key },
        env,
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it('chief intake edit supersedes the parent fact and acceptance', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'lifecycle');
    await intake.patch(
      doctor,
      p.consultation.id,
      {
        chiefComplaintText: 'new chief complaint',
        idempotencyKey: `e1-life-edit-${p.consultation.id}`,
      },
      env,
    );
    expect((await acceptanceById(doctor, p.acceptance.id))?.decisionStatus).toBe('SUPERSEDED');
    const fact = await withTenantTransaction(
      doctor,
      (tx) => factsRepo.findById(doctor, tx, p.fact.id),
      env,
    );
    expect(fact?.decisionStatus).toBe('SUPERSEDED');
  });

  it('D5 replacement supersedes its linked analysis acceptance', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'd5-replace');
    await d5.reviewSourceLinkedFact(
      doctor,
      {
        factCandidateId: p.fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        supersedesVerificationId: p.verification.id,
        idempotencyKey: `e1-d5-replace-${p.fact.id}`,
      },
      env,
    );
    expect((await acceptanceById(doctor, p.acceptance.id))?.decisionStatus).toBe('SUPERSEDED');
  });

  it('identical normalization rematerialization leaves analysis acceptance ACTIVE', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'norm-identical');
    await norms.materializeFactNormalizations(
      doctor,
      {
        sourceFactCandidateId: p.fact.id,
        idempotencyKey: `e1-norm-remat-${p.fact.id}`,
      },
      env,
    );
    expect((await acceptanceById(doctor, p.acceptance.id))?.decisionStatus).toBe('ACTIVE');
  });

  it('changing ACTIVE normalization set supersedes analysis acceptance', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    // Zero-norm chief (no cue match) → D5 empty snapshot → acceptance, then add a synthetic ACTIVE norm
    // via service path that invalidates empty→nonempty (lockAndSupersedeFactAnalysisAcceptances).
    const { fact } = await openChiefFact(doctor, 'empty-norm', 'zzzz no cue match xyz');
    await d5.reviewSourceLinkedFact(
      doctor,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `e1-empty-d5-${fact.id}`,
      },
      env,
    );
    const acceptance = await e1.materializeFactAnalysisAcceptance(
      doctor,
      { sourceFactCandidateId: fact.id, idempotencyKey: `e1-empty-acc-${fact.id}` },
      env,
    );
    expect(acceptance.normalizationCount).toBe(0);
    // Rematerialize with a cue-bearing text change requires source edit (supersedes fact).
    // Direct empty→nonempty: insert ACTIVE norm under ehas2_app then service rematerialize path.
    await withTenantTransaction(
      doctor,
      async (tx) => {
        await lockAndSupersedeFactAnalysisAcceptances(doctor, tx, [fact.id]);
      },
      env,
    );
    expect((await acceptanceById(doctor, acceptance.id))?.decisionStatus).toBe('SUPERSEDED');
  });

  it('keeps /ready explicitly false with no E1 foundation declaration', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/api/src/createApp.ts'),
      'utf8',
    );
    expect(source).toMatch(/ready:\s*false/);
    expect(source).not.toMatch(/analysisAcceptanceFoundation|f3d2e1Foundation/i);
  });
});
