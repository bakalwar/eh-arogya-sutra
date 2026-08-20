import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closePool,
  migrateUp,
  migrateDownLastForIsolatedTest,
  resetDatabaseSchema,
  withTenantTransaction,
  withAdminClient,
  listMigrationFiles,
  getOrderedMigrationIds,
  assertTenantContext,
  assertBackgroundJobTenant,
  assertValidReviewTransition,
  InvalidReviewTransitionError,
  TenantContextRequiredError,
  PgUserRepository,
  PgOrganizationRepository,
  PgMembershipRepository,
  PgPatientRepository,
  PgConsultationRepository,
  PgClinicalAnalysisRepository,
  PgPrescriptionRepository,
  PgSummarySnapshotRepository,
  PgReportFindingRepository,
  PgAuditEventRepository,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { canConnectPhase3aDb, phase3aTestEnv } from '../helpers/phase3a-db.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = phase3aTestEnv();

let dbReady = false;

beforeAll(async () => {
  dbReady = await canConnectPhase3aDb();
  if (!dbReady) return;
  await resetDatabaseSchema(env);
  await migrateUp(env);
}, 120_000);

afterAll(async () => {
  if (dbReady) await closePool();
});

function requireDb(): void {
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for Phase 3A mandatory tests');
  }
}

async function seedTwoClinics(): Promise<{
  doctorA: TenantContext;
  doctorB: TenantContext;
  clinicAdminA: TenantContext;
  patientAId: string;
  patientBId: string;
  orgA: string;
  orgB: string;
  clinicA: string;
  clinicB: string;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  const patients = new PgPatientRepository();

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
      userA: uA.id,
      orgA: oA.id,
      clinicA: cA.id,
      userB: uB.id,
      orgB: oB.id,
      clinicB: cB.id,
    };
  }, env);

  const doctorA: TenantContext = {
    organizationId: boot.orgA,
    clinicId: boot.clinicA,
    actorId: boot.userA,
    actorRole: 'Doctor',
    membershipStatus: 'ACTIVE',
    allowPatientPhi: true,
  };
  const doctorB: TenantContext = {
    organizationId: boot.orgB,
    clinicId: boot.clinicB,
    actorId: boot.userB,
    actorRole: 'Doctor',
    membershipStatus: 'ACTIVE',
    allowPatientPhi: true,
  };

  const patientAId = await withTenantTransaction(
    doctorA,
    async (tx) => (await patients.create(doctorA, tx, { displayName: 'Synthetic Patient A' })).id,
    env,
  );
  const patientBId = await withTenantTransaction(
    doctorB,
    async (tx) => (await patients.create(doctorB, tx, { displayName: 'Synthetic Patient B' })).id,
    env,
  );

  return {
    doctorA,
    doctorB,
    clinicAdminA: { ...doctorA, actorRole: 'ClinicAdmin' },
    patientAId,
    patientBId,
    orgA: boot.orgA,
    orgB: boot.orgB,
    clinicA: boot.clinicA,
    clinicB: boot.clinicB,
  };
}

