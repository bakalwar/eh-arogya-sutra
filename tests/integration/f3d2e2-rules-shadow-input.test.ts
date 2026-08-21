import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  ConsultationIntakeService,
  ConsultationService,
  EMPTY_FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_FINGERPRINT,
  FactAnalysisAcceptanceService,
  FactCandidateService,
  FactNormalizationService,
  FactVerificationService,
  PatientService,
  PgMembershipRepository,
  PgOrganizationRepository,
  PgUserRepository,
  ResourceNotFoundError,
  ValidationError,
  buildRulesShadowInput,
  closePool,
  lockAndSupersedeFactAnalysisAcceptances,
  migrateUp,
  resetDatabaseSchema,
  withAdminClient,
  withTenantTransaction,
  type TenantContext,
} from '../../packages/database/src/index.ts';
import { recordEvidenceEvent } from '../../packages/observability/src/index.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2e2_test');
const factEnv = { ...env, EHAS2_F3D_FACT_CANDIDATES: '1' };
const EMPTY_FP = EMPTY_FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_FINGERPRINT;
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const norms = new FactNormalizationService();
const d5 = new FactVerificationService({ onSafeMetric: recordEvidenceEvent });
const e1 = new FactAnalysisAcceptanceService({ onSafeMetric: recordEvidenceEvent });

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
  if (!dbReady) throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2E2 tests');
}

function fp(label: string): string {
  return createHash('sha256').update(label, 'utf8').digest('hex');
}

async function seedDoctor(): Promise<{
  doctor: TenantContext;
  otherDoctor: TenantContext;
  clinicAdmin: TenantContext;
}> {
  const users = new PgUserRepository();
  const orgs = new PgOrganizationRepository();
  const memberships = new PgMembershipRepository();
  return withAdminClient(async (query) => {
    const treating = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2E2 Treating Doctor',
        actorId: '00000000-0000-4000-8000-0000000007e1',
      },
    );
    const organization = await orgs.create(
      { query },
      { name: 'Synthetic F3D2E2 Org', actorId: treating.id },
    );
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [organization.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const clinic = await orgs.createClinic(
      { query },
      { organizationId: organization.id, name: 'Synthetic F3D2E2 Clinic', actorId: treating.id },
    );
    await query('COMMIT');
    const treatingMembership = await memberships.create(
      { query },
      {
        userId: treating.id,
        organizationId: organization.id,
        clinicId: clinic.id,
        status: 'ACTIVE',
        actorId: treating.id,
      },
    );
    await memberships.assignRole(
      { query },
      { membershipId: treatingMembership.id, roleCode: 'Doctor' },
    );
    const other = await users.create(
      { query },
      {
        displayName: 'Synthetic F3D2E2 Other Doctor',
        actorId: '00000000-0000-4000-8000-0000000007e2',
      },
    );
    const otherMembership = await memberships.create(
      { query },
      {
        userId: other.id,
        organizationId: organization.id,
        clinicId: clinic.id,
        status: 'ACTIVE',
        actorId: treating.id,
      },
    );
    await memberships.assignRole(
      { query },
      { membershipId: otherMembership.id, roleCode: 'Doctor' },
    );
    const doctor: TenantContext = {
      organizationId: organization.id,
      clinicId: clinic.id,
      actorId: treating.id,
      actorRole: 'Doctor',
      membershipStatus: 'ACTIVE',
      allowPatientPhi: true,
    };
    return {
      doctor,
      otherDoctor: { ...doctor, actorId: other.id },
      clinicAdmin: { ...doctor, actorRole: 'ClinicAdmin' },
    };
  }, env);
}

function factService(): FactCandidateService {
  return new FactCandidateService({ onSafeMetric: recordEvidenceEvent });
}

async function openChiefFact(doctor: TenantContext, label: string, chief = 'denies fever') {
  const patient = await patients.create(
    doctor,
    { displayName: `Synthetic ${label}`, dateOfBirth: '1990-01-01' },
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
    { chiefComplaintText: chief, idempotencyKey: `e2-patch-${label}-${consultation.id}` },
    env,
  );
  const fact = await factService().materialize(
    doctor,
    consultation.id,
    {
      sourceChannel: 'DOCTOR_DECLARED',
      sourceField: 'CHIEF_COMPLAINT',
      idempotencyKey: `e2-fact-${label}-${consultation.id}`,
    },
    factEnv,
  );
  return { patient, consultation, fact };
}

