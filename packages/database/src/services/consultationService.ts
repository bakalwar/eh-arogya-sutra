import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { withTenantTransaction } from '../pool.js';
import {
  PgAuditEventRepository,
  PgConsultationRepository,
  PgPatientRepository,
  PgPrescriptionRepository,
  PgReportFindingRepository,
  PgSummarySnapshotRepository,
} from '../repositories/postgres.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import type {
  ConsultationRecord,
  PrescriptionVersionRecord,
  ReportFindingRecord,
  SummarySnapshotRecord,
} from '../repositories/types.js';
import { ResourceNotFoundError, ValidationError, ImmutableArtifactError } from '../domainErrors.js';
import { assertBoundedBatch, assertUuid, clampPageLimit, hashPayload } from '../validation.js';
import {
  assertValidConsultationTransition,
  consultationAllowsFieldUpdate,
  type ConsultationStatus,
} from '../consultationTransitions.js';
import { assertValidReviewTransition, type ReviewState } from '../reviewTransitions.js';
import { sanitizeDatabaseError } from '../errors.js';
import { lockChiefComplaintCueSource } from './cueSourceLock.js';

const consultations = new PgConsultationRepository();
const patients = new PgPatientRepository();
const findingsRepo = new PgReportFindingRepository();
const summaries = new PgSummarySnapshotRepository();
const prescriptions = new PgPrescriptionRepository();
const audit = new PgAuditEventRepository();
const idempotency = new PgIdempotencyRepository();

function assertCaseOwner(tenant: TenantContext, doctorUserId: string): void {
  if (tenant.actorRole === 'ClinicAdmin') return;
  if (tenant.actorRole === 'Doctor' && tenant.actorId === doctorUserId) return;
  throw new ResourceNotFoundError();
}

const FINDING_STATUSES = new Set([
  'EXTRACTED_UNVERIFIED',
  'NEEDS_REVIEW',
  'VERIFIED',
  'CORRECTED_BY_DOCTOR',
  'REJECTED_AS_INCORRECT',
  'NOT_CLINICALLY_USED',
]);

