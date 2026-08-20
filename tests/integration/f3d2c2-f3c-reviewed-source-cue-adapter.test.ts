import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  EvidenceService,
  PatientService,
  ConsultationService,
  closePool,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ResourceNotFoundError,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  F3cReviewedCueSourceService,
  bindF3cReviewedSourceIdentity,
} from '../../packages/database/src/services/f3cReviewedCueSourceService.ts';
import {
  f3cReviewedCueSourceLockKey,
  lockF3cReviewedCueSource,
} from '../../packages/database/src/services/cueSourceLock.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import {
  DeterministicFakeExtractor,
  loadPinnedProductionPack,
} from '../../packages/evidence-extract/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3c_test');
const extractEnv = {
  ...env,
  EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
  EHAS2_F3C_CANDIDATE_REVIEW: '1',
};
let dbReady = false;
resetMemoryFakeObjectStore();
const store = new MemoryFakeObjectStore();
const patients = new PatientService();
const consultations = new ConsultationService();
const cues = new F3cReviewedCueSourceService();

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

beforeAll(async () => {
  Object.assign(process.env, extractEnv);
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
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2C2 reviewed-source tests');
  }
}

function evidenceService(): EvidenceService {
  return new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner('CLEAN'),
    rateLimiter: new MemoryRateLimiter(),
    extractor: new DeterministicFakeExtractor(),
  });
}

async function seedTenants(): Promise<{
  doctorA: TenantContext;
  doctorB: TenantContext;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic C2 Doctor A',
        actorId: '00000000-0000-4000-8000-0000000002c1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic C2 Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic C2 Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic C2 Doctor B',
        actorId: '00000000-0000-4000-8000-0000000002c2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic C2 Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic C2 Clinic B', actorId: uB.id },
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

async function storedExtracted(
  tenant: TenantContext,
  service: EvidenceService,
): Promise<{
  itemId: string;
  consultationId: string;
  patientId: string;
  englishId: string;
  hindiId: string;
}> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic C2 Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'synthetic c2 fixture' },
    env,
  );
  const item = await service.initiate(
    tenant,
    {
      consultationId: consultation.id,
      evidenceType: 'BLOOD_REPORT',
      sourceType: 'DOCTOR_UPLOAD',
      filename: 'lab.png',
      declaredMime: 'image/png',
    },
    env,
  );
  await service.receiveBytes(tenant, consultation.id, item.id, PNG, env);
  await service.enqueueExtractCandidates(tenant, item.id, new Date(), extractEnv);
  await service.runDueJobs(tenant, 'ehas2-f3d2c2-worker', new Date(), extractEnv);
  const candidates = await service.listExtractionCandidates(tenant, item.id, extractEnv);
  const english = candidates.find((c) => c.rawText === 'Hemoglobin');
  const hindi = candidates.find((c) => c.rawText === 'हीमोग्लोबिन');
  if (!english?.id || !hindi?.id) {
    throw new Error('BLOCKED: expected synthetic English and Hindi candidates');
  }
  return {
    itemId: item.id,
    consultationId: consultation.id,
    patientId: patient.id,
    englishId: english.id,
    hindiId: hindi.id,
  };
}

type CountRow = {
  reviews: number;
  extract_cands: number;
  facts: number;
  findings: number;
  audits: number;
  evidence: number;
  consults: number;
};

async function snapshot(tenant: TenantContext): Promise<CountRow> {
  return withAdminClient(async (query) => {
    const r = await query(
      `SELECT
         (SELECT count(*)::int FROM clinical_evidence_extraction_candidate_reviews
           WHERE organization_id = $1 AND clinic_id = $2) AS reviews,
         (SELECT count(*)::int FROM clinical_evidence_extraction_candidates
           WHERE organization_id = $1 AND clinic_id = $2) AS extract_cands,
         (SELECT count(*)::int FROM clinical_fact_candidates
           WHERE organization_id = $1 AND clinic_id = $2) AS facts,
         (SELECT count(*)::int FROM structured_report_findings
           WHERE organization_id = $1 AND clinic_id = $2) AS findings,
         (SELECT count(*)::int FROM audit_events
           WHERE organization_id = $1 AND clinic_id = $2) AS audits,
         (SELECT count(*)::int FROM clinical_evidence_items
           WHERE organization_id = $1 AND clinic_id = $2) AS evidence,
         (SELECT count(*)::int FROM consultations
           WHERE organization_id = $1 AND clinic_id = $2) AS consults`,
      [tenant.organizationId, tenant.clinicId],
    );
    return r.rows[0] as CountRow;
  }, env);
}

