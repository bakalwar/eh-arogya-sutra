import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';
import {
  ConsultationIntakeService,
  ConsultationService,
  EvidenceService,
  FactCandidateService,
  FactConflictError,
  PatientService,
  PgFactCandidateRepository,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ResourceNotFoundError,
  closePool,
  getOrderedMigrationIds,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import type { InsertFactCandidateInput } from '../../packages/database/src/repositories/factCandidate.ts';
import type { FactCandidateDto } from '../../packages/evidence-extract/src/index.ts';
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

const env = isolatedPostgresTestEnv('ehas2_phase_f3d_test');
const factEnv = {
  ...env,
  EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
  EHAS2_F3C_CANDIDATE_REVIEW: '1',
  EHAS2_F3D_FACT_CANDIDATES: '1',
};
let dbReady = false;
resetMemoryFakeObjectStore();
const store = new MemoryFakeObjectStore();
const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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
  await resetDatabaseSchema(env);
  await migrateUp(env);
}, 120_000);

afterAll(async () => {
  if (dbReady) await closePool();
});

function requireDb(): void {
  if (!dbReady) throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D fact tests');
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

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

async function seedTenants(): Promise<{ doctorA: TenantContext; doctorB: TenantContext }> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const uA = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D Doctor A',
        actorId: '00000000-0000-4000-8000-0000000000e1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic F3D Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic F3D Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic F3D Doctor B',
        actorId: '00000000-0000-4000-8000-0000000000e2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic F3D Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic F3D Clinic B', actorId: uB.id },
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

async function openConsultation(tenant: TenantContext): Promise<{
  consultationId: string;
  symptomId: string;
}> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic F3D Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'synthetic headache' },
    env,
  );
  const bundle = await intake.patch(
    tenant,
    consultation.id,
    {
      chiefComplaintText: 'synthetic headache',
      chiefComplaintOnset: '2 days',
      chiefComplaintDuration: '2 days',
      doctorObservations: 'synthetic dry tongue sign',
      historyNotes: 'synthetic prior medicine statement',
      vitals: {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        pulseBpm: 72,
        temperatureC: 36.5,
        spo2Percent: 98,
        weightKg: 70,
        heightCm: 170,
      },
      symptoms: [{ label: 'सिरदर्द', duration: '2 days' }, { label: 'fever' }],
    },
    env,
  );
  const hindi = bundle.symptoms.find((s) => s.label === 'सिरदर्द');
  if (!hindi) throw new Error('BLOCKED: expected synthetic Hindi symptom row');
  return { consultationId: consultation.id, symptomId: hindi.id };
}

async function storedExtracted(
  tenant: TenantContext,
  service: EvidenceService,
  evidenceType: 'BLOOD_REPORT' | 'USG' = 'BLOOD_REPORT',
): Promise<{
  itemId: string;
  consultationId: string;
  hemoglobinId: string;
  valueId: string;
  impressionId: string;
  hindiImpressionId: string | null;
}> {
  const { consultationId } = await openConsultation(tenant);
  const item = await service.initiate(
    tenant,
    {
      consultationId,
      evidenceType,
      sourceType: 'DOCTOR_UPLOAD',
      filename: 'lab.png',
      declaredMime: 'image/png',
    },
    env,
  );
  await service.receiveBytes(tenant, consultationId, item.id, PNG, env);
  await service.enqueueExtractCandidates(tenant, item.id, new Date(), factEnv);
  await service.runDueJobs(tenant, 'ehas2-f3d-worker', new Date(), factEnv);
  const candidates = await service.listExtractionCandidates(tenant, item.id, factEnv);
  const impression = candidates.find((c) => c.candidateType === 'WRITTEN_IMPRESSION_TEXT');
  if (!impression?.id) {
    throw new Error('BLOCKED: expected synthetic impression candidate');
  }
  if (evidenceType === 'USG') {
    return {
      itemId: item.id,
      consultationId,
      hemoglobinId: impression.id,
      valueId: impression.id,
      impressionId: impression.id,
      hindiImpressionId: null,
    };
  }
  const hemoglobin = candidates.find((c) => c.rawText === 'Hemoglobin');
  const value = candidates.find((c) => c.rawText === '13.2');
  const hindiImpression = candidates.find((c) => c.rawText.includes('निष्कर्ष'));
  if (!hemoglobin?.id || !value?.id) {
    throw new Error('BLOCKED: expected synthetic extraction candidates');
  }
  return {
    itemId: item.id,
    consultationId,
    hemoglobinId: hemoglobin.id,
    valueId: value.id,
    impressionId: impression.id,
    hindiImpressionId: hindiImpression?.id ?? null,
  };
}

