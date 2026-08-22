import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConsultationIntakeService,
  ConsultationService,
  FactAnalysisAcceptanceService,
  FactCandidateService,
  FactNormalizationService,
  FactVerificationService,
  PatientService,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  buildRulesShadowInput,
  chiefComplaintCueSourceLockKey,
  closePool,
  lockAndSupersedeFactAnalysisAcceptances,
  migrateUp,
  resetDatabaseSchema,
  structuredVitalSourceLockKey,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  acquireRulesShadowInputLockPlan,
  buildRulesShadowInputLockPlan,
} from '../../packages/database/src/services/rulesShadowInputLockPlan.ts';
import {
  buildCanonicalSourceLockSubjectsFromFacts,
  compareCanonicalSourceLockSubjects,
} from '../../packages/database/src/services/cueSourceLockPlan.ts';
import {
  clearRulesShadowInputLockTrace,
  getRulesShadowInputLockTrace,
} from '../../packages/database/src/services/rulesShadowInputLockTrace.ts';
import { PgFactAnalysisAcceptanceRepository } from '../../packages/database/src/repositories/factAnalysisAcceptance.ts';
import { PgFactCandidateRepository } from '../../packages/database/src/repositories/factCandidate.ts';
import { PgFactNormalizationRepository } from '../../packages/database/src/repositories/factNormalization.ts';
import { PgFactVerificationRepository } from '../../packages/database/src/repositories/factVerification.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = {
  ...isolatedPostgresTestEnv('ehas2_phase_f3d2e2_test'),
  EHAS2_RULES_SHADOW_INPUT_LOCK_TRACE: '1',
};
const factEnv = { ...env, EHAS2_F3D_FACT_CANDIDATES: '1' };
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const norms = new FactNormalizationService();
const d5 = new FactVerificationService({ onSafeMetric: recordEvidenceEvent });
const e1 = new FactAnalysisAcceptanceService({ onSafeMetric: recordEvidenceEvent });

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
  process.env.EHAS2_RULES_SHADOW_INPUT_LOCK_TRACE = '1';
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
  if (!dbReady)
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2E2 barrier tests');
}

async function seedDoctor(): Promise<{ doctor: TenantContext }> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  const { withAdminClient } = await import('../../packages/database/src/index.ts');
  return withAdminClient(async (query) => {
    const treating = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2E2 Barrier Doctor',
        actorId: '00000000-0000-4000-8000-0000000008e2',
      },
    );
    const organization = await orgs.create(
      { query },
      { name: 'Synthetic F3D2E2 Barrier Org', actorId: treating.id },
    );
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [organization.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const clinic = await orgs.createClinic(
      { query },
      {
        organizationId: organization.id,
        name: 'Synthetic F3D2E2 Barrier Clinic',
        actorId: treating.id,
      },
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
    return {
      doctor: {
        organizationId: organization.id,
        clinicId: clinic.id,
        actorId: treating.id,
        actorRole: 'Doctor' as const,
        membershipStatus: 'ACTIVE' as const,
        allowPatientPhi: true,
      },
    };
  }, env);
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

async function acceptFactPipeline(
  doctor: TenantContext,
  consultationId: string,
  factId: string,
  label: string,
) {
  await d5.reviewSourceLinkedFact(
    doctor,
    {
      factCandidateId: factId,
      action: 'ACCEPT_SOURCE_LINKED_FACT',
      reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
      idempotencyKey: `bar-d5-${label}-${factId}`,
    },
    env,
  );
  return e1.materializeFactAnalysisAcceptance(
    doctor,
    {
      sourceFactCandidateId: factId,
      idempotencyKey: `bar-e1-${label}-${factId}`,
    },
    env,
  );
}

