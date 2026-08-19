import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConsultationIntakeService } from '../../packages/database/src/services/consultationIntakeService.ts';
import { ConsultationService } from '../../packages/database/src/services/consultationService.ts';
import {
  CueEligibleSourceService,
  bindDoctorDeclaredChiefComplaintSourceIdentity,
} from '../../packages/database/src/services/cueEligibleSourceService.ts';
import { lockChiefComplaintCueSource } from '../../packages/database/src/services/cueSourceLock.ts';
import { PatientService } from '../../packages/database/src/services/patientService.ts';
import {
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
} from '../../packages/database/src/repositories/postgres.ts';
import {
  ResourceNotFoundError,
  ValidationError,
} from '../../packages/database/src/domainErrors.ts';
import {
  closePool,
  withAdminClient,
  withTenantTransaction,
} from '../../packages/database/src/pool.ts';
import { migrateUp, resetDatabaseSchema } from '../../packages/database/src/migrate.ts';
import type { TenantContext } from '../../packages/database/src/tenantContext.ts';
import { loadPinnedProductionPack } from '../../packages/evidence-extract/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d_test');
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const cues = new CueEligibleSourceService();

beforeAll(async () => {
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
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2C1 cue adapter tests');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedTenants(): Promise<{
  doctorA: TenantContext;
  doctorB: TenantContext;
  otherDoctorA: TenantContext;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic C1 Doctor A',
        actorId: '00000000-0000-4000-8000-0000000000c1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic C1 Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic C1 Clinic A', actorId: uA.id },
    );
    await query('COMMIT');
    const mA = await memberships.create(
      { query },
      { userId: uA.id, organizationId: oA.id, clinicId: cA.id, status: 'ACTIVE', actorId: uA.id },
    );
    await memberships.assignRole({ query }, { membershipId: mA.id, roleCode: 'Doctor' });

    const uOther = await users.create(
      { query },
      {
        displayName: 'Synthetic C1 Other Doctor A',
        actorId: '00000000-0000-4000-8000-0000000000c3',
      },
    );
    const mOther = await memberships.create(
      { query },
      {
        userId: uOther.id,
        organizationId: oA.id,
        clinicId: cA.id,
        status: 'ACTIVE',
        actorId: uOther.id,
      },
    );
    await memberships.assignRole({ query }, { membershipId: mOther.id, roleCode: 'Doctor' });

    const uB = await users.create(
      { query },
      {
        displayName: 'Synthetic C1 Doctor B',
        actorId: '00000000-0000-4000-8000-0000000000c2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic C1 Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic C1 Clinic B', actorId: uB.id },
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
      otherDoctorA: {
        organizationId: oA.id,
        clinicId: cA.id,
        actorId: uOther.id,
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

async function openConsultation(
  tenant: TenantContext,
  chiefComplaintText?: string | null,
): Promise<{ consultationId: string; patientId: string }> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic C1 Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    {
      patientId: patient.id,
      ...(chiefComplaintText === undefined ? {} : { chiefComplaintText }),
    },
    env,
  );
  return { consultationId: consultation.id, patientId: patient.id };
}

type CountRow = {
  facts: number;
  extract_cands: number;
  findings: number;
  audits: number;
  consults: number;
  complaint: string | null;
  updated_at: string;
};

async function snapshot(consultationId: string): Promise<CountRow> {
  return withAdminClient(async (query) => {
    const r = await query<CountRow>(
      `SELECT
         (SELECT count(*)::int FROM clinical_fact_candidates) AS facts,
         (SELECT count(*)::int FROM clinical_evidence_extraction_candidates) AS extract_cands,
         (SELECT count(*)::int FROM structured_report_findings) AS findings,
         (SELECT count(*)::int FROM audit_events) AS audits,
         (SELECT count(*)::int FROM consultations) AS consults,
         (SELECT chief_complaint_text FROM consultations WHERE id = $1) AS complaint,
         (SELECT updated_at::text FROM consultations WHERE id = $1) AS updated_at`,
      [consultationId],
    );
    return r.rows[0];
  }, env);
}

function expectedFingerprint(
  tenant: TenantContext,
  patientId: string,
  consultationId: string,
  exactPersistedText: string,
): string {
  const pack = loadPinnedProductionPack();
  return bindDoctorDeclaredChiefComplaintSourceIdentity({
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    patientId,
    consultationId,
    exactPersistedText,
    packId: pack.packId,
    packVersion: pack.packVersion,
    packContentChecksum: pack.contentChecksum,
  });
}

