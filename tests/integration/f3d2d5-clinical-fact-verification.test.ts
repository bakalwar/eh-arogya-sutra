import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConsultationIntakeService,
  ConsultationService,
  FactCandidateService,
  FactConflictError,
  FactNormalizationService,
  FactVerificationService,
  IdempotencyConflictError,
  PatientService,
  PgFactCandidateRepository,
  PgFactVerificationRepository,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ResourceNotFoundError,
  ValidationError,
  closePool,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2d5_test');
const factEnv = {
  ...env,
  EHAS2_F3D_FACT_CANDIDATES: '1',
};
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const factsRepo = new PgFactCandidateRepository();
const verificationsRepo = new PgFactVerificationRepository();
const normService = new FactNormalizationService();
const verificationService = new FactVerificationService({ onSafeMetric: recordEvidenceEvent });

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
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2D5 tests');
  }
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

async function seedTenants(): Promise<{ doctorA: TenantContext; doctorB: TenantContext }> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2D5 Doctor A',
        actorId: '00000000-0000-4000-8000-0000000005d1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic F3D2D5 Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic F3D2D5 Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic F3D2D5 Doctor B',
        actorId: '00000000-0000-4000-8000-0000000005d2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic F3D2D5 Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic F3D2D5 Clinic B', actorId: uB.id },
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

async function openConsult(doctor: TenantContext, label: string) {
  const patient = await patients.create(
    doctor,
    { displayName: label, dateOfBirth: '1990-01-01' },
    {},
    env,
  );
  const consultation = await consultations.create(
    doctor,
    { patientId: patient.id, chiefComplaintText: `${label} chief` },
    env,
  );
  return { patient, consultation };
}

async function materializeChiefFact(doctor: TenantContext, consultationId: string, label: string) {
  await intake.patch(
    doctor,
    consultationId,
    {
      chiefComplaintText: `${label} chief reviewed`,
      idempotencyKey: `d5-chief-patch-${label}-${consultationId}`,
    },
    env,
  );
  return factService().materialize(
    doctor,
    consultationId,
    {
      sourceChannel: 'DOCTOR_DECLARED',
      sourceField: 'CHIEF_COMPLAINT',
      idempotencyKey: `d5-chief-fact-${label}-${consultationId}`,
    },
    factEnv,
  );
}

