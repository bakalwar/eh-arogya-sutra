import type { TenantContext, TransactionContext } from '../tenantContext.js';

export type VitalsIntake = {
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  pulseBpm: number | null;
  temperatureC: number | null;
  spo2Percent: number | null;
  weightKg: number | null;
  heightCm: number | null;
  notes: string | null;
  recordedAt: string;
};

export type SymptomIntake = {
  id: string;
  label: string;
  severity: string | null;
  duration: string | null;
  phase: string | null;
  notes: string | null;
};

export type ClinicalContextIntake = {
  historyNotes: string | null;
  additionalContext: string | null;
  lifestyleEvidence: string | null;
};

export type ConsultationIntakeBundle = {
  consultationId: string;
  chiefComplaintText: string | null;
  chiefComplaintOnset: string | null;
  chiefComplaintDuration: string | null;
  vitals: VitalsIntake | null;
  symptoms: SymptomIntake[];
  clinicalContext: ClinicalContextIntake | null;
};

function num(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string | null {
  return value == null ? null : String(value);
}

export class PgConsultationIntakeRepository {
  async getBundle(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<ConsultationIntakeBundle | null> {
    const c = await tx.query(
      `SELECT id, chief_complaint_text, chief_complaint_onset, chief_complaint_duration
       FROM consultations
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [consultationId, tenant.organizationId, tenant.clinicId],
    );
    if (!c.rows[0]) return null;
    const crow = c.rows[0] as Record<string, unknown>;
    const v = await tx.query(
      `SELECT * FROM vitals WHERE consultation_id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [consultationId, tenant.organizationId, tenant.clinicId],
    );
    const s = await tx.query(
      `SELECT * FROM symptoms WHERE consultation_id = $1 AND organization_id = $2 AND clinic_id = $3
       ORDER BY created_at ASC`,
      [consultationId, tenant.organizationId, tenant.clinicId],
    );
    const x = await tx.query(
      `SELECT * FROM clinical_contexts
       WHERE consultation_id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [consultationId, tenant.organizationId, tenant.clinicId],
    );
    const vrow = v.rows[0] as Record<string, unknown> | undefined;
    const xrow = x.rows[0] as Record<string, unknown> | undefined;
    return {
      consultationId: String(crow.id),
      chiefComplaintText: str(crow.chief_complaint_text),
      chiefComplaintOnset: str(crow.chief_complaint_onset),
      chiefComplaintDuration: str(crow.chief_complaint_duration),
      vitals: vrow
        ? {
            bloodPressureSystolic: num(vrow.blood_pressure_systolic),
            bloodPressureDiastolic: num(vrow.blood_pressure_diastolic),
            pulseBpm: num(vrow.pulse_bpm),
            temperatureC: num(vrow.temperature_c),
            spo2Percent: num(vrow.spo2_percent),
            weightKg: num(vrow.weight_kg),
            heightCm: num(vrow.height_cm),
            notes: str(vrow.notes),
            recordedAt: new Date(String(vrow.recorded_at)).toISOString(),
          }
        : null,
      symptoms: (s.rows as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        label: String(row.label),
        severity: str(row.severity),
        duration: str(row.duration),
        phase: str(row.phase),
        notes: str(row.notes),
      })),
      clinicalContext: xrow
        ? {
            historyNotes: str(xrow.history_notes),
            additionalContext: str(xrow.additional_context),
            lifestyleEvidence: str(xrow.lifestyle_evidence),
          }
        : null,
    };
  }

  async updateComplaintFields(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    input: {
      chiefComplaintText?: string | null;
      chiefComplaintOnset?: string | null;
      chiefComplaintDuration?: string | null;
    },
  ): Promise<void> {
    await tx.query(
      `UPDATE consultations SET
         chief_complaint_text = CASE WHEN $4::boolean THEN $5 ELSE chief_complaint_text END,
         chief_complaint_onset = CASE WHEN $6::boolean THEN $7 ELSE chief_complaint_onset END,
         chief_complaint_duration = CASE WHEN $8::boolean THEN $9 ELSE chief_complaint_duration END,
         updated_at = now(),
         updated_by_actor_id = $10
       WHERE id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [
        consultationId,
        tenant.organizationId,
        tenant.clinicId,
        Object.prototype.hasOwnProperty.call(input, 'chiefComplaintText'),
        input.chiefComplaintText ?? null,
        Object.prototype.hasOwnProperty.call(input, 'chiefComplaintOnset'),
        input.chiefComplaintOnset ?? null,
        Object.prototype.hasOwnProperty.call(input, 'chiefComplaintDuration'),
        input.chiefComplaintDuration ?? null,
        tenant.actorId,
      ],
    );
  }

  async upsertVitals(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    input: {
      bloodPressureSystolic: number | null;
      bloodPressureDiastolic: number | null;
      pulseBpm: number | null;
      temperatureC: number | null;
      spo2Percent: number | null;
      weightKg: number | null;
      heightCm: number | null;
      notes: string | null;
    },
  ): Promise<void> {
    await tx.query(
      `INSERT INTO vitals (
         consultation_id, organization_id, clinic_id,
         blood_pressure_systolic, blood_pressure_diastolic, pulse_bpm,
         temperature_c, spo2_percent, weight_kg, height_cm, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (consultation_id) DO UPDATE SET
         blood_pressure_systolic = EXCLUDED.blood_pressure_systolic,
         blood_pressure_diastolic = EXCLUDED.blood_pressure_diastolic,
         pulse_bpm = EXCLUDED.pulse_bpm,
         temperature_c = EXCLUDED.temperature_c,
         spo2_percent = EXCLUDED.spo2_percent,
         weight_kg = EXCLUDED.weight_kg,
         height_cm = EXCLUDED.height_cm,
         notes = EXCLUDED.notes,
         recorded_at = now()`,
      [
        consultationId,
        tenant.organizationId,
        tenant.clinicId,
        input.bloodPressureSystolic,
        input.bloodPressureDiastolic,
        input.pulseBpm,
        input.temperatureC,
        input.spo2Percent,
        input.weightKg,
        input.heightCm,
        input.notes,
      ],
    );
  }

  async replaceSymptoms(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    symptoms: readonly {
      label: string;
      severity?: string | null;
      duration?: string | null;
      phase?: string | null;
      notes?: string | null;
    }[],
  ): Promise<void> {
    await tx.query(
      `DELETE FROM symptoms
       WHERE consultation_id = $1 AND organization_id = $2 AND clinic_id = $3`,
      [consultationId, tenant.organizationId, tenant.clinicId],
    );
    for (const s of symptoms) {
      await tx.query(
        `INSERT INTO symptoms (
           consultation_id, organization_id, clinic_id, label, severity, duration, phase, notes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          consultationId,
          tenant.organizationId,
          tenant.clinicId,
          s.label,
          s.severity ?? null,
          s.duration ?? null,
          s.phase ?? null,
          s.notes ?? null,
        ],
      );
    }
  }

  async upsertClinicalContext(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    input: {
      historyNotes: string | null;
      additionalContext: string | null;
      lifestyleEvidence: string | null;
    },
  ): Promise<void> {
    await tx.query(
      `INSERT INTO clinical_contexts (
         consultation_id, organization_id, clinic_id,
         history_notes, additional_context, lifestyle_evidence
       ) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (consultation_id) DO UPDATE SET
         history_notes = EXCLUDED.history_notes,
         additional_context = EXCLUDED.additional_context,
         lifestyle_evidence = EXCLUDED.lifestyle_evidence,
         updated_at = now()`,
      [
        consultationId,
        tenant.organizationId,
        tenant.clinicId,
        input.historyNotes,
        input.additionalContext,
        input.lifestyleEvidence,
      ],
    );
  }
}
