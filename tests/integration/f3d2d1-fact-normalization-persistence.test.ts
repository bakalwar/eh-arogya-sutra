import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';
import {
  ConsultationIntakeService,
  ConsultationService,
  FactCandidateService,
  FactConflictError,
  PatientService,
  PgFactNormalizationRepository,
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
import type { InsertFactNormalizationInput } from '../../packages/database/src/repositories/factNormalization.ts';
import {
  recordEvidenceEvent,
  resetEvidenceMetrics,
} from '../../packages/observability/src/index.ts';
import { createApp } from '../../apps/api/src/createApp.ts';
import { isolatedPostgresTestEnv } from '../helpers/isolated-postgres-env.ts';

const env = isolatedPostgresTestEnv('ehas2_phase_f3d2d1_test');
const factEnv = {
  ...env,
  EHAS2_F3D_FACT_CANDIDATES: '1',
};
let dbReady = false;

const patients = new PatientService();
const consultations = new ConsultationService();
const intake = new ConsultationIntakeService();
const norms = new PgFactNormalizationRepository();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FP_A = 'a'.repeat(64);
const FP_B = 'b'.repeat(64);
const FP_C = 'c'.repeat(64);
const FP_PACK = 'd'.repeat(64);
const FP_PARSER = 'e'.repeat(64);
const FP_NORM = 'f'.repeat(64);

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
  if (!dbReady) {
    throw new Error('BLOCKED: isolated PostgreSQL unavailable for F3D-2D1 persistence tests');
  }
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
        displayName: 'Synthetic F3D2D1 Doctor A',
        actorId: '00000000-0000-4000-8000-0000000000d1',
      },
    );
    const oA = await orgs.create({ query }, { name: 'Synthetic F3D2D1 Org A', actorId: uA.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oA.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cA = await orgs.createClinic(
      { query },
      { organizationId: oA.id, name: 'Synthetic F3D2D1 Clinic A', actorId: uA.id },
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
        displayName: 'Synthetic F3D2D1 Doctor B',
        actorId: '00000000-0000-4000-8000-0000000000d2',
      },
    );
    const oB = await orgs.create({ query }, { name: 'Synthetic F3D2D1 Org B', actorId: uB.id });
    await query('BEGIN');
    await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [oB.id]);
    await query(`SELECT set_config('ehas2.clinic_id', '', true)`);
    const cB = await orgs.createClinic(
      { query },
      { organizationId: oB.id, name: 'Synthetic F3D2D1 Clinic B', actorId: uB.id },
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
  patientId: string;
}> {
  const patient = await patients.create(
    tenant,
    { displayName: 'Synthetic F3D2D1 Patient', dateOfBirth: '1980-01-15' },
    {},
    env,
  );
  const consultation = await consultations.create(
    tenant,
    { patientId: patient.id, chiefComplaintText: 'synthetic fever 2 days' },
    env,
  );
  await intake.patch(
    tenant,
    consultation.id,
    {
      chiefComplaintText: 'synthetic fever 2 days',
      chiefComplaintOnset: '2 days',
      chiefComplaintDuration: '2 days',
      vitals: { pulseBpm: 72 },
    },
    env,
  );
  return { consultationId: consultation.id, patientId: patient.id };
}

function baseNormInput(
  fact: { id: string },
  overrides: Partial<InsertFactNormalizationInput> = {},
): InsertFactNormalizationInput {
  return {
    sourceFactCandidateId: fact.id,
    normalizationIdentityFingerprint: FP_A,
    normalizationKind: 'DURATION_PHRASE',
    canonicalLabel: 'DURATION_2_DAYS',
    negationScope: null,
    cueEntryIds: ['cue-syn-001'],
    packId: 'owner-frozen-pack',
    packVersion: '1.0.0',
    packContentChecksum: FP_PACK,
    parserVersion: 'none',
    parserFingerprint: FP_PARSER,
    normalizerMethod: 'OWNER_FROZEN_SOURCE_PRESERVING_V1',
    normalizerVersion: '0.0.0-d1',
    normalizerFingerprint: FP_NORM,
    limitationCodes: [
      'NOT_AUTHORITATIVE',
      'NO_CLINICAL_VERIFICATION',
      'SOURCE_LINKED_NORMALIZATION_ONLY',
      'SYNTHETIC_FIXTURE_ONLY',
      'RECOMPUTE_CUES_FROM_SOURCE',
    ],
    supersedesNormalizationId: null,
    ...overrides,
  };
}

