import {
  EVIDENCE_SOURCE_TYPES,
  EVIDENCE_TTL_MINUTES,
  EVIDENCE_TYPES,
  MAX_EVIDENCE_PER_CONSULTATION,
  assertMalwareUnavailableIsNotClean,
  buildEvidenceObjectKey,
  defaultMalwareScanner,
  getMemoryFakeObjectStore,
  sanitizeEvidenceFilename,
  validateEvidenceBytes,
  type EvidenceObjectStore,
  type EvidenceSourceType,
  type EvidenceType,
  type MalwareScanner,
} from '@ehas2/evidence-ingest';
import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { withTenantTransaction } from '../pool.js';
import { PgAuditEventRepository, PgConsultationRepository } from '../repositories/postgres.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import {
  PgEvidenceRepository,
  type EvidenceItemRecord,
  type EvidenceJobRecord,
} from '../repositories/evidence.js';
import { ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import { assertOptionalIsoDate, assertUuid, hashPayload } from '../validation.js';

const evidenceRepo = new PgEvidenceRepository();
const consultations = new PgConsultationRepository();
const audit = new PgAuditEventRepository();
const idempotency = new PgIdempotencyRepository();

function assertCaseOwner(tenant: TenantContext, doctorUserId: string): void {
  if (tenant.actorRole === 'ClinicAdmin') return;
  if (tenant.actorRole === 'Doctor' && tenant.actorId === doctorUserId) return;
  throw new ResourceNotFoundError();
}

function isEvidenceType(value: string): value is EvidenceType {
  return (EVIDENCE_TYPES as readonly string[]).includes(value);
}

function isSourceType(value: string): value is EvidenceSourceType {
  return (EVIDENCE_SOURCE_TYPES as readonly string[]).includes(value);
}

export type EvidenceServiceDeps = {
  store?: EvidenceObjectStore;
  malwareScanner?: MalwareScanner;
};

export class EvidenceService {
  constructor(private readonly deps: EvidenceServiceDeps = {}) {}

  private store(): EvidenceObjectStore {
    return this.deps.store ?? getMemoryFakeObjectStore();
  }

  private scanner(): MalwareScanner {
    return this.deps.malwareScanner ?? defaultMalwareScanner;
  }

  async initiate(
    tenant: TenantContext,
    input: {
      consultationId: string;
      evidenceType: string;
      sourceType: string;
      filename: string;
      declaredMime: string;
      capturedOrIssuedOn?: string | null;
      idempotencyKey?: string;
    },
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceItemRecord> {
    assertTenantContext(tenant);
    assertUuid(input.consultationId, 'consultationId');
    const evidenceType = input.evidenceType;
    const sourceType = input.sourceType;
    if (!isEvidenceType(evidenceType)) throw new ValidationError('Invalid evidenceType');
    if (!isSourceType(sourceType)) throw new ValidationError('Invalid sourceType');
    const filenameSanitized = sanitizeEvidenceFilename(input.filename);
    if (!filenameSanitized) throw new ValidationError('FILENAME_REJECTED');
    const declaredMime = input.declaredMime.trim().toLowerCase();
    const capturedOrIssuedOn = assertOptionalIsoDate(
      input.capturedOrIssuedOn,
      'capturedOrIssuedOn',
    );
    const payload = {
      consultationId: input.consultationId,
      evidenceType,
      sourceType,
      filenameSanitized,
      declaredMime,
      capturedOrIssuedOn,
    };
    const requestHash = hashPayload(payload);
    const expiresAt = new Date(Date.now() + EVIDENCE_TTL_MINUTES * 60_000);
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existingKey = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'evidence.ingest',
          input.idempotencyKey,
          requestHash,
        );
        if (existingKey) {
          const found = await evidenceRepo.findById(tenant, tx, existingKey.resourceId);
          if (!found) throw new ResourceNotFoundError();
          return found;
        }
        const consultation = await consultations.findById(tenant, tx, input.consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        const count = await evidenceRepo.countActiveForConsultation(
          tenant,
          tx,
          input.consultationId,
        );
        if (count >= MAX_EVIDENCE_PER_CONSULTATION) {
          throw new ValidationError('EVIDENCE_LIMIT');
        }
        const created = await evidenceRepo.insertCreated(tenant, tx, {
          patientId: consultation.patientId,
          consultationId: input.consultationId,
          evidenceType,
          sourceType,
          filenameSanitized,
          declaredMime,
          capturedOrIssuedOn,
          expiresAt,
          idempotencyKey: input.idempotencyKey ?? null,
        });
        if (input.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'evidence.ingest',
            key: input.idempotencyKey,
            requestHash,
            resourceType: 'evidence',
            resourceId: created.id,
          });
        }
        const event = await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'evidence_intake_created',
          resourceType: 'evidence',
          resourceId: created.id,
          outcome: 'SUCCESS',
          metadata: { evidenceType: input.evidenceType, status: created.processingStatus },
        });
        void event;
        return created;
      },
      env,
    );
  }

  async receiveBytes(
    tenant: TenantContext,
    evidenceId: string,
    bytes: Uint8Array,
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceItemRecord> {
    assertTenantContext(tenant);
    assertUuid(evidenceId, 'evidenceId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!item) throw new ResourceNotFoundError();
        const consultation = await consultations.findById(tenant, tx, item.consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        if (item.processingStatus !== 'INTAKE_CREATED') {
          if (
            item.processingStatus === 'MALWARE_PENDING' ||
            item.processingStatus === 'STORED_TEMP'
          ) {
            return item;
          }
          throw new ValidationError('EVIDENCE_NOT_ACCEPTING_BYTES');
        }
        const validated = validateEvidenceBytes({
          filename: item.filenameSanitized,
          declaredMime: item.declaredMime,
          bytes,
        });
        if (!validated.ok) {
          await evidenceRepo.markRejected(tenant, tx, evidenceId, validated.code);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'evidence_rejected',
            resourceType: 'evidence',
            resourceId: evidenceId,
            outcome: 'FAILED',
            metadata: { code: validated.code },
          });
          throw new ValidationError(validated.code);
        }
        const duplicate = await evidenceRepo.findBySha(
          tenant,
          tx,
          item.consultationId,
          validated.contentSha256,
        );
        if (duplicate && duplicate.id !== item.id) {
          await evidenceRepo.markRejected(tenant, tx, evidenceId, 'DUPLICATE_FINGERPRINT');
          return duplicate;
        }
        const objectKey = buildEvidenceObjectKey({
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          consultationId: item.consultationId,
          evidenceId: item.id,
          contentSha256: validated.contentSha256,
        });
        await this.store().put(objectKey, bytes);
        const scan = await this.scanner().scan(objectKey);
        if (!assertMalwareUnavailableIsNotClean(scan) || scan === 'CLEAN') {
          await this.store().delete(objectKey);
          await evidenceRepo.markRejected(tenant, tx, evidenceId, 'MALWARE_CLEAN_FORBIDDEN');
          throw new ValidationError('MALWARE_CLEAN_FORBIDDEN');
        }
        if (scan === 'INFECTED') {
          await this.store().delete(objectKey);
          await evidenceRepo.markRejected(tenant, tx, evidenceId, 'MALWARE_INFECTED');
          throw new ValidationError('MALWARE_INFECTED');
        }
        await evidenceRepo.upsertBlob(tenant, tx, {
          evidenceId: item.id,
          objectKey,
          bytesPresent: true,
        });
        const stored = await evidenceRepo.markStoredTemp(tenant, tx, item.id, {
          detectedMime: validated.detectedMime,
          byteSize: validated.byteSize,
          contentSha256: validated.contentSha256,
          malwareScanResult: scan,
          auditEventId: null,
        });
        await evidenceRepo.enqueueJob(tenant, tx, {
          evidenceId: item.id,
          jobType: 'DELETE_ORIGINAL',
          nextRunAt: new Date(stored.expiresAt),
        });
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'evidence_stored_temp',
          resourceType: 'evidence',
          resourceId: item.id,
          outcome: 'SUCCESS',
          metadata: {
            status: stored.processingStatus,
            byteSize: validated.byteSize,
            malware: scan,
          },
        });
        return stored;
      },
      env,
    );
  }

  async get(
    tenant: TenantContext,
    evidenceId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceItemRecord> {
    assertTenantContext(tenant);
    assertUuid(evidenceId, 'evidenceId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!item) throw new ResourceNotFoundError();
        const consultation = await consultations.findById(tenant, tx, item.consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        return item;
      },
      env,
    );
  }

  async listByConsultation(
    tenant: TenantContext,
    consultationId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceItemRecord[]> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const consultation = await consultations.findById(tenant, tx, consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        return evidenceRepo.listByConsultation(tenant, tx, consultationId);
      },
      env,
    );
  }

  async abort(
    tenant: TenantContext,
    evidenceId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceItemRecord> {
    assertTenantContext(tenant);
    assertUuid(evidenceId, 'evidenceId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!item) throw new ResourceNotFoundError();
        const consultation = await consultations.findById(tenant, tx, item.consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        const blob = await evidenceRepo.findBlob(tenant, tx, evidenceId);
        if (blob?.bytesPresent) {
          await this.store().delete(blob.objectKey);
          await evidenceRepo.upsertBlob(tenant, tx, {
            evidenceId,
            objectKey: blob.objectKey,
            bytesPresent: false,
          });
        }
        const rejected = await evidenceRepo.markRejected(tenant, tx, evidenceId, 'ABORTED');
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'evidence_aborted',
          resourceType: 'evidence',
          resourceId: evidenceId,
          outcome: 'SUCCESS',
          metadata: { code: 'ABORTED' },
        });
        return rejected;
      },
      env,
    );
  }

  async runDueJobs(
    tenant: TenantContext,
    workerId: string,
    now: Date = new Date(),
    env: Record<string, string | undefined> = process.env,
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    assertTenantContext(tenant);
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const claimed = await withTenantTransaction(
      tenant,
      async (tx) => evidenceRepo.claimDueJobs(tenant, tx, workerId, now, 30_000),
      env,
    );
    for (const job of claimed) {
      processed += 1;
      try {
        await this.executeJob(tenant, job, now, env);
        succeeded += 1;
      } catch {
        failed += 1;
        await withTenantTransaction(
          tenant,
          async (tx) => {
            const nextAttempt = job.attempt >= job.maxAttempts ? 'DEAD' : 'FAILED';
            const backoff = new Date(now.getTime() + Math.min(job.attempt, 5) * 15_000);
            await evidenceRepo.finishJob(
              tenant,
              tx,
              job,
              nextAttempt,
              'JOB_FAILED',
              nextAttempt === 'FAILED' ? backoff : null,
            );
            await audit.append(tx, {
              organizationId: tenant.organizationId,
              clinicId: tenant.clinicId,
              actorId: tenant.actorId,
              actorRole: tenant.actorRole,
              eventType: 'evidence_job_failed',
              resourceType: 'evidence',
              resourceId: job.evidenceId,
              outcome: 'FAILED',
              metadata: { code: 'JOB_FAILED', jobType: job.jobType },
            });
          },
          env,
        );
      }
    }
    return { processed, succeeded, failed };
  }

  private async executeJob(
    tenant: TenantContext,
    job: EvidenceJobRecord,
    now: Date,
    env: Record<string, string | undefined>,
  ): Promise<void> {
    await withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, job.evidenceId);
        if (!item) throw new ResourceNotFoundError();
        const blob = await evidenceRepo.findBlob(tenant, tx, job.evidenceId);
        if (job.jobType === 'DELETE_ORIGINAL') {
          await evidenceRepo.markDeletePending(tenant, tx, job.evidenceId);
          if (blob) {
            await this.store().delete(blob.objectKey);
            await evidenceRepo.upsertBlob(tenant, tx, {
              evidenceId: job.evidenceId,
              objectKey: blob.objectKey,
              bytesPresent: false,
            });
          }
          await evidenceRepo.markDeleted(tenant, tx, job.evidenceId);
          await evidenceRepo.enqueueJob(tenant, tx, {
            evidenceId: job.evidenceId,
            jobType: 'VERIFY_DELETION',
            nextRunAt: now,
          });
          await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', null, null);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'evidence_original_deleted',
            resourceType: 'evidence',
            resourceId: job.evidenceId,
            outcome: 'SUCCESS',
            metadata: { code: 'DELETED' },
          });
          return;
        }
        const stillThere = blob ? await this.store().exists(blob.objectKey) : false;
        if (stillThere) {
          await evidenceRepo.markDeletionVerified(
            tenant,
            tx,
            job.evidenceId,
            'DELETION_VERIFICATION_FAILED',
          );
          await evidenceRepo.finishJob(tenant, tx, job, 'FAILED', 'DELETION_UNVERIFIED', now);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'evidence_deletion_unverified',
            resourceType: 'evidence',
            resourceId: job.evidenceId,
            outcome: 'FAILED',
            metadata: { code: 'DELETION_UNVERIFIED' },
          });
          return;
        }
        await evidenceRepo.markDeletionVerified(tenant, tx, job.evidenceId, 'VERIFIED');
        await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', null, null);
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'evidence_deletion_verified',
          resourceType: 'evidence',
          resourceId: job.evidenceId,
          outcome: 'SUCCESS',
          metadata: { code: 'VERIFIED' },
        });
      },
      env,
    );
  }
}

export const evidenceService = new EvidenceService();
