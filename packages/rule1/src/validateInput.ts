import { types } from 'node:util';
import {
  RULE1_BLOCKING_LIFECYCLE,
  RULE1_DOCTOR_ITEM_KEY_ORDER,
  RULE1_EVIDENCE_ENTRY_KEY_ORDER,
  RULE1_EVIDENCE_KINDS,
  RULE1_INPUT_KEY_ORDER,
  RULE1_SYNTHETIC_TEST_CLASSIFICATION,
  RULE1_TEMPERAMENT_TOKENS,
  type Rule1EvidenceKind,
  type Rule1TemperamentToken,
} from './constants.js';
import { Rule1EvaluationError } from './errors.js';
import { canonicalCloneJson } from './freeze.js';
import type {
  Rule1BloodLymphAxisContext,
  Rule1BloodPressureEvidence,
  Rule1CaseTemperamentEvidenceRegistry,
  Rule1DoctorSuppliedEvidenceItem,
  Rule1EvidenceDataVersions,
  Rule1Input,
  Rule1PhotoEvidenceRef,
  Rule1StatusRef,
  Rule1TemperamentEvidenceEntry,
  Rule1UpstreamApplicability,
} from './types.js';
import { RULE1_INPUT_CONTRACT_VERSION } from './version.js';

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PHI_KEY_RE = /^(patientName|patient_name|fullName|phone|email|address|ssn|mrn)$/i;
const PATH_LIKE_RE = /[\\/]|^[A-Za-z]:|^\\\\/;
const FORBIDDEN_CLINICAL_KEYS = new Set([
  'medicineId',
  'medicineIds',
  'formulaId',
  'potency',
  'dosage',
  'electricity',
  'tabletA',
  'tabletB',
  'oralMixture',
  'candidateMedicinePool',
  'relationshipEvidenceRegistry',
  'routeEvidenceRegistry',
  'treatmentInstructions',
  'mixtureCount',
  'externalApplication',
  'monitoringPlan',
  'prescriptionEffect',
  'finalRx',
  'imageBytes',
  'rawImage',
  'filePath',
  'localPath',
  'protectedPath',
  'PRAKRITI_KEYWORDS',
  'detect_prakriti',
  'legacyInference',
]);

type FailFn = () => never;

function failInput(): never {
  throw new Rule1EvaluationError('INVALID_INPUT');
}

function failVersion(): never {
  throw new Rule1EvaluationError('UNSUPPORTED_CONTRACT_VERSION');
}

function failRegistry(): never {
  throw new Rule1EvaluationError('INVALID_EVIDENCE_REGISTRY');
}

function failContradictory(): never {
  throw new Rule1EvaluationError('CONTRADICTORY_INPUT_STATE');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (types.isProxy(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function assertNoAccessors(value: object, fail: FailFn): void {
  for (const key of Reflect.ownKeys(value)) {
    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (!desc) fail();
    if (typeof desc.get === 'function' || typeof desc.set === 'function') fail();
    if (typeof key === 'symbol') fail();
  }
}

function assertDenseArray(value: unknown[], fail: FailFn): void {
  for (let i = 0; i < value.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, i)) fail();
  }
}

function assertPlainData(value: unknown, seen: WeakSet<object>, fail: FailFn): void {
  if (value === null) return;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    if (t === 'number' && !Number.isFinite(value as number)) fail();
    return;
  }
  if (t === 'function' || t === 'symbol' || t === 'bigint' || t === 'undefined') fail();
  if (typeof value !== 'object') fail();
  if (types.isProxy(value)) fail();
  if (seen.has(value as object)) fail();
  seen.add(value as object);
  if (Array.isArray(value)) {
    assertDenseArray(value, fail);
    for (const item of value) assertPlainData(item, seen, fail);
    return;
  }
  if (!isPlainObject(value)) fail();
  assertNoAccessors(value, fail);
  for (const key of Object.keys(value)) {
    if (PHI_KEY_RE.test(key) || FORBIDDEN_CLINICAL_KEYS.has(key)) fail();
    assertPlainData(value[key], seen, fail);
  }
}

function assertCanonicalId(value: unknown, fail: FailFn = failInput): string {
  if (typeof value !== 'string' || !ID_RE.test(value)) fail();
  return value;
}

function readExactKeys(
  obj: Record<string, unknown>,
  ordered: readonly string[],
  fail: FailFn,
): void {
  const keys = Object.keys(obj);
  if (keys.length !== ordered.length) fail();
  const set = new Set(keys);
  for (const k of ordered) {
    if (!set.has(k)) fail();
  }
  for (const k of keys) {
    if (!ordered.includes(k)) fail();
  }
}

function parseStringListField(value: unknown, fail: FailFn): string[] {
  if (types.isProxy(value)) fail();
  if (!Array.isArray(value)) fail();
  assertDenseArray(value, fail);
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0 || item.length > 256) fail();
    out.push(item);
  }
  return out;
}