async function assertReviewedLockHeld(tenant: TenantContext, candidateId: string): Promise<void> {
  const key = f3cReviewedCueSourceLockKey({
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    candidateId,
  });
  await withTenantTransaction(
    tenant,
    async (tx) => {
      const r = await tx.query<{ ok: boolean }>(
        `SELECT pg_try_advisory_xact_lock(hashtextextended($1::text, $2::bigint)) AS ok`,
        [key, 0],
      );
      expect(r.rows[0]?.ok).toBe(false);
    },
    env,
  );
}

async function holdReviewedLock(
  tenant: TenantContext,
  candidateId: string,
): Promise<{ release: () => void; held: Promise<void> }> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let signalAcquired!: () => void;
  const acquired = new Promise<void>((resolve) => {
    signalAcquired = resolve;
  });
  const held = withTenantTransaction(
    tenant,
    async (tx) => {
      await lockF3cReviewedCueSource(tx, tenant, candidateId);
      signalAcquired();
      await gate;
    },
    env,
  );
  await acquired;
  return { release, held };
}

function expectedFingerprint(input: {
  tenant: TenantContext;
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  extractionRunId: string;
  candidateId: string;
  reviewEventId: string;
  reviewAction: 'ACCEPT_AS_SOURCE_TEXT' | 'CORRECT_SOURCE_TEXT';
  exactEffectiveText: string;
  sourceLocator: {
    page: number;
    blockIndex?: number;
    bbox?: { x: number; y: number; w: number; h: number };
  };
}): string {
  const pack = loadPinnedProductionPack();
  return bindF3cReviewedSourceIdentity({
    organizationId: input.tenant.organizationId,
    clinicId: input.tenant.clinicId,
    patientId: input.patientId,
    consultationId: input.consultationId,
    evidenceItemId: input.evidenceItemId,
    extractionRunId: input.extractionRunId,
    candidateId: input.candidateId,
    reviewEventId: input.reviewEventId,
    reviewAction: input.reviewAction,
    exactEffectiveText: input.exactEffectiveText,
    sourceLocator: input.sourceLocator,
    packId: pack.packId,
    packVersion: pack.packVersion,
    packContentChecksum: pack.contentChecksum,
  });
}

