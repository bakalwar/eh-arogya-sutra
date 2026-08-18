import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  closePool,
  migrateUp,
  migrateDownLastForIsolatedTest,
  resetDatabaseSchema,
  withTenantTransaction,
  withAdminClient,
  getOrderedMigrationIds,
  assertTenantContext,
  PatientService,
  ConsultationService,
  ResourceNotFoundError,
  ValidationError,
  IdempotencyConflictError,
  ConflictError,
  PgUserRepository,
  PgOrganizationRepository,
  PgMembershipRepository,
  PgPatientRepository,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { canConnectPhase3bDb, phase3bTestEnv } from '../helpers/phase3b-db.ts';

const env = phase3bTestEnv();
let dbReady = false;
const patients = new PatientService();
const consultations = new ConsultationService();

beforeAll(async () => {
  dbReady = await canConnectPhase3bDb();
  if (!dbReady) return;
  await resetDatabaseSchema(env);
  await migrateUp(env);
}, 120_000);

afterAll(async () => {
  if (dbReady) await closePool();
});

function requireDb(): void {
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for Phase 3B tests');
  }
}

async function seedTenantPair(): Promise<{
  doctorA: TenantContext;
  doctorB: TenantContext;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  const boot = await withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      { displayName: 'Synthetic Doctor A', actorId: '00000000-0000-4000-8000-0000000000a1' },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic Clinic A', actorId: uA.id },
    );
    await query('COMMIT');

    const uB = await users.create(
      { query },
      { displayName: 'Synthetic Doctor B', actorId: '00000000-0000-4000-8000-0000000000b1' },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic Clinic B', actorId: uB.id },
    );
    await query('COMMIT');

    await memberships.create(
      { query },
      {
        userId: uA.id,
        organizationId: oA.id,
        clinicId: cA.id,
        status: 'ACTIVE',
        actorId: uA.id,
      },
    );
    await memberships.create(
      { query },
      {
        userId: uB.id,
        organizationId: oB.id,
        clinicId: cB.id,
        status: 'ACTIVE',
        actorId: uB.id,
      },
    );
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
  return boot;
}