describe('F3D-2C1 doctor-declared chief-complaint cue adapter (isolated PostgreSQL)', () => {
  it('parses persisted English and Hindi cues, binds identity, and persists nothing', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const englishText = 'denies fever';
    const { consultationId, patientId } = await openConsultation(doctorA, englishText);
    const before = await snapshot(consultationId);
    const first = await cues.parseDoctorDeclaredChiefComplaintCues(
      doctorA,
      { consultationId },
      env,
    );
    const second = await cues.parseDoctorDeclaredChiefComplaintCues(
      doctorA,
      { consultationId },
      env,
    );
    const after = await snapshot(consultationId);
    expect(first.parser.ok).toBe(true);
    expect(first.parser.matches.some((m) => m.entryId === 'neg-04')).toBe(true);
    expect(first.parser.matches.every((m) => m.clinicallyUsed === false)).toBe(true);
    expect(
      first.parser.matches.every((m) => m.authorityScope === 'TERMINOLOGY_CUE_MATCH_ONLY'),
    ).toBe(true);
    expect(first.sourceIdentityFingerprint).toBe(
      expectedFingerprint(doctorA, patientId, consultationId, englishText),
    );
    expect(second.sourceIdentityFingerprint).toBe(first.sourceIdentityFingerprint);
    expect(second.parser.matches.map((m) => m.candidateId)).toEqual(
      first.parser.matches.map((m) => m.candidateId),
    );
    expect(first.organizationId).toBe(doctorA.organizationId);
    expect(first.patientId).toBe(patientId);
    expect(first).not.toHaveProperty('eligibleText');
    expect(first).not.toHaveProperty('chiefComplaintText');
    expect(JSON.stringify(Object.keys(first).sort())).not.toMatch(
      /diseaseId|medicineCode|formula|potency|"dose"|analyzeComplete/,
    );
    expect(after).toEqual(before);

    await intake.patch(doctorA, consultationId, { chiefComplaintText: 'बुखार नहीं है' }, env);
    const hi = await cues.parseDoctorDeclaredChiefComplaintCues(doctorA, { consultationId }, env);
    expect(hi.parser.ok).toBe(true);
    expect(hi.parser.matches.some((m) => m.entryId === 'neg-01')).toBe(true);
    expect(hi.sourceIdentityFingerprint).not.toBe(first.sourceIdentityFingerprint);
    expect(hi.sourceIdentityFingerprint).toBe(
      expectedFingerprint(doctorA, patientId, consultationId, 'बुखार नहीं है'),
    );
  });

  it('uses server row text and keeps Roman-Hindi exact-case plus unapproved NO_MATCHES', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultationId } = await openConsultation(doctorA, 'bukhar nahi hai');
    const roman = await cues.parseDoctorDeclaredChiefComplaintCues(
      doctorA,
      { consultationId },
      env,
    );
    expect(roman.parser.ok).toBe(true);
    expect(roman.parser.matches.some((m) => m.entryId === 'neg-09')).toBe(true);

    await intake.patch(doctorA, consultationId, { chiefComplaintText: 'NAHI HAI' }, env);
    const folded = await cues.parseDoctorDeclaredChiefComplaintCues(
      doctorA,
      { consultationId },
      env,
    );
    expect(folded.parser.ok).toBe(true);
    if (folded.parser.ok) expect(folded.parser.reason).toBe('NO_MATCHES');

    await intake.patch(doctorA, consultationId, { chiefComplaintText: 'zzzzqxx not a cue' }, env);
    const none = await cues.parseDoctorDeclaredChiefComplaintCues(doctorA, { consultationId }, env);
    expect(none.parser.ok).toBe(true);
    if (none.parser.ok) expect(none.parser.reason).toBe('NO_MATCHES');
  });

  it('fails closed for blank, oversized, missing, unauthorized, and cross-tenant', async () => {
    requireDb();
    const { doctorA, doctorB, otherDoctorA } = await seedTenants();
    const blank = await openConsultation(doctorA);
    await expect(
      cues.parseDoctorDeclaredChiefComplaintCues(
        doctorA,
        { consultationId: blank.consultationId },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const { consultationId } = await openConsultation(doctorA, 'denies fever');
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(`UPDATE consultations SET chief_complaint_text = $1 WHERE id = $2`, [
          'x'.repeat(2001),
          consultationId,
        ]);
      },
      env,
    );
    await expect(
      cues.parseDoctorDeclaredChiefComplaintCues(doctorA, { consultationId }, env),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'INPUT_TOO_LARGE' });
    const still = await snapshot(consultationId);
    expect(still.complaint?.length).toBe(2001);

    await expect(
      cues.parseDoctorDeclaredChiefComplaintCues(
        doctorA,
        { consultationId: '00000000-0000-4000-8000-000000000099' },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await expect(
      cues.parseDoctorDeclaredChiefComplaintCues(otherDoctorA, { consultationId }, env),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await expect(
      cues.parseDoctorDeclaredChiefComplaintCues(doctorB, { consultationId }, env),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('serializes parser lock with chief-complaint writer and does not lock unrelated patches', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const a = await openConsultation(doctorA, 'denies fever');
    const b = await openConsultation(doctorA, 'denies fever');

    let releaseA!: () => void;
    const gateA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    let acquiredA!: () => void;
    const gotA = new Promise<void>((resolve) => {
      acquiredA = resolve;
    });
    const holderA = withTenantTransaction(
      doctorA,
      async (tx) => {
        await lockChiefComplaintCueSource(tx, doctorA, a.consultationId);
        acquiredA();
        await gateA;
      },
      env,
    );
    await gotA;

    const writerStarted = Date.now();
    const writerPromise = intake.patch(
      doctorA,
      a.consultationId,
      { chiefComplaintText: 'bukhar nahi hai' },
      env,
    );
    await delay(250);
    expect(Date.now() - writerStarted).toBeGreaterThanOrEqual(200);

    const unrelatedStart = Date.now();
    await intake.patch(doctorA, b.consultationId, { chiefComplaintText: 'bukhar nahi hai' }, env);
    expect(Date.now() - unrelatedStart).toBeLessThan(800);

    const vitalsStart = Date.now();
    await intake.patch(doctorA, a.consultationId, { vitals: { pulseBpm: 72 } }, env);
    expect(Date.now() - vitalsStart).toBeLessThan(800);

    releaseA();
    await holderA;
    await writerPromise;
    expect(Date.now() - writerStarted).toBeGreaterThanOrEqual(250);

    const parsed = await cues.parseDoctorDeclaredChiefComplaintCues(
      doctorA,
      { consultationId: a.consultationId },
      env,
    );
    expect(parsed.sourceIdentityFingerprint).toBe(
      expectedFingerprint(doctorA, a.patientId, a.consultationId, 'bukhar nahi hai'),
    );
    expect(parsed.parser.matches.some((m) => m.entryId === 'neg-09')).toBe(true);
  });

  it('writer-first then parser binds only the committed text; failed parser tx releases the lock', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultationId, patientId } = await openConsultation(doctorA, 'denies fever');
    await intake.patch(doctorA, consultationId, { chiefComplaintText: 'bukhar nahi hai' }, env);
    const parsed = await cues.parseDoctorDeclaredChiefComplaintCues(
      doctorA,
      { consultationId },
      env,
    );
    expect(parsed.sourceIdentityFingerprint).toBe(
      expectedFingerprint(doctorA, patientId, consultationId, 'bukhar nahi hai'),
    );

    const blank = await openConsultation(doctorA);
    await expect(
      cues.parseDoctorDeclaredChiefComplaintCues(
        doctorA,
        { consultationId: blank.consultationId },
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    const afterFail = Date.now();
    await intake.patch(doctorA, blank.consultationId, { chiefComplaintText: 'denies fever' }, env);
    expect(Date.now() - afterFail).toBeLessThan(800);
  });

  it('concurrent parser and writer each bind one complete committed source', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const textA = 'denies fever';
    const textB = 'bukhar nahi hai';
    const { consultationId, patientId } = await openConsultation(doctorA, textA);
    const [parsed] = await Promise.all([
      cues.parseDoctorDeclaredChiefComplaintCues(doctorA, { consultationId }, env),
      intake.patch(doctorA, consultationId, { chiefComplaintText: textB }, env),
    ]);
    const fpA = expectedFingerprint(doctorA, patientId, consultationId, textA);
    const fpB = expectedFingerprint(doctorA, patientId, consultationId, textB);
    expect([fpA, fpB]).toContain(parsed.sourceIdentityFingerprint);
    expect(
      new Set(parsed.parser.matches.map((m) => m.sourceIdentityFingerprint)).size,
    ).toBeLessThanOrEqual(1);
    const later = await cues.parseDoctorDeclaredChiefComplaintCues(
      doctorA,
      { consultationId },
      env,
    );
    expect(later.sourceIdentityFingerprint).toBe(fpB);
  });
});
