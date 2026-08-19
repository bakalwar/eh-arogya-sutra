import { TerminologyPackError } from './errors.js';
import { nfc } from './canonical.js';
import {
  AMBIGUITY_CLASSIFICATIONS,
  CONTEXT_REQUIREMENTS,
  EMPTY_PACK_APPROVAL_POSTURE,
  EMPTY_PACK_STATUS,
  ENTRY_DECISION_STATUSES,
  ENTRY_KEYS,
  ENTRY_TYPES,
  LICENSE_CLASSIFICATIONS,
  MAX_ALIAS_CHARS,
  MAX_ENTRIES,
  MAX_ID_CHARS,
  MAX_LABEL_CHARS,
  MAX_NOTE_CHARS,
  MAX_PACK_BYTES,
  MAX_PROVENANCE_REF_CHARS,
  MAX_TOKEN_CHARS,
  NEGATION_INTERACTIONS,
  PACK_LANGUAGES,
  PACK_SCRIPTS,
  PACK_STATUSES,
  PACK_TOP_LEVEL_KEYS,
  PLACEHOLDER_TOKENS,
  PROVENANCE_KEYS,
  SELECTOR_PROHIBITIONS,
  TERMINOLOGY_CANONICALIZATION_VERSION,
  TERMINOLOGY_CHECKSUM_ALGORITHM,
  TERMINOLOGY_PACK_PHI_FORBIDDEN_KEYS,
  TERMINOLOGY_PACK_SELECTOR_FORBIDDEN_KEYS,
  TERMINOLOGY_SCHEMA_VERSION,
  type LicenseClassification,
  type PackStatus,
  type TerminologyPack,
  type TerminologyPackEntry,
} from './types.js';

const TOP = new Set<string>(PACK_TOP_LEVEL_KEYS);
const PROV = new Set<string>(PROVENANCE_KEYS);
const ENTRY = new Set<string>(ENTRY_KEYS);
const SELECTOR_KEYS = new Set<string>(TERMINOLOGY_PACK_SELECTOR_FORBIDDEN_KEYS);
const PHI_KEYS = new Set<string>(TERMINOLOGY_PACK_PHI_FORBIDDEN_KEYS);
const PACK_ID_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;
const PACK_VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9.]+)?$/;
const CREATED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ID_RE = /^[a-z0-9][a-z0-9._-]{0,62}$/;
const CHECKSUM_RE = /^[a-f0-9]{64}$/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URI_RE = /\b(?:https?|postgres(?:ql)?|mongodb(?:\+srv)?|redis):\/\//i;
const PLACEHOLDERS = new Set<string>(PLACEHOLDER_TOKENS);

function hasControlChars(value: string): boolean {
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

function fail(code: ConstructorParameters<typeof TerminologyPackError>[0]): never {
  throw new TerminologyPackError(code);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail('TERMINOLOGY_PACK_INVALID');
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, max: number): string {
  if (typeof value !== 'string') fail('TERMINOLOGY_PACK_INVALID');
  if (value.length < 1 || value.length > max) fail('TERMINOLOGY_PACK_INVALID');
  if (hasControlChars(value)) fail('TERMINOLOGY_PACK_INVALID');
  if (value !== nfc(value)) fail('TERMINOLOGY_PACK_INVALID');
  if (EMAIL_RE.test(value) || URI_RE.test(value)) fail('TERMINOLOGY_PACK_PHI_FORBIDDEN');
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    fail('TERMINOLOGY_PACK_INVALID');
  }
  return value as T;
}

export function assertNoForbiddenKeys(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) assertNoForbiddenKeys(item);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SELECTOR_KEYS.has(key)) fail('TERMINOLOGY_PACK_SELECTOR_FORBIDDEN');
    if (PHI_KEYS.has(key)) fail('TERMINOLOGY_PACK_PHI_FORBIDDEN');
    assertNoForbiddenKeys(child);
  }
}

function assertExactKeys(record: Record<string, unknown>, allowed: Set<string>): void {
  const keys = Object.keys(record);
  if (keys.length !== allowed.size) fail('TERMINOLOGY_PACK_INVALID');
  for (const key of keys) {
    if (!allowed.has(key)) fail('TERMINOLOGY_PACK_INVALID');
  }
}

function parseEntry(raw: unknown): TerminologyPackEntry {
  const rec = asRecord(raw);
  assertExactKeys(rec, ENTRY);
  const entryType = oneOf(rec.entryType, ENTRY_TYPES);
  const negationInteraction = oneOf(rec.negationInteraction, NEGATION_INTERACTIONS);
  if (entryType === 'NEGATION_CUE') {
    if (negationInteraction === 'NOT_APPLICABLE') fail('TERMINOLOGY_PACK_INVALID');
  } else if (negationInteraction !== 'NOT_APPLICABLE') {
    fail('TERMINOLOGY_PACK_INVALID');
  }
  return {
    id: (() => {
      const id = requireString(rec.id, MAX_ID_CHARS);
      if (!ID_RE.test(id)) fail('TERMINOLOGY_PACK_INVALID');
      return id;
    })(),
    entryType,
    aliasText: requireString(rec.aliasText, MAX_ALIAS_CHARS),
    canonicalLabel: requireString(rec.canonicalLabel, MAX_LABEL_CHARS),
    language: oneOf(rec.language, PACK_LANGUAGES),
    script: oneOf(rec.script, PACK_SCRIPTS),
    ambiguityClassification: oneOf(rec.ambiguityClassification, AMBIGUITY_CLASSIFICATIONS),
    provenanceReference: requireString(rec.provenanceReference, MAX_PROVENANCE_REF_CHARS),
    licenseClassification: oneOf(rec.licenseClassification, LICENSE_CLASSIFICATIONS),
    negationInteraction,
    contextRequirements: oneOf(rec.contextRequirements, CONTEXT_REQUIREMENTS),
    decisionStatus: oneOf(rec.decisionStatus, ENTRY_DECISION_STATUSES),
    selectorProhibition: oneOf(rec.selectorProhibition, SELECTOR_PROHIBITIONS),
  };
}

