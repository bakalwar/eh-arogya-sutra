import {
  FACT_CANDIDATE_F3D1_AUTHORITY,
  FACT_VERIFICATION_ACTION_REASON_CODES,
  FACT_VERIFICATION_ACTIONS,
  FACT_VERIFICATION_AUTHORITY_SCOPE,
  FACT_VERIFICATION_REASON_CODES,
  MAX_FACT_VERIFICATION_SNAPSHOT_NORMS,
  loadPinnedProductionPack,
  type FactVerificationAction,
  type FactVerificationEventDto,
  type FactVerificationReasonCode,
  type LoadedTerminologyPack,
} from '@ehas2/evidence-extract';
import {
  FactConflictError,
  IdempotencyConflictError,
  ResourceNotFoundError,
  ValidationError,
} from '../domainErrors.js';
import { withTenantTransaction } from '../pool.js';
import { PgAuditEventRepository } from '../repositories/postgres.js';
import { PgConsultationRepository } from '../repositories/postgres.js';
import { PgConsultationIntakeRepository } from '../repositories/consultationIntake.js';
import { PgCandidateReviewRepository } from '../repositories/candidateReview.js';
import { PgFactCandidateRepository } from '../repositories/factCandidate.js';
import { PgFactNormalizationRepository } from '../repositories/factNormalization.js';
import { PgFactVerificationRepository } from '../repositories/factVerification.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { assertUuid, hashPayload } from '../validation.js';
import { buildNormalizationSnapshotFingerprint } from '../factVerificationSnapshot.js';
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
import {
  exactVitalValueText,
  isStructuredVitalSourceField,
  LEGACY_TEMPERATURE_UNIT_TEXT,
  structuredVitalSpec,
} from './structuredVitalSource.js';

export const FACT_VERIFICATION_OPERATION = 'clinical.fact_verification_v1' as const;

const CLOSED_INPUT_KEYS = new Set([
  'factCandidateId',
  'action',
  'reasonCode',
  'supersedesVerificationId',
  'idempotencyKey',
]);

function loadPinnedPackOrThrow(): LoadedTerminologyPack {
  try {
    return loadPinnedProductionPack();
  } catch {
    throw new ValidationError('PACK_UNAVAILABLE');
  }
}

function boundSpan(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    throw new ValidationError('SOURCE_SPAN_LIMIT');
  }
  return trimmed;
}

function assertTreatingDoctor(tenant: TenantContext, doctorUserId: string): void {
  if (tenant.actorRole !== 'Doctor' || tenant.actorId !== doctorUserId) {
    throw new ResourceNotFoundError();
  }
}

function assertClosedInput(raw: Record<string, unknown>): void {
  for (const key of Object.keys(raw)) {
    if (!CLOSED_INPUT_KEYS.has(key)) {
      throw new ValidationError('UNKNOWN_INPUT_KEY');
    }
  }
}

function isAction(value: string): value is FactVerificationAction {
  return (FACT_VERIFICATION_ACTIONS as readonly string[]).includes(value);
}

function isReason(value: string): value is FactVerificationReasonCode {
  return (FACT_VERIFICATION_REASON_CODES as readonly string[]).includes(value);
}

function assertActionReason(
  action: FactVerificationAction,
  reasonCode: FactVerificationReasonCode,
): void {
  const allowed = FACT_VERIFICATION_ACTION_REASON_CODES[action];
  if (!allowed.includes(reasonCode)) {
    throw new ValidationError('INVALID_ACTION_REASON');
  }
}

export type ReviewSourceLinkedFactInput = {
  factCandidateId: string;
  action: string;
  reasonCode: string;
  supersedesVerificationId?: string | null;
  idempotencyKey: string;
};

export type FactVerificationServiceDeps = {
  onSafeMetric?: (event: { name: string; code?: string }) => void;
};

export class FactVerificationService {
  private readonly deps: FactVerificationServiceDeps;

  constructor(deps: FactVerificationServiceDeps = {}) {
    this.deps = deps;
  }

  private metric(code: string): void {
    this.deps.onSafeMetric?.({ name: 'fact_verification_result', code });
  }

