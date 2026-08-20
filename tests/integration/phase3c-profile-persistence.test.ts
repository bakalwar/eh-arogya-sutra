import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  closePool,
  migrateUp,
  migrateDownLastForIsolatedTest,
  resetDatabaseSchema,
  withTenantTransaction,
  withAdminClient,
  getOrderedMigrationIds,
  assertProfileAccessContext,
  assertTenantContext,
  DoctorProfileService,
  ClinicProfileService,
  MembershipQueryService,
  AccessDeniedError,
  ValidationError,
  ResourceNotFoundError,
  PgUserRepository,
  PgOrganizationRepository,
  PgMembershipRepository,
  PgPatientRepository,
  PgConsultationRepository,
  PgPrescriptionRepository,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { canConnectPhase3cDb, phase3cTestEnv } from '../helpers/phase3c-db.ts';

const env = phase3cTestEnv();
let dbReady = false;
const doctorProfiles = new DoctorProfileService();
const clinicProfiles = new ClinicProfileService();
const membershipQuery = new MembershipQueryService();

beforeAll(async () => {
  dbReady = await canConnectPhase3cDb();
  if (!dbReady) return;
  await resetDatabaseSchema(env);
  await migrateUp(env);
}, 120_000);

afterAll(async () => {
  if (dbReady) await closePool();
});

function requireDb(): void {
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for Phase 3C tests');
  }
}

async function seedTenants(): Promise<{
  doctorA: TenantContext;
  clinicAdminA: TenantContext;
  doctorB: TenantContext;
  managementA: TenantContext;
  superA: TenantContext;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
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
    const mDoctor = await memberships.create(
      { query },
      {
        userId: uA.id,
        organizationId: oA.id,
        clinicId: cA.id,
        status: 'ACTIVE',
        actorId: uA.id,
      },
    );
    await memberships.assignRole({ query }, { membershipId: mDoctor.id, roleCode: 'Doctor' });

    const uAdmin = await users.create(
      { query },
      { displayName: 'Synthetic Clinic Admin A', actorId: '00000000-0000-4000-8000-0000000000a2' },
    );
    const mAdmin = await memberships.create(
      { query },
      {
        userId: uAdmin.id,
        organizationId: oA.id,
        clinicId: cA.id,
        status: 'ACTIVE',
        actorId: uAdmin.id,
      },
    );
    await memberships.assignRole({ query }, { membershipId: mAdmin.id, roleCode: 'ClinicAdmin' });

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
    const mB = await memberships.create(
      { query },
      {
        userId: uB.id,
        organizationId: oB.id,
        clinicId: cB.id,
        status: 'ACTIVE',
        actorId: uB.id,
      },
    );
    await memberships.assignRole({ query }, { membershipId: mB.id, roleCode: 'Doctor' });

    const doctorA: TenantContext = {
      organizationId: oA.id,
      clinicId: cA.id,
      actorId: uA.id,
      actorRole: 'Doctor',
      membershipStatus: 'ACTIVE',
      allowPatientPhi: true,
    };
    return {
      doctorA,
      clinicAdminA: {
        ...doctorA,
        actorId: uAdmin.id,
        actorRole: 'ClinicAdmin',
      },
      doctorB: {
        organizationId: oB.id,
        clinicId: cB.id,
        actorId: uB.id,
        actorRole: 'Doctor',
        membershipStatus: 'ACTIVE',
        allowPatientPhi: true,
      },
      managementA: {
        organizationId: oA.id,
        clinicId: cA.id,
        actorId: uA.id,
        actorRole: 'ManagementAdmin',
        membershipStatus: 'ACTIVE',
        allowPatientPhi: false,
      },
      superA: {
        organizationId: oA.id,
        clinicId: cA.id,
        actorId: uA.id,
        actorRole: 'SuperAdmin',
        membershipStatus: 'ACTIVE',
        allowPatientPhi: false,
      },
    };
  }, env);
}

