import {
  DELETION_VERIFY_SLA_MS,
  EVIDENCE_SOURCE_TYPES,
  EVIDENCE_TTL_MINUTES,
  EVIDENCE_TYPES,
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_PER_CONSULTATION,
  WORKER_CLAIM_BATCH,
  assertMalwareGateSatisfied,
  buildEvidenceObjectKey,
  bytesAsStream,
  defaultMalwareScanner,
  jobBackoffMs,
  resolveEvidenceObjectStore,
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
import {
  EXTRACT_TIMEOUT_MS,
  EXTRACT_JOB_TIMEOUT_MS,
  MAGIC_PREFIX_MAX,
  assertNoStorageInLocator,
  claimableEvidenceJobTypes,
  defaultDeterministicExtractor,
  extractJobsEnabled,
  extractOcrJobsEnabled,
  extractorFingerprint,
  type ContentIntent,
  type ExtractionCandidateDto,
  type ExtractionProvider,
  type ExtractionResult,
  type LimitationCode,
} from '@ehas2/evidence-extract';
import {
  TwoStageOpenSourceExtractor,
  defaultOcrPipelineFingerprint,
} from '@ehas2/evidence-extract-adapters';
import { isProductionRuntime } from '@ehas2/evidence-ingest';
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
  PgExtractionRepository,
  insertRunWithIdempotency,
  type ExtractionRunRecord,
} from '../repositories/extraction.js';
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
const extractionRepo = new PgExtractionRepository();
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

function extractorFingerprintOf(extractor: ExtractionProvider): string {
  return extractorFingerprint({
    name: extractor.name,
    version: extractor.version,
    modelOrLangpackVersion: extractor.modelOrLangpackVersion,
    method: extractor.method,
  });
}

async function raceExtract(
  pending: Promise<ExtractionResult>,
  abort: AbortController,
  timeoutMs: number = EXTRACT_TIMEOUT_MS,
): Promise<ExtractionResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      abort.abort();
      const err = new Error('EXTRACTION_TIMEOUT');
      (err as Error & { code: string }).code = 'EXTRACTION_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([pending, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type EvidenceServiceDeps = {
  store?: EvidenceObjectStore;
  malwareScanner?: MalwareScanner;
  rateLimiter?: DurableRateLimiter;
  extractor?: ExtractionProvider;
  onSafeMetric?: EvidenceSafeMetricSink;
  jitterMs?: () => number;
};

export class EvidenceService {
  constructor(private readonly deps: EvidenceServiceDeps = {}) {}

  private store(env: Record<string, string | undefined> = process.env): EvidenceObjectStore {
    return resolveEvidenceObjectStore(this.deps.store, env);
  }

  private scanner(): MalwareScanner {
    return this.deps.malwareScanner ?? defaultMalwareScanner;
  }

  private extractor(env: Record<string, string | undefined> = process.env): ExtractionProvider {
    if (this.deps.extractor) return this.deps.extractor;
    if (extractOcrJobsEnabled(env)) {
      return new TwoStageOpenSourceExtractor();
    }
    return defaultDeterministicExtractor();
  }

