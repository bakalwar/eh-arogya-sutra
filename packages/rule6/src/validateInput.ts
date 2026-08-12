import {
  RULE6_EDGE_KEY_ORDER,
  RULE6_INPUT_KEY_ORDER,
  RULE6_NON_ACTIVATING_EDGE_STATES,
} from './constants.js';
import { Rule6EvaluationError } from './errors.js';
import { canonicalCloneJson } from './freeze.js';
import type {
  Rule6EvidenceDataVersions,
  Rule6Input,
  Rule6RelationshipEdge,
  Rule6RelationshipEvidenceRegistry,
  Rule6SeverityRef,
  Rule6UpstreamApplicability,
  Rule6UpstreamRef,
} from './types.js';
import { RULE6_INPUT_CONTRACT_VERSION } from './version.js';

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PHI_KEY_RE = /^(patientName|patient_name|fullName|phone|email|address|ssn|mrn)$/i;
const FORBIDDEN_THRESHOLD_KEYS = new Set([
  'TH-01',
  'TH-02',
  'TH-03',
  'TH-04',
  'DA-01',
  'DA-02',
  'DA-03',
  'DA-04',
  'DA-05',
  'DA-06',
  'DA-07',
]);

function failInput(): never {
  throw new Rule6EvaluationError('INVALID_INPUT');
}

function failVersion(): never {
  throw new Rule6EvaluationError('UNSUPPORTED_CONTRACT_VERSION');
}

function failRegistry(): never {
  throw new Rule6EvaluationError('INVALID_EVIDENCE_REGISTRY');
}

function failContradictory(): never {
  throw new Rule6EvaluationError('CONTRADICTORY_UPSTREAM_STATE');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function assertNoAccessors(value: object): void {
  for (const key of Reflect.ownKeys(value)) {
    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (!desc) failInput();
    if (typeof desc.get === 'function' || typeof desc.set === 'function') failInput();
    if (typeof key === 'symbol') failInput();
  }
}

function assertPlainData(value: unknown, seen: WeakSet<object>): void {
  if (value === null) return;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    if (t === 'number' && !Number.isFinite(value as number)) failInput();
    return;
  }
  if (t === 'function' || t === 'symbol' || t === 'bigint' || t === 'undefined') failInput();
  if (typeof value !== 'object') failInput();
  if (seen.has(value as object)) failInput();
  seen.add(value as object);
  if (Array.isArray(value)) {
    for (const item of value) assertPlainData(item, seen);
    return;
  }
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value);
  for (const key of Object.keys(value)) {
    if (PHI_KEY_RE.test(key) || FORBIDDEN_THRESHOLD_KEYS.has(key)) failInput();
    assertPlainData(value[key], seen);
  }
}

function assertCanonicalId(value: unknown): string {
  if (typeof value !== 'string' || !ID_RE.test(value)) failInput();
  return value;
}

function assertStringArray(value: unknown, allowEmpty: boolean): string[] {
  if (!Array.isArray(value)) failInput();
  if (!allowEmpty && value.length === 0) failInput();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = assertCanonicalId(item);
    if (seen.has(id)) failInput();
    seen.add(id);
    out.push(id);
  }
  return out;
}

function assertStringArrayAllowDupCheck(value: unknown): string[] {
  if (!Array.isArray(value)) failInput();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = assertCanonicalId(item);
    if (seen.has(id)) failInput();
    seen.add(id);
    out.push(id);
  }
  return out;
}

function readExactKeys(obj: Record<string, unknown>, ordered: readonly string[]): void {
  const keys = Object.keys(obj);
  if (keys.length !== ordered.length) failInput();
  const set = new Set(keys);
  for (const k of ordered) {
    if (!set.has(k)) failInput();
  }
  for (const k of keys) {
    if (!ordered.includes(k)) failInput();
  }
}

function parseUpstreamRef(value: unknown): Rule6UpstreamRef {
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value);
  const keys = Object.keys(value);
  if (keys.length !== 3 || !('refId' in value) || !('status' in value) || !('version' in value)) {
    failInput();
  }
  return {
    refId: assertCanonicalId(value.refId),
    status: assertCanonicalId(value.status),
    version: assertCanonicalId(value.version),
  };
}

