import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConsultationIntakeService,
  ConsultationService,
  EMPTY_FACT_VERIFICATION_SNAPSHOT_FINGERPRINT,
  EvidenceService,
  FactCandidateService,
  FactConflictError,
  FactNormalizationService,
  FactVerificationService,
  PatientService,
  PgFactCandidateRepository,
  PgFactVerificationRepository,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ValidationError,
  buildNormalizationSnapshotFingerprint,
  closePool,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import { DeterministicFakeExtractor } from '../../packages/evidence-extract/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2d5_snap_test');
const factEnv = {
  ...env,
  EHAS2_F3D_FACT_CANDIDATES: '1',
  EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
  EHAS2_F3C_CANDIDATE_REVIEW: '1',
};
let dbReady = false;
const store = new MemoryFakeObjectStore();

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const factsRepo = new PgFactCandidateRepository();
const verificationsRepo = new PgFactVerificationRepository();
const normService = new FactNormalizationService();
const verificationService = new FactVerificationService({ onSafeMetric: recordEvidenceEvent });

function evidenceService(): EvidenceService {
  return new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner('CLEAN'),
    rateLimiter: new MemoryRateLimiter(),
    extractor: new DeterministicFakeExtractor(),
  });
}

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

const EMPTY_FP = EMPTY_FACT_VERIFICATION_SNAPSHOT_FINGERPRINT;
const BAD_FP = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

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
  resetMemoryFakeObjectStore();
  await resetDatabaseSchema(env);
  await migrateUp(env);
}, 120_000);

afterAll(async () => {
  if (dbReady) await closePool();
});

function requireDb(): void {
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2D5 snapshot binding tests');
  }
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

function isSnapshotCommitFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /FACT_VERIFICATION_SNAPSHOT_INVALID/i.test(msg);
}

function isRejectedConstraint(err: unknown): boolean {
  if (isSnapshotCommitFailure(err)) return true;
  const code = (err as { code?: string } | null)?.code;
  if (code === '23503' || code === '23505' || code === '23514') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /foreign key|unique|check constraint|FACT_VERIFICATION_SNAPSHOT_INVALID/i.test(msg);
}

async function seedTenants(): Promise<{ doctorA: TenantContext; doctorB: TenantContext }> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2D5 Snap Doctor A',
        actorId: '00000000-0000-4000-8000-0000000005e1',
      },
    );
    const oA = await orgs.create(
      { query },
      { name: 'Synthetic F3D2D5 Snap Org A', actorId: uA.id },
    );
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic F3D2D5 Snap Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic F3D2D5 Snap Doctor B',
        actorId: '00000000-0000-4000-8000-0000000005e2',
      },
    );
    const oB = await orgs.create(
      { query },
      { name: 'Synthetic F3D2D5 Snap Org B', actorId: uB.id },
    );
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic F3D2D5 Snap Clinic B', actorId: uB.id },
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
    {
      chiefComplaintText: chief,
      idempotencyKey: `d5-snap-patch-${label}-${consultation.id}`,
    },
    env,
  );
  const fact = await factService().materialize(
    doctor,
    consultation.id,
    {
      sourceChannel: 'DOCTOR_DECLARED',
      sourceField: 'CHIEF_COMPLAINT',
      idempotencyKey: `d5-snap-fact-${label}-${consultation.id}`,
    },
    factEnv,
  );
  return { patient, consultation, fact };
}

async function insertSyntheticNorm(
  doctor: TenantContext,
  factId: string,
  identityFp: string,
): Promise<string> {
  return withTenantTransaction(
    doctor,
    async (tx) => {
      const parent = await factsRepo.findById(doctor, tx, factId);
      if (!parent) throw new Error('missing parent');
      const r = await tx.query(
        `INSERT INTO clinical_fact_normalizations (
           organization_id, clinic_id, patient_id, consultation_id, source_fact_candidate_id,
           source_identity_fingerprint, normalization_identity_fingerprint,
           source_channel, source_field, normalization_kind, canonical_label,
           cue_entry_ids, pack_id, pack_version, pack_content_checksum,
           parser_version, parser_fingerprint, normalizer_method, normalizer_version,
           normalizer_fingerprint, authority_scope, decision_status, limitation_codes,
           clinically_used, actor_id, actor_role
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,'NEGATION_CUE','synthetic-norm',
           ARRAY[]::text[],'pack','1.0',$10,'parser-v1',$10,
           'OWNER_FROZEN_SOURCE_PRESERVING_V1','1',$10,
           'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE','{}'::text[],false,$11,'Doctor'
         ) RETURNING id`,
        [
          parent.organizationId,
          parent.clinicId,
          parent.patientId,
          parent.consultationId,
          parent.id,
          parent.sourceIdentityFingerprint,
          identityFp,
          parent.sourceChannel,
          parent.sourceField,
          BAD_FP,
          doctor.actorId,
        ],
      );
      return String((r.rows[0] as { id: string }).id);
    },
    env,
  );
}