describe('F3D-2C2 F3C reviewed-source cue adapter (isolated PostgreSQL)', () => {
  it('ACTIVE ACCEPT parses original_raw_text; CORRECT parses corrected_raw_text only', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const fixture = await storedExtracted(doctorA, service);

    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: fixture.itemId,
          candidateId: fixture.englishId,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const accept = await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c2-accept-${fixture.englishId}`,
      },
      extractEnv,
    );
    expect(accept.originalRawText).toBe('Hemoglobin');

    const accepted = await cues.parseF3cReviewedSourceCues(
      doctorA,
      {
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        candidateId: fixture.englishId,
      },
      env,
    );
    expect(accepted.reviewAction).toBe('ACCEPT_AS_SOURCE_TEXT');
    expect(accepted.sourceChannel).toBe('REVIEWED_REPORT_TEXT');
    expect(accepted.sourceField).toBe('REVIEWED_EXTRACTION_CANDIDATE');
    expect(accepted.parser.ok).toBe(true);
    expect(accepted.sourceIdentityFingerprint).toBe(
      expectedFingerprint({
        tenant: doctorA,
        patientId: fixture.patientId,
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        extractionRunId: accept.extractionRunId,
        candidateId: fixture.englishId,
        reviewEventId: accept.id,
        reviewAction: 'ACCEPT_AS_SOURCE_TEXT',
        exactEffectiveText: 'Hemoglobin',
        sourceLocator: accept.sourceLocator,
      }),
    );

    const correct = await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'CORRECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_MISREAD',
        correctedRawText: 'denies fever',
        supersedesReviewId: accept.id,
        idempotencyKey: `c2-correct-${fixture.englishId}`,
      },
      extractEnv,
    );
    expect(correct.correctedRawText).toBe('denies fever');
    expect(correct.originalRawText).toBe('Hemoglobin');

    const corrected = await cues.parseF3cReviewedSourceCues(
      doctorA,
      {
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        candidateId: fixture.englishId,
      },
      env,
    );
    expect(corrected.reviewAction).toBe('CORRECT_SOURCE_TEXT');
    expect(corrected.reviewEventId).toBe(correct.id);
    expect(corrected.parser.ok).toBe(true);
    if (!corrected.parser.ok) return;
    expect(corrected.parser.matches.some((m) => m.originalSourceSpan === 'denies')).toBe(true);
    expect(corrected.parser.matches.every((m) => !/Hemoglobin/i.test(m.originalSourceSpan))).toBe(
      true,
    );
    expect(corrected.sourceIdentityFingerprint).toBe(
      expectedFingerprint({
        tenant: doctorA,
        patientId: fixture.patientId,
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        extractionRunId: correct.extractionRunId,
        candidateId: fixture.englishId,
        reviewEventId: correct.id,
        reviewAction: 'CORRECT_SOURCE_TEXT',
        exactEffectiveText: 'denies fever',
        sourceLocator: correct.sourceLocator,
      }),
    );
    expect(corrected.sourceIdentityFingerprint).not.toBe(accepted.sourceIdentityFingerprint);
  });

  it('REJECT, UNRESOLVED, SUPERSEDED review/candidate, and blank effective text fail closed', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const fixture = await storedExtracted(doctorA, service);

    const reject = await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'REJECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_NOT_PRESENT',
        idempotencyKey: `c2-reject-${fixture.englishId}`,
      },
      extractEnv,
    );
    expect(reject.action).toBe('REJECT_SOURCE_TEXT');
    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: fixture.itemId,
          candidateId: fixture.englishId,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const unresolvedCand = fixture.hindiId;
    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      unresolvedCand,
      {
        action: 'MARK_UNRESOLVED',
        reasonCode: 'SOURCE_TEXT_UNCERTAIN',
        idempotencyKey: `c2-unresolved-${unresolvedCand}`,
      },
      extractEnv,
    );
    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: fixture.itemId,
          candidateId: unresolvedCand,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const fixture2 = await storedExtracted(doctorA, service);
    const accept = await service.submitCandidateReview(
      doctorA,
      fixture2.consultationId,
      fixture2.itemId,
      fixture2.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c2-accept2-${fixture2.englishId}`,
      },
      extractEnv,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_evidence_extraction_candidate_reviews
           SET decision_status = 'SUPERSEDED'
           WHERE id = $1`,
          [accept.id],
        );
      },
      env,
    );
    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture2.consultationId,
          evidenceItemId: fixture2.itemId,
          candidateId: fixture2.englishId,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const fixture3 = await storedExtracted(doctorA, service);
    await service.submitCandidateReview(
      doctorA,
      fixture3.consultationId,
      fixture3.itemId,
      fixture3.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c2-accept3-${fixture3.englishId}`,
      },
      extractEnv,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_evidence_extraction_candidates SET status = 'SUPERSEDED' WHERE id = $1`,
          [fixture3.englishId],
        );
      },
      env,
    );
    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture3.consultationId,
          evidenceItemId: fixture3.itemId,
          candidateId: fixture3.englishId,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });

    const fixture4 = await storedExtracted(doctorA, service);
    const cand4 = await service.getSourceLinkedCandidate(
      doctorA,
      fixture4.consultationId,
      fixture4.itemId,
      fixture4.englishId,
      extractEnv,
    );
    await withAdminClient(async (query) => {
      await query(
        `INSERT INTO clinical_evidence_extraction_candidate_reviews (
           organization_id, clinic_id, patient_id, consultation_id, evidence_item_id,
           extraction_run_id, candidate_id, action, actor_id, actor_role, reason_code,
           original_raw_text, original_normalized_text, corrected_raw_text,
           corrected_normalized_text, source_locator, supersedes_review_id,
           decision_status, authority_scope, clinically_used
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,'CORRECT_SOURCE_TEXT',$8,'Doctor','SOURCE_TEXT_MISREAD',
           $9,null,'   ',null,$10::jsonb,null,
           'ACTIVE','SOURCE_TEXT_TRANSCRIPTION_ONLY', false
         )`,
        [
          doctorA.organizationId,
          doctorA.clinicId,
          fixture4.patientId,
          fixture4.consultationId,
          fixture4.itemId,
          cand4.extractionRunId,
          fixture4.englishId,
          doctorA.actorId,
          cand4.rawText,
          JSON.stringify(cand4.sourceLocator),
        ],
      );
    }, env);
    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture4.consultationId,
          evidenceItemId: fixture4.itemId,
          candidateId: fixture4.englishId,
        },
        env,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError', message: 'SOURCE_INELIGIBLE' });
  });

  it('reader does not persist reviews, candidates, facts, findings, audits, or evidence', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const fixture = await storedExtracted(doctorA, service);
    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'CORRECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_MISREAD',
        correctedRawText: 'denies fever',
        idempotencyKey: `c2-persist-${fixture.englishId}`,
      },
      extractEnv,
    );
    const before = await snapshot(doctorA);
    await cues.parseF3cReviewedSourceCues(
      doctorA,
      {
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        candidateId: fixture.englishId,
      },
      env,
    );
    const after = await snapshot(doctorA);
    expect(after).toEqual(before);
  });

  it('serializes reader/writer on the shared lock; unrelated candidates do not block', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const fixture = await storedExtracted(doctorA, service);

    const holder = await holdReviewedLock(doctorA, fixture.englishId);
    let writerSettled = false;
    const writerPromise = service
      .submitCandidateReview(
        doctorA,
        fixture.consultationId,
        fixture.itemId,
        fixture.englishId,
        {
          action: 'ACCEPT_AS_SOURCE_TEXT',
          reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
          idempotencyKey: `c2-lock-writer-${fixture.englishId}`,
        },
        extractEnv,
      )
      .finally(() => {
        writerSettled = true;
      });
    await assertReviewedLockHeld(doctorA, fixture.englishId);
    expect(writerSettled).toBe(false);

    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.hindiId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c2-lock-unrelated-${fixture.hindiId}`,
      },
      extractEnv,
    );
    expect(writerSettled).toBe(false);

    holder.release();
    await holder.held;
    await writerPromise;
    expect(writerSettled).toBe(true);

    const parsed = await cues.parseF3cReviewedSourceCues(
      doctorA,
      {
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        candidateId: fixture.englishId,
      },
      env,
    );
    expect(parsed.reviewAction).toBe('ACCEPT_AS_SOURCE_TEXT');
  });

  it('writer waits while reader holds lock; post-lock reader sees winning ACTIVE review', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const fixture = await storedExtracted(doctorA, service);
    const accept = await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c2-race-accept-${fixture.englishId}`,
      },
      extractEnv,
    );

    const holder = await holdReviewedLock(doctorA, fixture.englishId);
    let readerSettled = false;
    const readerPromise = cues
      .parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: fixture.itemId,
          candidateId: fixture.englishId,
        },
        env,
      )
      .finally(() => {
        readerSettled = true;
      });
    await assertReviewedLockHeld(doctorA, fixture.englishId);
    expect(readerSettled).toBe(false);

    let writerSettled = false;
    const writerPromise = service
      .submitCandidateReview(
        doctorA,
        fixture.consultationId,
        fixture.itemId,
        fixture.englishId,
        {
          action: 'CORRECT_SOURCE_TEXT',
          reasonCode: 'SOURCE_TEXT_MISREAD',
          correctedRawText: 'denies fever',
          supersedesReviewId: accept.id,
          idempotencyKey: `c2-race-correct-${fixture.englishId}`,
        },
        extractEnv,
      )
      .finally(() => {
        writerSettled = true;
      });
    expect(writerSettled).toBe(false);

    holder.release();
    await holder.held;
    const [parsed, correct] = await Promise.all([readerPromise, writerPromise]);
    expect(readerSettled).toBe(true);
    expect(writerSettled).toBe(true);
    expect([accept.id, correct.id]).toContain(parsed.reviewEventId);
    if (parsed.reviewEventId === correct.id) {
      expect(parsed.reviewAction).toBe('CORRECT_SOURCE_TEXT');
      expect(parsed.parser.ok && parsed.parser.matches.some((m) => m.entryId)).toBeTruthy();
    } else {
      expect(parsed.reviewAction).toBe('ACCEPT_AS_SOURCE_TEXT');
    }

    const later = await cues.parseF3cReviewedSourceCues(
      doctorA,
      {
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        candidateId: fixture.englishId,
      },
      env,
    );
    expect(later.reviewEventId).toBe(correct.id);
    expect(later.reviewAction).toBe('CORRECT_SOURCE_TEXT');
  });

  it('conceals wrong tenant/consultation/evidence linkage; parser failure releases lock', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const service = evidenceService();
    const fixture = await storedExtracted(doctorA, service);
    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c2-conceal-${fixture.englishId}`,
      },
      extractEnv,
    );

    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorB,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: fixture.itemId,
          candidateId: fixture.englishId,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: '00000000-0000-4000-8000-000000000099',
          evidenceItemId: fixture.itemId,
          candidateId: fixture.englishId,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await expect(
      cues.parseF3cReviewedSourceCues(
        doctorA,
        {
          consultationId: fixture.consultationId,
          evidenceItemId: '00000000-0000-4000-8000-000000000098',
          candidateId: fixture.englishId,
        },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    const linked = await service.getSourceLinkedCandidate(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.englishId,
      extractEnv,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await tx.query(
          `UPDATE clinical_evidence_extraction_candidate_reviews
           SET decision_status = 'SUPERSEDED'
           WHERE candidate_id = $1 AND decision_status = 'ACTIVE'`,
          [fixture.englishId],
        );
      },
      env,
    );
    await withAdminClient(async (query) => {
      await query(
        `INSERT INTO clinical_evidence_extraction_candidate_reviews (
           organization_id, clinic_id, patient_id, consultation_id, evidence_item_id,
           extraction_run_id, candidate_id, action, actor_id, actor_role, reason_code,
           original_raw_text, original_normalized_text, corrected_raw_text,
           corrected_normalized_text, source_locator, supersedes_review_id,
           decision_status, authority_scope, clinically_used
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,'ACCEPT_AS_SOURCE_TEXT',$8,'Doctor','SYNTHETIC_FIXTURE_REVIEW',
           $9,null,null,null,$10::jsonb,null,
           'ACTIVE','SOURCE_TEXT_TRANSCRIPTION_ONLY', false
         )`,
        [
          doctorA.organizationId,
          doctorA.clinicId,
          fixture.patientId,
          fixture.consultationId,
          fixture.itemId,
          linked.extractionRunId,
          fixture.englishId,
          doctorA.actorId,
          String.fromCharCode(1),
          JSON.stringify(linked.sourceLocator),
        ],
      );
    }, env);
    const malformed = await cues.parseF3cReviewedSourceCues(
      doctorA,
      {
        consultationId: fixture.consultationId,
        evidenceItemId: fixture.itemId,
        candidateId: fixture.englishId,
      },
      env,
    );
    expect(malformed.parser).toEqual({
      ok: false,
      reason: 'MALFORMED_UNICODE',
      matches: [],
    });
    expect(JSON.stringify(malformed)).not.toContain(String.fromCharCode(1));

    await service.submitCandidateReview(
      doctorA,
      fixture.consultationId,
      fixture.itemId,
      fixture.hindiId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: `c2-after-fail-${fixture.hindiId}`,
      },
      extractEnv,
    );
  });
});
