import { createHash } from 'node:crypto';
import {
  CUE_PARSER_VERSION,
  FACT_CANDIDATE_F3D1_AUTHORITY,
  FACT_NORMALIZER_VERSION,
  MAX_NORMALIZER_DRAFTS,
  TERMINOLOGY_CANONICALIZATION_VERSION,
  computeNormalizerFingerprint,
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
import { PgConsultationIntakeRepository } from '../repositories/consultationIntake.js';
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
import {
  lockChiefComplaintCueSource,
  lockF3cReviewedCueSource,
  lockStructuredVitalSourceFields,
} from './cueSourceLock.js';
import { PgCandidateReviewRepository } from '../repositories/candidateReview.js';
import {
  exactVitalValueText,
  isStructuredVitalSourceField,
  structuredVitalSpec,
  vitalValueContentSha256,
} from './structuredVitalSource.js';
import { lockAndSupersedeFactVerifications } from '../repositories/factVerification.js';

const FACT_NORMALIZATION_OPERATION = 'clinical.fact_normalization';
const CLOSED_INPUT_KEYS = new Set(['sourceFactCandidateId', 'idempotencyKey']);

const facts = new PgFactCandidateRepository();
const norms = new PgFactNormalizationRepository();
const idempotency = new PgIdempotencyRepository();
const consultations = new PgConsultationRepository();
const intakeRepo = new PgConsultationIntakeRepository();
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

export type FactNormalizationServiceDeps = {
  /** Invoked only on first-write path immediately before C1/C2 parse or D2. */
  readonly beforeFirstWriteParse?: () => void;
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

function expectedParserFingerprint(packChecksum: string): string {
  return createHash('sha256')
    .update(`${CUE_PARSER_VERSION}|${TERMINOLOGY_CANONICALIZATION_VERSION}|${packChecksum}`, 'utf8')
    .digest('hex');
}

function structuredUnitParserFingerprint(packChecksum: string): string {
  return createHash('sha256')
    .update(`STRUCTURED_UNIT_NO_PARSER|${FACT_NORMALIZER_VERSION}|${packChecksum}`, 'utf8')
    .digest('hex');
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

function buildRequestHash(input: {
  parentId: string;
  organizationId: string;
  clinicId: string;
  parentSourceIdentityFingerprint: string;
  parentContentFingerprint: string;
  liveSourceIdentityFingerprint: string;
  liveContentSha256: string;
  liveReviewEventId: string | null;
  liveReviewAction: string | null;
  liveCandidateId: string | null;
  normalizationMode: 'CUE_RESULT' | 'STRUCTURED_UNIT';
  sourceChannel: string;
  sourceField: string;
  liveUnitText: string | null;
  liveUnitPosture: string | null;
  pack: LoadedTerminologyPack;
}): string {
  const parserVersion = input.normalizationMode === 'STRUCTURED_UNIT' ? 'none' : CUE_PARSER_VERSION;
  const parserFingerprint =
    input.normalizationMode === 'STRUCTURED_UNIT'
      ? structuredUnitParserFingerprint(input.pack.contentChecksum)
      : expectedParserFingerprint(input.pack.contentChecksum);
  const normalizerFingerprint = computeNormalizerFingerprint();
  return hashPayload({
    v: 2,
    operation: FACT_NORMALIZATION_OPERATION,
    sourceFactCandidateId: input.parentId,
    organizationId: input.organizationId,
    clinicId: input.clinicId,
    parentSourceIdentityFingerprint: input.parentSourceIdentityFingerprint,
    parentContentFingerprint: input.parentContentFingerprint,
    liveSourceIdentityFingerprint: input.liveSourceIdentityFingerprint,
    liveContentSha256: input.liveContentSha256,
    liveReviewEventId: input.liveReviewEventId,
    liveReviewAction: input.liveReviewAction,
    liveCandidateId: input.liveCandidateId,
    normalizationMode: input.normalizationMode,
    sourceChannel: input.sourceChannel,
    sourceField: input.sourceField,
    liveUnitText: input.liveUnitText,
    liveUnitPosture: input.liveUnitPosture,
    packId: input.pack.packId,
    packVersion: input.pack.packVersion,
    packContentChecksum: input.pack.contentChecksum,
    parserVersion,
    parserFingerprint,
    normalizerVersion: FACT_NORMALIZER_VERSION,
    normalizerFingerprint,
  });
}

export class FactNormalizationService {
  private readonly deps: FactNormalizationServiceDeps;

  constructor(deps: FactNormalizationServiceDeps = {}) {
    this.deps = deps;
  }

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
          peek.sourceChannel === 'STRUCTURED_INTAKE' &&
          isStructuredVitalSourceField(peek.sourceField)
        ) {
          await lockStructuredVitalSourceFields(tx, tenant, peek.consultationId, [
            peek.sourceField,
          ]);
        } else if (
          peek.sourceChannel === 'STRUCTURED_INTAKE' ||
          String(peek.sourceField).startsWith('VITAL_')
        ) {
          throw new ValidationError('SOURCE_INELIGIBLE');
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
        let liveContentSha256: string;
        let liveReviewEventId: string | null = null;
        let liveReviewAction: string | null = null;
        let liveCandidateId: string | null = null;
        let normalizationMode: 'CUE_RESULT' | 'STRUCTURED_UNIT' = 'CUE_RESULT';
        let liveUnitText: string | null = null;
        let liveUnitPosture: string | null = null;
        let chiefBinding: Awaited<
          ReturnType<CueEligibleSourceService['loadDoctorDeclaredChiefComplaintBindingLocked']>
        > | null = null;
        let f3cBinding: Awaited<
          ReturnType<F3cReviewedCueSourceService['loadF3cReviewedSourceBindingLocked']>
        > | null = null;
        let structuredAssertedValueText: string | null = null;

        if (
          parent.sourceChannel === 'DOCTOR_DECLARED' &&
          parent.sourceField === 'CHIEF_COMPLAINT'
        ) {
          chiefBinding = await cueChief.loadDoctorDeclaredChiefComplaintBindingLocked(
            tenant,
            tx,
            parent.consultationId,
            pack,
          );
          if (
            chiefBinding.patientId !== parent.patientId ||
            chiefBinding.consultationId !== parent.consultationId ||
            chiefBinding.organizationId !== parent.organizationId ||
            chiefBinding.clinicId !== parent.clinicId
          ) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          if (parent.originalSourceSpan !== boundSpanForBinding(chiefBinding.exactPersistedText)) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          liveSourceIdentityFingerprint = chiefBinding.sourceIdentityFingerprint;
          liveContentSha256 = chiefBinding.contentSha256;
        } else if (
          parent.sourceChannel === 'STRUCTURED_INTAKE' &&
          isStructuredVitalSourceField(parent.sourceField)
        ) {
          const spec = structuredVitalSpec(parent.sourceField);
          if (!spec) throw new ValidationError('SOURCE_INELIGIBLE');
          const bundle = await intakeRepo.getBundle(tenant, tx, parent.consultationId);
          if (!bundle || bundle.consultationId !== parent.consultationId) {
            throw new ResourceNotFoundError();
          }
          const liveValue = bundle.vitals?.[spec.column];
          if (liveValue == null || typeof liveValue !== 'number' || !Number.isFinite(liveValue)) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          const valueText = exactVitalValueText(liveValue);
          if (parent.originalSourceSpan !== boundSpanForBinding(valueText)) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          if (parent.unitText !== spec.unitText || parent.unitPosture !== 'EXACT_AS_SOURCE') {
            throw new ValidationError('SOURCE_MUTATED');
          }
          normalizationMode = 'STRUCTURED_UNIT';
          liveUnitText = spec.unitText;
          liveUnitPosture = 'EXACT_AS_SOURCE';
          structuredAssertedValueText = valueText;
          liveSourceIdentityFingerprint = parent.sourceIdentityFingerprint;
          liveContentSha256 = vitalValueContentSha256(valueText, spec.unitText);
        } else {
          if (!parent.extractionCandidateId || !parent.evidenceItemId || !parent.reviewEventId) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          f3cBinding = await cueF3c.loadF3cReviewedSourceBindingLocked(
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
            f3cBinding.candidateId !== parent.extractionCandidateId ||
            f3cBinding.evidenceItemId !== parent.evidenceItemId ||
            f3cBinding.consultationId !== parent.consultationId ||
            f3cBinding.patientId !== parent.patientId ||
            f3cBinding.reviewEventId !== parent.reviewEventId
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
          liveReviewEventId = f3cBinding.reviewEventId;
          liveReviewAction = f3cBinding.reviewAction;
          liveCandidateId = f3cBinding.candidateId;
          liveSourceIdentityFingerprint = f3cBinding.sourceIdentityFingerprint;
          liveContentSha256 = f3cBinding.contentSha256;
        }

        const requestHash = buildRequestHash({
          parentId: parent.id,
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          parentSourceIdentityFingerprint: parent.sourceIdentityFingerprint,
          parentContentFingerprint: parent.contentFingerprint,
          liveSourceIdentityFingerprint,
          liveContentSha256,
          liveReviewEventId,
          liveReviewAction,
          liveCandidateId,
          normalizationMode,
          sourceChannel: parent.sourceChannel,
          sourceField: parent.sourceField,
          liveUnitText,
          liveUnitPosture,
          pack,
        });

        // Resolve/replay before any C1/C2 parse or D2 normalize.
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
            reason: replayed.length === 0 ? 'NO_MATCHES' : 'NORMALIZED',
            normalizations: replayed,
            replayed: true,
          };
        }

        this.deps.beforeFirstWriteParse?.();

        let normalizeResult;
        if (normalizationMode === 'STRUCTURED_UNIT') {
          if (!liveUnitText || !liveUnitPosture || structuredAssertedValueText == null) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          normalizeResult = normalizeSourceLinkedFact(
            {
              mode: 'STRUCTURED_UNIT',
              sourceRef: parent.id,
              sourceChannel: 'STRUCTURED_INTAKE',
              sourceField: parent.sourceField as
                | 'VITAL_BP_SYSTOLIC'
                | 'VITAL_BP_DIASTOLIC'
                | 'VITAL_PULSE'
                | 'VITAL_TEMPERATURE'
                | 'VITAL_SPO2'
                | 'VITAL_WEIGHT'
                | 'VITAL_HEIGHT',
              sourceIdentityFingerprint: liveSourceIdentityFingerprint,
              assertedValueText: structuredAssertedValueText,
              unitText: liveUnitText,
              unitPosture: liveUnitPosture as 'EXACT_AS_SOURCE',
            },
            pack,
          );
        } else {
          let parserResult;
          if (chiefBinding) {
            parserResult = cueChief.parseDoctorDeclaredChiefComplaintFromBinding(
              chiefBinding,
              pack,
            );
          } else if (f3cBinding) {
            parserResult = cueF3c.parseF3cReviewedSourceFromBinding(f3cBinding, pack);
          } else {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          if (!parserResult.ok) {
            mapNormalizerFailure(parserResult.reason);
          }
          normalizeResult = normalizeSourceLinkedFact(
            {
              mode: 'CUE_RESULT',
              sourceRef: parent.id,
              sourceChannel: parent.sourceChannel,
              sourceField: parent.sourceField,
              sourceIdentityFingerprint: liveSourceIdentityFingerprint,
              parserResult,
            },
            pack,
          );
        }
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
        ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
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

        if (normalizeResult.reason === 'NO_MATCHES' || drafts.length === 0) {
          const prior = await norms.listActiveByParentFact(tenant, tx, parent.id);
          if (prior.length > 0) {
            await norms.lockActiveIdentitiesForParentFacts(tenant, tx, [parent.id]);
            await lockAndSupersedeFactVerifications(tenant, tx, [parent.id]);
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
          await lockAndSupersedeFactVerifications(tenant, tx, [parent.id]);
          await norms.supersedeActiveLinkedToFacts(tenant, tx, [parent.id]);
        } else if (drafts.length > 0) {
          // Empty → non-empty ACTIVE snapshot invalidates prior empty-snapshot reviews.
          await lockAndSupersedeFactVerifications(tenant, tx, [parent.id]);
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
          inserted.push(await norms.insert(tenant, tx, draftToInsert(draft, parent.id)));
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
