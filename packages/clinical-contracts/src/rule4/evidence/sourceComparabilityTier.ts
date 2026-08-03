import type { Rule4EvidenceSourceType } from './types.js';

/** Conservative D08-aligned buckets — supersession only within the same bucket. */
export type Rule4SourceComparabilityTier =
  | 'TIER1_DOCTOR_STRUCTURED'
  | 'TIER2_DIGITAL_STRUCTURED'
  | 'TIER3_OCR_DOCUMENT_IMAGE'
  | 'TIER4A_EXTRACTED_CANDIDATE'
  | 'TIER4B_SUPPORTING_ONLY'
  | 'NOT_COMPARABLE';

/**
 * Supersession comparability: Tier-1 doctor modalities stay on exact canonical source_type
 * so structured clinical entry never silently supersedes photo observation (and vice versa).
 */
export function supersessionComparableSourceClass(sourceType: Rule4EvidenceSourceType): string {
  if (
    sourceType === 'DOCTOR_STRUCTURED_ENTRY' ||
    sourceType === 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION'
  ) {
    return sourceType;
  }
  return sourceComparabilityTier(sourceType);
}

export function sourceComparabilityTier(
  sourceType: Rule4EvidenceSourceType,
): Rule4SourceComparabilityTier {
  switch (sourceType) {
    case 'DOCTOR_STRUCTURED_ENTRY':
    case 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION':
      return 'TIER1_DOCTOR_STRUCTURED';
    case 'DIGITAL_STRUCTURED_REPORT':
      return 'TIER2_DIGITAL_STRUCTURED';
    case 'OCR_EXTRACTED_DOCUMENT_IMAGE':
      return 'TIER3_OCR_DOCUMENT_IMAGE';
    case 'DOCTOR_FREE_TEXT_NLP_EXTRACTION':
      return 'TIER4A_EXTRACTED_CANDIDATE';
    case 'DATASET_TAXONOMY_ALIGNMENT':
      return 'TIER4B_SUPPORTING_ONLY';
    default:
      return 'NOT_COMPARABLE';
  }
}

export function normalizeLateralityForComparability(laterality: string | null | undefined): string {
  if (laterality == null || String(laterality).trim() === '') {
    return '';
  }
  return String(laterality).trim().toUpperCase();
}

export function normalizedFindingSignature(item: {
  value?: string | number | null;
  unit?: string | null;
  assertionStatus: string;
}): string {
  const v = item.value == null ? '' : String(item.value);
  const u = item.unit ?? '';
  return `${v}|${u}|${item.assertionStatus}`;
}
