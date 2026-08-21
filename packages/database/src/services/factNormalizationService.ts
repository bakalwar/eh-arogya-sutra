import {
  FACT_CANDIDATE_F3D1_AUTHORITY,
  MAX_NORMALIZER_DRAFTS,
  loadPinnedProductionPack,
  normalizeSourceLinkedFact,
  type FactNormalizationDto,
  type FactNormalizationDraft,
  type LoadedTerminologyPack,
} from '@ehas2/evidence-extract';
import {
  FactConflictError,
  IdempotencyConflictError,
  ResourceNotFoundError,
  ValidationError,
} from '../domainErrors.js';
import { withTenantTransaction } from '../pool.js';
import { PgFactCandidateRepository } from '../repositories/factCandidate.js';
import {
  PgFactNormalizationRepository,
  type InsertFactNormalizationInput,
} from '../repositories/factNormalization.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import { PgConsultationRepository } from '../repositories/postgres.js';
import {
  assertTenantContext,
  type TenantContext,
  type TransactionContext,
} from '../tenantContext.js';
import { assertUuid, hashPayload } from '../validation.js';
import { CueEligibleSourceService } from './cueEligibleSourceService.js';
import {
  deriveEffectiveReviewedCueText,
  F3cReviewedCueSourceService,
} from './f3cReviewedCueSourceService.js';
import { lockChiefComplaintCueSource, lockF3cReviewedCueSource } from './cueSourceLock.js';
import { PgCandidateReviewRepository } from '../repositories/candidateReview.js';

const FACT_NORMALIZATION_OPERATION = 'clinical.fact_normalization';
const CLOSED_INPUT_KEYS = new Set(['sourceFactCandidateId', 'idempotencyKey']);

const facts = new PgFactCandidateRepository();
const norms = new PgFactNormalizationRepository();
const idempotency = new PgIdempotencyRepository();
const consultations = new PgConsultationRepository();
const reviews = new PgCandidateReviewRepository();
const cueChief = new CueEligibleSourceService();
const cueF3c = new F3cReviewedCueSourceService();

export type MaterializeFactNormalizationsInput = {
  readonly sourceFactCandidateId: string;
  readonly idempotencyKey: string;
};

export type MaterializeFactNormalizationsResult = {
  readonly sourceFactCandidateId: string;
  readonly reason: 'NORMALIZED' | 'NO_MATCHES';
  readonly normalizations: readonly FactNormalizationDto[];
  readonly replayed: boolean;
};

function assertWriterRole(tenant: TenantContext): void {
  if (tenant.actorRole !== 'Doctor' && tenant.actorRole !== 'ClinicAdmin') {
    throw new ResourceNotFoundError();
  }
}

function assertCaseOwner(tenant: TenantContext, doctorUserId: string): void {
  if (tenant.actorRole === 'ClinicAdmin') return;
  if (tenant.actorRole === 'Doctor' && tenant.actorId === doctorUserId) return;
  throw new ResourceNotFoundError();
}

function assertClosedInput(input: MaterializeFactNormalizationsInput): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('UNTRUSTED_INPUT');
  }
  for (const key of Object.keys(input)) {
    if (!CLOSED_INPUT_KEYS.has(key)) {
      throw new ValidationError('UNTRUSTED_INPUT');
    }
  }
  if (typeof input.sourceFactCandidateId !== 'string' || typeof input.idempotencyKey !== 'string') {
    throw new ValidationError('UNTRUSTED_INPUT');
  }
  assertUuid(input.sourceFactCandidateId, 'sourceFactCandidateId');
  if (input.idempotencyKey.length < 8 || input.idempotencyKey.length > 128) {
    throw new ValidationError('IDEMPOTENCY_KEY_REQUIRED');
  }
}

function loadPinnedPackOrThrow(): LoadedTerminologyPack {
  try {
    return loadPinnedProductionPack();
  } catch {
    throw new ValidationError('PACK_UNAVAILABLE');
  }
}

