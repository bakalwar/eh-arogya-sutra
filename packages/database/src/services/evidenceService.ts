import {
  DELETION_VERIFY_SLA_MS,
  EVIDENCE_SOURCE_TYPES,
  EVIDENCE_TTL_MINUTES,
  EVIDENCE_TYPES,
  MAX_EVIDENCE_PER_CONSULTATION,
  WORKER_CLAIM_BATCH,
  assertMalwareGateSatisfied,
  buildEvidenceObjectKey,
  bytesAsStream,
  defaultMalwareScanner,
  getMemoryFakeObjectStore,
  jobBackoffMs,
  resolveEvidenceRateLimiter,
  sanitizeEvidenceFilename,
  scanPrivateObject,
  stageBoundedStream,
  StreamIngestError,
  validateEvidenceBytes,
  type DurableRateLimiter,
  type EvidenceObjectStore,
  type EvidenceSourceType,
  type EvidenceType,
  type MalwareScanner,
  type RateLimitDecision,
  type StagedEvidenceBytes,
} from '@ehas2/evidence-ingest';
import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { runInSavepoint, withTenantTransaction } from '../pool.js';
import { PgAuditEventRepository, PgConsultationRepository } from '../repositories/postgres.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import {
  PgEvidenceRepository,
  type EvidenceItemRecord,
  type EvidenceJobRecord,
} from '../repositories/evidence.js';
import {
  ConflictError,
  IdempotencyConflictError,
  ObjectStoreUnavailableError,
  RateLimitedError,
  RateLimitUnavailableError,
  ResourceNotFoundError,
  ValidationError,
} from '../domainErrors.js';
import { assertOptionalIsoDate, assertUuid, hashPayload } from '../validation.js';

const evidenceRepo = new PgEvidenceRepository();
const consultations = new PgConsultationRepository();
const audit = new PgAuditEventRepository();
const idempotency = new PgIdempotencyRepository();

export type EvidenceSafeMetricSink = (event: {
  name: string;
  code?: string;
  malware?: 'CLEAN' | 'INFECTED' | 'UNAVAILABLE';
  count?: number;
  ms?: number;
}) => void;

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

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === '23505') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /unique|duplicate/i.test(msg);
}

function assertConsultationBinding(itemConsultationId: string, pathConsultationId: string): void {
  if (itemConsultationId !== pathConsultationId) {
    throw new ResourceNotFoundError();
  }
}

function throwRate(decision: RateLimitDecision): void {
  if (decision.ok) return;
  if (decision.code === 'RATE_LIMIT_UNAVAILABLE') {
    throw new RateLimitUnavailableError(decision.retryAfterSec);
  }
  throw new RateLimitedError(decision.retryAfterSec);
}

function isStoreUnavailable(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === 'STORE_UNAVAILABLE' || code === 'OBJECT_STORE_UNAVAILABLE';
}

function safeJobErrorCode(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  if (code && /^[A-Z][A-Z0-9_]{2,64}$/.test(code)) return code.slice(0, 64);
  return 'JOB_FAILED';
}

export type EvidenceServiceDeps = {
  store?: EvidenceObjectStore;
  malwareScanner?: MalwareScanner;
  rateLimiter?: DurableRateLimiter;
  onSafeMetric?: EvidenceSafeMetricSink;
  jitterMs?: () => number;
};

export class EvidenceService {
  constructor(private readonly deps: EvidenceServiceDeps = {}) {}

  private store(): EvidenceObjectStore {
    return this.deps.store ?? getMemoryFakeObjectStore();
  }

  private scanner(): MalwareScanner {
    return this.deps.malwareScanner ?? defaultMalwareScanner;
  }

  private limiter(): DurableRateLimiter {
    return resolveEvidenceRateLimiter(this.deps.rateLimiter);
  }