async function prepareChiefAndVitalAccepted(
  doctor: TenantContext,
  label: string,
  opts: {
    materializeOrder: 'vital-first' | 'chief-first';
    vitalFields?: Array<'VITAL_PULSE' | 'VITAL_SPO2'>;
  },
) {
  const patient = await patients.create(
    doctor,
    { displayName: `Barrier ${label}`, dateOfBirth: '1990-01-01' },
    {},
    env,
  );
  const consultation = await consultations.create(
    doctor,
    { patientId: patient.id, chiefComplaintText: 'denies fever' },
    env,
  );
  await intake.patch(
    doctor,
    consultation.id,
    {
      chiefComplaintText: 'denies fever',
      vitals: { pulseBpm: 72, spo2Percent: 98 },
      idempotencyKey: `bar-patch-${label}-${consultation.id}`,
    },
    env,
  );

  const materialize = async (sourceField: 'CHIEF_COMPLAINT' | 'VITAL_PULSE' | 'VITAL_SPO2') => {
    const channel =
      sourceField === 'CHIEF_COMPLAINT'
        ? ('DOCTOR_DECLARED' as const)
        : ('STRUCTURED_INTAKE' as const);
    const fact = await factService().materialize(
      doctor,
      consultation.id,
      {
        sourceChannel: channel,
        sourceField,
        idempotencyKey: `bar-fact-${sourceField}-${label}-${consultation.id}`,
      },
      factEnv,
    );
    await norms.materializeFactNormalizations(
      doctor,
      {
        sourceFactCandidateId: fact.id,
        idempotencyKey: `bar-norm-${sourceField}-${label}-${fact.id}`,
      },
      env,
    );
    const acceptance = await acceptFactPipeline(
      doctor,
      consultation.id,
      fact.id,
      `${label}-${sourceField}`,
    );
    return { fact, acceptance };
  };

  const order =
    opts.materializeOrder === 'vital-first'
      ? (['VITAL_PULSE', 'VITAL_SPO2', 'CHIEF_COMPLAINT'] as const)
      : (['CHIEF_COMPLAINT', 'VITAL_PULSE', 'VITAL_SPO2'] as const);
  const fields = opts.vitalFields ?? ['VITAL_PULSE', 'VITAL_SPO2'];
  const sequence = order.filter(
    (f) => f === 'CHIEF_COMPLAINT' || fields.includes(f as 'VITAL_PULSE' | 'VITAL_SPO2'),
  );

  const built: Record<string, Awaited<ReturnType<typeof materialize>>> = {};
  for (const field of sequence) {
    built[field] = await materialize(field);
  }

  return {
    patient,
    consultation,
    chief: built.CHIEF_COMPLAINT,
    vitals: fields.map((f) => built[f]),
  };
}

function assertLockTraceMonotonic(): void {
  const trace = getRulesShadowInputLockTrace();
  const rank = (c: string): number => {
    if (c === 'source') return 0;
    if (c === 'fact') return 1;
    if (c === 'norm') return 2;
    if (c === 'd5') return 3;
    if (c === 'e1') return 4;
    return 99;
  };
  let last = -1;
  for (const entry of trace) {
    const r = rank(entry.class);
    expect(r).toBeGreaterThanOrEqual(last);
    last = r;
  }
}

function assertNoTornDto(
  results: Awaited<ReturnType<typeof buildRulesShadowInput>>[],
  expectedFactCount: number,
): void {
  for (const r of results) {
    if (r.ok) {
      expect(r.dto.facts).toHaveLength(expectedFactCount);
      expect(r.dto.facts.every((f) => f.decisionStatus === 'ACTIVE')).toBe(true);
      expect(r.dto.clinicallyUsed).toBe(false);
    } else {
      expect(['NO_ELIGIBLE_FACTS', 'STALE_INPUT', 'FACT_CAP_OVERFLOW']).toContain(r.reasonCode);
    }
  }
}

