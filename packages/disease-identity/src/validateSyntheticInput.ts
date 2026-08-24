import { MAX_PROVENANCE_VARIANTS } from './constants.js';
import { DiseaseIdentityError, MALFORMED_INPUT } from './errors.js';
import { SYNTHETIC_DISEASE_INPUT_KEYS, SYNTHETIC_MAPPED_INPUT_KEYS } from './schemaAllowlists.js';
import {
  assertBoundedString,
  assertCandidateLegacyDbIds,
  assertExactAllowlistedKeys,
  assertLinkedDiseaseIds,
  assertMappedIndexRefs,
  assertNoProhibitedFields,
  assertPlainObject,
  assertPositiveSafeInteger,
} from './validationPrimitives.js';

function validateOptionalBoolean(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a boolean when provided`);
  }
}

function validateOptionalString(value: unknown, label: string): void {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a string when provided`);
  }
  if (typeof value === 'string') {
    assertBoundedString(value, label);
  }
}

function validateProvenanceVariantInputs(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'provenanceVariants must be an array');
  }
  if (value.length > MAX_PROVENANCE_VARIANTS) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      `provenanceVariants exceeds ${MAX_PROVENANCE_VARIANTS}`,
    );
  }
  for (let i = 0; i < value.length; i += 1) {
    const variant = value[i];
    assertPlainObject(variant, `provenanceVariants[${i}]`);
    assertBoundedString(variant.mappedSourceLabel, `provenanceVariants[${i}].mappedSourceLabel`);
    assertBoundedString(variant.mappedCodeRaw, `provenanceVariants[${i}].mappedCodeRaw`);
    assertNoProhibitedFields(variant, `provenanceVariants[${i}]`);
  }
}

export function validateSyntheticGeneratorInput(raw: unknown): void {
  assertPlainObject(raw, 'synthetic input');
  assertNoProhibitedFields(raw);

  const recordKind = raw.recordKind;
  if (recordKind === 'LEGACY_DB_ROW') {
    assertExactAllowlistedKeys(raw, SYNTHETIC_DISEASE_INPUT_KEYS, 'synthetic disease input');
    assertPositiveSafeInteger(raw.legacyDbDiseaseId, 'legacyDbDiseaseId');
    assertBoundedString(raw.sourceLabel, 'sourceLabel');
    assertBoundedString(raw.sourceCodeRaw, 'sourceCodeRaw');
    validateOptionalString(raw.nameEnglish, 'nameEnglish');
    validateOptionalString(raw.nameHindi, 'nameHindi');
    validateOptionalString(raw.bridgeDisposition, 'bridgeDisposition');
    validateOptionalBoolean(raw.isDbOnly, 'isDbOnly');
    validateOptionalBoolean(raw.codeWithoutMappedParent, 'codeWithoutMappedParent');
    if (raw.candidateLegacyDbIds !== undefined) {
      assertCandidateLegacyDbIds(raw.candidateLegacyDbIds, 'candidateLegacyDbIds');
    }
    if (raw.mappedIndexRefs !== undefined) {
      assertMappedIndexRefs(raw.mappedIndexRefs);
    }
    return;
  }

  if (recordKind === 'MAPPED_CODE_INDEX_INPUT') {
    assertExactAllowlistedKeys(raw, SYNTHETIC_MAPPED_INPUT_KEYS, 'synthetic mapped input');
    assertBoundedString(raw.mappedSourceLabel, 'mappedSourceLabel');
    assertBoundedString(raw.mappedCodeRaw, 'mappedCodeRaw');
    validateOptionalString(raw.bridgeDisposition, 'bridgeDisposition');
    if (raw.candidateLegacyDbIds !== undefined) {
      assertCandidateLegacyDbIds(raw.candidateLegacyDbIds, 'candidateLegacyDbIds');
    }
    if (raw.linkedEhas2DiseaseIds !== undefined) {
      assertLinkedDiseaseIds(raw.linkedEhas2DiseaseIds);
    }
    validateProvenanceVariantInputs(raw.provenanceVariants);
    return;
  }

  throw new DiseaseIdentityError(MALFORMED_INPUT, 'Unsupported synthetic input recordKind');
}
