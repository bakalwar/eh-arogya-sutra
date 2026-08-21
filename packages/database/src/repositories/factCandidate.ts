import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { FactConflictError, ValidationError } from '../domainErrors.js';
import {
  FACT_CANDIDATE_F3D1_AUTHORITY,
  FACT_NORMALIZATION_FINGERPRINT_F3D1,
  FACT_NORMALIZATION_METHOD_F3D1,
  FACT_NORMALIZATION_VERSION_F3D1,
  presentSourceLocator,
  type FactCandidateCategory,
  type FactCandidateChannel,
  type FactCandidateDecisionStatus,
  type FactCandidateDto,
  type FactCandidateSourceField,
  type FactLimitationCode,
  type FactUnitPosture,
  type SourceLocator,
} from '@ehas2/evidence-extract';
import { PgFactNormalizationRepository } from './factNormalization.js';
import { lockAndSupersedeFactVerifications } from './factVerification.js';
import { lockAndSupersedeFactAnalysisAcceptances } from './factAnalysisAcceptance.js';

const factNormalizations = new PgFactNormalizationRepository();

function mapTs(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === '23505') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /unique|duplicate/i.test(msg);
}

function isImmutableFact(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /FACT_CANDIDATES_IMMUTABLE/i.test(msg);
}

function mapFact(row: Record<string, unknown>): FactCandidateDto {
  if (row.clinically_used === true) {
    throw new ValidationError('FACT_CLINICALLY_USED_CORRUPT');
  }
  if (String(row.authority_status) !== FACT_CANDIDATE_F3D1_AUTHORITY) {
    throw new ValidationError('FACT_AUTHORITY_CORRUPT');
  }
  const locatorRaw = row.source_locator;
  const sourceLocator =
    locatorRaw == null ? null : presentSourceLocator(locatorRaw as SourceLocator);
  const codes = Array.isArray(row.limitation_codes)
    ? (row.limitation_codes as string[]).map((c) => c as FactLimitationCode)
    : [];
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    sourceChannel: String(row.source_channel) as FactCandidateChannel,
    factCategory: String(row.fact_category) as FactCandidateCategory,
    sourceField: String(row.source_field) as FactCandidateSourceField,
    intakeSymptomId: row.intake_symptom_id == null ? null : String(row.intake_symptom_id),
    evidenceItemId: row.evidence_item_id == null ? null : String(row.evidence_item_id),
    extractionRunId: row.extraction_run_id == null ? null : String(row.extraction_run_id),
    extractionCandidateId:
      row.extraction_candidate_id == null ? null : String(row.extraction_candidate_id),
    reviewEventId: row.review_event_id == null ? null : String(row.review_event_id),
    originalSourceSpan: String(row.original_source_span),
    assertedText: row.asserted_text == null ? null : String(row.asserted_text),
    assertedValue: row.asserted_value == null ? null : String(row.asserted_value),
    unitText: row.unit_text == null ? null : String(row.unit_text),
    unitPosture: String(row.unit_posture) as FactUnitPosture,
    negated: Boolean(row.negated),
    durationText: row.duration_text == null ? null : String(row.duration_text),
    onsetText: row.onset_text == null ? null : String(row.onset_text),
    sourceLocator,
    sourceIdentityFingerprint: String(row.source_identity_fingerprint),
    contentFingerprint: String(row.content_fingerprint),
    limitationCodes: codes,
    confidence: row.confidence == null ? null : Number(row.confidence),
    normalizationMethod: FACT_NORMALIZATION_METHOD_F3D1,
    normalizationVersion: FACT_NORMALIZATION_VERSION_F3D1,
    normalizationFingerprint: String(row.normalization_fingerprint),
    authorityStatus: FACT_CANDIDATE_F3D1_AUTHORITY,
    decisionStatus: String(row.decision_status) as FactCandidateDecisionStatus,
    supersedesFactId: row.supersedes_fact_id == null ? null : String(row.supersedes_fact_id),
    clinicallyUsed: false,
    actorId: String(row.actor_id),
    actorRole: String(row.actor_role) as 'Doctor' | 'ClinicAdmin',
    createdAt: mapTs(row.created_at),
  };
}