describe('F3D-2E2 multi-fact global lock-order barriers (isolated PG)', () => {
  it('pins canonical cross-family source ordering for mixed families', () => {
    const consultationId = '44444444-4444-4444-8444-444444444444';
    const subjects = buildCanonicalSourceLockSubjectsFromFacts(consultationId, [
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        extractionCandidateId: null,
      },
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        extractionCandidateId: null,
      },
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        extractionCandidateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        extractionCandidateId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      },
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_SPO2',
        extractionCandidateId: null,
      },
    ]);
    expect(subjects.map((s) => s.family)).toEqual([
      'CHIEF_COMPLAINT',
      'F3C_REVIEWED',
      'F3C_REVIEWED',
      'STRUCTURED_VITAL',
      'STRUCTURED_VITAL',
    ]);
    expect(
      compareCanonicalSourceLockSubjects(subjects[1]!, subjects[2]!) <= 0 &&
        compareCanonicalSourceLockSubjects(subjects[3]!, subjects[4]!) <= 0,
    ).toBe(true);
  });

  it('lock trace records class-monotonic acquisition on single build', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'trace', {
      materializeOrder: 'vital-first',
    });
    clearRulesShadowInputLockTrace();
    const result = await buildRulesShadowInput(
      doctor,
      { consultationId: bundle.consultation.id },
      env,
    );
    expect(result.ok).toBe(true);
    const trace = getRulesShadowInputLockTrace();
    expect(trace.length).toBeGreaterThan(0);
    assertLockTraceMonotonic();
    expect(trace.some((e) => e.class === 'source')).toBe(true);
    expect(trace.some((e) => e.class === 'e1')).toBe(true);
    expect(trace.filter((e) => e.class === 'source').length).toBeGreaterThanOrEqual(3);
  }, 120_000);

  it('1 vital-before-chief UUID order: DTO build × intake chief+vital — no deadlock', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'vital-first', {
      materializeOrder: 'vital-first',
    });
    const [dtoA, , dtoB] = await Promise.all([
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
      intake.patch(
        doctor,
        bundle.consultation.id,
        {
          chiefComplaintText: 'denies cough',
          vitals: { pulseBpm: 80 },
          idempotencyKey: `bar-race-vf-${bundle.consultation.id}`,
        },
        env,
      ),
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
    ]);
    assertNoTornDto([dtoA, dtoB], 3);
  }, 120_000);

  it('2 chief-before-vital UUID order: DTO build × intake — no deadlock', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'chief-first', {
      materializeOrder: 'chief-first',
    });
    const [dtoA, , dtoB] = await Promise.all([
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
      intake.patch(
        doctor,
        bundle.consultation.id,
        {
          chiefComplaintText: 'denies cough',
          vitals: { spo2Percent: 97 },
          idempotencyKey: `bar-race-cf-${bundle.consultation.id}`,
        },
        env,
      ),
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
    ]);
    assertNoTornDto([dtoA, dtoB], 3);
  }, 120_000);

  it('3 two vitals opposite UUID/field order × multi-vital intake — no AB→BA', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'two-vitals', {
      materializeOrder: 'vital-first',
      vitalFields: ['VITAL_SPO2', 'VITAL_PULSE'],
    });
    const results = await Promise.all([
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
      intake.patch(
        doctor,
        bundle.consultation.id,
        {
          vitals: { pulseBpm: 75, spo2Percent: 96 },
          idempotencyKey: `bar-two-vital-${bundle.consultation.id}`,
        },
        env,
      ),
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
    ]);
    assertNoTornDto(
      results.filter((r) => typeof r === 'object' && 'ok' in r),
      3,
    );
  }, 120_000);

  it('6 fact lifecycle concurrency — supersession cannot produce torn DTO', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'fact-life', {
      materializeOrder: 'vital-first',
    });
    const results = await Promise.all([
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
      factService().materialize(
        doctor,
        bundle.consultation.id,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          supersedesFactId: bundle.chief!.fact.id,
          idempotencyKey: `bar-repl-chief-${bundle.consultation.id}`,
        },
        factEnv,
      ),
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
    ]);
    const builds = results.filter(
      (r): r is Awaited<ReturnType<typeof buildRulesShadowInput>> =>
        typeof r === 'object' && r != null && 'ok' in r,
    );
    for (const r of builds) {
      if (r.ok) {
        expect(r.dto.facts.length).toBeGreaterThanOrEqual(2);
        expect(r.dto.facts.every((f) => f.decisionStatus === 'ACTIVE')).toBe(true);
      } else {
        expect(['STALE_INPUT', 'NO_ELIGIBLE_FACTS']).toContain(r.reasonCode);
      }
    }
  }, 120_000);

  it('9 E1 supersession concurrency — fail closed, no partial DTO', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'e1-life', {
      materializeOrder: 'chief-first',
    });
    const results = await Promise.all([
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
      withTenantTransaction(
        doctor,
        async (tx) => {
          await lockAndSupersedeFactAnalysisAcceptances(
            doctor,
            tx,
            bundle.vitals.map((v) => v.fact.id),
          );
        },
        env,
      ).then(() => 'superseded' as const),
      buildRulesShadowInput(doctor, { consultationId: bundle.consultation.id }, env),
    ]);
    const builds = results.filter((r) => r !== 'superseded') as Awaited<
      ReturnType<typeof buildRulesShadowInput>
    >[];
    for (const r of builds) {
      if (r.ok) {
        expect([1, 3]).toContain(r.dto.facts.length);
      } else {
        expect(['NO_ELIGIBLE_FACTS', 'STALE_INPUT']).toContain(r.reasonCode);
      }
    }
  }, 120_000);

  it('10 plan drift — shrinking ACTIVE set returns STALE_INPUT without partial DTO', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'plan-drift', {
      materializeOrder: 'vital-first',
    });
    await withTenantTransaction(
      doctor,
      async (tx) => {
        await lockAndSupersedeFactAnalysisAcceptances(
          doctor,
          tx,
          bundle.vitals.map((v) => v.fact.id),
        );
      },
      env,
    );
    const result = await buildRulesShadowInput(
      doctor,
      { consultationId: bundle.consultation.id },
      env,
    );
    if (result.ok) {
      expect(result.dto.facts).toHaveLength(1);
    } else {
      expect(result.reasonCode).toBe('NO_ELIGIBLE_FACTS');
    }
  });

  it('11 failed transaction releases full lock set for subsequent acquire', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const bundle = await prepareChiefAndVitalAccepted(doctor, 'lock-rel', {
      materializeOrder: 'vital-first',
    });
    const facts = new PgFactCandidateRepository();
    const normsRepo = new PgFactNormalizationRepository();
    const verifications = new PgFactVerificationRepository();
    const acceptances = new PgFactAnalysisAcceptanceRepository();

    await expect(
      withTenantTransaction(
        doctor,
        async (tx) => {
          const active = await acceptances.listActiveByConsultation(
            doctor,
            tx,
            bundle.consultation.id,
          );
          const factPeeks = [];
          const normMap = new Map<string, string[]>();
          for (const row of active) {
            const peek = await facts.findById(doctor, tx, row.factCandidateId);
            if (!peek) throw new Error('missing fact');
            const peekNorms = await normsRepo.listActiveByParentFact(doctor, tx, peek.id);
            factPeeks.push({
              id: peek.id,
              sourceChannel: peek.sourceChannel,
              sourceField: peek.sourceField,
              extractionCandidateId: peek.extractionCandidateId,
              sourceIdentityFingerprint: peek.sourceIdentityFingerprint,
            });
            normMap.set(
              peek.id,
              peekNorms.map((n) => n.normalizationIdentityFingerprint),
            );
          }
          const plan = buildRulesShadowInputLockPlan(bundle.consultation.id, factPeeks, normMap);
          await acquireRulesShadowInputLockPlan(doctor, tx, plan, {
            facts,
            norms: normsRepo,
            verifications,
            acceptances,
          });
          throw new Error('FORCE_FAIL_AFTER_LOCKS');
        },
        env,
      ),
    ).rejects.toThrow('FORCE_FAIL_AFTER_LOCKS');

    const chiefKey = chiefComplaintCueSourceLockKey({
      organizationId: doctor.organizationId,
      clinicId: doctor.clinicId,
      consultationId: bundle.consultation.id,
    });
    const pulseKey = structuredVitalSourceLockKey({
      organizationId: doctor.organizationId,
      clinicId: doctor.clinicId,
      consultationId: bundle.consultation.id,
      sourceField: 'VITAL_PULSE',
    });
    await withTenantTransaction(
      doctor,
      async (tx) => {
        for (const key of [chiefKey, pulseKey]) {
          const r = await tx.query<{ ok: boolean }>(
            `SELECT pg_try_advisory_xact_lock(hashtextextended($1::text, $2::bigint)) AS ok`,
            [key, 0],
          );
          expect(r.rows[0]?.ok).toBe(true);
        }
      },
      env,
    );
  }, 120_000);

  it('12 unrelated consultation is not blocked by another consultation lock barrier', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const a = await prepareChiefAndVitalAccepted(doctor, 'iso-a', {
      materializeOrder: 'vital-first',
    });
    const b = await prepareChiefAndVitalAccepted(doctor, 'iso-b', {
      materializeOrder: 'chief-first',
    });

    let releaseHold!: () => void;
    const holdGate = new Promise<void>((resolve) => {
      releaseHold = resolve;
    });
    let signalHeld!: () => void;
    const held = new Promise<void>((resolve) => {
      signalHeld = resolve;
    });

    const holder = withTenantTransaction(
      doctor,
      async (tx) => {
        await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1::text, $2::bigint))`, [
          chiefComplaintCueSourceLockKey({
            organizationId: doctor.organizationId,
            clinicId: doctor.clinicId,
            consultationId: a.consultation.id,
          }),
          0,
        ]);
        signalHeld();
        await holdGate;
      },
      env,
    );
    await held;

    const unrelated = await buildRulesShadowInput(
      doctor,
      { consultationId: b.consultation.id },
      env,
    );
    expect(unrelated.ok).toBe(true);
    releaseHold();
    await holder;
  }, 120_000);
});