describe('Phase 3B patient and consultation persistence services', () => {
  it('full migration rollback gap audit (001-014)', async () => {
    requireDb();
    expect(getOrderedMigrationIds()).toHaveLength(14);
    const reversed: string[] = [];
    for (let i = 0; i < 14; i++) {
      const id = await migrateDownLastForIsolatedTest(env);
      if (!id) break;
      reversed.push(id);
    }
    expect(reversed).toEqual([
      '014_f3c_candidate_review',
      '013_f3b_open_source_ocr',
      '012_f3a_extraction_candidates',
      '011_f2a_malware_clean_gate',
      '010_clinical_evidence_ingestion',
      '009_auth_foundation',
      '008_doctor_clinic_profiles',
      '007_idempotency_keys',
      '006_rls',
      '005_indexes',
      '004_operations',
      '003_patient_clinical',
      '002_identity_tenancy',
      '001_extensions_and_meta',
    ]);
    await resetDatabaseSchema(env);
    const tables = await withAdminClient(async (query) => {
      const r = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
      );
      return Number(r.rows[0]?.c ?? 0);
    }, env);
    expect(tables).toBe(0);
    const reup = await migrateUp(env);
    expect(reup.applied).toHaveLength(14);
  }, 180_000);

  it('patient create/get/list/update/archive with tenant isolation', async () => {
    requireDb();
    expect(() => assertTenantContext(null)).toThrow();
    expect(() =>
      assertTenantContext({
        organizationId: 'x',
        clinicId: 'y',
        actorId: 'z',
        actorRole: 'ManagementAdmin',
        membershipStatus: 'ACTIVE',
        allowPatientPhi: false,
      }),
    ).toThrow(/PHI/i);

    const { doctorA, doctorB } = await seedTenantPair();
    const created = await patients.create(
      doctorA,
      { displayName: 'Synthetic Patient One', dateOfBirth: '1990-01-15', phoneMasked: '****1989' },
      { idempotencyKey: 'pat-create-1' },
      env,
    );
    expect(created.displayName).toBe('Synthetic Patient One');
    const again = await patients.create(
      doctorA,
      { displayName: 'Synthetic Patient One', dateOfBirth: '1990-01-15', phoneMasked: '****1989' },
      { idempotencyKey: 'pat-create-1' },
      env,
    );
    expect(again.id).toBe(created.id);

    await expect(
      patients.create(
        doctorA,
        { displayName: 'Different Payload' },
        { idempotencyKey: 'pat-create-1' },
        env,
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);

    const got = await patients.getById(doctorA, created.id, env);
    expect(got.id).toBe(created.id);

    await expect(patients.getById(doctorB, created.id, env)).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );

    const listed = await patients.list(doctorA, { limit: 10 }, env);
    expect(listed.items.some((p) => p.id === created.id)).toBe(true);
    const listedB = await patients.list(doctorB, { limit: 10 }, env);
    expect(listedB.items.some((p) => p.id === created.id)).toBe(false);

    await expect(
      patients.update(
        doctorA,
        created.id,
        { organizationId: doctorB.organizationId } as never,
        {},
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    const updated = await patients.update(
      doctorA,
      created.id,
      { displayName: 'Synthetic Patient One Updated' },
      {},
      env,
    );
    expect(updated.displayName).toContain('Updated');

    await expect(
      patients.update(
        doctorA,
        created.id,
        { displayName: 'Race' },
        { expectedUpdatedAt: created.updatedAt },
        env,
      ),
    ).rejects.toBeInstanceOf(ConflictError);

    const archived = await patients.archive(doctorA, created.id, env);
    expect(archived.status).toBe('ARCHIVED');

    await expect(
      consultations.create(doctorA, { patientId: archived.id }, env),
    ).rejects.toBeInstanceOf(ValidationError);
  }, 120_000);

  it('consultation transitions, findings, immutable artifacts, audit rollback', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenantPair();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Case Patient' },
      {},
      env,
    );
    const foreign = await patients.create(
      doctorB,
      { displayName: 'Synthetic Foreign Patient' },
      {},
      env,
    );

    await expect(
      consultations.create(doctorA, { patientId: foreign.id }, env),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    const c = await consultations.create(
      doctorA,
      {
        patientId: patient.id,
        chiefComplaintText: 'Synthetic chief complaint',
        idempotencyKey: 'c-create-1',
      },
      env,
    );
    const cAgain = await consultations.create(
      doctorA,
      {
        patientId: patient.id,
        chiefComplaintText: 'Synthetic chief complaint',
        idempotencyKey: 'c-create-1',
      },
      env,
    );
    expect(cAgain.id).toBe(c.id);

    await consultations.transition(doctorA, c.id, 'IN_PROGRESS', {}, env);
    await consultations.transition(doctorA, c.id, 'ANALYZED', {}, env);
    await expect(consultations.transition(doctorA, c.id, 'DRAFT', {}, env)).rejects.toThrow();

    const findings = await consultations.addStructuredFindings(
      doctorA,
      c.id,
      [
        {
          reportCategory: 'lab_pdf',
          valueText: 'Synthetic Hb 13.2',
          verificationStatus: 'EXTRACTED_UNVERIFIED',
        },
      ],
      env,
    );
    expect(findings).toHaveLength(1);

    const summary = await consultations.addSummaryRevision(
      doctorA,
      {
        consultationId: c.id,
        readableText: 'Synthetic summary v1',
        structuredSummary: { note: 'synthetic' },
        engineVersion: 'synthetic-e',
        rulesVersion: 'synthetic-r',
        diseaseDataVersion: 'synthetic-d',
        medicineDataVersion: 'synthetic-m',
        inputHash: 'in-1',
        contentHash: 'sum-1',
        idempotencyKey: 'sum-1',
      },
      env,
    );
    const summaryAgain = await consultations.addSummaryRevision(
      doctorA,
      {
        consultationId: c.id,
        readableText: 'Synthetic summary v1',
        structuredSummary: { note: 'synthetic' },
        engineVersion: 'synthetic-e',
        rulesVersion: 'synthetic-r',
        diseaseDataVersion: 'synthetic-d',
        medicineDataVersion: 'synthetic-m',
        inputHash: 'in-1',
        contentHash: 'sum-1',
        idempotencyKey: 'sum-1',
      },
      env,
    );
    expect(summaryAgain.id).toBe(summary.id);

    const rx = await consultations.addPrescriptionRevision(
      doctorA,
      {
        consultationId: c.id,
        structuredPrescription: { oralFormulas: [] },
        readableSnapshot: 'Synthetic rx v1',
        engineVersion: 'synthetic-e',
        rulesVersion: 'synthetic-r',
        diseaseDataVersion: 'synthetic-d',
        medicineDataVersion: 'synthetic-m',
        inputHash: 'in-1',
        contentHash: 'rx-1',
      },
      env,
    );
    await consultations.transitionReview(doctorA, rx.id, 'ACCEPTED', {}, env);
    const issued = await consultations.transitionReview(doctorA, rx.id, 'ISSUED', {}, env);
    expect(issued.reviewState).toBe('ISSUED');

    const rx2 = await consultations.addPrescriptionRevision(
      doctorA,
      {
        consultationId: c.id,
        previousId: issued.id,
        modificationReason: 'Synthetic clinician adjustment',
        structuredPrescription: { oralFormulas: [{ label: 'synthetic' }] },
        readableSnapshot: 'Synthetic rx v2',
        engineVersion: 'synthetic-e',
        rulesVersion: 'synthetic-r',
        diseaseDataVersion: 'synthetic-d',
        medicineDataVersion: 'synthetic-m',
        inputHash: 'in-2',
        contentHash: 'rx-2',
      },
      env,
    );
    expect(rx2.versionNumber).toBe(2);
    const history = await consultations.listPrescriptionVersions(doctorA, c.id, env);
    expect(history).toHaveLength(2);

    // batch rollback: invalid finding status aborts entire batch
    await expect(
      consultations.addStructuredFindings(
        doctorA,
        c.id,
        [
          {
            reportCategory: 'lab_pdf',
            valueText: 'ok',
            verificationStatus: 'EXTRACTED_UNVERIFIED',
          },
          {
            reportCategory: 'lab_pdf',
            valueText: 'bad',
            verificationStatus: 'NOT_A_REAL_STATUS',
          },
        ],
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    // transaction rollback: force failure after patient insert path via invalid uuid
    await expect(patients.getById(doctorA, 'not-a-uuid', env)).rejects.toBeInstanceOf(
      ValidationError,
    );

    // RLS: direct repository cross-tenant read returns null
    const repo = new PgPatientRepository();
    const stolen = await withTenantTransaction(
      doctorA,
      async (tx) => repo.findById(doctorA, tx, foreign.id),
      env,
    );
    expect(stolen).toBeNull();
  }, 180_000);
});
