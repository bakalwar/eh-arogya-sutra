import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { withTenantTransaction } from '../pool.js';
import { PgAuditEventRepository, PgConsultationRepository } from '../repositories/postgres.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import {
  PgConsultationIntakeRepository,
  type ConsultationIntakeBundle,
} from '../repositories/consultationIntake.js';
import { ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import {
  assertBoundedBatch,
  assertOptionalBoundedText,
  assertUuid,
  hashPayload,
} from '../validation.js';
import { consultationAllowsFieldUpdate } from '../consultationTransitions.js';
import { invalidateChiefComplaintFactsAndNormalizations } from './factNormalizationLifecycle.js';
import { lockChiefComplaintCueSource } from './cueSourceLock.js';
import { lockStructuredVitalSourceFields } from './cueSourceLock.js';
import { invalidateStructuredVitalFactsAndNormalizations } from './factNormalizationLifecycle.js';
import { STRUCTURED_VITAL_FIELD_SPECS, vitalFieldsChanged } from './structuredVitalSource.js';

const intakeRepo = new PgConsultationIntakeRepository();
const consultations = new PgConsultationRepository();
const audit = new PgAuditEventRepository();
const idempotency = new PgIdempotencyRepository();

function assertCaseOwner(tenant: TenantContext, doctorUserId: string): void {
  if (tenant.actorRole === 'ClinicAdmin') return;
  if (tenant.actorRole === 'Doctor' && tenant.actorId === doctorUserId) return;
  throw new ResourceNotFoundError();
}

function optionalInt(value: unknown, field: string, min: number, max: number): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(`Invalid ${field}`);
  }
  return n;
}

function optionalNumber(value: unknown, field: string, min: number, max: number): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new ValidationError(`Invalid ${field}`);
  }
  return n;
}

export type ConsultationIntakePatch = {
  chiefComplaintText?: string | null;
  chiefComplaintOnset?: string | null;
  chiefComplaintDuration?: string | null;
  vitals?: {
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
    pulseBpm?: number | null;
    temperatureC?: number | null;
    spo2Percent?: number | null;
    weightKg?: number | null;
    heightCm?: number | null;
    notes?: string | null;
  };
  symptoms?: readonly {
    label: string;
    severity?: string | null;
    duration?: string | null;
    phase?: string | null;
    notes?: string | null;
  }[];
  historyNotes?: string | null;
  doctorObservations?: string | null;
  lifestyleEvidence?: string | null;
  idempotencyKey?: string;
};