describe('F3D-2D5 clinical fact-verification (isolated PG)', () => {
  it('a) treating doctor ACCEPT on chief with empty snapshot succeeds; parent stays unverified', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 a');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'a');
    expect(fact.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
    expect(fact.clinicallyUsed).toBe(false);

    const event = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d5-a-accept-${fact.id}`,
      },
      env,
    );
    expect(event.action).toBe('ACCEPT_SOURCE_LINKED_FACT');
    expect(event.normalizationCount).toBe(0);
    expect(event.authorityScope).toBe('SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY');
    expect(event.clinicallyUsed).toBe(false);
    expect(event.decisionStatus).toBe('ACTIVE');
    expect(event.actorRole).toBe('Doctor');

    const parent = await withTenantTransaction(
      doctorA,
      async (tx) => factsRepo.findById(doctorA, tx, fact.id),
      env,
    );
    expect(parent?.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
    expect(parent?.clinicallyUsed).toBe(false);
  });

  it('b/c) same-key idempotent replay; changed action same key → IdempotencyConflictError', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 bc');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'bc');
    const key = `d5-bc-idem-${fact.id}`;
    const first = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: key,
      },
      env,
    );
    const replay = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: key,
      },
      env,
    );
    expect(replay.id).toBe(first.id);

    await expect(
      verificationService.reviewSourceLinkedFact(
        doctorA,
        {
          factCandidateId: fact.id,
          action: 'REJECT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_INACCURATE',
          idempotencyKey: key,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it('d) ClinicAdmin tenant with same actor as doctor → ResourceNotFoundError', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 d');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'd');
    const clinicAdmin: TenantContext = {
      ...doctorA,
      actorRole: 'ClinicAdmin',
    };
    await expect(
      verificationService.reviewSourceLinkedFact(
        clinicAdmin,
        {
          factCandidateId: fact.id,
          action: 'ACCEPT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
          idempotencyKey: `d5-d-admin-${fact.id}`,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('e) non-owner Doctor B on doctor A consultation → ResourceNotFoundError', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 e');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'e');
    await expect(
      verificationService.reviewSourceLinkedFact(
        doctorB,
        {
          factCandidateId: fact.id,
          action: 'ACCEPT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
          idempotencyKey: `d5-e-xtenant-${fact.id}`,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('f) pulse vital ACCEPT with empty snapshot (NO_MATCHES path)', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 f');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { pulseBpm: 76 },
        idempotencyKey: `d5-f-vitals-${consultation.id}`,
      },
      env,
    );
    const fact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        idempotencyKey: `d5-f-fact-${consultation.id}`,
      },
      factEnv,
    );
    const norm = await normService.materializeFactNormalizations(
      doctorA,
      {
        sourceFactCandidateId: fact.id,
        idempotencyKey: `d5-f-norm-${fact.id}`,
      },
      env,
    );
    expect(norm.reason).toBe('NO_MATCHES');
    expect(norm.normalizations).toHaveLength(0);

    const event = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d5-f-accept-${fact.id}`,
      },
      env,
    );
    expect(event.normalizationCount).toBe(0);
    expect(event.authorityScope).toBe('SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY');
    expect(event.clinicallyUsed).toBe(false);
  });

  it('g) chief edit via intake supersedes ACTIVE verification', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 g');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'g');
    const event = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d5-g-accept-${fact.id}`,
      },
      env,
    );
    expect(event.decisionStatus).toBe('ACTIVE');

    await intake.patch(
      doctorA,
      consultation.id,
      {
        chiefComplaintText: 'D5 g chief superseded text',
        idempotencyKey: `d5-g-edit-${consultation.id}`,
      },
      env,
    );

    const after = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.findById(doctorA, tx, event.id),
      env,
    );
    expect(after?.decisionStatus).toBe('SUPERSEDED');
  });

  it('h/i) unknown input key and invalid action/reason pair rejected', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 hi');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'hi');

    await expect(
      verificationService.reviewSourceLinkedFact(
        doctorA,
        {
          factCandidateId: fact.id,
          action: 'ACCEPT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
          idempotencyKey: `d5-h-unknown-${fact.id}`,
          extraField: 'nope',
        } as never,
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'UNKNOWN_INPUT_KEY' });

    await expect(
      verificationService.reviewSourceLinkedFact(
        doctorA,
        {
          factCandidateId: fact.id,
          action: 'ACCEPT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_INACCURATE',
          idempotencyKey: `d5-i-pair-${fact.id}`,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'INVALID_ACTION_REASON' });
    expect(ValidationError).toBeTypeOf('function');
  });

  it('j) second ACCEPT requires supersedesVerificationId', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 j');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'j');
    const first = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d5-j-first-${fact.id}`,
      },
      env,
    );

    await expect(
      verificationService.reviewSourceLinkedFact(
        doctorA,
        {
          factCandidateId: fact.id,
          action: 'ACCEPT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
          idempotencyKey: `d5-j-nossid-${fact.id}`,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(FactConflictError);

    const second = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        supersedesVerificationId: first.id,
        idempotencyKey: `d5-j-second-${fact.id}`,
      },
      env,
    );
    expect(second.id).not.toBe(first.id);
    expect(second.supersedesVerificationId).toBe(first.id);
    expect(second.decisionStatus).toBe('ACTIVE');

    const prior = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.findById(doctorA, tx, first.id),
      env,
    );
    expect(prior?.decisionStatus).toBe('SUPERSEDED');
  });

  it('k) cross-tenant concealment: doctor B cannot findById A verification', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D5 k');
    const fact = await materializeChiefFact(doctorA, consultation.id, 'k');
    const event = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d5-k-accept-${fact.id}`,
      },
      env,
    );

    const hidden = await withTenantTransaction(
      doctorB,
      async (tx) => verificationsRepo.findById(doctorB, tx, event.id),
      env,
    );
    expect(hidden).toBeNull();
  });
});
