import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import {
  ConsultationIntakeService,
  ConsultationService,
  EMPTY_FACT_VERIFICATION_SNAPSHOT_FINGERPRINT,
  FactCandidateService,
  FactNormalizationService,
  FactVerificationService,
  PatientService,
  PgFactVerificationRepository,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  buildNormalizationSnapshotFingerprint,
  closePool,
  factVerificationSubjectLockKey,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2d5_snap_test');
const factEnv = {
  ...env,
  EHAS2_F3D_FACT_CANDIDATES: '1',
};
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const verificationsRepo = new PgFactVerificationRepository();
const normService = new FactNormalizationService();
const verificationService = new FactVerificationService({ onSafeMetric: recordEvidenceEvent });
const EMPTY_FP = EMPTY_FACT_VERIFICATION_SNAPSHOT_FINGERPRINT;
const BAD_FP = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
  Object.assign(process.env, factEnv);
  try {
    const client = new pg.Client({ connectionString: env.EHAS2_DATABASE_URL });
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
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for concurrent snapshot tests');
  }
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

function isSnapshotFail(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /FACT_VERIFICATION_SNAPSHOT_INVALID/i.test(msg);
}

async function seedDoctor(): Promise<TenantContext> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const u = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2D5 Skew Doctor',
        actorId: '00000000-0000-4000-8000-0000000005f9',
      },
    );
    const o = await orgs.create({ query }, { name: 'Synthetic F3D2D5 Skew Org', actorId: u.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [o.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const c = await orgs.createClinic(
      { query },
      { organizationId: o.id, name: 'Synthetic F3D2D5 Skew Clinic', actorId: u.id },
    );
    await query('COMMIT');
    const m = await memberships.create(
      { query },
      { userId: u.id, organizationId: o.id, clinicId: c.id, status: 'ACTIVE', actorId: u.id },
    );
    await memberships.assignRole({ query }, { membershipId: m.id, roleCode: 'Doctor' });
    return {
      organizationId: o.id,
      clinicId: c.id,
      actorId: u.id,
      actorRole: 'Doctor' as const,
      membershipStatus: 'ACTIVE' as const,
      allowPatientPhi: true,
    };
  }, env);
}

async function openChiefFact(doctor: TenantContext, chief: string, label: string) {
  const patient = await patients.create(
    doctor,
    { displayName: label, dateOfBirth: '1990-01-01' },
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
    { chiefComplaintText: chief, idempotencyKey: `skew-patch-${label}-${consultation.id}` },
    env,
  );
  const fact = await factService().materialize(
    doctor,
    consultation.id,
    {
      sourceChannel: 'DOCTOR_DECLARED',
      sourceField: 'CHIEF_COMPLAINT',
      idempotencyKey: `skew-fact-${label}-${consultation.id}`,
    },
    factEnv,
  );
  return { fact };
}

async function openAppTx(doctor: TenantContext): Promise<pg.Client> {
  const c = new pg.Client({ connectionString: env.EHAS2_DATABASE_URL });
  await c.connect();
  await c.query('BEGIN');
  await c.query('SET LOCAL ROLE ehas2_app');
  await c.query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [doctor.organizationId]);
  await c.query(`SELECT set_config('ehas2.clinic_id', $1, true)`, [doctor.clinicId]);
  await c.query(`SELECT set_config('ehas2.actor_id', $1, true)`, [doctor.actorId]);
  await c.query(`SELECT set_config('ehas2.actor_role', 'Doctor', true)`);
  return c;
}

async function insertEmptyVerification(
  c: pg.Client,
  doctor: TenantContext,
  fact: {
    id: string;
    organizationId: string;
    clinicId: string;
    patientId: string;
    consultationId: string;
    sourceChannel: string;
    sourceField: string;
    sourceIdentityFingerprint: string;
    contentFingerprint: string;
  },
): Promise<void> {
  await c.query(
    `INSERT INTO clinical_fact_verification_events (
       organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
       source_channel, source_field, source_identity_fingerprint, content_fingerprint,
       normalization_snapshot_fingerprint, normalization_count, action, reason_code,
       authority_scope, decision_status, actor_id, actor_role, clinically_used
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,'ACCEPT_SOURCE_LINKED_FACT',
       'SOURCE_REPRESENTATION_REVIEWED','SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY','ACTIVE',
       $11,'Doctor',false
     )`,
    [
      fact.organizationId,
      fact.clinicId,
      fact.patientId,
      fact.consultationId,
      fact.id,
      fact.sourceChannel,
      fact.sourceField,
      fact.sourceIdentityFingerprint,
      fact.contentFingerprint,
      EMPTY_FP,
      doctor.actorId,
    ],
  );
}