export class ConsultationIntakeService {
  async get(
    tenant: TenantContext,
    consultationId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ConsultationIntakeBundle> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const c = await consultations.findById(tenant, tx, consultationId);
        if (!c) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, c.doctorUserId);
        const bundle = await intakeRepo.getBundle(tenant, tx, consultationId);
        if (!bundle) throw new ResourceNotFoundError();
        return bundle;
      },
      env,
    );
  }

  async patch(
    tenant: TenantContext,
    consultationId: string,
    input: ConsultationIntakePatch,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ConsultationIntakeBundle> {
    assertTenantContext(tenant);
    assertUuid(consultationId, 'consultationId');
    const complaint = {
      ...(Object.prototype.hasOwnProperty.call(input, 'chiefComplaintText')
        ? {
            chiefComplaintText: assertOptionalBoundedText(
              input.chiefComplaintText,
              'chiefComplaintText',
              2000,
            ),
          }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, 'chiefComplaintOnset')
        ? {
            chiefComplaintOnset: assertOptionalBoundedText(
              input.chiefComplaintOnset,
              'chiefComplaintOnset',
              200,
            ),
          }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, 'chiefComplaintDuration')
        ? {
            chiefComplaintDuration: assertOptionalBoundedText(
              input.chiefComplaintDuration,
              'chiefComplaintDuration',
              200,
            ),
          }
        : {}),
    };
    const symptoms = input.symptoms
      ? input.symptoms.map((s) => ({
          label: assertOptionalBoundedText(s.label, 'symptom.label', 200) ?? '',
          severity: assertOptionalBoundedText(s.severity, 'symptom.severity', 40),
          duration: assertOptionalBoundedText(s.duration, 'symptom.duration', 80),
          phase: assertOptionalBoundedText(s.phase, 'symptom.phase', 40),
          notes: assertOptionalBoundedText(s.notes, 'symptom.notes', 500),
        }))
      : undefined;
    if (symptoms) {
      assertBoundedBatch(Math.max(symptoms.length, 1));
      for (const s of symptoms) {
        if (!s.label) throw new ValidationError('symptom.label required');
      }
    }
    const vitals = input.vitals
      ? {
          bloodPressureSystolic: optionalInt(
            input.vitals.bloodPressureSystolic,
            'systolic',
            60,
            260,
          ),
          bloodPressureDiastolic: optionalInt(
            input.vitals.bloodPressureDiastolic,
            'diastolic',
            30,
            160,
          ),
          pulseBpm: optionalInt(input.vitals.pulseBpm, 'pulse', 20, 250),
          temperatureC: optionalNumber(input.vitals.temperatureC, 'temperatureC', 30, 45),
          spo2Percent: optionalNumber(input.vitals.spo2Percent, 'spo2', 50, 100),
          weightKg: optionalNumber(input.vitals.weightKg, 'weightKg', 0.1, 400),
          heightCm: optionalNumber(input.vitals.heightCm, 'heightCm', 20, 250),
          notes: assertOptionalBoundedText(input.vitals.notes, 'vitals.notes', 500),
        }
      : undefined;
    if (
      vitals &&
      vitals.bloodPressureSystolic != null &&
      vitals.bloodPressureDiastolic != null &&
      vitals.bloodPressureSystolic <= vitals.bloodPressureDiastolic
    ) {
      throw new ValidationError('systolic must be greater than diastolic');
    }
    const context = {
      historyNotes: Object.prototype.hasOwnProperty.call(input, 'historyNotes')
        ? assertOptionalBoundedText(input.historyNotes, 'historyNotes', 4000)
        : undefined,
      doctorObservations: Object.prototype.hasOwnProperty.call(input, 'doctorObservations')
        ? assertOptionalBoundedText(input.doctorObservations, 'doctorObservations', 4000)
        : undefined,
      lifestyleEvidence: Object.prototype.hasOwnProperty.call(input, 'lifestyleEvidence')
        ? assertOptionalBoundedText(input.lifestyleEvidence, 'lifestyleEvidence', 2000)
        : undefined,
    };
    const requestHash = hashPayload({
      consultationId,
      complaint,
      vitals,
      symptoms,
      context,
    });
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'consultation.intake_patch',
          input.idempotencyKey,
          requestHash,
        );
        if (existing) {
          const bundle = await intakeRepo.getBundle(tenant, tx, existing.resourceId);
          if (!bundle) throw new ResourceNotFoundError();
          return bundle;
        }
        const current = await consultations.findById(tenant, tx, consultationId);
        if (!current) throw new ResourceNotFoundError();
        assertCaseOwner(tenant, current.doctorUserId);
        if (!consultationAllowsFieldUpdate(current.status)) {
          throw new ValidationError('Consultation fields are locked in current state');
        }
        const mutatesChiefComplaintText = Object.prototype.hasOwnProperty.call(
          input,
          'chiefComplaintText',
        );
        if (mutatesChiefComplaintText) {
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
          await invalidateChiefComplaintFactsAndNormalizations(tenant, tx, consultationId);
        }
        if (Object.keys(complaint).length > 0) {
          await intakeRepo.updateComplaintFields(tenant, tx, consultationId, complaint);
        }
        if (vitals) {
          // F3D-2D4: lock all structured-vital fields that upsert may rewrite, then
          // invalidate only fields whose persisted value actually changes.
          await lockStructuredVitalSourceFields(
            tx,
            tenant,
            consultationId,
            STRUCTURED_VITAL_FIELD_SPECS.map((s) => s.sourceField),
          );
          const lockedConsult = await consultations.findById(tenant, tx, consultationId);
          if (!lockedConsult) throw new ResourceNotFoundError();
          if (
            lockedConsult.organizationId !== tenant.organizationId ||
            lockedConsult.clinicId !== tenant.clinicId ||
            lockedConsult.id !== consultationId
          ) {
            throw new ValidationError('SOURCE_MUTATED');
          }
          assertCaseOwner(tenant, lockedConsult.doctorUserId);
          if (!consultationAllowsFieldUpdate(lockedConsult.status)) {
            throw new ValidationError('Consultation fields are locked in current state');
          }
          const priorBundle = await intakeRepo.getBundle(tenant, tx, consultationId);
          const changedFields = vitalFieldsChanged(priorBundle?.vitals ?? null, vitals);
          if (changedFields.length > 0) {
            await invalidateStructuredVitalFactsAndNormalizations(
              tenant,
              tx,
              consultationId,
              changedFields,
            );
          }
          await intakeRepo.upsertVitals(tenant, tx, consultationId, vitals);
        }
        if (symptoms) {
          await intakeRepo.replaceSymptoms(tenant, tx, consultationId, symptoms);
        }
        if (
          context.historyNotes !== undefined ||
          context.doctorObservations !== undefined ||
          context.lifestyleEvidence !== undefined
        ) {
          const prior = await intakeRepo.getBundle(tenant, tx, consultationId);
          await intakeRepo.upsertClinicalContext(tenant, tx, consultationId, {
            historyNotes:
              context.historyNotes !== undefined
                ? context.historyNotes
                : (prior?.clinicalContext?.historyNotes ?? null),
            additionalContext:
              context.doctorObservations !== undefined
                ? context.doctorObservations
                : (prior?.clinicalContext?.additionalContext ?? null),
            lifestyleEvidence:
              context.lifestyleEvidence !== undefined
                ? context.lifestyleEvidence
                : (prior?.clinicalContext?.lifestyleEvidence ?? null),
          });
        }
        if (input.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'consultation.intake_patch',
            key: input.idempotencyKey,
            requestHash,
            resourceType: 'consultation',
            resourceId: consultationId,
          });
        }
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'consultation_intake_updated',
          resourceType: 'consultation',
          resourceId: consultationId,
          outcome: 'SUCCESS',
          metadata: { hasVitals: Boolean(vitals), symptomCount: symptoms?.length ?? 0 },
        });
        const bundle = await intakeRepo.getBundle(tenant, tx, consultationId);
        if (!bundle) throw new ResourceNotFoundError();
        return bundle;
      },
      env,
    );
  }
}

export const consultationIntakeService = new ConsultationIntakeService();
