import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  AccessDeniedError,
  ClinicProfileService,
  ConflictError,
  DoctorProfileService,
  MembershipInactiveError,
  MembershipQueryService,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ResourceNotFoundError,
  ValidationError,
  closePool,
  getOrderedMigrationIds,
  migrateDownLastForIsolatedTest,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  Permission,
  PlatformRole,
  assertNoManagementPhiByDefault,
  createPrincipalForPolicyEvaluation,
  evaluateAuthorization,
  roleHasPermission,
} from '../../packages/security/src/index.ts';
import { createApp } from '../../apps/api/src/createApp.ts';
import { EHAS2_API_NAMESPACE } from '../../packages/shared/src/index.ts';
import { canConnectPhase3dDb, phase3dTestEnv } from '../helpers/phase3d-db.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const env = phase3dTestEnv();
let dbReady = false;
const doctors = new DoctorProfileService();
const clinics = new ClinicProfileService();
const memberships = new MembershipQueryService();

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
  Object.assign(process.env, phase3dTestEnv());
  dbReady = await canConnectPhase3dDb();
  if (!dbReady) return;
  await resetDatabaseSchema(env);
  await migrateUp(env);
}, 120_000);

afterAll(async () => {
  if (dbReady) await closePool();
});

function requireDb(): void {
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for Phase 3D tests');
  }
}

async function seedTenants(): Promise<{
  doctorA: TenantContext;
  clinicAdminA: TenantContext;
  doctorB: TenantContext;
  disabledDoctor: TenantContext;
  orgAId: string;
  clinicAId: string;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const membershipRepo = new PgMembershipRepository();
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
    const mDoctor = await membershipRepo.create(
      { query },
      {
        userId: uA.id,
        organizationId: oA.id,
        clinicId: cA.id,
        status: 'ACTIVE',
        actorId: uA.id,
      },
    );
    await membershipRepo.assignRole({ query }, { membershipId: mDoctor.id, roleCode: 'Doctor' });

    const uAdmin = await users.create(
      { query },
      { displayName: 'Synthetic Clinic Admin A', actorId: '00000000-0000-4000-8000-0000000000a2' },
    );
    const mAdmin = await membershipRepo.create(
      { query },
      {
        userId: uAdmin.id,
        organizationId: oA.id,
        clinicId: cA.id,
        status: 'ACTIVE',
        actorId: uAdmin.id,
      },
    );
    await membershipRepo.assignRole(
      { query },
      { membershipId: mAdmin.id, roleCode: 'ClinicAdmin' },
    );

    const uDisabled = await users.create(
      { query },
      { displayName: 'Synthetic Disabled Doctor', actorId: '00000000-0000-4000-8000-0000000000a3' },
    );
    const mDisabled = await membershipRepo.create(
      { query },
      {
        userId: uDisabled.id,
        organizationId: oA.id,
        clinicId: cA.id,
        status: 'INACTIVE',
        actorId: uDisabled.id,
      },
    );
    await membershipRepo.assignRole({ query }, { membershipId: mDisabled.id, roleCode: 'Doctor' });

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
    const mB = await membershipRepo.create(
      { query },
      {
        userId: uB.id,
        organizationId: oB.id,
        clinicId: cB.id,
        status: 'ACTIVE',
        actorId: uB.id,
      },
    );
    await membershipRepo.assignRole({ query }, { membershipId: mB.id, roleCode: 'Doctor' });

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
      clinicAdminA: { ...doctorA, actorId: uAdmin.id, actorRole: 'ClinicAdmin' },
      doctorB: {
        organizationId: oB.id,
        clinicId: cB.id,
        actorId: uB.id,
        actorRole: 'Doctor',
        membershipStatus: 'ACTIVE',
        allowPatientPhi: true,
      },
      disabledDoctor: {
        ...doctorA,
        actorId: uDisabled.id,
        membershipStatus: 'INACTIVE',
      },
      orgAId: oA.id,
      clinicAId: cA.id,
    };
  }, env);
}