async function insertSyntheticNorm(
  c: pg.Client,
  doctor: TenantContext,
  fact: {
    id: string;
    organizationId: string;
    clinicId: string;
    patientId: string;
    consultationId: string;
    sourceChannel: string;
    sourceField: string;
    sourceIdentityFingerprint: string;
  },
  identityFp: string,
): Promise<string> {
  const r = await c.query(
    `INSERT INTO clinical_fact_normalizations (
       organization_id, clinic_id, patient_id, consultation_id, source_fact_candidate_id,
       source_identity_fingerprint, normalization_identity_fingerprint,
       source_channel, source_field, normalization_kind, canonical_label,
       cue_entry_ids, pack_id, pack_version, pack_content_checksum,
       parser_version, parser_fingerprint, normalizer_method, normalizer_version,
       normalizer_fingerprint, authority_scope, decision_status, limitation_codes,
       clinically_used, actor_id, actor_role
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,'NEGATION_CUE','skew-norm',
       ARRAY[]::text[],'pack','1.0',$10,'parser-v1',$10,
       'OWNER_FROZEN_SOURCE_PRESERVING_V1','1',$10,
       'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE','{}'::text[],false,$11,'Doctor'
     ) RETURNING id`,
    [
      fact.organizationId,
      fact.clinicId,
      fact.patientId,
      fact.consultationId,
      fact.id,
      fact.sourceIdentityFingerprint,
      identityFp,
      fact.sourceChannel,
      fact.sourceField,
      BAD_FP,
      doctor.actorId,
    ],
  );
  return String((r.rows[0] as { id: string }).id);
}

async function finalInvariant(
  doctor: TenantContext,
  factId: string,
): Promise<{ ok: boolean; detail: string }> {
  return withAdminClient(async (q) => {
    const ev = await q(
      `SELECT id, decision_status, normalization_count
       FROM clinical_fact_verification_events
       WHERE organization_id=$1 AND clinic_id=$2 AND fact_candidate_id=$3
         AND decision_status='ACTIVE'`,
      [doctor.organizationId, doctor.clinicId, factId],
    );
    const norms = await q(
      `SELECT count(*)::int AS c FROM clinical_fact_normalizations
       WHERE organization_id=$1 AND clinic_id=$2 AND source_fact_candidate_id=$3
         AND decision_status='ACTIVE'`,
      [doctor.organizationId, doctor.clinicId, factId],
    );
    const activeNorms = Number((norms.rows[0] as { c: number }).c);
    if (ev.rows.length === 0) {
      return { ok: true, detail: `no-active-verification norms=${activeNorms}` };
    }
    if (ev.rows.length > 1) {
      return { ok: false, detail: 'multiple-active-verifications' };
    }
    const count = Number((ev.rows[0] as { normalization_count: number }).normalization_count);
    if (count !== activeNorms) {
      return { ok: false, detail: `count=${count} activeNorms=${activeNorms}` };
    }
    return { ok: true, detail: `active count=${count}` };
  }, env);
}

async function waitForAdvisoryWaiter(timeoutMs = 8000): Promise<boolean> {
  const probe = new pg.Client({ connectionString: env.EHAS2_DATABASE_URL });
  await probe.connect();
  try {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const anyWait = await probe.query(
        `SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND NOT granted LIMIT 1`,
      );
      if ((anyWait.rowCount ?? 0) > 0) return true;
      await new Promise((res) => setTimeout(res, 25));
    }
    return false;
  } finally {
    await probe.end();
  }
}

