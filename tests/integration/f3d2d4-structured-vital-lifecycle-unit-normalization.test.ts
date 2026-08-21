import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConsultationIntakeService,
  ConsultationService,
  FactCandidateService,
  FactNormalizationService,
  FactConflictError,
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
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
  STRUCTURED_VITAL_FIELD_SPECS,
  structuredVitalSourceLockKey,
  LEGACY_TEMPERATURE_UNIT_TEXT,
  CANONICAL_TEMPERATURE_UNIT_TEXT,
  hashPayload,
} from '../../packages/database/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2d4_test');
const factEnv = {
  ...env,
  EHAS2_F3D_FACT_CANDIDATES: '1',
};
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const factsRepo = new PgFactCandidateRepository();
const normsRepo = new PgFactNormalizationRepository();
const normService = new FactNormalizationService();

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
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2D4 tests');
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
        displayName: 'Synthetic F3D2D4 Doctor A',
        actorId: '00000000-0000-4000-8000-0000000004d1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic F3D2D4 Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic F3D2D4 Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic F3D2D4 Doctor B',
        actorId: '00000000-0000-4000-8000-0000000004d2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic F3D2D4 Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic F3D2D4 Clinic B', actorId: uB.id },
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

const PACK_MATCH_FIELDS = new Set([
  'VITAL_BP_SYSTOLIC',
  'VITAL_BP_DIASTOLIC',
  'VITAL_TEMPERATURE',
  'VITAL_WEIGHT',
  'VITAL_HEIGHT',
]);

