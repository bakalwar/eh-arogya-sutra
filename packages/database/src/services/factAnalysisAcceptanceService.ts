import { createHash } from 'node:crypto';
import {
  CUE_PARSER_VERSION,
  FACT_ANALYSIS_ACCEPTANCE_ACTION,
  FACT_ANALYSIS_ACCEPTANCE_AUTHORITY,
  FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION,
  FACT_ANALYSIS_ACCEPTANCE_REASON,
  FACT_CANDIDATE_F3D1_AUTHORITY,
  FACT_NORMALIZER_METHOD,
  FACT_NORMALIZER_VERSION,
  FACT_VERIFICATION_AUTHORITY_SCOPE,
  MAX_FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_NORMS,
  TERMINOLOGY_CANONICALIZATION_VERSION,
  computeNormalizerFingerprint,
  loadPinnedProductionPack,
  type FactAnalysisAcceptanceEventDto,
  type LoadedTerminologyPack,
} from '@ehas2/evidence-extract';
import {
  FactConflictError,
  IdempotencyConflictError,
  ResourceNotFoundError,
  ValidationError,
} from '../domainErrors.js';
import { buildNormalizationSnapshotFingerprint } from '../factAnalysisAcceptanceSnapshot.js';
import { withTenantTransaction } from '../pool.js';
import { PgFactAnalysisAcceptanceRepository } from '../repositories/factAnalysisAcceptance.js';
import { PgFactCandidateRepository } from '../repositories/factCandidate.js';
import { PgFactNormalizationRepository } from '../repositories/factNormalization.js';
import { PgFactVerificationRepository } from '../repositories/factVerification.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import { PgConsultationRepository } from '../repositories/postgres.js';
import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { assertUuid, hashPayload } from '../validation.js';
import {
  lockChiefComplaintCueSource,
  lockF3cReviewedCueSource,
  lockStructuredVitalSourceFields,
} from './cueSourceLock.js';
import { isStructuredVitalSourceField } from './structuredVitalSource.js';

export const FACT_ANALYSIS_ACCEPTANCE_OPERATION = 'clinical.fact_analysis_acceptance_v1' as const;

const CLOSED_INPUT_KEYS = new Set(['sourceFactCandidateId', 'idempotencyKey']);

export type MaterializeFactAnalysisAcceptanceInput = {
  sourceFactCandidateId: string;
  idempotencyKey: string;
};

export type FactAnalysisAcceptanceServiceDeps = {
  onSafeMetric?: (event: { name: 'fact_analysis_acceptance_result'; code?: string }) => void;
};

function loadPack(): LoadedTerminologyPack {
  try {
    return loadPinnedProductionPack();
  } catch {
    throw new ValidationError('PACK_UNAVAILABLE');
  }
}

function parserFingerprint(packChecksum: string, structured: boolean): string {
  const binding = structured
    ? `STRUCTURED_UNIT_NO_PARSER|${FACT_NORMALIZER_VERSION}|${packChecksum}`
    : `${CUE_PARSER_VERSION}|${TERMINOLOGY_CANONICALIZATION_VERSION}|${packChecksum}`;
  return createHash('sha256').update(binding, 'utf8').digest('hex');
}

function assertClosedInput(raw: Record<string, unknown>): void {
  for (const key of Object.keys(raw)) {
    if (!CLOSED_INPUT_KEYS.has(key)) throw new ValidationError('UNKNOWN_INPUT_KEY');
  }
}

export class FactAnalysisAcceptanceService {
  constructor(private readonly deps: FactAnalysisAcceptanceServiceDeps = {}) {}

  private metric(code: 'IDEMPOTENT_REPLAY' | 'MATERIALIZED'): void {
    this.deps.onSafeMetric?.({ name: 'fact_analysis_acceptance_result', code });
  }