export type InsertFactCandidateInput = {
  patientId: string;
  consultationId: string;
  sourceChannel: FactCandidateChannel;
  factCategory: FactCandidateCategory;
  sourceField: FactCandidateSourceField;
  intakeSymptomId: string | null;
  evidenceItemId: string | null;
  extractionRunId: string | null;
  extractionCandidateId: string | null;
  reviewEventId: string | null;
  originalSourceSpan: string;
  assertedText: string | null;
  assertedValue: string | null;
  unitText: string | null;
  unitPosture: FactUnitPosture;
  negated: boolean;
  durationText: string | null;
  onsetText: string | null;
  sourceLocator: SourceLocator | null;
  sourceIdentityFingerprint: string;
  contentFingerprint: string;
  limitationCodes: readonly FactLimitationCode[];
  confidence: number | null;
  supersedesFactId: string | null;
};

export class PgFactCandidateRepository {
  async lockIdentity(tx: TransactionContext, fingerprint: string): Promise<void> {
    await tx.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [fingerprint]);
  }

  /**
   * Sorted fact-identity locks for ACTIVE facts linked to extraction candidates.
   * Call only after candidate lifecycle locks are already held (candidate → fact order).
   */
  async lockIdentitiesForActiveLinkedCandidates(
    tenant: TenantContext,
    tx: TransactionContext,
    candidateIds: readonly string[],
  ): Promise<void> {
    if (candidateIds.length === 0) return;
    const r = await tx.query(
      `SELECT DISTINCT source_identity_fingerprint AS fp
       FROM clinical_fact_candidates
       WHERE organization_id = $1 AND clinic_id = $2
         AND extraction_candidate_id = ANY($3::uuid[])
         AND decision_status = 'ACTIVE'`,
      [tenant.organizationId, tenant.clinicId, [...candidateIds]],
    );
    const fingerprints = (r.rows as { fp: string }[])
      .map((row) => String(row.fp))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const fingerprint of fingerprints) {
      await this.lockIdentity(tx, fingerprint);
    }
  }

  /**
   * Append-only ACTIVE → SUPERSEDED for facts linked to superseded extraction candidates.
   * Also supersedes linked ACTIVE normalizations in the same transaction.
   * Conditional on decision_status = ACTIVE only; never deletes or mutates content.
   * Caller must already hold sorted fact identity locks for linked ACTIVE facts.
   * Order: norm identity locks → supersede facts → supersede norms.
   */
  async supersedeActiveLinkedToCandidates(
    tenant: TenantContext,
    tx: TransactionContext,
    candidateIds: readonly string[],
  ): Promise<number> {
    if (candidateIds.length === 0) return 0;
    try {
      const listed = await tx.query(
        `SELECT id FROM clinical_fact_candidates
         WHERE organization_id = $1 AND clinic_id = $2
           AND extraction_candidate_id = ANY($3::uuid[])
           AND decision_status = 'ACTIVE'`,
        [tenant.organizationId, tenant.clinicId, [...candidateIds]],
      );
      const factIds = (listed.rows as { id: string }[]).map((row) => String(row.id));
      if (factIds.length === 0) return 0;
      await factNormalizations.lockActiveIdentitiesForParentFacts(tenant, tx, factIds);
      await lockAndSupersedeFactVerifications(tenant, tx, factIds);
      await lockAndSupersedeFactAnalysisAcceptances(tenant, tx, factIds);
      const r = await tx.query(
        `UPDATE clinical_fact_candidates
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND extraction_candidate_id = ANY($3::uuid[])
           AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, [...candidateIds]],
      );
      await factNormalizations.supersedeActiveLinkedToFacts(tenant, tx, factIds);
      return r.rowCount ?? 0;
    } catch (err) {
      if (isImmutableFact(err)) throw new FactConflictError();
      throw err;
    }
  }

  /**
   * Bulk ACTIVE → SUPERSEDED by fact ids only (no normalization side effects).
   * Used by shared fact+normalization lifecycle helpers that lock/supersede norms separately.
   */
  async supersedeActiveByIds(
    tenant: TenantContext,
    tx: TransactionContext,
    factIds: readonly string[],
  ): Promise<number> {
    if (factIds.length === 0) return 0;
    try {
      const r = await tx.query(
        `UPDATE clinical_fact_candidates
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND id = ANY($3::uuid[])
           AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, [...factIds]],
      );
      return r.rowCount ?? 0;
    } catch (err) {
      if (isImmutableFact(err)) throw new FactConflictError();
      throw err;
    }
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    factId: string,
  ): Promise<FactCandidateDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_candidates
       WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, factId],
    );
    return r.rows[0] ? mapFact(r.rows[0] as Record<string, unknown>) : null;
  }

  async findActiveByIdentity(
    tenant: TenantContext,
    tx: TransactionContext,
    fingerprint: string,
  ): Promise<FactCandidateDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_candidates
       WHERE organization_id = $1 AND clinic_id = $2
         AND source_identity_fingerprint = $3 AND decision_status = 'ACTIVE'
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, fingerprint],
    );
    return r.rows[0] ? mapFact(r.rows[0] as Record<string, unknown>) : null;
  }

  async listByConsultation(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<FactCandidateDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_candidates
       WHERE organization_id = $1 AND clinic_id = $2 AND consultation_id = $3
       ORDER BY created_at ASC, id ASC`,
      [tenant.organizationId, tenant.clinicId, consultationId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapFact);
  }

  async supersedeActive(
    tenant: TenantContext,
    tx: TransactionContext,
    factId: string,
  ): Promise<{ id: string }> {
    try {
      await factNormalizations.lockActiveIdentitiesForParentFacts(tenant, tx, [factId]);
      await lockAndSupersedeFactVerifications(tenant, tx, [factId]);
      await lockAndSupersedeFactAnalysisAcceptances(tenant, tx, [factId]);
      const r = await tx.query(
        `UPDATE clinical_fact_candidates
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND id = $3 AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, factId],
      );
      if (r.rowCount !== 1 || !r.rows[0]) {
        throw new FactConflictError();
      }
      const id = String((r.rows[0] as { id: string }).id);
      await factNormalizations.supersedeActiveLinkedToFacts(tenant, tx, [id]);
      return { id };
    } catch (err) {
      if (err instanceof FactConflictError) throw err;
      if (isImmutableFact(err)) throw new FactConflictError();
      throw err;
    }
  }

  async insert(
    tenant: TenantContext,
    tx: TransactionContext,
    input: InsertFactCandidateInput,
  ): Promise<FactCandidateDto> {
    const locator = input.sourceLocator ? presentSourceLocator(input.sourceLocator) : null;
    try {
      const r = await tx.query(
        `INSERT INTO clinical_fact_candidates (
           organization_id, clinic_id, patient_id, consultation_id,
           source_channel, fact_category, source_field, intake_symptom_id,
           evidence_item_id, extraction_run_id, extraction_candidate_id, review_event_id,
           original_source_span, asserted_text, asserted_value, unit_text, unit_posture,
           negated, duration_text, onset_text, source_locator,
           source_identity_fingerprint, content_fingerprint, limitation_codes, confidence,
           normalization_method, normalization_version, normalization_fingerprint,
           authority_status, decision_status, supersedes_fact_id, clinically_used,
           actor_id, actor_role
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
           $21::jsonb,$22,$23,$24::text[],$25,
           'NONE','none',$26,
           'FACT_CANDIDATE_UNVERIFIED','ACTIVE',$27,false,
           $28,$29
         ) RETURNING *`,
        [
          tenant.organizationId,
          tenant.clinicId,
          input.patientId,
          input.consultationId,
          input.sourceChannel,
          input.factCategory,
          input.sourceField,
          input.intakeSymptomId,
          input.evidenceItemId,
          input.extractionRunId,
          input.extractionCandidateId,
          input.reviewEventId,
          input.originalSourceSpan,
          input.assertedText,
          input.assertedValue,
          input.unitText,
          input.unitPosture,
          input.negated,
          input.durationText,
          input.onsetText,
          locator ? JSON.stringify(locator) : null,
          input.sourceIdentityFingerprint,
          input.contentFingerprint,
          [...input.limitationCodes],
          input.confidence,
          FACT_NORMALIZATION_FINGERPRINT_F3D1,
          input.supersedesFactId,
          tenant.actorId,
          tenant.actorRole,
        ],
      );
      return mapFact(r.rows[0] as Record<string, unknown>);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new FactConflictError();
      }
      const code = (err as { code?: string } | null)?.code;
      if (code === '23514' || code === '23502' || code === '23503') {
        throw new ValidationError('INVALID_FACT_CANDIDATE');
      }
      throw err;
    }
  }
}

/** F3D-1 never writes report-finding rows and never upgrades authority. */
