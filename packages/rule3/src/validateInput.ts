import { types } from 'node:util';
import {
  RULE3_BINDING_REF_KEY_ORDER,
  RULE3_BLOCKING_LIFECYCLE,
  RULE3_DETECTION_METHOD_CLASSES,
  RULE3_DOCTOR_ITEM_KEY_ORDER,
  RULE3_EVIDENCE_ENTRY_KEY_ORDER,
  RULE3_EVID_SYN_RE,
  RULE3_FINDING_REF_KEY_ORDER,
  RULE3_INPUT_KEY_ORDER,
  RULE3_REGISTRY_KEY_ORDER,
  RULE3_SYS_SYN_RE,
  RULE3_SYNTHETIC_TEST_CLASSIFICATION,
  RULE3_SYSTEM_ROLES,
  RULE3_VERIFICATION_STATUSES,
  type Rule3DetectionMethodClass,
  type Rule3SystemRole,
  type Rule3VerificationStatus,
} from './constants.js';
import { Rule3EvaluationError } from './errors.js';
import { canonicalCloneJson } from './freeze.js';
import type {
  Rule3CaseOrganSystemSummary,
  Rule3DoctorSuppliedStructuredEvidenceItem,
  Rule3EvidenceBindingRef,
  Rule3EvidenceDataVersions,
  Rule3FindingRef,
  Rule3Input,
  Rule3OrganSystemAffinityEvidenceRegistry,
  Rule3OrganSystemEvidenceEntry,
  Rule3StructuredFindingRefs,
  Rule3UpstreamApplicability,
} from './types.js';
import { RULE3_INPUT_CONTRACT_VERSION } from './version.js';

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PHI_KEY_RE = /^(patientName|patient_name|fullName|phone|email|address|ssn|mrn)$/i;
const PATH_LIKE_RE = /[\\/]|^[A-Za-z]:|^\\\\/;
const FORBIDDEN_CLINICAL_KEYS = new Set([
  'medicineId',
  'medicineIds',
  'formulaId',
  'formulaMutation',
  'addSlot',
  'removeSlot',
  'reorderSlots',
  'substituteSlot',
  'mutatesMixtures',
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
  'rawOcrBlob',
  'globalSymptomBlob',
  'ocrBlob',
  'photoBytes',
  'filePath',
  'localPath',
  'protectedPath',
  'bpAsGender',
  'rule4Pathway',
  'rule1Temperament',
  'rule2Polarity',
  'legacyDetectSystems',
  'aiOrganSystemSuggestion',
  'closedOrganSystemCatalog',
  'score',
  'threshold',
  'weight',
]);

type FailFn = () => never;

function failInput(): never {
  throw new Rule3EvaluationError('INVALID_INPUT');
}

function failVersion(): never {
  throw new Rule3EvaluationError('UNSUPPORTED_CONTRACT_VERSION');
}

function failRegistry(): never {
  throw new Rule3EvaluationError('INVALID_EVIDENCE_REGISTRY');
}

function failContradictory(): never {
  throw new Rule3EvaluationError('CONTRADICTORY_INPUT_STATE');
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
  if (PATH_LIKE_RE.test(value)) fail();
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

function parseEvidenceVersions(value: unknown): Rule3EvidenceDataVersions {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const required = [
    'evidenceDataVersion',
    'organSystemRegistryVersion',
    'contractVersion',
    'governanceVersion',
  ] as const;
  readExactKeys(value, required, failInput);
  return {
    evidenceDataVersion: assertCanonicalId(value.evidenceDataVersion),
    organSystemRegistryVersion: assertCanonicalId(value.organSystemRegistryVersion),
    contractVersion: assertCanonicalId(value.contractVersion),
    governanceVersion: assertCanonicalId(value.governanceVersion),
  };
}

function parseUpstream(value: unknown): Rule3UpstreamApplicability {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  if (!('status' in value) || !('notes' in value) || Object.keys(value).length !== 2) failInput();
  return {
    status: assertCanonicalId(value.status),
    notes: Object.freeze(parseStringListField(value.notes, failInput)),
  };
}

function parseCaseSummary(value: unknown): Rule3CaseOrganSystemSummary {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length !== 4 || value.status !== 'SUPPLIED') failInput();
  if (value.displayOnly !== true) failInput();
  if (value.mustNotDriveSelection !== true) failInput();
  if (value.headline !== null && typeof value.headline !== 'string') failInput();
  if (typeof value.headline === 'string' && value.headline.length > 256) failInput();
  return {
    status: 'SUPPLIED',
    displayOnly: true,
    mustNotDriveSelection: true,
    headline: value.headline as string | null,
  };
}

