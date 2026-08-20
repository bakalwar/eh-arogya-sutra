import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { validateAndCanonicalizeLocator } from '@ehas2/evidence-extract-adapters';
import {
  assertNoStorageInLocator,
  MAX_CANDIDATES_PER_EVIDENCE,
  MAX_EXTRACTION_RUNS_PER_EVIDENCE,
  type CandidateStatus,
  type CandidateType,
  type ExtractionCandidateDto,
  type ExtractionMethod,
  type LimitationCode,
  type ScriptHint,
  type SourceLocator,
} from '@ehas2/evidence-extract';
import { lockF3cReviewedCueSource } from '../services/cueSourceLock.js';
import { PgFactCandidateRepository } from './factCandidate.js';

const factCandidates = new PgFactCandidateRepository();

export type ExtractionRunRecord = {
  id: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  jobId: string | null;
  extractorName: string;
  extractorVersion: string;
  modelOrLangpackVersion: string;
  method: ExtractionMethod;
  extractorFingerprint: string;
  inputContentSha256: string | null;
  status: CandidateStatus;
  limitationCodes: LimitationCode[];
  candidateCount: number;
  supersededByRunId: string | null;
  createdAt: string;
};

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === '23505') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /unique|duplicate/i.test(msg);
}

export type InsertRunInput = {
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  jobId: string | null;
  extractorName: string;
  extractorVersion: string;
  modelOrLangpackVersion: string;
  method: ExtractionMethod;
  extractorFingerprint: string;
  inputContentSha256: string | null;
  status: CandidateStatus;
  limitationCodes: readonly LimitationCode[];
  candidateCount: number;
};

/**
 * Idempotent run insert: concurrent workers racing the same fingerprint get the existing run
 * instead of failing on clinical_evidence_extraction_runs_idempotent (evidence_item_id + fingerprint).
 */
export async function insertRunWithIdempotency(
  repo: PgExtractionRepository,
  tenant: TenantContext,
  tx: TransactionContext,
  input: InsertRunInput,
): Promise<{ run: ExtractionRunRecord; inserted: boolean }> {
  try {
    const run = await repo.insertRun(tenant, tx, input);
    return { run, inserted: true };
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const existing = await repo.findActiveRun(
      tenant,
      tx,
      input.evidenceItemId,
      input.extractorFingerprint,
    );
    if (!existing) throw err;
    return { run: existing, inserted: false };
  }
}

function mapTs(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function mapRun(row: Record<string, unknown>): ExtractionRunRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    evidenceItemId: String(row.evidence_item_id),
    jobId: row.job_id == null ? null : String(row.job_id),
    extractorName: String(row.extractor_name),
    extractorVersion: String(row.extractor_version),
    modelOrLangpackVersion: String(row.model_or_langpack_version),
    method: String(row.method) as ExtractionMethod,
    extractorFingerprint: String(row.extractor_fingerprint),
    inputContentSha256: row.input_content_sha256 == null ? null : String(row.input_content_sha256),
    status: String(row.status) as CandidateStatus,
    limitationCodes: Array.isArray(row.limitation_codes)
      ? (row.limitation_codes as LimitationCode[])
      : [],
    candidateCount: Number(row.candidate_count),
    supersededByRunId: row.superseded_by_run_id == null ? null : String(row.superseded_by_run_id),
    createdAt: mapTs(row.created_at),
  };
}

function mapCandidate(row: Record<string, unknown>): ExtractionCandidateDto {
  const locator = row.source_locator as SourceLocator;
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    evidenceItemId: String(row.evidence_item_id),
    extractionRunId: String(row.extraction_run_id),
    pageNumber: Number(row.page_number),
    sourceLocator: locator,
    candidateType: String(row.candidate_type) as CandidateType,
    rawText: String(row.raw_text),
    normalizedText: row.normalized_text == null ? null : String(row.normalized_text),
    unitText: row.unit_text == null ? null : String(row.unit_text),
    referenceRangeText: row.reference_range_text == null ? null : String(row.reference_range_text),
    method: String(row.method) as ExtractionMethod,
    extractorName: String(row.extractor_name),
    extractorVersion: String(row.extractor_version),
    modelOrLangpackVersion: String(row.model_or_langpack_version),
    confidence: row.confidence == null ? null : Number(row.confidence),
    status: String(row.status) as CandidateStatus,
    limitationCodes: Array.isArray(row.limitation_codes)
      ? (row.limitation_codes as LimitationCode[])
      : [],
    contentFingerprint: String(row.content_fingerprint),
    verificationPosture: 'UNVERIFIED',
    scriptHint: String(row.script_hint) as ScriptHint,
    createdAt: mapTs(row.created_at),
  };
}