  private resolveExtractorFingerprint(
    extractor: ExtractionProvider,
    item: EvidenceItemRecord,
    env: Record<string, string | undefined>,
  ): string {
    if (extractOcrJobsEnabled(env)) {
      return defaultOcrPipelineFingerprint({
        evidenceItemId: item.id,
        inputContentSha256: item.contentSha256,
        method: extractor.method,
      });
    }
    return extractorFingerprintOf(extractor);
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
    let claimed = false;
    try {
      const storeHealth = await this.store(env).health();
      if (!storeHealth.ok) throw new ObjectStoreUnavailableError();

      const claimedOrReplay = await withTenantTransaction(
        tenant,
        async (tx) => {
          const existing = await evidenceRepo.findById(tenant, tx, evidenceId);
          if (!existing) throw new ResourceNotFoundError();
          assertConsultationBinding(existing.consultationId, consultationId);
          const consultation = await consultations.findById(tenant, tx, existing.consultationId);
          if (!consultation) throw new ResourceNotFoundError();
          assertCaseOwner(tenant, consultation.doctorUserId);
          if (
            existing.processingStatus === 'MALWARE_PENDING' ||
            existing.processingStatus === 'STORED_TEMP'
          ) {
            return { replay: existing };
          }
          const won = await evidenceRepo.claimBytesValidating(tenant, tx, evidenceId);
          if (won) return { item: won };
          const latest = await evidenceRepo.findById(tenant, tx, evidenceId);
          if (!latest) throw new ResourceNotFoundError();
          if (
            latest.processingStatus === 'MALWARE_PENDING' ||
            latest.processingStatus === 'STORED_TEMP'
          ) {
            return { replay: latest };
          }
          if (latest.processingStatus === 'VALIDATING') {
            throw new ConflictError('EVIDENCE_BYTES_IN_PROGRESS');
          }
          throw new ValidationError('EVIDENCE_NOT_ACCEPTING_BYTES');
        },
        env,
      );
      if ('replay' in claimedOrReplay && claimedOrReplay.replay) {
        return claimedOrReplay.replay;
      }
      claimed = true;

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
          if (item.processingStatus !== 'VALIDATING') {
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
        await this.store(env).put(objectKey, raw);
        putObjectKey = objectKey;
      } catch (err) {
        try {
          await this.store(env).abortPartial(objectKey);
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
          await this.store(env).delete(objectKey);
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
            await this.store(env).delete(objectKey);
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
              await this.store(env).delete(objectKey);
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
      if (claimed) {
        try {
          await withTenantTransaction(
            tenant,
            async (tx) => evidenceRepo.revertValidatingToIntake(tenant, tx, evidenceId),
            env,
          );
        } catch {
          /* ignore */
        }
      }
      if (putObjectKey) {
        try {
          await this.store(env).delete(putObjectKey);
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
          await this.store(env).delete(blob.objectKey);
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
        return evidenceRepo.claimDueJobs(
          tenant,
          tx,
          workerId,
          now,
          30_000,
          WORKER_CLAIM_BATCH,
          claimableEvidenceJobTypes(env),
        );
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
        if (job.jobType === 'EXTRACT_CANDIDATES')
          this.metric({ name: 'extract_latency_ms', ms, count: 0 });
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
        exists = await this.store(env).exists(blob.objectKey);
      } catch {
        this.metric({ name: 'db_object_mismatch', code: 'STORE_UNAVAILABLE' });
        continue;
      }
      if (blob.bytesPresent === exists) continue;
      mismatches += 1;
      this.metric({ name: 'db_object_mismatch', code: 'BYTES_PRESENT_MISMATCH' });
      if (!blob.bytesPresent && exists && orphansDeleted < 20) {
        try {
          await this.store(env).delete(blob.objectKey);
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

  async enqueueExtractCandidates(
    tenant: TenantContext,
    evidenceId: string,
    now: Date = new Date(),
    env: Record<string, string | undefined> = process.env,
  ): Promise<EvidenceJobRecord> {
    assertTenantContext(tenant);
    assertUuid(evidenceId, 'evidenceId');
    if (!extractJobsEnabled(env)) {
      throw new ValidationError('EXTRACTION_NOT_CONNECTED');
    }
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!item) throw new ResourceNotFoundError();
        try {
          return await evidenceRepo.enqueueJob(tenant, tx, {
            evidenceId,
            jobType: 'EXTRACT_CANDIDATES',
            nextRunAt: now,
          });
        } catch (err) {
          if (isUniqueViolation(err)) {
            throw new ConflictError('EXTRACT_JOB_OPEN');
          }
          throw err;
        }
      },
      env,
    );
  }

  async listExtractionCandidates(
    tenant: TenantContext,
    evidenceId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ExtractionCandidateDto[]> {
    assertTenantContext(tenant);
    assertUuid(evidenceId, 'evidenceId');
    return withTenantTransaction(
      tenant,
      async (tx) => extractionRepo.listCandidatesForEvidence(tenant, tx, evidenceId),
      env,
    );
  }

  async listExtractionRuns(
    tenant: TenantContext,
    evidenceId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ExtractionRunRecord[]> {
    assertTenantContext(tenant);
    assertUuid(evidenceId, 'evidenceId');
    return withTenantTransaction(
      tenant,
      async (tx) => extractionRepo.listRunsForEvidence(tenant, tx, evidenceId),
      env,
    );
  }

  async countStructuredFindingsForEvidence(
    tenant: TenantContext,
    evidenceId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<number> {
    assertTenantContext(tenant);
    return withTenantTransaction(
      tenant,
      async (tx) => extractionRepo.countFindingsForEvidence(tenant, tx, evidenceId),
      env,
    );
  }

  /** Test-only: set written-report content intent without client filename inference. */
  async setEvidenceContentIntentForTest(
    tenant: TenantContext,
    evidenceId: string,
    contentIntent: ContentIntent,
    env: Record<string, string | undefined> = process.env,
  ): Promise<void> {
    assertTenantContext(tenant);
    assertUuid(evidenceId, 'evidenceId');
    if (isProductionRuntime(env)) {
      throw new ValidationError('CONTENT_INTENT_TEST_ONLY');
    }
    await withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, evidenceId);
        if (!item) throw new ResourceNotFoundError();
        await evidenceRepo.setContentIntent(tenant, tx, evidenceId, contentIntent);
      },
      env,
    );
  }

  private async executeJob(
    tenant: TenantContext,
    job: EvidenceJobRecord,
    now: Date,
    env: Record<string, string | undefined>,
  ): Promise<void> {
    if (job.jobType === 'EXTRACT_CANDIDATES') {
      await this.executeExtractCandidates(tenant, job, env);
      return;
    }
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
            await this.store(env).delete(blob.objectKey);
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
        const stillThere = blob ? await this.store(env).exists(blob.objectKey) : false;
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

  private async executeExtractCandidates(
    tenant: TenantContext,
    job: EvidenceJobRecord,
    env: Record<string, string | undefined>,
  ): Promise<void> {
    if (!extractJobsEnabled(env)) {
      await withTenantTransaction(
        tenant,
        async (tx) => {
          await evidenceRepo.finishJob(
            tenant,
            tx,
            job,
            'FAILED',
            'EXTRACTION_NOT_CONNECTED',
            new Date(),
          );
        },
        env,
      );
      this.metric({ name: 'extract_result', code: 'EXTRACTION_NOT_CONNECTED' });
      return;
    }

    const loaded = await withTenantTransaction(
      tenant,
      async (tx) => {
        const item = await evidenceRepo.findById(tenant, tx, job.evidenceId);
        const blob = item ? await evidenceRepo.findBlob(tenant, tx, job.evidenceId) : null;
        return { item, blob };
      },
      env,
    );
    if (!loaded.item) {
      await withTenantTransaction(
        tenant,
        async (tx) => evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', null, null),
        env,
      );
      return;
    }
    const item = loaded.item;
    const blob = loaded.blob;
    const ocrEnabled = extractOcrJobsEnabled(env);
    const extractor = this.extractor(env);
    const fingerprint = this.resolveExtractorFingerprint(extractor, item, env);

    const existing = await withTenantTransaction(
      tenant,
      async (tx) => extractionRepo.findActiveRun(tenant, tx, item.id, fingerprint),
      env,
    );
    if (existing) {
      await withTenantTransaction(
        tenant,
        async (tx) => {
          await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', 'DUPLICATE_RUN', null);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'evidence_extract_idempotent',
            resourceType: 'evidence',
            resourceId: item.id,
            outcome: 'SUCCESS',
            metadata: { code: 'DUPLICATE_RUN', candidateCount: existing.candidateCount },
          });
        },
        env,
      );
      this.metric({ name: 'extract_result', code: 'DUPLICATE_RUN' });
      return;
    }

    const retentionBlocked = await withTenantTransaction(
      tenant,
      async (tx) => extractionRepo.isRetentionCapReached(tenant, tx, item.id),
      env,
    );
    if (retentionBlocked) {
      await withTenantTransaction(
        tenant,
        async (tx) => {
          await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', 'RETENTION_CAP_REACHED', null);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'evidence_extract_retention_cap',
            resourceType: 'evidence',
            resourceId: item.id,
            outcome: 'DENIED',
            metadata: { code: 'RETENTION_CAP_REACHED' },
          });
        },
        env,
      );
      this.metric({ name: 'extract_result', code: 'RETENTION_CAP_REACHED' });
      return;
    }

    if (item.malwareScanResult !== 'CLEAN' || !assertMalwareGateSatisfied(item.malwareScanResult)) {
      await this.persistExtractOutcome(
        tenant,
        job,
        item,
        {
          status: 'REJECTED',
          limitationCodes: ['SCANNER_NOT_CLEAN', 'NOT_AUTHORITATIVE'],
          candidates: [],
          extractor,
          fingerprint,
          inputSha: item.contentSha256,
        },
        env,
      );
      this.metric({ name: 'extract_result', code: 'SCANNER_NOT_CLEAN' });
      return;
    }

    if (!blob?.bytesPresent) {
      await this.persistExtractOutcome(
        tenant,
        job,
        item,
        {
          status: 'REJECTED',
          limitationCodes: ['ORIGINAL_UNAVAILABLE', 'NOT_AUTHORITATIVE'],
          candidates: [],
          extractor,
          fingerprint,
          inputSha: item.contentSha256,
        },
        env,
      );
      this.metric({ name: 'extract_result', code: 'ORIGINAL_UNAVAILABLE' });
      return;
    }

    const bytes = await this.store(env).readForMalwareScan(blob.objectKey, MAX_EVIDENCE_BYTES);
    if (!bytes || bytes.byteLength === 0) {
      await this.persistExtractOutcome(
        tenant,
        job,
        item,
        {
          status: 'REJECTED',
          limitationCodes: ['ORIGINAL_UNAVAILABLE', 'MALFORMED_DOCUMENT', 'NOT_AUTHORITATIVE'],
          candidates: [],
          extractor,
          fingerprint,
          inputSha: item.contentSha256,
        },
        env,
      );
      this.metric({ name: 'extract_result', code: 'ORIGINAL_UNAVAILABLE' });
      return;
    }

    const abort = new AbortController();
    let result: ExtractionResult;
    try {
      result = await raceExtract(
        extractor.extract({
          organizationId: item.organizationId,
          clinicId: item.clinicId,
          patientId: item.patientId,
          consultationId: item.consultationId,
          evidenceItemId: item.id,
          evidenceType: item.evidenceType,
          declaredMime: item.declaredMime,
          detectedMime: item.detectedMime,
          byteSize: item.byteSize ?? bytes.byteLength,
          contentSha256: item.contentSha256,
          magicPrefix: bytes.subarray(0, MAGIC_PREFIX_MAX),
          contentIntent: item.contentIntent,
          bytes,
          abortSignal: abort.signal,
        }),
        abort,
        ocrEnabled ? EXTRACT_JOB_TIMEOUT_MS : EXTRACT_TIMEOUT_MS,
      );
    } catch (err) {
      if ((err as { code?: string }).code === 'EXTRACTION_TIMEOUT') {
        await this.persistExtractOutcome(
          tenant,
          job,
          item,
          {
            status: 'REJECTED',
            limitationCodes: ['TIMEOUT', 'NOT_AUTHORITATIVE'],
            candidates: [],
            extractor,
            fingerprint,
            inputSha: item.contentSha256,
          },
          env,
        );
        this.metric({ name: 'extract_result', code: 'TIMEOUT' });
        return;
      }
      throw err;
    }

    for (const candidate of result.ok ? result.candidates : []) {
      assertNoStorageInLocator(candidate.sourceLocator);
    }

    const status = result.ok ? 'EXTRACTED_UNVERIFIED' : 'REJECTED';
    await this.persistExtractOutcome(
      tenant,
      job,
      item,
      {
        status,
        limitationCodes: result.limitationCodes,
        candidates: result.ok ? result.candidates : [],
        extractor,
        fingerprint: result.extractorFingerprint,
        inputSha: item.contentSha256,
      },
      env,
    );
    this.metric({
      name: 'extract_result',
      code: result.ok ? 'EXTRACTED_UNVERIFIED' : result.code,
    });
  }

  private async persistExtractOutcome(
    tenant: TenantContext,
    job: EvidenceJobRecord,
    item: EvidenceItemRecord,
    input: {
      status: 'EXTRACTED_UNVERIFIED' | 'REJECTED';
      limitationCodes: readonly LimitationCode[];
      candidates: readonly ExtractionCandidateDto[];
      extractor: ExtractionProvider;
      fingerprint: string;
      inputSha: string | null;
    },
    env: Record<string, string | undefined>,
  ): Promise<void> {
    await withTenantTransaction(
      tenant,
      async (tx) => {
        const stillThere = await extractionRepo.findActiveRun(
          tenant,
          tx,
          item.id,
          input.fingerprint,
        );
        if (stillThere) {
          await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', 'DUPLICATE_RUN', null);
          return;
        }
        if (await extractionRepo.isRetentionCapReached(tenant, tx, item.id)) {
          await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', 'RETENTION_CAP_REACHED', null);
          return;
        }
        const { run, inserted } = await insertRunWithIdempotency(extractionRepo, tenant, tx, {
          patientId: item.patientId,
          consultationId: item.consultationId,
          evidenceItemId: item.id,
          jobId: job.id,
          extractorName: input.extractor.name,
          extractorVersion: input.extractor.version,
          modelOrLangpackVersion: input.extractor.modelOrLangpackVersion,
          method: input.extractor.method,
          extractorFingerprint: input.fingerprint,
          inputContentSha256: input.inputSha,
          status: input.status,
          limitationCodes: input.limitationCodes,
          candidateCount: input.candidates.length,
        });
        if (!inserted) {
          await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', 'DUPLICATE_RUN', null);
          return;
        }
        if (input.status === 'EXTRACTED_UNVERIFIED' && input.candidates.length > 0) {
          await extractionRepo.insertCandidates(tenant, tx, run.id, input.candidates);
        }
        await extractionRepo.supersedeRuns(tenant, tx, item.id, input.fingerprint, run.id);
        await evidenceRepo.finishJob(tenant, tx, job, 'SUCCEEDED', null, null);
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'evidence_extract_candidates',
          resourceType: 'evidence',
          resourceId: item.id,
          outcome: 'SUCCESS',
          metadata: {
            code: input.status,
            candidateCount: input.candidates.length,
            limitationCount: input.limitationCodes.length,
            extractorVersion: input.extractor.version,
          },
        });
      },
      env,
    );
  }
}

export const evidenceService = new EvidenceService();
