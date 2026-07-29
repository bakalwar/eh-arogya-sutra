import { CrossTenantDeniedError, ImmutablePrescriptionError } from '../errors.js';
import { assertValidReviewTransition, type ReviewState } from '../reviewTransitions.js';
import {
  assertTenantContext,
  type TenantContext,
  type TransactionContext,
} from '../tenantContext.js';
import type {
  AuditEventRecord,
  AuditEventRepository,
  ClinicalAnalysisRecord,
  ClinicalAnalysisRepository,
  ConsultationRecord,
  ConsultationRepository,
  MembershipRecord,
  MembershipRepository,
  OrganizationRecord,
  OrganizationRepository,
  PatientRecord,
  PatientRepository,
  PrescriptionRepository,
  PrescriptionVersionRecord,
  ReportFindingRecord,
  ReportFindingRepository,
  SummarySnapshotRecord,
  SummarySnapshotRepository,
  UserRecord,
  UserRepository,
} from './types.js';

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    publicId: String(row.public_id),
    status: String(row.status),
    displayName: row.display_name == null ? null : String(row.display_name),
  };
}

function mapPatient(row: Record<string, unknown>): PatientRecord {
  return {
    id: String(row.id),
    publicId: String(row.public_id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    displayName: String(row.display_name),
    status: String(row.status),
  };
}

function mapConsultation(row: Record<string, unknown>): ConsultationRecord {
  return {
    id: String(row.id),
    publicId: String(row.public_id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    doctorUserId: String(row.doctor_user_id),
    status: String(row.status),
    consultationAt: new Date(String(row.consultation_at)).toISOString(),
  };
}

function mapPrescription(row: Record<string, unknown>): PrescriptionVersionRecord {
  return {
    id: String(row.id),
    consultationId: String(row.consultation_id),
    versionNumber: Number(row.version_number),
    previousVersionId: row.previous_version_id == null ? null : String(row.previous_version_id),
    reviewState: row.review_state as ReviewState,
    contentHash: String(row.content_hash),
    inputHash: String(row.input_hash),
    engineVersion: String(row.engine_version),
    rulesVersion: String(row.rules_version),
    diseaseDataVersion: String(row.disease_data_version),
    medicineDataVersion: String(row.medicine_data_version),
    readableSnapshot: String(row.readable_snapshot),
    structuredPrescription: row.structured_prescription,
    modificationReason: row.modification_reason == null ? null : String(row.modification_reason),
  };
}

export class PgUserRepository implements UserRepository {
  async create(
    tx: TransactionContext,
    input: { displayName: string; actorId: string },
  ): Promise<UserRecord> {
    const r = await tx.query(
      `INSERT INTO users (display_name, created_by_actor_id, updated_by_actor_id)
       VALUES ($1, $2, $2) RETURNING *`,
      [input.displayName, input.actorId],
    );
    return mapUser(r.rows[0] as Record<string, unknown>);
  }

  async findById(tx: TransactionContext, id: string): Promise<UserRecord | null> {
    const r = await tx.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return r.rows[0] ? mapUser(r.rows[0] as Record<string, unknown>) : null;
  }
}

export class PgOrganizationRepository implements OrganizationRepository {
  async create(
    tx: TransactionContext,
    input: { name: string; actorId: string },
  ): Promise<OrganizationRecord> {
    const r = await tx.query(
      `INSERT INTO organizations (name, created_by_actor_id, updated_by_actor_id)
       VALUES ($1, $2, $2) RETURNING *`,
      [input.name, input.actorId],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      publicId: String(row.public_id),
      name: String(row.name),
      status: String(row.status),
    };
  }

  async createClinic(
    tx: TransactionContext,
    input: { organizationId: string; name: string; actorId: string },
  ): Promise<{ id: string; organizationId: string; name: string }> {
    const r = await tx.query(
      `INSERT INTO clinics (organization_id, name, created_by_actor_id, updated_by_actor_id)
       VALUES ($1, $2, $3, $3) RETURNING id, organization_id, name`,
      [input.organizationId, input.name, input.actorId],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      organizationId: String(row.organization_id),
      name: String(row.name),
    };
  }
}

export class PgMembershipRepository implements MembershipRepository {
  async create(
    tx: TransactionContext,
    input: {
      userId: string;
      organizationId: string;
      clinicId: string;
      status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
      actorId: string;
    },
  ): Promise<MembershipRecord> {
    const r = await tx.query(
      `INSERT INTO memberships (user_id, organization_id, clinic_id, status, created_by_actor_id, updated_by_actor_id)
       VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
      [input.userId, input.organizationId, input.clinicId, input.status, input.actorId],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      organizationId: String(row.organization_id),
      clinicId: row.clinic_id == null ? null : String(row.clinic_id),
      status: String(row.status),
    };
  }
}

export class PgPatientRepository implements PatientRepository {
  async create(
    tenant: TenantContext,
    tx: TransactionContext,
    input: { displayName: string },
  ): Promise<PatientRecord> {
    assertTenantContext(tenant);
    const r = await tx.query(
      `INSERT INTO patients (organization_id, clinic_id, display_name, created_by_actor_id, updated_by_actor_id)
       VALUES ($1, $2, $3, $4, $4) RETURNING *`,
      [tenant.organizationId, tenant.clinicId, input.displayName, tenant.actorId],
    );
    return mapPatient(r.rows[0] as Record<string, unknown>);
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
  ): Promise<PatientRecord | null> {
    assertTenantContext(tenant);
    const r = await tx.query(
      `SELECT * FROM patients
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [patientId, tenant.organizationId, tenant.clinicId],
    );
    return r.rows[0] ? mapPatient(r.rows[0] as Record<string, unknown>) : null;
  }

  async listByClinic(
    tenant: TenantContext,
    tx: TransactionContext,
    opts: { cursor?: string; limit?: number } = {},
  ): Promise<{ items: PatientRecord[]; nextCursor: string | null }> {
    assertTenantContext(tenant);
    const limit = Math.min(opts.limit ?? 50, 100);
    const params: unknown[] = [tenant.organizationId, tenant.clinicId, limit + 1];
    let sql = `SELECT * FROM patients
      WHERE organization_id = $1 AND clinic_id = $2`;
    if (opts.cursor) {
      params.push(opts.cursor);
      sql += ` AND id > $4`;
    }
    sql += ` ORDER BY id ASC LIMIT $3`;
    const r = await tx.query(sql, params);
    const rows = r.rows as Record<string, unknown>[];
    const items = rows.slice(0, limit).map(mapPatient);
    const nextCursor = rows.length > limit ? (items[items.length - 1]?.id ?? null) : null;
    return { items, nextCursor };
  }
}

export class PgConsultationRepository implements ConsultationRepository {
  async create(
    tenant: TenantContext,
    tx: TransactionContext,
    input: { patientId: string; doctorUserId: string },
  ): Promise<ConsultationRecord> {
    assertTenantContext(tenant);
    const patient = await tx.query(
      `SELECT id FROM patients WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [input.patientId, tenant.organizationId, tenant.clinicId],
    );
    if (!patient.rows[0]) throw new CrossTenantDeniedError('Patient not in tenant');
    const r = await tx.query(
      `INSERT INTO consultations (
         organization_id, clinic_id, patient_id, doctor_user_id,
         created_by_actor_id, updated_by_actor_id
       ) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
      [tenant.organizationId, tenant.clinicId, input.patientId, input.doctorUserId, tenant.actorId],
    );
    return mapConsultation(r.rows[0] as Record<string, unknown>);
  }

  async listByPatient(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
    opts: { cursor?: string; limit?: number } = {},
  ): Promise<{ items: ConsultationRecord[]; nextCursor: string | null }> {
    assertTenantContext(tenant);
    const limit = Math.min(opts.limit ?? 50, 100);
    const params: unknown[] = [tenant.organizationId, tenant.clinicId, patientId, limit + 1];
    let sql = `SELECT * FROM consultations
      WHERE organization_id = $1 AND clinic_id = $2 AND patient_id = $3`;
    if (opts.cursor) {
      params.push(opts.cursor);
      sql += ` AND consultation_at < $5::timestamptz`;
    }
    sql += ` ORDER BY consultation_at DESC LIMIT $4`;
    const r = await tx.query(sql, params);
    const rows = r.rows as Record<string, unknown>[];
    const items = rows.slice(0, limit).map(mapConsultation);
    const nextCursor =
      rows.length > limit ? (items[items.length - 1]?.consultationAt ?? null) : null;
    return { items, nextCursor };
  }
}

export class PgClinicalAnalysisRepository implements ClinicalAnalysisRepository {
  async create(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      consultationId: string;
      engineVersion: string;
      rulesVersion: string;
      diseaseDataVersion: string;
      medicineDataVersion: string;
      inputHash: string;
      contentHash: string;
      structuredResult: unknown;
      evidence?: unknown;
      confidence?: number | null;
      unresolvedReason?: string | null;
    },
  ): Promise<ClinicalAnalysisRecord> {
    assertTenantContext(tenant);
    if (
      !input.engineVersion ||
      !input.rulesVersion ||
      !input.diseaseDataVersion ||
      !input.medicineDataVersion
    ) {
      throw new Error('engine/rule/data versions required');
    }
    if (!input.inputHash || !input.contentHash) {
      throw new Error('input hash and content hash required');
    }
    const r = await tx.query(
      `INSERT INTO clinical_analyses (
         consultation_id, organization_id, clinic_id, status,
         engine_version, rules_version, disease_data_version, medicine_data_version,
         input_hash, content_hash, evidence, confidence, unresolved_reason,
         structured_result, created_by_actor_id
       ) VALUES ($1,$2,$3,'GENERATED',$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13::jsonb,$14)
       RETURNING *`,
      [
        input.consultationId,
        tenant.organizationId,
        tenant.clinicId,
        input.engineVersion,
        input.rulesVersion,
        input.diseaseDataVersion,
        input.medicineDataVersion,
        input.inputHash,
        input.contentHash,
        JSON.stringify(input.evidence ?? {}),
        input.confidence ?? null,
        input.unresolvedReason ?? null,
        JSON.stringify(input.structuredResult),
        tenant.actorId,
      ],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      consultationId: String(row.consultation_id),
      engineVersion: String(row.engine_version),
      rulesVersion: String(row.rules_version),
      diseaseDataVersion: String(row.disease_data_version),
      medicineDataVersion: String(row.medicine_data_version),
      inputHash: String(row.input_hash),
      contentHash: String(row.content_hash),
    };
  }
}

export class PgPrescriptionRepository implements PrescriptionRepository {
  async createGenerated(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      consultationId: string;
      structuredPrescription: unknown;
      readableSnapshot: string;
      engineVersion: string;
      rulesVersion: string;
      diseaseDataVersion: string;
      medicineDataVersion: string;
      inputHash: string;
      contentHash: string;
    },
  ): Promise<PrescriptionVersionRecord> {
    assertTenantContext(tenant);
    if (!input.contentHash || !input.inputHash) throw new Error('content hash required');
    if (!input.engineVersion || !input.rulesVersion)
      throw new Error('engine/rule versions required');
    const r = await tx.query(
      `INSERT INTO prescription_versions (
         consultation_id, organization_id, clinic_id, version_number, previous_version_id,
         review_state, structured_prescription, readable_snapshot,
         engine_version, rules_version, disease_data_version, medicine_data_version,
         input_hash, content_hash, created_by_actor_id
       ) VALUES ($1,$2,$3,1,NULL,'GENERATED_PENDING_REVIEW',$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        input.consultationId,
        tenant.organizationId,
        tenant.clinicId,
        JSON.stringify(input.structuredPrescription),
        input.readableSnapshot,
        input.engineVersion,
        input.rulesVersion,
        input.diseaseDataVersion,
        input.medicineDataVersion,
        input.inputHash,
        input.contentHash,
        tenant.actorId,
      ],
    );
    return mapPrescription(r.rows[0] as Record<string, unknown>);
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    id: string,
  ): Promise<PrescriptionVersionRecord | null> {
    assertTenantContext(tenant);
    const r = await tx.query(
      `SELECT * FROM prescription_versions
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [id, tenant.organizationId, tenant.clinicId],
    );
    return r.rows[0] ? mapPrescription(r.rows[0] as Record<string, unknown>) : null;
  }

  async transition(
    tenant: TenantContext,
    tx: TransactionContext,
    prescriptionId: string,
    to: ReviewState,
    modificationReason: string | null = null,
  ): Promise<PrescriptionVersionRecord> {
    assertTenantContext(tenant);
    const current = await this.findById(tenant, tx, prescriptionId);
    if (!current) throw new CrossTenantDeniedError('Prescription not found');
    if (current.reviewState === 'ISSUED' && to !== 'SUPERSEDED') {
      throw new ImmutablePrescriptionError();
    }
    assertValidReviewTransition(current.reviewState, to);
    const r = await tx.query(
      `UPDATE prescription_versions
       SET review_state = $1, clinician_decision = $1, modification_reason = COALESCE($2, modification_reason)
       WHERE id = $3 AND organization_id = $4 AND clinic_id = $5
       RETURNING *`,
      [to, modificationReason, prescriptionId, tenant.organizationId, tenant.clinicId],
    );
    return mapPrescription(r.rows[0] as Record<string, unknown>);
  }

  async createModifiedVersion(
    tenant: TenantContext,
    tx: TransactionContext,
    previousId: string,
    input: {
      structuredPrescription: unknown;
      readableSnapshot: string;
      engineVersion: string;
      rulesVersion: string;
      diseaseDataVersion: string;
      medicineDataVersion: string;
      inputHash: string;
      contentHash: string;
      modificationReason: string;
    },
  ): Promise<PrescriptionVersionRecord> {
    assertTenantContext(tenant);
    if (!input.modificationReason.trim()) throw new Error('modification reason required');
    const previous = await this.findById(tenant, tx, previousId);
    if (!previous) throw new CrossTenantDeniedError('Previous prescription not found');
    if (previous.reviewState === 'ISSUED') {
      await this.transition(tenant, tx, previousId, 'SUPERSEDED', input.modificationReason);
    } else {
      assertValidReviewTransition(previous.reviewState, 'MODIFIED');
      await tx.query(
        `UPDATE prescription_versions SET review_state = 'MODIFIED', modification_reason = $1
         WHERE id = $2`,
        [input.modificationReason, previousId],
      );
    }
    const r = await tx.query(
      `INSERT INTO prescription_versions (
         consultation_id, organization_id, clinic_id, version_number, previous_version_id,
         review_state, structured_prescription, readable_snapshot,
         engine_version, rules_version, disease_data_version, medicine_data_version,
         input_hash, content_hash, modification_reason, created_by_actor_id
       ) VALUES ($1,$2,$3,$4,$5,'GENERATED_PENDING_REVIEW',$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        previous.consultationId,
        tenant.organizationId,
        tenant.clinicId,
        previous.versionNumber + 1,
        previous.id,
        JSON.stringify(input.structuredPrescription),
        input.readableSnapshot,
        input.engineVersion,
        input.rulesVersion,
        input.diseaseDataVersion,
        input.medicineDataVersion,
        input.inputHash,
        input.contentHash,
        input.modificationReason,
        tenant.actorId,
      ],
    );
    return mapPrescription(r.rows[0] as Record<string, unknown>);
  }
}

export class PgSummarySnapshotRepository implements SummarySnapshotRepository {
  async create(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      consultationId: string;
      prescriptionVersionId?: string | null;
      readableText: string;
      structuredSummary: unknown;
      engineVersion: string;
      rulesVersion: string;
      diseaseDataVersion: string;
      medicineDataVersion: string;
      inputHash: string;
      contentHash: string;
    },
  ): Promise<SummarySnapshotRecord> {
    assertTenantContext(tenant);
    if (!input.contentHash) throw new Error('content hash required');
    const r = await tx.query(
      `INSERT INTO clinical_summary_snapshots (
         consultation_id, organization_id, clinic_id, prescription_version_id,
         readable_text, structured_summary, engine_version, rules_version,
         disease_data_version, medicine_data_version, input_hash, content_hash, created_by_actor_id
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        input.consultationId,
        tenant.organizationId,
        tenant.clinicId,
        input.prescriptionVersionId ?? null,
        input.readableText,
        JSON.stringify(input.structuredSummary),
        input.engineVersion,
        input.rulesVersion,
        input.diseaseDataVersion,
        input.medicineDataVersion,
        input.inputHash,
        input.contentHash,
        tenant.actorId,
      ],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      consultationId: String(row.consultation_id),
      contentHash: String(row.content_hash),
      readableText: String(row.readable_text),
    };
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    id: string,
  ): Promise<SummarySnapshotRecord | null> {
    assertTenantContext(tenant);
    const r = await tx.query(
      `SELECT * FROM clinical_summary_snapshots
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [id, tenant.organizationId, tenant.clinicId],
    );
    if (!r.rows[0]) return null;
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      consultationId: String(row.consultation_id),
      contentHash: String(row.content_hash),
      readableText: String(row.readable_text),
    };
  }
}

export class PgReportFindingRepository implements ReportFindingRepository {
  async create(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      consultationId: string;
      reportCategory: string;
      valueText: string;
      verificationStatus: string;
      normalizedFinding?: string | null;
      unit?: string | null;
      referenceRange?: string | null;
      confidence?: number | null;
      verifiedByActorId?: string | null;
      verifiedAt?: string | null;
      doctorCorrection?: string | null;
      correctionReason?: string | null;
      extractionEngineVersion?: string | null;
    },
  ): Promise<ReportFindingRecord> {
    assertTenantContext(tenant);
    const r = await tx.query(
      `INSERT INTO structured_report_findings (
         consultation_id, organization_id, clinic_id, report_category,
         normalized_finding, value_text, unit, reference_range, confidence,
         verification_status, doctor_correction, correction_reason,
         verified_by_actor_id, verified_at, extraction_engine_version
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        input.consultationId,
        tenant.organizationId,
        tenant.clinicId,
        input.reportCategory,
        input.normalizedFinding ?? null,
        input.valueText,
        input.unit ?? null,
        input.referenceRange ?? null,
        input.confidence ?? null,
        input.verificationStatus,
        input.doctorCorrection ?? null,
        input.correctionReason ?? null,
        input.verifiedByActorId ?? null,
        input.verifiedAt ?? null,
        input.extractionEngineVersion ?? null,
      ],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      consultationId: String(row.consultation_id),
      verificationStatus: String(row.verification_status),
      valueText: String(row.value_text),
      verifiedByActorId: row.verified_by_actor_id == null ? null : String(row.verified_by_actor_id),
      verifiedAt: row.verified_at == null ? null : new Date(String(row.verified_at)).toISOString(),
    };
  }
}