function parseTemperamentToken(value: unknown, fail: FailFn): Rule1TemperamentToken {
  if (typeof value !== 'string') fail();
  if (!(RULE1_TEMPERAMENT_TOKENS as readonly string[]).includes(value)) fail();
  return value as Rule1TemperamentToken;
}

function parseEvidenceKind(value: unknown, fail: FailFn): Rule1EvidenceKind {
  if (typeof value !== 'string') fail();
  if (!(RULE1_EVIDENCE_KINDS as readonly string[]).includes(value)) fail();
  return value as Rule1EvidenceKind;
}

function parseBp(value: unknown): Rule1BloodPressureEvidence {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length !== 3 || value.status !== 'SUPPLIED') failInput();
  if (value.unit !== 'mmHg') failInput();
  if (typeof value.systolicMmHg !== 'number' || !Number.isFinite(value.systolicMmHg)) failInput();
  if (value.systolicMmHg < 0 || value.systolicMmHg > 400) failInput();
  return {
    status: 'SUPPLIED',
    systolicMmHg: value.systolicMmHg,
    unit: 'mmHg',
  };
}

function parsePhoto(value: unknown): Rule1PhotoEvidenceRef {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length !== 2 || value.status !== 'SUPPLIED') failInput();
  const mediaRefId = assertCanonicalId(value.mediaRefId);
  if (PATH_LIKE_RE.test(mediaRefId)) failInput();
  return { status: 'SUPPLIED', mediaRefId };
}

function parseBloodLymph(value: unknown): Rule1BloodLymphAxisContext {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length !== 2 || value.status !== 'SUPPLIED') failInput();
  return {
    status: 'SUPPLIED',
    axisRefs: Object.freeze(parseStringListField(value.axisRefs, failInput)),
  };
}

function parseRule8Ref(value: unknown): Rule1StatusRef {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length === 1 && value.status === 'UNAVAILABLE') {
    return { status: 'UNAVAILABLE' };
  }
  if (keys.length !== 3 || !('refId' in value) || !('status' in value) || !('version' in value)) {
    failInput();
  }
  const status = assertCanonicalId(value.status);
  if (status !== 'CONSISTENT' && status !== 'CONFLICT' && status !== 'UNRESOLVED') failInput();
  return {
    status,
    refId: assertCanonicalId(value.refId),
    version: assertCanonicalId(value.version),
  };
}

function parseEvidenceVersions(value: unknown): Rule1EvidenceDataVersions {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const required = [
    'evidenceDataVersion',
    'temperamentRegistryVersion',
    'contractVersion',
    'governanceVersion',
  ] as const;
  readExactKeys(value, required, failInput);
  return {
    evidenceDataVersion: assertCanonicalId(value.evidenceDataVersion),
    temperamentRegistryVersion: assertCanonicalId(value.temperamentRegistryVersion),
    contractVersion: assertCanonicalId(value.contractVersion),
    governanceVersion: assertCanonicalId(value.governanceVersion),
  };
}

function parseUpstream(value: unknown): Rule1UpstreamApplicability {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  if (!('status' in value) || !('notes' in value) || Object.keys(value).length !== 2) failInput();
  return {
    status: assertCanonicalId(value.status),
    notes: Object.freeze(parseStringListField(value.notes, failInput)),
  };
}

function parseDoctorItems(value: unknown): readonly Rule1DoctorSuppliedEvidenceItem[] {
  if (types.isProxy(value)) failInput();
  if (!Array.isArray(value)) failInput();
  assertDenseArray(value, failInput);
  const ids = new Set<string>();
  const items: Rule1DoctorSuppliedEvidenceItem[] = [];
  for (const raw of value) {
    if (types.isProxy(raw)) failInput();
    if (!isPlainObject(raw)) failInput();
    assertNoAccessors(raw, failInput);
    readExactKeys(raw, RULE1_DOCTOR_ITEM_KEY_ORDER, failInput);
    const itemId = assertCanonicalId(raw.itemId);
    if (ids.has(itemId)) failInput();
    ids.add(itemId);
    items.push({
      itemId,
      evidenceClass: assertCanonicalId(raw.evidenceClass),
    });
  }
  return Object.freeze(items);
}

