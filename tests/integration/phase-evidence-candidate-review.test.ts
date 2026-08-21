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
  ReviewConflictError,
  ValidationError,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import {
  DeterministicMalwareScanner,
  MemoryFakeObjectStore,
  MemoryRateLimiter,
  resetMemoryFakeObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';
import { DeterministicFakeExtractor } from '../../packages/evidence-extract/src/index.ts';
import {
  recordEvidenceEvent,
  resetEvidenceMetrics,
  snapshotEvidenceMetrics,
} from '../../packages/observability/src/index.ts';
import {
  PlatformRole,
  createPrincipalForPolicyEvaluation,
} from '../../packages/security/src/index.ts';
import { createApp } from '../../apps/api/src/createApp.ts';
import { EHAS2_API_NAMESPACE } from '../../packages/shared/src/index.ts';
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

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

beforeAll(async () => {
  process.env.EHAS2_API_LISTEN = '0';
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
  if (!dbReady) throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3C review tests');
}

function evidenceService(): EvidenceService {
  return new EvidenceService({
    store,
    malwareScanner: new DeterministicMalwareScanner('CLEAN'),
    rateLimiter: new MemoryRateLimiter(),
    extractor: new DeterministicFakeExtractor(),
    onSafeMetric: recordEvidenceEvent,
  });
}

async function seedTenants(): Promise<{ doctorA: TenantContext; doctorB: TenantContext }> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic F3C Doctor A',
        actorId: '00000000-0000-4000-8000-0000000000d1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic F3C Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic F3C Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic F3C Doctor B',
        actorId: '00000000-0000-4000-8000-0000000000d2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic F3C Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic F3C Clinic B', actorId: uB.id },
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
  englishId: string;
  hindiId: string;
}> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic F3C Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'synthetic f3c fixture' },
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
  await service.runDueJobs(tenant, 'ehas2-f3c-worker', new Date(), extractEnv);
  const candidates = await service.listExtractionCandidates(tenant, item.id, extractEnv);
  const english = candidates.find((c) => c.rawText === 'Hemoglobin');
  const hindi = candidates.find((c) => c.rawText === 'हीमोग्लोबिन');
  if (!english?.id || !hindi?.id) {
    throw new Error('BLOCKED: expected synthetic English and Hindi candidates');
  }
  return {
    itemId: item.id,
    consultationId: consultation.id,
    englishId: english.id,
    hindiId: hindi.id,
  };
}