describe('Phase 3C doctor and clinic profile persistence', () => {
  it('migration 009 down/up on isolated DB', async () => {
    requireDb();
    expect(getOrderedMigrationIds()).toHaveLength(16);
    const downId = await migrateDownLastForIsolatedTest(env);
    expect(downId).toBe('016_f3d2_fact_normalizations');
    const reup = await migrateUp(env);
    expect(reup.applied).toEqual(['016_f3d2_fact_normalizations']);
  }, 120_000);

  it('doctor profile CRUD, ordering, validation, tenant isolation, roles', async () => {
    requireDb();
    const { doctorA, clinicAdminA, doctorB, managementA, superA } = await seedTenants();

    expect(() => assertProfileAccessContext(null)).toThrow();
    expect(() => assertProfileAccessContext(managementA)).toThrow(AccessDeniedError);
    expect(() => assertProfileAccessContext(superA)).toThrow(AccessDeniedError);
    expect(() => assertTenantContext(managementA)).toThrow();

    await expect(doctorProfiles.getOwn(doctorA, env)).rejects.toBeInstanceOf(ResourceNotFoundError);

    const profile = await doctorProfiles.upsertOwn(
      doctorA,
      {
        legalName: 'Synthetic Legal A',
        displayName: 'Synthetic Doctor A',
        prescriptionName: 'Dr Synthetic A',
        primaryPhone: '+91 90000 00001',
        professionalEmail: 'synthetic.a@example.test',
        specialization: 'General',
        yearsOfExperience: 5,
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata',
        profileStatus: 'ACTIVE',
      },
      env,
    );
    expect(profile.prescriptionName).toBe('Dr Synthetic A');

    await expect(
      doctorProfiles.upsertOwn(
        doctorA,
        { ...profile, organizationId: doctorB.organizationId },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    const q1 = await doctorProfiles.addQualification(
      doctorA,
      { degreeTitle: 'BHMS', displayOrder: 1 },
      env,
    );
    const q2 = await doctorProfiles.addQualification(
      doctorA,
      { degreeTitle: 'MD(Hom)', displayOrder: 0 },
      env,
    );
    expect(q1.degreeTitle).toBe('BHMS');
    expect(q2.displayOrder).toBe(0);

    await expect(
      doctorProfiles.addRegistration(
        doctorA,
        {
          registrationNumber: 'SYN-REG-1',
          registrationAuthority: 'Synthetic Council',
          issuedOn: '2020-01-01',
          expiresOn: '2019-01-01',
          displayOrder: 0,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    await doctorProfiles.addRegistration(
      doctorA,
      {
        registrationNumber: 'SYN-REG-1',
        registrationAuthority: 'Synthetic Council',
        issuedOn: '2020-01-01',
        expiresOn: '2030-01-01',
        displayOrder: 2,
      },
      env,
    );
    await doctorProfiles.addRegistration(
      doctorA,
      {
        registrationNumber: 'SYN-REG-2',
        registrationAuthority: 'Synthetic Council',
        displayOrder: 1,
      },
      env,
    );

    const own = await doctorProfiles.getOwn(doctorA, env);
    expect(own.qualifications.map((q) => q.degreeTitle)).toEqual(['MD(Hom)', 'BHMS']);
    expect(own.registrations.map((r) => r.registrationNumber)).toEqual(['SYN-REG-2', 'SYN-REG-1']);
    expect(own.registrations.every((r) => r.verificationClaimed === false)).toBe(true);

    await expect(doctorProfiles.getOwn(doctorB, env)).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      clinicProfiles.updateCurrent(doctorA, { city: 'Pune' }, env),
    ).rejects.toBeInstanceOf(AccessDeniedError);

    const clinic = await clinicProfiles.updateCurrent(
      clinicAdminA,
      {
        displayName: 'Synthetic Clinic A Updated',
        city: 'Pune',
        state: 'MH',
        postalCode: '411001',
        country: 'IN',
        phone: '+91 90000 00010',
        addressLine1: '1 Synthetic Street',
      },
      env,
    );
    expect(clinic.city).toBe('Pune');

    await expect(
      clinicProfiles.updateCurrent(clinicAdminA, { organizationId: doctorB.organizationId }, env),
    ).rejects.toBeInstanceOf(ValidationError);

    const hours = await clinicProfiles.replaceHours(
      clinicAdminA,
      [
        { dayOfWeek: 1, isClosed: false, openTime: '09:00', closeTime: '13:00', displayOrder: 0 },
        { dayOfWeek: 1, isClosed: false, openTime: '16:00', closeTime: '20:00', displayOrder: 1 },
        { dayOfWeek: 0, isClosed: true, displayOrder: 0 },
      ],
      env,
    );
    expect(hours).toHaveLength(3);

    await expect(
      clinicProfiles.replaceHours(
        clinicAdminA,
        [{ dayOfWeek: 2, isClosed: false, openTime: '18:00', closeTime: '09:00' }],
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      clinicProfiles.upsertDisplaySettings(clinicAdminA, { potency: '30C' }, env),
    ).rejects.toBeInstanceOf(ValidationError);

    const display = await clinicProfiles.upsertDisplaySettings(
      clinicAdminA,
      { headerText: 'Synthetic Header', showRegistration: true },
      env,
    );
    expect(display.headerText).toBe('Synthetic Header');

    await withTenantTransaction(
      doctorB,
      async (tx) => {
        const r = await tx.query(`SELECT id FROM clinics WHERE id = $1`, [doctorA.clinicId]);
        expect(r.rowCount).toBe(0);
      },
      env,
    );

    await expect(
      membershipQuery.denyCrossTenantCreate(doctorA, doctorB.organizationId, doctorB.clinicId),
    ).rejects.toBeInstanceOf(AccessDeniedError);

    const mine = await membershipQuery.listAuthorizedForActor(doctorA, env);
    expect(mine.every((m) => m.organizationId === doctorA.organizationId)).toBe(true);

    // RLS: doctor B actor cannot read doctor A profile rows even with forged tenant GUCs toward A.
    await withTenantTransaction(
      { ...doctorB, organizationId: doctorA.organizationId, clinicId: doctorA.clinicId },
      async (tx) => {
        const r = await tx.query(`SELECT * FROM doctor_professional_profiles WHERE user_id = $1`, [
          doctorA.actorId,
        ]);
        expect(r.rowCount).toBe(0);
      },
      env,
    );

    // Atomicity: profile update + forced failure rolls back audit/profile change.
    const before = await doctorProfiles.getOwn(doctorA, env);
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await tx.query(
            `UPDATE doctor_professional_profiles SET specialization = $1 WHERE user_id = $2`,
            ['ShouldRollback', doctorA.actorId],
          );
          throw new Error('injected failure');
        },
        env,
      ),
    ).rejects.toThrow(/injected failure/);
    const after = await doctorProfiles.getOwn(doctorA, env);
    expect(after.profile.specialization).toBe(before.profile.specialization);

    // Prescription identity snapshot remains after profile rename.
    const snapshot = await doctorProfiles.captureIdentitySnapshot(doctorA, env);
    expect(snapshot.doctor.prescriptionName).toBe('Dr Synthetic A');
    const patients = new PgPatientRepository();
    const consultations = new PgConsultationRepository();
    const prescriptions = new PgPrescriptionRepository();
    const rx = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const patient = await patients.create(doctorA, tx, {
          displayName: 'Synthetic Patient Snapshot',
        });
        const consult = await consultations.create(doctorA, tx, {
          patientId: patient.id,
          doctorUserId: doctorA.actorId,
        });
        return prescriptions.createGenerated(doctorA, tx, {
          consultationId: consult.id,
          structuredPrescription: { synthetic: true },
          readableSnapshot: 'Synthetic readable',
          engineVersion: 'test-engine',
          rulesVersion: 'test-rules',
          diseaseDataVersion: 'test-disease',
          medicineDataVersion: 'test-med',
          inputHash: 'a'.repeat(64),
          contentHash: 'b'.repeat(64),
          prescriberIdentitySnapshot: snapshot,
        });
      },
      env,
    );
    expect(rx.prescriberIdentitySnapshot?.doctor.prescriptionName).toBe('Dr Synthetic A');

    await doctorProfiles.upsertOwn(
      doctorA,
      {
        legalName: 'Synthetic Legal A',
        displayName: 'Synthetic Doctor A',
        prescriptionName: 'Dr Synthetic A Renamed',
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata',
        profileStatus: 'ACTIVE',
      },
      env,
    );
    const reloaded = await withTenantTransaction(
      doctorA,
      async (tx) => prescriptions.findById(doctorA, tx, rx.id),
      env,
    );
    expect(reloaded?.prescriberIdentitySnapshot?.doctor.prescriptionName).toBe('Dr Synthetic A');
  }, 180_000);
});