function parseFindingRefs(value: unknown): Rule3StructuredFindingRefs {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length !== 2 || value.status !== 'SUPPLIED') failInput();
  if (types.isProxy(value.findings) || !Array.isArray(value.findings)) failInput();
  assertDenseArray(value.findings as unknown[], failInput);
  const findings: Rule3FindingRef[] = [];
  const ids = new Set<string>();
  for (const raw of value.findings) {
    if (types.isProxy(raw)) failInput();
    if (!isPlainObject(raw)) failInput();
    assertNoAccessors(raw, failInput);
    readExactKeys(raw, RULE3_FINDING_REF_KEY_ORDER, failInput);
    const findingRefId = assertCanonicalId(raw.findingRefId);
    if (ids.has(findingRefId)) failInput();
    ids.add(findingRefId);
    findings.push({
      findingRefId,
      bindingRefId: assertCanonicalId(raw.bindingRefId),
    });
  }
  return { status: 'SUPPLIED', findings: Object.freeze(findings) };
}

function parseBindingRefs(value: unknown): readonly Rule3EvidenceBindingRef[] {
  if (types.isProxy(value)) failInput();
  if (!Array.isArray(value)) failInput();
  assertDenseArray(value, failInput);
  const ids = new Set<string>();
  const refs: Rule3EvidenceBindingRef[] = [];
  for (const raw of value) {
    if (types.isProxy(raw)) failInput();
    if (!isPlainObject(raw)) failInput();
    assertNoAccessors(raw, failInput);
    readExactKeys(raw, RULE3_BINDING_REF_KEY_ORDER, failInput);
    const bindingRefId = assertCanonicalId(raw.bindingRefId);
    if (ids.has(bindingRefId)) failInput();
    ids.add(bindingRefId);
    refs.push({ bindingRefId });
  }
  return Object.freeze(refs);
}

function parseDoctorItems(value: unknown): readonly Rule3DoctorSuppliedStructuredEvidenceItem[] {
  if (types.isProxy(value)) failInput();
  if (!Array.isArray(value)) failInput();
  assertDenseArray(value, failInput);
  const ids = new Set<string>();
  const items: Rule3DoctorSuppliedStructuredEvidenceItem[] = [];
  for (const raw of value) {
    if (types.isProxy(raw)) failInput();
    if (!isPlainObject(raw)) failInput();
    assertNoAccessors(raw, failInput);
    readExactKeys(raw, RULE3_DOCTOR_ITEM_KEY_ORDER, failInput);
    const itemId = assertCanonicalId(raw.itemId);
    if (ids.has(itemId)) failInput();
    ids.add(itemId);
    items.push({
      itemId,
      bindingRefId: assertCanonicalId(raw.bindingRefId),
      evidenceClass: assertCanonicalId(raw.evidenceClass),
    });
  }
  return Object.freeze(items);
}

function parseOrganSystemToken(value: unknown, fail: FailFn): string {
  if (typeof value !== 'string' || value.length === 0) fail();
  // Unknown real tokens (including historical RESPIRATORY/GASTRIC/…) fail closed.
  if (!RULE3_SYS_SYN_RE.test(value)) fail();
  return value;
}

function parseEvidenceEntry(value: unknown, entryIds: Set<string>): Rule3OrganSystemEvidenceEntry {
  if (types.isProxy(value)) failRegistry();
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value, failRegistry);
  readExactKeys(value, RULE3_EVIDENCE_ENTRY_KEY_ORDER, failRegistry);

  const entryId = assertCanonicalId(value.entryId, failRegistry);
  if (entryIds.has(entryId)) failRegistry();
  entryIds.add(entryId);

  if (typeof value.systemRole !== 'string') failRegistry();
  if (!(RULE3_SYSTEM_ROLES as readonly string[]).includes(value.systemRole)) failRegistry();
  if (typeof value.verificationStatus !== 'string') failRegistry();
  if (!(RULE3_VERIFICATION_STATUSES as readonly string[]).includes(value.verificationStatus)) {
    failRegistry();
  }
  if (typeof value.detectionMethodClass !== 'string') failRegistry();
  if (!(RULE3_DETECTION_METHOD_CLASSES as readonly string[]).includes(value.detectionMethodClass)) {
    failRegistry();
  }

  return {
    entryId,
    bindingRefId: assertCanonicalId(value.bindingRefId, failRegistry),
    organSystemToken: parseOrganSystemToken(value.organSystemToken, failRegistry),
    systemRole: value.systemRole as Rule3SystemRole,
    verificationStatus: value.verificationStatus as Rule3VerificationStatus,
    detectionMethodClass: value.detectionMethodClass as Rule3DetectionMethodClass,
    evidenceSourceId: assertCanonicalId(value.evidenceSourceId, failRegistry),
    evidenceValidationStatus: assertCanonicalId(value.evidenceValidationStatus, failRegistry),
    ownerClinicalApprovalStatus: assertCanonicalId(value.ownerClinicalApprovalStatus, failRegistry),
    version: assertCanonicalId(value.version, failRegistry),
    effectiveStatus: assertCanonicalId(value.effectiveStatus, failRegistry),
    testClassification: assertCanonicalId(value.testClassification, failRegistry),
  };
}

