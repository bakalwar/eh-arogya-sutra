import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { ReviewConflictError, ValidationError } from '../domainErrors.js';
import {
  presentSourceLocator,
  SOURCE_TEXT_AUTHORITY_SCOPE,
  type CandidateReviewAction,
  type CandidateReviewDecisionStatus,
  type CandidateReviewEventDto,
  type CandidateReviewReasonCode,
  type SourceLocator,
} from '@ehas2/evidence-extract';

function mapTs(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === '23505') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /unique|duplicate/i.test(msg);
}

function isImmutableReview(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /REVIEW_EVENTS_IMMUTABLE/i.test(msg);
}

function mapReview(row: Record<string, unknown>): CandidateReviewEventDto {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    evidenceItemId: String(row.evidence_item_id),
    extractionRunId: String(row.extraction_run_id),
    candidateId: String(row.candidate_id),
    action: String(row.action) as CandidateReviewAction,
    actorId: String(row.actor_id),
    actorRole: String(row.actor_role) as 'Doctor' | 'ClinicAdmin',
    reasonCode: String(row.reason_code) as CandidateReviewReasonCode,
    originalRawText: String(row.original_raw_text),
    originalNormalizedText:
      row.original_normalized_text == null ? null : String(row.original_normalized_text),
    correctedRawText: row.corrected_raw_text == null ? null : String(row.corrected_raw_text),
    correctedNormalizedText:
      row.corrected_normalized_text == null ? null : String(row.corrected_normalized_text),
    sourceLocator: presentSourceLocator(row.source_locator as SourceLocator),
    supersedesReviewId: row.supersedes_review_id == null ? null : String(row.supersedes_review_id),
    decisionStatus: String(row.decision_status) as CandidateReviewDecisionStatus,
    authorityScope: SOURCE_TEXT_AUTHORITY_SCOPE,
    clinicallyUsed: false,
    createdAt: mapTs(row.created_at),
  };
}

export type InsertCandidateReviewInput = {
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  extractionRunId: string;
  candidateId: string;
  action: CandidateReviewAction;
  reasonCode: CandidateReviewReasonCode;
  originalRawText: string;
  originalNormalizedText: string | null;
  correctedRawText: string | null;
  correctedNormalizedText: string | null;
  sourceLocator: SourceLocator;
  supersedesReviewId: string | null;
};

export class PgCandidateReviewRepository {
  async lockCandidate(tx: TransactionContext, candidateId: string): Promise<void> {
    await tx.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [candidateId]);
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    reviewId: string,
  ): Promise<CandidateReviewEventDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_candidate_reviews
       WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, reviewId],
    );
    return r.rows[0] ? mapReview(r.rows[0] as Record<string, unknown>) : null;
  }

  async findActiveForCandidate(
    tenant: TenantContext,
    tx: TransactionContext,
    candidateId: string,
  ): Promise<CandidateReviewEventDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_candidate_reviews
       WHERE organization_id = $1 AND clinic_id = $2
         AND candidate_id = $3 AND decision_status = 'ACTIVE'
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, candidateId],
    );
    return r.rows[0] ? mapReview(r.rows[0] as Record<string, unknown>) : null;
  }

  async listForCandidate(
    tenant: TenantContext,
    tx: TransactionContext,
    candidateId: string,
  ): Promise<CandidateReviewEventDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_candidate_reviews
       WHERE organization_id = $1 AND clinic_id = $2 AND candidate_id = $3
       ORDER BY created_at ASC, id ASC`,
      [tenant.organizationId, tenant.clinicId, candidateId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapReview);
  }

  async listActiveByEvidence(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
  ): Promise<CandidateReviewEventDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_candidate_reviews
       WHERE organization_id = $1 AND clinic_id = $2
         AND evidence_item_id = $3 AND decision_status = 'ACTIVE'`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapReview);
  }

  async supersedeActive(
    tenant: TenantContext,
    tx: TransactionContext,
    reviewId: string,
  ): Promise<void> {
    try {
      const r = await tx.query(
        `UPDATE clinical_evidence_extraction_candidate_reviews
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND id = $3 AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, reviewId],
      );
      if (!r.rows[0]) {
        throw new ReviewConflictError();
      }
    } catch (err) {
      if (err instanceof ReviewConflictError) throw err;
      if (isImmutableReview(err)) throw new ReviewConflictError();
      throw err;
    }
  }

  async insert(
    tenant: TenantContext,
    tx: TransactionContext,
    input: InsertCandidateReviewInput,
  ): Promise<CandidateReviewEventDto> {
    const locator = presentSourceLocator(input.sourceLocator);
    try {
      const r = await tx.query(
        `INSERT INTO clinical_evidence_extraction_candidate_reviews (
           organization_id, clinic_id, patient_id, consultation_id, evidence_item_id,
           extraction_run_id, candidate_id, action, actor_id, actor_role, reason_code,
           original_raw_text, original_normalized_text, corrected_raw_text,
           corrected_normalized_text, source_locator, supersedes_review_id,
           decision_status, authority_scope, clinically_used
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,
           'ACTIVE','SOURCE_TEXT_TRANSCRIPTION_ONLY', false
         ) RETURNING *`,
        [
          tenant.organizationId,
          tenant.clinicId,
          input.patientId,
          input.consultationId,
          input.evidenceItemId,
          input.extractionRunId,
          input.candidateId,
          input.action,
          tenant.actorId,
          tenant.actorRole,
          input.reasonCode,
          input.originalRawText,
          input.originalNormalizedText,
          input.correctedRawText,
          input.correctedNormalizedText,
          JSON.stringify(locator),
          input.supersedesReviewId,
        ],
      );
      return mapReview(r.rows[0] as Record<string, unknown>);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ReviewConflictError();
      }
      const code = (err as { code?: string } | null)?.code;
      if (code === '23514' || code === '23502') {
        throw new ValidationError('INVALID_REVIEW_ACTION');
      }
      throw err;
    }
  }
}

/** F3C never updates extraction candidate rows. */