async function prepareAccepted(doctor: TenantContext, label: string, chief?: string) {
  const opened = await openChiefFact(doctor, label, chief);
  const normalized = await norms.materializeFactNormalizations(
    doctor,
    {
      sourceFactCandidateId: opened.fact.id,
      idempotencyKey: `e2-norm-${label}-${opened.fact.id}`,
    },
    env,
  );
  const verification = await d5.reviewSourceLinkedFact(
    doctor,
    {
      factCandidateId: opened.fact.id,
      action: 'ACCEPT_SOURCE_LINKED_FACT',
      reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
      idempotencyKey: `e2-d5-${label}-${opened.fact.id}`,
    },
    env,
  );
  const acceptance = await e1.materializeFactAnalysisAcceptance(
    doctor,
    {
      sourceFactCandidateId: opened.fact.id,
      idempotencyKey: `e2-accept-${label}-${opened.fact.id}`,
    },
    env,
  );
  return { ...opened, normalized, verification, acceptance };
}

async function prepareEmptyAccepted(doctor: TenantContext, label: string) {
  const opened = await openChiefFact(doctor, label, `zzzz no cue match ${label}`);
  const verification = await d5.reviewSourceLinkedFact(
    doctor,
    {
      factCandidateId: opened.fact.id,
      action: 'ACCEPT_SOURCE_LINKED_FACT',
      reasonCode: 'SOURCE_REPRESENTATION_REVIEWED',
      idempotencyKey: `e2-empty-d5-${label}-${opened.fact.id}`,
    },
    env,
  );
  const acceptance = await e1.materializeFactAnalysisAcceptance(
    doctor,
    {
      sourceFactCandidateId: opened.fact.id,
      idempotencyKey: `e2-empty-acc-${label}-${opened.fact.id}`,
    },
    env,
  );
  return { ...opened, verification, acceptance };
}

