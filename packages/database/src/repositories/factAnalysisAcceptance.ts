import {
  FACT_ANALYSIS_ACCEPTANCE_ACTION,
  FACT_ANALYSIS_ACCEPTANCE_AUTHORITY,
  FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION,
  FACT_ANALYSIS_ACCEPTANCE_REASON,
  type FactAnalysisAcceptanceEventDto,
  type FactAnalysisAcceptanceNormalizationDto,
} from '@ehas2/evidence-extract';
import { FactConflictError, ValidationError } from '../domainErrors.js';
import { factAnalysisAcceptanceSubjectLockKey } from '../factAnalysisAcceptanceLock.js';
import { buildNormalizationSnapshotFingerprint } from '../factAnalysisAcceptanceSnapshot.js';
import type { TenantContext, TransactionContext } from '../tenantContext.js';

function mapTs(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function constrained(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /FACT_ANALYSIS_ACCEPTANCE_(?:EVENTS|NORMS)_IMMUTABLE|FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID/i.test(
    msg,
  );
}

function mapEvent(row: Record<string, unknown>): FactAnalysisAcceptanceEventDto {
  if (
    row.clinically_used === true ||
    String(row.actor_role) !== 'Doctor' ||
    String(row.action) !== FACT_ANALYSIS_ACCEPTANCE_ACTION ||
    String(row.authority_scope) !== FACT_ANALYSIS_ACCEPTANCE_AUTHORITY ||
    String(row.reason_code) !== FACT_ANALYSIS_ACCEPTANCE_REASON ||
    String(row.acceptance_contract_version) !== FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION
  ) {
    throw new ValidationError('FACT_ANALYSIS_ACCEPTANCE_CORRUPT');
  }
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    factCandidateId: String(row.fact_candidate_id),
    sourceChannel: String(row.source_channel),
    sourceField: String(row.source_field),
    sourceIdentityFingerprint: String(row.source_identity_fingerprint),
    contentFingerprint: String(row.content_fingerprint),
    verificationEventId: String(row.verification_event_id),
    normalizationSnapshotFingerprint: String(row.normalization_snapshot_fingerprint),
    normalizationCount: Number(row.normalization_count),
    action: FACT_ANALYSIS_ACCEPTANCE_ACTION,
    authorityScope: FACT_ANALYSIS_ACCEPTANCE_AUTHORITY,
    reasonCode: FACT_ANALYSIS_ACCEPTANCE_REASON,
    decisionStatus: String(row.decision_status) as 'ACTIVE' | 'SUPERSEDED',
    supersedesAcceptanceId:
      row.supersedes_acceptance_id == null ? null : String(row.supersedes_acceptance_id),
    actorId: String(row.actor_id),
    actorRole: 'Doctor',
    clinicallyUsed: false,
    acceptanceContractVersion: FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION,
    packId: String(row.pack_id),
    packVersion: String(row.pack_version),
    packContentChecksum: String(row.pack_content_checksum),
    parserVersion: String(row.parser_version),
    parserFingerprint: String(row.parser_fingerprint),
    normalizerMethod: String(row.normalizer_method),
    normalizerVersion: String(row.normalizer_version),
    normalizerFingerprint: String(row.normalizer_fingerprint),
    createdAt: mapTs(row.created_at),
  };
}

