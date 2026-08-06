import { isKnownRule5ClinicalReasonCode } from './reasonCodes.js';
import {
  RULE5_CANONICAL_HARD_BLOCKER_MATRIX,
  RULE5_HARD_BLOCKER_CONDITION_COUNT,
  RULE5_HARD_BLOCKER_MAPPING_COUNT,
  RULE5_MATRIX_EVIDENCE_GATE,
  RULE5_MATRIX_THRESHOLD_POLICY,
  type Rule5HardBlockerConditionEntry,
  type Rule5HardBlockerMappingEntry,
  type Rule5HardBlockerMatrix,
  type Rule5HardBlockerSafetyGroup,
} from './hardBlockerMatrix.js';
import { RULE5_HARD_BLOCKER_MATRIX_VERSION } from './version.js';

export type Rule5MatrixValidationFailureCode =
  | 'RULE5_MATRIX_INVALID_DOCUMENT'
  | 'RULE5_MATRIX_INVALID_VERSION'
  | 'RULE5_MATRIX_MISSING_MATRIX_VERSION'
  | 'RULE5_MATRIX_UNEXPECTED_FIELD'
  | 'RULE5_MATRIX_WHITESPACE_ONLY_FIELD'
  | 'RULE5_MATRIX_MISSING_MANDATORY_FIELD'
  | 'RULE5_MATRIX_WRONG_CONDITION_COUNT'
  | 'RULE5_MATRIX_WRONG_MAPPING_COUNT'
  | 'RULE5_MATRIX_DUPLICATE_ID'
  | 'RULE5_MATRIX_DUPLICATE_REASON_CODE'
  | 'RULE5_MATRIX_UNKNOWN_REASON_CODE'
  | 'RULE5_MATRIX_WRONG_CONDITION_LABEL'
  | 'RULE5_MATRIX_WRONG_MAPPING'
  | 'RULE5_MATRIX_INVALID_SAFETY_GROUP'
  | 'RULE5_MATRIX_WRONG_EVIDENCE_GATE'
  | 'RULE5_MATRIX_WRONG_THRESHOLD_POLICY'
  | 'RULE5_MATRIX_DOCTOR_REVIEW_REQUIRED'
  | 'RULE5_MATRIX_EXECUTABLE_NOT_ALLOWED'
  | 'RULE5_MATRIX_WRONG_OWNER_ANCHOR'
  | 'RULE5_MATRIX_WRONG_CROSS_CUTTING'
  | 'RULE5_MATRIX_CONDITION_ORDER_NOT_CANONICAL'
  | 'RULE5_MATRIX_MAPPING_ORDER_NOT_CANONICAL'
  | 'RULE5_MATRIX_FORBIDDEN_CLINICAL_FIELD';

export class Rule5MatrixValidationError extends Error {
  readonly failureCode: Rule5MatrixValidationFailureCode;

  constructor(failureCode: Rule5MatrixValidationFailureCode, detail?: string) {
    super(detail ? `${failureCode}: ${detail}` : failureCode);
    this.name = 'Rule5MatrixValidationError';
    this.failureCode = failureCode;
  }
}

const ROOT_KEYS = new Set(['matrixVersion', 'conditions', 'mappings', 'crossCuttingGovernance']);

const CONDITION_KEYS = new Set([
  'conditionId',
  'conditionLabel',
  'ownerDecisionAnchor',
  'executable',
]);
const MAPPING_KEYS = new Set([
  'mappingId',
  'conditionId',
  'reasonCode',
  'safetyGroup',
  'evidenceGate',
  'thresholdPolicy',
  'doctorReviewRequired',
  'executable',
  'ownerDecisionAnchor',
]);

const CROSS_CUTTING_KEYS = new Set([
  'reasonCodeReferences',
  'acknowledgmentDoesNotClearBlocker',
  'missingEvidenceNeverMeansPass',
  'automaticClinicalActionAuthorized',
  'evidenceStateCatalogDeferredToM6',
  'rule4ExcludedThresholdsAndDataAssets',
  'automatedBlockerActivationAuthorized',
]);

const FORBIDDEN_MATRIX_KEY_NAMES = new Set([
  'medicine',
  'mixture',
  'potency',
  'dosage',
  'clinicalCutoff',
  'pauseAction',
  'stopAction',
  'emergencyEscalation',
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

function rejectForbiddenNestedKeys(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) rejectForbiddenNestedKeys(item);
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_MATRIX_KEY_NAMES.has(k)) {
      throw new Rule5MatrixValidationError('RULE5_MATRIX_FORBIDDEN_CLINICAL_FIELD', k);
    }
    rejectForbiddenNestedKeys(v);
  }
}

