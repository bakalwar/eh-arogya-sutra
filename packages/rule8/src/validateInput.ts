import { types } from 'node:util';
import {
  RULE8_INPUT_KEY_ORDER,
  RULE8_NON_ACTIVATING_EVIDENCE_STATES,
  RULE8_PRAKRITI_EVIDENCE_KEY_ORDER,
  RULE8_SYNTHETIC_TEST_CLASSIFICATION,
} from './constants.js';
import { Rule8EvaluationError } from './errors.js';
import { canonicalCloneJson } from './freeze.js';
import type {
  Rule8EvidenceDataVersions,
  Rule8Input,
  Rule8OptionalRef,
  Rule8PrakritiEvidenceEntry,
  Rule8PrakritiEvidenceRegistry,
  Rule8UpstreamApplicability,
} from './types.js';
import { RULE8_INPUT_CONTRACT_VERSION } from './version.js';

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PHI_KEY_RE = /^(patientName|patient_name|fullName|phone|email|address|ssn|mrn)$/i;
const FORBIDDEN_CLINICAL_KEYS = new Set([
  'medicineId',
  'medicineIds',
  'formulaId',
  'strength',
  'concentration',
  'quantity',
  'frequency',
  'duration',
  'preparationMethod',
  'applicationInstructions',
  'potency',
  'dosage',
  'electricity',
  'tabletA',
  'tabletB',
  'oralMixture',
  'candidateMedicinePool',
  'relationshipEvidenceRegistry',
  'routeEvidenceRegistry',
  'routeIndications',
  'selectedEligibleCandidates',
  'proposedCompositionCandidates',
  'infer_disease_prakruti',
  'resolve_prakriti',
  'legacyInference',
  'legacyDiseaseVotes',
  'treatmentInstructions',
  'mixtureCount',
  'externalApplication',
  'monitoringPlan',
  'prescriptionEffect',
  'finalRx',
  'TH-01',
  'TH-02',
  'TH-03',
  'TH-04',
]);

type FailFn = () => never;

function failInput(): never {
  throw new Rule8EvaluationError('INVALID_INPUT');
}

function failVersion(): never {
  throw new Rule8EvaluationError('UNSUPPORTED_CONTRACT_VERSION');
}

function failRegistry(): never {
  throw new Rule8EvaluationError('INVALID_EVIDENCE_REGISTRY');
}

function failContradictory(): never {
  throw new Rule8EvaluationError('CONTRADICTORY_UPSTREAM_STATE');
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

function assertStringArray(value: unknown, allowEmpty: boolean, fail: FailFn): string[] {
  if (types.isProxy(value)) fail();
  if (!Array.isArray(value)) fail();
  assertDenseArray(value, fail);
  if (!allowEmpty && value.length === 0) fail();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = assertCanonicalId(item, fail);
    if (seen.has(id)) fail();
    seen.add(id);
    out.push(id);
  }
  return out;
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

function parseOptionalRef(value: unknown): Rule8OptionalRef {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'UNAVAILABLE') {
    return { status: 'UNAVAILABLE' };
  }
  if (keys.length !== 3 || !('refId' in value) || !('status' in value) || !('version' in value)) {
    failInput();
  }
  return {
    refId: assertCanonicalId(value.refId),
    status: assertCanonicalId(value.status),
    version: assertCanonicalId(value.version),
  };
}

function parseEvidenceVersions(value: unknown): Rule8EvidenceDataVersions {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const required = [
    'diseaseDataVersion',
    'evidenceDataVersion',
    'prakritiRegistryVersion',
    'contractVersion',
  ] as const;
  readExactKeys(value, required, failInput);
  return {
    diseaseDataVersion: assertCanonicalId(value.diseaseDataVersion),
    evidenceDataVersion: assertCanonicalId(value.evidenceDataVersion),
    prakritiRegistryVersion: assertCanonicalId(value.prakritiRegistryVersion),
    contractVersion: assertCanonicalId(value.contractVersion),
  };
}