function mapNormalizerFailure(reason: string): never {
  if (reason === 'PARSER_TIMEOUT' || reason === 'PARSER_FAILED') {
    throw new ValidationError(reason);
  }
  if (reason === 'DRAFT_CAP_OVERFLOW' || reason === 'TOO_MANY_MATCHES') {
    throw new ValidationError('DRAFT_CAP_OVERFLOW');
  }
  if (reason === 'UNSUPPORTED_SOURCE_COMBINATION') {
    throw new ValidationError('SOURCE_INELIGIBLE');
  }
  throw new ValidationError(reason === 'INVALID_INPUT' ? 'UNTRUSTED_INPUT' : reason);
}

function boundSpanForBinding(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    throw new ValidationError('SOURCE_MUTATED');
  }
  return trimmed;
}

function draftToInsert(
  draft: FactNormalizationDraft,
  sourceFactCandidateId: string,
): InsertFactNormalizationInput {
  return {
    sourceFactCandidateId,
    normalizationIdentityFingerprint: draft.normalizationIdentityFingerprint,
    normalizationKind: draft.normalizationKind,
    canonicalLabel: draft.canonicalLabel,
    negationScope: draft.negationScope,
    cueEntryIds: draft.cueEntryIds,
    packId: draft.packId,
    packVersion: draft.packVersion,
    packContentChecksum: draft.packContentChecksum,
    parserVersion: draft.parserVersion,
    parserFingerprint: draft.parserFingerprint,
    normalizerMethod: draft.normalizerMethod,
    normalizerVersion: draft.normalizerVersion,
    normalizerFingerprint: draft.normalizerFingerprint,
    limitationCodes: draft.limitationCodes,
    supersedesNormalizationId: null,
  };
}

async function lockAndLoadParentFact(
  tenant: TenantContext,
  tx: TransactionContext,
  sourceFactCandidateId: string,
) {
  const r = await tx.query(
    `SELECT * FROM clinical_fact_candidates
     WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
     FOR UPDATE`,
    [tenant.organizationId, tenant.clinicId, sourceFactCandidateId],
  );
  if (!r.rows[0]) throw new ResourceNotFoundError();
  const parent = await facts.findById(tenant, tx, sourceFactCandidateId);
  if (!parent) throw new ResourceNotFoundError();
  return parent;
}