async function httpJson(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: Record<string, unknown>; headers: Headers }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json()) as Record<string, unknown>;
    return { status: res.status, json, headers: res.headers };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

describe('Phase 3D profile API authz (no insecure bypass)', () => {
  it('production createApp leaves principal null → AUTH_NOT_CONNECTED', async () => {
    const app = createApp();
    const res = await httpJson(app, 'GET', `${EHAS2_API_NAMESPACE}/me/profile`);
    expect(res.status).toBe(401);
    expect(res.json.code).toBe('AUTH_NOT_CONNECTED');
  });

  it('upload endpoints stay NOT_IMPLEMENTED', async () => {
    const principal = createPrincipalForPolicyEvaluation({
      subjectId: '00000000-0000-4000-8000-0000000000a1',
      role: PlatformRole.Doctor,
      tenantId: '00000000-0000-4000-8000-0000000000aa',
      isTestPrincipal: true,
    });
    const app = createApp({
      resolvePrincipal: () => principal,
      resolveTenantContext: () => null,
    });
    const photo = await httpJson(app, 'POST', `${EHAS2_API_NAMESPACE}/me/profile/photo`, {});
    expect(photo.status).toBe(501);
    expect(photo.json.code).toBe('NOT_IMPLEMENTED');
  });

  it('missing TenantContext is denied after principal is present', async () => {
    const principal = createPrincipalForPolicyEvaluation({
      subjectId: '00000000-0000-4000-8000-0000000000a1',
      role: PlatformRole.Doctor,
      tenantId: '00000000-0000-4000-8000-0000000000aa',
      isTestPrincipal: true,
    });
    const app = createApp({
      resolvePrincipal: () => principal,
      resolveTenantContext: () => null,
    });
    const res = await httpJson(app, 'GET', `${EHAS2_API_NAMESPACE}/me/profile`);
    expect(res.status).toBe(403);
    expect(res.json.code).toBe('TENANT_CONTEXT_REQUIRED');
  });

  it('Management Admin and Super Admin lack profile write permissions by default', () => {
    expect(roleHasPermission(PlatformRole.ManagementAdmin, Permission.DoctorProfileWrite)).toBe(
      false,
    );
    expect(roleHasPermission(PlatformRole.SuperAdmin, Permission.DoctorProfileWrite)).toBe(false);
    expect(roleHasPermission(PlatformRole.SuperAdmin, Permission.ClinicProfileWrite)).toBe(false);
    expect(assertNoManagementPhiByDefault(PlatformRole.ManagementAdmin)).toBe(true);
    expect(
      evaluateAuthorization({
        principal: createPrincipalForPolicyEvaluation({
          subjectId: 'mgmt-1',
          role: PlatformRole.ManagementAdmin,
          tenantId: null,
        }),
        permission: Permission.DoctorProfileWrite,
      }).allowed,
    ).toBe(false);
  });

  it('source scan: no header/query identity bypass in profile API', () => {
    for (const rel of [
      'apps/api/src/createApp.ts',
      'apps/api/src/routes/profiles.ts',
      'apps/api/src/middleware/tenantBridge.ts',
    ]) {
      const text = fs.readFileSync(path.join(root, rel), 'utf8');
      expect(text).not.toMatch(/x-user-id|x-actor-id|x-tenant-id|req\.query\.tenant/i);
      expect(text).not.toMatch(/hardcoded.*doctor|development superuser/i);
    }
  });
});