function parseRegistry(value: unknown): Rule3OrganSystemAffinityEvidenceRegistry {
  if (types.isProxy(value)) failRegistry();
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value, failRegistry);
  readExactKeys(value, RULE3_REGISTRY_KEY_ORDER, failRegistry);
  const registryVersion = assertCanonicalId(value.registryVersion, failRegistry);
  if (value.activeRealMappingCount !== 0) failRegistry();
  if (types.isProxy(value.entries) || !Array.isArray(value.entries)) failRegistry();
  assertDenseArray(value.entries as unknown[], failRegistry);
  const entryIds = new Set<string>();
  const entries: Rule3OrganSystemEvidenceEntry[] = [];
  for (const raw of value.entries) {
    entries.push(parseEvidenceEntry(raw, entryIds));
  }
  return {
    registryVersion,
    entries: Object.freeze(entries),
    activeRealMappingCount: 0,
  };
}

/**
 * Conjunctive activating gate for synthetic technical shadow annotation only.
 * Real production mappings remain empty; non-synthetic classification never activates.
 */
export function isActivatingOrganSystemEvidence(entry: Rule3OrganSystemEvidenceEntry): boolean {
  if (entry.testClassification !== RULE3_SYNTHETIC_TEST_CLASSIFICATION) {
    return false;
  }
  if ((RULE3_BLOCKING_LIFECYCLE as readonly string[]).includes(entry.effectiveStatus)) {
    return false;
  }
  if (!RULE3_SYS_SYN_RE.test(entry.organSystemToken)) {
    return false;
  }
  if (!RULE3_EVID_SYN_RE.test(entry.evidenceSourceId)) {
    return false;
  }
  if (entry.detectionMethodClass !== 'SYNTHETIC_TEST_ONLY') {
    return false;
  }
  if (
    entry.systemRole === 'CANDIDATE' ||
    entry.systemRole === 'CO_INVOLVEMENT_CANDIDATE' ||
    entry.verificationStatus === 'LOW_CONFIDENCE_CANDIDATE'
  ) {
    return false;
  }
  return (
    entry.evidenceValidationStatus === 'validated' &&
    entry.ownerClinicalApprovalStatus === 'approved' &&
    entry.effectiveStatus === 'APPROVED_AND_ACTIVE'
  );
}

export function validateRule3Input(raw: unknown): Rule3Input {
  if (types.isProxy(raw)) failInput();
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  assertPlainData(raw, new WeakSet(), failInput);
  readExactKeys(raw, RULE3_INPUT_KEY_ORDER, failInput);

  if (raw.contractVersion !== RULE3_INPUT_CONTRACT_VERSION) failVersion();

  const cloned = canonicalCloneJson(raw) as Record<string, unknown>;
  if (!isPlainObject(cloned)) failInput();

  let registry: Rule3OrganSystemAffinityEvidenceRegistry;
  try {
    registry = parseRegistry(cloned.organSystemAffinityEvidenceRegistry);
  } catch (e) {
    if (e instanceof Rule3EvaluationError) throw e;
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

  const orderedEvidenceBindingRefs = parseBindingRefs(cloned.orderedEvidenceBindingRefs);
  if (upstream.status === 'APPLICABLE' && orderedEvidenceBindingRefs.length === 0) {
    failInput();
  }

  return {
    contractVersion: RULE3_INPUT_CONTRACT_VERSION,
    requestId: assertCanonicalId(cloned.requestId),
    organSystemAffinityEvidenceRegistry: registry,
    orderedEvidenceBindingRefs,
    doctorSuppliedStructuredEvidenceItems: parseDoctorItems(
      cloned.doctorSuppliedStructuredEvidenceItems,
    ),
    caseOrganSystemSummary: parseCaseSummary(cloned.caseOrganSystemSummary),
    structuredFindingRefs: parseFindingRefs(cloned.structuredFindingRefs),
    evidenceDataVersions: parseEvidenceVersions(cloned.evidenceDataVersions),
    upstreamApplicability: upstream,
  };
}