const VALID_GROUPS = new Set<Rule5HardBlockerSafetyGroup>(['G1', 'G2', 'G3', 'G4']);

function assertPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnexpectedKeys(
  obj: Record<string, unknown>,
  allowed: Set<string>,
  failure: Rule5MatrixValidationFailureCode,
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new Rule5MatrixValidationError(failure, key);
    }
  }
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (value === undefined || value === null || value === '') {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_MISSING_MANDATORY_FIELD', field);
  }
  if (typeof value !== 'string') {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT', field);
  }
  if (value.trim() === '') {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WHITESPACE_ONLY_FIELD', field);
  }
  return value;
}

function parseCondition(raw: unknown): Rule5HardBlockerConditionEntry {
  if (!assertPlainObject(raw)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, CONDITION_KEYS, 'RULE5_MATRIX_UNEXPECTED_FIELD');
  const conditionId = requireNonEmptyString(raw.conditionId, 'conditionId');
  const conditionLabel = requireNonEmptyString(raw.conditionLabel, 'conditionLabel');
  if (raw.executable !== false) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_EXECUTABLE_NOT_ALLOWED', conditionId);
  }
  if (raw.ownerDecisionAnchor !== 'OD-R5-M0-016') {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_OWNER_ANCHOR', conditionId);
  }
  const canonical = RULE5_CANONICAL_HARD_BLOCKER_MATRIX.conditions.find(
    (c) => c.conditionId === conditionId,
  );
  if (!canonical || canonical.conditionLabel !== conditionLabel) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CONDITION_LABEL', conditionId);
  }
  return canonical;
}

function parseMapping(raw: unknown): Rule5HardBlockerMappingEntry {
  if (!assertPlainObject(raw)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, MAPPING_KEYS, 'RULE5_MATRIX_UNEXPECTED_FIELD');
  const mappingId = requireNonEmptyString(raw.mappingId, 'mappingId');
  const conditionId = requireNonEmptyString(raw.conditionId, 'conditionId');
  const reasonCode = requireNonEmptyString(raw.reasonCode, 'reasonCode');
  const safetyGroup = requireNonEmptyString(raw.safetyGroup, 'safetyGroup');
  if (!VALID_GROUPS.has(safetyGroup as Rule5HardBlockerSafetyGroup)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_SAFETY_GROUP', mappingId);
  }
  if (raw.evidenceGate !== RULE5_MATRIX_EVIDENCE_GATE) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_EVIDENCE_GATE', mappingId);
  }
  if (raw.thresholdPolicy !== RULE5_MATRIX_THRESHOLD_POLICY) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_THRESHOLD_POLICY', mappingId);
  }
  if (raw.doctorReviewRequired !== true) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_DOCTOR_REVIEW_REQUIRED', mappingId);
  }
  if (raw.executable !== false) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_EXECUTABLE_NOT_ALLOWED', mappingId);
  }
  if (raw.ownerDecisionAnchor !== 'OD-R5-M0-016') {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_OWNER_ANCHOR', mappingId);
  }
  if (!isKnownRule5ClinicalReasonCode(reasonCode)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_UNKNOWN_REASON_CODE', reasonCode);
  }
  const canonical = RULE5_CANONICAL_HARD_BLOCKER_MATRIX.mappings.find(
    (m) => m.mappingId === mappingId,
  );
  if (
    !canonical ||
    canonical.conditionId !== conditionId ||
    canonical.reasonCode !== reasonCode ||
    canonical.safetyGroup !== safetyGroup
  ) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_MAPPING', mappingId);
  }
  return canonical;
}

