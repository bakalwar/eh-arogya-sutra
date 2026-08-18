import {
  assertTenantContext,
  type TenantContext,
  type TransactionContext,
} from '../tenantContext.js';
import { withTenantTransaction } from '../pool.js';
import { PgAuditEventRepository, PgConsultationRepository } from '../repositories/postgres.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import { PgConsultationIntakeRepository } from '../repositories/consultationIntake.js';
import { PgEvidenceRepository } from '../repositories/evidence.js';
import { PgExtractionRepository } from '../repositories/extraction.js';
import { PgCandidateReviewRepository } from '../repositories/candidateReview.js';
import {
  PgFactCandidateRepository,
  type InsertFactCandidateInput,
} from '../repositories/factCandidate.js';
import { FactConflictError, ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import { assertUuid, hashPayload } from '../validation.js';
import {
  FACT_CANDIDATE_CATEGORIES,
  FACT_CANDIDATE_CHANNELS,
  FACT_CANDIDATE_SOURCE_FIELDS,
  FACT_LIMITATION_CODES,
  assertNoStorageInLocator,
  factCandidatesEnabled,
  presentSourceLocator,
  type CandidateType,
  type FactCandidateCategory,
  type FactCandidateChannel,
  type FactCandidateDto,
  type FactCandidateSourceField,
  type FactLimitationCode,
  type FactUnitPosture,
  type SourceLocator,
} from '@ehas2/evidence-extract';
import type { EvidenceType } from '@ehas2/evidence-ingest';

const FACT_OPERATION = 'clinical.fact_candidate';
const IMAGING_TYPES = new Set<EvidenceType>(['USG', 'CT', 'MRI', 'XRAY']);
const LAB_CANDIDATE_TYPES = new Set<CandidateType>([
  'TEST_ANALYTE_LABEL',
  'TEXTUAL_VALUE',
  'UNIT',
  'REFERENCE_RANGE_TEXT',
]);
const HISTORY_CATEGORIES = new Set<FactCandidateCategory>([
  'MEDICATION_HISTORY_STATEMENT',
  'ALLERGY_STATEMENT',
]);

const consultations = new PgConsultationRepository();
const intakeRepo = new PgConsultationIntakeRepository();
const evidenceRepo = new PgEvidenceRepository();
const extractionRepo = new PgExtractionRepository();
const reviewRepo = new PgCandidateReviewRepository();
const facts = new PgFactCandidateRepository();
const audit = new PgAuditEventRepository();
const idempotency = new PgIdempotencyRepository();

export type FactCandidateServiceDeps = {
  onSafeMetric?: (event: { name: string; code?: string }) => void;
};

export type MaterializeFactCandidateInput = {
  sourceChannel: string;
  sourceField: string;
  category?: string | null;
  symptomId?: string | null;
  evidenceId?: string | null;
  candidateId?: string | null;
  supersedesFactId?: string | null;
  idempotencyKey: string;
};

function assertEnabled(env: Record<string, string | undefined>): void {
  if (!factCandidatesEnabled(env)) {
    throw new ValidationError('FACT_CANDIDATES_NOT_CONNECTED');
  }
}

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

function isChannel(value: string): value is FactCandidateChannel {
  return (FACT_CANDIDATE_CHANNELS as readonly string[]).includes(value);
}

function isSourceField(value: string): value is FactCandidateSourceField {
  return (FACT_CANDIDATE_SOURCE_FIELDS as readonly string[]).includes(value);
}

function isCategory(value: string): value is FactCandidateCategory {
  return (FACT_CANDIDATE_CATEGORIES as readonly string[]).includes(value);
}

function boundSpan(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    throw new ValidationError('SOURCE_SPAN_LIMIT');
  }
  return trimmed;
}

function optionalBoundAttr(value: string | null | undefined, code: string): string | null {
  if (value == null || value.trim() === '') return null;
  const trimmed = value.trim();
  if (trimmed.length > 120) throw new ValidationError(code);
  return trimmed;
}

function exactEnteredNumber(value: number): string {
  return String(value);
}

function sortCodes(codes: readonly FactLimitationCode[]): FactLimitationCode[] {
  const allow = new Set<string>(FACT_LIMITATION_CODES);
  const unique = [...new Set(codes)].filter((c) => allow.has(c));
  unique.sort();
  return unique;
}