  private metric(event: Parameters<EvidenceSafeMetricSink>[0]): void {
    this.deps.onSafeMetric?.(event);
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
    throwRate(
      await this.limiter().tryInitiate({
        actorId: tenant.actorId,
        organizationId: tenant.organizationId,
        clinicId: tenant.clinicId,
        consultationId: input.consultationId,
      }),
    );
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
    try {
      const created = await withTenantTransaction(
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
          const createdRow = await evidenceRepo.insertCreated(tenant, tx, {
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
              resourceId: createdRow.id,
            });
          }
          await evidenceRepo.enqueueJob(tenant, tx, {
            evidenceId: createdRow.id,
            jobType: 'DELETE_ORIGINAL',
            nextRunAt: expiresAt,
          });
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'evidence_intake_created',
            resourceType: 'evidence',
            resourceId: createdRow.id,
            outcome: 'SUCCESS',
            metadata: { evidenceType: input.evidenceType, status: createdRow.processingStatus },
          });
          return createdRow;
        },
        env,
      );
      this.metric({ name: 'ingest_created', code: 'INTAKE_CREATED' });
      return created;
    } catch (err) {
      if (err instanceof RateLimitedError || err instanceof RateLimitUnavailableError) {
        this.metric({ name: 'rate_limit_denial', code: err.code });
        throw err;
      }
      if (err instanceof ResourceNotFoundError) {
        this.metric({ name: 'cross_tenant_denial', code: 'NOT_FOUND' });
      }
      if (err instanceof ValidationError) {
        this.metric({ name: 'ingest_rejected', code: err.message });
      }
      if (err instanceof IdempotencyConflictError || err instanceof ValidationError) throw err;
      if (isUniqueViolation(err) && input.idempotencyKey) {
        const replay = await withTenantTransaction(
          tenant,
          async (tx) =>
            idempotency.resolveOrThrow(
              tenant,
              tx,
              'evidence.ingest',
              input.idempotencyKey,
              requestHash,
            ),
          env,
        );
        if (replay) {
          const found = await withTenantTransaction(
            tenant,
            async (tx) => evidenceRepo.findById(tenant, tx, replay.resourceId),
            env,
          );
          if (found) return found;
        }
        throw new IdempotencyConflictError();
      }
      if (isUniqueViolation(err)) {
        throw new ConflictError('IDEMPOTENCY_OR_FINGERPRINT_CONFLICT');
      }
      throw err;
    }
  }

  async receiveBytes(
    tenant: TenantContext,
    consultationId: string,
    evidenceId: string,
    bytes: Uint8Array | AsyncIterable<Uint8Array>,
    env: Record<string, string | undefined> = process.env,
    options: { declaredLength?: number | null; signal?: AbortSignal } = {},
  ): Promise<EvidenceItemRecord> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    assertUuid(evidenceId, 'evidenceId');
    const lease = await this.limiter().acquireUploadLease({ actorId: tenant.actorId });
    throwRate(lease);
    const leaseId = lease.ok ? lease.leaseId : undefined;
    let staged: StagedEvidenceBytes | null = null;
    let consumedBytes = 0;
    let putObjectKey: string | null = null;
    try {
      const body = bytes instanceof Uint8Array ? bytesAsStream(bytes) : bytes;
      try {
        staged = await stageBoundedStream({
          body,
          declaredLength: options.declaredLength,
          signal: options.signal,
        });
      } catch (err) {
        if (err instanceof StreamIngestError) {
          this.metric({ name: 'ingest_rejected', code: err.code });
          throw new ValidationError(err.code);
        }
        throw err;
      }
      const byteDecision = await this.limiter().consumeBytes(tenant.actorId, staged.size);
      if (!byteDecision.ok) {
        this.metric({ name: 'rate_limit_denial', code: byteDecision.code });
        throwRate(byteDecision);
      }
      consumedBytes = staged.size;
      const raw = await staged.readAll();
      const validated = await withTenantTransaction(
        tenant,
        async (tx) => {
          const item = await evidenceRepo.findById(tenant, tx, evidenceId);
          if (!item) throw new ResourceNotFoundError();
          assertConsultationBinding(item.consultationId, consultationId);
          const consultation = await consultations.findById(tenant, tx, item.consultationId);
          if (!consultation) throw new ResourceNotFoundError();
          assertCaseOwner(tenant, consultation.doctorUserId);
          if (item.processingStatus !== 'INTAKE_CREATED') {
            if (
              item.processingStatus === 'MALWARE_PENDING' ||
              item.processingStatus === 'STORED_TEMP'
            ) {
              return { replay: item as EvidenceItemRecord | null, item, ok: true as const };
            }
            throw new ValidationError('EVIDENCE_NOT_ACCEPTING_BYTES');
          }
          const result = validateEvidenceBytes({
            filename: item.filenameSanitized,
            declaredMime: item.declaredMime,
            bytes: raw,
          });
          if (!result.ok) {
            await evidenceRepo.markRejected(tenant, tx, evidenceId, result.code);
            await evidenceRepo.enqueueJob(tenant, tx, {
              evidenceId,
              jobType: 'DELETE_ORIGINAL',
              nextRunAt: new Date(),
            });
            await audit.append(tx, {
              organizationId: tenant.organizationId,
              clinicId: tenant.clinicId,
              actorId: tenant.actorId,
              actorRole: tenant.actorRole,
              eventType: 'evidence_rejected',
              resourceType: 'evidence',
              resourceId: evidenceId,
              outcome: 'FAILED',
              metadata: { code: result.code },
            });
            return { replay: null, item, ok: false as const, code: result.code };
          }
          if (result.contentSha256 !== staged!.sha256) {
            await evidenceRepo.markRejected(tenant, tx, evidenceId, 'SHA_MISMATCH');
            return { replay: null, item, ok: false as const, code: 'SHA_MISMATCH' };
          }
          return { replay: null, item, ok: true as const, validated: result };
        },
        env,
      );
      if ('code' in validated && validated.ok === false) {
        this.metric({ name: 'ingest_rejected', code: validated.code });
        await this.limiter().releaseBytes(tenant.actorId, consumedBytes);
        consumedBytes = 0;
        throw new ValidationError(validated.code);
      }
      if (validated.replay) {
        await this.limiter().releaseBytes(tenant.actorId, consumedBytes);
        consumedBytes = 0;
        return validated.replay;
      }
      const item = validated.item;
      const file = validated.validated!;
      const objectKey = buildEvidenceObjectKey({
        organizationId: tenant.organizationId,
        clinicId: tenant.clinicId,
        consultationId: item.consultationId,
        evidenceId: item.id,
        contentSha256: file.contentSha256,
      });
      try {
        await this.store().put(objectKey, raw);
        putObjectKey = objectKey;
      } catch (err) {
        try {
          await this.store().abortPartial(objectKey);
        } catch {
          /* ignore */
        }
        putObjectKey = null;
        if (isStoreUnavailable(err)) throw new ObjectStoreUnavailableError();
        throw err;
      }
      const scan = await scanPrivateObject(this.scanner(), { objectKey });
      this.metric({ name: 'malware_result', malware: scan, code: scan });
      if (scan === 'INFECTED') {
        await withTenantTransaction(
          tenant,
          async (tx) => {
            await evidenceRepo.upsertBlob(tenant, tx, {
              evidenceId: item.id,
              objectKey,
              bytesPresent: true,
            });
            await evidenceRepo.markQuarantined(tenant, tx, evidenceId, 'MALWARE_INFECTED');
            await evidenceRepo.enqueueJob(tenant, tx, {
              evidenceId: item.id,
              jobType: 'DELETE_ORIGINAL',
              nextRunAt: new Date(),
            });
          },
          env,
        );
        putObjectKey = null;
        this.metric({ name: 'ingest_rejected', code: 'MALWARE_INFECTED' });
        throw new ValidationError('MALWARE_INFECTED');
      }
      if (!assertMalwareGateSatisfied(scan)) {
        try {
          await this.store().delete(objectKey);
        } catch {
          /* best-effort */
        }
        putObjectKey = null;
        await withTenantTransaction(
          tenant,
          async (tx) => {
            await evidenceRepo.upsertBlob(tenant, tx, {
              evidenceId: item.id,
              objectKey,
              bytesPresent: false,
            });
            await evidenceRepo.markRejected(tenant, tx, evidenceId, 'MALWARE_UNAVAILABLE');
            await evidenceRepo.enqueueJob(tenant, tx, {
              evidenceId: item.id,
              jobType: 'VERIFY_DELETION',
              nextRunAt: new Date(),
            });
          },
          env,
        );
        this.metric({ name: 'ingest_rejected', code: 'MALWARE_UNAVAILABLE' });
        throw new ValidationError('MALWARE_UNAVAILABLE');
      }
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const duplicate = await evidenceRepo.findBySha(
            tenant,
            tx,
            item.consultationId,
            file.contentSha256,
          );
          if (duplicate && duplicate.id !== item.id) {
            await this.store().delete(objectKey);
            putObjectKey = null;
            await evidenceRepo.markRejected(tenant, tx, evidenceId, 'DUPLICATE_FINGERPRINT');
            await evidenceRepo.enqueueJob(tenant, tx, {
              evidenceId,
              jobType: 'DELETE_ORIGINAL',
              nextRunAt: new Date(),
            });
            return duplicate;
          }
          try {
            return await runInSavepoint(tx, 'evidence_sha_store', async () => {
              await evidenceRepo.upsertBlob(tenant, tx, {
                evidenceId: item.id,
                objectKey,
                bytesPresent: true,
              });
              const stored = await evidenceRepo.markStoredTemp(tenant, tx, item.id, {
                detectedMime: file.detectedMime,
                byteSize: file.byteSize,
                contentSha256: file.contentSha256,
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
                  byteSize: file.byteSize,
                  malware: scan,
                },
              });
              putObjectKey = null;
              return stored;
            });
          } catch (err) {
            if (isUniqueViolation(err)) {
              await this.store().delete(objectKey);
              putObjectKey = null;
              const winner = await evidenceRepo.findBySha(
                tenant,
                tx,
                item.consultationId,
                file.contentSha256,
              );
              await evidenceRepo.markRejected(tenant, tx, evidenceId, 'DUPLICATE_FINGERPRINT');
              await evidenceRepo.enqueueJob(tenant, tx, {
                evidenceId,
                jobType: 'DELETE_ORIGINAL',
                nextRunAt: new Date(),
              });
              if (winner && winner.id !== item.id) return winner;
              throw new ConflictError('DUPLICATE_FINGERPRINT');
            }
            throw err;
          }
        },
        env,
      );
    } catch (err) {
      if (putObjectKey) {
        try {
          await this.store().delete(putObjectKey);
        } catch {
          /* best-effort orphan cleanup */
        }
      }
      if (consumedBytes > 0) {
        try {
          await this.limiter().releaseBytes(tenant.actorId, consumedBytes);
        } catch {
          /* ignore */
        }
      }
      if (err instanceof RateLimitedError || err instanceof RateLimitUnavailableError) {
        this.metric({ name: 'rate_limit_denial', code: err.code });
      }
      if (isUniqueViolation(err)) {
        throw new ConflictError('DUPLICATE_FINGERPRINT');
      }
      if (isStoreUnavailable(err)) throw new ObjectStoreUnavailableError();
      throw err;
    } finally {
      if (staged) {
        try {
          await staged.dispose();
        } catch {
          /* ignore */
        }
      }
      if (leaseId) {
        try {
          await this.limiter().releaseUploadLease(leaseId);
        } catch {
          /* ignore */
        }
      }
    }
  }

  async get(
    tenant: TenantContext,
    consultationId: string,
    evidenceId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceItemRecord> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    assertUuid(evidenceId, 'evidenceId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!item) throw new ResourceNotFoundError();
        assertConsultationBinding(item.consultationId, consultationId);
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
    consultationId: string,
    evidenceId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceItemRecord> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    assertUuid(evidenceId, 'evidenceId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!item) throw new ResourceNotFoundError();
        assertConsultationBinding(item.consultationId, consultationId);
        const consultation = await consultations.findById(tenant, tx, item.consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        if (
          item.processingStatus === 'DELETION_VERIFIED' ||
          item.processingStatus === 'DELETED' ||
          item.processingStatus === 'DELETE_PENDING'
        ) {
          return item;
        }
        await evidenceRepo.markDeletePending(tenant, tx, evidenceId);
        const blob = await evidenceRepo.findBlob(tenant, tx, evidenceId);
        if (blob) {
          await this.store().delete(blob.objectKey);
          await evidenceRepo.upsertBlob(tenant, tx, {
            evidenceId,
            objectKey: blob.objectKey,
            bytesPresent: false,
          });
        }
        await evidenceRepo.markDeleted(tenant, tx, evidenceId, 'ABORTED');
        await evidenceRepo.enqueueJob(tenant, tx, {
          evidenceId,
          jobType: 'VERIFY_DELETION',
          nextRunAt: new Date(),
        });
        const after = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!after) throw new ResourceNotFoundError();
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'evidence_aborted',
          resourceType: 'evidence',
          resourceId: evidenceId,
          outcome: 'SUCCESS',
          metadata: { code: 'ABORTED', status: after.processingStatus },
        });
        return after;
      },
      env,
    );
  }

  async runDueJobs(
    tenant: TenantContext,
    workerId: string,
    now: Date = new Date(),
    env: Record<string, string | undefined> = process.env,
  ): Promise<{ processed: number; succeeded: number; failed: number; dead: number }> {
    assertTenantContext(tenant);
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let dead = 0;
    const claimed = await withTenantTransaction(
      tenant,
      async (tx) => {
        const queue = await evidenceRepo.countOpenJobs(tenant, tx, now);
        this.metric({ name: 'queue_depth', count: queue.depth });
        this.metric({ name: 'queue_oldest_age_ms', ms: queue.oldestAgeMs, count: 0 });
        return evidenceRepo.claimDueJobs(tenant, tx, workerId, now, 30_000, WORKER_CLAIM_BATCH);
      },
      env,
    );
    for (const job of claimed) {
      if (job.attempt > 1) this.metric({ name: 'lease_reclaim', code: 'LEASE_RECLAIM' });
      processed += 1;
      const started = Date.now();
      try {
        await this.executeJob(tenant, job, now, env);
        succeeded += 1;
        const ms = Date.now() - started;
        if (job.jobType === 'DELETE_ORIGINAL')
          this.metric({ name: 'delete_latency_ms', ms, count: 0 });
        if (job.jobType === 'VERIFY_DELETION')
          this.metric({ name: 'verify_latency_ms', ms, count: 0 });
      } catch (err) {
        failed += 1;
        const code = safeJobErrorCode(err);
        await withTenantTransaction(
          tenant,
          async (tx) => {
            const nextAttempt = job.attempt >= job.maxAttempts ? 'DEAD' : 'FAILED';
            if (nextAttempt === 'DEAD') {
              dead += 1;
              this.metric({ name: 'dead_count', code });
            }
            const jitter = this.deps.jitterMs?.() ?? Math.floor(Math.random() * 1000);
            const backoff = new Date(now.getTime() + jobBackoffMs(job.attempt, jitter));
            await evidenceRepo.finishJob(
              tenant,
              tx,
              job,
              nextAttempt,
              code,
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
              metadata: { code, jobType: job.jobType },
            });
          },
          env,
        );
      }
    }
    return { processed, succeeded, failed, dead };
  }

  async reconcileBlobPresence(
    tenant: TenantContext,
    now: Date = new Date(),
    env: Record<string, string | undefined> = process.env,
    limit = 50,
  ): Promise<{ checked: number; mismatches: number; orphansDeleted: number }> {
    assertTenantContext(tenant);
    void now;
    let checked = 0;
    let mismatches = 0;
    let orphansDeleted = 0;
    const blobs = await withTenantTransaction(
      tenant,
      async (tx) => evidenceRepo.listBlobs(tenant, tx, limit),
      env,
    );
    for (const blob of blobs) {
      checked += 1;
      let exists = false;
      try {
        exists = await this.store().exists(blob.objectKey);
      } catch {
        this.metric({ name: 'db_object_mismatch', code: 'STORE_UNAVAILABLE' });
        continue;
      }
      if (blob.bytesPresent === exists) continue;
      mismatches += 1;
      this.metric({ name: 'db_object_mismatch', code: 'BYTES_PRESENT_MISMATCH' });
      if (!blob.bytesPresent && exists && orphansDeleted < 20) {
        try {
          await this.store().delete(blob.objectKey);
          orphansDeleted += 1;
        } catch {
          /* bounded orphan pass */
        }
      }
      if (blob.bytesPresent && !exists) {
        await withTenantTransaction(
          tenant,
          async (tx) => {
            await evidenceRepo.upsertBlob(tenant, tx, {
              evidenceId: blob.evidenceId,
              objectKey: blob.objectKey,
              bytesPresent: false,
            });
          },
          env,
        );
      }
    }
    return { checked, mismatches, orphansDeleted };
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
        if (!item) {
          await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', null, null);
          return;
        }
        const blob = await evidenceRepo.findBlob(tenant, tx, job.evidenceId);
        if (job.jobType === 'DELETE_ORIGINAL') {
          if (
            item.processingStatus === 'DELETION_VERIFIED' ||
            item.processingStatus === 'DELETED'
          ) {
            await evidenceRepo.enqueueJob(tenant, tx, {
              evidenceId: job.evidenceId,
              jobType: 'VERIFY_DELETION',
              nextRunAt: now,
            });
            await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', null, null);
            return;
          }
          if (item.processingStatus === 'INTAKE_CREATED') {
            await evidenceRepo.markExpiredIntake(tenant, tx, job.evidenceId);
          }
          await evidenceRepo.markDeletePending(tenant, tx, job.evidenceId);
          if (blob) {
            await this.store().delete(blob.objectKey);
            await evidenceRepo.upsertBlob(tenant, tx, {
              evidenceId: job.evidenceId,
              objectKey: blob.objectKey,
              bytesPresent: false,
            });
          }
          const rejectCode =
            item.processingStatus === 'INTAKE_CREATED'
              ? 'INTAKE_EXPIRED'
              : item.rejectionCode === 'ABORTED'
                ? 'ABORTED'
                : item.rejectionCode;
          await evidenceRepo.markDeleted(tenant, tx, job.evidenceId, rejectCode);
          await evidenceRepo.enqueueJob(tenant, tx, {
            evidenceId: job.evidenceId,
            jobType: 'VERIFY_DELETION',
            nextRunAt: new Date(now.getTime() + Math.min(DELETION_VERIFY_SLA_MS, 1)),
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