/** Bulk-seed N empty-snapshot ACTIVE E1 facts on one consultation (cap tests). */
async function seedEmptyAcceptedFacts(
  doctor: TenantContext,
  consultationId: string,
  patientId: string,
  count: number,
  prefix: string,
): Promise<void> {
  await withTenantTransaction(
    doctor,
    async (tx) => {
      for (let i = 0; i < count; i++) {
        const sourceIdentity = fp(`${prefix}-src-${i}`);
        const content = fp(`${prefix}-content-${i}`);
        const factIns = await tx.query(
          `INSERT INTO clinical_fact_candidates (
             organization_id, clinic_id, patient_id, consultation_id,
             source_channel, source_field, fact_category, negated,
             original_source_span, asserted_text, asserted_value, unit_text, unit_posture,
             duration_text, onset_text, source_identity_fingerprint, content_fingerprint,
             confidence, normalization_method, normalization_version, normalization_fingerprint,
             authority_status, decision_status, clinically_used, actor_id, actor_role,
             limitation_codes, intake_symptom_id, evidence_item_id, extraction_run_id,
             extraction_candidate_id, review_event_id, source_locator
           ) VALUES (
             $1,$2,$3,$4,
             'DOCTOR_DECLARED','CHIEF_COMPLAINT','SYMPTOM',false,
             'span',NULL,NULL,NULL,'NOT_APPLICABLE',
             NULL,NULL,$5,$6,
             NULL,'NONE','none','793676c471de3ea0d266c258cea95db43195c82702c8642269d17cc2b57dad7a',
             'FACT_CANDIDATE_UNVERIFIED','ACTIVE',false,$7,'Doctor',
             ARRAY['SYNTHETIC_FIXTURE_ONLY','NOT_AUTHORITATIVE','NO_CLINICAL_VERIFICATION']::text[],
             NULL,NULL,NULL,NULL,NULL,NULL
           ) RETURNING id`,
          [
            doctor.organizationId,
            doctor.clinicId,
            patientId,
            consultationId,
            sourceIdentity,
            content,
            doctor.actorId,
          ],
        );
        const factId = String(factIns.rows[0].id);
        const d5Ins = await tx.query(
          `INSERT INTO clinical_fact_verification_events (
             organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
             source_channel, source_field, source_identity_fingerprint, content_fingerprint,
             normalization_snapshot_fingerprint, normalization_count,
             action, authority_scope, reason_code, decision_status, supersedes_verification_id,
             actor_id, actor_role, clinically_used
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,
             'ACCEPT_SOURCE_LINKED_FACT','SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY',
             'SOURCE_REPRESENTATION_REVIEWED','ACTIVE',NULL,$11,'Doctor',false
           ) RETURNING id`,
          [
            doctor.organizationId,
            doctor.clinicId,
            patientId,
            consultationId,
            factId,
            'DOCTOR_DECLARED',
            'CHIEF_COMPLAINT',
            sourceIdentity,
            content,
            EMPTY_FP,
            doctor.actorId,
          ],
        );
        const d5Id = String(d5Ins.rows[0].id);
        await tx.query(
          `INSERT INTO clinical_fact_analysis_acceptance_events (
             organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
             source_channel, source_field, source_identity_fingerprint, content_fingerprint,
             verification_event_id, normalization_snapshot_fingerprint, normalization_count,
             action, authority_scope, reason_code, decision_status, supersedes_acceptance_id,
             actor_id, actor_role, clinically_used, acceptance_contract_version,
             pack_id, pack_version, pack_content_checksum, parser_version, parser_fingerprint,
             normalizer_method, normalizer_version, normalizer_fingerprint
           ) VALUES (
             $1,$2,$3,$4,$5,'DOCTOR_DECLARED','CHIEF_COMPLAINT',$6,$7,$8,$9,0,
             'ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY','SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY',
             'SOURCE_LINKED_FACT_ANALYSIS_ACCEPTED','ACTIVE',NULL,$10,'Doctor',false,
             'f3d2e1-analysis-acceptance-v1',
             'synthetic-pack','1',$11,'none',$12,
             'OWNER_FROZEN_SOURCE_PRESERVING_V1','f3d2d2-src-norm-v1',$13
           )`,
          [
            doctor.organizationId,
            doctor.clinicId,
            patientId,
            consultationId,
            factId,
            sourceIdentity,
            content,
            d5Id,
            EMPTY_FP,
            doctor.actorId,
            fp(`${prefix}-pack-${i}`),
            fp(`${prefix}-parser-${i}`),
            fp(`${prefix}-normer-${i}`),
          ],
        );
      }
    },
    env,
  );
}