describe('F3D-2D5 snapshot DB binding (deferred constraints)', () => {
  it('TS fingerprint matches SQL for empty / one / multi / order-invariant', async () => {
    requireDb();
    const emptyTs = buildNormalizationSnapshotFingerprint([]);
    expect(emptyTs).toBe(EMPTY_FP);
    const sqlEmpty = await withAdminClient(async (query) => {
      const r = await query(`SELECT encode(digest(''::bytea, 'sha256'), 'hex') AS fp`);
      return String((r.rows[0] as { fp: string }).fp);
    }, env);
    expect(sqlEmpty).toBe(EMPTY_FP);

    const a = '11111111-1111-4111-8111-111111111111';
    const b = '22222222-2222-4222-8222-222222222222';
    const fpA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const fpB = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const multi = buildNormalizationSnapshotFingerprint([
      { id: b, normalizationIdentityFingerprint: fpB },
      { id: a, normalizationIdentityFingerprint: fpA },
    ]);
    const multi2 = buildNormalizationSnapshotFingerprint([
      { id: a, normalizationIdentityFingerprint: fpA },
      { id: b, normalizationIdentityFingerprint: fpB },
      { id: a, normalizationIdentityFingerprint: fpA },
    ]);
    expect(multi).toBe(multi2);

    const sqlMulti = await withAdminClient(async (query) => {
      const r = await query(
        `SELECT encode(
           digest(
             lower($1::text) || ':' || lower($2::text) || E'\\n' ||
             lower($3::text) || ':' || lower($4::text),
             'sha256'
           ),
           'hex'
         ) AS fp`,
        [a, fpA, b, fpB],
      );
      return String((r.rows[0] as { fp: string }).fp);
    }, env);
    expect(sqlMulti).toBe(multi);
  });

  it('valid: zero / one / multi ACTIVE norms commit; historical SUPERSEDED snapshot readable', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const zero = await openChiefFact(doctorA, 'no cue match xzy', 'zero');
    const zeroEvent = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: zero.fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `snap-zero-${zero.fact.id}`,
      },
      env,
    );
    expect(zeroEvent.normalizationCount).toBe(0);
    expect(zeroEvent.normalizationSnapshotFingerprint).toBe(EMPTY_FP);

    const one = await openChiefFact(doctorA, 'denies fever', 'one');
    const oneNorm = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: one.fact.id, idempotencyKey: `snap-one-norm-${one.fact.id}` },
      env,
    );
    expect(oneNorm.reason).toBe('NORMALIZED');
    expect(oneNorm.normalizations.length).toBeGreaterThanOrEqual(1);
    const oneEvent = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: one.fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `snap-one-${one.fact.id}`,
      },
      env,
    );
    expect(oneEvent.normalizationCount).toBe(oneNorm.normalizations.length);
    const expectedFp = buildNormalizationSnapshotFingerprint(
      oneNorm.normalizations.map((n) => ({
        id: n.id,
        normalizationIdentityFingerprint: n.normalizationIdentityFingerprint,
      })),
    );
    expect(oneEvent.normalizationSnapshotFingerprint).toBe(expectedFp);
    const sqlFp = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT ehas2_fact_verification_snapshot_fingerprint($1::uuid) AS fp`,
          [oneEvent.id],
        );
        return String((r.rows[0] as { fp: string }).fp);
      },
      env,
    );
    expect(sqlFp).toBe(expectedFp);

    const kids = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.listSnapshotByEventId(doctorA, tx, oneEvent.id),
      env,
    );
    expect(kids).toHaveLength(oneEvent.normalizationCount);

    const superseded = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: one.fact.id,
        action: 'MARK_UNRESOLVED',
        reasonCode: 'INSUFFICIENT_SOURCE_CONTEXT',
        supersedesVerificationId: oneEvent.id,
        idempotencyKey: `snap-one-unres-${one.fact.id}`,
      },
      env,
    );
    expect(superseded.decisionStatus).toBe('ACTIVE');
    const hist = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.listSnapshotByEventId(doctorA, tx, oneEvent.id),
      env,
    );
    expect(hist).toHaveLength(oneEvent.normalizationCount);
  });

  it('inserting ACTIVE norm while ACTIVE verification exists fails at COMMIT', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { fact } = await openChiefFact(doctorA, 'denies fever', 'norm-after');
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact.id, idempotencyKey: `snap-na-norm-${fact.id}` },
      env,
    );
    await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `snap-na-v-${fact.id}`,
      },
      env,
    );
    await expect(
      insertSyntheticNorm(
        doctorA,
        fact.id,
        'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      ),
    ).rejects.toSatisfy(isSnapshotCommitFailure);
  });

  it('direct-SQL invalid commits 1–15', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const base = await openChiefFact(doctorA, 'denies fever', 'sql-inv');
    const norm = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: base.fact.id, idempotencyKey: `sql-inv-norm-${base.fact.id}` },
      env,
    );
    expect(norm.normalizations.length).toBeGreaterThanOrEqual(1);
    const n0 = norm.normalizations[0]!;
    const parent = base.fact;

    async function badEventCommit(
      mut: (tx: {
        query: <R = unknown>(
          sql: string,
          params?: unknown[],
        ) => Promise<{ rows: R[]; rowCount: number }>;
      }) => Promise<void>,
    ) {
      await expect(
        withTenantTransaction(
          doctorA,
          async (tx) => {
            await mut(tx);
          },
          env,
        ),
      ).rejects.toSatisfy(isSnapshotCommitFailure);
    }

    // 1) count=1, zero children
    await badEventCommit(async (tx) => {
      await tx.query(
        `INSERT INTO clinical_fact_verification_events (
           organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
           source_channel, source_field, source_identity_fingerprint, content_fingerprint,
           normalization_snapshot_fingerprint, normalization_count, action, reason_code,
           authority_scope, decision_status, actor_id, actor_role, clinically_used
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,'ACCEPT_SOURCE_LINKED_FACT',
           'SOURCE_REPRESENTATION_REVIEWED','SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY','ACTIVE',
           $11,'Doctor',false
         )`,
        [
          parent.organizationId,
          parent.clinicId,
          parent.patientId,
          parent.consultationId,
          parent.id,
          parent.sourceChannel,
          parent.sourceField,
          parent.sourceIdentityFingerprint,
          parent.contentFingerprint,
          EMPTY_FP,
          doctorA.actorId,
        ],
      );
    });

    // 2) count=0, one child
    await badEventCommit(async (tx) => {
      const er = await tx.query(
        `INSERT INTO clinical_fact_verification_events (
           organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
           source_channel, source_field, source_identity_fingerprint, content_fingerprint,
           normalization_snapshot_fingerprint, normalization_count, action, reason_code,
           authority_scope, decision_status, actor_id, actor_role, clinically_used
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,'ACCEPT_SOURCE_LINKED_FACT',
           'SOURCE_REPRESENTATION_REVIEWED','SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY','ACTIVE',
           $11,'Doctor',false
         ) RETURNING id`,
        [
          parent.organizationId,
          parent.clinicId,
          parent.patientId,
          parent.consultationId,
          parent.id,
          parent.sourceChannel,
          parent.sourceField,
          parent.sourceIdentityFingerprint,
          parent.contentFingerprint,
          EMPTY_FP,
          doctorA.actorId,
        ],
      );
      const eid = String((er.rows[0] as { id: string }).id);
      await tx.query(
        `INSERT INTO clinical_fact_verification_normalizations (
           verification_event_id, organization_id, clinic_id, fact_candidate_id,
           normalization_id, normalization_identity_fingerprint, snapshot_ordinal
         ) VALUES ($1,$2,$3,$4,$5,$6,0)`,
        [
          eid,
          parent.organizationId,
          parent.clinicId,
          parent.id,
          n0.id,
          n0.normalizationIdentityFingerprint,
        ],
      );
    });

    // 3) correct count, wrong fingerprint
    await badEventCommit(async (tx) => {
      const er = await tx.query(
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
          parent.organizationId,
          parent.clinicId,
          parent.patientId,
          parent.consultationId,
          parent.id,
          parent.sourceChannel,
          parent.sourceField,
          parent.sourceIdentityFingerprint,
          parent.contentFingerprint,
          BAD_FP,
          doctorA.actorId,
        ],
      );
      const eid = String((er.rows[0] as { id: string }).id);
      await tx.query(
        `INSERT INTO clinical_fact_verification_normalizations (
           verification_event_id, organization_id, clinic_id, fact_candidate_id,
           normalization_id, normalization_identity_fingerprint, snapshot_ordinal
         ) VALUES ($1,$2,$3,$4,$5,$6,0)`,
        [
          eid,
          parent.organizationId,
          parent.clinicId,
          parent.id,
          n0.id,
          n0.normalizationIdentityFingerprint,
        ],
      );
    });

    // Legitimate verify for later mutation tests
    const good = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: parent.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `sql-inv-good-${parent.id}`,
      },
      env,
    );

    // 9) append extra child in later transaction
    const idFpExtra = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    // Need another ACTIVE? Can't insert without failing. Use SUPERSEDED norm as child — fails ACTIVE check.
    // Create second fact's norm and try attach to this event.
    const other = await openChiefFact(doctorA, 'denies cough', 'sql-other');
    const otherNorm = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: other.fact.id, idempotencyKey: `sql-other-norm-${other.fact.id}` },
      env,
    );
    const on0 = otherNorm.normalizations[0];
    if (!on0) throw new Error('expected other norm');

    // 5/6) extra child / foreign fact child
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await tx.query(
            `INSERT INTO clinical_fact_verification_normalizations (
               verification_event_id, organization_id, clinic_id, fact_candidate_id,
               normalization_id, normalization_identity_fingerprint, snapshot_ordinal
             ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              good.id,
              parent.organizationId,
              parent.clinicId,
              parent.id,
              on0.id,
              on0.normalizationIdentityFingerprint,
              good.normalizationCount,
            ],
          );
        },
        env,
      ),
    ).rejects.toSatisfy(isRejectedConstraint);

    // 7) child from another tenant — FK/tenant should fail
    await expect(
      withTenantTransaction(
        doctorB,
        async (tx) => {
          await tx.query(
            `INSERT INTO clinical_fact_verification_normalizations (
               verification_event_id, organization_id, clinic_id, fact_candidate_id,
               normalization_id, normalization_identity_fingerprint, snapshot_ordinal
             ) VALUES ($1,$2,$3,$4,$5,$6,0)`,
            [
              good.id,
              doctorB.organizationId,
              doctorB.clinicId,
              parent.id,
              n0.id,
              n0.normalizationIdentityFingerprint,
            ],
          );
        },
        env,
      ),
    ).rejects.toBeTruthy();

    // 11) supersede snapshotted normalization while verification ACTIVE
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await tx.query(
            `UPDATE clinical_fact_normalizations
             SET decision_status = 'SUPERSEDED'
             WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
               AND decision_status = 'ACTIVE'`,
            [doctorA.organizationId, doctorA.clinicId, n0.id],
          );
        },
        env,
      ),
    ).rejects.toSatisfy(isSnapshotCommitFailure);

    // 12) supersede parent fact while verification ACTIVE
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await tx.query(
            `UPDATE clinical_fact_candidates
             SET decision_status = 'SUPERSEDED'
             WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
               AND decision_status = 'ACTIVE'`,
            [doctorA.organizationId, doctorA.clinicId, parent.id],
          );
        },
        env,
      ),
    ).rejects.toSatisfy(isSnapshotCommitFailure);

    // 14) duplicate child
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await tx.query(
            `INSERT INTO clinical_fact_verification_normalizations (
               verification_event_id, organization_id, clinic_id, fact_candidate_id,
               normalization_id, normalization_identity_fingerprint, snapshot_ordinal
             ) VALUES ($1,$2,$3,$4,$5,$6,1)`,
            [
              good.id,
              parent.organizationId,
              parent.clinicId,
              parent.id,
              n0.id,
              n0.normalizationIdentityFingerprint,
            ],
          );
        },
        env,
      ),
    ).rejects.toBeTruthy();

    // 15) add child to SUPERSEDED verification
    const replaced = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: parent.id,
        action: 'REJECT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_INACCURATE',
        supersedesVerificationId: good.id,
        idempotencyKey: `sql-inv-rej-${parent.id}`,
      },
      env,
    );
    expect(replaced.decisionStatus).toBe('ACTIVE');
    const superseded = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.findById(doctorA, tx, good.id),
      env,
    );
    expect(superseded?.decisionStatus).toBe('SUPERSEDED');
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await tx.query(
            `INSERT INTO clinical_fact_verification_normalizations (
               verification_event_id, organization_id, clinic_id, fact_candidate_id,
               normalization_id, normalization_identity_fingerprint, snapshot_ordinal
             ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              good.id,
              parent.organizationId,
              parent.clinicId,
              parent.id,
              n0.id,
              n0.normalizationIdentityFingerprint,
              Math.min(good.normalizationCount, 31),
            ],
          );
        },
        env,
      ),
    ).rejects.toSatisfy(isRejectedConstraint);

    // Historical SUPERSEDED snapshot remains readable
    const kids = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.listSnapshotByEventId(doctorA, tx, good.id),
      env,
    );
    expect(kids.length).toBe(good.normalizationCount);

    // Valid lifecycle: supersede verification then fact in same txn
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_fact_verification_events
           SET decision_status = 'SUPERSEDED'
           WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
             AND decision_status = 'ACTIVE'`,
          [doctorA.organizationId, doctorA.clinicId, replaced.id],
        );
        await tx.query(
          `UPDATE clinical_fact_candidates
           SET decision_status = 'SUPERSEDED'
           WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
             AND decision_status = 'ACTIVE'`,
          [doctorA.organizationId, doctorA.clinicId, parent.id],
        );
      },
      env,
    );

    void idFpExtra;
  });

  it('D3 empty→nonempty supersedes ACTIVE verification then inserts norm', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { consultation, fact } = await openChiefFact(doctorA, 'zzzz no match', 'd3-empty');
    const emptyNorm = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact.id, idempotencyKey: `d3e-norm0-${fact.id}` },
      env,
    );
    expect(emptyNorm.reason).toBe('NO_MATCHES');
    const v0 = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d3e-v0-${fact.id}`,
      },
      env,
    );
    expect(v0.normalizationCount).toBe(0);
    await intake.patch(
      doctorA,
      consultation.id,
      {
        chiefComplaintText: 'denies fever',
        idempotencyKey: `d3e-patch-${consultation.id}`,
      },
      env,
    );
    // chief edit supersedes fact+verification; rematerialize
    const fact2 = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: `d3e-fact2-${consultation.id}`,
      },
      factEnv,
    );
    const n2 = await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact2.id, idempotencyKey: `d3e-norm2-${fact2.id}` },
      env,
    );
    expect(n2.reason).toBe('NORMALIZED');
    const prior = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.findById(doctorA, tx, v0.id),
      env,
    );
    expect(prior?.decisionStatus).toBe('SUPERSEDED');
  });

  it('ACCEPT vs REJECT concurrency → exactly one ACTIVE', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { fact } = await openChiefFact(doctorA, 'denies fever', 'race');
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact.id, idempotencyKey: `race-norm-${fact.id}` },
      env,
    );
    const settled = await Promise.allSettled([
      verificationService.reviewSourceLinkedFact(
        doctorA,
        {
          factCandidateId: fact.id,
          action: 'ACCEPT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
          idempotencyKey: `race-accept-${fact.id}`,
        },
        env,
      ),
      verificationService.reviewSourceLinkedFact(
        doctorA,
        {
          factCandidateId: fact.id,
          action: 'REJECT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_INACCURATE',
          idempotencyKey: `race-reject-${fact.id}`,
        },
        env,
      ),
    ]);
    const ok = settled.filter((s) => s.status === 'fulfilled');
    const bad = settled.filter((s) => s.status === 'rejected');
    expect(ok.length).toBe(1);
    expect(bad.length).toBe(1);
    expect(bad[0]?.status === 'rejected' && bad[0].reason).toBeInstanceOf(FactConflictError);
    const active = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.findActiveByFactId(doctorA, tx, fact.id),
      env,
    );
    expect(active).not.toBeNull();
  });

  it('F3C ACCEPT/CORRECT eligible; REJECT forbidden; review replacement supersedes D5', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const patient = await patients.create(
      doctorA,
      { displayName: 'Synthetic F3C D5', dateOfBirth: '1980-01-15' },
      {},
      env,
    );
    const consultation = await consultations.create(
      doctorA,
      { patientId: patient.id, chiefComplaintText: 'synthetic f3c d5' },
      env,
    );
    const item = await evidenceService().initiate(
      doctorA,
      {
        consultationId: consultation.id,
        evidenceType: 'BLOOD_REPORT',
        sourceType: 'DOCTOR_UPLOAD',
        filename: 'lab.png',
        declaredMime: 'image/png',
      },
      env,
    );
    await evidenceService().receiveBytes(doctorA, consultation.id, item.id, PNG, env);
    await evidenceService().enqueueExtractCandidates(doctorA, item.id, new Date(), factEnv);
    await evidenceService().runDueJobs(doctorA, 'ehas2-f3d2d5-snap-worker', new Date(), factEnv);
    const candidates = await evidenceService().listExtractionCandidates(doctorA, item.id, factEnv);
    const english = candidates.find((c) => c.rawText === 'Hemoglobin');
    if (!english?.id) throw new Error('BLOCKED: missing Hemoglobin candidate');

    const accept = await evidenceService().submitCandidateReview(
      doctorA,
      consultation.id,
      item.id,
      english.id,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `d5-f3c-accept-${english.id}`,
      },
      factEnv,
    );
    const fact = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: item.id,
        candidateId: english.id,
        idempotencyKey: `d5-f3c-fact-${english.id}`,
      },
      factEnv,
    );
    const vAccept = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d5-f3c-v-${fact.id}`,
      },
      factEnv,
    );
    expect(vAccept.decisionStatus).toBe('ACTIVE');

    const correct = await evidenceService().submitCandidateReview(
      doctorA,
      consultation.id,
      item.id,
      english.id,
      {
        action: 'CORRECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_MISREAD',
        correctedRawText: 'denies fever',
        supersedesReviewId: accept.id,
        idempotencyKey: `d5-f3c-correct-${english.id}`,
      },
      factEnv,
    );
    expect(correct.decisionStatus).toBe('ACTIVE');
    const after = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.findById(doctorA, tx, vAccept.id),
      factEnv,
    );
    expect(after?.decisionStatus).toBe('SUPERSEDED');

    const fact2 = await factService().materialize(
      doctorA,
      consultation.id,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: item.id,
        candidateId: english.id,
        idempotencyKey: `d5-f3c-fact2-${english.id}`,
      },
      factEnv,
    );
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact2.id, idempotencyKey: `d5-f3c-norm2-${fact2.id}` },
      factEnv,
    );
    const vCorrect = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact2.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `d5-f3c-v2-${fact2.id}`,
      },
      factEnv,
    );
    expect(vCorrect.decisionStatus).toBe('ACTIVE');

    await expect(
      verificationService.reviewSourceLinkedFact(
        doctorA,
        {
          factCandidateId: fact.id,
          action: 'ACCEPT_SOURCE_LINKED_FACT',
          reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
          idempotencyKey: `d5-f3c-stale-${fact.id}`,
        },
        factEnv,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rollback leaves prior ACTIVE verification unchanged', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const { fact } = await openChiefFact(doctorA, 'denies fever', 'rb');
    await normService.materializeFactNormalizations(
      doctorA,
      { sourceFactCandidateId: fact.id, idempotencyKey: `rb-norm-${fact.id}` },
      env,
    );
    const v = await verificationService.reviewSourceLinkedFact(
      doctorA,
      {
        factCandidateId: fact.id,
        action: 'ACCEPT_SOURCE_LINKED_FACT',
        reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
        idempotencyKey: `rb-v-${fact.id}`,
      },
      env,
    );
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await tx.query(
            `UPDATE clinical_fact_verification_events
             SET decision_status = 'SUPERSEDED'
             WHERE id = $1 AND decision_status = 'ACTIVE'`,
            [v.id],
          );
          throw new Error('FORCE_ROLLBACK');
        },
        env,
      ),
    ).rejects.toThrow(/FORCE_ROLLBACK/);
    const still = await withTenantTransaction(
      doctorA,
      async (tx) => verificationsRepo.findById(doctorA, tx, v.id),
      env,
    );
    expect(still?.decisionStatus).toBe('ACTIVE');
  });
});
