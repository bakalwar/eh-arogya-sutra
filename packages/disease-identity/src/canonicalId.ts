import {
  DISEASE_ID_ALGORITHM,
  DISEASE_ID_HEX_LENGTH,
  DISEASE_ID_PREFIX,
  LEGACY_AUTHORITY,
  MAPPED_ID_ALGORITHM,
  MAPPED_ID_PREFIX,
  RAW_MAPPED_REF_ALGORITHM,
  RAW_MAPPED_REF_PREFIX,
  RECORD_KIND_LEGACY_DB_ROW,
  RECORD_KIND_MAPPED_CODE_INDEX,
  RELATIONSHIP_ID_ALGORITHM,
  RELATIONSHIP_ID_PREFIX,
} from './constants.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import { DiseaseIdentityError, IDENTITY_ID_COLLISION } from './errors.js';
import type {
  DiseaseCanonicalIdentityInput,
  MappedCanonicalIdentityInput,
  RawMappedReferenceInput,
  RelationshipCanonicalIdentityInput,
} from './types.js';

export class IdentityDigestRegistry {
  private readonly digestToInput = new Map<string, string>();

  register(digest: string, canonicalInput: string): void {
    const existing = this.digestToInput.get(digest);
    if (existing !== undefined && existing !== canonicalInput) {
      throw new DiseaseIdentityError(IDENTITY_ID_COLLISION, `Digest collision for ${digest}`);
    }
    this.digestToInput.set(digest, canonicalInput);
  }
}

function digestToPrefixedId(
  prefix: string,
  canonicalInput: string,
  registry?: IdentityDigestRegistry,
): string {
  const digest = sha256HexLower(canonicalInput);
  registry?.register(digest, canonicalInput);
  return `${prefix}${digest}`;
}

export function buildDiseaseCanonicalIdentityInput(
  legacyDbDiseaseId: number,
): DiseaseCanonicalIdentityInput {
  if (!Number.isInteger(legacyDbDiseaseId) || legacyDbDiseaseId <= 0) {
    throw new DiseaseIdentityError(
      'INVALID_LEGACY_ID',
      'legacyDbDiseaseId must be a positive integer',
    );
  }
  return {
    algorithm: DISEASE_ID_ALGORITHM,
    legacyAuthority: LEGACY_AUTHORITY,
    legacyDbDiseaseId,
    recordKind: RECORD_KIND_LEGACY_DB_ROW,
  };
}

export function generateDiseaseCanonicalId(
  legacyDbDiseaseId: number,
  registry?: IdentityDigestRegistry,
): string {
  const input = buildDiseaseCanonicalIdentityInput(legacyDbDiseaseId);
  const canonicalInput = canonicalJsonString(input);
  return digestToPrefixedId(DISEASE_ID_PREFIX, canonicalInput, registry);
}

export function buildMappedCanonicalIdentityInput(
  sourceNamespace: MappedCanonicalIdentityInput['sourceNamespace'],
  sourceCode: string,
): MappedCanonicalIdentityInput {
  return {
    algorithm: MAPPED_ID_ALGORITHM,
    recordKind: RECORD_KIND_MAPPED_CODE_INDEX,
    sourceNamespace,
    sourceCode,
  };
}

export function generateMappedIndexId(
  sourceNamespace: MappedCanonicalIdentityInput['sourceNamespace'],
  sourceCode: string,
  registry?: IdentityDigestRegistry,
): string {
  const input = buildMappedCanonicalIdentityInput(sourceNamespace, sourceCode);
  const canonicalInput = canonicalJsonString(input);
  return digestToPrefixedId(MAPPED_ID_PREFIX, canonicalInput, registry);
}

export function generateRelationshipId(
  ehas2MappedIndexId: string,
  ehas2DiseaseId: string,
  relationshipType: string,
  registry?: IdentityDigestRegistry,
): string {
  const input: RelationshipCanonicalIdentityInput = {
    algorithm: RELATIONSHIP_ID_ALGORITHM,
    ehas2MappedIndexId,
    ehas2DiseaseId,
    relationshipType,
  };
  const canonicalInput = canonicalJsonString(input);
  return digestToPrefixedId(RELATIONSHIP_ID_PREFIX, canonicalInput, registry);
}

export function generateRawMappedReferenceId(
  mappedCodeRaw: string,
  mappedSourceLabel: string,
  registry?: IdentityDigestRegistry,
): string {
  const input: RawMappedReferenceInput = {
    algorithm: RAW_MAPPED_REF_ALGORITHM,
    recordKind: 'UNNORMALIZABLE_MAPPED_RAW',
    mappedCodeRaw,
    mappedSourceLabel,
  };
  const canonicalInput = canonicalJsonString(input);
  return digestToPrefixedId(RAW_MAPPED_REF_PREFIX, canonicalInput, registry);
}

export function isValidPrefixedDigestId(value: string, prefix: string): boolean {
  if (!value.startsWith(prefix)) {
    return false;
  }
  const hex = value.slice(prefix.length);
  return hex.length === DISEASE_ID_HEX_LENGTH && /^[0-9a-f]{64}$/.test(hex);
}

export function assertValidDiseaseId(value: string): void {
  if (!isValidPrefixedDigestId(value, DISEASE_ID_PREFIX)) {
    throw new DiseaseIdentityError('INVALID_DISEASE_ID', `Invalid disease id: ${value}`);
  }
}

export function assertValidMappedIndexId(value: string): void {
  if (!isValidPrefixedDigestId(value, MAPPED_ID_PREFIX)) {
    throw new DiseaseIdentityError('INVALID_MAPPED_ID', `Invalid mapped index id: ${value}`);
  }
}
