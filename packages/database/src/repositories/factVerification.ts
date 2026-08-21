import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { FactConflictError, ValidationError } from '../domainErrors.js';
import {
  FACT_VERIFICATION_AUTHORITY_SCOPE,
  type FactVerificationAction,
  type FactVerificationEventDto,
  type FactVerificationNormalizationDto,
  type FactVerificationReasonCode,
} from '@ehas2/evidence-extract';

function mapTs(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function isImmutable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /FACT_VERIFICATIONS_IMMUTABLE|FACT_VERIFICATION_NORMS_IMMUTABLE/i.test(msg);
}

function mapEvent(row: Record<string, unknown>): FactVerificationEventDto {
  if (row.clinically_used === true) {
    throw new ValidationError('FACT_VERIFICATION_CORRUPT');
  }
  if (String(row.authority_scope) !== FACT_VERIFICATION_AUTHORITY_SCOPE) {
    throw new ValidationError('FACT_VERIFICATION_CORRUPT');
  }
  if (String(row.actor_role) !== 'Doctor') {
    throw new ValidationError('FACT_VERIFICATION_CORRUPT');
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
    normalizationSnapshotFingerprint: String(row.normalization_snapshot_fingerprint),
    normalizationCount: Number(row.normalization_count),
    action: String(row.action) as FactVerificationAction,
    reasonCode: String(row.reason_code) as FactVerificationReasonCode,
    authorityScope: FACT_VERIFICATION_AUTHORITY_SCOPE,
    decisionStatus: String(row.decision_status) as 'ACTIVE' | 'SUPERSEDED',
    supersedesVerificationId:
      row.supersedes_verification_id == null ? null : String(row.supersedes_verification_id),
    actorId: String(row.actor_id),
    actorRole: 'Doctor',
    clinicallyUsed: false,
    createdAt: mapTs(row.created_at),
  };
}

