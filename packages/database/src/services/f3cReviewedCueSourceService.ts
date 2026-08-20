import { createHash } from 'node:crypto';
import {
  assertNoStorageInLocator,
  loadPinnedProductionPack,
  parseOwnerFrozenCues,
  presentSourceLocator,
  type CueParserResult,
  type EligibleCueParserInput,
  type LoadedTerminologyPack,
  type SourceLocator,
} from '@ehas2/evidence-extract';
import { ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import { withTenantTransaction } from '../pool.js';
import { PgCandidateReviewRepository } from '../repositories/candidateReview.js';
import { PgEvidenceRepository } from '../repositories/evidence.js';
import {
  assertTenantContext,
  type TenantContext,
  type TransactionContext,
} from '../tenantContext.js';
import { assertUuid, hashPayload } from '../validation.js';
import { lockF3cReviewedCueSource } from './cueSourceLock.js';

const evidenceRepo = new PgEvidenceRepository();
const candidateReviewRepo = new PgCandidateReviewRepository();

const CLOSED_INPUT_KEYS = new Set(['consultationId', 'evidenceItemId', 'candidateId']);
const PARSER_MAX_UTF16 = 2000;
const SOURCE_CHANNEL = 'REVIEWED_REPORT_TEXT' as const;
const SOURCE_FIELD = 'REVIEWED_EXTRACTION_CANDIDATE' as const;
const PARSER_AUTHORITY_SCOPE = 'TERMINOLOGY_CUE_MATCH_ONLY' as const;
const F3C_AUTHORITY_SCOPE = 'SOURCE_TEXT_TRANSCRIPTION_ONLY' as const;
const PARSER_VERSION_BINDING = 'f3d2b-cue-parser-v1' as const;
const ELIGIBLE_ACTIONS = new Set(['ACCEPT_AS_SOURCE_TEXT', 'CORRECT_SOURCE_TEXT']);

const PARSER_FAIL_CODES = new Set([
  'UNTRUSTED_INPUT',
  'MALFORMED_UNICODE',
  'INPUT_TOO_LARGE',
  'PACK_UNAVAILABLE',
  'PARSER_TIMEOUT',
  'SOURCE_LOCATOR_STORAGE_FORBIDDEN',
]);

type ReviewedCueCandidateRow = {
  id: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  extractionRunId: string;
  status: string;
};

async function loadCandidateForReviewedCue(
  tenant: TenantContext,
  tx: TransactionContext,
  candidateId: string,
): Promise<ReviewedCueCandidateRow | null> {
  const r = await tx.query(
    `SELECT id, organization_id, clinic_id, patient_id, consultation_id,
            evidence_item_id, extraction_run_id, status
     FROM clinical_evidence_extraction_candidates
     WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
     LIMIT 1`,
    [tenant.organizationId, tenant.clinicId, candidateId],
  );
  const row = r.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  if (row.extraction_run_id == null) return null;
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    evidenceItemId: String(row.evidence_item_id),
    extractionRunId: String(row.extraction_run_id),
    status: String(row.status),
  };
}

export type ParseF3cReviewedSourceCuesInput = {
  readonly consultationId: string;
  readonly evidenceItemId: string;
  readonly candidateId: string;
};

export type F3cReviewedSourceCueAdapterResult = {
  readonly organizationId: string;
  readonly clinicId: string;
  readonly patientId: string;
  readonly consultationId: string;
  readonly evidenceItemId: string;
  readonly extractionRunId: string;
  readonly candidateId: string;
  readonly reviewEventId: string;
  readonly reviewAction: 'ACCEPT_AS_SOURCE_TEXT' | 'CORRECT_SOURCE_TEXT';
  readonly sourceChannel: typeof SOURCE_CHANNEL;
  readonly sourceField: typeof SOURCE_FIELD;
  readonly sourceIdentityFingerprint: string;
  readonly parser: CueParserResult;
};

function assertClosedSelectorInput(input: ParseF3cReviewedSourceCuesInput): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('UNTRUSTED_INPUT');
  }
  for (const key of Object.keys(input)) {
    if (!CLOSED_INPUT_KEYS.has(key)) {
      throw new ValidationError('UNTRUSTED_INPUT');
    }
  }
  if (
    typeof input.consultationId !== 'string' ||
    typeof input.evidenceItemId !== 'string' ||
    typeof input.candidateId !== 'string'
  ) {
    throw new ValidationError('UNTRUSTED_INPUT');
  }
  assertUuid(input.consultationId, 'consultationId');
  assertUuid(input.evidenceItemId, 'evidenceItemId');
  assertUuid(input.candidateId, 'candidateId');
}