function identityFingerprint(input: {
  organizationId: string;
  clinicId: string;
  consultationId: string;
  sourceChannel: FactCandidateChannel;
  sourceField: FactCandidateSourceField;
  factCategory: FactCandidateCategory;
  intakeSymptomId: string | null;
  extractionCandidateId: string | null;
}): string {
  return hashPayload({
    v: 1,
    organizationId: input.organizationId,
    clinicId: input.clinicId,
    consultationId: input.consultationId,
    sourceChannel: input.sourceChannel,
    sourceField: input.sourceField,
    factCategory: input.factCategory,
    intakeSymptomId: input.intakeSymptomId,
    extractionCandidateId: input.extractionCandidateId,
  });
}

function contentFingerprint(input: {
  originalSourceSpan: string;
  assertedText: string | null;
  assertedValue: string | null;
  unitText: string | null;
  unitPosture: FactUnitPosture;
  negated: boolean;
  durationText: string | null;
  onsetText: string | null;
}): string {
  return hashPayload(input);
}

function unitFromExact(unit: string): { unitText: string; unitPosture: FactUnitPosture } {
  return { unitText: boundSpan(unit).slice(0, 32), unitPosture: 'EXACT_AS_SOURCE' };
}

function unresolvedUnit(): { unitText: null; unitPosture: FactUnitPosture } {
  return { unitText: null, unitPosture: 'UNRESOLVED_UNIT' };
}

function notApplicableUnit(): { unitText: null; unitPosture: FactUnitPosture } {
  return { unitText: null, unitPosture: 'NOT_APPLICABLE' };
}

function deriveReviewedCategory(
  evidenceType: EvidenceType,
  candidateType: CandidateType,
): FactCandidateCategory {
  if (candidateType === 'WRITTEN_IMPRESSION_TEXT') {
    if (IMAGING_TYPES.has(evidenceType)) return 'IMAGING_REPORT_STATEMENT';
    if (evidenceType === 'BLOOD_REPORT' || evidenceType === 'OTHER_INVESTIGATION') {
      return 'SOURCE_STATED_DIAGNOSIS';
    }
    throw new ValidationError('INELIGIBLE_EVIDENCE_TYPE');
  }
  if (LAB_CANDIDATE_TYPES.has(candidateType)) return 'LAB_OBSERVATION';
  throw new ValidationError('INELIGIBLE_CANDIDATE_TYPE');
}

function expectedChannel(field: FactCandidateSourceField): FactCandidateChannel {
  if (field === 'REVIEWED_EXTRACTION_CANDIDATE') return 'REVIEWED_REPORT_TEXT';
  if (field.startsWith('VITAL_')) return 'STRUCTURED_INTAKE';
  return 'DOCTOR_DECLARED';
}

function defaultCategory(field: FactCandidateSourceField): FactCandidateCategory | null {
  if (field === 'CHIEF_COMPLAINT' || field === 'SYMPTOM_ROW') return 'SYMPTOM';
  if (field === 'DOCTOR_OBSERVATIONS') return 'SIGN';
  if (field.startsWith('VITAL_')) return 'VITAL';
  return null;
}

function locatorSafe(locator: SourceLocator): SourceLocator {
  try {
    assertNoStorageInLocator(locator);
    return presentSourceLocator(locator);
  } catch {
    throw new ValidationError('SOURCE_LOCATOR_STORAGE_FORBIDDEN');
  }
}

export class FactCandidateService {
  constructor(private readonly deps: FactCandidateServiceDeps = {}) {}

  private metric(code: string): void {
    this.deps.onSafeMetric?.({ name: 'fact_candidate_result', code });
  }

  async list(
    tenant: TenantContext,
    consultationId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<FactCandidateDto[]> {
    assertTenantContext(tenant);
    assertEnabled(env);
    assertWriterRole(tenant);
    assertUuid(consultationId, 'consultationId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const consultation = await consultations.findById(tenant, tx, consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);
        return facts.listByConsultation(tenant, tx, consultationId);
      },
      env,
    );
  }