describe('F3D-2D5 concurrent snapshot serialization', () => {
  it('TS lock key matches SQL subject_lock_key', async () => {
    requireDb();
    const org = '11111111-1111-4111-8111-111111111111';
    const clinic = '22222222-2222-4222-8222-222222222222';
    const fact = '33333333-3333-4333-8333-333333333333';
    const ts = factVerificationSubjectLockKey(org, clinic, fact);
    const sql = await withAdminClient(async (q) => {
      const r = await q(
        `SELECT ehas2_fact_verification_subject_lock_key($1::uuid,$2::uuid,$3::uuid) AS k`,
        [org, clinic, fact],
      );
      return String((r.rows[0] as { k: string }).k);
    }, env);
    expect(ts).toBe(sql);
    expect(ts).toBe(`ehas2:fact-verification:v1:${org}:${clinic}:${fact}`);
  });

  it('A) empty verification vs new ACTIVE norm — no inconsistent commit', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const { fact } = await openChiefFact(doctor, 'skew a xzy', 'a');
    const a = await openAppTx(doctor);
    const b = await openAppTx(doctor);
    try {
      await insertEmptyVerification(a, doctor, fact);
      await insertSyntheticNorm(
        b,
        doctor,
        fact,
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      );
      const settled = await Promise.allSettled([a.query('COMMIT'), b.query('COMMIT')]);
      const ok = settled.filter((s) => s.status === 'fulfilled').length;
      const bad = settled.filter((s) => s.status === 'rejected').length;
      expect(ok).toBe(1);
      expect(bad).toBe(1);
      const inv = await finalInvariant(doctor, fact.id);
      expect(inv.ok).toBe(true);
    } finally {
      try {
        await a.end();
      } catch {
        /* ignore */
      }
      try {
        await b.end();
      } catch {
        /* ignore */
      }
    }
  });

  it('B) one-norm verification vs second ACTIVE norm — no stale one-child ACTIVE', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const { fact } = await openChiefFact(doctor, 'denies fever', 'b');
    const norm = await normService.materializeFactNormalizations(
      doctor,
      { sourceFactCandidateId: fact.id, idempotencyKey: `skew-b-norm-${fact.id}` },
      env,
    );
    expect(norm.normalizations.length).toBeGreaterThanOrEqual(1);
    const n0 = norm.normalizations[0]!;
    const fp = buildNormalizationSnapshotFingerprint([
      { id: n0.id, normalizationIdentityFingerprint: n0.normalizationIdentityFingerprint },
    ]);

    const a = await openAppTx(doctor);
    const b = await openAppTx(doctor);
    try {
      const er = await a.query(
        `INSERT INTO clinical_fact_verification_events (
           organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
           source_channel, source_field, source_identity_fingerprint, content_fingerprint,
           normalization_snapshot_fingerprint, normalization_count, action, reason_code,
           authority_scope, decision_status, actor_id, actor_role, clinically_used
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,'ACCEPT_SOURCE_LINKED_FACT',
           'SOURCE_REPRESENTATION_REVIEWED','SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY','ACTIVE',
           $11,'Doctor',false
         ) RETURNING id`,
        [
          fact.organizationId,
          fact.clinicId,
          fact.patientId,
          fact.consultationId,
          fact.id,
          fact.sourceChannel,
          fact.sourceField,
          fact.sourceIdentityFingerprint,
          fact.contentFingerprint,
          fp,
          doctor.actorId,
        ],
      );
      const eid = String((er.rows[0] as { id: string }).id);
      await a.query(
        `INSERT INTO clinical_fact_verification_normalizations (
           verification_event_id, organization_id, clinic_id, fact_candidate_id,
           normalization_id, normalization_identity_fingerprint, snapshot_ordinal
         ) VALUES ($1,$2,$3,$4,$5,$6,0)`,
        [
          eid,
          fact.organizationId,
          fact.clinicId,
          fact.id,
          n0.id,
          n0.normalizationIdentityFingerprint,
        ],
      );
      await insertSyntheticNorm(
        b,
        doctor,
        fact,
        'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      );
      const settled = await Promise.allSettled([a.query('COMMIT'), b.query('COMMIT')]);
      expect(settled.filter((s) => s.status === 'fulfilled').length).toBe(1);
      expect(settled.filter((s) => s.status === 'rejected').length).toBe(1);
      const inv = await finalInvariant(doctor, fact.id);
      expect(inv.ok).toBe(true);
    } finally {
      try {
        await a.end();
      } catch {
        /* ignore */
      }
      try {
        await b.end();
      } catch {
        /* ignore */
      }
    }
  });

  it('READ COMMITTED: waiter sees holder commit after advisory wait', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const { fact } = await openChiefFact(doctor, 'skew vis xzy', 'vis');
    const lockKey = factVerificationSubjectLockKey(doctor.organizationId, doctor.clinicId, fact.id);

    const holder = await openAppTx(doctor);
    const waiter = await openAppTx(doctor);
    try {
      await holder.query(
        `SELECT ehas2_fact_verification_lock_subject($1::uuid,$2::uuid,$3::uuid)`,
        [doctor.organizationId, doctor.clinicId, fact.id],
      );
      await insertSyntheticNorm(
        waiter,
        doctor,
        fact,
        'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      );
      const commitWaiter = waiter.query('COMMIT');
      const sawWait = await waitForAdvisoryWaiter(10000);
      expect(sawWait).toBe(true);

      await insertEmptyVerification(holder, doctor, fact);
      await holder.query('COMMIT');

      await expect(commitWaiter).rejects.toSatisfy(isSnapshotFail);
      const inv = await finalInvariant(doctor, fact.id);
      expect(inv.ok).toBe(true);
      // Empty ACTIVE verification + no ACTIVE? Waiter rolled back its norm; holder has empty verification.
      const state = await withAdminClient(async (q) => {
        const v = await q(
          `SELECT normalization_count FROM clinical_fact_verification_events
           WHERE fact_candidate_id=$1 AND decision_status='ACTIVE'`,
          [fact.id],
        );
        const n = await q(
          `SELECT count(*)::int AS c FROM clinical_fact_normalizations
           WHERE source_fact_candidate_id=$1 AND decision_status='ACTIVE'`,
          [fact.id],
        );
        return {
          vCount: v.rows[0]
            ? Number((v.rows[0] as { normalization_count: number }).normalization_count)
            : null,
          norms: Number((n.rows[0] as { c: number }).c),
        };
      }, env);
      expect(state.vCount).toBe(0);
      expect(state.norms).toBe(0);
    } finally {
      try {
        await holder.end();
      } catch {
        /* ignore */
      }
      try {
        await waiter.end();
      } catch {
        /* ignore */
      }
    }
  });

  it('direct fact ACTIVE→SUPERSEDED with ACTIVE verification fails; lifecycle supersede-first passes', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const { fact } = await openChiefFact(doctor, 'skew fact xzy', 'fact');
    await verificationService.reviewSourceLinkedFact(
      doctor,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `skew-fact-v-${fact.id}`,
      },
      env,
    );

    const a = await openAppTx(doctor);
    try {
      await a.query(
        `UPDATE clinical_fact_candidates SET decision_status='SUPERSEDED'
         WHERE organization_id=$1 AND clinic_id=$2 AND id=$3 AND decision_status='ACTIVE'`,
        [doctor.organizationId, doctor.clinicId, fact.id],
      );
      await expect(a.query('COMMIT')).rejects.toSatisfy(isSnapshotFail);
    } finally {
      try {
        await a.end();
      } catch {
        /* ignore */
      }
    }

    await withTenantTransaction(
      doctor,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_fact_verification_events SET decision_status='SUPERSEDED'
           WHERE organization_id=$1 AND clinic_id=$2 AND fact_candidate_id=$3
             AND decision_status='ACTIVE'`,
          [doctor.organizationId, doctor.clinicId, fact.id],
        );
        await tx.query(
          `UPDATE clinical_fact_candidates SET decision_status='SUPERSEDED'
           WHERE organization_id=$1 AND clinic_id=$2 AND id=$3 AND decision_status='ACTIVE'`,
          [doctor.organizationId, doctor.clinicId, fact.id],
        );
      },
      env,
    );
    const activeV = await withTenantTransaction(
      doctor,
      async (tx) => verificationsRepo.findActiveByFactId(doctor, tx, fact.id),
      env,
    );
    expect(activeV).toBeNull();
  });

  it('norm ACTIVE→SUPERSEDED concurrent without verification supersession fails one side', async () => {
    requireDb();
    const doctor = await seedDoctor();
    const { fact } = await openChiefFact(doctor, 'denies fever', 'norm');
    const norm = await normService.materializeFactNormalizations(
      doctor,
      { sourceFactCandidateId: fact.id, idempotencyKey: `skew-n-norm-${fact.id}` },
      env,
    );
    expect(norm.normalizations.length).toBeGreaterThanOrEqual(1);
    const n0 = norm.normalizations[0]!;
    await verificationService.reviewSourceLinkedFact(
      doctor,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `skew-n-v-${fact.id}`,
      },
      env,
    );

    const a = await openAppTx(doctor);
    try {
      await a.query(
        `UPDATE clinical_fact_normalizations SET decision_status='SUPERSEDED'
         WHERE organization_id=$1 AND clinic_id=$2 AND id=$3 AND decision_status='ACTIVE'`,
        [doctor.organizationId, doctor.clinicId, n0.id],
      );
      await expect(a.query('COMMIT')).rejects.toSatisfy(isSnapshotFail);
      const activeV = await withTenantTransaction(
        doctor,
        async (tx) => verificationsRepo.findActiveByFactId(doctor, tx, fact.id),
        env,
      );
      expect(activeV).not.toBeNull();
    } finally {
      try {
        await a.end();
      } catch {
        /* ignore */
      }
    }

    // Legitimate same-tx: supersede verification then norm
    await withTenantTransaction(
      doctor,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_fact_verification_events SET decision_status='SUPERSEDED'
           WHERE organization_id=$1 AND clinic_id=$2 AND fact_candidate_id=$3
             AND decision_status='ACTIVE'`,
          [doctor.organizationId, doctor.clinicId, fact.id],
        );
        await tx.query(
          `UPDATE clinical_fact_normalizations SET decision_status='SUPERSEDED'
           WHERE organization_id=$1 AND clinic_id=$2 AND id=$3 AND decision_status='ACTIVE'`,
          [doctor.organizationId, doctor.clinicId, n0.id],
        );
      },
      env,
    );
    const after = await withTenantTransaction(
      doctor,
      async (tx) => verificationsRepo.findActiveByFactId(doctor, tx, fact.id),
      env,
    );
    expect(after).toBeNull();
  });
});