function appFor(tenant: TenantContext, evidence: EvidenceService, facts: FactCandidateService) {
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
    factCandidates: facts,
  });
}

async function httpJson(
  app: ReturnType<typeof createApp>,
  method: string,
  pathName: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: Record<string, unknown> }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${pathName}`, {
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

function insertFrom(fact: FactCandidateDto): InsertFactCandidateInput {
  return {
    patientId: fact.patientId,
    consultationId: fact.consultationId,
    sourceChannel: fact.sourceChannel,
    factCategory: fact.factCategory,
    sourceField: fact.sourceField,
    intakeSymptomId: fact.intakeSymptomId,
    evidenceItemId: fact.evidenceItemId,
    extractionRunId: fact.extractionRunId,
    extractionCandidateId: fact.extractionCandidateId,
    reviewEventId: fact.reviewEventId,
    originalSourceSpan: fact.originalSourceSpan,
    assertedText: fact.assertedText,
    assertedValue: fact.assertedValue,
    unitText: fact.unitText,
    unitPosture: fact.unitPosture,
    negated: fact.negated,
    durationText: fact.durationText,
    onsetText: fact.onsetText,
    sourceLocator: fact.sourceLocator,
    sourceIdentityFingerprint: fact.sourceIdentityFingerprint,
    contentFingerprint: fact.contentFingerprint,
    limitationCodes: [...fact.limitationCodes],
    confidence: fact.confidence,
    supersedesFactId: fact.supersedesFactId,
  };
}

describe('F3D-1 source-linked fact-candidate persistence', () => {
  it('registers migration 015, RLS, and keeps /ready 503', async () => {
    expect(getOrderedMigrationIds()).toContain('015_f3d1_fact_candidates');
    expect(getOrderedMigrationIds()).toHaveLength(15);
    const sql = fs.readFileSync(
      path.join(root, 'packages/database/migrations/015_f3d1_fact_candidates.sql'),
      'utf8',
    );
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ehas2_tenant_ok/);
    expect(sql).toMatch(/REVOKE DELETE ON clinical_fact_candidates FROM ehas2_app/);
    expect(sql).not.toMatch(/ON DELETE CASCADE/);
    const app = createApp();
    const ready = await httpJson(app, 'GET', '/ready');
    expect(ready.status).toBe(503);
    expect(ready.json.ready).toBe(false);
    expect(ready.json.ocr).toBe(false);
    expect(ready.json.ocrAdapter).toBe(false);
    expect(ready.json.extractProduction).toBe(false);
    expect(ready.json.clinicalEngine).toBe(false);
    expect(ready.json.f3dFactCandidateFoundation).toBe(true);
    expect(ready.json.f3d2TerminologyPackFoundation).toBe(true);
    expect(ready.json.terminologyProductionEntryCount).toBe(0);
    expect(ready.json.ownerTerminologyFreezePending).toBe(true);
    expect(ready.json.normalizationParserAvailable).toBe(false);
  });

  it('materializes doctor-declared, intake, and reviewed categories without findings writes', async () => {
    requireDb();
    resetEvidenceMetrics();
    const { doctorA } = await seedTenants();
    const evidence = evidenceService();
    const facts = factService();
    const { consultationId, symptomId } = await openConsultation(doctorA);

    const symptom = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'fact-cc-0001',
      },
      factEnv,
    );
    expect(symptom.factCategory).toBe('SYMPTOM');
    expect(symptom.originalSourceSpan).toBe('synthetic headache');
    expect(symptom.durationText).toBe('2 days');
    expect(symptom.onsetText).toBe('2 days');
    expect(symptom.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
    expect(symptom.clinicallyUsed).toBe(false);
    expect(symptom.normalizationMethod).toBe('NONE');

    const hindiSymptom = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'SYMPTOM_ROW',
        symptomId,
        idempotencyKey: 'fact-sym-hi-0001',
      },
      factEnv,
    );
    expect(hindiSymptom.originalSourceSpan).toBe('सिरदर्द');
    expect(hindiSymptom.factCategory).toBe('SYMPTOM');

    const sign = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'DOCTOR_OBSERVATIONS',
        idempotencyKey: 'fact-sign-0001',
      },
      factEnv,
    );
    expect(sign.factCategory).toBe('SIGN');

    const meds = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'HISTORY_NOTES',
        category: 'MEDICATION_HISTORY_STATEMENT',
        idempotencyKey: 'fact-hx-med-0001',
      },
      factEnv,
    );
    expect(meds.factCategory).toBe('MEDICATION_HISTORY_STATEMENT');

    const allergy = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'HISTORY_NOTES',
        category: 'ALLERGY_STATEMENT',
        idempotencyKey: 'fact-hx-all-0001',
      },
      factEnv,
    );
    expect(allergy.factCategory).toBe('ALLERGY_STATEMENT');

    const bundle = await intake.get(doctorA, consultationId, env);
    const fever = bundle.symptoms.find((s) => s.label === 'fever');
    if (!fever) throw new Error('BLOCKED: expected fever row');
    const negated = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'SYMPTOM_ROW',
        symptomId: fever.id,
        category: 'NEGATED_FINDING',
        idempotencyKey: 'fact-neg-0001',
      },
      factEnv,
    );
    expect(negated.factCategory).toBe('NEGATED_FINDING');
    expect(negated.negated).toBe(true);

    const pulse = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        idempotencyKey: 'fact-pulse-0001',
      },
      factEnv,
    );
    expect(pulse.factCategory).toBe('VITAL');
    expect(pulse.assertedValue).toBe('72');
    expect(pulse.unitText).toBe('bpm');
    expect(pulse.unitPosture).toBe('EXACT_AS_SOURCE');

    await expect(
      facts.materialize(
        doctorA,
        consultationId,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          category: 'PROCEDURE',
          idempotencyKey: 'fact-bad-cat',
        },
        factEnv,
      ),
    ).rejects.toMatchObject({ message: 'UNSUPPORTED_FACT_CATEGORY' });

    const extracted = await storedExtracted(doctorA, evidence, 'BLOOD_REPORT');
    await evidence.submitCandidateReview(
      doctorA,
      extracted.consultationId,
      extracted.itemId,
      extracted.hemoglobinId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: 'rev-accept-hb',
      },
      factEnv,
    );
    const lab = await facts.materialize(
      doctorA,
      extracted.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: extracted.itemId,
        candidateId: extracted.hemoglobinId,
        idempotencyKey: 'fact-lab-0001',
      },
      factEnv,
    );
    expect(lab.factCategory).toBe('LAB_OBSERVATION');
    expect(lab.originalSourceSpan).toBe('Hemoglobin');
    expect(lab.reviewEventId).toBeTruthy();
    expect(JSON.stringify(lab.sourceLocator)).not.toMatch(/object_key|lab\.png|filename|https?:/);

    await evidence.submitCandidateReview(
      doctorA,
      extracted.consultationId,
      extracted.itemId,
      extracted.impressionId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: 'rev-accept-imp',
      },
      factEnv,
    );
    const stated = await facts.materialize(
      doctorA,
      extracted.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: extracted.itemId,
        candidateId: extracted.impressionId,
        idempotencyKey: 'fact-dx-0001',
      },
      factEnv,
    );
    expect(stated.factCategory).toBe('SOURCE_STATED_DIAGNOSIS');
    expect(stated.limitationCodes).toContain('NO_DISEASE_MAPPING');

    const imaging = await storedExtracted(doctorA, evidence, 'USG');
    await evidence.submitCandidateReview(
      doctorA,
      imaging.consultationId,
      imaging.itemId,
      imaging.impressionId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: 'rev-accept-usg',
      },
      factEnv,
    );
    const imagingFact = await facts.materialize(
      doctorA,
      imaging.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: imaging.itemId,
        candidateId: imaging.impressionId,
        idempotencyKey: 'fact-img-0001',
      },
      factEnv,
    );
    expect(imagingFact.factCategory).toBe('IMAGING_REPORT_STATEMENT');

    const findings = await withTenantTransaction(
      doctorA,
      async (tx) => {
        const r = await tx.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM structured_report_findings
           WHERE organization_id = $1 AND clinic_id = $2`,
          [doctorA.organizationId, doctorA.clinicId],
        );
        return Number(r.rows[0]?.n ?? 0);
      },
      env,
    );
    expect(findings).toBe(0);
    expect(snapshotEvidenceMetrics().totals.candidate_review_result).toBeGreaterThan(0);
    expect(JSON.stringify(snapshotEvidenceMetrics())).not.toMatch(
      /synthetic headache|सिरदर्द|Hemoglobin|lab\.png/,
    );
  }, 180_000);

  it('enforces F3C eligibility, corrected text, locator rules, and fail-closed raw OCR', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const evidence = evidenceService();
    const facts = factService();
    const extracted = await storedExtracted(doctorA, evidence, 'BLOOD_REPORT');

    await expect(
      facts.materialize(
        doctorA,
        extracted.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: extracted.itemId,
          candidateId: extracted.hemoglobinId,
          idempotencyKey: 'fact-raw-ocr',
        },
        factEnv,
      ),
    ).rejects.toMatchObject({ message: 'F3C_REVIEW_REQUIRED' });

    await evidence.submitCandidateReview(
      doctorA,
      extracted.consultationId,
      extracted.itemId,
      extracted.valueId,
      {
        action: 'REJECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_NOT_PRESENT',
        idempotencyKey: 'rev-reject-val',
      },
      factEnv,
    );
    await expect(
      facts.materialize(
        doctorA,
        extracted.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: extracted.itemId,
          candidateId: extracted.valueId,
          idempotencyKey: 'fact-reject',
        },
        factEnv,
      ),
    ).rejects.toMatchObject({ message: 'F3C_REVIEW_INELIGIBLE' });

    const unresolved = await storedExtracted(doctorA, evidence, 'BLOOD_REPORT');
    await evidence.submitCandidateReview(
      doctorA,
      unresolved.consultationId,
      unresolved.itemId,
      unresolved.hemoglobinId,
      {
        action: 'MARK_UNRESOLVED',
        reasonCode: 'SOURCE_TEXT_UNCERTAIN',
        idempotencyKey: 'rev-unresolved',
      },
      factEnv,
    );
    await expect(
      facts.materialize(
        doctorA,
        unresolved.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: unresolved.itemId,
          candidateId: unresolved.hemoglobinId,
          idempotencyKey: 'fact-unresolved',
        },
        factEnv,
      ),
    ).rejects.toMatchObject({ message: 'F3C_REVIEW_INELIGIBLE' });

    const correctCase = await storedExtracted(doctorA, evidence, 'BLOOD_REPORT');
    const accept = await evidence.submitCandidateReview(
      doctorA,
      correctCase.consultationId,
      correctCase.itemId,
      correctCase.hemoglobinId,
      {
        action: 'ACCEPT_AS_SOURCE_TEXT',
        reasonCode: 'SYNTHETIC_FIXTURE_REVIEW',
        idempotencyKey: 'rev-accept-then-correct',
      },
      factEnv,
    );
    await evidence.submitCandidateReview(
      doctorA,
      correctCase.consultationId,
      correctCase.itemId,
      correctCase.hemoglobinId,
      {
        action: 'CORRECT_SOURCE_TEXT',
        reasonCode: 'SOURCE_TEXT_MISREAD',
        correctedRawText: 'Haemoglobin',
        supersedesReviewId: accept.id,
        idempotencyKey: 'rev-correct-hb',
      },
      factEnv,
    );
    const corrected = await facts.materialize(
      doctorA,
      correctCase.consultationId,
      {
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        evidenceId: correctCase.itemId,
        candidateId: correctCase.hemoglobinId,
        idempotencyKey: 'fact-correct-hb',
      },
      factEnv,
    );
    expect(corrected.originalSourceSpan).toBe('Haemoglobin');
    expect(corrected.originalSourceSpan).not.toBe('Hemoglobin');
    expect(corrected.sourceLocator?.page).toBeGreaterThanOrEqual(1);

    await expect(
      facts.materialize(
        doctorA,
        extracted.consultationId,
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
          evidenceId: extracted.itemId,
          candidateId: accept.id,
          idempotencyKey: 'fact-wrong-link',
        },
        factEnv,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  }, 180_000);

  it('keeps facts append-only with explicit supersession, idempotency, and concurrency', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const facts = factService();
    const { consultationId } = await openConsultation(doctorA);
    const first = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'fact-idem-0001',
      },
      factEnv,
    );
    const replay = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'fact-idem-0001',
      },
      factEnv,
    );
    expect(replay.id).toBe(first.id);
    await expect(
      facts.materialize(
        doctorA,
        consultationId,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_PULSE',
          idempotencyKey: 'fact-idem-0001',
        },
        factEnv,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });

    await intake.patch(
      doctorA,
      consultationId,
      { chiefComplaintText: 'synthetic headache corrected' },
      env,
    );
    await expect(
      facts.materialize(
        doctorA,
        consultationId,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          idempotencyKey: 'fact-conflict-no-super',
        },
        factEnv,
      ),
    ).rejects.toBeInstanceOf(FactConflictError);

    const replacement = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        supersedesFactId: first.id,
        idempotencyKey: 'fact-super-0001',
      },
      factEnv,
    );
    expect(replacement.id).not.toBe(first.id);
    expect(replacement.supersedesFactId).toBe(first.id);
    expect(replacement.originalSourceSpan).toBe('synthetic headache corrected');
    const history = await facts.list(doctorA, consultationId, factEnv);
    const cc = history.filter((f) => f.sourceField === 'CHIEF_COMPLAINT');
    expect(cc.filter((f) => f.decisionStatus === 'ACTIVE')).toHaveLength(1);
    expect(cc.filter((f) => f.decisionStatus === 'SUPERSEDED')).toHaveLength(1);
    expect(cc.find((f) => f.id === first.id)?.originalSourceSpan).toBe('synthetic headache');

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        let updateBlocked = false;
        try {
          await tx.query(
            `UPDATE clinical_fact_candidates SET original_source_span = 'mutated' WHERE id = $1`,
            [first.id],
          );
        } catch {
          updateBlocked = true;
        }
        let authorityBlocked = false;
        try {
          await tx.query(
            `UPDATE clinical_fact_candidates SET authority_status = 'FACT_NORMALIZED_SOURCE_LINKED' WHERE id = $1`,
            [replacement.id],
          );
        } catch {
          authorityBlocked = true;
        }
        let usedBlocked = false;
        try {
          await tx.query(
            `UPDATE clinical_fact_candidates SET clinically_used = true WHERE id = $1`,
            [replacement.id],
          );
        } catch {
          usedBlocked = true;
        }
        let deleteBlocked = false;
        try {
          await tx.query(`DELETE FROM clinical_fact_candidates WHERE id = $1`, [first.id]);
        } catch {
          deleteBlocked = true;
        }
        expect(updateBlocked).toBe(true);
        expect(authorityBlocked).toBe(true);
        expect(usedBlocked).toBe(true);
        expect(deleteBlocked).toBe(true);
      },
      env,
    );

    const listedB = await facts.list(doctorB, consultationId, factEnv).catch((err) => err);
    expect(listedB).toBeInstanceOf(ResourceNotFoundError);

    const { consultationId: c2 } = await openConsultation(doctorA);
    const raced = await Promise.allSettled([
      facts.materialize(
        doctorA,
        c2,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          idempotencyKey: 'fact-race-a',
        },
        factEnv,
      ),
      facts.materialize(
        doctorA,
        c2,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          idempotencyKey: 'fact-race-b',
        },
        factEnv,
      ),
    ]);
    const fulfilled = raced.filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(2);
    const idA = (fulfilled[0] as PromiseFulfilledResult<{ id: string }>).value.id;
    const idB = (fulfilled[1] as PromiseFulfilledResult<{ id: string }>).value.id;
    expect(idA).toBe(idB);
    const afterRace = await facts.list(doctorA, c2, factEnv);
    expect(afterRace.filter((f) => f.decisionStatus === 'ACTIVE')).toHaveLength(1);

    await intake.patch(doctorA, c2, { chiefComplaintText: 'synthetic race correction' }, env);
    const active = afterRace.find((f) => f.decisionStatus === 'ACTIVE');
    if (!active) throw new Error('BLOCKED: expected active fact');
    const superRace = await Promise.allSettled([
      facts.materialize(
        doctorA,
        c2,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          supersedesFactId: active.id,
          idempotencyKey: 'fact-super-race-a',
        },
        factEnv,
      ),
      facts.materialize(
        doctorA,
        c2,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          supersedesFactId: active.id,
          idempotencyKey: 'fact-super-race-b',
        },
        factEnv,
      ),
    ]);
    expect(superRace.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(superRace.filter((r) => r.status === 'rejected')).toHaveLength(1);
    const rejected = superRace.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(FactConflictError);

    const rls = await withAdminClient(async (query) => {
      const forced = await query<{ f: boolean }>(
        `SELECT relforcerowsecurity AS f FROM pg_class WHERE relname = 'clinical_fact_candidates'`,
      );
      const enabled = await query<{ e: boolean }>(
        `SELECT relrowsecurity AS e FROM pg_class WHERE relname = 'clinical_fact_candidates'`,
      );
      await query(`SET ROLE ehas2_app`);
      await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [doctorB.organizationId]);
      await query(`SELECT set_config('ehas2.clinic_id', $1, true)`, [doctorB.clinicId]);
      const hidden = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM clinical_fact_candidates`,
      );
      await query(`RESET ROLE`);
      return {
        forced: forced.rows[0]?.f === true,
        enabled: enabled.rows[0]?.e === true,
        hidden: Number(hidden.rows[0]?.c ?? -1),
      };
    }, env);
    expect(rls.forced).toBe(true);
    expect(rls.enabled).toBe(true);
    expect(rls.hidden).toBe(0);

    const app = appFor(doctorA, evidenceService(), facts);
    await intake.patch(
      doctorA,
      consultationId,
      { chiefComplaintText: 'synthetic http conflict' },
      env,
    );
    const unknown = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${consultationId}/fact-candidates/materialize`,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        medicineCode: 'C11',
      },
      { 'Idempotency-Key': 'fact-http-unknown' },
    );
    expect(unknown.status).toBe(400);
    expect(String(unknown.json.message)).toMatch(/UNKNOWN_FIELD_REJECTED/);
    const conflictHttp = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${consultationId}/fact-candidates/materialize`,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
      },
      { 'Idempotency-Key': 'fact-http-conflict' },
    );
    expect(conflictHttp.status).toBe(409);
    expect(conflictHttp.json.code).toBe('FACT_CONFLICT');
    expect(JSON.stringify(conflictHttp.json)).not.toMatch(/at |\bSQL\b|relation |stack/i);
    expect(JSON.stringify(conflictHttp.json)).not.toMatch(/synthetic headache|सिरदर्द/);
  }, 180_000);

  it('serializes concurrent supersession, replay, insert rollback, and concealed mismatch', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const facts = factService();
    const repo = new PgFactCandidateRepository();
    const SUPERSESSION_RACE_ROUNDS = 12;

    async function raceSupersession(round: number): Promise<void> {
      const { consultationId } = await openConsultation(doctorA);
      const first = await facts.materialize(
        doctorA,
        consultationId,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          idempotencyKey: `fact-super-round-${round}-seed`,
        },
        factEnv,
      );
      await intake.patch(
        doctorA,
        consultationId,
        { chiefComplaintText: `synthetic race correction ${round}` },
        env,
      );
      const raced = await Promise.allSettled([
        facts.materialize(
          doctorA,
          consultationId,
          {
            sourceChannel: 'DOCTOR_DECLARED',
            sourceField: 'CHIEF_COMPLAINT',
            supersedesFactId: first.id,
            idempotencyKey: `fact-super-round-${round}-a`,
          },
          factEnv,
        ),
        facts.materialize(
          doctorA,
          consultationId,
          {
            sourceChannel: 'DOCTOR_DECLARED',
            sourceField: 'CHIEF_COMPLAINT',
            supersedesFactId: first.id,
            idempotencyKey: `fact-super-round-${round}-b`,
          },
          factEnv,
        ),
      ]);
      expect(raced.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(raced.filter((r) => r.status === 'rejected')).toHaveLength(1);
      const rejected = raced.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejected.reason).toBeInstanceOf(FactConflictError);
      const listed = await facts.list(doctorA, consultationId, factEnv);
      const cc = listed.filter((f) => f.sourceField === 'CHIEF_COMPLAINT');
      expect(cc.filter((f) => f.decisionStatus === 'ACTIVE')).toHaveLength(1);
      expect(cc.filter((f) => f.decisionStatus === 'SUPERSEDED')).toHaveLength(1);
      expect(cc.filter((f) => f.id === first.id && f.decisionStatus === 'SUPERSEDED')).toHaveLength(
        1,
      );
    }

    for (let round = 0; round < SUPERSESSION_RACE_ROUNDS; round += 1) {
      await raceSupersession(round);
    }

    const { consultationId: replayConsultation } = await openConsultation(doctorA);
    const seed = await facts.materialize(
      doctorA,
      replayConsultation,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'fact-super-replay-seed',
      },
      factEnv,
    );
    await intake.patch(
      doctorA,
      replayConsultation,
      { chiefComplaintText: 'synthetic supersession replay' },
      env,
    );
    const created = await facts.materialize(
      doctorA,
      replayConsultation,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        supersedesFactId: seed.id,
        idempotencyKey: 'fact-super-replay-same',
      },
      factEnv,
    );
    const replayed = await facts.materialize(
      doctorA,
      replayConsultation,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        supersedesFactId: seed.id,
        idempotencyKey: 'fact-super-replay-same',
      },
      factEnv,
    );
    expect(replayed.id).toBe(created.id);
    await expect(
      facts.materialize(
        doctorA,
        replayConsultation,
        {
          sourceChannel: 'STRUCTURED_INTAKE',
          sourceField: 'VITAL_PULSE',
          idempotencyKey: 'fact-super-replay-same',
        },
        factEnv,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });

    const { consultationId: insertFailConsultation } = await openConsultation(doctorA);
    const beforeInsert = await facts.materialize(
      doctorA,
      insertFailConsultation,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'fact-insert-fail-seed',
      },
      factEnv,
    );
    await intake.patch(
      doctorA,
      insertFailConsultation,
      { chiefComplaintText: 'synthetic insert rollback' },
      env,
    );
    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await repo.lockIdentity(tx, beforeInsert.sourceIdentityFingerprint);
          const active = await repo.findActiveByIdentity(
            doctorA,
            tx,
            beforeInsert.sourceIdentityFingerprint,
          );
          if (!active) throw new Error('BLOCKED: expected active candidate before insert failure');
          await repo.supersedeActive(doctorA, tx, active.id);
          const invalid: InsertFactCandidateInput = {
            ...insertFrom(beforeInsert),
            factCategory: 'PROCEDURE' as InsertFactCandidateInput['factCategory'],
            originalSourceSpan: 'synthetic insert rollback',
            assertedText: 'synthetic insert rollback',
            supersedesFactId: active.id,
            contentFingerprint: 'a'.repeat(64),
          };
          await repo.insert(doctorA, tx, invalid);
        },
        env,
      ),
    ).rejects.toMatchObject({ message: 'INVALID_FACT_CANDIDATE' });
    const afterInsertFail = await facts.list(doctorA, insertFailConsultation, factEnv);
    expect(afterInsertFail).toHaveLength(1);
    expect(afterInsertFail[0]?.id).toBe(beforeInsert.id);
    expect(afterInsertFail[0]?.decisionStatus).toBe('ACTIVE');
    expect(afterInsertFail.filter((f) => f.decisionStatus === 'SUPERSEDED')).toHaveLength(0);

    const mismatch = await facts
      .materialize(
        doctorB,
        insertFailConsultation,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          supersedesFactId: beforeInsert.id,
          idempotencyKey: 'fact-tenant-mismatch',
        },
        factEnv,
      )
      .catch((err: unknown) => err);
    expect(mismatch).toBeInstanceOf(ResourceNotFoundError);
    const app = appFor(doctorB, evidenceService(), facts);
    const concealed = await httpJson(
      app,
      'POST',
      `${EHAS2_API_NAMESPACE}/consultations/${insertFailConsultation}/fact-candidates/materialize`,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        supersedesFactId: beforeInsert.id,
      },
      { 'Idempotency-Key': 'fact-tenant-mismatch-http' },
    );
    expect(concealed.status).toBe(404);
    expect(concealed.json.code).toBe('NOT_FOUND');
    expect(JSON.stringify(concealed.json)).not.toMatch(/at |\bSQL\b|relation |stack/i);
    expect(JSON.stringify(concealed.json)).not.toMatch(/synthetic insert rollback|सिरदर्द/);
  }, 180_000);

  it('stays disconnected without the non-production flag and in production', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const facts = factService();
    const { consultationId } = await openConsultation(doctorA);
    await expect(facts.list(doctorA, consultationId, env)).rejects.toMatchObject({
      message: 'FACT_CANDIDATES_NOT_CONNECTED',
    });
    await expect(
      facts.materialize(
        doctorA,
        consultationId,
        {
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          idempotencyKey: 'fact-prod',
        },
        { ...factEnv, NODE_ENV: 'production', EHAS2_NODE_ENV: 'production' },
      ),
    ).rejects.toMatchObject({ message: 'FACT_CANDIDATES_NOT_CONNECTED' });
  });
});
