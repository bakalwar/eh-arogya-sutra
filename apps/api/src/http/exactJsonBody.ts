import { ValidationError } from '@ehas2/database';

const SELECTOR_LIKE_KEYS = new Set([
  'suspecteddiagnosis',
  'suspected_diagnosis',
  'medicinecode',
  'medicine_code',
  'medicine',
  'formula',
  'oralformula',
  'potency',
  'dose',
  'dosage',
  'diseaseid',
  'disease_id',
  'disease',
  'ocrtext',
  'extractedtext',
  'analyzecomplete',
  'verified',
  'clinicallyused',
  'clinically_used',
  'polarity',
  'temperament',
  'constitution',
  'severity',
  'prescription',
  'rx',
  'structuredreportfindings',
]);

export function assertExactJsonKeys(
  body: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const allow = new Set(allowed);
  for (const key of Object.keys(body)) {
    const lower = key.toLowerCase();
    if (SELECTOR_LIKE_KEYS.has(lower)) {
      throw new ValidationError('UNKNOWN_FIELD_REJECTED');
    }
    if (!allow.has(key)) {
      throw new ValidationError('UNKNOWN_FIELD_REJECTED');
    }
  }
}

export function assertExactNestedKeys(
  value: unknown,
  allowed: readonly string[],
  field: string,
): void {
  if (value == null) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`Invalid ${field}`);
  }
  assertExactJsonKeys(value as Record<string, unknown>, allowed);
}