function parseUpstreamApplicability(value: unknown): Rule8UpstreamApplicability {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  if (!('status' in value) || !('notes' in value) || Object.keys(value).length !== 2) failInput();
  if (types.isProxy(value.notes) || !Array.isArray(value.notes)) failInput();
  assertDenseArray(value.notes as unknown[], failInput);
  const notes: string[] = [];
  for (const n of value.notes) {
    if (typeof n !== 'string' || n.length === 0 || n.length > 256) failInput();
    notes.push(n);
  }
  return {
    status: assertCanonicalId(value.status),
    notes: Object.freeze(notes),
  };
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

function parsePrakritiEvidenceEntry(
  value: unknown,
  entryIds: Set<string>,
): Rule8PrakritiEvidenceEntry {
  if (types.isProxy(value)) failRegistry();
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value, failRegistry);
  readExactKeys(value, RULE8_PRAKRITI_EVIDENCE_KEY_ORDER, failRegistry);

  const entryId = assertCanonicalId(value.entryId, failRegistry);
  if (entryIds.has(entryId)) failRegistry();
  entryIds.add(entryId);

  const supersession = value.supersessionMetadata;
  if (supersession !== null && typeof supersession !== 'string') failRegistry();
  if (typeof supersession === 'string' && supersession.length > 512) failRegistry();

  return {
    entryId,
    diseaseConditionRef: assertCanonicalId(value.diseaseConditionRef, failRegistry),
    prakritiCategoryRef: assertCanonicalId(value.prakritiCategoryRef, failRegistry),
    applicabilityConditions: Object.freeze(
      parseStringListField(value.applicabilityConditions, failRegistry),
    ),
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
  };
}

function parseRegistry(value: unknown): Rule8PrakritiEvidenceRegistry {
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
  const entries: Rule8PrakritiEvidenceEntry[] = [];
  for (const raw of value.entries) {
    entries.push(parsePrakritiEvidenceEntry(raw, entryIds));
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
export function isActivatingPrakritiEvidence(entry: Rule8PrakritiEvidenceEntry): boolean {
  if (entry.testClassification !== RULE8_SYNTHETIC_TEST_CLASSIFICATION) {
    return false;
  }
  if (
    (RULE8_NON_ACTIVATING_EVIDENCE_STATES as readonly string[]).includes(
      entry.evidenceValidationStatus,
    ) ||
    (RULE8_NON_ACTIVATING_EVIDENCE_STATES as readonly string[]).includes(
      entry.ownerClinicalApprovalStatus,
    ) ||
    (RULE8_NON_ACTIVATING_EVIDENCE_STATES as readonly string[]).includes(entry.effectiveStatus)
  ) {
    return false;
  }
  return (
    entry.evidenceValidationStatus === 'validated' &&
    entry.ownerClinicalApprovalStatus === 'approved' &&
    entry.effectiveStatus === 'approved-and-active'
  );
}

/**
 * Validates and returns an immutable canonical copy of Rule 8 input.
 * Unknown keys, Proxies, accessors, cycles, sparse arrays, and PHI-like keys fail closed.
 */
export function validateRule8Input(raw: unknown): Rule8Input {
  if (types.isProxy(raw)) failInput();
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  assertPlainData(raw, new WeakSet(), failInput);
  readExactKeys(raw, RULE8_INPUT_KEY_ORDER, failInput);

  if (raw.contractVersion !== RULE8_INPUT_CONTRACT_VERSION) failVersion();

  const cloned = canonicalCloneJson(raw) as Record<string, unknown>;
  if (!isPlainObject(cloned)) failInput();

  let registry: Rule8PrakritiEvidenceRegistry;
  try {
    registry = parseRegistry(cloned.prakritiEvidenceRegistry);
  } catch (e) {
    if (e instanceof Rule8EvaluationError) throw e;
    failRegistry();
  }

  const upstream = parseUpstreamApplicability(cloned.upstreamApplicability);
  if (
    upstream.status !== 'APPLICABLE' &&
    upstream.status !== 'NOT_APPLICABLE' &&
    upstream.status !== 'NOT_EVALUABLE'
  ) {
    failContradictory();
  }

  const input: Rule8Input = {
    contractVersion: RULE8_INPUT_CONTRACT_VERSION,
    requestId: assertCanonicalId(cloned.requestId),
    diseaseConditionRefs: Object.freeze(
      assertStringArray(cloned.diseaseConditionRefs, true, failInput),
    ),
    rule1TemperamentRef: parseOptionalRef(cloned.rule1TemperamentRef),
    prakritiEvidenceRegistry: registry,
    evidenceDataVersions: parseEvidenceVersions(cloned.evidenceDataVersions),
    upstreamApplicability: upstream,
  };

  return Object.freeze(input);
}