function appFor(tenant: TenantContext, service: EvidenceService) {
  const principal = createPrincipalForPolicyEvaluation({
    subjectId: tenant.actorId,
    role: tenant.actorRole as typeof PlatformRole.Doctor,
    tenantId: tenant.organizationId,
    isTestPrincipal: true,
  });
  return createApp({
    resolvePrincipal: () => principal,
    resolveTenantContext: () => tenant,
    evidence: service,
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

describe('F3C source-linked candidate review foundation', () => {
  it('registers migration 014 and keeps /ready 503', async () => {
    expect(getOrderedMigrationIds()).toContain('014_f3c_candidate_review');
    expect(getOrderedMigrationIds()).toContain('015_f3d1_fact_candidates');
    expect(getOrderedMigrationIds()).toContain('016_f3d2_fact_normalizations');
    expect(getOrderedMigrationIds()).toHaveLength(17);
    const app = createApp();
    const ready = await httpJson(app, 'GET', '/ready');
    expect(ready.status).toBe(503);
    expect(ready.json.ready).toBe(false);
    expect(ready.json.ocr).toBe(false);
    expect(ready.json.ocrAdapter).toBe(false);
    expect(ready.json.extractProduction).toBe(false);
    expect(ready.json.clinicalEngine).toBe(false);
    expect(ready.json.f3cCandidateReviewFoundation).toBe(true);
    expect(ready.json.f3dFactCandidateFoundation).toBe(true);
  });

  it('presents English and Hindi candidates with page/bbox and keeps OCR unverified', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const { itemId, consultationId, englishId, hindiId } = await storedExtracted(doctorA, service);
    const views = await service.listSourceLinkedCandidates(
      doctorA,
      consultationId,
      itemId,
      extractEnv,
    );
    expect(views.some((v) => v.candidateId === englishId && v.rawText === 'Hemoglobin')).toBe(true);
    expect(views.some((v) => v.candidateId === hindiId && v.rawText === 'हीमोग्लोबिन')).toBe(true);
    expect(views.every((v) => v.verificationPosture === 'UNVERIFIED')).toBe(true);
    expect(views.every((v) => v.clinicalAuthority === 'NOT_AUTHORITATIVE')).toBe(true);
    expect(views.every((v) => v.ocrAuthoritative === false)).toBe(true);
    expect(
      views.every((v) => v.sourceTextAuthorityScope === 'SOURCE_TEXT_TRANSCRIPTION_ONLY'),
    ).toBe(true);
    expect(views.every((v) => v.sourceLocator.page >= 1)).toBe(true);
    expect(JSON.stringify(views)).not.toMatch(/object_key|presigned|lab\.png|ehas2\/[0-9a-f-]{36}/);
    const app = appFor(doctorA, service);
    const listed = await httpJson(
      app,
      'GET',
      `${EHAS2_API_NAMESPACE}/consultations/${consultationId}/evidence/${itemId}/candidates`,
    );
    expect(listed.status).toBe(200);
    const payload = JSON.stringify(listed.json);
    expect(payload).toMatch(/Hemoglobin/);
    expect(payload).toMatch(/हीमोग्लोबिन/);
    expect(payload).toMatch(/bbox|"page":/);
    expect(payload).not.toMatch(/object_key|presigned_url|lab\.png/);
  });

  it('records ACCEPT/CORRECT/REJECT/UNRESOLVED append-only without mutating candidates', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const { itemId, consultationId, englishId, hindiId } = await storedExtracted(doctorA, service);
    const before = await service.listExtractionCandidates(doctorA, itemId, extractEnv);
    const accept = await service.submitCandidateReview(
      doctorA,
      consultationId,
      itemId,
      englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: 'idem-accept-en-0001',
      },
      extractEnv,
    );
    expect(accept.action).toBe('ACCEPT_AS_SOURCE_TEXT');
    expect(accept.clinicallyUsed).toBe(false);
    expect(accept.authorityScope).toBe('SOURCE_TEXT_TRANSCRIPTION_ONLY');
    const correct = await service.submitCandidateReview(
      doctorA,
      consultationId,
      itemId,
      englishId,
      {
        action: 'CORRECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_MISREAD',
        correctedRawText: 'Haemoglobin',
        supersedesReviewId: accept.id,
        idempotencyKey: 'idem-correct-en-0001',
      },
      extractEnv,
    );
    expect(correct.originalRawText).toBe('Hemoglobin');
    expect(correct.correctedRawText).toBe('Haemoglobin');
    expect(correct.supersedesReviewId).toBe(accept.id);
    const reject = await service.submitCandidateReview(
      doctorA,
      consultationId,
      itemId,
      hindiId,
      {
        action: 'REJECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_NOT_PRESENT',
        idempotencyKey: 'idem-reject-hi-0001',
      },
      extractEnv,
    );
    expect(reject.action).toBe('REJECT_SOURCE_TEXT');
    const unresolved = await service.submitCandidateReview(
      doctorA,
      consultationId,
      itemId,
      hindiId,
      {
        action: 'MARK_UNRESOLVED',
        reasonCode: 'SOURCE_TEXT_UNCERTAIN',
        supersedesReviewId: reject.id,
        idempotencyKey: 'idem-unresolved-hi-0001',
      },
      extractEnv,
    );
    expect(unresolved.decisionStatus).toBe('ACTIVE');
    const historyEn = await service.listCandidateReviews(
      doctorA,
      consultationId,
      itemId,
      englishId,
      extractEnv,
    );
    expect(historyEn.map((r) => r.action)).toEqual([
      'ACCEPT_AS_SOURCE_TEXT',
      'CORRECT_SOURCE_TEXT',
    ]);
    expect(historyEn[0]?.decisionStatus).toBe('SUPERSEDED');
    expect(historyEn[1]?.decisionStatus).toBe('ACTIVE');
    const after = await service.listExtractionCandidates(doctorA, itemId, extractEnv);
    expect(after.map((c) => `${c.id}:${c.rawText}:${c.verificationPosture}:${c.status}`)).toEqual(
      before.map((c) => `${c.id}:${c.rawText}:${c.verificationPosture}:${c.status}`),
    );
    expect(await service.countStructuredFindingsForEvidence(doctorA, itemId, env)).toBe(0);
    const item = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query(
          `SELECT extraction_status, clinical_authority FROM clinical_evidence_items WHERE id = $1`,
          [itemId],
        );
        const used = await tx.query(
          `SELECT bool_or(clinically_used) AS any_used
           FROM clinical_evidence_extraction_candidate_reviews WHERE evidence_item_id = $1`,
          [itemId],
        );
        return {
          extraction_status: String((r.rows[0] as { extraction_status: string }).extraction_status),
          clinical_authority: String(
            (r.rows[0] as { clinical_authority: string }).clinical_authority,
          ),
          anyUsed: (used.rows[0] as { any_used: boolean }).any_used,
        };
      },
      env,
    );
    expect(item.extraction_status).toBe('NOT_AUTHORIZED');
    expect(item.clinical_authority).toBe('NOT_AUTHORITATIVE');
    expect(item.anyUsed).toBe(false);
  });

  it('is tenant-isolating, idempotent, and concurrent-conflict safe', async () => {
    requireDb();
    resetEvidenceMetrics();
    const { doctorA, doctorB } = await seedTenants();
    const service = evidenceService();
    const { itemId, consultationId, englishId } = await storedExtracted(doctorA, service);
    const concealed = await service.listSourceLinkedCandidates(
      doctorB,
      consultationId,
      itemId,
      extractEnv,
    );
    expect(concealed).toEqual([]);
    await expect(
      service.submitCandidateReview(
        doctorB,
        consultationId,
        itemId,
        englishId,
        {
          action: 'ACCEPT_AS_SOURCE_TEXT',
          reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
          idempotencyKey: 'idem-cross-tenant-0001',
        },
        extractEnv,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const first = await service.submitCandidateReview(
      doctorA,
      consultationId,
      itemId,
      englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: 'idem-same-0001',
      },
      extractEnv,
    );
    const replay = await service.submitCandidateReview(
      doctorA,
      consultationId,
      itemId,
      englishId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: 'idem-same-0001',
      },
      extractEnv,
    );
    expect(replay.id).toBe(first.id);
    await expect(
      service.submitCandidateReview(
        doctorA,
        consultationId,
        itemId,
        englishId,
        {
          action: 'REJECT_SOURCE_TEXT',
          reasonCode: 'SOURCE_TEXT_NOT_PRESENT',
          idempotencyKey: 'idem-same-0001',
        },
        extractEnv,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    await expect(
      service.submitCandidateReview(
        doctorA,
        consultationId,
        itemId,
        englishId,
        {
          action: 'REJECT_SOURCE_TEXT',
          reasonCode: 'SOURCE_TEXT_NOT_PRESENT',
          idempotencyKey: 'idem-conflict-no-supersede',
        },
        extractEnv,
      ),
    ).rejects.toBeInstanceOf(ReviewConflictError);

    const {
      englishId: otherId,
      consultationId: c2,
      itemId: i2,
    } = await storedExtracted(doctorA, service);
    const raced = await Promise.allSettled([
      service.submitCandidateReview(
        doctorA,
        c2,
        i2,
        otherId,
        {
          action: 'ACCEPT_AS_SOURCE_TEXT',
          reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
          idempotencyKey: 'idem-race-a',
        },
        extractEnv,
      ),
      service.submitCandidateReview(
        doctorA,
        c2,
        i2,
        otherId,
        {
          action: 'REJECT_SOURCE_TEXT',
          reasonCode: 'SOURCE_TEXT_NOT_PRESENT',
          idempotencyKey: 'idem-race-b',
        },
        extractEnv,
      ),
    ]);
    const fulfilled = raced.filter((r) => r.status === 'fulfilled');
    const rejected = raced.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ReviewConflictError);
    const history = await service.listCandidateReviews(doctorA, c2, i2, otherId, extractEnv);
    expect(history.filter((r) => r.decisionStatus === 'ACTIVE')).toHaveLength(1);

    const app = appFor(doctorA, service);
    const conflictHttp = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${consultationId}/evidence/${itemId}/candidates/${englishId}/reviews`,
      { action: 'MARK_UNRESOLVED', reasonCode: 'SOURCE_TEXT_UNCERTAIN' },
      { 'Idempotency-Key': 'idem-http-conflict-1' },
    );
    expect(conflictHttp.status).toBe(409);
    expect(conflictHttp.json.code).toBe('REVIEW_CONFLICT');
    expect(JSON.stringify(conflictHttp.json)).not.toMatch(/at |\bSQL\b|relation |stack/i);

    const unknown = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${consultationId}/evidence/${itemId}/candidates/${englishId}/reviews`,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        medicineCode: 'C11',
      },
      { 'Idempotency-Key': 'idem-unknown-field' },
    );
    expect(unknown.status).toBe(400);
    expect(String(unknown.json.message)).toMatch(/UNKNOWN_FIELD_REJECTED/);

    const snap = snapshotEvidenceMetrics();
    expect(JSON.stringify(snap)).not.toMatch(/Hemoglobin|हीमोग्लोबिन|lab\.png/);
  });

  it('keeps review API disconnected without the non-production flag', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const service = evidenceService();
    const { itemId, consultationId } = await storedExtracted(doctorA, service);
    await expect(
      service.listSourceLinkedCandidates(doctorA, consultationId, itemId, env),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.listSourceLinkedCandidates(doctorA, consultationId, itemId, {
        ...extractEnv,
        NODE_ENV: 'production',
        EHAS2_NODE_ENV: 'production',
      }),
    ).rejects.toMatchObject({ message: 'CANDIDATE_REVIEW_NOT_CONNECTED' });
  });
});