  async materialize(
    tenant: TenantContext,
    consultationId: string,
    input: MaterializeFactCandidateInput,
    env: Record<string, string | undefined> = process.env,
  ): Promise<FactCandidateDto> {
    assertTenantContext(tenant);
    assertEnabled(env);
    assertWriterRole(tenant);
    assertUuid(consultationId, 'consultationId');
    if (
      !input.idempotencyKey ||
      input.idempotencyKey.length < 8 ||
      input.idempotencyKey.length > 128
    ) {
      throw new ValidationError('IDEMPOTENCY_KEY_REQUIRED');
    }
    if (!isChannel(input.sourceChannel)) {
      throw new ValidationError('INVALID_SOURCE_CHANNEL');
    }
    if (!isSourceField(input.sourceField)) {
      throw new ValidationError('INVALID_SOURCE_FIELD');
    }
    const sourceChannel = input.sourceChannel;
    const sourceField = input.sourceField;
    if (expectedChannel(sourceField) !== sourceChannel) {
      throw new ValidationError('SOURCE_CHANNEL_MISMATCH');
    }
    if (input.category != null && input.category !== '' && !isCategory(input.category)) {
      throw new ValidationError('UNSUPPORTED_FACT_CATEGORY');
    }
    if (input.symptomId) assertUuid(input.symptomId, 'symptomId');
    if (input.evidenceId) assertUuid(input.evidenceId, 'evidenceId');
    if (input.candidateId) assertUuid(input.candidateId, 'candidateId');
    if (input.supersedesFactId) assertUuid(input.supersedesFactId, 'supersedesFactId');
    if (sourceChannel === 'REVIEWED_REPORT_TEXT') {
      if (!input.evidenceId || !input.candidateId) {
        throw new ValidationError('REVIEWED_SOURCE_IDS_REQUIRED');
      }
    } else if (input.evidenceId || input.candidateId) {
      throw new ValidationError('EVIDENCE_IDS_NOT_ALLOWED');
    }
    if (sourceField === 'SYMPTOM_ROW' && !input.symptomId) {
      throw new ValidationError('SYMPTOM_ID_REQUIRED');
    }
    if (sourceField !== 'SYMPTOM_ROW' && input.symptomId) {
      throw new ValidationError('SYMPTOM_ID_NOT_ALLOWED');
    }

    const requestHash = hashPayload({
      sourceChannel,
      sourceField,
      category: input.category ?? null,
      symptomId: input.symptomId ?? null,
      evidenceId: input.evidenceId ?? null,
      candidateId: input.candidateId ?? null,
      supersedesFactId: input.supersedesFactId ?? null,
      consultationId,
    });

    return withTenantTransaction(
      tenant,
      async (tx) => {
        const consultation = await consultations.findById(tenant, tx, consultationId);
        if (!consultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, consultation.doctorUserId);

        const draft = await this.deriveRow(
          tenant,
          tx,
          consultation.patientId,
          consultationId,
          sourceChannel,
          sourceField,
          input,
        );
        await facts.lockIdentity(tx, draft.sourceIdentityFingerprint);

        const lockedConsultation = await consultations.findById(tenant, tx, consultationId);
        if (!lockedConsultation) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, lockedConsultation.doctorUserId);
        if (
          lockedConsultation.patientId !== draft.patientId ||
          lockedConsultation.patientId !== consultation.patientId
        ) {
          throw new ResourceNotFoundError();
        }

        const existingKey = await idempotency.resolveOrThrow(
          tenant,
          tx,
          FACT_OPERATION,
          input.idempotencyKey,
          requestHash,
        );
        if (existingKey) {
          const replay = await facts.findById(tenant, tx, existingKey.resourceId);
          if (!replay) throw new ResourceNotFoundError();
          this.metric('IDEMPOTENT_REPLAY');
          return replay;
        }

        const active = await facts.findActiveByIdentity(
          tenant,
          tx,
          draft.sourceIdentityFingerprint,
        );
        if (active) {
          if (
            active.decisionStatus !== 'ACTIVE' ||
            active.patientId !== lockedConsultation.patientId ||
            active.consultationId !== consultationId ||
            active.organizationId !== tenant.organizationId ||
            active.clinicId !== tenant.clinicId ||
            active.sourceIdentityFingerprint !== draft.sourceIdentityFingerprint
          ) {
            throw new ResourceNotFoundError();
          }
          if (input.supersedesFactId) {
            if (input.supersedesFactId !== active.id) {
              throw new FactConflictError();
            }
            const superseded = await facts.supersedeActive(tenant, tx, input.supersedesFactId);
            if (superseded.id !== active.id) {
              throw new FactConflictError();
            }
            draft.supersedesFactId = active.id;
          } else if (active.contentFingerprint === draft.contentFingerprint) {
            await idempotency.insert(tenant, tx, {
              operation: FACT_OPERATION,
              key: input.idempotencyKey,
              requestHash,
              resourceType: 'fact_candidate',
              resourceId: active.id,
            });
            this.metric('IDENTITY_REPLAY');
            return active;
          } else {
            throw new FactConflictError();
          }
        } else if (input.supersedesFactId) {
          throw new FactConflictError();
        }

        const created = await facts.insert(tenant, tx, draft);
        await idempotency.insert(tenant, tx, {
          operation: FACT_OPERATION,
          key: input.idempotencyKey,
          requestHash,
          resourceType: 'fact_candidate',
          resourceId: created.id,
        });
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'clinical_fact_candidate',
          resourceType: 'fact_candidate',
          resourceId: created.id,
          outcome: 'SUCCESS',
          metadata: {
            code: 'MATERIALIZED',
            sourceChannel: created.sourceChannel,
            factCategory: created.factCategory,
            decisionStatus: created.decisionStatus,
            authorityStatus: created.authorityStatus,
            reasonCode: 'F3D1_UNVERIFIED_CANDIDATE',
          },
        });
        this.metric('MATERIALIZED');
        return created;
      },
      env,
    );
  }

  private async deriveRow(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
    consultationId: string,
    sourceChannel: FactCandidateChannel,
    sourceField: FactCandidateSourceField,
    input: MaterializeFactCandidateInput,
  ): Promise<InsertFactCandidateInput> {
    if (sourceChannel === 'REVIEWED_REPORT_TEXT') {
      return this.deriveReviewed(tenant, tx, patientId, consultationId, input);
    }
    return this.deriveIntakeOrDeclared(
      tenant,
      tx,
      patientId,
      consultationId,
      sourceChannel,
      sourceField,
      input,
    );
  }

  private async deriveIntakeOrDeclared(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
    consultationId: string,
    sourceChannel: FactCandidateChannel,
    sourceField: FactCandidateSourceField,
    input: MaterializeFactCandidateInput,
  ): Promise<InsertFactCandidateInput> {
    const bundle = await intakeRepo.getBundle(tenant, tx, consultationId);
    if (!bundle) throw new ResourceNotFoundError();

    let factCategory = defaultCategory(sourceField);
    if (sourceField === 'HISTORY_NOTES') {
      if (!input.category || !HISTORY_CATEGORIES.has(input.category as FactCandidateCategory)) {
        throw new ValidationError('HISTORY_CATEGORY_REQUIRED');
      }
      factCategory = input.category as FactCandidateCategory;
    } else if (input.category === 'NEGATED_FINDING') {
      if (sourceField !== 'SYMPTOM_ROW' && sourceField !== 'CHIEF_COMPLAINT') {
        throw new ValidationError('NEGATED_SOURCE_INVALID');
      }
      factCategory = 'NEGATED_FINDING';
    } else if (input.category && factCategory && input.category !== factCategory) {
      throw new ValidationError('CATEGORY_MISMATCH');
    }
    if (!factCategory) throw new ValidationError('UNSUPPORTED_FACT_CATEGORY');

    const negated = factCategory === 'NEGATED_FINDING';
    let originalSourceSpan = '';
    let assertedText: string | null = null;
    let assertedValue: string | null = null;
    let unitText: string | null = null;
    let unitPosture: FactUnitPosture = 'NOT_APPLICABLE';
    let durationText: string | null = null;
    let onsetText: string | null = null;
    let intakeSymptomId: string | null = null;

    if (sourceField === 'CHIEF_COMPLAINT') {
      if (!bundle.chiefComplaintText) throw new ValidationError('SOURCE_VALUE_MISSING');
      originalSourceSpan = boundSpan(bundle.chiefComplaintText);
      assertedText = originalSourceSpan;
      durationText = optionalBoundAttr(bundle.chiefComplaintDuration, 'DURATION_LIMIT');
      onsetText = optionalBoundAttr(bundle.chiefComplaintOnset, 'ONSET_LIMIT');
      ({ unitText, unitPosture } = notApplicableUnit());
    } else if (sourceField === 'SYMPTOM_ROW') {
      const row = bundle.symptoms.find((s) => s.id === input.symptomId);
      if (!row) throw new ResourceNotFoundError();
      originalSourceSpan = boundSpan(row.label);
      assertedText = originalSourceSpan;
      durationText = optionalBoundAttr(row.duration, 'DURATION_LIMIT');
      intakeSymptomId = row.id;
      ({ unitText, unitPosture } = notApplicableUnit());
    } else if (sourceField === 'DOCTOR_OBSERVATIONS') {
      const text = bundle.clinicalContext?.additionalContext;
      if (!text) throw new ValidationError('SOURCE_VALUE_MISSING');
      originalSourceSpan = boundSpan(text);
      assertedText = originalSourceSpan;
      ({ unitText, unitPosture } = notApplicableUnit());
    } else if (sourceField === 'HISTORY_NOTES') {
      const text = bundle.clinicalContext?.historyNotes;
      if (!text) throw new ValidationError('SOURCE_VALUE_MISSING');
      originalSourceSpan = boundSpan(text);
      assertedText = originalSourceSpan;
      ({ unitText, unitPosture } = notApplicableUnit());
    } else {
      const vitals = bundle.vitals;
      if (!vitals) throw new ValidationError('SOURCE_VALUE_MISSING');
      const vitalMap: Record<string, { value: number | null; unit: string }> = {
        VITAL_BP_SYSTOLIC: { value: vitals.bloodPressureSystolic, unit: 'mmHg' },
        VITAL_BP_DIASTOLIC: { value: vitals.bloodPressureDiastolic, unit: 'mmHg' },
        VITAL_PULSE: { value: vitals.pulseBpm, unit: 'bpm' },
        VITAL_TEMPERATURE: { value: vitals.temperatureC, unit: 'C' },
        VITAL_SPO2: { value: vitals.spo2Percent, unit: '%' },
        VITAL_WEIGHT: { value: vitals.weightKg, unit: 'kg' },
        VITAL_HEIGHT: { value: vitals.heightCm, unit: 'cm' },
      };
      const picked = vitalMap[sourceField];
      if (!picked || picked.value == null) throw new ValidationError('SOURCE_VALUE_MISSING');
      originalSourceSpan = boundSpan(exactEnteredNumber(picked.value));
      assertedValue = originalSourceSpan;
      const unit = unitFromExact(picked.unit);
      unitText = unit.unitText;
      unitPosture = unit.unitPosture;
    }

    const limitationCodes = sortCodes([
      'NOT_AUTHORITATIVE',
      'NO_NORMALIZATION',
      'NO_CLINICAL_VERIFICATION',
      'SOURCE_DECLARED_ONLY',
      ...(unitPosture === 'UNRESOLVED_UNIT' ? (['UNRESOLVED_UNIT'] as const) : []),
    ]);

    const sourceIdentityFingerprint = identityFingerprint({
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
      consultationId,
      sourceChannel,
      sourceField,
      factCategory,
      intakeSymptomId,
      extractionCandidateId: null,
    });
    const contentFp = contentFingerprint({
      originalSourceSpan,
      assertedText,
      assertedValue,
      unitText,
      unitPosture,
      negated,
      durationText,
      onsetText,
    });
    return {
      patientId,
      consultationId,
      sourceChannel,
      factCategory,
      sourceField,
      intakeSymptomId,
      evidenceItemId: null,
      extractionRunId: null,
      extractionCandidateId: null,
      reviewEventId: null,
      originalSourceSpan,
      assertedText,
      assertedValue,
      unitText,
      unitPosture,
      negated,
      durationText,
      onsetText,
      sourceLocator: null,
      sourceIdentityFingerprint,
      contentFingerprint: contentFp,
      limitationCodes,
      confidence: null,
      supersedesFactId: null,
    };
  }

  private async deriveReviewed(
    tenant: TenantContext,
    tx: TransactionContext,
    patientId: string,
    consultationId: string,
    input: MaterializeFactCandidateInput,
  ): Promise<InsertFactCandidateInput> {
    const evidenceId = String(input.evidenceId);
    const candidateId = String(input.candidateId);
    const item = await evidenceRepo.findById(tenant, tx, evidenceId);
    if (!item || item.consultationId !== consultationId || item.patientId !== patientId) {
      throw new ResourceNotFoundError();
    }
    const candidate = await extractionRepo.findCandidateById(tenant, tx, candidateId);
    if (
      !candidate ||
      candidate.evidenceItemId !== evidenceId ||
      candidate.consultationId !== consultationId ||
      !candidate.id ||
      !candidate.extractionRunId
    ) {
      throw new ResourceNotFoundError();
    }
    const review = await reviewRepo.findActiveForCandidate(tenant, tx, candidateId);
    if (!review) {
      throw new ValidationError('F3C_REVIEW_REQUIRED');
    }
    if (review.action !== 'ACCEPT_AS_SOURCE_TEXT' && review.action !== 'CORRECT_SOURCE_TEXT') {
      throw new ValidationError('F3C_REVIEW_INELIGIBLE');
    }
    if (review.decisionStatus !== 'ACTIVE') {
      throw new ValidationError('F3C_REVIEW_INELIGIBLE');
    }
    const sourceText =
      review.action === 'CORRECT_SOURCE_TEXT' ? review.correctedRawText : review.originalRawText;
    if (!sourceText) throw new ValidationError('F3C_REVIEW_INELIGIBLE');
    const originalSourceSpan = boundSpan(sourceText);
    const factCategory = deriveReviewedCategory(item.evidenceType, candidate.candidateType);
    if (input.category && input.category !== factCategory) {
      throw new ValidationError('CATEGORY_MISMATCH');
    }
    const sourceLocator = locatorSafe(review.sourceLocator);
    let assertedText: string | null = originalSourceSpan;
    let assertedValue: string | null = null;
    let unitText: string | null = null;
    let unitPosture: FactUnitPosture = 'NOT_APPLICABLE';
    if (candidate.candidateType === 'TEXTUAL_VALUE') {
      assertedValue = originalSourceSpan;
      assertedText = null;
      if (candidate.unitText) {
        const unit = unitFromExact(candidate.unitText);
        unitText = unit.unitText;
        unitPosture = unit.unitPosture;
      } else {
        const unresolved = unresolvedUnit();
        unitText = unresolved.unitText;
        unitPosture = unresolved.unitPosture;
      }
    } else if (candidate.candidateType === 'UNIT') {
      assertedText = null;
      const unit = unitFromExact(candidate.unitText ?? originalSourceSpan);
      unitText = unit.unitText;
      unitPosture = unit.unitPosture;
    } else if (candidate.candidateType === 'REFERENCE_RANGE_TEXT') {
      ({ unitText, unitPosture } = notApplicableUnit());
    }

    const limitationCodes = sortCodes([
      'NOT_AUTHORITATIVE',
      'NO_NORMALIZATION',
      'NO_CLINICAL_VERIFICATION',
      'TRANSCRIPTION_ONLY',
      ...(candidate.limitationCodes.includes('SYNTHETIC_FIXTURE_ONLY')
        ? (['SYNTHETIC_FIXTURE_ONLY'] as const)
        : []),
      ...(factCategory === 'SOURCE_STATED_DIAGNOSIS' ? (['NO_DISEASE_MAPPING'] as const) : []),
      ...(unitPosture === 'UNRESOLVED_UNIT' ? (['UNRESOLVED_UNIT'] as const) : []),
    ]);

    const sourceIdentityFingerprint = identityFingerprint({
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
      consultationId,
      sourceChannel: 'REVIEWED_REPORT_TEXT',
      sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
      factCategory,
      intakeSymptomId: null,
      extractionCandidateId: candidate.id,
    });
    const contentFp = contentFingerprint({
      originalSourceSpan,
      assertedText,
      assertedValue,
      unitText,
      unitPosture,
      negated: false,
      durationText: null,
      onsetText: null,
    });
    return {
      patientId,
      consultationId,
      sourceChannel: 'REVIEWED_REPORT_TEXT',
      factCategory,
      sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
      intakeSymptomId: null,
      evidenceItemId: item.id,
      extractionRunId: candidate.extractionRunId,
      extractionCandidateId: candidate.id,
      reviewEventId: review.id,
      originalSourceSpan,
      assertedText,
      assertedValue,
      unitText,
      unitPosture,
      negated: false,
      durationText: null,
      onsetText: null,
      sourceLocator,
      sourceIdentityFingerprint,
      contentFingerprint: contentFp,
      limitationCodes,
      confidence: candidate.confidence,
      supersedesFactId: null,
    };
  }
}

export const factCandidateService = new FactCandidateService();