function parseSeverityRef(value: unknown): Rule6SeverityRef {
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value);
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

function parseEvidenceVersions(value: unknown): Rule6EvidenceDataVersions {
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value);
  const required = [
    'medicineDataVersion',
    'diseaseDataVersion',
    'evidenceDataVersion',
    'contractVersion',
  ] as const;
  readExactKeys(value, required);
  return {
    medicineDataVersion: assertCanonicalId(value.medicineDataVersion),
    diseaseDataVersion: assertCanonicalId(value.diseaseDataVersion),
    evidenceDataVersion: assertCanonicalId(value.evidenceDataVersion),
    contractVersion: assertCanonicalId(value.contractVersion),
  };
}

function parseUpstreamApplicability(value: unknown): Rule6UpstreamApplicability {
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value);
  if (!('status' in value) || !('notes' in value) || Object.keys(value).length !== 2) failInput();
  if (!Array.isArray(value.notes)) failInput();
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

function parseEdge(value: unknown, edgeIds: Set<string>): Rule6RelationshipEdge {
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value);
  try {
    readExactKeys(value, RULE6_EDGE_KEY_ORDER);
  } catch {
    failRegistry();
  }
  const edgeId = assertCanonicalId(value.edgeId);
  if (edgeIds.has(edgeId)) failRegistry();
  edgeIds.add(edgeId);

  let target: string | readonly string[];
  if (typeof value.targetMedicineIdOrSet === 'string') {
    target = assertCanonicalId(value.targetMedicineIdOrSet);
  } else if (Array.isArray(value.targetMedicineIdOrSet)) {
    target = Object.freeze(assertStringArray(value.targetMedicineIdOrSet, false));
  } else {
    failRegistry();
  }

  if (value.directionality !== 'DIRECTED' && value.directionality !== 'UNDIRECTED') {
    failRegistry();
  }
  if (typeof value.relationshipType !== 'string' || !ID_RE.test(value.relationshipType)) {
    failRegistry();
  }
  if (
    !Array.isArray(value.applicabilityConditions) ||
    !Array.isArray(value.prohibitionConditions)
  ) {
    failRegistry();
  }
  const applicabilityConditions = assertStringArrayAllowDupCheck(value.applicabilityConditions);
  const prohibitionConditions = assertStringArrayAllowDupCheck(value.prohibitionConditions);
  if (typeof value.evidenceSourceId !== 'string' || !ID_RE.test(value.evidenceSourceId)) {
    failRegistry();
  }
  for (const field of [
    'evidenceValidationStatus',
    'ownerClinicalApprovalStatus',
    'version',
    'effectiveStatus',
  ] as const) {
    if (
      typeof value[field] !== 'string' ||
      value[field].length === 0 ||
      value[field].length > 128
    ) {
      failRegistry();
    }
  }
  if (value.supersessionMetadata !== null && typeof value.supersessionMetadata !== 'string') {
    failRegistry();
  }

  return {
    edgeId,
    sourceMedicineId: assertCanonicalId(value.sourceMedicineId),
    targetMedicineIdOrSet: target,
    directionality: value.directionality,
    relationshipType: value.relationshipType,
    applicabilityConditions: Object.freeze(applicabilityConditions),
    prohibitionConditions: Object.freeze(prohibitionConditions),
    evidenceSourceId: value.evidenceSourceId,
    evidenceValidationStatus: value.evidenceValidationStatus as string,
    ownerClinicalApprovalStatus: value.ownerClinicalApprovalStatus as string,
    version: value.version as string,
    effectiveStatus: value.effectiveStatus as string,
    supersessionMetadata: value.supersessionMetadata as string | null,
  };
}

function parseRegistry(value: unknown): Rule6RelationshipEvidenceRegistry {
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value);
  if (!('registryVersion' in value) || !('edges' in value) || Object.keys(value).length !== 2) {
    failRegistry();
  }
  if (typeof value.registryVersion !== 'string' || !ID_RE.test(value.registryVersion)) {
    failRegistry();
  }
  if (!Array.isArray(value.edges)) failRegistry();
  const edgeIds = new Set<string>();
  const edges: Rule6RelationshipEdge[] = [];
  for (const raw of value.edges) {
    edges.push(parseEdge(raw, edgeIds));
  }
  return {
    registryVersion: value.registryVersion,
    edges: Object.freeze(edges),
  };
}

