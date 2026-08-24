import { STRUCTURAL_QUARANTINE_FLAGS } from './constants.js';
import type { DiseaseIdentityRecord, MappedIdentityIndexRecord } from './types.js';

const CSV_STRUCT_CORRUPT = /^\d+,/;

export function deriveBridgeQuarantineFlags(
  bridgeDisposition: string | null | undefined,
): readonly string[] {
  switch (bridgeDisposition) {
    case 'EXACT_MULTIPLE_MATCH':
      return ['Q_REL_EXACT_MULTIPLE'];
    case 'OWNER_REVIEW_REQUIRED':
      return ['Q_REL_OWNER_REVIEW'];
    case 'NO_MATCH':
      return ['Q_REL_NO_DB_MATCH'];
    default:
      return [];
  }
}

export function deriveDisplayQuarantineFlags(
  nameEnglish: string,
  nameHindi: string,
): readonly string[] {
  const flags: string[] = [];
  const en = nameEnglish.trim();
  const hi = nameHindi.trim();
  if (en.length === 0 && hi.length === 0) {
    flags.push('Q_DISPLAY_EMPTY');
  }
  if (CSV_STRUCT_CORRUPT.test(en)) {
    flags.push('Q_DISPLAY_CSV_STRUCT_CORRUPT');
  }
  return flags;
}

export function deriveDbOnlyFlags(
  isDbOnly: boolean,
  codeWithoutMappedParent: boolean,
): readonly string[] {
  const flags: string[] = [];
  if (isDbOnly) {
    flags.push('Q_REL_DB_UNLINKED');
  }
  if (codeWithoutMappedParent) {
    flags.push('Q_REL_DB_CODE_WITHOUT_MAPPED_PARENT');
  }
  return flags;
}

export function mergeStructuralFlags(...groups: readonly (readonly string[])[]): readonly string[] {
  const merged = new Set<string>();
  for (const group of groups) {
    for (const flag of group) {
      if ((STRUCTURAL_QUARANTINE_FLAGS as readonly string[]).includes(flag)) {
        merged.add(flag);
      }
    }
  }
  return [...merged].sort();
}

export function isFailClosedRecord(
  record: DiseaseIdentityRecord | MappedIdentityIndexRecord,
): boolean {
  const blocking = new Set([
    'Q_IDENTITY_INVALID_NAMESPACE',
    'Q_IDENTITY_INVALID_CODE',
    'Q_IDENTITY_NORMALIZATION_COLLISION',
    'Q_REL_EXACT_MULTIPLE',
    'Q_REL_OWNER_REVIEW',
    'Q_REL_NO_DB_MATCH',
    'Q_MAPPED_UNNORMALIZABLE_RAW',
  ]);
  return record.quarantineFlags.some((flag) => blocking.has(flag));
}

/** Semantic suitability is never auto-assigned in P2B v1. */
export function reviewRequiredUnclassifiedDefault(): boolean {
  return false;
}
