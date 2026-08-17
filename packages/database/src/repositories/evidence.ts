import type { TenantContext, TransactionContext } from '../tenantContext.js';
import type {
  EvidenceProcessingStatus,
  EvidenceSourceType,
  EvidenceType,
  MalwareScanResult,
} from '@ehas2/evidence-ingest';

export type EvidenceItemRecord = {
  id: string;
  publicId: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  submittedByActorId: string;
  evidenceType: EvidenceType;
  sourceType: EvidenceSourceType;
  filenameSanitized: string;
  originalFilenameRetained: false;
  declaredMime: string;
  detectedMime: string | null;
  byteSize: number | null;
  contentSha256: string | null;
  capturedOrIssuedOn: string | null;
  ingestedAt: string;
  processingStatus: EvidenceProcessingStatus;
  extractionStatus: 'NOT_AUTHORIZED';
  confidencePosture: 'NONE';
  clinicalAuthority: 'NOT_AUTHORITATIVE';
  sourceAuditEventId: string | null;
  rejectionCode: string | null;
  rejectionReasonSafe: string | null;
  retentionClass: 'TEMPORARY_ORIGINAL';
  expiresAt: string;
  deletedAt: string | null;
  deletionVerificationStatus: string;
  malwareScanResult: MalwareScanResult;
};

export type EvidenceBlobRecord = {
  evidenceId: string;
  objectKey: string;
  bytesPresent: boolean;
  storageProvider: 'memory_fake';
};

export type EvidenceJobRecord = {
  id: string;
  evidenceId: string;
  organizationId: string;
  clinicId: string;
  jobType: 'DELETE_ORIGINAL' | 'VERIFY_DELETION';
  status: 'PENDING' | 'LEASED' | 'SUCCEEDED' | 'FAILED' | 'DEAD';
  attempt: number;
  maxAttempts: number;
  nextRunAt: string;
  lastErrorCode: string | null;
};

function mapDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapTs(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function mapEvidence(row: Record<string, unknown>): EvidenceItemRecord {
  return {
    id: String(row.id),
    publicId: String(row.public_id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    submittedByActorId: String(row.submitted_by_actor_id),
    evidenceType: String(row.evidence_type) as EvidenceType,
    sourceType: String(row.source_type) as EvidenceSourceType,
    filenameSanitized: String(row.filename_sanitized),
    originalFilenameRetained: false,
    declaredMime: String(row.declared_mime),
    detectedMime: row.detected_mime == null ? null : String(row.detected_mime),
    byteSize: row.byte_size == null ? null : Number(row.byte_size),
    contentSha256: row.content_sha256 == null ? null : String(row.content_sha256),
    capturedOrIssuedOn: mapDate(row.captured_or_issued_on),
    ingestedAt: mapTs(row.ingested_at),
    processingStatus: String(row.processing_status) as EvidenceProcessingStatus,
    extractionStatus: 'NOT_AUTHORIZED',
    confidencePosture: 'NONE',
    clinicalAuthority: 'NOT_AUTHORITATIVE',
    sourceAuditEventId:
      row.source_audit_event_id == null ? null : String(row.source_audit_event_id),
    rejectionCode: row.rejection_code == null ? null : String(row.rejection_code),
    rejectionReasonSafe:
      row.rejection_reason_safe == null ? null : String(row.rejection_reason_safe),
    retentionClass: 'TEMPORARY_ORIGINAL',
    expiresAt: mapTs(row.expires_at),
    deletedAt: row.deleted_at == null ? null : mapTs(row.deleted_at),
    deletionVerificationStatus: String(row.deletion_verification_status),
    malwareScanResult: String(row.malware_scan_result) as MalwareScanResult,
  };
}

export class PgEvidenceRepository {
  async insertCreated(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      patientId: string;
      consultationId: string;
      evidenceType: EvidenceType;
      sourceType: EvidenceSourceType;
      filenameSanitized: string;
      declaredMime: string;
      capturedOrIssuedOn: string | null;
      expiresAt: Date;
      idempotencyKey: string | null;
    },
  ): Promise<EvidenceItemRecord> {
    const r = await tx.query(
      `INSERT INTO clinical_evidence_items (
         organization_id, clinic_id, patient_id, consultation_id,
         submitted_by_actor_id, evidence_type, source_type, filename_sanitized,
         declared_mime, captured_or_issued_on, processing_status, expires_at,
         idempotency_key, created_by_actor_id, updated_by_actor_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,'INTAKE_CREATED',$11,$12,$5,$5)
       RETURNING *`,
      [
        tenant.organizationId,
        tenant.clinicId,
        input.patientId,
        input.consultationId,
        tenant.actorId,
        input.evidenceType,
        input.sourceType,
        input.filenameSanitized,
        input.declaredMime,
        input.capturedOrIssuedOn,
        input.expiresAt.toISOString(),
        input.idempotencyKey,
      ],
    );
    return mapEvidence(r.rows[0] as Record<string, unknown>);
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceId: string,
  ): Promise<EvidenceItemRecord | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_items
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [evidenceId, tenant.organizationId, tenant.clinicId],
    );
    return r.rows[0] ? mapEvidence(r.rows[0] as Record<string, unknown>) : null;
  }

  async findByIdempotency(
    tenant: TenantContext,
    tx: TransactionContext,
    key: string,
  ): Promise<EvidenceItemRecord | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_items
       WHERE organization_id = $1 AND clinic_id = $2
         AND submitted_by_actor_id = $3 AND idempotency_key = $4`,
      [tenant.organizationId, tenant.clinicId, tenant.actorId, key],
    );
    return r.rows[0] ? mapEvidence(r.rows[0] as Record<string, unknown>) : null;
  }

  async findBySha(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    sha256: string,
  ): Promise<EvidenceItemRecord | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_items
       WHERE organization_id = $1 AND clinic_id = $2
         AND consultation_id = $3 AND content_sha256 = $4
         AND processing_status <> 'REJECTED'
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, consultationId, sha256],
    );
    return r.rows[0] ? mapEvidence(r.rows[0] as Record<string, unknown>) : null;
  }

  async listByConsultation(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<EvidenceItemRecord[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_items
       WHERE organization_id = $1 AND clinic_id = $2 AND consultation_id = $3
       ORDER BY ingested_at ASC`,
      [tenant.organizationId, tenant.clinicId, consultationId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapEvidence);
  }

  async countActiveForConsultation(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<number> {
    const r = await tx.query(
      `SELECT count(*)::int AS n FROM clinical_evidence_items
       WHERE organization_id = $1 AND clinic_id = $2 AND consultation_id = $3
         AND processing_status NOT IN ('REJECTED', 'DELETED', 'DELETION_VERIFIED')`,
      [tenant.organizationId, tenant.clinicId, consultationId],
    );
    return Number((r.rows[0] as { n: number }).n);
  }

  async markRejected(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceId: string,
    code: string,
  ): Promise<EvidenceItemRecord> {
    const r = await tx.query(
      `UPDATE clinical_evidence_items SET
         processing_status = 'REJECTED',
         rejection_code = $4,
         rejection_reason_safe = $4,
         updated_at = now(),
         updated_by_actor_id = $5
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3
       RETURNING *`,
      [evidenceId, tenant.organizationId, tenant.clinicId, code, tenant.actorId],
    );
    return mapEvidence(r.rows[0] as Record<string, unknown>);
  }

  async markStoredTemp(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceId: string,
    input: {
      detectedMime: string;
      byteSize: number;
      contentSha256: string;
      malwareScanResult: MalwareScanResult;
      auditEventId: string | null;
    },
  ): Promise<EvidenceItemRecord> {
    const r = await tx.query(
      `UPDATE clinical_evidence_items SET
         processing_status = 'MALWARE_PENDING',
         detected_mime = $4,
         byte_size = $5,
         content_sha256 = $6,
         malware_scan_result = $7,
         source_audit_event_id = $8,
         updated_at = now(),
         updated_by_actor_id = $9
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3
       RETURNING *`,
      [
        evidenceId,
        tenant.organizationId,
        tenant.clinicId,
        input.detectedMime,
        input.byteSize,
        input.contentSha256,
        input.malwareScanResult,
        input.auditEventId,
        tenant.actorId,
      ],
    );
    return mapEvidence(r.rows[0] as Record<string, unknown>);
  }

  async markDeletePending(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceId: string,
  ): Promise<void> {
    await tx.query(
      `UPDATE clinical_evidence_items SET
         processing_status = 'DELETE_PENDING', updated_at = now()
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [evidenceId, tenant.organizationId, tenant.clinicId],
    );
  }

  async markDeleted(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceId: string,
  ): Promise<void> {
    await tx.query(
      `UPDATE clinical_evidence_items SET
         processing_status = 'DELETED', deleted_at = now(), updated_at = now()
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [evidenceId, tenant.organizationId, tenant.clinicId],
    );
  }

  async markDeletionVerified(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceId: string,
    status: 'VERIFIED' | 'DELETION_VERIFICATION_FAILED',
  ): Promise<void> {
    const processing = status === 'VERIFIED' ? 'DELETION_VERIFIED' : 'DELETED';
    await tx.query(
      `UPDATE clinical_evidence_items SET
         processing_status = $4,
         deletion_verification_status = $5,
         updated_at = now()
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [evidenceId, tenant.organizationId, tenant.clinicId, processing, status],
    );
  }

  async upsertBlob(
    tenant: TenantContext,
    tx: TransactionContext,
    input: { evidenceId: string; objectKey: string; bytesPresent: boolean },
  ): Promise<EvidenceBlobRecord> {
    const r = await tx.query(
      `INSERT INTO clinical_evidence_blobs (
         evidence_id, organization_id, clinic_id, object_key, bytes_present
       ) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (evidence_id) DO UPDATE SET
         object_key = EXCLUDED.object_key,
         bytes_present = EXCLUDED.bytes_present,
         updated_at = now()
       RETURNING *`,
      [
        input.evidenceId,
        tenant.organizationId,
        tenant.clinicId,
        input.objectKey,
        input.bytesPresent,
      ],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      evidenceId: String(row.evidence_id),
      objectKey: String(row.object_key),
      bytesPresent: Boolean(row.bytes_present),
      storageProvider: 'memory_fake',
    };
  }

  async findBlob(
    tenant: TenantContext,
    tx: TransactionContext,
    evidenceId: string,
  ): Promise<EvidenceBlobRecord | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_evidence_blobs
       WHERE evidence_id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [evidenceId, tenant.organizationId, tenant.clinicId],
    );
    if (!r.rows[0]) return null;
    const row = r.rows[0] as Record<string, unknown>;
    return {
      evidenceId: String(row.evidence_id),
      objectKey: String(row.object_key),
      bytesPresent: Boolean(row.bytes_present),
      storageProvider: 'memory_fake',
    };
  }

  async enqueueJob(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      evidenceId: string;
      jobType: 'DELETE_ORIGINAL' | 'VERIFY_DELETION';
      nextRunAt: Date;
    },
  ): Promise<EvidenceJobRecord> {
    const r = await tx.query(
      `INSERT INTO clinical_evidence_jobs (
         evidence_id, organization_id, clinic_id, job_type, next_run_at
       ) VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        input.evidenceId,
        tenant.organizationId,
        tenant.clinicId,
        input.jobType,
        input.nextRunAt.toISOString(),
      ],
    );
    return mapJob(r.rows[0] as Record<string, unknown>);
  }

  async claimDueJobs(
    tenant: TenantContext,
    tx: TransactionContext,
    workerId: string,
    now: Date,
    leaseMs: number,
  ): Promise<EvidenceJobRecord[]> {
    const r = await tx.query(
      `UPDATE clinical_evidence_jobs SET
         status = 'LEASED',
         locked_by = $4,
         lease_expires_at = $5::timestamptz,
         attempt = attempt + 1,
         updated_at = now()
       WHERE id IN (
         SELECT id FROM clinical_evidence_jobs
         WHERE organization_id = $1 AND clinic_id = $2
           AND status IN ('PENDING', 'FAILED')
           AND next_run_at <= $3::timestamptz
         ORDER BY next_run_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 20
       )
       RETURNING *`,
      [
        tenant.organizationId,
        tenant.clinicId,
        now.toISOString(),
        workerId,
        new Date(now.getTime() + leaseMs).toISOString(),
      ],
    );
    return (r.rows as Record<string, unknown>[]).map(mapJob);
  }

  async finishJob(
    tenant: TenantContext,
    tx: TransactionContext,
    job: EvidenceJobRecord,
    result: 'SUCCEEDED' | 'FAILED' | 'DEAD',
    errorCode: string | null,
    nextRunAt: Date | null,
  ): Promise<void> {
    await tx.query(
      `UPDATE clinical_evidence_jobs SET
         status = $4,
         last_error_code = $5,
         locked_by = NULL,
         lease_expires_at = NULL,
         next_run_at = COALESCE($6::timestamptz, next_run_at),
         updated_at = now()
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [
        job.id,
        tenant.organizationId,
        tenant.clinicId,
        result,
        errorCode,
        nextRunAt ? nextRunAt.toISOString() : null,
      ],
    );
  }
}

function mapJob(row: Record<string, unknown>): EvidenceJobRecord {
  return {
    id: String(row.id),
    evidenceId: String(row.evidence_id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    jobType: String(row.job_type) as EvidenceJobRecord['jobType'],
    status: String(row.status) as EvidenceJobRecord['status'],
    attempt: Number(row.attempt),
    maxAttempts: Number(row.max_attempts),
    nextRunAt: new Date(String(row.next_run_at)).toISOString(),
    lastErrorCode: row.last_error_code == null ? null : String(row.last_error_code),
  };
}