export function parseAndValidatePack(raw: unknown, byteLength: number): TerminologyPack {
  if (byteLength > MAX_PACK_BYTES) fail('TERMINOLOGY_PACK_TOO_LARGE');
  assertNoForbiddenKeys(raw);
  const rec = asRecord(raw);
  assertExactKeys(rec, TOP);

  if (rec.schemaVersion !== TERMINOLOGY_SCHEMA_VERSION) {
    fail('TERMINOLOGY_PACK_UNSUPPORTED_VERSION');
  }
  if (rec.canonicalizationVersion !== TERMINOLOGY_CANONICALIZATION_VERSION) {
    fail('TERMINOLOGY_PACK_UNSUPPORTED_VERSION');
  }
  if (rec.checksumAlgorithm !== TERMINOLOGY_CHECKSUM_ALGORITHM) {
    fail('TERMINOLOGY_PACK_UNSUPPORTED_VERSION');
  }

  const packId = requireString(rec.packId, MAX_ID_CHARS);
  if (!PACK_ID_RE.test(packId)) fail('TERMINOLOGY_PACK_INVALID');
  const packVersion = requireString(rec.packVersion, 40);
  if (!PACK_VERSION_RE.test(packVersion)) fail('TERMINOLOGY_PACK_INVALID');
  const status = oneOf(rec.status, PACK_STATUSES);
  const ownerApprovalToken = requireString(rec.ownerApprovalToken, MAX_TOKEN_CHARS);
  if (PLACEHOLDERS.has(ownerApprovalToken)) fail('TERMINOLOGY_PACK_APPROVAL_INVALID');
  const createdAt = requireString(rec.createdAt, 30);
  if (!CREATED_AT_RE.test(createdAt)) fail('TERMINOLOGY_PACK_INVALID');

  const provenanceRaw = asRecord(rec.provenance);
  assertExactKeys(provenanceRaw, PROV);
  const provenance = {
    source: requireString(provenanceRaw.source, MAX_PROVENANCE_REF_CHARS),
    note: requireString(provenanceRaw.note, MAX_NOTE_CHARS),
  };
  const licenseClassification = oneOf(rec.licenseClassification, LICENSE_CLASSIFICATIONS);
  if (!Array.isArray(rec.entries)) fail('TERMINOLOGY_PACK_INVALID');
  if (rec.entries.length > MAX_ENTRIES) fail('TERMINOLOGY_PACK_TOO_LARGE');
  const entries = rec.entries.map(parseEntry);
  const ids = new Set<string>();
  const activeAliases = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) fail('TERMINOLOGY_PACK_DUPLICATE_ID');
    ids.add(entry.id);
    if (entry.decisionStatus === 'ACTIVE') {
      const aliasKey = nfc(entry.aliasText);
      if (activeAliases.has(aliasKey)) fail('TERMINOLOGY_PACK_DUPLICATE_ALIAS');
      activeAliases.add(aliasKey);
    }
  }

  const contentChecksum = requireString(rec.contentChecksum, 64);
  if (!CHECKSUM_RE.test(contentChecksum)) fail('TERMINOLOGY_PACK_INVALID');

  assertStatusShape(status, entries.length, ownerApprovalToken, licenseClassification);

  return {
    schemaVersion: TERMINOLOGY_SCHEMA_VERSION,
    packId,
    packVersion,
    status,
    ownerApprovalToken,
    createdAt,
    provenance,
    licenseClassification,
    entries,
    canonicalizationVersion: TERMINOLOGY_CANONICALIZATION_VERSION,
    checksumAlgorithm: TERMINOLOGY_CHECKSUM_ALGORITHM,
    contentChecksum,
  };
}

function assertStatusShape(
  status: PackStatus,
  entryCount: number,
  token: string,
  license: LicenseClassification,
): void {
  if (status === EMPTY_PACK_STATUS) {
    if (entryCount !== 0) fail('TERMINOLOGY_PACK_INVALID');
    if (token !== EMPTY_PACK_APPROVAL_POSTURE) fail('TERMINOLOGY_PACK_APPROVAL_INVALID');
    if (license !== 'OWNER_INTERNAL_EMPTY') fail('TERMINOLOGY_PACK_INVALID');
    return;
  }
  if (status === 'SYNTHETIC_TEST_ONLY') {
    if (entryCount < 1) fail('TERMINOLOGY_PACK_INVALID');
    if (license !== 'SYNTHETIC_TEST_ONLY') fail('TERMINOLOGY_PACK_INVALID');
    return;
  }
  if (status === 'OWNER_FROZEN') {
    if (entryCount < 1) fail('TERMINOLOGY_PACK_APPROVAL_INVALID');
    if (token === EMPTY_PACK_APPROVAL_POSTURE) fail('TERMINOLOGY_PACK_APPROVAL_INVALID');
    if (license === 'SYNTHETIC_TEST_ONLY' || license === 'OWNER_INTERNAL_EMPTY') {
      fail('TERMINOLOGY_PACK_INVALID');
    }
  }
}