function assertUpstreamConsistency(input: Rule6Input): void {
  const statuses = [
    input.upstreamApplicability.status,
    input.rule1TemperamentRef.status,
    input.rule3OrganSystemRef.status,
  ];
  if (statuses.includes('APPLICABLE') && statuses.includes('NOT_APPLICABLE')) {
    failContradictory();
  }
  if (
    statuses.includes('EVALUABLE') &&
    statuses.includes('NOT_EVALUABLE') &&
    statuses.includes('APPLICABLE')
  ) {
    // contradictory mix of evaluable gates
    if (
      input.upstreamApplicability.status === 'APPLICABLE' &&
      (input.rule1TemperamentRef.status === 'NOT_EVALUABLE' ||
        input.rule3OrganSystemRef.status === 'NOT_EVALUABLE')
    ) {
      // allowed: applicability can be APPLICABLE while a ref is NOT_EVALUABLE → clinical NOT_EVALUABLE
      return;
    }
  }
  if (
    input.upstreamApplicability.status === 'CONTRADICTORY' ||
    input.rule1TemperamentRef.status === 'CONTRADICTORY' ||
    input.rule3OrganSystemRef.status === 'CONTRADICTORY'
  ) {
    failContradictory();
  }
}

export function validateRule6Input(raw: unknown): Rule6Input {
  try {
    assertPlainData(raw, new WeakSet());
  } catch (e) {
    if (e instanceof Rule6EvaluationError) throw e;
    throw new Rule6EvaluationError('INTERNAL_FAILURE');
  }
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw);
  if (typeof raw.contractVersion !== 'string') failInput();
  if (raw.contractVersion !== RULE6_INPUT_CONTRACT_VERSION) failVersion();
  readExactKeys(raw, RULE6_INPUT_KEY_ORDER);

  let registry: Rule6RelationshipEvidenceRegistry;
  try {
    registry = parseRegistry(raw.relationshipEvidenceRegistry);
  } catch (e) {
    if (e instanceof Rule6EvaluationError) throw e;
    failRegistry();
  }

  const input: Rule6Input = {
    contractVersion: RULE6_INPUT_CONTRACT_VERSION,
    requestId: assertCanonicalId(raw.requestId),
    diseaseConditionRefs: Object.freeze(assertStringArrayAllowDupCheck(raw.diseaseConditionRefs)),
    clinicalTargetRefs: Object.freeze(assertStringArrayAllowDupCheck(raw.clinicalTargetRefs)),
    rule1TemperamentRef: parseUpstreamRef(raw.rule1TemperamentRef),
    rule3OrganSystemRef: parseUpstreamRef(raw.rule3OrganSystemRef),
    severityRef: parseSeverityRef(raw.severityRef),
    candidateMedicinePool: Object.freeze(assertStringArrayAllowDupCheck(raw.candidateMedicinePool)),
    relationshipEvidenceRegistry: registry,
    safetyExclusionRefs: Object.freeze(assertStringArrayAllowDupCheck(raw.safetyExclusionRefs)),
    evidenceDataVersions: parseEvidenceVersions(raw.evidenceDataVersions),
    upstreamApplicability: parseUpstreamApplicability(raw.upstreamApplicability),
  };

  assertUpstreamConsistency(input);
  return canonicalCloneJson(input);
}

export function isActivatingEdge(edge: Rule6RelationshipEdge): boolean {
  if (edge.evidenceValidationStatus !== 'approved') return false;
  if (edge.ownerClinicalApprovalStatus !== 'approved') return false;
  if (edge.effectiveStatus !== 'active') return false;
  const nonAct = new Set<string>(RULE6_NON_ACTIVATING_EDGE_STATES);
  if (nonAct.has(edge.evidenceValidationStatus)) return false;
  if (nonAct.has(edge.ownerClinicalApprovalStatus)) return false;
  if (nonAct.has(edge.effectiveStatus)) return false;
  return true;
}
