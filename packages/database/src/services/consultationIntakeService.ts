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
import {
  presentVitalMeasurementKeys,
  sourceFieldsForVitalColumns,
  vitalFieldsChanged,
  type VitalPatchMeasurementKey,
} from './structuredVitalSource.js';

const intakeRepo = new PgConsultationIntakeRepository();
const consultations = new PgConsultationRepository();
const audit = new PgAuditEventRepository();
const idempotency = new PgIdempotencyRepository();

const VITAL_NOTES_KEY = 'notes' as const;

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

type ValidatedVitalTouch = {
  readonly measurementKeys: readonly VitalPatchMeasurementKey[];
  readonly notesTouched: boolean;
  readonly values: Partial<{
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    pulseBpm: number | null;
    temperatureC: number | null;
    spo2Percent: number | null;
    weightKg: number | null;
    heightCm: number | null;
    notes: string | null;
  }>;
};

function validateVitalPatchTouches(
  raw: NonNullable<ConsultationIntakePatch['vitals']>,
): ValidatedVitalTouch | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ValidationError('Invalid vitals');
  }
  const measurementKeys = presentVitalMeasurementKeys(raw);
  const notesTouched = Object.prototype.hasOwnProperty.call(raw, VITAL_NOTES_KEY);
  for (const key of measurementKeys) {
    if ((raw as Record<string, unknown>)[key] === undefined) {
      throw new ValidationError(`Invalid ${key}`);
    }
  }
  if (notesTouched && (raw as Record<string, unknown>).notes === undefined) {
    throw new ValidationError('Invalid notes');
  }
  if (measurementKeys.length === 0 && !notesTouched) {
    return null;
  }
  const values: ValidatedVitalTouch['values'] = {};
  if (measurementKeys.includes('bloodPressureSystolic')) {
    values.bloodPressureSystolic = optionalInt(raw.bloodPressureSystolic, 'systolic', 60, 260);
  }
  if (measurementKeys.includes('bloodPressureDiastolic')) {
    values.bloodPressureDiastolic = optionalInt(raw.bloodPressureDiastolic, 'diastolic', 30, 160);
  }
  if (measurementKeys.includes('pulseBpm')) {
    values.pulseBpm = optionalInt(raw.pulseBpm, 'pulse', 20, 250);
  }
  if (measurementKeys.includes('temperatureC')) {
    values.temperatureC = optionalNumber(raw.temperatureC, 'temperatureC', 30, 45);
  }
  if (measurementKeys.includes('spo2Percent')) {
    values.spo2Percent = optionalNumber(raw.spo2Percent, 'spo2', 50, 100);
  }
  if (measurementKeys.includes('weightKg')) {
    values.weightKg = optionalNumber(raw.weightKg, 'weightKg', 0.1, 400);
  }
  if (measurementKeys.includes('heightCm')) {
    values.heightCm = optionalNumber(raw.heightCm, 'heightCm', 20, 250);
  }
  if (notesTouched) {
    values.notes = assertOptionalBoundedText(raw.notes, 'vitals.notes', 500);
  }
  const sys = values.bloodPressureSystolic;
  const dia = values.bloodPressureDiastolic;
  if (sys != null && dia != null && sys <= dia) {
    throw new ValidationError('systolic must be greater than diastolic');
  }
  return { measurementKeys, notesTouched, values };
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
    const vitalsTouch =
      input.vitals !== undefined && input.vitals !== null
        ? validateVitalPatchTouches(input.vitals)
        : undefined;
    if (
      vitalsTouch &&
      vitalsTouch.values.bloodPressureSystolic != null &&
      vitalsTouch.values.bloodPressureDiastolic != null &&
      vitalsTouch.values.bloodPressureSystolic <= vitalsTouch.values.bloodPressureDiastolic
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
      vitalsTouch: vitalsTouch
        ? {
            measurementKeys: [...vitalsTouch.measurementKeys].sort(),
            notesTouched: vitalsTouch.notesTouched,
            values: vitalsTouch.values,
          }
        : input.vitals !== undefined
          ? { empty: true }
          : undefined,
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
        if (vitalsTouch) {
          const touchedSourceFields = sourceFieldsForVitalColumns(vitalsTouch.measurementKeys);
          if (touchedSourceFields.length > 0) {
            await lockStructuredVitalSourceFields(tx, tenant, consultationId, touchedSourceFields);
          }
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
          const prior = priorBundle?.vitals ?? null;
          const merged = {
            bloodPressureSystolic: vitalsTouch.measurementKeys.includes('bloodPressureSystolic')
              ? (vitalsTouch.values.bloodPressureSystolic ?? null)
              : (prior?.bloodPressureSystolic ?? null),
            bloodPressureDiastolic: vitalsTouch.measurementKeys.includes('bloodPressureDiastolic')
              ? (vitalsTouch.values.bloodPressureDiastolic ?? null)
              : (prior?.bloodPressureDiastolic ?? null),
            pulseBpm: vitalsTouch.measurementKeys.includes('pulseBpm')
              ? (vitalsTouch.values.pulseBpm ?? null)
              : (prior?.pulseBpm ?? null),
            temperatureC: vitalsTouch.measurementKeys.includes('temperatureC')
              ? (vitalsTouch.values.temperatureC ?? null)
              : (prior?.temperatureC ?? null),
            spo2Percent: vitalsTouch.measurementKeys.includes('spo2Percent')
              ? (vitalsTouch.values.spo2Percent ?? null)
              : (prior?.spo2Percent ?? null),
            weightKg: vitalsTouch.measurementKeys.includes('weightKg')
              ? (vitalsTouch.values.weightKg ?? null)
              : (prior?.weightKg ?? null),
            heightCm: vitalsTouch.measurementKeys.includes('heightCm')
              ? (vitalsTouch.values.heightCm ?? null)
              : (prior?.heightCm ?? null),
            notes: vitalsTouch.notesTouched
              ? (vitalsTouch.values.notes ?? null)
              : (prior?.notes ?? null),
          };
          if (
            merged.bloodPressureSystolic != null &&
            merged.bloodPressureDiastolic != null &&
            merged.bloodPressureSystolic <= merged.bloodPressureDiastolic
          ) {
            throw new ValidationError('systolic must be greater than diastolic');
          }
          const changedFields = vitalFieldsChanged(prior, merged);
          if (changedFields.length > 0) {
            await invalidateStructuredVitalFactsAndNormalizations(
              tenant,
              tx,
              consultationId,
              changedFields,
            );
          }
          await intakeRepo.patchVitalsColumns(tenant, tx, consultationId, vitalsTouch.values);
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
          metadata: { hasVitals: Boolean(vitalsTouch), symptomCount: symptoms?.length ?? 0 },
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