function assertCaseOwner(tenant: TenantContext, submittedByActorId: string): void {
  if (tenant.actorRole === 'ClinicAdmin') return;
  if (tenant.actorRole === 'Doctor' && tenant.actorId === submittedByActorId) return;
  throw new ResourceNotFoundError();
}

function sha256Utf8(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function canonicalLocatorFingerprint(locator: SourceLocator): string {
  const presented = presentSourceLocator(locator);
  return hashPayload({
    page: presented.page,
    blockIndex: presented.blockIndex ?? null,
    bbox: presented.bbox
      ? {
          x: presented.bbox.x,
          y: presented.bbox.y,
          w: presented.bbox.w,
          h: presented.bbox.h,
        }
      : null,
  });
}

export function bindF3cReviewedSourceIdentity(input: {
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  evidenceItemId: string;
  extractionRunId: string;
  candidateId: string;
  reviewEventId: string;
  reviewAction: 'ACCEPT_AS_SOURCE_TEXT' | 'CORRECT_SOURCE_TEXT';
  exactEffectiveText: string;
  sourceLocator: SourceLocator;
  packId: string;
  packVersion: string;
  packContentChecksum: string;
}): string {
  return hashPayload({
    v: 1,
    organizationId: input.organizationId,
    clinicId: input.clinicId,
    patientId: input.patientId,
    consultationId: input.consultationId,
    evidenceItemId: input.evidenceItemId,
    extractionRunId: input.extractionRunId,
    candidateId: input.candidateId,
    reviewEventId: input.reviewEventId,
    reviewAction: input.reviewAction,
    contentSha256: sha256Utf8(input.exactEffectiveText),
    locatorFingerprint: canonicalLocatorFingerprint(input.sourceLocator),
    sourceChannel: SOURCE_CHANNEL,
    sourceField: SOURCE_FIELD,
    parserVersion: PARSER_VERSION_BINDING,
    parserAuthorityScope: PARSER_AUTHORITY_SCOPE,
    f3cAuthorityScope: F3C_AUTHORITY_SCOPE,
    packId: input.packId,
    packVersion: input.packVersion,
    packContentChecksum: input.packContentChecksum,
  });
}

function deriveEffectiveText(
  action: string,
  originalRawText: string,
  correctedRawText: string | null,
): string {
  if (action === 'ACCEPT_AS_SOURCE_TEXT') {
    return originalRawText;
  }
  if (action === 'CORRECT_SOURCE_TEXT') {
    if (correctedRawText == null) {
      throw new ValidationError('SOURCE_INELIGIBLE');
    }
    return correctedRawText;
  }
  throw new ValidationError('SOURCE_INELIGIBLE');
}

function loadPinnedPackOrThrow(): LoadedTerminologyPack {
  try {
    return loadPinnedProductionPack();
  } catch {
    throw new ValidationError('PACK_UNAVAILABLE');
  }
}

function mapParserThrow(err: unknown): never {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (PARSER_FAIL_CODES.has(code)) {
    throw new ValidationError(code);
  }
  throw new ValidationError('PARSER_UNAVAILABLE');
}

export class F3cReviewedCueSourceService {
  async parseF3cReviewedSourceCues(
    tenant: TenantContext,
    input: ParseF3cReviewedSourceCuesInput,
    env: Record<string, string | undefined> = process.env,
  ): Promise<F3cReviewedSourceCueAdapterResult> {
    assertTenantContext(tenant);
    assertUuid(tenant.organizationId, 'organizationId');
    assertUuid(tenant.clinicId, 'clinicId');
    assertUuid(tenant.actorId, 'actorId');
    assertClosedSelectorInput(input);
    const pack = loadPinnedPackOrThrow();

    return withTenantTransaction(
      tenant,
      async (tx) => {
        await lockF3cReviewedCueSource(tx, tenant, input.candidateId);

        const item = await evidenceRepo.findById(tenant, tx, input.evidenceItemId);
        if (!item) throw new ResourceNotFoundError();
        if (item.consultationId !== input.consultationId) {
          throw new ResourceNotFoundError();
        }
        if (item.organizationId !== tenant.organizationId || item.clinicId !== tenant.clinicId) {
          throw new ResourceNotFoundError();
        }
        assertCaseOwner(tenant, item.submittedByActorId);

        const candidate = await loadCandidateForReviewedCue(tenant, tx, input.candidateId);
        if (
          !candidate ||
          candidate.evidenceItemId !== input.evidenceItemId ||
          candidate.consultationId !== input.consultationId ||
          candidate.organizationId !== tenant.organizationId ||
          candidate.clinicId !== tenant.clinicId ||
          candidate.patientId !== item.patientId
        ) {
          throw new ResourceNotFoundError();
        }
        if (candidate.status !== 'EXTRACTED_UNVERIFIED') {
          throw new ValidationError('SOURCE_INELIGIBLE');
        }

        const active = await candidateReviewRepo.findActiveForCandidate(
          tenant,
          tx,
          input.candidateId,
        );
        if (!active) {
          throw new ValidationError('SOURCE_INELIGIBLE');
        }
        if (active.decisionStatus !== 'ACTIVE') {
          throw new ValidationError('SOURCE_INELIGIBLE');
        }
        if (
          active.candidateId !== candidate.id ||
          active.evidenceItemId !== input.evidenceItemId ||
          active.consultationId !== input.consultationId ||
          active.extractionRunId !== candidate.extractionRunId ||
          active.patientId !== candidate.patientId ||
          active.organizationId !== tenant.organizationId ||
          active.clinicId !== tenant.clinicId
        ) {
          throw new ResourceNotFoundError();
        }
        if (!ELIGIBLE_ACTIONS.has(active.action)) {
          throw new ValidationError('SOURCE_INELIGIBLE');
        }
        const reviewAction = active.action as 'ACCEPT_AS_SOURCE_TEXT' | 'CORRECT_SOURCE_TEXT';

        const effectiveText = deriveEffectiveText(
          reviewAction,
          active.originalRawText,
          active.correctedRawText,
        );
        if (effectiveText.trim() === '') {
          throw new ValidationError('SOURCE_INELIGIBLE');
        }
        if (effectiveText.length > PARSER_MAX_UTF16) {
          throw new ValidationError('INPUT_TOO_LARGE');
        }

        assertNoStorageInLocator(active.sourceLocator);
        const sourceLocator = presentSourceLocator(active.sourceLocator);

        const sourceIdentityFingerprint = bindF3cReviewedSourceIdentity({
          organizationId: candidate.organizationId,
          clinicId: candidate.clinicId,
          patientId: candidate.patientId,
          consultationId: candidate.consultationId,
          evidenceItemId: candidate.evidenceItemId,
          extractionRunId: candidate.extractionRunId,
          candidateId: candidate.id,
          reviewEventId: active.id,
          reviewAction,
          exactEffectiveText: effectiveText,
          sourceLocator,
          packId: pack.packId,
          packVersion: pack.packVersion,
          packContentChecksum: pack.contentChecksum,
        });

        const eligibleInput: EligibleCueParserInput = {
          sourceIdentityFingerprint,
          sourceChannel: SOURCE_CHANNEL,
          sourceField: SOURCE_FIELD,
          eligibleText: effectiveText,
          sourceLocator,
          organizationId: candidate.organizationId,
          clinicId: candidate.clinicId,
          patientId: candidate.patientId,
          consultationId: candidate.consultationId,
        };

        let parser: CueParserResult;
        try {
          parser = parseOwnerFrozenCues(eligibleInput, pack);
        } catch (err) {
          mapParserThrow(err);
        }

        return {
          organizationId: candidate.organizationId,
          clinicId: candidate.clinicId,
          patientId: candidate.patientId,
          consultationId: candidate.consultationId,
          evidenceItemId: candidate.evidenceItemId,
          extractionRunId: candidate.extractionRunId,
          candidateId: candidate.id,
          reviewEventId: active.id,
          reviewAction,
          sourceChannel: SOURCE_CHANNEL,
          sourceField: SOURCE_FIELD,
          sourceIdentityFingerprint,
          parser,
        };
      },
      env,
    );
  }
}

export const f3cReviewedCueSourceService = new F3cReviewedCueSourceService();