async function withTriggerBypass(
  doctor: TenantContext,
  fn: (
    query: (
      sql: string,
      params?: unknown[],
    ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>,
  ) => Promise<void>,
): Promise<void> {
  await withAdminClient(async (query) => {
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [doctor.organizationId]);
    await query(`SELECT set_config('ehas2.clinic_id', $1, true)`, [doctor.clinicId]);
    await query(`SELECT set_config('session_replication_role', 'replica', true)`);
    try {
      await fn(async (sql, params = []) => {
        const result = await query(sql, params);
        return {
          rows: result.rows as Record<string, unknown>[],
          rowCount: result.rowCount ?? null,
        };
      });
      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  }, env);
}

async function countWrites(
  doctor: TenantContext,
  consultationId: string,
): Promise<{ facts: number; e1: number; d5: number; norms: number }> {
  return withTenantTransaction(
    doctor,
    async (tx) => {
      const facts = await tx.query(
        `SELECT count(*)::int AS c FROM clinical_fact_candidates WHERE consultation_id=$1`,
        [consultationId],
      );
      const e1c = await tx.query(
        `SELECT count(*)::int AS c FROM clinical_fact_analysis_acceptance_events WHERE consultation_id=$1`,
        [consultationId],
      );
      const d5c = await tx.query(
        `SELECT count(*)::int AS c FROM clinical_fact_verification_events WHERE consultation_id=$1`,
        [consultationId],
      );
      const nc = await tx.query(
        `SELECT count(*)::int AS c FROM clinical_fact_normalizations WHERE consultation_id=$1`,
        [consultationId],
      );
      return {
        facts: Number(facts.rows[0].c),
        e1: Number(e1c.rows[0].c),
        d5: Number(d5c.rows[0].c),
        norms: Number(nc.rows[0].c),
      };
    },
    env,
  );
}

describe('F3D-2E2 rules-shadow-input builder (isolated PG)', () => {
  it('1 treating Doctor builds a DTO', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'ok');
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dto.authorityScope).toBe('SOURCE_LINKED_FACT_RULES_SHADOW_INPUT_ONLY');
    expect(result.dto.clinicallyUsed).toBe(false);
    expect(result.dto.consultationId).toBe(p.consultation.id);
    expect(result.dto.treatingDoctorId).toBe(doctor.actorId);
    expect(result.dto.facts).toHaveLength(1);
    expect(result.dto.facts[0]?.acceptanceEventId).toBe(p.acceptance.id);
    expect(result.dto.facts[0]?.verificationEventId).toBe(p.verification.id);
    expect(result.dto.consultationInputFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('2 ClinicAdmin denied', async () => {
    requireDb();
    const { doctor, clinicAdmin } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'admin');
    await expect(
      buildRulesShadowInput(clinicAdmin, { consultationId: p.consultation.id }, env),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('3 non-treating Doctor denied', async () => {
    requireDb();
    const { doctor, otherDoctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'other');
    await expect(
      buildRulesShadowInput(otherDoctor, { consultationId: p.consultation.id }, env),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('4 cross-tenant consultation concealed', async () => {
    requireDb();
    const a = await seedDoctor();
    const b = await seedDoctor();
    const p = await prepareAccepted(a.doctor, 'xtenant');
    await expect(
      buildRulesShadowInput(b.doctor, { consultationId: p.consultation.id }, env),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('5 closed input rejects unknown fields', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'closed');
    await expect(
      buildRulesShadowInput(
        doctor,
        { consultationId: p.consultation.id, patientId: p.patient.id } as never,
        env,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('6 only ACTIVE E1 included; 7 SUPERSEDED all-or-none STALE', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'active-only');
    await withTenantTransaction(
      doctor,
      async (tx) => {
        await lockAndSupersedeFactAnalysisAcceptances(doctor, tx, [p.fact.id]);
      },
      env,
    );
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result).toEqual({ ok: false, reasonCode: 'NO_ELIGIBLE_FACTS' });
  });

  it('8 stale fact rejected', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'stale-fact');
    await withTriggerBypass(doctor, async (query) => {
      await query(
        `UPDATE clinical_fact_candidates SET decision_status='SUPERSEDED'
         WHERE id=$1 AND organization_id=$2 AND clinic_id=$3`,
        [p.fact.id, doctor.organizationId, doctor.clinicId],
      );
    });
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result).toEqual({ ok: false, reasonCode: 'STALE_INPUT' });
  });

  it('9 stale D5 rejected', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'stale-d5');
    await withTriggerBypass(doctor, async (query) => {
      await query(
        `UPDATE clinical_fact_verification_events SET decision_status='SUPERSEDED'
         WHERE id=$1 AND organization_id=$2 AND clinic_id=$3`,
        [p.verification.id, doctor.organizationId, doctor.clinicId],
      );
    });
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result).toEqual({ ok: false, reasonCode: 'STALE_INPUT' });
  });

  it('10 changed normalization snapshot rejected', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareEmptyAccepted(doctor, 'snap-change');
    await withTriggerBypass(doctor, async (query) => {
      await query(
        `INSERT INTO clinical_fact_normalizations (
           organization_id, clinic_id, patient_id, consultation_id, source_fact_candidate_id,
           source_identity_fingerprint, normalization_identity_fingerprint,
           source_channel, source_field, normalization_kind, canonical_label, negation_scope,
           cue_entry_ids, pack_id, pack_version, pack_content_checksum,
           parser_version, parser_fingerprint, normalizer_method, normalizer_version,
           normalizer_fingerprint, authority_scope, decision_status, supersedes_normalization_id,
           limitation_codes, clinically_used, actor_id, actor_role
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,
           'DOCTOR_DECLARED','CHIEF_COMPLAINT','NEGATION_CUE','denies','SCOPE_UNRESOLVED',
           ARRAY[]::text[],'pack','1',$8,'none',$9,
           'OWNER_FROZEN_SOURCE_PRESERVING_V1','f3d2d2-src-norm-v1',$10,
           'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE',NULL,
           ARRAY['NOT_AUTHORITATIVE','NO_CLINICAL_VERIFICATION','SOURCE_LINKED_NORMALIZATION_ONLY']::text[],
           false,$11,'Doctor'
         )`,
        [
          doctor.organizationId,
          doctor.clinicId,
          p.patient.id,
          p.consultation.id,
          p.fact.id,
          p.fact.sourceIdentityFingerprint,
          fp('extra-norm-identity'),
          fp('pack'),
          fp('parser'),
          fp('normer'),
          doctor.actorId,
        ],
      );
    });
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(['INPUT_BINDING_INVALID', 'STALE_INPUT']).toContain(result.reasonCode);
  });

  it('11 missing/wrong consultation concealed; patient binding enforced in builder', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    await prepareAccepted(doctor, 'link');
    await expect(
      buildRulesShadowInput(
        doctor,
        { consultationId: '00000000-0000-4000-8000-000000000099' },
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    const service = fs.readFileSync(
      path.resolve(process.cwd(), 'packages/database/src/services/rulesShadowInputService.ts'),
      'utf8',
    );
    expect(service).toMatch(/parent\.patientId !== consultation\.patientId/);
    expect(service).toMatch(/acceptance\.patientId !== consultation\.patientId/);
  });

  it('12 zero eligible facts → NO_ELIGIBLE_FACTS', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const opened = await openChiefFact(doctor, 'none');
    const result = await buildRulesShadowInput(
      doctor,
      { consultationId: opened.consultation.id },
      env,
    );
    expect(result).toEqual({ ok: false, reasonCode: 'NO_ELIGIBLE_FACTS' });
  });

  it('13 one fact deterministic DTO; 28 repeat identical', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'det');
    const a = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    const b = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(a).toEqual(b);
    expect(a.ok).toBe(true);
  });

  it('14-15 multiple facts deterministic order independent of insert order', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const first = await prepareEmptyAccepted(doctor, 'ord-a');
    await seedEmptyAcceptedFacts(
      doctor,
      first.consultation.id,
      first.patient.id,
      2,
      `ord-${first.consultation.id}`,
    );
    const result = await buildRulesShadowInput(
      doctor,
      { consultationId: first.consultation.id },
      env,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dto.facts.length).toBeGreaterThanOrEqual(3);
    const ids = result.dto.facts.map((f) => f.factCandidateId);
    const sorted = [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    // full order is channel→field→factId→acceptanceId; all same channel/field so factId order
    const byFact = [...result.dto.facts].sort((a, b) =>
      a.factCandidateId < b.factCandidateId ? -1 : a.factCandidateId > b.factCandidateId ? 1 : 0,
    );
    expect(result.dto.facts.map((f) => f.factCandidateId)).toEqual(
      byFact.map((f) => f.factCandidateId),
    );
    expect(ids).toEqual(sorted);
  });

  it('16 one fact with zero norms remains exactly bound', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareEmptyAccepted(doctor, 'zero-norm');
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dto.facts[0]?.normalizedSignals).toEqual([]);
    expect(result.dto.facts[0]?.normalizationSnapshotFingerprint).toBe(EMPTY_FP);
  });

  it('17 multiple norms deterministic', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'multi-norm');
    const first = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    const second = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(first.ok).toBe(true);
    expect(second).toEqual(first);
    if (!first.ok) return;
    const signals = first.dto.facts[0]?.normalizedSignals ?? [];
    for (let i = 1; i < signals.length; i += 1) {
      const prev = signals[i - 1]!;
      const cur = signals[i]!;
      const keyOf = (s: (typeof signals)[number]) =>
        [
          s.normalizationKind,
          s.canonicalLabel,
          s.normalizationIdentityFingerprint,
          s.normalizationId,
        ].join('\0');
      expect(keyOf(prev) <= keyOf(cur)).toBe(true);
    }
  });

  it('18 duplicate/incompatible representation → CONTRADICTORY_INPUT', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const opened = await openChiefFact(doctor, 'contra-base', 'zzzz contra base');
    const sharedContent = fp(`contra-shared-${opened.consultation.id}`);
    await withTenantTransaction(
      doctor,
      async (tx) => {
        for (const label of ['a', 'b']) {
          const sourceIdentity = fp(`contra-src-${opened.consultation.id}-${label}`);
          const factIns = await tx.query(
            `INSERT INTO clinical_fact_candidates (
               organization_id, clinic_id, patient_id, consultation_id,
               source_channel, source_field, fact_category, negated,
               original_source_span, asserted_text, asserted_value, unit_text, unit_posture,
               duration_text, onset_text, source_identity_fingerprint, content_fingerprint,
               confidence, normalization_method, normalization_version, normalization_fingerprint,
               authority_status, decision_status, clinically_used, actor_id, actor_role,
               limitation_codes, intake_symptom_id, evidence_item_id, extraction_run_id,
               extraction_candidate_id, review_event_id, source_locator
             ) VALUES (
               $1,$2,$3,$4,
               'DOCTOR_DECLARED','CHIEF_COMPLAINT','SYMPTOM',false,
               'span',NULL,NULL,NULL,'NOT_APPLICABLE',
               NULL,NULL,$5,$6,
               NULL,'NONE','none','793676c471de3ea0d266c258cea95db43195c82702c8642269d17cc2b57dad7a',
               'FACT_CANDIDATE_UNVERIFIED','ACTIVE',false,$7,'Doctor',
               ARRAY['SYNTHETIC_FIXTURE_ONLY','NOT_AUTHORITATIVE','NO_CLINICAL_VERIFICATION']::text[],
               NULL,NULL,NULL,NULL,NULL,NULL
             ) RETURNING id`,
            [
              doctor.organizationId,
              doctor.clinicId,
              opened.patient.id,
              opened.consultation.id,
              sourceIdentity,
              sharedContent,
              doctor.actorId,
            ],
          );
          const factId = String(factIns.rows[0].id);
          const d5Ins = await tx.query(
            `INSERT INTO clinical_fact_verification_events (
               organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
               source_channel, source_field, source_identity_fingerprint, content_fingerprint,
               normalization_snapshot_fingerprint, normalization_count,
               action, authority_scope, reason_code, decision_status, supersedes_verification_id,
               actor_id, actor_role, clinically_used
             ) VALUES (
               $1,$2,$3,$4,$5,'DOCTOR_DECLARED','CHIEF_COMPLAINT',$6,$7,$8,0,
               'ACCEPT_SOURCE_LINKED_FACT','SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY',
               'SOURCE_REPRESENTATION_REVIEWED','ACTIVE',NULL,$9,'Doctor',false
             ) RETURNING id`,
            [
              doctor.organizationId,
              doctor.clinicId,
              opened.patient.id,
              opened.consultation.id,
              factId,
              sourceIdentity,
              sharedContent,
              EMPTY_FP,
              doctor.actorId,
            ],
          );
          await tx.query(
            `INSERT INTO clinical_fact_analysis_acceptance_events (
               organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
               source_channel, source_field, source_identity_fingerprint, content_fingerprint,
               verification_event_id, normalization_snapshot_fingerprint, normalization_count,
               action, authority_scope, reason_code, decision_status, supersedes_acceptance_id,
               actor_id, actor_role, clinically_used, acceptance_contract_version,
               pack_id, pack_version, pack_content_checksum, parser_version, parser_fingerprint,
               normalizer_method, normalizer_version, normalizer_fingerprint
             ) VALUES (
               $1,$2,$3,$4,$5,'DOCTOR_DECLARED','CHIEF_COMPLAINT',$6,$7,$8,$9,0,
               'ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY','SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY',
               'SOURCE_LINKED_FACT_ANALYSIS_ACCEPTED','ACTIVE',NULL,$10,'Doctor',false,
               'f3d2e1-analysis-acceptance-v1',
               'synthetic-pack','1',$11,'none',$12,
               'OWNER_FROZEN_SOURCE_PRESERVING_V1','f3d2d2-src-norm-v1',$13
             )`,
            [
              doctor.organizationId,
              doctor.clinicId,
              opened.patient.id,
              opened.consultation.id,
              factId,
              sourceIdentity,
              sharedContent,
              String(d5Ins.rows[0].id),
              EMPTY_FP,
              doctor.actorId,
              fp(`contra-pack-${label}`),
              fp(`contra-parser-${label}`),
              fp(`contra-normer-${label}`),
            ],
          );
        }
      },
      env,
    );
    const result = await buildRulesShadowInput(
      doctor,
      { consultationId: opened.consultation.id },
      env,
    );
    expect(result).toEqual({ ok: false, reasonCode: 'CONTRADICTORY_INPUT' });
  });

  it('20-21 128 facts accepted; 129 fail closed', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const base = await prepareEmptyAccepted(doctor, 'cap128');
    await seedEmptyAcceptedFacts(
      doctor,
      base.consultation.id,
      base.patient.id,
      127,
      `cap128-${base.consultation.id}`,
    );
    const ok = await buildRulesShadowInput(doctor, { consultationId: base.consultation.id }, env);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.dto.facts).toHaveLength(128);

    await seedEmptyAcceptedFacts(
      doctor,
      base.consultation.id,
      base.patient.id,
      1,
      `cap129-${base.consultation.id}`,
    );
    const overflow = await buildRulesShadowInput(
      doctor,
      { consultationId: base.consultation.id },
      env,
    );
    expect(overflow).toEqual({ ok: false, reasonCode: 'FACT_CAP_OVERFLOW' });
  }, 180_000);

  it('22-23 32 norms/fact accepted path via empty; 33 norms fail closed', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareEmptyAccepted(doctor, 'norm33');
    await withTriggerBypass(doctor, async (query) => {
      for (let i = 0; i < 33; i++) {
        await query(
          `INSERT INTO clinical_fact_normalizations (
             organization_id, clinic_id, patient_id, consultation_id, source_fact_candidate_id,
             source_identity_fingerprint, normalization_identity_fingerprint,
             source_channel, source_field, normalization_kind, canonical_label, negation_scope,
             cue_entry_ids, pack_id, pack_version, pack_content_checksum,
             parser_version, parser_fingerprint, normalizer_method, normalizer_version,
             normalizer_fingerprint, authority_scope, decision_status, supersedes_normalization_id,
             limitation_codes, clinically_used, actor_id, actor_role
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,
             'DOCTOR_DECLARED','CHIEF_COMPLAINT','UNIT_ALIAS',$8,NULL,
             ARRAY[]::text[],'pack','1',$9,'none',$10,
             'OWNER_FROZEN_SOURCE_PRESERVING_V1','f3d2d2-src-norm-v1',$11,
             'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE',NULL,
             ARRAY['NOT_AUTHORITATIVE','NO_CLINICAL_VERIFICATION','SOURCE_LINKED_NORMALIZATION_ONLY','NO_UNIT_CONVERSION']::text[],
             false,$12,'Doctor'
           )`,
          [
            doctor.organizationId,
            doctor.clinicId,
            p.patient.id,
            p.consultation.id,
            p.fact.id,
            p.fact.sourceIdentityFingerprint,
            fp(`n33-${i}`),
            `u${i}`,
            fp('pack33'),
            fp('parser33'),
            fp('normer33'),
            doctor.actorId,
          ],
        );
      }
    });
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result).toEqual({ ok: false, reasonCode: 'NORM_PER_FACT_OVERFLOW' });
  });

  it('24-25 total norm caps 512/513', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const base = await prepareEmptyAccepted(doctor, 'tot512');
    await seedEmptyAcceptedFacts(
      doctor,
      base.consultation.id,
      base.patient.id,
      16,
      `tot-${base.consultation.id}`,
    );
    const factIds = await withTenantTransaction(
      doctor,
      async (tx) => {
        const r = await tx.query(
          `SELECT id, source_identity_fingerprint AS sfp FROM clinical_fact_candidates
           WHERE consultation_id=$1 AND organization_id=$2 AND clinic_id=$3
           ORDER BY id`,
          [base.consultation.id, doctor.organizationId, doctor.clinicId],
        );
        return r.rows as { id: string; sfp: string }[];
      },
      env,
    );
    await withTriggerBypass(doctor, async (query) => {
      for (const row of factIds) {
        for (let i = 0; i < 31; i++) {
          await query(
            `INSERT INTO clinical_fact_normalizations (
               organization_id, clinic_id, patient_id, consultation_id, source_fact_candidate_id,
               source_identity_fingerprint, normalization_identity_fingerprint,
               source_channel, source_field, normalization_kind, canonical_label, negation_scope,
               cue_entry_ids, pack_id, pack_version, pack_content_checksum,
               parser_version, parser_fingerprint, normalizer_method, normalizer_version,
               normalizer_fingerprint, authority_scope, decision_status, supersedes_normalization_id,
               limitation_codes, clinically_used, actor_id, actor_role
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$7,
               'DOCTOR_DECLARED','CHIEF_COMPLAINT','UNIT_ALIAS',$8,NULL,
               ARRAY[]::text[],'pack','1',$9,'none',$10,
               'OWNER_FROZEN_SOURCE_PRESERVING_V1','f3d2d2-src-norm-v1',$11,
               'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE',NULL,
               ARRAY['NOT_AUTHORITATIVE','NO_CLINICAL_VERIFICATION','SOURCE_LINKED_NORMALIZATION_ONLY','NO_UNIT_CONVERSION']::text[],
               false,$12,'Doctor'
             )`,
            [
              doctor.organizationId,
              doctor.clinicId,
              base.patient.id,
              base.consultation.id,
              row.id,
              row.sfp,
              fp(`tot-${row.id}-${i}`),
              `t${i}`,
              fp('packtot'),
              fp('parsertot'),
              fp('normertot'),
              doctor.actorId,
            ],
          );
        }
      }
    });
    const overflow = await buildRulesShadowInput(
      doctor,
      { consultationId: base.consultation.id },
      env,
    );
    expect(overflow).toEqual({ ok: false, reasonCode: 'TOTAL_NORM_CAP_OVERFLOW' });
  }, 180_000);

  it('29 no source text/OCR/span/path leak in DTO', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'phi');
    const result = await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const json = JSON.stringify(result.dto);
    expect(json).not.toMatch(/denies fever|chiefComplaint|assertedText|object_key|ocr/i);
  });

  it('30 no database writes', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'nowrite');
    const before = await countWrites(doctor, p.consultation.id);
    await buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env);
    const after = await countWrites(doctor, p.consultation.id);
    expect(after).toEqual(before);
  });

  it('31 concurrent supersession cannot produce torn mixed DTO', async () => {
    requireDb();
    const { doctor } = await seedDoctor();
    const p = await prepareAccepted(doctor, 'conc');
    const results = await Promise.all([
      buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env),
      withTenantTransaction(
        doctor,
        async (tx) => {
          await lockAndSupersedeFactAnalysisAcceptances(doctor, tx, [p.fact.id]);
        },
        env,
      ).then(() => 'superseded' as const),
      buildRulesShadowInput(doctor, { consultationId: p.consultation.id }, env),
    ]);
    const builds = results.filter((r) => r !== 'superseded') as Awaited<
      ReturnType<typeof buildRulesShadowInput>
    >[];
    for (const r of builds) {
      if (r.ok) {
        expect(r.dto.facts.every((f) => f.decisionStatus === 'ACTIVE')).toBe(true);
        expect(r.dto.facts).toHaveLength(1);
      } else {
        expect(['NO_ELIGIBLE_FACTS', 'STALE_INPUT']).toContain(r.reasonCode);
      }
    }
  });

  it('33 /ready unchanged; 34 migration tip 018; 35 no API callers', () => {
    const ready = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/src/createApp.ts'), 'utf8');
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).not.toMatch(/rulesShadowInput|f3d2e2/i);
    expect(
      fs.existsSync(
        path.resolve(
          process.cwd(),
          'packages/database/migrations/019_f3d2e2_rules_shadow_input.sql',
        ),
      ),
    ).toBe(false);
    const api = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/src/createApp.ts'), 'utf8');
    expect(api).not.toMatch(/buildRulesShadowInput/);
  });
});