function mapNorm(row: Record<string, unknown>): FactAnalysisAcceptanceNormalizationDto {
  return {
    id: String(row.id),
    acceptanceEventId: String(row.acceptance_event_id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    factCandidateId: String(row.fact_candidate_id),
    normalizationId: String(row.normalization_id),
    normalizationIdentityFingerprint: String(row.normalization_identity_fingerprint),
    snapshotOrdinal: Number(row.snapshot_ordinal),
    createdAt: mapTs(row.created_at),
  };
}

export type InsertFactAnalysisAcceptanceInput = {
  patientId: string;
  consultationId: string;
  factCandidateId: string;
  sourceChannel: string;
  sourceField: string;
  sourceIdentityFingerprint: string;
  contentFingerprint: string;
  verificationEventId: string;
  supersedesAcceptanceId: string | null;
  actorId: string;
  packId: string;
  packVersion: string;
  packContentChecksum: string;
  parserVersion: string;
  parserFingerprint: string;
  normalizerMethod: string;
  normalizerVersion: string;
  normalizerFingerprint: string;
};

export class PgFactAnalysisAcceptanceRepository {
  async lockSubject(
    tenant: TenantContext,
    tx: TransactionContext,
    factCandidateId: string,
  ): Promise<void> {
    const key = factAnalysisAcceptanceSubjectLockKey(
      tenant.organizationId,
      tenant.clinicId,
      factCandidateId,
    );
    try {
      await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`, [key]);
    } catch {
      throw new ValidationError('LOCK_UNAVAILABLE');
    }
  }

  async lockSubjectsSorted(
    tenant: TenantContext,
    tx: TransactionContext,
    factCandidateIds: readonly string[],
  ): Promise<void> {
    const keys = [
      ...new Set(
        factCandidateIds.map((id) =>
          factAnalysisAcceptanceSubjectLockKey(tenant.organizationId, tenant.clinicId, id),
        ),
      ),
    ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const key of keys) {
      try {
        await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`, [key]);
      } catch {
        throw new ValidationError('LOCK_UNAVAILABLE');
      }
    }
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    id: string,
  ): Promise<FactAnalysisAcceptanceEventDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_analysis_acceptance_events
       WHERE organization_id = $1 AND clinic_id = $2 AND id = $3`,
      [tenant.organizationId, tenant.clinicId, id],
    );
    return r.rows[0] ? mapEvent(r.rows[0] as Record<string, unknown>) : null;
  }

  async findActiveByFactId(
    tenant: TenantContext,
    tx: TransactionContext,
    factCandidateId: string,
  ): Promise<FactAnalysisAcceptanceEventDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_analysis_acceptance_events
       WHERE organization_id = $1 AND clinic_id = $2 AND fact_candidate_id = $3
         AND decision_status = 'ACTIVE'`,
      [tenant.organizationId, tenant.clinicId, factCandidateId],
    );
    return r.rows[0] ? mapEvent(r.rows[0] as Record<string, unknown>) : null;
  }

  /** Read-only: ACTIVE E1 acceptances for a consultation (deterministic id order). */
  async listActiveByConsultation(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<FactAnalysisAcceptanceEventDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_analysis_acceptance_events
       WHERE organization_id = $1 AND clinic_id = $2 AND consultation_id = $3
         AND decision_status = 'ACTIVE'
       ORDER BY fact_candidate_id ASC, id ASC`,
      [tenant.organizationId, tenant.clinicId, consultationId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapEvent);
  }

  async listSnapshotByEventId(
    tenant: TenantContext,
    tx: TransactionContext,
    eventId: string,
  ): Promise<FactAnalysisAcceptanceNormalizationDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_analysis_acceptance_normalizations
       WHERE organization_id = $1 AND clinic_id = $2 AND acceptance_event_id = $3
       ORDER BY snapshot_ordinal ASC`,
      [tenant.organizationId, tenant.clinicId, eventId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapNorm);
  }

  async supersedeActive(
    tenant: TenantContext,
    tx: TransactionContext,
    id: string,
  ): Promise<FactAnalysisAcceptanceEventDto> {
    try {
      const r = await tx.query(
        `UPDATE clinical_fact_analysis_acceptance_events
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
           AND decision_status = 'ACTIVE' RETURNING *`,
        [tenant.organizationId, tenant.clinicId, id],
      );
      if (!r.rows[0]) throw new FactConflictError();
      return mapEvent(r.rows[0] as Record<string, unknown>);
    } catch (err) {
      if (err instanceof FactConflictError) throw err;
      if (constrained(err)) throw new FactConflictError();
      throw err;
    }
  }

  async supersedeActiveLinkedToFacts(
    tenant: TenantContext,
    tx: TransactionContext,
    factIds: readonly string[],
  ): Promise<number> {
    if (factIds.length === 0) return 0;
    try {
      const r = await tx.query(
        `UPDATE clinical_fact_analysis_acceptance_events
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND fact_candidate_id = ANY($3::uuid[]) AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, [...factIds]],
      );
      return r.rowCount ?? 0;
    } catch (err) {
      if (constrained(err)) throw new FactConflictError();
      throw err;
    }
  }

  async insert(
    tenant: TenantContext,
    tx: TransactionContext,
    input: InsertFactAnalysisAcceptanceInput,
  ): Promise<FactAnalysisAcceptanceEventDto> {
    try {
      const active = await tx.query(
        `SELECT id, normalization_identity_fingerprint AS fp
         FROM clinical_fact_normalizations
         WHERE organization_id = $1 AND clinic_id = $2
           AND source_fact_candidate_id = $3 AND decision_status = 'ACTIVE'
           AND authority_scope = 'FACT_NORMALIZED_SOURCE_LINKED' AND clinically_used = false
         ORDER BY id ASC`,
        [tenant.organizationId, tenant.clinicId, input.factCandidateId],
      );
      const rows = (active.rows as { id: string; fp: string }[]).map((r) => ({
        id: String(r.id),
        normalizationIdentityFingerprint: String(r.fp),
      }));
      if (rows.length > 32) throw new ValidationError('SNAPSHOT_OVERFLOW');
      const fingerprint = buildNormalizationSnapshotFingerprint(rows);

      const r = await tx.query(
        `INSERT INTO clinical_fact_analysis_acceptance_events (
           organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
           source_channel, source_field, source_identity_fingerprint, content_fingerprint,
           verification_event_id, normalization_snapshot_fingerprint, normalization_count,
           action, authority_scope, reason_code, decision_status, supersedes_acceptance_id,
           actor_id, actor_role, clinically_used, acceptance_contract_version,
           pack_id, pack_version, pack_content_checksum, parser_version, parser_fingerprint,
           normalizer_method, normalizer_version, normalizer_fingerprint
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
           '${FACT_ANALYSIS_ACCEPTANCE_ACTION}','${FACT_ANALYSIS_ACCEPTANCE_AUTHORITY}',
           '${FACT_ANALYSIS_ACCEPTANCE_REASON}','ACTIVE',$13,$14,'Doctor',false,
           '${FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION}',$15,$16,$17,$18,$19,$20,$21,$22
         ) RETURNING *`,
        [
          tenant.organizationId,
          tenant.clinicId,
          input.patientId,
          input.consultationId,
          input.factCandidateId,
          input.sourceChannel,
          input.sourceField,
          input.sourceIdentityFingerprint,
          input.contentFingerprint,
          input.verificationEventId,
          fingerprint,
          rows.length,
          input.supersedesAcceptanceId,
          input.actorId,
          input.packId,
          input.packVersion,
          input.packContentChecksum,
          input.parserVersion,
          input.parserFingerprint,
          input.normalizerMethod,
          input.normalizerVersion,
          input.normalizerFingerprint,
        ],
      );
      if (!r.rows[0]) throw new FactConflictError();
      const event = mapEvent(r.rows[0] as Record<string, unknown>);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        await tx.query(
          `INSERT INTO clinical_fact_analysis_acceptance_normalizations (
             acceptance_event_id, organization_id, clinic_id, fact_candidate_id,
             normalization_id, normalization_identity_fingerprint, snapshot_ordinal
           ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            event.id,
            tenant.organizationId,
            tenant.clinicId,
            input.factCandidateId,
            row.id,
            row.normalizationIdentityFingerprint,
            i,
          ],
        );
      }
      return event;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof FactConflictError) throw err;
      if (constrained(err)) throw new FactConflictError();
      const code = (err as { code?: string } | null)?.code;
      if (code === '23503' || code === '23505' || code === '23514') {
        throw new ValidationError('FACT_ANALYSIS_ACCEPTANCE_REJECTED');
      }
      throw err;
    }
  }
}

export async function lockAndSupersedeFactAnalysisAcceptances(
  tenant: TenantContext,
  tx: TransactionContext,
  factIds: readonly string[],
): Promise<number> {
  if (factIds.length === 0) return 0;
  const repo = new PgFactAnalysisAcceptanceRepository();
  await repo.lockSubjectsSorted(tenant, tx, factIds);
  return repo.supersedeActiveLinkedToFacts(tenant, tx, factIds);
}