export class FactNormalizationService {
  async materializeFactNormalizations(
    tenant: TenantContext,
    input: MaterializeFactNormalizationsInput,
    env: Record<string, string | undefined> = process.env,
  ): Promise<MaterializeFactNormalizationsResult> {
    assertTenantContext(tenant);
    assertUuid(tenant.organizationId, 'organizationId');
    assertUuid(tenant.clinicId, 'clinicId');
    assertUuid(tenant.actorId, 'actorId');
    assertWriterRole(tenant);
    assertClosedInput(input);
    const pack = loadPinnedPackOrThrow();

    return withTenantTransaction(
      tenant,
      async (tx) => {
        // Peek parent to choose shared source lock (tenant-scoped; not trusted as final state).
        const peek = await facts.findById(tenant, tx, input.sourceFactCandidateId);
        if (!peek) throw new ResourceNotFoundError();

        if (peek.sourceChannel === 'DOCTOR_DECLARED' && peek.sourceField === 'CHIEF_COMPLAINT') {
          await lockChiefComplaintCueSource(tx, tenant, peek.consultationId);
        } else if (
          peek.sourceChannel === 'REVIEWED_REPORT_TEXT' &&
          peek.sourceField === 'REVIEWED_EXTRACTION_CANDIDATE'
        ) {
          if (!peek.extractionCandidateId) throw new ValidationError('SOURCE_INELIGIBLE');
          await lockF3cReviewedCueSource(tx, tenant, peek.extractionCandidateId);
        } else if (
          peek.sourceChannel === 'STRUCTURED_INTAKE' ||
          String(peek.sourceField).startsWith('VITAL_')
        ) {
          throw new ValidationError('STRUCTURED_UNIT_DEFERRED');
        } else {
          throw new ValidationError('SOURCE_INELIGIBLE');
        }

        const parent = await lockAndLoadParentFact(tenant, tx, input.sourceFactCandidateId);
        if (
          parent.decisionStatus !== 'ACTIVE' ||
          parent.authorityStatus !== FACT_CANDIDATE_F3D1_AUTHORITY ||
          parent.clinicallyUsed !== false
        ) {
          throw new ValidationError('FACT_INELIGIBLE');
        }

        const consultation = await consultations.findById(tenant, tx, parent.consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        if (
          consultation.patientId !== parent.patientId ||
          consultation.organizationId !== tenant.organizationId ||
          consultation.clinicId !== tenant.clinicId
        ) {
          throw new ResourceNotFoundError();
        }

        let liveSourceIdentityFingerprint: string;
        let liveReviewEventId: string | null = null;
        let parserResult;

        if (
          parent.sourceChannel === 'DOCTOR_DECLARED' &&
          parent.sourceField === 'CHIEF_COMPLAINT'
        ) {
          const live = await cueChief.parseDoctorDeclaredChiefComplaintCuesLocked(
            tenant,
            tx,
            parent.consultationId,
            pack,
          );
          if (
            live.patientId !== parent.patientId ||
            live.consultationId !== parent.consultationId ||
            live.organizationId !== parent.organizationId ||
            live.clinicId !== parent.clinicId
          ) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          const lockedConsult = await consultations.findById(tenant, tx, parent.consultationId);
          if (!lockedConsult?.chiefComplaintText) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          if (parent.originalSourceSpan !== boundSpanForBinding(lockedConsult.chiefComplaintText)) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          liveSourceIdentityFingerprint = live.sourceIdentityFingerprint;
          parserResult = live.parser;
        } else {
          if (!parent.extractionCandidateId || !parent.evidenceItemId || !parent.reviewEventId) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          const live = await cueF3c.parseF3cReviewedSourceCuesLocked(
            tenant,
            tx,
            {
              consultationId: parent.consultationId,
              evidenceItemId: parent.evidenceItemId,
              candidateId: parent.extractionCandidateId,
            },
            pack,
          );
          if (
            live.candidateId !== parent.extractionCandidateId ||
            live.evidenceItemId !== parent.evidenceItemId ||
            live.consultationId !== parent.consultationId ||
            live.patientId !== parent.patientId ||
            live.reviewEventId !== parent.reviewEventId
          ) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          const activeReview = await reviews.findActiveForCandidate(
            tenant,
            tx,
            parent.extractionCandidateId,
          );
          if (!activeReview || activeReview.id !== parent.reviewEventId) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          const effective = deriveEffectiveReviewedCueText(
            activeReview.action,
            activeReview.originalRawText,
            activeReview.correctedRawText,
          );
          if (parent.originalSourceSpan !== boundSpanForBinding(effective)) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          liveReviewEventId = live.reviewEventId;
          liveSourceIdentityFingerprint = live.sourceIdentityFingerprint;
          parserResult = live.parser;
        }

        if (!parserResult.ok) {
          mapNormalizerFailure(parserResult.reason);
        }

        const normalizeResult = normalizeSourceLinkedFact(
          {
            mode: 'CUE_RESULT',
            sourceRef: parent.id,
            sourceChannel: parent.sourceChannel,
            sourceField: parent.sourceField,
            // Cue matches bind to live C1/C2 source identity, not the fact-row identity.
            sourceIdentityFingerprint: liveSourceIdentityFingerprint,
            parserResult,
          },
          pack,
        );
        if (!normalizeResult.ok) {
          mapNormalizerFailure(normalizeResult.reason);
        }
        if (normalizeResult.drafts.length > MAX_NORMALIZER_DRAFTS) {
          throw new ValidationError('DRAFT_CAP_OVERFLOW');
        }

        const draftFingerprints: string[] = [
          ...new Set(
            normalizeResult.drafts.map(
              (d: FactNormalizationDraft) => d.normalizationIdentityFingerprint,
            ),
          ),
        ].sort((a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0));
        const draftsByFp = new Map<string, FactNormalizationDraft>();
        for (const draft of normalizeResult.drafts) {
          if (!draftsByFp.has(draft.normalizationIdentityFingerprint)) {
            draftsByFp.set(draft.normalizationIdentityFingerprint, draft);
          }
        }
        const drafts: FactNormalizationDraft[] = draftFingerprints
          .map((fp) => draftsByFp.get(fp))
          .filter((d): d is FactNormalizationDraft => d != null);
        if (drafts.length > MAX_NORMALIZER_DRAFTS) {
          throw new ValidationError('DRAFT_CAP_OVERFLOW');
        }

        const requestHash = hashPayload({
          v: 1,
          sourceFactCandidateId: parent.id,
          parentSourceIdentityFingerprint: parent.sourceIdentityFingerprint,
          parentContentFingerprint: parent.contentFingerprint,
          parentReviewEventId: parent.reviewEventId,
          liveSourceIdentityFingerprint,
          liveReviewEventId,
          packId: pack.packId,
          packVersion: pack.packVersion,
          packContentChecksum: pack.contentChecksum,
          normalizerReason: normalizeResult.reason,
          draftIdentities: drafts.map((d) => d.normalizationIdentityFingerprint),
        });

        // Stale/live binding already verified above — resolve idempotency after eligibility.
        const existingKey = await idempotency.resolveOrThrow(
          tenant,
          tx,
          FACT_NORMALIZATION_OPERATION,
          input.idempotencyKey,
          requestHash,
        );
        if (existingKey) {
          if (existingKey.resourceId !== parent.id) {
            throw new IdempotencyConflictError();
          }
          const replayed = await norms.listActiveByParentFact(tenant, tx, parent.id);
          return {
            sourceFactCandidateId: parent.id,
            reason: normalizeResult.reason,
            normalizations: replayed,
            replayed: true,
          };
        }

        if (normalizeResult.reason === 'NO_MATCHES' || drafts.length === 0) {
          const prior = await norms.listActiveByParentFact(tenant, tx, parent.id);
          if (prior.length > 0) {
            await norms.lockActiveIdentitiesForParentFacts(tenant, tx, [parent.id]);
            await norms.supersedeActiveLinkedToFacts(tenant, tx, [parent.id]);
          }
          await idempotency.insert(tenant, tx, {
            operation: FACT_NORMALIZATION_OPERATION,
            key: input.idempotencyKey,
            requestHash,
            resourceType: 'fact_candidate',
            resourceId: parent.id,
          });
          return {
            sourceFactCandidateId: parent.id,
            reason: 'NO_MATCHES',
            normalizations: [],
            replayed: false,
          };
        }

        await norms.lockIdentitiesSorted(
          tx,
          drafts.map((d) => d.normalizationIdentityFingerprint),
        );

        const existingActive = await norms.listActiveByParentFact(tenant, tx, parent.id);
        const existingFpSet = new Set(
          existingActive.map((n) => n.normalizationIdentityFingerprint),
        );
        const draftFpSet = new Set(drafts.map((d) => d.normalizationIdentityFingerprint));
        const identical =
          existingFpSet.size === draftFpSet.size &&
          [...draftFpSet].every((fp) => existingFpSet.has(fp));

        if (identical && existingActive.length > 0) {
          await idempotency.insert(tenant, tx, {
            operation: FACT_NORMALIZATION_OPERATION,
            key: input.idempotencyKey,
            requestHash,
            resourceType: 'fact_candidate',
            resourceId: parent.id,
          });
          return {
            sourceFactCandidateId: parent.id,
            reason: 'NORMALIZED',
            normalizations: existingActive,
            replayed: false,
          };
        }

        if (existingActive.length > 0) {
          await norms.lockActiveIdentitiesForParentFacts(tenant, tx, [parent.id]);
          await norms.supersedeActiveLinkedToFacts(tenant, tx, [parent.id]);
        }

        const inserted: FactNormalizationDto[] = [];
        for (const draft of drafts) {
          const active = await norms.findActiveByIdentity(
            tenant,
            tx,
            draft.normalizationIdentityFingerprint,
          );
          if (active) {
            if (active.sourceFactCandidateId !== parent.id) {
              throw new FactConflictError();
            }
            inserted.push(active);
            continue;
          }
          try {
            inserted.push(await norms.insert(tenant, tx, draftToInsert(draft, parent.id)));
          } catch (err) {
            if (err instanceof FactConflictError) throw err;
            throw err;
          }
        }

        await idempotency.insert(tenant, tx, {
          operation: FACT_NORMALIZATION_OPERATION,
          key: input.idempotencyKey,
          requestHash,
          resourceType: 'fact_candidate',
          resourceId: parent.id,
        });

        const finalActive = await norms.listActiveByParentFact(tenant, tx, parent.id);
        return {
          sourceFactCandidateId: parent.id,
          reason: 'NORMALIZED',
          normalizations: finalActive,
          replayed: false,
        };
      },
      env,
    );
  }
}

export const factNormalizationService = new FactNormalizationService();