export class ConsultationService {
  async create(
    tenant: TenantContext,
    input: {
      patientId: string;
      chiefComplaintText?: string | null;
      idempotencyKey?: string;
    },
    env: Record<string, string | undefined> = process.env,
  ): Promise<ConsultationRecord> {
    assertTenantContext(tenant);
    assertUuid(input.patientId, 'patientId');
    const payload = {
      patientId: input.patientId,
      chiefComplaintText: input.chiefComplaintText?.trim() || null,
    };
    const requestHash = hashPayload(payload);
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'consultation.create',
          input.idempotencyKey,
          requestHash,
        );
        if (existing) {
          const found = await consultations.findById(tenant, tx, existing.resourceId);
          if (!found) throw new ResourceNotFoundError();
          return found;
        }
        const patient = await patients.findById(tenant, tx, input.patientId);
        if (!patient) throw new ResourceNotFoundError();
        if (patient.status === 'ARCHIVED' || patient.status === 'INACTIVE') {
          throw new ValidationError('Cannot create consultation for inactive patient');
        }
        const created = await consultations.create(tenant, tx, {
          patientId: input.patientId,
          doctorUserId: tenant.actorId,
          chiefComplaintText: payload.chiefComplaintText,
        });
        if (input.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'consultation.create',
            key: input.idempotencyKey,
            requestHash,
            resourceType: 'consultation',
            resourceId: created.id,
          });
        }
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'consultation_created',
          resourceType: 'consultation',
          resourceId: created.id,
          outcome: 'SUCCESS',
          metadata: { status: created.status },
        });
        return created;
      },
      env,
    );
  }

  async getById(
    tenant: TenantContext,
    consultationId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ConsultationRecord> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    const found = await withTenantTransaction(
      tenant,
      async (tx) => consultations.findById(tenant, tx, consultationId),
      env,
    );
    if (!found) throw new ResourceNotFoundError();
    return found;
  }

  async listForPatient(
    tenant: TenantContext,
    patientId: string,
    opts: { cursor?: string; limit?: number } = {},
    env: Record<string, string | undefined> = process.env,
  ): Promise<{ items: ConsultationRecord[]; nextCursor: string | null }> {
    assertTenantContext(tenant);
    assertUuid(patientId, 'patientId');
    const limit = clampPageLimit(opts.limit);
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const patient = await patients.findById(tenant, tx, patientId);
        if (!patient) throw new ResourceNotFoundError();
        return consultations.listByPatient(tenant, tx, patientId, { ...opts, limit });
      },
      env,
    );
  }

  async listTenant(
    tenant: TenantContext,
    opts: { cursor?: string; limit?: number; status?: ConsultationStatus } = {},
    env: Record<string, string | undefined> = process.env,
  ): Promise<{ items: ConsultationRecord[]; nextCursor: string | null }> {
    assertTenantContext(tenant);
    const limit = clampPageLimit(opts.limit);
    return withTenantTransaction(
      tenant,
      async (tx) => consultations.listByTenant(tenant, tx, { ...opts, limit }),
      env,
    );
  }

  async updateDraftFields(
    tenant: TenantContext,
    consultationId: string,
    input: { chiefComplaintText?: string | null },
    env: Record<string, string | undefined> = process.env,
  ): Promise<ConsultationRecord> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    const mutatesChiefComplaintText = Object.prototype.hasOwnProperty.call(
      input,
      'chiefComplaintText',
    );
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const current = await consultations.findById(tenant, tx, consultationId);
        if (!current) throw new ResourceNotFoundError();
        if (!consultationAllowsFieldUpdate(current.status)) {
          throw new ValidationError('Consultation fields are locked in current state');
        }
        if (mutatesChiefComplaintText) {
          assertCaseOwner(tenant, current.doctorUserId);
          await lockChiefComplaintCueSource(tx, tenant, consultationId);
          const locked = await consultations.findById(tenant, tx, consultationId);
          if (!locked) throw new ResourceNotFoundError();
          if (
            locked.organizationId !== tenant.organizationId ||
            locked.clinicId !== tenant.clinicId ||
            locked.id !== consultationId
          ) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          assertCaseOwner(tenant, locked.doctorUserId);
          if (!consultationAllowsFieldUpdate(locked.status)) {
            throw new ValidationError('Consultation fields are locked in current state');
          }
        }
        const updated = await consultations.updateAllowedFields(tenant, tx, consultationId, input);
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'consultation_updated',
          resourceType: 'consultation',
          resourceId: updated.id,
          outcome: 'SUCCESS',
          metadata: { status: updated.status },
        });
        return updated;
      },
      env,
    );
  }

  async transition(
    tenant: TenantContext,
    consultationId: string,
    to: ConsultationStatus,
    opts: { expectedUpdatedAt?: string; idempotencyKey?: string } = {},
    env: Record<string, string | undefined> = process.env,
  ): Promise<ConsultationRecord> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    const requestHash = hashPayload({ consultationId, to });
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'consultation.transition',
          opts.idempotencyKey,
          requestHash,
        );
        if (existing) {
          const found = await consultations.findById(tenant, tx, existing.resourceId);
          if (!found) throw new ResourceNotFoundError();
          return found;
        }
        const current = await consultations.findById(tenant, tx, consultationId);
        if (!current) throw new ResourceNotFoundError();
        assertValidConsultationTransition(current.status, to);
        const updated = await consultations.transitionStatus(
          tenant,
          tx,
          consultationId,
          to,
          opts.expectedUpdatedAt,
        );
        if (opts.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'consultation.transition',
            key: opts.idempotencyKey,
            requestHash,
            resourceType: 'consultation',
            resourceId: updated.id,
          });
        }
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'consultation_state_changed',
          resourceType: 'consultation',
          resourceId: updated.id,
          outcome: 'SUCCESS',
          metadata: { from: current.status, to: updated.status },
        });
        return updated;
      },
      env,
    );
  }

  async addStructuredFindings(
    tenant: TenantContext,
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
    env: Record<string, string | undefined> = process.env,
  ): Promise<ReportFindingRecord[]> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    assertBoundedBatch(findings.length);
    for (const f of findings) {
      if (!f.reportCategory?.trim() || !f.valueText?.trim()) {
        throw new ValidationError('Finding category and valueText required');
      }
      if (!FINDING_STATUSES.has(f.verificationStatus)) {
        throw new ValidationError('Invalid verificationStatus');
      }
    }
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const c = await consultations.findById(tenant, tx, consultationId);
        if (!c) throw new ResourceNotFoundError();
        const created = await findingsRepo.createBatch(tenant, tx, consultationId, findings);
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'structured_findings_added',
          resourceType: 'consultation',
          resourceId: consultationId,
          outcome: 'SUCCESS',
          metadata: { count: created.length },
        });
        return created;
      },
      env,
    );
  }

  async addSummaryRevision(
    tenant: TenantContext,
    input: {
      consultationId: string;
      readableText: string;
      structuredSummary: unknown;
      engineVersion: string;
      rulesVersion: string;
      diseaseDataVersion: string;
      medicineDataVersion: string;
      inputHash: string;
      contentHash: string;
      prescriptionVersionId?: string | null;
      idempotencyKey?: string;
    },
    env: Record<string, string | undefined> = process.env,
  ): Promise<SummarySnapshotRecord> {
    assertTenantContext(tenant);
    assertUuid(input.consultationId, 'consultationId');
    if (!input.readableText.trim() || !input.contentHash || !input.inputHash) {
      throw new ValidationError('Summary text and hashes required');
    }
    if (
      !input.engineVersion ||
      !input.rulesVersion ||
      !input.diseaseDataVersion ||
      !input.medicineDataVersion
    ) {
      throw new ValidationError('engine/rule/data versions required');
    }
    const requestHash = hashPayload({
      consultationId: input.consultationId,
      contentHash: input.contentHash,
      inputHash: input.inputHash,
    });
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'summary.create',
          input.idempotencyKey,
          requestHash,
        );
        if (existing) {
          const found = await summaries.findById(tenant, tx, existing.resourceId);
          if (!found) throw new ResourceNotFoundError();
          return found;
        }
        const c = await consultations.findById(tenant, tx, input.consultationId);
        if (!c) throw new ResourceNotFoundError();
        const created = await summaries.create(tenant, tx, input);
        if (input.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'summary.create',
            key: input.idempotencyKey,
            requestHash,
            resourceType: 'clinical_summary_snapshot',
            resourceId: created.id,
          });
        }
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'clinical_summary_revision_created',
          resourceType: 'clinical_summary_snapshot',
          resourceId: created.id,
          outcome: 'SUCCESS',
          metadata: { consultationId: input.consultationId, contentHash: input.contentHash },
        });
        return created;
      },
      env,
    );
  }

  async addPrescriptionRevision(
    tenant: TenantContext,
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
      previousId?: string;
      modificationReason?: string;
      idempotencyKey?: string;
    },
    env: Record<string, string | undefined> = process.env,
  ): Promise<PrescriptionVersionRecord> {
    assertTenantContext(tenant);
    assertUuid(input.consultationId, 'consultationId');
    if (!input.readableSnapshot.trim() || !input.contentHash || !input.inputHash) {
      throw new ValidationError('Prescription snapshot and hashes required');
    }
    const requestHash = hashPayload({
      consultationId: input.consultationId,
      contentHash: input.contentHash,
      previousId: input.previousId ?? null,
    });
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'prescription.create',
          input.idempotencyKey,
          requestHash,
        );
        if (existing) {
          const found = await prescriptions.findById(tenant, tx, existing.resourceId);
          if (!found) throw new ResourceNotFoundError();
          return found;
        }
        const c = await consultations.findById(tenant, tx, input.consultationId);
        if (!c) throw new ResourceNotFoundError();
        let created: PrescriptionVersionRecord;
        if (input.previousId) {
          if (!input.modificationReason?.trim()) {
            throw new ValidationError('modificationReason required for revision');
          }
          created = await prescriptions.createModifiedVersion(tenant, tx, input.previousId, {
            structuredPrescription: input.structuredPrescription,
            readableSnapshot: input.readableSnapshot,
            engineVersion: input.engineVersion,
            rulesVersion: input.rulesVersion,
            diseaseDataVersion: input.diseaseDataVersion,
            medicineDataVersion: input.medicineDataVersion,
            inputHash: input.inputHash,
            contentHash: input.contentHash,
            modificationReason: input.modificationReason,
          });
        } else {
          created = await prescriptions.createGenerated(tenant, tx, {
            consultationId: input.consultationId,
            structuredPrescription: input.structuredPrescription,
            readableSnapshot: input.readableSnapshot,
            engineVersion: input.engineVersion,
            rulesVersion: input.rulesVersion,
            diseaseDataVersion: input.diseaseDataVersion,
            medicineDataVersion: input.medicineDataVersion,
            inputHash: input.inputHash,
            contentHash: input.contentHash,
          });
        }
        if (input.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'prescription.create',
            key: input.idempotencyKey,
            requestHash,
            resourceType: 'prescription_version',
            resourceId: created.id,
          });
        }
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'prescription_revision_created',
          resourceType: 'prescription_version',
          resourceId: created.id,
          outcome: 'SUCCESS',
          metadata: {
            consultationId: input.consultationId,
            versionNumber: created.versionNumber,
            contentHash: created.contentHash,
          },
        });
        return created;
      },
      env,
    );
  }

  async transitionReview(
    tenant: TenantContext,
    prescriptionId: string,
    to: ReviewState,
    opts: { modificationReason?: string | null; idempotencyKey?: string } = {},
    env: Record<string, string | undefined> = process.env,
  ): Promise<PrescriptionVersionRecord> {
    assertTenantContext(tenant);
    assertUuid(prescriptionId, 'prescriptionId');
    const requestHash = hashPayload({ prescriptionId, to });
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'prescription.review',
          opts.idempotencyKey,
          requestHash,
        );
        if (existing) {
          const found = await prescriptions.findById(tenant, tx, existing.resourceId);
          if (!found) throw new ResourceNotFoundError();
          return found;
        }
        const current = await prescriptions.findById(tenant, tx, prescriptionId);
        if (!current) throw new ResourceNotFoundError();
        if (current.reviewState === 'ISSUED' && to !== 'SUPERSEDED') {
          throw new ImmutableArtifactError();
        }
        assertValidReviewTransition(current.reviewState, to);
        const updated = await prescriptions.transition(
          tenant,
          tx,
          prescriptionId,
          to,
          opts.modificationReason ?? null,
        );
        if (opts.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'prescription.review',
            key: opts.idempotencyKey,
            requestHash,
            resourceType: 'prescription_version',
            resourceId: updated.id,
          });
        }
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'clinician_review_recorded',
          resourceType: 'prescription_version',
          resourceId: updated.id,
          outcome: 'SUCCESS',
          metadata: { from: current.reviewState, to: updated.reviewState },
        });
        return updated;
      },
      env,
    );
  }

  async listPrescriptionVersions(
    tenant: TenantContext,
    consultationId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<PrescriptionVersionRecord[]> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const c = await consultations.findById(tenant, tx, consultationId);
        if (!c) throw new ResourceNotFoundError();
        return prescriptions.listByConsultation(tenant, tx, consultationId);
      },
      env,
    );
  }

  async listSummaryRevisions(
    tenant: TenantContext,
    consultationId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<SummarySnapshotRecord[]> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const c = await consultations.findById(tenant, tx, consultationId);
        if (!c) throw new ResourceNotFoundError();
        return summaries.listByConsultation(tenant, tx, consultationId);
      },
      env,
    );
  }

  safeError(err: unknown): { code: string; message: string } {
    if (
      err instanceof ResourceNotFoundError ||
      err instanceof ValidationError ||
      err instanceof ImmutableArtifactError
    ) {
      return { code: err.code, message: err.message };
    }
    return sanitizeDatabaseError(err);
  }
}

export const consultationService = new ConsultationService();