describe('F3D-2D4 structured vital lifecycle + STRUCTURED_UNIT (isolated PG)', () => {
  it('materializes F3D-1 + D3 STRUCTURED_UNIT for each supported vital field', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 field matrix');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          pulseBpm: 72,
          temperatureC: 37,
          spo2Percent: 98,
          weightKg: 70,
          heightCm: 170,
        },
        idempotencyKey: `d4-vitals-all-${consultation.id}`,
      },
      env,
    );

    for (const spec of STRUCTURED_VITAL_FIELD_SPECS) {
      const fact = await factService().materialize(
        doctorA,
        consultation.id,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: spec.sourceField,
          idempotencyKey: `d4-fact-${spec.sourceField}-${consultation.id}`,
        },
        factEnv,
      );
      expect(fact.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
      expect(fact.clinicallyUsed).toBe(false);
      expect(fact.unitText).toBe(spec.unitText);
      expect(fact.decisionStatus).toBe('ACTIVE');

      const norm = await normService.materializeFactNormalizations(
        doctorA,
        {
          sourceFactCandidateId: fact.id,
          idempotencyKey: `d4-norm-${spec.sourceField}-${consultation.id}`,
        },
        env,
      );
      expect(norm.sourceFactCandidateId).toBe(fact.id);
      if (PACK_MATCH_FIELDS.has(spec.sourceField)) {
        expect(norm.reason).toBe('NORMALIZED');
        expect(norm.normalizations).toHaveLength(1);
        expect(norm.normalizations[0]?.authorityScope).toBe('FACT_NORMALIZED_SOURCE_LINKED');
        expect(norm.normalizations[0]?.clinicallyUsed).toBe(false);
        expect(norm.normalizations[0]?.canonicalLabel).toBe(spec.unitText);
        expect(norm.normalizations[0]?.normalizationKind).toBe('UNIT_ALIAS');
      } else {
        expect(norm.reason).toBe('NO_MATCHES');
        expect(norm.normalizations).toHaveLength(0);
      }
    }
  });

  it('eligibility: missing/null/stale/wrong field/cross-tenant fail closed', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 eligibility');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { bloodPressureSystolic: 118, bloodPressureDiastolic: 76, weightKg: 65 },
        idempotencyKey: `d4-elig-vitals-${consultation.id}`,
      },
      env,
    );
    const weightFact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        idempotencyKey: `d4-elig-weight-fact-${consultation.id}`,
      },
      factEnv,
    );
    await expect(
      normService.materializeFactNormalizations(
        doctorB,
        {
          sourceFactCandidateId: weightFact.id,
          idempotencyKey: `d4-elig-xtenant-${weightFact.id}`,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {
          bloodPressureSystolic: 118,
          bloodPressureDiastolic: 76,
          weightKg: null,
        },
        idempotencyKey: `d4-elig-null-weight-${consultation.id}`,
      },
      env,
    );
    await expect(
      normService.materializeFactNormalizations(
        doctorA,
        {
          sourceFactCandidateId: weightFact.id,
          idempotencyKey: `d4-elig-stale-${weightFact.id}`,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'FACT_INELIGIBLE' });

    await expect(
      factService().materialize(
        doctorA,
        consultation.id,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_PULSE',
          idempotencyKey: `d4-elig-missing-pulse-${consultation.id}`,
        },
        factEnv,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('lifecycle: vital edit/removal supersedes only affected vital fact+norms', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 lifecycle');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {
          bloodPressureSystolic: 130,
          bloodPressureDiastolic: 85,
          weightKg: 68,
        },
        chiefComplaintText: 'fever with bodyache',
        idempotencyKey: `d4-life-seed-${consultation.id}`,
      },
      env,
    );
    const sysFact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_BP_SYSTOLIC',
        idempotencyKey: `d4-life-sys-${consultation.id}`,
      },
      factEnv,
    );
    const weightFact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        idempotencyKey: `d4-life-wt-${consultation.id}`,
      },
      factEnv,
    );
    const chiefFact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: `d4-life-chief-${consultation.id}`,
      },
      factEnv,
    );
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: sysFact.id, idempotencyKey: `d4-life-sys-norm-${sysFact.id}` },
      env,
    );
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: weightFact.id, idempotencyKey: `d4-life-wt-norm-${weightFact.id}` },
      env,
    );

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {
          bloodPressureSystolic: 140,
          bloodPressureDiastolic: 85,
          weightKg: 68,
        },
        idempotencyKey: `d4-life-edit-sys-${consultation.id}`,
      },
      env,
    );

    const sysRows = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const all = await tx.query(
          `SELECT id, decision_status, source_field FROM clinical_fact_candidates
           WHERE organization_id=$1 AND clinic_id=$2 AND consultation_id=$3
           ORDER BY source_field, created_at`,
          [doctorA.organizationId, doctorA.clinicId, consultation.id],
        );
        return all.rows as { id: string; decision_status: string; source_field: string }[];
      },
      env,
    );
    expect(
      sysRows.some(
        (r) =>
          r.id === sysFact.id &&
          r.source_field === 'VITAL_BP_SYSTOLIC' &&
          r.decision_status === 'SUPERSEDED',
      ),
    ).toBe(true);
    expect(
      sysRows
        .filter((r) => r.source_field === 'VITAL_WEIGHT')
        .every((r) => r.decision_status === 'ACTIVE'),
    ).toBe(true);
    expect(
      sysRows
        .filter((r) => r.source_field === 'CHIEF_COMPLAINT')
        .every((r) => r.decision_status === 'ACTIVE'),
    ).toBe(true);
    expect(sysRows.some((r) => r.id === chiefFact.id && r.decision_status === 'ACTIVE')).toBe(true);

    const sysNormStatuses = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT decision_status FROM clinical_fact_normalizations
           WHERE organization_id=$1 AND clinic_id=$2 AND source_fact_candidate_id=$3`,
          [doctorA.organizationId, doctorA.clinicId, sysFact.id],
        );
        return (r.rows as { decision_status: string }[]).map((x) => x.decision_status);
      },
      env,
    );
    expect(sysNormStatuses.length).toBeGreaterThan(0);
    expect(sysNormStatuses.every((s) => s === 'SUPERSEDED')).toBe(true);

    const wtNormActive = await withTenantTransaction(
      doctorA,
      async (tx) => normsRepo.listActiveByParentFact(doctorA, tx, weightFact.id),
      env,
    );
    expect(wtNormActive).toHaveLength(1);

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {
          bloodPressureSystolic: 140,
          bloodPressureDiastolic: 85,
          weightKg: 68,
        },
        idempotencyKey: `d4-life-noop-${consultation.id}`,
      },
      env,
    );
    const wtStill = await withTenantTransaction(
      doctorA,
      async (tx) => factsRepo.findById(doctorA, tx, weightFact.id),
      env,
    );
    expect(wtStill?.decisionStatus).toBe('ACTIVE');

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {
          bloodPressureSystolic: 140,
          bloodPressureDiastolic: 85,
          weightKg: null,
        },
        idempotencyKey: `d4-life-remove-wt-${consultation.id}`,
      },
      env,
    );
    const wtGone = await withTenantTransaction(
      doctorA,
      async (tx) => factsRepo.findById(doctorA, tx, weightFact.id),
      env,
    );
    expect(wtGone?.decisionStatus).toBe('SUPERSEDED');
  });

  it('idempotency: same-key replay skips D2; changed vital cannot stale-replay', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 idem');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { temperatureC: 36.8 },
        idempotencyKey: `d4-idem-vitals-${consultation.id}`,
      },
      env,
    );
    const fact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_TEMPERATURE',
        idempotencyKey: `d4-idem-fact-${consultation.id}`,
      },
      factEnv,
    );
    let d2Calls = 0;
    const instrumented = new FactNormalizationService({
      beforeFirstWriteParse: () => {
        d2Calls += 1;
      },
    });
    const key = `d4-idem-norm-${fact.id}`;
    const first = await instrumented.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact.id, idempotencyKey: key },
      env,
    );
    expect(first.reason).toBe('NORMALIZED');
    expect(d2Calls).toBe(1);
    const replay = await instrumented.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact.id, idempotencyKey: key },
      env,
    );
    expect(replay.replayed).toBe(true);
    expect(d2Calls).toBe(1);

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { temperatureC: 38.2 },
        idempotencyKey: `d4-idem-changed-${consultation.id}`,
      },
      env,
    );
    await expect(
      instrumented.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: fact.id, idempotencyKey: key },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'FACT_INELIGIBLE' });
  });

  it('concurrency: vital edit vs D3; unrelated consultation non-blocking; no ACTIVE norm under SUPERSEDED parent', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const a = await openConsult(doctorA, 'D4 conc A');
    const b = await openConsult(doctorA, 'D4 conc B');
    await intake.patch(
      doctorA,
      a.consultation.id,
      {
        vitals: { weightKg: 70 },
        idempotencyKey: `d4-conc-a-${a.consultation.id}`,
      },
      env,
    );
    await intake.patch(
      doctorA,
      b.consultation.id,
      {
        vitals: { weightKg: 71 },
        idempotencyKey: `d4-conc-b-${b.consultation.id}`,
      },
      env,
    );
    const factA = await factService().materialize(
      doctorA,
      a.consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        idempotencyKey: `d4-conc-fact-a-${a.consultation.id}`,
      },
      factEnv,
    );
    const factB = await factService().materialize(
      doctorA,
      b.consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        idempotencyKey: `d4-conc-fact-b-${b.consultation.id}`,
      },
      factEnv,
    );

    const d3Promise = normService.materializeFactNormalizations(
      doctorA,
      {
        sourceFactCandidateId: factA.id,
        idempotencyKey: `d4-conc-norm-a-${factA.id}`,
      },
      env,
    );
    const editPromise = intake.patch(
      doctorA,
      a.consultation.id,
      {
        vitals: { weightKg: 72 },
        idempotencyKey: `d4-conc-edit-a-${a.consultation.id}`,
      },
      env,
    );
    const otherPromise = normService.materializeFactNormalizations(
      doctorA,
      {
        sourceFactCandidateId: factB.id,
        idempotencyKey: `d4-conc-norm-b-${factB.id}`,
      },
      env,
    );

    const results = await Promise.allSettled([d3Promise, editPromise, otherPromise]);
    const bResult = results[2];
    expect(bResult.status).toBe('fulfilled');
    if (bResult.status === 'fulfilled') {
      expect(bResult.value.reason).toBe('NORMALIZED');
    }

    const orphan = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT n.id
           FROM clinical_fact_normalizations n
           JOIN clinical_fact_candidates f ON f.id = n.source_fact_candidate_id
           WHERE n.organization_id = $1 AND n.clinic_id = $2
             AND n.decision_status = 'ACTIVE'
             AND f.decision_status = 'SUPERSEDED'`,
          [doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows;
      },
      env,
    );
    expect(orphan).toHaveLength(0);

    const keySys = structuredVitalSourceLockKey({
      organizationId: doctorA.organizationId,
      clinicId: doctorA.clinicId,
      consultationId: a.consultation.id,
      sourceField: 'VITAL_BP_SYSTOLIC',
    });
    const keyDia = structuredVitalSourceLockKey({
      organizationId: doctorA.organizationId,
      clinicId: doctorA.clinicId,
      consultationId: a.consultation.id,
      sourceField: 'VITAL_BP_DIASTOLIC',
    });
    expect(keyDia < keySys).toBe(true);
  });

  it('failed first-write rolls back without partial rows; NO_MATCHES replay pinned', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 fail');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { pulseBpm: 88 },
        idempotencyKey: `d4-fail-vitals-${consultation.id}`,
      },
      env,
    );
    const fact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        idempotencyKey: `d4-fail-fact-${consultation.id}`,
      },
      factEnv,
    );
    const failing = new FactNormalizationService({
      beforeFirstWriteParse: () => {
        throw new ValidationError('PARSER_FAILED');
      },
    });
    await expect(
      failing.materializeFactNormalizations(
        doctorA,
        {
          sourceFactCandidateId: fact.id,
          idempotencyKey: `d4-fail-norm-${fact.id}`,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'PARSER_FAILED' });
    const partial = await withTenantTransaction(
      doctorA,
      async (tx) => normsRepo.listActiveByParentFact(doctorA, tx, fact.id),
      env,
    );
    expect(partial).toHaveLength(0);

    const ok = new FactNormalizationService();
    const first = await ok.materializeFactNormalizations(
      doctorA,
      {
        sourceFactCandidateId: fact.id,
        idempotencyKey: `d4-nomatch-${fact.id}`,
      },
      env,
    );
    expect(first.reason).toBe('NO_MATCHES');
    const replay = await ok.materializeFactNormalizations(
      doctorA,
      {
        sourceFactCandidateId: fact.id,
        idempotencyKey: `d4-nomatch-${fact.id}`,
      },
      env,
    );
    expect(replay.replayed).toBe(true);
    expect(replay.reason).toBe('NO_MATCHES');
    expect(replay.normalizations).toHaveLength(0);
  });

  it('B1: partial vitals patch preserves omitted columns and only invalidates changed fields', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 B1 partial');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          pulseBpm: 72,
          temperatureC: 37,
          spo2Percent: 98,
          weightKg: 70,
          heightCm: 170,
        },
        idempotencyKey: `d4-b1-seed-${consultation.id}`,
      },
      env,
    );
    const seedFacts = [];
    for (const spec of STRUCTURED_VITAL_FIELD_SPECS) {
      seedFacts.push(
        await factService().materialize(
          doctorA,
          consultation.id,
          {
            sourceChannel: 'STRUCTURED_INTAKE',
            sourceField: spec.sourceField,
            idempotencyKey: `d4-b1-seed-fact-${spec.sourceField}-${consultation.id}`,
          },
          factEnv,
        ),
      );
    }
    const pulseFact = seedFacts.find((f) => f.sourceField === 'VITAL_PULSE')!;
    const weightFact = seedFacts.find((f) => f.sourceField === 'VITAL_WEIGHT')!;
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: weightFact.id, idempotencyKey: `d4-b1-wt-norm-${weightFact.id}` },
      env,
    );

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { pulseBpm: 88 },
        idempotencyKey: `d4-b1-pulse-only-${consultation.id}`,
      },
      env,
    );
    const afterPulse = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT blood_pressure_systolic, blood_pressure_diastolic, pulse_bpm, temperature_c,
                  spo2_percent, weight_kg, height_cm
           FROM vitals WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3`,
          [consultation.id, doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows[0] as Record<string, unknown>;
      },
      env,
    );
    expect(Number(afterPulse.blood_pressure_systolic)).toBe(120);
    expect(Number(afterPulse.blood_pressure_diastolic)).toBe(80);
    expect(Number(afterPulse.pulse_bpm)).toBe(88);
    expect(Number(afterPulse.temperature_c)).toBe(37);
    expect(Number(afterPulse.spo2_percent)).toBe(98);
    expect(Number(afterPulse.weight_kg)).toBe(70);
    expect(Number(afterPulse.height_cm)).toBe(170);

    const factStatuses = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT id, source_field, decision_status FROM clinical_fact_candidates
           WHERE organization_id=$1 AND clinic_id=$2 AND consultation_id=$3`,
          [doctorA.organizationId, doctorA.clinicId, consultation.id],
        );
        return r.rows as { id: string; source_field: string; decision_status: string }[];
      },
      env,
    );
    expect(
      factStatuses.some((r) => r.id === pulseFact.id && r.decision_status === 'SUPERSEDED'),
    ).toBe(true);
    expect(
      factStatuses
        .filter((r) => r.source_field === 'VITAL_WEIGHT')
        .every((r) => r.decision_status === 'ACTIVE'),
    ).toBe(true);

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { bloodPressureSystolic: 125 },
        idempotencyKey: `d4-b1-sys-only-${consultation.id}`,
      },
      env,
    );
    const afterSys = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT blood_pressure_systolic, blood_pressure_diastolic, pulse_bpm FROM vitals
           WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3`,
          [consultation.id, doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows[0] as Record<string, unknown>;
      },
      env,
    );
    expect(Number(afterSys.blood_pressure_systolic)).toBe(125);
    expect(Number(afterSys.blood_pressure_diastolic)).toBe(80);
    expect(Number(afterSys.pulse_bpm)).toBe(88);

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { pulseBpm: null },
        idempotencyKey: `d4-b1-null-pulse-${consultation.id}`,
      },
      env,
    );
    const afterNullPulse = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT pulse_bpm, weight_kg FROM vitals
           WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3`,
          [consultation.id, doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows[0] as Record<string, unknown>;
      },
      env,
    );
    expect(afterNullPulse.pulse_bpm).toBeNull();
    expect(Number(afterNullPulse.weight_kg)).toBe(70);

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: {},
        idempotencyKey: `d4-b1-empty-${consultation.id}`,
      },
      env,
    );
    const afterEmpty = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT weight_kg, temperature_c FROM vitals
           WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3`,
          [consultation.id, doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows[0] as Record<string, unknown>;
      },
      env,
    );
    expect(Number(afterEmpty.weight_kg)).toBe(70);
    expect(Number(afterEmpty.temperature_c)).toBe(37);

    await expect(
      intake.patch(
        doctorA,
        consultation.id,
        { vitals: { pulseBpm: 0 }, idempotencyKey: `d4-b1-zero-${consultation.id}` },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { weightKg: 70 },
        idempotencyKey: `d4-b1-unchanged-wt-${consultation.id}`,
      },
      env,
    );
    const wtStill = await withTenantTransaction(
      doctorA,
      async (tx) => factsRepo.findById(doctorA, tx, weightFact.id),
      env,
    );
    expect(wtStill?.decisionStatus).toBe('ACTIVE');

    await intake.patch(
      doctorA,
      consultation.id,
      {
        chiefComplaintText: 'updated chief with vitals',
        vitals: { temperatureC: 37.5 },
        idempotencyKey: `d4-b1-chief-partial-${consultation.id}`,
      },
      env,
    );
    const afterChiefPartial = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT weight_kg, temperature_c FROM vitals
           WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3`,
          [consultation.id, doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows[0] as Record<string, unknown>;
      },
      env,
    );
    expect(Number(afterChiefPartial.weight_kg)).toBe(70);
    expect(Number(afterChiefPartial.temperature_c)).toBe(37.5);
  });

  it('B1: concurrent disjoint vital patches keep both committed values', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 B1 conc');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { pulseBpm: 70, weightKg: 60 },
        idempotencyKey: `d4-b1-conc-seed-${consultation.id}`,
      },
      env,
    );
    const results = await Promise.allSettled([
      intake.patch(
        doctorA,
        consultation.id,
        { vitals: { pulseBpm: 75 }, idempotencyKey: `d4-b1-conc-pulse-${consultation.id}` },
        env,
      ),
      intake.patch(
        doctorA,
        consultation.id,
        { vitals: { weightKg: 65 }, idempotencyKey: `d4-b1-conc-wt-${consultation.id}` },
        env,
      ),
    ]);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    const row = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT pulse_bpm, weight_kg FROM vitals
           WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3`,
          [consultation.id, doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows[0] as Record<string, unknown>;
      },
      env,
    );
    expect(Number(row.pulse_bpm)).toBe(75);
    expect(Number(row.weight_kg)).toBe(65);
  });

  async function insertLegacyTemperatureFact(
    doctor: TenantContext,
    consultationId: string,
    patientId: string,
    valueText: string,
  ) {
    return withTenantTransaction(
      doctor,
      async (tx) => {
        const identity = hashPayload({
          v: 1,
          organizationId: doctor.organizationId,
          clinicId: doctor.clinicId,
          consultationId,
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_TEMPERATURE',
          factCategory: 'VITAL',
          intakeSymptomId: null,
          extractionCandidateId: null,
        });
        const content = hashPayload({
          originalSourceSpan: valueText,
          assertedText: null,
          assertedValue: valueText,
          unitText: LEGACY_TEMPERATURE_UNIT_TEXT,
          unitPosture: 'EXACT_AS_SOURCE',
          negated: false,
          durationText: null,
          onsetText: null,
        });
        return factsRepo.insert(doctor, tx, {
          patientId,
          consultationId,
          sourceChannel: 'STRUCTURED_INTAKE',
          factCategory: 'VITAL',
          sourceField: 'VITAL_TEMPERATURE',
          intakeSymptomId: null,
          evidenceItemId: null,
          extractionRunId: null,
          extractionCandidateId: null,
          reviewEventId: null,
          originalSourceSpan: valueText,
          assertedText: null,
          assertedValue: valueText,
          unitText: LEGACY_TEMPERATURE_UNIT_TEXT,
          unitPosture: 'EXACT_AS_SOURCE',
          negated: false,
          durationText: null,
          onsetText: null,
          sourceLocator: null,
          sourceIdentityFingerprint: identity,
          contentFingerprint: content,
          limitationCodes: [
            'NOT_AUTHORITATIVE',
            'NO_CLINICAL_VERIFICATION',
            'NO_NORMALIZATION',
            'SOURCE_DECLARED_ONLY',
          ],
          confidence: null,
          supersedesFactId: null,
        });
      },
      env,
    );
  }

  it('B2: legacy temperature unit C recovers to sole ACTIVE °C fact', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const { patient, consultation } = await openConsult(doctorA, 'D4 B2 legacy');
    await intake.patch(
      doctorA,
      consultation.id,
      {
        vitals: { temperatureC: 36.6, weightKg: 55 },
        idempotencyKey: `d4-b2-seed-${consultation.id}`,
      },
      env,
    );

    const weightFact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        idempotencyKey: `d4-b2-wt-${consultation.id}`,
      },
      factEnv,
    );
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: weightFact.id, idempotencyKey: `d4-b2-wt-norm-${weightFact.id}` },
      env,
    );

    const legacy = await insertLegacyTemperatureFact(doctorA, consultation.id, patient.id, '36.6');
    expect(legacy.unitText).toBe('C');
    expect(CANONICAL_TEMPERATURE_UNIT_TEXT).toBe('\u00B0C');

    await expect(
      normService.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: legacy.id, idempotencyKey: `d4-b2-d3-legacy-${legacy.id}` },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_MUTATED' });

    const recovered = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_TEMPERATURE',
        idempotencyKey: `d4-b2-recover-${consultation.id}`,
      },
      factEnv,
    );
    expect(recovered.unitText).toBe(CANONICAL_TEMPERATURE_UNIT_TEXT);
    expect(recovered.originalSourceSpan).toBe('36.6');
    expect(recovered.decisionStatus).toBe('ACTIVE');
    expect(recovered.id).not.toBe(legacy.id);
    expect(recovered.supersedesFactId).toBe(legacy.id);

    const history = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT id, unit_text, decision_status FROM clinical_fact_candidates
           WHERE organization_id=$1 AND clinic_id=$2 AND consultation_id=$3
             AND source_field='VITAL_TEMPERATURE'
           ORDER BY created_at ASC`,
          [doctorA.organizationId, doctorA.clinicId, consultation.id],
        );
        return r.rows as { id: string; unit_text: string; decision_status: string }[];
      },
      env,
    );
    expect(history).toHaveLength(2);
    expect(history.filter((h) => h.decision_status === 'ACTIVE')).toHaveLength(1);
    expect(history.find((h) => h.id === legacy.id)?.decision_status).toBe('SUPERSEDED');
    expect(history.find((h) => h.id === recovered.id)?.unit_text).toBe(
      CANONICAL_TEMPERATURE_UNIT_TEXT,
    );

    const wtOk = await withTenantTransaction(
      doctorA,
      async (tx) => factsRepo.findById(doctorA, tx, weightFact.id),
      env,
    );
    expect(wtOk?.decisionStatus).toBe('ACTIVE');

    const again = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_TEMPERATURE',
        idempotencyKey: `d4-b2-recover-again-${consultation.id}`,
      },
      factEnv,
    );
    expect(again.id).toBe(recovered.id);

    await expect(
      factService().materialize(
        doctorB,
        consultation.id,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_TEMPERATURE',
          idempotencyKey: `d4-b2-xtenant-${consultation.id}`,
        },
        factEnv,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('B2: concurrent recovery races yield one ACTIVE °C winner; bad units do not auto-recover', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { patient, consultation } = await openConsult(doctorA, 'D4 B2 race');
    await intake.patch(
      doctorA,
      consultation.id,
      { vitals: { temperatureC: 37.1 }, idempotencyKey: `d4-b2r-seed-${consultation.id}` },
      env,
    );
    const legacy = await insertLegacyTemperatureFact(doctorA, consultation.id, patient.id, '37.1');

    const raced = await Promise.allSettled([
      factService().materialize(
        doctorA,
        consultation.id,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_TEMPERATURE',
          idempotencyKey: `d4-b2r-a-${consultation.id}`,
        },
        factEnv,
      ),
      factService().materialize(
        doctorA,
        consultation.id,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_TEMPERATURE',
          idempotencyKey: `d4-b2r-b-${consultation.id}`,
        },
        factEnv,
      ),
    ]);
    expect(raced.filter((r) => r.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
    const activeTemps = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT id, unit_text FROM clinical_fact_candidates
           WHERE organization_id=$1 AND clinic_id=$2 AND consultation_id=$3
             AND source_field='VITAL_TEMPERATURE' AND decision_status='ACTIVE'`,
          [doctorA.organizationId, doctorA.clinicId, consultation.id],
        );
        return r.rows as { id: string; unit_text: string }[];
      },
      env,
    );
    expect(activeTemps).toHaveLength(1);
    expect(activeTemps[0]?.unit_text).toBe(CANONICAL_TEMPERATURE_UNIT_TEXT);
    expect(legacy.decisionStatus).toBe('ACTIVE'); // pre-race snapshot object

    // Insert a bad-unit ACTIVE cannot happen via recovery; force conflict via second identity
    // by seeding F unit as the only ACTIVE after superseding °C winner through value change.
    await intake.patch(
      doctorA,
      consultation.id,
      { vitals: { temperatureC: 38 }, idempotencyKey: `d4-b2r-chg-${consultation.id}` },
      env,
    );
    const bad = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const identity = hashPayload({
          v: 1,
          organizationId: doctorA.organizationId,
          clinicId: doctorA.clinicId,
          consultationId: consultation.id,
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_TEMPERATURE',
          factCategory: 'VITAL',
          intakeSymptomId: null,
          extractionCandidateId: null,
        });
        // After source edit, old ACTIVE was superseded; insert bad-unit ACTIVE for same identity.
        return factsRepo.insert(doctorA, tx, {
          patientId: patient.id,
          consultationId: consultation.id,
          sourceChannel: 'STRUCTURED_INTAKE',
          factCategory: 'VITAL',
          sourceField: 'VITAL_TEMPERATURE',
          intakeSymptomId: null,
          evidenceItemId: null,
          extractionRunId: null,
          extractionCandidateId: null,
          reviewEventId: null,
          originalSourceSpan: '38',
          assertedText: null,
          assertedValue: '38',
          unitText: 'F',
          unitPosture: 'EXACT_AS_SOURCE',
          negated: false,
          durationText: null,
          onsetText: null,
          sourceLocator: null,
          sourceIdentityFingerprint: identity,
          contentFingerprint: hashPayload({
            originalSourceSpan: '38',
            assertedText: null,
            assertedValue: '38',
            unitText: 'F',
            unitPosture: 'EXACT_AS_SOURCE',
            negated: false,
            durationText: null,
            onsetText: null,
          }),
          limitationCodes: [
            'NOT_AUTHORITATIVE',
            'NO_CLINICAL_VERIFICATION',
            'NO_NORMALIZATION',
            'SOURCE_DECLARED_ONLY',
          ],
          confidence: null,
          supersedesFactId: null,
        });
      },
      env,
    );
    expect(bad.unitText).toBe('F');
    await expect(
      factService().materialize(
        doctorA,
        consultation.id,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_TEMPERATURE',
          idempotencyKey: `d4-b2r-badunit-${consultation.id}`,
        },
        factEnv,
      ),
    ).rejects.toBeInstanceOf(FactConflictError);
  });

  it('hardening: D3 vs same vital edit and fact materialize vs edit serialize without orphans', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation } = await openConsult(doctorA, 'D4 hard');
    await intake.patch(
      doctorA,
      consultation.id,
      { vitals: { weightKg: 80 }, idempotencyKey: `d4-h-seed-${consultation.id}` },
      env,
    );
    const fact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        idempotencyKey: `d4-h-fact-${consultation.id}`,
      },
      factEnv,
    );

    await Promise.allSettled([
      normService.materializeFactNormalizations(
        doctorA,
        { sourceFactCandidateId: fact.id, idempotencyKey: `d4-h-d3-${fact.id}` },
        env,
      ),
      intake.patch(
        doctorA,
        consultation.id,
        { vitals: { weightKg: 81 }, idempotencyKey: `d4-h-edit-${consultation.id}` },
        env,
      ),
    ]);

    const orphans = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT n.id FROM clinical_fact_normalizations n
           JOIN clinical_fact_candidates f ON f.id = n.source_fact_candidate_id
           WHERE n.organization_id=$1 AND n.clinic_id=$2
             AND n.decision_status='ACTIVE' AND f.decision_status='SUPERSEDED'`,
          [doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows;
      },
      env,
    );
    expect(orphans).toHaveLength(0);

    await Promise.allSettled([
      factService().materialize(
        doctorA,
        consultation.id,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_WEIGHT',
          idempotencyKey: `d4-h-remat-${consultation.id}`,
        },
        factEnv,
      ),
      intake.patch(
        doctorA,
        consultation.id,
        { vitals: { weightKg: 82 }, idempotencyKey: `d4-h-edit2-${consultation.id}` },
        env,
      ),
    ]);
    const row = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT weight_kg FROM vitals
           WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3`,
          [consultation.id, doctorA.organizationId, doctorA.clinicId],
        );
        return r.rows[0] as { weight_kg: string };
      },
      env,
    );
    expect(Number(row.weight_kg)).toBe(82);
    expect(structuredVitalSourceLockKey).toBeTypeOf('function');
    expect(IdempotencyConflictError).toBeTypeOf('function');
  });
});
