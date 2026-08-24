import {
  AUTHORITY_CLASSIFICATION,
  BRIDGE_DISPOSITIONS,
  DATASET_VERSION,
  DISEASE_ID_PREFIX,
  LEDGER_SCHEMA_VERSION,
  LEGACY_AUTHORITY,
  MAPPED_ID_PREFIX,
  MAX_PROVENANCE_VARIANTS,
  RECORD_KIND_LEGACY_DB_ROW,
  STRUCTURAL_QUARANTINE_FLAGS,
} from './constants.js';
import {
  buildDiseaseRecordFingerprintInput,
  buildMappedRecordFingerprintInput,
  computeRecordFingerprint,
} from './fingerprint.js';
import { normalizeMappedIdentity, NormalizationCollisionRegistry } from './normalize.js';
import { isCanonicalNamespace } from './normalize.js';
import {
  DISEASE_RECORD_ALLOWED_KEYS,
  DISEASE_RELATIONSHIP_STATES,
  MAPPED_RECORD_ALLOWED_KEYS,
  MAPPED_RELATIONSHIP_STATES,
  PROVENANCE_ALLOWED_KEYS,
  PROVENANCE_VARIANT_ALLOWED_KEYS,
  RELATIONSHIP_DISPOSITION_QUARANTINE_FLAGS,
} from './schemaAllowlists.js';
import { DiseaseIdentityError, MALFORMED_INPUT } from './errors.js';
import {
  generateDiseaseCanonicalId,
  generateMappedIndexId,
  generateRawMappedReferenceId,
  isValidPrefixedDigestId,
} from './canonicalId.js';
import {
  assertBoundedString,
  assertCandidateLegacyDbIds,
  assertExactAllowlistedKeys,
  assertFingerprintHex,
  assertLinkedDiseaseIds,
  assertMappedIndexRefs,
  assertNoProhibitedFields,
  assertPlainObject,
  assertPositiveSafeInteger,
  assertQuarantineFlags,
  hasQuarantineFlag,
  isValidRawMappedReferenceId,
} from './validationPrimitives.js';