export class PgExtractionRepository {
  async findActiveRun(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
    extractorFingerprint: string,
  ): Promise<ExtractionRunRecord | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_runs
       WHERE organization_id = $1 AND clinic_id = $2
         AND evidence_item_id = $3 AND extractor_fingerprint = $4
         AND status <> 'SUPERSEDED'
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId, extractorFingerprint],
    );
    return r.rows[0] ? mapRun(r.rows[0] as Record<string, unknown>) : null;
  }

  async listActiveRunsForEvidence(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
  ): Promise<ExtractionRunRecord[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_runs
       WHERE organization_id = $1 AND clinic_id = $2
         AND evidence_item_id = $3 AND status <> 'SUPERSEDED'
       ORDER BY created_at DESC`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapRun);
  }

  async insertRun(
    tenant: TenantContext,
    tx: TransactionContext,
    input: InsertRunInput,
  ): Promise<ExtractionRunRecord> {
    const r = await tx.query(
      `INSERT INTO clinical_evidence_extraction_runs (
         organization_id, clinic_id, patient_id, consultation_id, evidence_item_id,
         job_id, extractor_name, extractor_version, model_or_langpack_version, method,
         extractor_fingerprint, input_content_sha256, status, limitation_codes, candidate_count
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        tenant.organizationId,
        tenant.clinicId,
        input.patientId,
        input.consultationId,
        input.evidenceItemId,
        input.jobId,
        input.extractorName,
        input.extractorVersion,
        input.modelOrLangpackVersion,
        input.method,
        input.extractorFingerprint,
        input.inputContentSha256,
        input.status,
        input.limitationCodes,
        input.candidateCount,
      ],
    );
    return mapRun(r.rows[0] as Record<string, unknown>);
  }

  async supersedeRuns(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
    exceptFingerprint: string,
    newRunId: string,
  ): Promise<number> {
    const runs = await tx.query(
      `UPDATE clinical_evidence_extraction_runs SET
         status = 'SUPERSEDED',
         superseded_by_run_id = $5
       WHERE organization_id = $1 AND clinic_id = $2
         AND evidence_item_id = $3
         AND extractor_fingerprint <> $4
         AND status <> 'SUPERSEDED'
       RETURNING id`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId, exceptFingerprint, newRunId],
    );
    const ids = (runs.rows as { id: string }[]).map((row) => row.id);
    if (ids.length === 0) return 0;

    const candidates = await tx.query(
      `SELECT id FROM clinical_evidence_extraction_candidates
       WHERE organization_id = $1 AND clinic_id = $2
         AND extraction_run_id = ANY($3::uuid[])
         AND status = 'EXTRACTED_UNVERIFIED'`,
      [tenant.organizationId, tenant.clinicId, ids],
    );
    const candidateIds = (candidates.rows as { id: string }[])
      .map((row) => String(row.id))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const candidateId of candidateIds) {
      await lockF3cReviewedCueSource(tx, tenant, candidateId);
    }
    await factCandidates.lockIdentitiesForActiveLinkedCandidates(tenant, tx, candidateIds);

    await tx.query(
      `UPDATE clinical_evidence_extraction_candidates SET status = 'SUPERSEDED'
       WHERE organization_id = $1 AND clinic_id = $2
         AND extraction_run_id = ANY($3::uuid[])
         AND status = 'EXTRACTED_UNVERIFIED'`,
      [tenant.organizationId, tenant.clinicId, ids],
    );
    await factCandidates.supersedeActiveLinkedToCandidates(tenant, tx, candidateIds);
    return ids.length;
  }

  async insertCandidates(
    tenant: TenantContext,
    tx: TransactionContext,
    runId: string,
    candidates: readonly ExtractionCandidateDto[],
  ): Promise<ExtractionCandidateDto[]> {
    const out: ExtractionCandidateDto[] = [];
    for (const c of candidates) {
      assertNoStorageInLocator(c.sourceLocator);
      const locator = validateAndCanonicalizeLocator(c.sourceLocator);
      const r = await tx.query(
        `INSERT INTO clinical_evidence_extraction_candidates (
           extraction_run_id, organization_id, clinic_id, patient_id, consultation_id,
           evidence_item_id, page_number, source_locator, candidate_type, raw_text,
           normalized_text, unit_text, reference_range_text, method, extractor_name,
           extractor_version, model_or_langpack_version, confidence, status,
           limitation_codes, content_fingerprint, verification_posture, script_hint
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,'UNVERIFIED',$22
         ) RETURNING *`,
        [
          runId,
          tenant.organizationId,
          tenant.clinicId,
          c.patientId,
          c.consultationId,
          c.evidenceItemId,
          c.pageNumber,
          JSON.stringify(locator),
          c.candidateType,
          c.rawText,
          c.normalizedText,
          c.unitText,
          c.referenceRangeText,
          c.method,
          c.extractorName,
          c.extractorVersion,
          c.modelOrLangpackVersion,
          c.confidence,
          c.status,
          c.limitationCodes,
          c.contentFingerprint,
          c.scriptHint,
        ],
      );
      out.push(mapCandidate(r.rows[0] as Record<string, unknown>));
    }
    return out;
  }

  async listCandidatesForEvidence(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
  ): Promise<ExtractionCandidateDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_candidates
       WHERE organization_id = $1 AND clinic_id = $2 AND evidence_item_id = $3
       ORDER BY created_at ASC, page_number ASC`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapCandidate);
  }

  async countFindingsForEvidence(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
  ): Promise<number> {
    const r = await tx.query(
      `SELECT count(*)::int AS n FROM structured_report_findings
       WHERE organization_id = $1 AND clinic_id = $2 AND evidence_item_id = $3`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId],
    );
    return Number((r.rows[0] as { n: number }).n);
  }

  async countCandidatesForEvidence(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
  ): Promise<number> {
    const r = await tx.query(
      `SELECT count(*)::int AS n FROM clinical_evidence_extraction_candidates
       WHERE organization_id = $1 AND clinic_id = $2 AND evidence_item_id = $3`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId],
    );
    return Number((r.rows[0] as { n: number }).n);
  }

  async countRunsForEvidence(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
  ): Promise<number> {
    const r = await tx.query(
      `SELECT count(*)::int AS n FROM clinical_evidence_extraction_runs
       WHERE organization_id = $1 AND clinic_id = $2 AND evidence_item_id = $3`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId],
    );
    return Number((r.rows[0] as { n: number }).n);
  }

  /**
   * Fail-closed retention gate: append-only history — never delete candidates/runs in F3B.
   * Returns false when a new extraction must be rejected with RETENTION_CAP_REACHED.
   */
  async isRetentionCapReached(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
    maxCandidates = MAX_CANDIDATES_PER_EVIDENCE,
    maxRuns = MAX_EXTRACTION_RUNS_PER_EVIDENCE,
  ): Promise<boolean> {
    const candidates = await this.countCandidatesForEvidence(tenant, tx, evidenceItemId);
    if (candidates >= maxCandidates) return true;
    const runs = await this.countRunsForEvidence(tenant, tx, evidenceItemId);
    return runs >= maxRuns;
  }

  async findCandidateById(
    tenant: TenantContext,
    tx: TransactionContext,
    candidateId: string,
  ): Promise<ExtractionCandidateDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_candidates
       WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, candidateId],
    );
    return r.rows[0] ? mapCandidate(r.rows[0] as Record<string, unknown>) : null;
  }

  async listRunsForEvidence(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceItemId: string,
  ): Promise<ExtractionRunRecord[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_extraction_runs
       WHERE organization_id = $1 AND clinic_id = $2 AND evidence_item_id = $3
       ORDER BY created_at ASC`,
      [tenant.organizationId, tenant.clinicId, evidenceItemId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapRun);
  }
}