async function httpJson(
  app: ReturnType<typeof createApp>,
  method: string,
  pathName: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${pathName}`, {
      method,
      headers: { Accept: 'application/json' },
    });
    const json = (await res.json()) as Record<string, unknown>;
    return { status: res.status, json };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

describe('F3D-2D1 fact-normalization persistence foundation', () => {
  it('registers migration 016 and keeps readiness inactive', async () => {
    expect(getOrderedMigrationIds()).toContain('016_f3d2_fact_normalizations');
    expect(getOrderedMigrationIds()).toHaveLength(17);
    const sql = fs.readFileSync(
      path.join(root, 'packages/database/migrations/016_f3d2_fact_normalizations.sql'),
      'utf8',
    );
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/REVOKE DELETE ON clinical_fact_normalizations FROM ehas2_app/);
    expect(sql).toMatch(/clinical_fact_normalizations_parent_link_fk/);
    expect(sql).toMatch(/clinical_fact_candidates_016_norm_parent_uq/);
    expect(sql).not.toMatch(/ON DELETE CASCADE/);
    const app = createApp();
    const ready = await httpJson(app, 'GET', '/ready');
    expect(ready.status).toBe(503);
    expect(ready.json.ready).toBe(false);
    expect(ready.json.normalizationParserAvailable).toBe(false);
    expect(ready.json.cueParserConnected).toBe(false);
    expect(ready.json.cueParserProductionEnabled).toBe(false);
    expect(ready.json.clinicalEngine).toBe(false);
    expect(ready.json.extractProduction).toBe(false);
    expect(ready.json).not.toHaveProperty('f3d2dFoundation');
  });

  it('persists append-only child events without mutating parent facts', async () => {
    requireDb();
    resetEvidenceMetrics();
    const { doctorA, doctorB } = await seedTenants();
    const facts = factService();
    const { consultationId } = await openConsultation(doctorA);
    const parent = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'f3d2d1-parent-cc-0001',
      },
      factEnv,
    );
    expect(parent.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
    expect(parent.clinicallyUsed).toBe(false);
    expect(parent.decisionStatus).toBe('ACTIVE');

    const inserted = await withTenantTransaction(
      doctorA,
      async (tx) => {
        return norms.insert(doctorA, tx, baseNormInput(parent));
      },
      env,
    );
    expect(inserted.authorityScope).toBe('FACT_NORMALIZED_SOURCE_LINKED');
    expect(inserted.clinicallyUsed).toBe(false);
    expect(inserted.decisionStatus).toBe('ACTIVE');
    expect(inserted.canonicalLabel).toBe('DURATION_2_DAYS');
    expect(inserted.cueEntryIds).toEqual(['cue-syn-001']);
    expect(inserted.patientId).toBe(parent.patientId);
    expect(inserted.consultationId).toBe(parent.consultationId);
    expect(inserted.sourceChannel).toBe(parent.sourceChannel);
    expect(inserted.sourceField).toBe(parent.sourceField);
    expect(inserted.sourceIdentityFingerprint).toBe(parent.sourceIdentityFingerprint);
    expect(JSON.stringify(inserted)).not.toMatch(/synthetic fever|object_key|https?:/);

    const parentAfter = (await facts.list(doctorA, consultationId, factEnv)).find(
      (f) => f.id === parent.id,
    );
    expect(parentAfter?.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
    expect(parentAfter?.decisionStatus).toBe('ACTIVE');
    expect(parentAfter?.clinicallyUsed).toBe(false);
    expect(parentAfter?.normalizationMethod).toBe('NONE');

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        const byId = await norms.findById(doctorA, tx, inserted.id);
        expect(byId?.id).toBe(inserted.id);
        const active = await norms.findActiveByIdentity(doctorA, tx, FP_A);
        expect(active?.id).toBe(inserted.id);

        let contentBlocked = false;
        try {
          await tx.query(
            `UPDATE clinical_fact_normalizations SET canonical_label = 'mutated' WHERE id = $1`,
            [inserted.id],
          );
        } catch {
          contentBlocked = true;
        }
        expect(contentBlocked).toBe(true);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        let authorityBlocked = false;
        try {
          await tx.query(
            `UPDATE clinical_fact_normalizations SET authority_scope = 'FACT_CANDIDATE_UNVERIFIED' WHERE id = $1`,
            [inserted.id],
          );
        } catch {
          authorityBlocked = true;
        }
        expect(authorityBlocked).toBe(true);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        let usedBlocked = false;
        try {
          await tx.query(
            `UPDATE clinical_fact_normalizations SET clinically_used = true WHERE id = $1`,
            [inserted.id],
          );
        } catch {
          usedBlocked = true;
        }
        expect(usedBlocked).toBe(true);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        let deleteBlocked = false;
        try {
          await tx.query(`DELETE FROM clinical_fact_normalizations WHERE id = $1`, [inserted.id]);
        } catch {
          deleteBlocked = true;
        }
        expect(deleteBlocked).toBe(true);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        let reverseBlocked = false;
        try {
          await tx.query(
            `UPDATE clinical_fact_normalizations SET decision_status = 'ACTIVE' WHERE id = $1`,
            [inserted.id],
          );
        } catch {
          reverseBlocked = true;
        }
        expect(reverseBlocked).toBe(true);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          norms.insert(
            doctorA,
            tx,
            baseNormInput(parent, {
              normalizationIdentityFingerprint: FP_A,
              canonicalLabel: 'DURATION_DUPLICATE',
            }),
          ),
        ).rejects.toBeInstanceOf(FactConflictError);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          norms.insert(
            doctorA,
            tx,
            baseNormInput(parent, {
              normalizationIdentityFingerprint: FP_B,
              normalizationKind: 'NEGATION_CUE',
              canonicalLabel: 'NEGATION_PRESENT',
              negationScope: null,
            }),
          ),
        ).rejects.toBeInstanceOf(ValidationError);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        const unitAlias = await norms.insert(
          doctorA,
          tx,
          baseNormInput(parent, {
            normalizationIdentityFingerprint: FP_B,
            normalizationKind: 'UNIT_ALIAS',
            canonicalLabel: 'UNIT_MG',
            cueEntryIds: [],
            limitationCodes: [
              'NOT_AUTHORITATIVE',
              'NO_UNIT_CONVERSION',
              'SOURCE_LINKED_NORMALIZATION_ONLY',
              'SYNTHETIC_FIXTURE_ONLY',
            ],
          }),
        );
        expect(unitAlias.normalizationKind).toBe('UNIT_ALIAS');

        const superseded = await norms.supersedeActive(doctorA, tx, inserted.id);
        expect(superseded.id).toBe(inserted.id);
        const replacement = await norms.insert(
          doctorA,
          tx,
          baseNormInput(parent, {
            normalizationIdentityFingerprint: FP_A,
            canonicalLabel: 'DURATION_2_DAYS_V2',
            supersedesNormalizationId: inserted.id,
          }),
        );
        expect(replacement.supersedesNormalizationId).toBe(inserted.id);
        const history = await norms.listByConsultation(doctorA, tx, consultationId);
        expect(history).toHaveLength(3);
        expect(history.filter((n) => n.decisionStatus === 'ACTIVE')).toHaveLength(2);
        expect(history.filter((n) => n.decisionStatus === 'SUPERSEDED')).toHaveLength(1);
        expect(history.map((n) => n.id)).toContain(inserted.id);
        expect(history.map((n) => n.id)).toContain(replacement.id);

        const linked = await norms.supersedeActiveLinkedToFacts(doctorA, tx, [parent.id]);
        expect(linked).toBe(2);
        const afterLink = await norms.listByConsultation(doctorA, tx, consultationId);
        expect(afterLink.every((n) => n.decisionStatus === 'SUPERSEDED')).toBe(true);

        const parentRow = await tx.query(
          `SELECT authority_status, decision_status, clinically_used
           FROM clinical_fact_candidates WHERE id = $1`,
          [parent.id],
        );
        const pr = parentRow.rows[0] as {
          authority_status: string;
          decision_status: string;
          clinically_used: boolean;
        };
        expect(pr.authority_status).toBe('FACT_CANDIDATE_UNVERIFIED');
        expect(pr.decision_status).toBe('ACTIVE');
        expect(pr.clinically_used).toBe(false);
      },
      env,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        let noCascade = false;
        try {
          await tx.query(`DELETE FROM clinical_fact_candidates WHERE id = $1`, [parent.id]);
        } catch {
          noCascade = true;
        }
        expect(noCascade).toBe(true);
      },
      env,
    );

    const hidden = await withTenantTransaction(
      doctorB,
      async (tx) => norms.listByConsultation(doctorB, tx, consultationId),
      env,
    );
    expect(hidden).toEqual([]);

    const rls = await withAdminClient(async (query) => {
      const forced = await query<{ f: boolean }>(
        `SELECT relforcerowsecurity AS f FROM pg_class WHERE relname = 'clinical_fact_normalizations'`,
      );
      const enabled = await query<{ e: boolean }>(
        `SELECT relrowsecurity AS e FROM pg_class WHERE relname = 'clinical_fact_normalizations'`,
      );
      await query(`SET ROLE ehas2_app`);
      await query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [doctorB.organizationId]);
      await query(`SELECT set_config('ehas2.clinic_id', $1, true)`, [doctorB.clinicId]);
      const count = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM clinical_fact_normalizations`,
      );
      await query(`RESET ROLE`);
      return {
        forced: forced.rows[0]?.f === true,
        enabled: enabled.rows[0]?.e === true,
        hidden: Number(count.rows[0]?.c ?? -1),
      };
    }, env);
    expect(rls.forced).toBe(true);
    expect(rls.enabled).toBe(true);
    expect(rls.hidden).toBe(0);
  }, 180_000);

  it('rejects invalid authority/clinical writes and rolls back duplicate ACTIVE identity', async () => {
    requireDb();
    const { doctorA } = await seedTenants();
    const facts = factService();
    const { consultationId } = await openConsultation(doctorA);
    const parent = await facts.materialize(
      doctorA,
      consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'f3d2d1-parent-cc-rollback',
      },
      factEnv,
    );

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await norms.insert(
          doctorA,
          tx,
          baseNormInput(parent, { normalizationIdentityFingerprint: FP_C }),
        );
      },
      env,
    );

    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) => {
          await norms.insert(
            doctorA,
            tx,
            baseNormInput(parent, {
              normalizationIdentityFingerprint: FP_C,
              canonicalLabel: 'SHOULD_ROLLBACK',
            }),
          );
        },
        env,
      ),
    ).rejects.toBeInstanceOf(FactConflictError);

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        const active = await norms.findActiveByIdentity(doctorA, tx, FP_C);
        expect(active?.canonicalLabel).toBe('DURATION_2_DAYS');
        const history = await norms.listByConsultation(doctorA, tx, consultationId);
        expect(history).toHaveLength(1);
        expect(history[0]?.canonicalLabel).not.toBe('SHOULD_ROLLBACK');

        await expect(
          tx.query(
            `INSERT INTO clinical_fact_normalizations (
               organization_id, clinic_id, patient_id, consultation_id,
               source_fact_candidate_id, source_identity_fingerprint, normalization_identity_fingerprint,
               source_channel, source_field, normalization_kind, canonical_label, negation_scope,
               cue_entry_ids, pack_id, pack_version, pack_content_checksum,
               parser_version, parser_fingerprint, normalizer_method, normalizer_version,
               normalizer_fingerprint, authority_scope, decision_status, limitation_codes,
               clinically_used, actor_id, actor_role
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$7,'DOCTOR_DECLARED','CHIEF_COMPLAINT','DURATION_PHRASE','X',NULL,
               '{}',$8,'1',$9,'none',$10,'OWNER_FROZEN_SOURCE_PRESERVING_V1','0',$11,
               'FACT_CANDIDATE_UNVERIFIED','ACTIVE','{}',false,$12,'Doctor'
             )`,
            [
              doctorA.organizationId,
              doctorA.clinicId,
              parent.patientId,
              parent.consultationId,
              parent.id,
              parent.sourceIdentityFingerprint,
              '1'.repeat(64),
              'pack',
              FP_PACK,
              FP_PARSER,
              FP_NORM,
              doctorA.actorId,
            ],
          ),
        ).rejects.toThrow();

        await expect(
          tx.query(
            `INSERT INTO clinical_fact_normalizations (
               organization_id, clinic_id, patient_id, consultation_id,
               source_fact_candidate_id, source_identity_fingerprint, normalization_identity_fingerprint,
               source_channel, source_field, normalization_kind, canonical_label, negation_scope,
               cue_entry_ids, pack_id, pack_version, pack_content_checksum,
               parser_version, parser_fingerprint, normalizer_method, normalizer_version,
               normalizer_fingerprint, authority_scope, decision_status, limitation_codes,
               clinically_used, actor_id, actor_role
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$7,'DOCTOR_DECLARED','CHIEF_COMPLAINT','DURATION_PHRASE','Y',NULL,
               '{}',$8,'1',$9,'none',$10,'OWNER_FROZEN_SOURCE_PRESERVING_V1','0',$11,
               'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE','{}',true,$12,'Doctor'
             )`,
            [
              doctorA.organizationId,
              doctorA.clinicId,
              parent.patientId,
              parent.consultationId,
              parent.id,
              parent.sourceIdentityFingerprint,
              '2'.repeat(64),
              'pack',
              FP_PACK,
              FP_PARSER,
              FP_NORM,
              doctorA.actorId,
            ],
          ),
        ).rejects.toThrow();
      },
      env,
    );
  }, 120_000);

  it('binds child rows to parent via server copy and rejects mismatched linkage', async () => {
    requireDb();
    const { doctorA, doctorB } = await seedTenants();
    const facts = factService();
    const opened = await openConsultation(doctorA);
    const parent = await facts.materialize(
      doctorA,
      opened.consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'f3d2d1-bind-parent-cc',
      },
      factEnv,
    );
    const pulse = await facts.materialize(
      doctorA,
      opened.consultationId,
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        idempotencyKey: 'f3d2d1-bind-parent-pulse',
      },
      factEnv,
    );
    const otherOpen = await openConsultation(doctorA);
    const otherPatientParent = await facts.materialize(
      doctorA,
      otherOpen.consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'f3d2d1-bind-other-patient',
      },
      factEnv,
    );

    const keys = Object.keys(baseNormInput(parent));
    expect(keys).not.toContain('patientId');
    expect(keys).not.toContain('consultationId');
    expect(keys).not.toContain('sourceChannel');
    expect(keys).not.toContain('sourceField');
    expect(keys).not.toContain('sourceIdentityFingerprint');
    expect(keys).toContain('sourceFactCandidateId');

    const bound = await withTenantTransaction(
      doctorA,
      async (tx) =>
        norms.insert(
          doctorA,
          tx,
          baseNormInput(parent, {
            normalizationIdentityFingerprint: '3'.repeat(64),
          }),
        ),
      env,
    );
    expect(bound.sourceFactCandidateId).toBe(parent.id);
    expect(bound.patientId).toBe(parent.patientId);
    expect(bound.consultationId).toBe(parent.consultationId);
    expect(bound.sourceChannel).toBe('DOCTOR_DECLARED');
    expect(bound.sourceField).toBe('CHIEF_COMPLAINT');
    expect(bound.sourceIdentityFingerprint).toBe(parent.sourceIdentityFingerprint);

    await expect(
      withTenantTransaction(
        doctorB,
        async (tx) =>
          norms.insert(
            doctorB,
            tx,
            baseNormInput(parent, {
              normalizationIdentityFingerprint: '4'.repeat(64),
            }),
          ),
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) =>
          norms.insert(
            doctorA,
            tx,
            baseNormInput(
              { id: '00000000-0000-4000-8000-000000000099' },
              {
                normalizationIdentityFingerprint: '5'.repeat(64),
              },
            ),
          ),
        env,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await intake.patch(
      doctorA,
      opened.consultationId,
      { chiefComplaintText: 'synthetic fever corrected for supersede' },
      env,
    );
    expect(
      (await facts.list(doctorA, opened.consultationId, factEnv)).find((f) => f.id === parent.id)
        ?.decisionStatus,
    ).toBe('SUPERSEDED');
    const replacement = await facts.materialize(
      doctorA,
      opened.consultationId,
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        idempotencyKey: 'f3d2d1-bind-super-parent',
      },
      factEnv,
    );
    expect(replacement.decisionStatus).toBe('ACTIVE');
    expect(replacement.id).not.toBe(parent.id);
    const historyFacts = await facts.list(doctorA, opened.consultationId, factEnv);
    expect(historyFacts.find((f) => f.id === parent.id)?.decisionStatus).toBe('SUPERSEDED');

    await expect(
      withTenantTransaction(
        doctorA,
        async (tx) =>
          norms.insert(
            doctorA,
            tx,
            baseNormInput(parent, {
              normalizationIdentityFingerprint: '6'.repeat(64),
            }),
          ),
        env,
      ),
    ).rejects.toMatchObject({ message: 'FACT_INELIGIBLE' });

    const sqlParamsBase = async (
      tx: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
      overrides: Record<string, unknown>,
    ) => {
      const vals = {
        organization_id: doctorA.organizationId,
        clinic_id: doctorA.clinicId,
        patient_id: parent.patientId,
        consultation_id: parent.consultationId,
        source_fact_candidate_id: parent.id,
        source_identity_fingerprint: parent.sourceIdentityFingerprint,
        normalization_identity_fingerprint: '7'.repeat(64),
        source_channel: parent.sourceChannel,
        source_field: parent.sourceField,
        ...overrides,
      };
      await tx.query(
        `INSERT INTO clinical_fact_normalizations (
           organization_id, clinic_id, patient_id, consultation_id,
           source_fact_candidate_id, source_identity_fingerprint, normalization_identity_fingerprint,
           source_channel, source_field, normalization_kind, canonical_label, negation_scope,
           cue_entry_ids, pack_id, pack_version, pack_content_checksum,
           parser_version, parser_fingerprint, normalizer_method, normalizer_version,
           normalizer_fingerprint, authority_scope, decision_status, limitation_codes,
           clinically_used, actor_id, actor_role
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,'DURATION_PHRASE','SQL_MISMATCH',NULL,
           '{}','pack','1',$10,'none',$11,'OWNER_FROZEN_SOURCE_PRESERVING_V1','0',$12,
           'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE','{}',false,$13,'Doctor'
         )`,
        [
          vals.organization_id,
          vals.clinic_id,
          vals.patient_id,
          vals.consultation_id,
          vals.source_fact_candidate_id,
          vals.source_identity_fingerprint,
          vals.normalization_identity_fingerprint,
          vals.source_channel,
          vals.source_field,
          FP_PACK,
          FP_PARSER,
          FP_NORM,
          doctorA.actorId,
        ],
      );
    };

    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          sqlParamsBase(tx, { patient_id: otherPatientParent.patientId }),
        ).rejects.toThrow();
      },
      env,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          sqlParamsBase(tx, {
            consultation_id: otherPatientParent.consultationId,
            normalization_identity_fingerprint: '8'.repeat(64),
          }),
        ).rejects.toThrow();
      },
      env,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          sqlParamsBase(tx, {
            organization_id: doctorB.organizationId,
            clinic_id: doctorB.clinicId,
            normalization_identity_fingerprint: '9'.repeat(64),
          }),
        ).rejects.toThrow();
      },
      env,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          sqlParamsBase(tx, {
            source_channel: 'STRUCTURED_INTAKE',
            normalization_identity_fingerprint: 'a'.repeat(64),
          }),
        ).rejects.toThrow();
      },
      env,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          sqlParamsBase(tx, {
            source_field: 'VITAL_PULSE',
            normalization_identity_fingerprint: 'b'.repeat(64),
          }),
        ).rejects.toThrow();
      },
      env,
    );
    await withTenantTransaction(
      doctorA,
      async (tx) => {
        await expect(
          sqlParamsBase(tx, {
            source_identity_fingerprint: pulse.sourceIdentityFingerprint,
            normalization_identity_fingerprint: 'c'.repeat(64),
          }),
        ).rejects.toThrow();
      },
      env,
    );

    const afterParent = (await facts.list(doctorA, opened.consultationId, factEnv)).find(
      (f) => f.id === parent.id,
    );
    expect(afterParent?.authorityStatus).toBe('FACT_CANDIDATE_UNVERIFIED');
    expect(afterParent?.clinicallyUsed).toBe(false);
    expect(afterParent?.normalizationMethod).toBe('NONE');
  }, 180_000);

  it('migration 017 down removes only owned objects then re-applies; 016 remains', async () => {
    requireDb();
    const downId = await migrateDownLastForIsolatedTest(env);
    expect(downId).toBe('017_f3d2d5_clinical_fact_verification');
    const gone = await withAdminClient(async (query) => {
      const t = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'clinical_fact_verification_events'`,
      );
      const child = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'clinical_fact_verification_normalizations'`,
      );
      const f = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM pg_proc
         WHERE proname = 'ehas2_fact_verification_event_append_only'`,
      );
      const idx = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM pg_indexes
         WHERE schemaname = 'public' AND indexname = 'clinical_fact_candidates_017_verification_parent_uq'`,
      );
      const norms = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'clinical_fact_normalizations'`,
      );
      const idx016 = await query<{ c: string }>(
        `SELECT count(*)::text AS c FROM pg_indexes
         WHERE schemaname = 'public' AND indexname = 'clinical_fact_candidates_016_norm_parent_uq'`,
      );
      return {
        table: Number(t.rows[0]?.c ?? -1),
        child: Number(child.rows[0]?.c ?? -1),
        fn: Number(f.rows[0]?.c ?? -1),
        idx: Number(idx.rows[0]?.c ?? -1),
        normsTable: Number(norms.rows[0]?.c ?? -1),
        idx016: Number(idx016.rows[0]?.c ?? -1),
      };
    }, env);
    expect(gone.table).toBe(0);
    expect(gone.child).toBe(0);
    expect(gone.fn).toBe(0);
    expect(gone.idx).toBe(0);
    expect(gone.normsTable).toBe(1);
    expect(gone.idx016).toBe(1);
    const up = await migrateUp(env);
    expect(up.applied).toEqual(['017_f3d2d5_clinical_fact_verification']);
  }, 120_000);
});