  async reviewSourceLinkedFact(
    tenant: TenantContext,
    input: ReviewSourceLinkedFactInput,
    env: Record<string, string | undefined> = process.env,
  ): Promise<FactVerificationEventDto> {
    assertTenantContext(tenant);
    assertUuid(tenant.organizationId, 'organizationId');
    assertUuid(tenant.clinicId, 'clinicId');
    assertUuid(tenant.actorId, 'actorId');
    assertClosedInput(input as unknown as Record<string, unknown>);
    assertUuid(input.factCandidateId, 'factCandidateId');

    if (tenant.actorRole !== 'Doctor') {
      throw new ResourceNotFoundError();
    }
    if (!isAction(input.action)) throw new ValidationError('INVALID_ACTION');
    if (!isReason(input.reasonCode)) throw new ValidationError('INVALID_REASON');
    const action: FactVerificationAction = input.action;
    const reasonCode: FactVerificationReasonCode = input.reasonCode;
    assertActionReason(action, reasonCode);

    const key = String(input.idempotencyKey ?? '').trim();
    if (key.length < 8 || key.length > 128) {
      throw new ValidationError('IDEMPOTENCY_KEY_REQUIRED');
    }
    if (input.supersedesVerificationId != null) {
      assertUuid(input.supersedesVerificationId, 'supersedesVerificationId');
    }

    const pack = loadPinnedPackOrThrow();
    const facts = new PgFactCandidateRepository();
    const norms = new PgFactNormalizationRepository();
    const verifications = new PgFactVerificationRepository();
    const consultations = new PgConsultationRepository();
    const intakeRepo = new PgConsultationIntakeRepository();
    const reviews = new PgCandidateReviewRepository();
    const cueChief = new CueEligibleSourceService();
    const cueF3c = new F3cReviewedCueSourceService();
    const idempotency = new PgIdempotencyRepository();
    const audit = new PgAuditEventRepository();

    return withTenantTransaction(
      tenant,
      async (tx) => {
        const peek = await facts.findById(tenant, tx, input.factCandidateId);
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
        } else {
          throw new ValidationError('SOURCE_INELIGIBLE');
        }

        await facts.lockIdentity(tx, peek.sourceIdentityFingerprint);
        const parent = await facts.findById(tenant, tx, input.factCandidateId);
        if (!parent) throw new ResourceNotFoundError();
        if (
          parent.decisionStatus !== 'ACTIVE' ||
          parent.authorityStatus !== FACT_CANDIDATE_F3D1_AUTHORITY ||
          parent.clinicallyUsed !== false
        ) {
          throw new ValidationError('FACT_INELIGIBLE');
        }
        if (
          parent.organizationId !== tenant.organizationId ||
          parent.clinicId !== tenant.clinicId
        ) {
          throw new ResourceNotFoundError();
        }

        const consultation = await consultations.findById(tenant, tx, parent.consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertTreatingDoctor(tenant, consultation.doctorUserId);
        if (
          consultation.patientId !== parent.patientId ||
          consultation.organizationId !== tenant.organizationId ||
          consultation.clinicId !== tenant.clinicId
        ) {
          throw new ResourceNotFoundError();
        }

        // Live source eligibility + freshness
        if (
          parent.sourceChannel === 'DOCTOR_DECLARED' &&
          parent.sourceField === 'CHIEF_COMPLAINT'
        ) {
          const chiefBinding = await cueChief.loadDoctorDeclaredChiefComplaintBindingLocked(
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
          if (parent.originalSourceSpan !== boundSpan(chiefBinding.exactPersistedText)) {
            throw new ValidationError('SOURCE_MUTATED');
          }
        } else if (
          parent.sourceChannel === 'STRUCTURED_INTAKE' &&
          isStructuredVitalSourceField(parent.sourceField)
        ) {
          if (
            parent.sourceField === 'VITAL_TEMPERATURE' &&
            parent.unitText === LEGACY_TEMPERATURE_UNIT_TEXT
          ) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          const spec = structuredVitalSpec(parent.sourceField);
          if (!spec) throw new ValidationError('SOURCE_INELIGIBLE');
          const bundle = await intakeRepo.getBundle(tenant, tx, parent.consultationId);
          if (!bundle) throw new ResourceNotFoundError();
          const liveValue = bundle.vitals?.[spec.column];
          if (liveValue == null || typeof liveValue !== 'number' || !Number.isFinite(liveValue)) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          const valueText = exactVitalValueText(liveValue);
          if (parent.originalSourceSpan !== boundSpan(valueText)) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          if (parent.unitText !== spec.unitText || parent.unitPosture !== 'EXACT_AS_SOURCE') {
            throw new ValidationError('SOURCE_MUTATED');
          }
        } else {
          if (!parent.extractionCandidateId || !parent.evidenceItemId || !parent.reviewEventId) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          const f3cBinding = await cueF3c.loadF3cReviewedSourceBindingLocked(
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
            f3cBinding.reviewEventId !== parent.reviewEventId ||
            f3cBinding.evidenceItemId !== parent.evidenceItemId ||
            f3cBinding.consultationId !== parent.consultationId ||
            f3cBinding.patientId !== parent.patientId ||
            f3cBinding.organizationId !== parent.organizationId ||
            f3cBinding.clinicId !== parent.clinicId
          ) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          // Parent fact identity uses F3D-1 identityFingerprint; F3C cue adapter uses a
          // distinct bindF3cReviewedSourceIdentity. Live eligibility is review + effective text.
          const activeReview = await reviews.findActiveForCandidate(
            tenant,
            tx,
            parent.extractionCandidateId,
          );
          if (!activeReview || activeReview.id !== parent.reviewEventId) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          if (
            activeReview.action !== 'ACCEPT_AS_SOURCE_TEXT' &&
            activeReview.action !== 'CORRECT_SOURCE_TEXT'
          ) {
            throw new ValidationError('SOURCE_INELIGIBLE');
          }
          const effective = deriveEffectiveReviewedCueText(
            activeReview.action,
            activeReview.originalRawText,
            activeReview.correctedRawText,
          );
          if (parent.originalSourceSpan !== boundSpan(effective)) {
            throw new ValidationError('SOURCE_MUTATED');
          }
        }

        const activeNorms = await norms.listActiveByParentFact(tenant, tx, parent.id);
        if (activeNorms.length > MAX_FACT_VERIFICATION_SNAPSHOT_NORMS) {
          throw new ValidationError('SNAPSHOT_OVERFLOW');
        }
        for (const n of activeNorms) {
          if (
            n.decisionStatus !== 'ACTIVE' ||
            n.authorityScope !== 'FACT_NORMALIZED_SOURCE_LINKED' ||
            n.clinicallyUsed !== false ||
            n.sourceFactCandidateId !== parent.id ||
            n.organizationId !== parent.organizationId ||
            n.clinicId !== parent.clinicId
          ) {
            throw new ValidationError('NORM_INELIGIBLE');
          }
        }
        await norms.lockIdentitiesSorted(
          tx,
          activeNorms.map((n) => n.normalizationIdentityFingerprint),
        );
        const lockedNorms = await norms.listActiveByParentFact(tenant, tx, parent.id);
        if (lockedNorms.length !== activeNorms.length) {
          throw new ValidationError('SOURCE_MUTATED');
        }
        const snapshotFingerprint = buildNormalizationSnapshotFingerprint(
          lockedNorms.map((n) => ({
            id: n.id,
            normalizationIdentityFingerprint: n.normalizationIdentityFingerprint,
          })),
        );

        await verifications.lockSubject(tx, parent.id);
        const active = await verifications.findActiveByFactId(tenant, tx, parent.id);

        const requestHash = hashPayload({
          operation: FACT_VERIFICATION_OPERATION,
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          factCandidateId: parent.id,
          sourceIdentityFingerprint: parent.sourceIdentityFingerprint,
          contentFingerprint: parent.contentFingerprint,
          normalizationSnapshotFingerprint: snapshotFingerprint,
          normalizationCount: lockedNorms.length,
          action,
          reasonCode,
          supersedesVerificationId: input.supersedesVerificationId ?? null,
          reviewerId: tenant.actorId,
          authorityScope: FACT_VERIFICATION_AUTHORITY_SCOPE,
        });

        const existingKey = await idempotency.resolveOrThrow(
          tenant,
          tx,
          FACT_VERIFICATION_OPERATION,
          key,
          requestHash,
        );
        if (existingKey) {
          const replay = await verifications.findById(tenant, tx, existingKey.resourceId);
          if (!replay) throw new ResourceNotFoundError();
          if (replay.decisionStatus !== 'ACTIVE') {
            throw new IdempotencyConflictError();
          }
          if (
            replay.factCandidateId !== parent.id ||
            replay.sourceIdentityFingerprint !== parent.sourceIdentityFingerprint ||
            replay.contentFingerprint !== parent.contentFingerprint ||
            replay.normalizationSnapshotFingerprint !== snapshotFingerprint
          ) {
            throw new IdempotencyConflictError();
          }
          this.metric('IDEMPOTENT_REPLAY');
          return replay;
        }

        let supersedesId: string | null = null;
        if (active) {
          if (
            input.supersedesVerificationId == null ||
            input.supersedesVerificationId !== active.id
          ) {
            throw new FactConflictError();
          }
          const superseded = await verifications.supersedeActive(tenant, tx, active.id);
          if (superseded.id !== active.id) throw new FactConflictError();
          supersedesId = active.id;
        } else if (input.supersedesVerificationId != null) {
          throw new FactConflictError();
        }

        const created = await verifications.insert(tenant, tx, {
          patientId: parent.patientId,
          consultationId: parent.consultationId,
          factCandidateId: parent.id,
          sourceChannel: parent.sourceChannel,
          sourceField: parent.sourceField,
          sourceIdentityFingerprint: parent.sourceIdentityFingerprint,
          contentFingerprint: parent.contentFingerprint,
          action,
          reasonCode,
          supersedesVerificationId: supersedesId,
          actorId: tenant.actorId,
        });
        if (
          created.normalizationSnapshotFingerprint !== snapshotFingerprint ||
          created.normalizationCount !== lockedNorms.length
        ) {
          throw new FactConflictError();
        }

        await idempotency.insert(tenant, tx, {
          operation: FACT_VERIFICATION_OPERATION,
          key,
          requestHash,
          resourceType: 'fact_verification',
          resourceId: created.id,
        });

        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'fact_verification_review',
          resourceType: 'fact_verification',
          resourceId: created.id,
          outcome: 'SUCCESS',
          metadata: {
            code: action,
            factCandidateId: parent.id,
            reasonCode,
            decisionStatus: created.decisionStatus,
            authorityScope: FACT_VERIFICATION_AUTHORITY_SCOPE,
            normalizationCount: created.normalizationCount,
          },
        });

        this.metric('MATERIALIZED');
        return created;
      },
      env,
    );
  }
}

export const factVerificationService = new FactVerificationService();

export {
  buildNormalizationSnapshotFingerprint,
  EMPTY_FACT_VERIFICATION_SNAPSHOT_FINGERPRINT,
} from '../factVerificationSnapshot.js';