  async materializeFactAnalysisAcceptance(
    tenant: TenantContext,
    input: MaterializeFactAnalysisAcceptanceInput,
    env: Record<string, string | undefined> = process.env,
  ): Promise<FactAnalysisAcceptanceEventDto> {
    assertTenantContext(tenant);
    assertUuid(tenant.organizationId, 'organizationId');
    assertUuid(tenant.clinicId, 'clinicId');
    assertUuid(tenant.actorId, 'actorId');
    assertClosedInput(input as unknown as Record<string, unknown>);
    assertUuid(input.sourceFactCandidateId, 'sourceFactCandidateId');
    if (tenant.actorRole !== 'Doctor') throw new ResourceNotFoundError();
    const key = String(input.idempotencyKey ?? '').trim();
    if (key.length < 8 || key.length > 128) {
      throw new ValidationError('IDEMPOTENCY_KEY_REQUIRED');
    }

    const pack = loadPack();
    const facts = new PgFactCandidateRepository();
    const norms = new PgFactNormalizationRepository();
    const verifications = new PgFactVerificationRepository();
    const acceptances = new PgFactAnalysisAcceptanceRepository();
    const consultations = new PgConsultationRepository();
    const idempotency = new PgIdempotencyRepository();

    return withTenantTransaction(
      tenant,
      async (tx) => {
        const peek = await facts.findById(tenant, tx, input.sourceFactCandidateId);
        if (!peek) throw new ResourceNotFoundError();
        if (peek.sourceChannel === 'DOCTOR_DECLARED' && peek.sourceField === 'CHIEF_COMPLAINT') {
          await lockChiefComplaintCueSource(tx, tenant, peek.consultationId);
        } else if (
          peek.sourceChannel === 'REVIEWED_REPORT_TEXT' &&
          peek.sourceField === 'REVIEWED_EXTRACTION_CANDIDATE' &&
          peek.extractionCandidateId
        ) {
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
        const parent = await facts.findById(tenant, tx, input.sourceFactCandidateId);
        if (!parent) throw new ResourceNotFoundError();
        if (
          parent.decisionStatus !== 'ACTIVE' ||
          parent.authorityStatus !== FACT_CANDIDATE_F3D1_AUTHORITY ||
          parent.clinicallyUsed !== false
        ) {
          throw new ValidationError('FACT_INELIGIBLE');
        }

        const consultation = await consultations.findById(tenant, tx, parent.consultationId);
        if (
          !consultation ||
          consultation.doctorUserId !== tenant.actorId ||
          consultation.patientId !== parent.patientId
        ) {
          throw new ResourceNotFoundError();
        }

        const activeNorms = await norms.listActiveByParentFact(tenant, tx, parent.id);
        if (activeNorms.length > MAX_FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_NORMS) {
          throw new ValidationError('SNAPSHOT_OVERFLOW');
        }
        await norms.lockIdentitiesSorted(
          tx,
          activeNorms.map((n) => n.normalizationIdentityFingerprint),
        );
        const lockedNorms = await norms.listActiveByParentFact(tenant, tx, parent.id);
        for (const n of lockedNorms) {
          if (
            n.decisionStatus !== 'ACTIVE' ||
            n.authorityScope !== 'FACT_NORMALIZED_SOURCE_LINKED' ||
            n.clinicallyUsed !== false
          ) {
            throw new ValidationError('NORM_INELIGIBLE');
          }
        }
        const snapshot = buildNormalizationSnapshotFingerprint(
          lockedNorms.map((n) => ({
            id: n.id,
            normalizationIdentityFingerprint: n.normalizationIdentityFingerprint,
          })),
        );

        await verifications.lockSubject(tenant, tx, parent.id);
        const verification = await verifications.findActiveByFactId(tenant, tx, parent.id);
        if (
          !verification ||
          verification.action !== 'ACCEPT_SOURCE_LINKED_FACT' ||
          verification.authorityScope !== FACT_VERIFICATION_AUTHORITY_SCOPE
        ) {
          throw new ValidationError('VERIFICATION_INELIGIBLE');
        }
        const verificationNorms = await verifications.listSnapshotByEventId(
          tenant,
          tx,
          verification.id,
        );
        const verificationSnapshot = buildNormalizationSnapshotFingerprint(
          verificationNorms.map((n) => ({
            id: n.normalizationId,
            normalizationIdentityFingerprint: n.normalizationIdentityFingerprint,
          })),
        );
        if (
          verification.normalizationSnapshotFingerprint !== snapshot ||
          verification.normalizationCount !== lockedNorms.length ||
          verificationSnapshot !== snapshot ||
          verificationNorms.length !== lockedNorms.length
        ) {
          throw new ValidationError('VERIFICATION_SNAPSHOT_MISMATCH');
        }

        await acceptances.lockSubject(tenant, tx, parent.id);
        const active = await acceptances.findActiveByFactId(tenant, tx, parent.id);

        const structured =
          parent.sourceChannel === 'STRUCTURED_INTAKE' &&
          isStructuredVitalSourceField(parent.sourceField);
        const metadata = lockedNorms[0];
        const metadataValues = {
          packId: metadata?.packId ?? pack.packId,
          packVersion: metadata?.packVersion ?? pack.packVersion,
          packContentChecksum: metadata?.packContentChecksum ?? pack.contentChecksum,
          parserVersion: metadata?.parserVersion ?? (structured ? 'none' : CUE_PARSER_VERSION),
          parserFingerprint:
            metadata?.parserFingerprint ?? parserFingerprint(pack.contentChecksum, structured),
          normalizerMethod: metadata?.normalizerMethod ?? FACT_NORMALIZER_METHOD,
          normalizerVersion: metadata?.normalizerVersion ?? FACT_NORMALIZER_VERSION,
          normalizerFingerprint: metadata?.normalizerFingerprint ?? computeNormalizerFingerprint(),
        };
        for (const n of lockedNorms) {
          if (
            n.packId !== metadataValues.packId ||
            n.packVersion !== metadataValues.packVersion ||
            n.packContentChecksum !== metadataValues.packContentChecksum ||
            n.parserVersion !== metadataValues.parserVersion ||
            n.parserFingerprint !== metadataValues.parserFingerprint ||
            n.normalizerMethod !== metadataValues.normalizerMethod ||
            n.normalizerVersion !== metadataValues.normalizerVersion ||
            n.normalizerFingerprint !== metadataValues.normalizerFingerprint
          ) {
            throw new ValidationError('NORMALIZATION_METADATA_MISMATCH');
          }
        }

        const requestHash = hashPayload({
          operation: FACT_ANALYSIS_ACCEPTANCE_OPERATION,
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          factCandidateId: parent.id,
          verificationEventId: verification.id,
          normalizationSnapshotFingerprint: snapshot,
          action: FACT_ANALYSIS_ACCEPTANCE_ACTION,
          authorityScope: FACT_ANALYSIS_ACCEPTANCE_AUTHORITY,
          reasonCode: FACT_ANALYSIS_ACCEPTANCE_REASON,
          acceptanceContractVersion: FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION,
          actorId: tenant.actorId,
          ...metadataValues,
        });
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          FACT_ANALYSIS_ACCEPTANCE_OPERATION,
          key,
          requestHash,
        );
        if (existing) {
          const replay = await acceptances.findById(tenant, tx, existing.resourceId);
          if (!replay || replay.decisionStatus !== 'ACTIVE') {
            throw new IdempotencyConflictError();
          }
          this.metric('IDEMPOTENT_REPLAY');
          return replay;
        }

        let supersedesAcceptanceId: string | null = null;
        if (active) {
          await acceptances.supersedeActive(tenant, tx, active.id);
          supersedesAcceptanceId = active.id;
        }
        const created = await acceptances.insert(tenant, tx, {
          patientId: parent.patientId,
          consultationId: parent.consultationId,
          factCandidateId: parent.id,
          sourceChannel: parent.sourceChannel,
          sourceField: parent.sourceField,
          sourceIdentityFingerprint: parent.sourceIdentityFingerprint,
          contentFingerprint: parent.contentFingerprint,
          verificationEventId: verification.id,
          supersedesAcceptanceId,
          actorId: tenant.actorId,
          ...metadataValues,
        });
        if (
          created.normalizationSnapshotFingerprint !== snapshot ||
          created.normalizationCount !== lockedNorms.length
        ) {
          throw new FactConflictError();
        }
        await idempotency.insert(tenant, tx, {
          operation: FACT_ANALYSIS_ACCEPTANCE_OPERATION,
          key,
          requestHash,
          resourceType: 'fact_analysis_acceptance',
          resourceId: created.id,
        });
        this.metric('MATERIALIZED');
        return created;
      },
      env,
    );
  }
}

export const factAnalysisAcceptanceService = new FactAnalysisAcceptanceService();

export function materializeFactAnalysisAcceptance(
  tenant: TenantContext,
  input: MaterializeFactAnalysisAcceptanceInput,
  env?: Record<string, string | undefined>,
): Promise<FactAnalysisAcceptanceEventDto> {
  return factAnalysisAcceptanceService.materializeFactAnalysisAcceptance(tenant, input, env);
}