function parseEvidenceEntry(value: unknown, entryIds: Set<string>): Rule1TemperamentEvidenceEntry {
  if (types.isProxy(value)) failRegistry();
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value, failRegistry);
  readExactKeys(value, RULE1_EVIDENCE_ENTRY_KEY_ORDER, failRegistry);

  const entryId = assertCanonicalId(value.entryId, failRegistry);
  if (entryIds.has(entryId)) failRegistry();
  entryIds.add(entryId);

  if (typeof value.supportUnits !== 'number' || !Number.isFinite(value.supportUnits)) {
    failRegistry();
  }
  if (value.supportUnits <= 0 || value.supportUnits > 1000) failRegistry();
  if (typeof value.biliousSecondaryRequired !== 'boolean') failRegistry();

  const supersession = value.supersessionMetadata;
  if (supersession !== null && typeof supersession !== 'string') failRegistry();
  if (typeof supersession === 'string' && supersession.length > 512) failRegistry();

  return {
    entryId,
    temperamentToken: parseTemperamentToken(value.temperamentToken, failRegistry),
    evidenceKind: parseEvidenceKind(value.evidenceKind, failRegistry),
    supportUnits: value.supportUnits,
    contradictionMarkers: Object.freeze(
      parseStringListField(value.contradictionMarkers, failRegistry),
    ),
    evidenceSourceId: assertCanonicalId(value.evidenceSourceId, failRegistry),
    evidenceValidationStatus: assertCanonicalId(value.evidenceValidationStatus, failRegistry),
    ownerClinicalApprovalStatus: assertCanonicalId(value.ownerClinicalApprovalStatus, failRegistry),
    version: assertCanonicalId(value.version, failRegistry),
    effectiveStatus: assertCanonicalId(value.effectiveStatus, failRegistry),
    supersessionMetadata: supersession as string | null,
    testClassification: assertCanonicalId(value.testClassification, failRegistry),
    biliousSecondaryRequired: value.biliousSecondaryRequired,
  };
}

function parseRegistry(value: unknown): Rule1CaseTemperamentEvidenceRegistry {
  if (types.isProxy(value)) failRegistry();
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value, failRegistry);
  if (!('registryVersion' in value) || !('entries' in value) || Object.keys(value).length !== 2) {
    failRegistry();
  }
  const registryVersion = assertCanonicalId(value.registryVersion, failRegistry);
  if (types.isProxy(value.entries) || !Array.isArray(value.entries)) failRegistry();
  assertDenseArray(value.entries as unknown[], failRegistry);
  const entryIds = new Set<string>();
  const entries: Rule1TemperamentEvidenceEntry[] = [];
  for (const raw of value.entries) {
    entries.push(parseEvidenceEntry(raw, entryIds));
  }
  return {
    registryVersion,
    entries: Object.freeze(entries),
  };
}

/**
 * Conjunctive activating gate for synthetic shadow indication only.
 * Real production mappings remain empty; non-synthetic classification never activates.
 */
export function isActivatingTemperamentEvidence(entry: Rule1TemperamentEvidenceEntry): boolean {
  if (entry.testClassification !== RULE1_SYNTHETIC_TEST_CLASSIFICATION) {
    return false;
  }
  if ((RULE1_BLOCKING_LIFECYCLE as readonly string[]).includes(entry.effectiveStatus)) {
    return false;
  }
  return (
    entry.evidenceValidationStatus === 'validated' &&
    entry.ownerClinicalApprovalStatus === 'approved' &&
    entry.effectiveStatus === 'APPROVED_AND_ACTIVE'
  );
}

export function validateRule1Input(raw: unknown): Rule1Input {
  if (types.isProxy(raw)) failInput();
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  assertPlainData(raw, new WeakSet(), failInput);
  readExactKeys(raw, RULE1_INPUT_KEY_ORDER, failInput);

  if (raw.contractVersion !== RULE1_INPUT_CONTRACT_VERSION) failVersion();

  const cloned = canonicalCloneJson(raw) as Record<string, unknown>;
  if (!isPlainObject(cloned)) failInput();

  let registry: Rule1CaseTemperamentEvidenceRegistry;
  try {
    registry = parseRegistry(cloned.caseTemperamentEvidenceRegistry);
  } catch (e) {
    if (e instanceof Rule1EvaluationError) throw e;
    failRegistry();
  }

  const upstream = parseUpstream(cloned.upstreamApplicability);
  if (
    upstream.status !== 'APPLICABLE' &&
    upstream.status !== 'NOT_APPLICABLE' &&
    upstream.status !== 'NOT_EVALUABLE'
  ) {
    failContradictory();
  }

  return {
    contractVersion: RULE1_INPUT_CONTRACT_VERSION,
    requestId: assertCanonicalId(cloned.requestId),
    caseTemperamentEvidenceRegistry: registry,
    doctorSuppliedEvidenceItems: parseDoctorItems(cloned.doctorSuppliedEvidenceItems),
    bloodPressureEvidence: parseBp(cloned.bloodPressureEvidence),
    photoEvidenceRef: parsePhoto(cloned.photoEvidenceRef),
    bloodLymphAxisContext: parseBloodLymph(cloned.bloodLymphAxisContext),
    rule8ComparisonRef: parseRule8Ref(cloned.rule8ComparisonRef),
    evidenceDataVersions: parseEvidenceVersions(cloned.evidenceDataVersions),
    upstreamApplicability: upstream,
  };
}