function mapNormRow(row: Record<string, unknown>): FactVerificationNormalizationDto {
  return {
    id: String(row.id),
    verificationEventId: String(row.verification_event_id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    factCandidateId: String(row.fact_candidate_id),
    normalizationId: String(row.normalization_id),
    normalizationIdentityFingerprint: String(row.normalization_identity_fingerprint),
    snapshotOrdinal: Number(row.snapshot_ordinal),
    createdAt: mapTs(row.created_at),
  };
}

export type InsertFactVerificationInput = {
  patientId: string;
  consultationId: string;
  factCandidateId: string;
  sourceChannel: string;
  sourceField: string;
  sourceIdentityFingerprint: string;
  contentFingerprint: string;
  normalizationSnapshotFingerprint: string;
  normalizationCount: number;
  action: FactVerificationAction;
  reasonCode: FactVerificationReasonCode;
  supersedesVerificationId: string | null;
  actorId: string;
  snapshot: readonly {
    normalizationId: string;
    normalizationIdentityFingerprint: string;
    snapshotOrdinal: number;
  }[];
};

export class PgFactVerificationRepository {
  async lockSubject(tx: TransactionContext, factCandidateId: string): Promise<void> {
    await tx.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [
      `ehas2:fact-verification:v1:${factCandidateId}`,
    ]);
  }

  async lockSubjectsSorted(
    tx: TransactionContext,
    factCandidateIds: readonly string[],
  ): Promise<void> {
    const sorted = [...new Set(factCandidateIds)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const id of sorted) {
      await this.lockSubject(tx, id);
    }
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    id: string,
  ): Promise<FactVerificationEventDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_verification_events
       WHERE organization_id = $1 AND clinic_id = $2 AND id = $3`,
      [tenant.organizationId, tenant.clinicId, id],
    );
    if (!r.rows[0]) return null;
    return mapEvent(r.rows[0] as Record<string, unknown>);
  }

  async findActiveByFactId(
    tenant: TenantContext,
    tx: TransactionContext,
    factCandidateId: string,
  ): Promise<FactVerificationEventDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_verification_events
       WHERE organization_id = $1 AND clinic_id = $2
         AND fact_candidate_id = $3 AND decision_status = 'ACTIVE'`,
      [tenant.organizationId, tenant.clinicId, factCandidateId],
    );
    if (!r.rows[0]) return null;
    return mapEvent(r.rows[0] as Record<string, unknown>);
  }

  async listByFactId(
    tenant: TenantContext,
    tx: TransactionContext,
    factCandidateId: string,
  ): Promise<FactVerificationEventDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_verification_events
       WHERE organization_id = $1 AND clinic_id = $2 AND fact_candidate_id = $3
       ORDER BY created_at ASC, id ASC`,
      [tenant.organizationId, tenant.clinicId, factCandidateId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapEvent);
  }

  async listSnapshotRows(
    tenant: TenantContext,
    tx: TransactionContext,
    verificationEventId: string,
  ): Promise<FactVerificationNormalizationDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_verification_normalizations
       WHERE organization_id = $1 AND clinic_id = $2 AND verification_event_id = $3
       ORDER BY snapshot_ordinal ASC`,
      [tenant.organizationId, tenant.clinicId, verificationEventId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapNormRow);
  }

  async supersedeActive(
    tenant: TenantContext,
    tx: TransactionContext,
    verificationId: string,
  ): Promise<{ id: string }> {
    try {
      const r = await tx.query(
        `UPDATE clinical_fact_verification_events
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND id = $3 AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, verificationId],
      );
      if (r.rowCount !== 1 || !r.rows[0]) {
        throw new FactConflictError();
      }
      return { id: String((r.rows[0] as { id: string }).id) };
    } catch (err) {
      if (err instanceof FactConflictError) throw err;
      if (isImmutable(err)) throw new FactConflictError();
      throw err;
    }
  }

  /**
   * Conditional ACTIVE → SUPERSEDED for verification events linked to facts.
   * Caller must already hold sorted verification subject locks.
   */
  async supersedeActiveLinkedToFacts(
    tenant: TenantContext,
    tx: TransactionContext,
    factIds: readonly string[],
  ): Promise<number> {
    if (factIds.length === 0) return 0;
    try {
      const r = await tx.query(
        `UPDATE clinical_fact_verification_events
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND fact_candidate_id = ANY($3::uuid[])
           AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, [...factIds]],
      );
      return r.rowCount ?? 0;
    } catch (err) {
      if (isImmutable(err)) throw new FactConflictError();
      throw err;
    }
  }

  async insert(
    tenant: TenantContext,
    tx: TransactionContext,
    input: InsertFactVerificationInput,
  ): Promise<FactVerificationEventDto> {
    if (input.normalizationCount !== input.snapshot.length) {
      throw new ValidationError('SNAPSHOT_COUNT_MISMATCH');
    }
    if (input.snapshot.length > 32) {
      throw new ValidationError('SNAPSHOT_OVERFLOW');
    }

    try {
      const r = await tx.query(
        `INSERT INTO clinical_fact_verification_events (
           organization_id, clinic_id, patient_id, consultation_id, fact_candidate_id,
           source_channel, source_field, source_identity_fingerprint, content_fingerprint,
           normalization_snapshot_fingerprint, normalization_count, action, reason_code,
           authority_scope, decision_status, supersedes_verification_id,
           actor_id, actor_role, clinically_used
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
           'SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY','ACTIVE',$14,$15,'Doctor',false
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
          input.normalizationSnapshotFingerprint,
          input.normalizationCount,
          input.action,
          input.reasonCode,
          input.supersedesVerificationId,
          input.actorId,
        ],
      );
      if (!r.rows[0]) throw new FactConflictError();
      const event = mapEvent(r.rows[0] as Record<string, unknown>);

      for (const row of input.snapshot) {
        await tx.query(
          `INSERT INTO clinical_fact_verification_normalizations (
             verification_event_id, organization_id, clinic_id, fact_candidate_id,
             normalization_id, normalization_identity_fingerprint, snapshot_ordinal
           ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            event.id,
            tenant.organizationId,
            tenant.clinicId,
            input.factCandidateId,
            row.normalizationId,
            row.normalizationIdentityFingerprint,
            row.snapshotOrdinal,
          ],
        );
      }

      const childCount = await tx.query(
        `SELECT count(*)::int AS c FROM clinical_fact_verification_normalizations
         WHERE organization_id = $1 AND clinic_id = $2 AND verification_event_id = $3`,
        [tenant.organizationId, tenant.clinicId, event.id],
      );
      const c = Number((childCount.rows[0] as { c: number }).c);
      if (c !== input.normalizationCount) {
        throw new ValidationError('SNAPSHOT_COUNT_MISMATCH');
      }

      return event;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof FactConflictError) throw err;
      if (isImmutable(err)) throw new FactConflictError();
      const code = (err as { code?: string } | null)?.code;
      if (code === '23503' || code === '23505' || code === '23514') {
        throw new ValidationError('FACT_VERIFICATION_REJECTED');
      }
      throw err;
    }
  }
}

export async function lockAndSupersedeFactVerifications(
  tenant: TenantContext,
  tx: TransactionContext,
  factIds: readonly string[],
): Promise<number> {
  if (factIds.length === 0) return 0;
  const repo = new PgFactVerificationRepository();
  await repo.lockSubjectsSorted(tx, factIds);
  return repo.supersedeActiveLinkedToFacts(tenant, tx, factIds);
}
