import { createHash } from 'node:crypto';
import {
  NORMALIZER_STRUCTURED_VITAL_FIELDS,
  type FactCandidateSourceField,
} from '@ehas2/evidence-extract';
import type { VitalsIntake } from '../repositories/consultationIntake.js';

/** F3D-2D4: exact structured-vital fields with writer + F3D-1 + D2 contract. */
export const STRUCTURED_VITAL_SOURCE_FIELDS = NORMALIZER_STRUCTURED_VITAL_FIELDS;

export type StructuredVitalSourceField = (typeof NORMALIZER_STRUCTURED_VITAL_FIELDS)[number];

export type StructuredVitalColumnKey = keyof Pick<
  VitalsIntake,
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'pulseBpm'
  | 'temperatureC'
  | 'spo2Percent'
  | 'weightKg'
  | 'heightCm'
>;

export type StructuredVitalFieldSpec = {
  readonly sourceField: StructuredVitalSourceField;
  readonly column: StructuredVitalColumnKey;
  /** Schema-owned unit string used on F3D-1 facts; must match frozen pack alias for NORMALIZED. */
  readonly unitText: string;
};

export const STRUCTURED_VITAL_FIELD_SPECS: readonly StructuredVitalFieldSpec[] = [
  { sourceField: 'VITAL_BP_SYSTOLIC', column: 'bloodPressureSystolic', unitText: 'mmHg' },
  { sourceField: 'VITAL_BP_DIASTOLIC', column: 'bloodPressureDiastolic', unitText: 'mmHg' },
  { sourceField: 'VITAL_PULSE', column: 'pulseBpm', unitText: 'bpm' },
  { sourceField: 'VITAL_TEMPERATURE', column: 'temperatureC', unitText: '°C' },
  { sourceField: 'VITAL_SPO2', column: 'spo2Percent', unitText: '%' },
  { sourceField: 'VITAL_WEIGHT', column: 'weightKg', unitText: 'kg' },
  { sourceField: 'VITAL_HEIGHT', column: 'heightCm', unitText: 'cm' },
] as const;

const SPEC_BY_FIELD = new Map(STRUCTURED_VITAL_FIELD_SPECS.map((s) => [s.sourceField, s] as const));

export function isStructuredVitalSourceField(value: string): value is StructuredVitalSourceField {
  return SPEC_BY_FIELD.has(value as StructuredVitalSourceField);
}

export function structuredVitalSpec(sourceField: string): StructuredVitalFieldSpec | null {
  return SPEC_BY_FIELD.get(sourceField as StructuredVitalSourceField) ?? null;
}

export function sortStructuredVitalFields(fields: readonly string[]): StructuredVitalSourceField[] {
  return [...new Set(fields.filter(isStructuredVitalSourceField))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
}

/** Same numeric text shaping used by F3D-1 vital fact materialization (`String(value)`). */
export function exactVitalValueText(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error('INVALID_VITAL_VALUE');
  }
  return String(value);
}

export function vitalValueContentSha256(valueText: string, unitText: string): string {
  return createHash('sha256').update(`v1|${valueText}|${unitText}`, 'utf8').digest('hex');
}

export function readVitalColumnValue(
  vitals: VitalsIntake | null | undefined,
  column: StructuredVitalColumnKey,
): number | null {
  if (!vitals) return null;
  const v = vitals[column];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function vitalFieldsChanged(
  prior: Partial<Pick<VitalsIntake, StructuredVitalColumnKey>> | null | undefined,
  next: Partial<Pick<VitalsIntake, StructuredVitalColumnKey>>,
): StructuredVitalSourceField[] {
  const changed: StructuredVitalSourceField[] = [];
  for (const spec of STRUCTURED_VITAL_FIELD_SPECS) {
    const a = prior ? readVitalColumnValue(prior as VitalsIntake, spec.column) : null;
    const b = readVitalColumnValue(next as VitalsIntake, spec.column);
    if (a !== b) changed.push(spec.sourceField);
  }
  return sortStructuredVitalFields(changed);
}

export function asFactCandidateVitalField(
  sourceField: StructuredVitalSourceField,
): FactCandidateSourceField {
  return sourceField;
}