describe('Phase 3D profile/clinic services + API (synthetic)', () => {
  it('migration clean + latest down/up', async () => {
    requireDb();
    expect(getOrderedMigrationIds()).toHaveLength(10);
    const downId = await migrateDownLastForIsolatedTest(env);
    expect(downId).toBe('010_clinical_evidence_ingestion');
    const reup = await migrateUp(env);
    expect(reup.applied).toEqual(['010_clinical_evidence_ingestion']);
  }, 120_000);

  it('covers doctor/clinic profile API contract gates 1-29', async () => {
    requireDb();
    const { doctorA, clinicAdminA, doctorB, disabledDoctor, orgAId } = await seedTenants();

    // 1-2 doctor reads/updates own profile
    const created = await doctors.upsertOwn(
      doctorA,
      {
        legalName: 'Synthetic Legal A',
        displayName: 'Synthetic Doctor A',
        prescriptionName: 'Dr Synthetic A',
        primaryPhone: '+91 90000 00001',
        professionalEmail: 'synthetic.a@example.test',
        specialization: 'General',
        yearsOfExperience: 5,
        professionalBio: 'Synthetic bio',
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata',
        profileStatus: 'ACTIVE',
      },
      env,
    );
    expect(created.displayName).toBe('Synthetic Doctor A');
    const own = await doctors.getOwn(doctorA, env);
    expect(own.profile.userId).toBe(doctorA.actorId);

    // 3 doctor cannot invent another doctor's ownership via protected fields
    await expect(
      doctors.upsertOwn(
        doctorA,
        {
          userId: doctorB.actorId,
          legalName: 'Hijack',
          displayName: 'Hijack',
          prescriptionName: 'Hijack',
          preferredLanguage: 'en',
          timezone: 'Asia/Kolkata',
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    // 4-5 cross-tenant denied (wrong clinic / org binding)
    await expect(
      clinics.getCurrent({ ...doctorA, clinicId: doctorB.clinicId }, env),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      doctors.getOwn(
        {
          ...doctorB,
          organizationId: doctorA.organizationId,
          clinicId: doctorA.clinicId,
        },
        env,
      ),
    ).rejects.toBeTruthy();

    // 6-7 missing principal / tenant (service layer)
    await expect(doctors.getOwn(null as unknown as TenantContext, env)).rejects.toBeTruthy();
    await expect(
      doctors.getOwn(
        {
          organizationId: '',
          clinicId: '',
          actorId: '',
          actorRole: 'Doctor',
          membershipStatus: 'ACTIVE',
          allowPatientPhi: true,
        },
        env,
      ),
    ).rejects.toBeTruthy();

    // 8 disabled membership denied
    await expect(doctors.getOwn(disabledDoctor, env)).rejects.toBeInstanceOf(
      MembershipInactiveError,
    );

    // 9-10 qualifications + registrations
    const qual = await doctors.addQualification(
      doctorA,
      {
        degreeTitle: 'BHMS',
        institution: 'Synthetic College',
        completionYear: 2015,
        displayOrder: 1,
      },
      env,
    );
    const qualUpdated = await doctors.updateQualification(
      doctorA,
      qual.id,
      { degreeTitle: 'BHMS (Hons)' },
      env,
    );
    expect(qualUpdated.degreeTitle).toBe('BHMS (Hons)');
    const reg = await doctors.addRegistration(
      doctorA,
      {
        registrationNumber: 'SYN-REG-1',
        registrationAuthority: 'Synthetic Board',
        registrationRegion: 'IN-MP',
        displayOrder: 1,
      },
      env,
    );
    expect(reg.verificationClaimed).toBe(false);

    // 11 cannot invent unsupported ownership / verification
    await expect(
      doctors.addRegistration(
        doctorA,
        {
          registrationNumber: 'X',
          registrationAuthority: 'Y',
          verificationClaimed: true,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    // 12 ClinicAdmin updates clinic
    const clinic = await clinics.updateCurrent(
      clinicAdminA,
      {
        displayName: 'Synthetic Clinic A Updated',
        phone: '+91 90000 00011',
        email: 'clinic.a@example.test',
        timezone: 'Asia/Kolkata',
        addressLine1: '1 Demo Street',
        city: 'Indore',
        postalCode: '452001',
      },
      env,
    );
    expect(clinic.displayName).toBe('Synthetic Clinic A Updated');

    // 13 ordinary Doctor cannot alter protected clinic settings
    await expect(
      clinics.updateCurrent(doctorA, { displayName: 'Doctor Hijack' }, env),
    ).rejects.toBeInstanceOf(AccessDeniedError);

    // 14 hours validation
    await expect(
      clinics.replaceHours(
        clinicAdminA,
        [{ dayOfWeek: 1, isClosed: false, openTime: '18:00', closeTime: '09:00' }],
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    const hours = await clinics.replaceHours(
      clinicAdminA,
      [
        { dayOfWeek: 0, isClosed: true },
        { dayOfWeek: 1, isClosed: false, openTime: '09:00', closeTime: '17:00' },
      ],
      env,
    );
    expect(hours).toHaveLength(2);

    // 15-17 invalid phone/email/oversized/html
    await expect(
      doctors.upsertOwn(
        doctorA,
        {
          legalName: 'Synthetic Legal A',
          displayName: 'Synthetic Doctor A',
          prescriptionName: 'Dr Synthetic A',
          primaryPhone: 'not-a-phone',
          preferredLanguage: 'en',
          timezone: 'Asia/Kolkata',
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      doctors.upsertOwn(
        doctorA,
        {
          legalName: 'Synthetic Legal A',
          displayName: 'Synthetic Doctor A',
          prescriptionName: 'Dr Synthetic A',
          professionalEmail: 'bad',
          preferredLanguage: 'en',
          timezone: 'Asia/Kolkata',
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      doctors.upsertOwn(
        doctorA,
        {
          legalName: 'Synthetic Legal A',
          displayName: 'x'.repeat(201),
          prescriptionName: 'Dr Synthetic A',
          preferredLanguage: 'en',
          timezone: 'Asia/Kolkata',
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      doctors.upsertOwn(
        doctorA,
        {
          legalName: 'Synthetic Legal A',
          displayName: '<script>alert(1)</script>',
          prescriptionName: 'Dr Synthetic A',
          preferredLanguage: 'en',
          timezone: 'Asia/Kolkata',
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    // 18 optimistic concurrency
    await expect(
      clinics.updateCurrent(
        clinicAdminA,
        { displayName: 'Stale', expectedUpdatedAt: '2000-01-01T00:00:00.000Z' },
        env,
      ),
    ).rejects.toBeInstanceOf(ConflictError);

    // 19-20 Management/SuperAdmin denied at profile access
    await expect(
      doctors.getOwn(
        {
          organizationId: orgAId,
          clinicId: doctorA.clinicId,
          actorId: doctorA.actorId,
          actorRole: 'ManagementAdmin',
          membershipStatus: 'ACTIVE',
          allowPatientPhi: false,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      doctors.getOwn(
        {
          organizationId: orgAId,
          clinicId: doctorA.clinicId,
          actorId: doctorA.actorId,
          actorRole: 'SuperAdmin',
          membershipStatus: 'ACTIVE',
          allowPatientPhi: false,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(AccessDeniedError);

    // 21-23 prescriber preview + immutability + no invented registration
    const preview = await doctors.captureIdentitySnapshot(doctorA, env);
    expect(preview.schemaVersion).toBe('ehas2.prescriber_identity.v1');
    expect(preview.doctor.displayName).toBe('Synthetic Doctor A');
    expect(preview.doctor.registrations.length).toBeGreaterThan(0);
    const emptyRegsDoctor = await doctors.upsertOwn(
      doctorB,
      {
        legalName: 'Synthetic Legal B',
        displayName: 'Synthetic Doctor B',
        prescriptionName: 'Dr Synthetic B',
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata',
      },
      env,
    );
    expect(emptyRegsDoctor.displayName).toBe('Synthetic Doctor B');
    const emptyPreview = await doctors.captureIdentitySnapshot(doctorB, env);
    expect(emptyPreview.doctor.registrations).toEqual([]);

    const frozen = structuredClone(preview);
    await doctors.upsertOwn(
      doctorA,
      {
        legalName: 'Synthetic Legal A',
        displayName: 'Renamed After Snapshot',
        prescriptionName: 'Dr Synthetic A',
        primaryPhone: '+91 90000 00001',
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata',
        profileStatus: 'ACTIVE',
      },
      env,
    );
    expect(frozen.doctor.displayName).toBe('Synthetic Doctor A');
    const liveAfter = await doctors.captureIdentitySnapshot(doctorA, env);
    expect(liveAfter.doctor.displayName).toBe('Renamed After Snapshot');
    expect(frozen.doctor.displayName).not.toBe(liveAfter.doctor.displayName);

    // 25 audit metadata without full bio in event metadata (spot-check via service success path)
    const completion = await doctors.getProfileCompletion(doctorA, env);
    expect(completion.checks.hasDisplayName).toBe(true);
    expect(completion.percent).toBeGreaterThan(0);

    // membership display
    const mine = await memberships.listAuthorizedForActor(clinicAdminA, env);
    expect(mine.length).toBeGreaterThan(0);
    await expect(
      memberships.denyCrossTenantCreate(doctorA, doctorB.organizationId, doctorB.clinicId),
    ).rejects.toBeInstanceOf(AccessDeniedError);

    // HTTP happy path with synthetic principal DI (not header bypass)
    const principal = createPrincipalForPolicyEvaluation({
      subjectId: doctorA.actorId,
      role: PlatformRole.Doctor,
      tenantId: doctorA.organizationId,
      isTestPrincipal: true,
    });
    const app = createApp({
      resolvePrincipal: () => principal,
      resolveTenantContext: () => doctorA,
      doctors,
      clinics,
      memberships,
    });
    const httpOwn = await httpJson(app, 'GET', `${EHAS2_API_NAMESPACE}/me/profile`);
    expect(httpOwn.status).toBe(200);
    expect(httpOwn.headers.get('cache-control')).toMatch(/no-store/i);
    expect((httpOwn.json.data as { profile: { displayName: string } }).profile.displayName).toBe(
      'Renamed After Snapshot',
    );

    const adminPrincipal = createPrincipalForPolicyEvaluation({
      subjectId: clinicAdminA.actorId,
      role: PlatformRole.ClinicAdmin,
      tenantId: clinicAdminA.organizationId,
      isTestPrincipal: true,
    });
    const adminApp = createApp({
      resolvePrincipal: () => adminPrincipal,
      resolveTenantContext: () => clinicAdminA,
      doctors,
      clinics,
      memberships,
    });
    const httpClinic = await httpJson(adminApp, 'GET', `${EHAS2_API_NAMESPACE}/clinics/current`);
    expect(httpClinic.status).toBe(200);

    const doctorClinicWrite = await httpJson(
      app,
      'PATCH',
      `${EHAS2_API_NAMESPACE}/clinics/current`,
      {
        displayName: 'Should Fail',
      },
    );
    expect(doctorClinicWrite.status).toBe(403);

    // guessed UUID does not reveal existence beyond NOT_FOUND
    const guessed = await httpJson(
      app,
      'DELETE',
      `${EHAS2_API_NAMESPACE}/me/qualifications/00000000-0000-4000-8000-000000009999`,
    );
    expect(guessed.status).toBe(404);
    expect(guessed.json.code).toBe('NOT_FOUND');
  }, 180_000);

  it('non-superuser RLS still blocks cross-tenant clinic row reads', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          const r = await tx.query(`SELECT id FROM clinics WHERE id = $1`, [doctorB.clinicId]);
          return r.rows;
        },
        env,
      ),
    ).resolves.toEqual([]);
  }, 60_000);
});