function assertExactString(value: unknown, expected: string, label: string): void {
  if (value !== expected) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must equal ${expected}`);
  }
}

function validateProvenanceObject(value: unknown): Record<string, string> {
  assertPlainObject(value, 'provenance');
  assertExactAllowlistedKeys(value, PROVENANCE_ALLOWED_KEYS, 'provenance');
  assertExactString(
    value.authorityClassification,
    AUTHORITY_CLASSIFICATION,
    'provenance.authorityClassification',
  );
  assertExactString(value.datasetVersion, DATASET_VERSION, 'provenance.datasetVersion');
  return {
    authorityClassification: value.authorityClassification as string,
    datasetVersion: value.datasetVersion as string,
  };
}

function validateProvenanceVariants(
  value: unknown,
  recordLabel: string,
  recordRaw: string,
  mode: 'normalized' | 'raw',
  expectedKey: string | null,
): void {
  if (!Array.isArray(value)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'provenanceVariants must be an array');
  }
  if (value.length > MAX_PROVENANCE_VARIANTS) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      `provenanceVariants exceeds ${MAX_PROVENANCE_VARIANTS}`,
    );
  }
  if (value.length === 0) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'provenanceVariants must not be empty');
  }

  const parsed: Array<{ label: string; raw: string }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < value.length; i += 1) {
    const variant = value[i];
    assertPlainObject(variant, `provenanceVariants[${i}]`);
    assertExactAllowlistedKeys(
      variant,
      PROVENANCE_VARIANT_ALLOWED_KEYS,
      `provenanceVariants[${i}]`,
    );
    assertNoProhibitedFields(variant, `provenanceVariants[${i}]`);
    const label = assertBoundedString(
      variant.mappedSourceLabel,
      `provenanceVariants[${i}].mappedSourceLabel`,
    );
    const raw = assertBoundedString(
      variant.mappedCodeRaw,
      `provenanceVariants[${i}].mappedCodeRaw`,
    );
    const variantKey = `${label}\0${raw}`;
    if (seen.has(variantKey)) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        `Duplicate provenanceVariants entry at index ${i}`,
      );
    }
    seen.add(variantKey);

    if (i > 0) {
      const prev = parsed[i - 1];
      const labelCmp = prev.label.localeCompare(label);
      if (labelCmp > 0 || (labelCmp === 0 && prev.raw.localeCompare(raw) >= 0)) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'provenanceVariants must be deterministically ordered',
        );
      }
    }

    const normalized = normalizeMappedIdentity(label, raw);
    if (mode === 'normalized') {
      if (!normalized.ok) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          `provenanceVariants[${i}] must normalize for canonical mapped record`,
        );
      }
      if (normalized.normalizedIdentityKey !== expectedKey) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          `provenanceVariants[${i}] contradicts normalizedIdentityKey`,
        );
      }
    } else if (normalized.ok) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        `provenanceVariants[${i}] must remain unnormalizable for raw mapped record`,
      );
    }

    parsed.push({ label, raw });
  }

  const includesOwn = parsed.some(
    (entry) => entry.label === recordLabel && entry.raw === recordRaw,
  );
  if (!includesOwn) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'provenanceVariants must include the record mappedSourceLabel/mappedCodeRaw pair',
    );
  }
}

function validateDispositionQuarantineConsistency(
  disposition: string | null,
  flags: readonly string[],
): void {
  const present = RELATIONSHIP_DISPOSITION_QUARANTINE_FLAGS.filter((flag) =>
    hasQuarantineFlag(flags, flag),
  );

  switch (disposition) {
    case 'EXACT_MULTIPLE_MATCH':
      if (present.length !== 1 || present[0] !== 'Q_REL_EXACT_MULTIPLE') {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'EXACT_MULTIPLE_MATCH requires Q_REL_EXACT_MULTIPLE only',
        );
      }
      return;
    case 'OWNER_REVIEW_REQUIRED':
      if (present.length !== 1 || present[0] !== 'Q_REL_OWNER_REVIEW') {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'OWNER_REVIEW_REQUIRED requires Q_REL_OWNER_REVIEW only',
        );
      }
      return;
    case 'NO_MATCH':
      if (present.length !== 1 || present[0] !== 'Q_REL_NO_DB_MATCH') {
        throw new DiseaseIdentityError(MALFORMED_INPUT, 'NO_MATCH requires Q_REL_NO_DB_MATCH only');
      }
      return;
    case 'EXACT_UNIQUE_MATCH':
      if (present.length !== 0) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'EXACT_UNIQUE_MATCH must not carry relationship disposition quarantine flags',
        );
      }
      return;
    default:
      if (present.length > 0) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'Relationship disposition quarantine flags require a mapped bridge disposition',
        );
      }
  }
}

function validateMappedDispositionInvariants(
  disposition: string | null,
  flags: readonly string[],
  relationshipState: string,
  candidateLegacyDbIds: readonly number[],
  linkedEhas2DiseaseIds: readonly string[],
): void {
  validateDispositionQuarantineConsistency(disposition, flags);

  switch (disposition) {
    case 'EXACT_MULTIPLE_MATCH': {
      if (candidateLegacyDbIds.length < 2) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'EXACT_MULTIPLE_MATCH requires at least two candidates',
        );
      }
      if (linkedEhas2DiseaseIds.length !== 0) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'EXACT_MULTIPLE_MATCH must not link disease IDs',
        );
      }
      break;
    }
    case 'OWNER_REVIEW_REQUIRED': {
      if (candidateLegacyDbIds.length < 2) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'OWNER_REVIEW_REQUIRED requires at least two candidates',
        );
      }
      if (linkedEhas2DiseaseIds.length !== 0) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'OWNER_REVIEW_REQUIRED must not link disease IDs',
        );
      }
      break;
    }
    case 'NO_MATCH': {
      if (relationshipState !== 'UNLINKED_MAPPED_CODE') {
        throw new DiseaseIdentityError(MALFORMED_INPUT, 'NO_MATCH requires UNLINKED_MAPPED_CODE');
      }
      if (candidateLegacyDbIds.length !== 0) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'NO_MATCH requires empty candidateLegacyDbIds',
        );
      }
      if (linkedEhas2DiseaseIds.length !== 0) {
        throw new DiseaseIdentityError(MALFORMED_INPUT, 'NO_MATCH must not link disease IDs');
      }
      break;
    }
    case 'EXACT_UNIQUE_MATCH': {
      if (relationshipState !== 'MAPPED_INDEX') {
        throw new DiseaseIdentityError(MALFORMED_INPUT, 'EXACT_UNIQUE_MATCH requires MAPPED_INDEX');
      }
      if (candidateLegacyDbIds.length !== 1) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'EXACT_UNIQUE_MATCH requires exactly one candidateLegacyDbId',
        );
      }
      if (linkedEhas2DiseaseIds.length !== 1) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'EXACT_UNIQUE_MATCH requires exactly one linkedEhas2DiseaseId',
        );
      }
      const expectedLink = generateDiseaseCanonicalId(candidateLegacyDbIds[0]);
      if (linkedEhas2DiseaseIds[0] !== expectedLink) {
        throw new DiseaseIdentityError(
          MALFORMED_INPUT,
          'EXACT_UNIQUE_MATCH linked disease ID must match candidate legacy anchor',
        );
      }
      break;
    }
    default:
      break;
  }
}

function assertStructuralFlagsOnly(flags: readonly string[]): void {
  const allowed = new Set<string>(STRUCTURAL_QUARANTINE_FLAGS);
  for (const flag of flags) {
    if (!allowed.has(flag)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `Unknown quarantine flag ${flag}`);
    }
  }
}

function validateBridgeDisposition(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  const disposition = assertBoundedString(value, 'bridgeDisposition');
  if (!(BRIDGE_DISPOSITIONS as readonly string[]).includes(disposition)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `Invalid bridgeDisposition ${disposition}`);
  }
  return disposition;
}

function validateNormalizedMappedForm(record: Record<string, unknown>): void {
  const mappedId = assertBoundedString(record.ehas2MappedIndexId, 'ehas2MappedIndexId');
  if (!isValidPrefixedDigestId(mappedId, MAPPED_ID_PREFIX)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid ehas2MappedIndexId');
  }
  if (record.rawMappedReferenceId !== null) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'Normalized mapped record must have null rawMappedReferenceId',
    );
  }

  const sourceNamespace = assertBoundedString(record.sourceNamespace, 'sourceNamespace');
  if (!isCanonicalNamespace(sourceNamespace)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid sourceNamespace');
  }
  const sourceCode = assertBoundedString(record.sourceCode, 'sourceCode');
  const normalizedIdentityKey = assertBoundedString(
    record.normalizedIdentityKey,
    'normalizedIdentityKey',
  );
  const expectedKey = `${sourceNamespace}|${sourceCode}`;
  if (normalizedIdentityKey !== expectedKey) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'normalizedIdentityKey mismatch');
  }

  const mappedSourceLabel = assertBoundedString(record.mappedSourceLabel, 'mappedSourceLabel');
  const mappedCodeRaw = assertBoundedString(record.mappedCodeRaw, 'mappedCodeRaw');
  const normalized = normalizeMappedIdentity(mappedSourceLabel, mappedCodeRaw);
  if (!normalized.ok) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Mapped record raw fields must normalize');
  }
  if (
    normalized.sourceNamespace !== sourceNamespace ||
    normalized.sourceCode !== sourceCode ||
    normalized.normalizedIdentityKey !== normalizedIdentityKey
  ) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Mapped record normalization mismatch');
  }

  const recomputed = generateMappedIndexId(normalized.sourceNamespace, normalized.sourceCode);
  if (mappedId !== recomputed) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'ehas2MappedIndexId does not match recomputed mapped ID',
    );
  }

  validateProvenanceVariants(
    record.provenanceVariants,
    mappedSourceLabel,
    mappedCodeRaw,
    'normalized',
    normalizedIdentityKey,
  );
}

function validateRawMappedForm(record: Record<string, unknown>, flags: readonly string[]): void {
  if (record.ehas2MappedIndexId !== null) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'Raw mapped record must have null ehas2MappedIndexId',
    );
  }
  const rawRef = assertBoundedString(record.rawMappedReferenceId, 'rawMappedReferenceId');
  if (!isValidRawMappedReferenceId(rawRef)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid rawMappedReferenceId digest');
  }
  if (
    record.sourceNamespace !== null ||
    record.sourceCode !== null ||
    record.normalizedIdentityKey !== null
  ) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'Raw mapped record must have null normalized fields',
    );
  }

  const blocking =
    hasQuarantineFlag(flags, 'Q_MAPPED_UNNORMALIZABLE_RAW') ||
    hasQuarantineFlag(flags, 'Q_IDENTITY_INVALID_NAMESPACE') ||
    hasQuarantineFlag(flags, 'Q_IDENTITY_INVALID_CODE');
  if (!blocking) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'Raw mapped record requires blocking unnormalizable/invalid quarantine flag',
    );
  }

  const mappedSourceLabel = assertBoundedString(record.mappedSourceLabel, 'mappedSourceLabel');
  const mappedCodeRaw = assertBoundedString(record.mappedCodeRaw, 'mappedCodeRaw');
  const recomputed = generateRawMappedReferenceId(mappedCodeRaw, mappedSourceLabel);
  if (rawRef !== recomputed) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'rawMappedReferenceId does not match recomputed raw reference',
    );
  }

  validateProvenanceVariants(
    record.provenanceVariants,
    mappedSourceLabel,
    mappedCodeRaw,
    'raw',
    null,
  );
}

export function validateDiseaseIdentityRecord(record: Record<string, unknown>): void {
  assertPlainObject(record, 'disease record');
  assertNoProhibitedFields(record);
  assertExactAllowlistedKeys(record, DISEASE_RECORD_ALLOWED_KEYS, 'disease record');

  const ehas2DiseaseId = assertBoundedString(record.ehas2DiseaseId, 'ehas2DiseaseId');
  if (!isValidPrefixedDigestId(ehas2DiseaseId, DISEASE_ID_PREFIX)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid ehas2DiseaseId format');
  }

  assertExactString(record.ledgerSchemaVersion, LEDGER_SCHEMA_VERSION, 'ledgerSchemaVersion');
  assertExactString(record.recordKind, RECORD_KIND_LEGACY_DB_ROW, 'recordKind');
  assertExactString(record.legacyAuthority, LEGACY_AUTHORITY, 'legacyAuthority');

  const legacyDbDiseaseId = assertPositiveSafeInteger(
    record.legacyDbDiseaseId,
    'legacyDbDiseaseId',
  );
  const recomputedDiseaseId = generateDiseaseCanonicalId(legacyDbDiseaseId);
  if (ehas2DiseaseId !== recomputedDiseaseId) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'ehas2DiseaseId does not match recomputed canonical ID',
    );
  }

  if (record.sourceNamespace !== null && !isCanonicalNamespace(String(record.sourceNamespace))) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid sourceNamespace');
  }
  if (record.sourceNamespace === null) {
    if (record.sourceCode !== null || record.normalizedIdentityKey !== null) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        'Null sourceNamespace requires null code/key',
      );
    }
  } else {
    assertBoundedString(record.sourceCode, 'sourceCode');
    const key = assertBoundedString(record.normalizedIdentityKey, 'normalizedIdentityKey');
    const expectedKey = `${record.sourceNamespace}|${record.sourceCode}`;
    if (key !== expectedKey) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, 'normalizedIdentityKey mismatch');
    }
  }

  const relationshipState = assertBoundedString(record.relationshipState, 'relationshipState');
  if (!(DISEASE_RELATIONSHIP_STATES as readonly string[]).includes(relationshipState)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid relationshipState');
  }

  validateBridgeDisposition(record.bridgeDisposition);
  assertMappedIndexRefs(record.mappedIndexRefs);
  assertCandidateLegacyDbIds(record.candidateLegacyDbIds, 'candidateLegacyDbIds');

  const flags = assertQuarantineFlags(record.quarantineFlags);
  assertStructuralFlagsOnly(flags);

  if (typeof record.reviewRequiredUnclassified !== 'boolean') {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'reviewRequiredUnclassified must be boolean');
  }

  validateProvenanceObject(record.provenance);
  assertBoundedString(record.lifecycleStatus, 'lifecycleStatus');

  const fingerprint = assertFingerprintHex(record.recordFingerprint);
  const recomputedFingerprint = computeRecordFingerprint(
    buildDiseaseRecordFingerprintInput(record),
  );
  if (fingerprint !== recomputedFingerprint) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'recordFingerprint mismatch');
  }
}

export function validateMappedIdentityRecord(record: Record<string, unknown>): void {
  assertPlainObject(record, 'mapped record');
  assertNoProhibitedFields(record);
  assertExactAllowlistedKeys(record, MAPPED_RECORD_ALLOWED_KEYS, 'mapped record');

  const mappedIdPresent = record.ehas2MappedIndexId !== null;
  const rawRefPresent = record.rawMappedReferenceId !== null;
  if (mappedIdPresent === rawRefPresent) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'Mapped record must have exactly one of ehas2MappedIndexId or rawMappedReferenceId',
    );
  }

  assertBoundedString(record.mappedCodeRaw, 'mappedCodeRaw');
  assertBoundedString(record.mappedSourceLabel, 'mappedSourceLabel');

  const flags = assertQuarantineFlags(record.quarantineFlags);
  assertStructuralFlagsOnly(flags);

  if (typeof record.reviewRequiredUnclassified !== 'boolean') {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'reviewRequiredUnclassified must be boolean');
  }

  validateProvenanceObject(record.provenance);

  if (mappedIdPresent) {
    validateNormalizedMappedForm(record);
  } else {
    validateRawMappedForm(record, flags);
  }

  const bridgeDisposition = validateBridgeDisposition(record.bridgeDisposition);
  const relationshipState = assertBoundedString(record.relationshipState, 'relationshipState');
  if (!(MAPPED_RELATIONSHIP_STATES as readonly string[]).includes(relationshipState)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid relationshipState');
  }

  const candidateLegacyDbIds = assertCandidateLegacyDbIds(
    record.candidateLegacyDbIds,
    'candidateLegacyDbIds',
  );
  const linkedEhas2DiseaseIds = assertLinkedDiseaseIds(record.linkedEhas2DiseaseIds);

  validateMappedDispositionInvariants(
    bridgeDisposition,
    flags,
    relationshipState,
    candidateLegacyDbIds,
    linkedEhas2DiseaseIds,
  );

  const fingerprint = assertFingerprintHex(record.recordFingerprint);
  const recomputedFingerprint = computeRecordFingerprint(buildMappedRecordFingerprintInput(record));
  if (fingerprint !== recomputedFingerprint) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'recordFingerprint mismatch');
  }
}

export function registerMappedRecordNormalization(
  record: Record<string, unknown>,
  registry: NormalizationCollisionRegistry,
): void {
  if (record.ehas2MappedIndexId === null) {
    return;
  }
  const label = assertBoundedString(record.mappedSourceLabel, 'mappedSourceLabel');
  const variants = record.provenanceVariants;
  if (!Array.isArray(variants)) {
    return;
  }
  for (const variant of variants) {
    if (variant && typeof variant === 'object' && !Array.isArray(variant)) {
      const v = variant as Record<string, unknown>;
      registry.register(String(v.mappedSourceLabel), String(v.mappedCodeRaw));
    }
  }
  registry.register(label, String(record.mappedCodeRaw));
}

export { assertNoProhibitedFields } from './validationPrimitives.js';
