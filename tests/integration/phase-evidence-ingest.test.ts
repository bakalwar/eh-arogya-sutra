import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  EvidenceService,
  PatientService,
  ConsultationService,
  closePool,
  getOrderedMigrationIds,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  buildEvidenceObjectKey,
  getMemoryFakeObjectStore,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import {
  PlatformRole,
  createPrincipalForPolicyEvaluation,
} from '../../packages/security/src/index.ts';
import { createApp } from '../../apps/api/src/createApp.ts';
import { EHAS2_API_NAMESPACE } from '../../packages/shared/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';
import { runEvidenceRetentionOnce } from '../../apps/worker/src/jobs/evidenceRetention.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_evidence_test');
let dbReady = false;
resetMemoryFakeObjectStore();
const store = getMemoryFakeObjectStore();
const patients = new PatientService();
const consultations = new ConsultationService();
const evidence = new EvidenceService({ store });

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
  Object.assign(process.env, env);
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
  if (!dbReady) throw new Error('BLOCKED: isolated PostgreSQL unavailable for evidence F1 tests');
}

async function seedTenants(): Promise<{
  doctorA: TenantContext;
  doctorB: TenantContext;
  clinicAdminA: TenantContext;
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
    const mA = await memberships.create(
      { query },
      { userId: uA.id, organizationId: oA.id, clinicId: cA.id, status: 'ACTIVE', actorId: uA.id },
    );
    await memberships.assignRole({ query }, { membershipId: mA.id, roleCode: 'Doctor' });

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
      clinicAdminA: {
        organizationId: oA.id,
        clinicId: cA.id,
        actorId: uAdmin.id,
        actorRole: 'ClinicAdmin',
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

function appFor(tenant: TenantContext) {
  const principal = createPrincipalForPolicyEvaluation({
    subjectId: tenant.actorId,
    role: tenant.actorRole as typeof PlatformRole.Doctor,
    tenantId: tenant.organizationId,
    isTestPrincipal: true,
  });
  return createApp({
    resolvePrincipal: () => principal,
    resolveTenantContext: () => tenant,
    evidence,
  });
}

async function httpJson(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: Record<string, unknown> }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers:
        body === undefined
          ? { Accept: 'application/json', ...headers }
          : { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json()) as Record<string, unknown>;
    return { status: res.status, json };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

async function httpBytes(
  app: ReturnType<typeof createApp>,
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': contentType },
      body: bytes,
    });
    const json = (await res.json()) as Record<string, unknown>;
    return { status: res.status, json };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

describe('F1 evidence ingest foundation', () => {
  it('registers migration 010', () => {
    expect(getOrderedMigrationIds()).toContain('010_clinical_evidence_ingestion');
    expect(getOrderedMigrationIds()).toHaveLength(10);
  });

  it('creates patient, consultation intake, evidence metadata, and stores temp bytes', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const app = appFor(doctorA);
    const createdPatient = await httpJson(app, 'POST', `${EHAS2_API_NAMESPACE}/patients`, {
      displayName: 'Synthetic Patient One',
      dateOfBirth: '1980-01-15',
    });
    expect(createdPatient.status).toBe(201);
    const patient = createdPatient.json.data as { id: string };
    const createdCase = await httpJson(app, 'POST', `${EHAS2_API_NAMESPACE}/consultations`, {
      patientId: patient.id,
      chiefComplaintText: 'synthetic cough',
      chiefComplaintDuration: '3 days',
      vitals: { bloodPressureSystolic: 120, bloodPressureDiastolic: 80, pulseBpm: 72 },
      symptoms: [{ label: 'cough', duration: '3 days', phase: 'acute' }],
      historyNotes: 'synthetic history',
      doctorObservations: 'synthetic observation',
    });
    expect(createdCase.status).toBe(201);
    const payload = createdCase.json.data as {
      consultation: { id: string };
      intake: { chiefComplaintDuration: string; vitals: { pulseBpm: number } };
    };
    expect(payload.intake.chiefComplaintDuration).toBe('3 days');
    expect(payload.intake.vitals.pulseBpm).toBe(72);

    const initiated = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${payload.consultation.id}/evidence`,
      {
        evidenceType: 'BLOOD_REPORT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'lab.png',
        declaredMime: 'image/png',
      },
      { 'Idempotency-Key': 'syn-ev-1' },
    );
    expect(initiated.status).toBe(201);
    const item = initiated.json.data as {
      id: string;
      processingStatus: string;
      clinicalAuthority: string;
      extractionStatus: string;
    };
    expect(item.processingStatus).toBe('INTAKE_CREATED');
    expect(item.clinicalAuthority).toBe('NOT_AUTHORITATIVE');
    expect(item.extractionStatus).toBe('NOT_AUTHORIZED');

    const replay = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${payload.consultation.id}/evidence`,
      {
        evidenceType: 'BLOOD_REPORT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'lab.png',
        declaredMime: 'image/png',
      },
      { 'Idempotency-Key': 'syn-ev-1' },
    );
    expect(replay.status).toBe(201);
    expect((replay.json.data as { id: string }).id).toBe(item.id);

    const stored = await httpBytes(
      app,
      `${EHAS2_API_NAMESPACE}/consultations/${payload.consultation.id}/evidence/${item.id}/bytes`,
      PNG,
      'image/png',
    );
    expect(stored.status).toBe(200);
    const storedItem = stored.json.data as {
      processingStatus: string;
      malwareScanResult: string;
      contentSha256: string;
      byteSize: number;
    };
    expect(storedItem.processingStatus).toBe('MALWARE_PENDING');
    expect(storedItem.malwareScanResult).toBe('UNAVAILABLE');
    expect(storedItem.malwareScanResult).not.toBe('CLEAN');
    expect(storedItem.contentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(stored.json)).not.toMatch(/objectKey|presigned|http:\/\//);

    const listed = await httpJson(
      app,
      'GET',
      `${EHAS2_API_NAMESPACE}/consultations/${payload.consultation.id}/evidence`,
    );
    expect(listed.status).toBe(200);
    expect(listed.json.data).toHaveLength(1);
  }, 120_000);

  it('ready flags stay fail-closed for OCR/engine/production store', async () => {
    const app = createApp();
    const res = await httpJson(app, 'GET', '/ready');
    expect(res.status).toBe(503);
    expect(res.json.evidenceIngestFoundation).toBe(true);
    expect(res.json.ocr).toBe(false);
    expect(res.json.clinicalEngine).toBe(false);
    expect(res.json.productionObjectStore).toBe(false);
    expect(res.json.malwareScanner).toBe(false);
  });

  it('conceals tenant A evidence from tenant B', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Isolated Patient' },
      {},
      env,
    );
    const consultation = await consultations.create(doctorA, { patientId: patient.id }, env);
    const item = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'USG',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'usg.png',
        declaredMime: 'image/png',
      },
      env,
    );
    await evidence.receiveBytes(doctorA, consultation.id, item.id, PNG, env);
    const hidden = await httpJson(
      appFor(doctorB),
      'GET',
      `${EHAS2_API_NAMESPACE}/consultations/${consultation.id}/evidence/${item.id}`,
    );
    expect(hidden.status).toBe(404);
    const foundB = await withTenantTransaction(
      doctorB,
      async (tx) => {
        const r = await tx.query(`SELECT id FROM clinical_evidence_items WHERE id = $1`, [item.id]);
        return r.rowCount;
      },
      env,
    );
    expect(foundB).toBe(0);
  }, 120_000);

  it('audit_events rejects UPDATE/DELETE for ehas2_app', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `INSERT INTO audit_events (organization_id, clinic_id, actor_id, actor_role, event_type, outcome, metadata)
           VALUES ($1,$2,$3,$4,'synthetic_audit','SUCCESS','{}')`,
          [doctorA.organizationId, doctorA.clinicId, doctorA.actorId, doctorA.actorRole],
        );
        let updateBlocked = false;
        try {
          await tx.query(`UPDATE audit_events SET outcome = 'FAILED' WHERE organization_id = $1`, [
            doctorA.organizationId,
          ]);
        } catch {
          updateBlocked = true;
        }
        let deleteBlocked = false;
        try {
          await tx.query(`DELETE FROM audit_events WHERE organization_id = $1`, [
            doctorA.organizationId,
          ]);
        } catch {
          deleteBlocked = true;
        }
        expect(updateBlocked).toBe(true);
        expect(deleteBlocked).toBe(true);
      },
      env,
    );
  }, 120_000);

  it('deletes temp originals and verifies absence', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Retention Patient' },
      {},
      env,
    );
    const consultation = await consultations.create(doctorA, { patientId: patient.id }, env);
    const item = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'CT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'ct.png',
        declaredMime: 'image/png',
      },
      env,
    );
    const stored = await evidence.receiveBytes(doctorA, consultation.id, item.id, PNG, env);
    const objectKey = buildEvidenceObjectKey({
      organizationId: doctorA.organizationId,
      clinicId: doctorA.clinicId,
      consultationId: consultation.id,
      evidenceId: stored.id,
      contentSha256: stored.contentSha256 ?? '',
    });
    expect(await store.exists(objectKey)).toBe(true);
    await runEvidenceRetentionOnce(
      doctorA,
      'syn-worker-1',
      new Date(Date.parse(stored.expiresAt) + 1000),
      env,
      evidence,
    );
    await runEvidenceRetentionOnce(
      doctorA,
      'syn-worker-1',
      new Date(Date.parse(stored.expiresAt) + 2000),
      env,
      evidence,
    );
    const after = await evidence.get(doctorA, consultation.id, stored.id, env);
    expect(after.processingStatus).toBe('DELETION_VERIFIED');
    expect(after.deletionVerificationStatus).toBe('VERIFIED');
    expect(await store.exists(objectKey)).toBe(false);
    expect(after.clinicalAuthority).toBe('NOT_AUTHORITATIVE');
  }, 120_000);

  it('returns 404 when bytes/abort consultation path does not match evidence', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const app = appFor(doctorA);
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Bind Patient' },
      {},
      env,
    );
    const c1 = await consultations.create(doctorA, { patientId: patient.id }, env);
    const c2 = await consultations.create(doctorA, { patientId: patient.id }, env);
    const item = await evidence.initiate(
      doctorA,
      {
        consultationId: c1.id,
        evidenceType: 'XRAY',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'xray.png',
        declaredMime: 'image/png',
      },
      env,
    );
    const mismatched = await httpBytes(
      app,
      `${EHAS2_API_NAMESPACE}/consultations/${c2.id}/evidence/${item.id}/bytes`,
      PNG,
      'image/png',
    );
    expect(mismatched.status).toBe(404);
    const abortMismatch = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${c2.id}/evidence/${item.id}/abort`,
    );
    expect(abortMismatch.status).toBe(404);
  }, 120_000);

  it('aborts with delete then verify terminal state', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Abort Patient' },
      {},
      env,
    );
    const consultation = await consultations.create(doctorA, { patientId: patient.id }, env);
    const item = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'MRI',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'mri.png',
        declaredMime: 'image/png',
      },
      env,
    );
    const stored = await evidence.receiveBytes(doctorA, consultation.id, item.id, PNG, env);
    const objectKey = buildEvidenceObjectKey({
      organizationId: doctorA.organizationId,
      clinicId: doctorA.clinicId,
      consultationId: consultation.id,
      evidenceId: stored.id,
      contentSha256: stored.contentSha256 ?? '',
    });
    const aborted = await evidence.abort(doctorA, consultation.id, stored.id, env);
    expect(aborted.processingStatus).toBe('DELETED');
    expect(aborted.rejectionCode).toBe('ABORTED');
    expect(await store.exists(objectKey)).toBe(false);
    await runEvidenceRetentionOnce(doctorA, 'syn-worker-abort', new Date(), env, evidence);
    const verified = await evidence.get(doctorA, consultation.id, stored.id, env);
    expect(verified.processingStatus).toBe('DELETION_VERIFIED');
    expect(verified.deletionVerificationStatus).toBe('VERIFIED');
  }, 120_000);

  it('expires intake without bytes via retention jobs', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Orphan Patient' },
      {},
      env,
    );
    const consultation = await consultations.create(doctorA, { patientId: patient.id }, env);
    const item = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'USG',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'usg.png',
        declaredMime: 'image/png',
      },
      env,
    );
    expect(item.processingStatus).toBe('INTAKE_CREATED');
    await runEvidenceRetentionOnce(
      doctorA,
      'syn-worker-orphan',
      new Date(Date.parse(item.expiresAt) + 1000),
      env,
      evidence,
    );
    await runEvidenceRetentionOnce(
      doctorA,
      'syn-worker-orphan',
      new Date(Date.parse(item.expiresAt) + 2000),
      env,
      evidence,
    );
    const after = await evidence.get(doctorA, consultation.id, item.id, env);
    expect(after.processingStatus).toBe('DELETION_VERIFIED');
  }, 120_000);

  it('reclaims expired leases under two-worker contention', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Lease Patient' },
      {},
      env,
    );
    const consultation = await consultations.create(doctorA, { patientId: patient.id }, env);
    const item = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'CT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'lease.png',
        declaredMime: 'image/png',
      },
      env,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_evidence_jobs
           SET status = 'LEASED',
               locked_by = 'stale-worker',
               lease_expires_at = now() - interval '1 minute',
               next_run_at = now() - interval '1 minute'
           WHERE evidence_id = $1 AND job_type = 'DELETE_ORIGINAL'`,
          [item.id],
        );
      },
      env,
    );
    const [a, b] = await Promise.all([
      runEvidenceRetentionOnce(doctorA, 'worker-a', new Date(), env, evidence),
      runEvidenceRetentionOnce(doctorA, 'worker-b', new Date(), env, evidence),
    ]);
    expect(a.processed + b.processed).toBeGreaterThanOrEqual(1);
    await runEvidenceRetentionOnce(doctorA, 'worker-a', new Date(), env, evidence);
    const after = await evidence.get(doctorA, consultation.id, item.id, env);
    expect(after.processingStatus).toBe('DELETION_VERIFIED');
  }, 120_000);

  it('rejects unknown DTO keys and nested forbidden audit keys', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const app = appFor(doctorA);
    const badPatient = await httpJson(app, 'POST', `${EHAS2_API_NAMESPACE}/patients`, {
      displayName: 'Synthetic',
      suspectedDiagnosis: 'should-fail',
    });
    expect(badPatient.status).toBe(400);
    expect(String(badPatient.json.message ?? '')).not.toMatch(/suspectedDiagnosis|SQL|stack/i);

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        let blocked = false;
        try {
          const { PgAuditEventRepository } = await import('../../packages/database/src/index.ts');
          const auditRepo = new PgAuditEventRepository();
          await auditRepo.append(tx, {
            organizationId: doctorA.organizationId,
            clinicId: doctorA.clinicId,
            actorId: doctorA.actorId,
            actorRole: doctorA.actorRole,
            eventType: 'synthetic_nested_forbidden',
            outcome: 'SUCCESS',
            metadata: { nest: { token: 'nope' } },
          });
        } catch {
          blocked = true;
        }
        expect(blocked).toBe(true);
      },
      env,
    );
  }, 120_000);

  it('normalizes concurrent duplicate SHA to one surviving evidence id', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic Race Patient' },
      {},
      env,
    );
    const consultation = await consultations.create(doctorA, { patientId: patient.id }, env);
    const a = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'BLOOD_REPORT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'a.png',
        declaredMime: 'image/png',
      },
      env,
    );
    const b = await evidence.initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'BLOOD_REPORT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'b.png',
        declaredMime: 'image/png',
      },
      env,
    );
    const [ra, rb] = await Promise.all([
      evidence.receiveBytes(doctorA, consultation.id, a.id, PNG, env),
      evidence.receiveBytes(doctorA, consultation.id, b.id, PNG, env),
    ]);
    expect(new Set([ra.id, rb.id]).size).toBe(1);
  }, 120_000);
});
