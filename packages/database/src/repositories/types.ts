import type { TenantContext, TransactionContext } from '../tenantContext.js';
import type { ReviewState } from '../reviewTransitions.js';
import type { ConsultationStatus } from '../consultationTransitions.js';

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type UserRecord = {
  id: string;
  publicId: string;
  status: string;
  displayName: string | null;
};

export type OrganizationRecord = {
  id: string;
  publicId: string;
  name: string;
  status: string;
};

export type MembershipRecord = {
  id: string;
  userId: string;
  organizationId: string;
  clinicId: string | null;
  status: string;
};

export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'LEGAL_HOLD';

export type PatientRecord = {
  id: string;
  publicId: string;
  organizationId: string;
  clinicId: string;
  displayName: string;
  dateOfBirth: string | null;
  sexAtBirth: string | null;
  phoneMasked: string | null;
  emailMasked: string | null;
  status: PatientStatus;
  updatedAt: string;
};

export type PatientCreateInput = {
  displayName: string;
  dateOfBirth?: string | null;
  sexAtBirth?: string | null;
  phoneMasked?: string | null;
  emailMasked?: string | null;
};

export type PatientUpdateInput = {
  displayName?: string;
  dateOfBirth?: string | null;
  sexAtBirth?: string | null;
  phoneMasked?: string | null;
  emailMasked?: string | null;
};

export type ConsultationRecord = {
  id: string;
  publicId: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  doctorUserId: string;
  status: ConsultationStatus;
  chiefComplaintText: string | null;
  consultationAt: string;
  updatedAt: string;
};

export type ClinicalAnalysisRecord = {
  id: string;
  consultationId: string;
  engineVersion: string;
  rulesVersion: string;
  diseaseDataVersion: string;
  medicineDataVersion: string;
  inputHash: string;
  contentHash: string;
};

export type PrescriptionVersionRecord = {
  id: string;
  consultationId: string;
  versionNumber: number;
  previousVersionId: string | null;
  reviewState: ReviewState;
  contentHash: string;
  inputHash: string;
  engineVersion: string;
  rulesVersion: string;
  diseaseDataVersion: string;
  medicineDataVersion: string;
  readableSnapshot: string;
  structuredPrescription: unknown;
  modificationReason: string | null;
};

export type SummarySnapshotRecord = {
  id: string;
  consultationId: string;
  contentHash: string;
  inputHash: string;
  readableText: string;
  versionLabel: string | null;
};

export type ReportFindingRecord = {
  id: string;
  consultationId: string;
  verificationStatus: string;
  valueText: string;
  verifiedByActorId: string | null;
  verifiedAt: string | null;
};

export type AuditEventRecord = {
  id: string;
  eventType: string;
  outcome: string;
  createdAt: string;
};

export interface UserRepository {
  create(
    tx: TransactionContext,
    input: { displayName: string; actorId: string },
  ): Promise<UserRecord>;
  findById(tx: TransactionContext, id: string): Promise<UserRecord | null>;
}

export interface OrganizationRepository {
  create(
    tx: TransactionContext,
    input: { name: string; actorId: string },
  ): Promise<OrganizationRecord>;
  createClinic(
    tx: TransactionContext,
    input: { organizationId: string; name: string; actorId: string },
  ): Promise<{ id: string; organizationId: string; name: string }>;
}

export interface MembershipRepository {
  create(
    tx: TransactionContext,
    input: {
      userId: string;
      organizationId: string;
      clinicId: string;
      status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
      actorId: string;
    },
  ): Promise<MembershipRecord>;
}

export interface PatientRepository {
  create(
    tenant: TenantContext,
    tx: TransactionContext,
    input: PatientCreateInput,
  ): Promise<PatientRecord>;
  findById(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
  ): Promise<PatientRecord | null>;
  listByClinic(
    tenant: TenantContext,
    tx: TransactionContext,
    opts?: { cursor?: string; limit?: number; status?: PatientStatus; displayNamePrefix?: string },
  ): Promise<CursorPage<PatientRecord>>;
  updateAllowedFields(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
    input: PatientUpdateInput,
    expectedUpdatedAt?: string,
  ): Promise<PatientRecord>;
  archive(tenant: TenantContext, tx: TransactionContext, patientId: string): Promise<PatientRecord>;
}

export interface ConsultationRepository {
  create(
    tenant: TenantContext,
    tx: TransactionContext,
    input: { patientId: string; doctorUserId: string; chiefComplaintText?: string | null },
  ): Promise<ConsultationRecord>;
  findById(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<ConsultationRecord | null>;
  listByPatient(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
    opts?: { cursor?: string; limit?: number },
  ): Promise<CursorPage<ConsultationRecord>>;
  listByTenant(
    tenant: TenantContext,
    tx: TransactionContext,
    opts?: { cursor?: string; limit?: number; status?: ConsultationStatus },
  ): Promise<CursorPage<ConsultationRecord>>;
  updateAllowedFields(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    input: { chiefComplaintText?: string | null },
  ): Promise<ConsultationRecord>;
  transitionStatus(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    to: ConsultationStatus,
    expectedUpdatedAt?: string,
  ): Promise<ConsultationRecord>;
}

export interface ClinicalAnalysisRepository {
  create(
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
  ): Promise<ClinicalAnalysisRecord>;
}

export interface PrescriptionRepository {
  createGenerated(
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
  ): Promise<PrescriptionVersionRecord>;
  transition(
    tenant: TenantContext,
    tx: TransactionContext,
    prescriptionId: string,
    to: ReviewState,
    modificationReason?: string | null,
  ): Promise<PrescriptionVersionRecord>;
  createModifiedVersion(
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
  ): Promise<PrescriptionVersionRecord>;
  findById(
    tenant: TenantContext,
    tx: TransactionContext,
    id: string,
  ): Promise<PrescriptionVersionRecord | null>;
  listByConsultation(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<PrescriptionVersionRecord[]>;
}

export interface SummarySnapshotRepository {
  create(
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
  ): Promise<SummarySnapshotRecord>;
  findById(
    tenant: TenantContext,
    tx: TransactionContext,
    id: string,
  ): Promise<SummarySnapshotRecord | null>;
  listByConsultation(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<SummarySnapshotRecord[]>;
}

export interface ReportFindingRepository {
  create(
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
  ): Promise<ReportFindingRecord>;
  createBatch(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    findings: readonly {
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
    }[],
  ): Promise<ReportFindingRecord[]>;
}

export interface AuditEventRepository {
  append(
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
  ): Promise<AuditEventRecord>;
}