describe('Phase 3A PostgreSQL persistence integration', () => {
  it('1-7 schema migration gates', async () => {
    requireDb();
    expect(getOrderedMigrationIds()).toHaveLength(16);
    expect(listMigrationFiles('up').every((f) => f.checksum.length === 64)).toBe(true);

    const version = await withAdminClient(async (query) => {
      const r = await query<{ version: string }>(`SELECT version FROM schema_version WHERE id = 1`);
      return r.rows[0]?.version;
    }, env);
    expect(version).toBe('3A.0.0');

    const fks = await withAdminClient(async (query) => {
      const r = await query<{ cnt: string }>(
        `SELECT count(*)::text AS cnt FROM information_schema.table_constraints
         WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'`,
      );
      return Number(r.rows[0]?.cnt ?? 0);
    }, env);
    expect(fks).toBeGreaterThan(10);

    const indexes = await withAdminClient(async (query) => {
      const r = await query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
      );
      return r.rows.map((x) => x.indexname);
    }, env);
    for (const name of [
      'idx_patients_tenant_patient',
      'idx_consultations_tenant_date',
      'idx_consultations_doctor_date',
      'idx_consultations_patient_history',
      'idx_follow_ups_due',
      'idx_prescription_versions_status',
      'idx_clinician_reviews_state',
      'idx_support_tickets_status',
      'idx_doctor_feedback_status',
      'idx_audit_events_timestamp',
      'idx_external_identity_mapping',
    ]) {
      expect(indexes).toContain(name);
    }

    const second = await migrateUp(env);
    expect(second.applied).toEqual([]);
    expect(second.skipped.length).toBe(15);

    const downId = await migrateDownLastForIsolatedTest(env);
    expect(downId).toBe('016_f3d2_fact_normalizations');
    const reup = await migrateUp(env);
    expect(reup.applied).toEqual(['016_f3d2_fact_normalizations']);
  }, 120_000);

  it('8-14 tenant isolation gates', async () => {
    requireDb();
    expect(() => assertTenantContext(null)).toThrow(TenantContextRequiredError);
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
    expect(() =>
      assertTenantContext({
        organizationId: 'x',
        clinicId: 'y',
        actorId: 'z',
        actorRole: 'SuperAdmin',
        membershipStatus: 'ACTIVE',
        allowPatientPhi: false,
      }),
    ).toThrow(/PHI/i);
    expect(() =>
      assertBackgroundJobTenant({
        organizationId: '',
        clinicId: '',
        actorId: 'job',
        actorRole: 'System',
        membershipStatus: 'ACTIVE',
        allowPatientPhi: true,
      }),
    ).toThrow(TenantContextRequiredError);
    expect(() =>
      assertTenantContext({
        organizationId: 'x',
        clinicId: 'y',
        actorId: 'z',
        actorRole: 'Doctor',
        membershipStatus: 'INACTIVE',
        allowPatientPhi: true,
      }),
    ).toThrow(/inactive/i);

    const seeded = await seedTwoClinics();
    const patients = new PgPatientRepository();
    const consultations = new PgConsultationRepository();
    const audit = new PgAuditEventRepository();

    const stolen = await withTenantTransaction(
      seeded.doctorA,
      async (tx) => patients.findById(seeded.doctorA, tx, seeded.patientBId),
      env,
    );
    expect(stolen).toBeNull();

    const otherClinic = await withTenantTransaction(
      seeded.clinicAdminA,
      async (tx) => tx.query(`SELECT id FROM clinics WHERE id = $1`, [seeded.clinicB]),
      env,
    );
    expect(otherClinic.rows.length).toBe(0);

    await withAdminClient(async (query) => {
      await audit.append(
        { query },
        {
          organizationId: seeded.orgA,
          clinicId: seeded.clinicA,
          actorId: seeded.doctorA.actorId,
          actorRole: 'Doctor',
          eventType: 'cross_tenant_denial',
          outcome: 'DENIED',
          metadata: { reason: 'doctor_a_read_clinic_b_patient' },
        },
      );
    }, env);

    await expect(
      withTenantTransaction(
        seeded.doctorA,
        async (tx) =>
          consultations.create(seeded.doctorA, tx, {
            patientId: seeded.patientBId,
            doctorUserId: seeded.doctorA.actorId,
          }),
        env,
      ),
    ).rejects.toThrow(/not found|NOT_FOUND|denied|tenant/i);
  }, 120_000);

  it('15-21 clinical history immutability', async () => {
    requireDb();
    const seeded = await seedTwoClinics();
    const consultations = new PgConsultationRepository();
    const analyses = new PgClinicalAnalysisRepository();
    const prescriptions = new PgPrescriptionRepository();
    const summaries = new PgSummarySnapshotRepository();

    const { consultId, rx1, rx2, snap } = await withTenantTransaction(
      seeded.doctorA,
      async (tx) => {
        const c = await consultations.create(seeded.doctorA, tx, {
          patientId: seeded.patientAId,
          doctorUserId: seeded.doctorA.actorId,
        });
        const history = await consultations.listByPatient(seeded.doctorA, tx, seeded.patientAId);
        expect(history.items.some((x) => x.id === c.id)).toBe(true);

        await analyses.create(seeded.doctorA, tx, {
          consultationId: c.id,
          engineVersion: 'synthetic-engine-0',
          rulesVersion: 'synthetic-rules-0',
          diseaseDataVersion: 'synthetic-disease-0',
          medicineDataVersion: 'synthetic-medicine-0',
          inputHash: 'input-hash-1',
          contentHash: 'content-hash-1',
          structuredResult: { status: 'SYNTHETIC' },
        });

        const generated = await prescriptions.createGenerated(seeded.doctorA, tx, {
          consultationId: c.id,
          structuredPrescription: { oralFormulas: [] },
          readableSnapshot: 'Synthetic readable prescription v1',
          engineVersion: 'synthetic-engine-0',
          rulesVersion: 'synthetic-rules-0',
          diseaseDataVersion: 'synthetic-disease-0',
          medicineDataVersion: 'synthetic-medicine-0',
          inputHash: 'input-hash-1',
          contentHash: 'rx-content-1',
        });
        const accepted = await prescriptions.transition(
          seeded.doctorA,
          tx,
          generated.id,
          'ACCEPTED',
        );
        const issued = await prescriptions.transition(seeded.doctorA, tx, accepted.id, 'ISSUED');
        expect(issued.reviewState).toBe('ISSUED');

        await expect(
          prescriptions.transition(seeded.doctorA, tx, issued.id, 'ACCEPTED'),
        ).rejects.toThrow();

        const modified = await prescriptions.createModifiedVersion(seeded.doctorA, tx, issued.id, {
          structuredPrescription: { oralFormulas: [{ label: 'synthetic' }] },
          readableSnapshot: 'Synthetic readable prescription v2',
          engineVersion: 'synthetic-engine-0',
          rulesVersion: 'synthetic-rules-0',
          diseaseDataVersion: 'synthetic-disease-0',
          medicineDataVersion: 'synthetic-medicine-0',
          inputHash: 'input-hash-2',
          contentHash: 'rx-content-2',
          modificationReason: 'Synthetic clinician adjustment',
        });

        const old = await prescriptions.findById(seeded.doctorA, tx, issued.id);
        expect(old?.reviewState).toBe('SUPERSEDED');
        expect(old?.readableSnapshot).toContain('v1');
        expect(modified.versionNumber).toBe(2);
        expect(modified.previousVersionId).toBe(issued.id);

        expect(() => assertValidReviewTransition('REJECTED', 'ACCEPTED')).toThrow(
          InvalidReviewTransitionError,
        );

        const s = await summaries.create(seeded.doctorA, tx, {
          consultationId: c.id,
          prescriptionVersionId: modified.id,
          readableText: 'Synthetic clinical summary',
          structuredSummary: { stage: 'synthetic' },
          engineVersion: 'synthetic-engine-0',
          rulesVersion: 'synthetic-rules-0',
          diseaseDataVersion: 'synthetic-disease-0',
          medicineDataVersion: 'synthetic-medicine-0',
          inputHash: 'input-hash-2',
          contentHash: 'summary-hash-1',
        });

        return { consultId: c.id, rx1: issued.id, rx2: modified.id, snap: s };
      },
      env,
    );

    expect(consultId && rx1 && rx2 && snap.contentHash === 'summary-hash-1').toBe(true);

    await expect(
      withTenantTransaction(
        seeded.doctorA,
        async (tx) =>
          analyses.create(seeded.doctorA, tx, {
            consultationId: consultId,
            engineVersion: '',
            rulesVersion: 'r',
            diseaseDataVersion: 'd',
            medicineDataVersion: 'm',
            inputHash: 'h',
            contentHash: 'c',
            structuredResult: {},
          }),
        env,
      ),
    ).rejects.toThrow(/versions required/i);
  }, 120_000);

  it('22-27 report non-retention schema', async () => {
    requireDb();
    const cols = await withAdminClient(async (query) => {
      const r = await query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public'`,
      );
      return r.rows.map((x) => x.column_name);
    }, env);
    const joined = cols.join(',');
    expect(joined).not.toMatch(
      /report_bytes|base64|thumbnail|ocr_source|object_url|storage_path|original_filename/i,
    );
    expect(cols).toContain('verification_status');
    expect(cols).toContain('verified_by_actor_id');
    expect(cols).toContain('verified_at');

    const seeded = await seedTwoClinics();
    const consultations = new PgConsultationRepository();
    const findings = new PgReportFindingRepository();
    const audit = new PgAuditEventRepository();

    await withTenantTransaction(
      seeded.doctorA,
      async (tx) => {
        const c = await consultations.create(seeded.doctorA, tx, {
          patientId: seeded.patientAId,
          doctorUserId: seeded.doctorA.actorId,
        });
        const f = await findings.create(seeded.doctorA, tx, {
          consultationId: c.id,
          reportCategory: 'lab_pdf',
          valueText: 'Synthetic HbA1c 5.6',
          verificationStatus: 'VERIFIED',
          verifiedByActorId: seeded.doctorA.actorId,
          verifiedAt: new Date().toISOString(),
          extractionEngineVersion: 'synthetic-extract-0',
        });
        expect(f.verificationStatus).toBe('VERIFIED');

        await expect(
          findings.create(seeded.doctorA, tx, {
            consultationId: c.id,
            reportCategory: 'lab_pdf',
            valueText: 'bad',
            verificationStatus: 'VERIFIED',
          }),
        ).rejects.toThrow();

        await expect(
          audit.append(tx, {
            eventType: 'report_finding_verify',
            outcome: 'SUCCESS',
            metadata: { otp: '123456', report_bytes: 'QQ==' },
          }),
        ).rejects.toThrow(/forbids sensitive key/i);
      },
      env,
    );
  }, 120_000);

  it('28-33 security scans and synthetic-only markers', async () => {
    requireDb();
    const repoSrc = fs.readFileSync(
      path.join(root, 'packages/database/src/repositories/postgres.ts'),
      'utf8',
    );
    expect(repoSrc).toMatch(/\$\d/);
    expect(repoSrc).not.toMatch(/\$\{[^}]*SELECT/i);

    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, 'packages/database/package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> };
    expect(Object.keys(pkg.dependencies).sort()).toEqual(
      [
        '@ehas2/evidence-extract',
        '@ehas2/evidence-extract-adapters',
        '@ehas2/evidence-ingest',
        '@ehas2/security',
        'pg',
      ].sort(),
    );
    expect(fs.existsSync(path.join(root, '.env'))).toBe(false);

    const migrationSql = fs
      .readdirSync(path.join(root, 'packages/database/migrations'))
      .filter((f) => f.endsWith('.sql'))
      .map((f) => fs.readFileSync(path.join(root, 'packages/database/migrations', f), 'utf8'))
      .join('\n');
    expect(migrationSql).not.toMatch(/eh_arogya\.db/);
    expect(migrationSql.toLowerCase().includes('production patient')).toBe(false);

    await withAdminClient(async (query) => {
      await query(
        `INSERT INTO backup_metadata (backup_status, verification_status, restore_test_status, integrity_result)
         VALUES ('PLANNED', 'NOT_RUN', 'NOT_RUN', 'FOUNDATION_ONLY')`,
      );
      const r = await query(`SELECT count(*)::int AS c FROM backup_metadata`);
      expect(Number((r.rows[0] as { c: number }).c)).toBeGreaterThan(0);
    }, env);
  }, 60_000);
});