function parseCrossCutting(raw: unknown): Rule5HardBlockerMatrix['crossCuttingGovernance'] {
  if (!assertPlainObject(raw)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, CROSS_CUTTING_KEYS, 'RULE5_MATRIX_UNEXPECTED_FIELD');
  const canon = RULE5_CANONICAL_HARD_BLOCKER_MATRIX.crossCuttingGovernance;
  if (raw.acknowledgmentDoesNotClearBlocker !== canon.acknowledgmentDoesNotClearBlocker) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CROSS_CUTTING');
  }
  if (raw.missingEvidenceNeverMeansPass !== canon.missingEvidenceNeverMeansPass) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CROSS_CUTTING');
  }
  if (raw.automaticClinicalActionAuthorized !== canon.automaticClinicalActionAuthorized) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CROSS_CUTTING');
  }
  if (raw.evidenceStateCatalogDeferredToM6 !== canon.evidenceStateCatalogDeferredToM6) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CROSS_CUTTING');
  }
  if (raw.rule4ExcludedThresholdsAndDataAssets !== canon.rule4ExcludedThresholdsAndDataAssets) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CROSS_CUTTING');
  }
  if (raw.automatedBlockerActivationAuthorized !== canon.automatedBlockerActivationAuthorized) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CROSS_CUTTING');
  }
  if (!Array.isArray(raw.reasonCodeReferences)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT');
  }
  const refs = raw.reasonCodeReferences.map(String);
  if (refs.join('\0') !== [...canon.reasonCodeReferences].join('\0')) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CROSS_CUTTING');
  }
  for (const code of refs) {
    if (!isKnownRule5ClinicalReasonCode(code)) {
      throw new Rule5MatrixValidationError('RULE5_MATRIX_UNKNOWN_REASON_CODE', code);
    }
  }
  return canon;
}

export function validateRule5HardBlockerMatrixDocument(raw: unknown): Rule5HardBlockerMatrix {
  rejectForbiddenNestedKeys(raw);
  if (raw === null || Array.isArray(raw)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT');
  }
  if (!assertPlainObject(raw)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, ROOT_KEYS, 'RULE5_MATRIX_UNEXPECTED_FIELD');

  if (raw.matrixVersion === undefined || raw.matrixVersion === null || raw.matrixVersion === '') {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_MISSING_MATRIX_VERSION');
  }
  if (raw.matrixVersion !== RULE5_HARD_BLOCKER_MATRIX_VERSION) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_VERSION', String(raw.matrixVersion));
  }

  if (!Array.isArray(raw.conditions) || !Array.isArray(raw.mappings)) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_INVALID_DOCUMENT');
  }

  if (raw.conditions.length !== RULE5_HARD_BLOCKER_CONDITION_COUNT) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_CONDITION_COUNT');
  }
  if (raw.mappings.length !== RULE5_HARD_BLOCKER_MAPPING_COUNT) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_WRONG_MAPPING_COUNT');
  }

  const seenConditionIds = new Set<string>();
  const conditions: Rule5HardBlockerConditionEntry[] = [];
  for (const item of raw.conditions) {
    const c = parseCondition(item);
    if (seenConditionIds.has(c.conditionId)) {
      throw new Rule5MatrixValidationError('RULE5_MATRIX_DUPLICATE_ID', c.conditionId);
    }
    seenConditionIds.add(c.conditionId);
    conditions.push(c);
  }

  const seenMappingIds = new Set<string>();
  const seenReasonCodes = new Set<string>();
  const mappings: Rule5HardBlockerMappingEntry[] = [];
  for (const item of raw.mappings) {
    const m = parseMapping(item);
    if (seenMappingIds.has(m.mappingId)) {
      throw new Rule5MatrixValidationError('RULE5_MATRIX_DUPLICATE_ID', m.mappingId);
    }
    if (seenReasonCodes.has(m.reasonCode)) {
      throw new Rule5MatrixValidationError('RULE5_MATRIX_DUPLICATE_REASON_CODE', m.reasonCode);
    }
    seenMappingIds.add(m.mappingId);
    seenReasonCodes.add(m.reasonCode);
    mappings.push(m);
  }

  parseCrossCutting(raw.crossCuttingGovernance);

  const canonConditionIds = RULE5_CANONICAL_HARD_BLOCKER_MATRIX.conditions.map(
    (c) => c.conditionId,
  );
  if (conditions.map((c) => c.conditionId).join('\0') !== canonConditionIds.join('\0')) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_CONDITION_ORDER_NOT_CANONICAL');
  }

  const canonMappingIds = RULE5_CANONICAL_HARD_BLOCKER_MATRIX.mappings.map((m) => m.mappingId);
  if (mappings.map((m) => m.mappingId).join('\0') !== canonMappingIds.join('\0')) {
    throw new Rule5MatrixValidationError('RULE5_MATRIX_MAPPING_ORDER_NOT_CANONICAL');
  }

  return RULE5_CANONICAL_HARD_BLOCKER_MATRIX;
}