const FORBIDDEN_AUDIT_KEYS = new Set([
  'otp',
  'token',
  'report_bytes',
  'base64',
  'image',
  'pdf',
  'secret',
]);

export class PgAuditEventRepository implements AuditEventRepository {
  async append(
    tx: TransactionContext,
    input: {
      organizationId?: string | null;
      clinicId?: string | null;
      actorId?: string | null;
      actorRole?: string | null;
      eventType: string;
      resourceType?: string | null;
      resourceId?: string | null;
      outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
      metadata?: Record<string, unknown>;
    },
  ): Promise<AuditEventRecord> {
    const metadata = { ...(input.metadata ?? {}) };
    for (const key of Object.keys(metadata)) {
      if (FORBIDDEN_AUDIT_KEYS.has(key.toLowerCase())) {
        throw new Error(`Audit metadata forbids sensitive key: ${key}`);
      }
    }
    const r = await tx.query(
      `INSERT INTO audit_events (
         organization_id, clinic_id, actor_id, actor_role, event_type,
         resource_type, resource_id, outcome, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
       RETURNING *`,
      [
        input.organizationId ?? null,
        input.clinicId ?? null,
        input.actorId ?? null,
        input.actorRole ?? null,
        input.eventType,
        input.resourceType ?? null,
        input.resourceId ?? null,
        input.outcome,
        JSON.stringify(metadata),
      ],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      eventType: String(row.event_type),
      outcome: String(row.outcome),
      createdAt: new Date(String(row.created_at)).toISOString(),
    };
  }
}

/** Explicit absence of unscoped patient listing — do not add findAllPatients(). */
export const UNSCOPED_PATIENT_METHODS_FORBIDDEN = ['findAllPatients'] as const;
