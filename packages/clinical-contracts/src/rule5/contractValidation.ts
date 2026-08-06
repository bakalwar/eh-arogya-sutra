import { RULE_SET_VERSION } from '../nineRules.js';
import {
  RULE5_CANONICAL_CONTRACT_FOUNDATION,
  RULE5_CANONICAL_RULE_NAME,
  RULE5_CANONICAL_RULE_NUMBER,
  RULE5_CONTRACT_INVOCATION_KIND,
  type Rule5ContractAuditContext,
  type Rule5ContractFoundationDocument,
  type Rule5ContractFoundationInput,
  type Rule5ContractFoundationOutput,
  type Rule5EvaluationModeVocabulary,
} from './contractFoundation.js';
import {
  isKnownRule5EngineeringLimitationCode,
  isRule5ClinicalReasonNamespace,
  isRule5EngineeringNamespace,
  RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES,
} from './engineeringCodes.js';
import {
  RULE5_CONTRACT_VERSION,
  RULE5_FINGERPRINT_VERSION,
  RULE5_HARD_BLOCKER_MATRIX_VERSION,
  RULE5_REASON_REGISTRY_VERSION,
} from './version.js';

export type Rule5ContractValidationFailureCode =
  | 'RULE5_CONTRACT_INVALID_DOCUMENT'
  | 'RULE5_CONTRACT_UNEXPECTED_FIELD'
  | 'RULE5_CONTRACT_MISSING_MANDATORY_FIELD'
  | 'RULE5_CONTRACT_WHITESPACE_ONLY_FIELD'
  | 'RULE5_CONTRACT_INVALID_VERSION'
  | 'RULE5_CONTRACT_WRONG_RULE_SET_VERSION'
  | 'RULE5_CONTRACT_WRONG_RULE_NUMBER'
  | 'RULE5_CONTRACT_WRONG_RULE_NAME'
  | 'RULE5_CONTRACT_WRONG_INVOCATION_KIND'
  | 'RULE5_ENGINE_MODE_SHADOW_NOT_AUTHORIZED'
  | 'RULE5_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED'
  | 'RULE5_ENGINE_MODE_INVALID'
  | 'RULE5_CONTRACT_IMPLEMENTED_NOT_ALLOWED'
  | 'RULE5_CONTRACT_CONNECTED_NOT_ALLOWED'
  | 'RULE5_CONTRACT_AFFECTS_CLINICAL_SELECTION_NOT_ALLOWED'
  | 'RULE5_CONTRACT_CLINICAL_ACTION_NOT_ALLOWED'
  | 'RULE5_CONTRACT_PRESCRIPTION_MUTATION_NOT_ALLOWED'
  | 'RULE5_CONTRACT_MEDICINE_MUTATION_NOT_ALLOWED'
  | 'RULE5_CONTRACT_POTENCY_MUTATION_NOT_ALLOWED'
  | 'RULE5_CONTRACT_DOSAGE_MUTATION_NOT_ALLOWED'
  | 'RULE5_CONTRACT_REASON_CODES_MUST_BE_EMPTY'
  | 'RULE5_CONTRACT_CLINICAL_REASON_IN_LIMITATIONS'
  | 'RULE5_CONTRACT_ENGINEERING_REASON_IN_CLINICAL'
  | 'RULE5_CONTRACT_UNKNOWN_LIMITATION_CODE'
  | 'RULE5_CONTRACT_WRONG_LIMITATION_SET'
  | 'RULE5_CONTRACT_WRONG_STATUS'
  | 'RULE5_CONTRACT_WRONG_EVALUATION_MODE'
  | 'RULE5_CONTRACT_WRONG_FINGERPRINT_VERSION'
  | 'RULE5_CONTRACT_FINGERPRINT_MUST_BE_NULL'
  | 'RULE5_CONTRACT_WRONG_AUDIT_CONTEXT'
  | 'RULE5_CONTRACT_CANONICAL_MISMATCH'
  | 'RULE5_CONTRACT_FORBIDDEN_CLINICAL_FIELD';

export class Rule5ContractValidationError extends Error {
  readonly failureCode: Rule5ContractValidationFailureCode;

  constructor(failureCode: Rule5ContractValidationFailureCode, detail?: string) {
    super(detail ? `${failureCode}: ${detail}` : failureCode);
    this.name = 'Rule5ContractValidationError';
    this.failureCode = failureCode;
  }
}

const INPUT_KEYS = new Set([
  'contractVersion',
  'ruleSetVersion',
  'evaluationMode',
  'invocationKind',
]);

const OUTPUT_KEYS = new Set([
  'contractVersion',
  'ruleSetVersion',
  'ruleNumber',
  'ruleName',
  'status',
  'evaluationMode',
  'implemented',
  'connected',
  'affectsClinicalSelection',
  'clinicalActionAuthorized',
  'prescriptionMutationAuthorized',
  'medicineMutationAuthorized',
  'potencyMutationAuthorized',
  'dosageMutationAuthorized',
  'reasonCodes',
  'limitationCodes',
  'auditContext',
  'fingerprintVersion',
  'deterministicFingerprint',
]);

const AUDIT_CONTEXT_KEYS = new Set([
  'contractVersion',
  'ruleSetVersion',
  'reasonRegistryVersion',
  'hardBlockerMatrixVersion',
  'fingerprintVersion',
]);

const FOUNDATION_DOC_KEYS = new Set(['canonicalInput', 'canonicalOutput']);

const FORBIDDEN_KEY_NAMES = new Set([
  'patientId',
  'caseId',
  'consultationId',
  'requestId',
  'validationRunId',
  'correlationId',
  'symptoms',
  'diagnosis',
  'vitals',
  'labs',
  'monitoringPlan',
  'evidence',
  'adverseEvent',
  'medicine',
  'mixture',
  'potency',
  'dosage',
  'threshold',
  'phone',
  'email',
  'phi',
]);

function assertPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnexpectedKeys(
  raw: Record<string, unknown>,
  allowed: Set<string>,
  failure: Rule5ContractValidationFailureCode = 'RULE5_CONTRACT_UNEXPECTED_FIELD',
): void {
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      throw new Rule5ContractValidationError(failure, key);
    }
  }
}

function rejectForbiddenNestedKeys(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) rejectForbiddenNestedKeys(item);
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEY_NAMES.has(k)) {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_FORBIDDEN_CLINICAL_FIELD', k);
    }
    rejectForbiddenNestedKeys(v);
  }
}

function requireNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_MISSING_MANDATORY_FIELD', field);
  }
  if (value.trim() === '') {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WHITESPACE_ONLY_FIELD', field);
  }
}

function parseEvaluationModeForInput(raw: unknown): Rule5EvaluationModeVocabulary {
  requireNonEmptyString(raw, 'evaluationMode');
  const mode = raw as string;
  if (mode === 'OFF') return 'OFF';
  if (mode === 'SHADOW') {
    throw new Rule5ContractValidationError('RULE5_ENGINE_MODE_SHADOW_NOT_AUTHORIZED');
  }
  if (mode === 'ACTIVE') {
    throw new Rule5ContractValidationError('RULE5_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED');
  }
  throw new Rule5ContractValidationError('RULE5_ENGINE_MODE_INVALID', 'evaluationMode');
}

function assertContractVersion(value: unknown, field = 'contractVersion'): void {
  requireNonEmptyString(value, field);
  if (value !== RULE5_CONTRACT_VERSION) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_VERSION', String(value));
  }
}

function assertRuleSetVersion(value: unknown, field = 'ruleSetVersion'): void {
  requireNonEmptyString(value, field);
  if (value !== RULE_SET_VERSION) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_RULE_SET_VERSION', String(value));
  }
}

function validateReasonAndLimitationNamespaces(
  reasonCodes: unknown,
  limitationCodes: unknown,
): void {
  if (!Array.isArray(reasonCodes)) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT', 'reasonCodes');
  }
  if (!Array.isArray(limitationCodes)) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT', 'limitationCodes');
  }
  for (const code of reasonCodes) {
    if (typeof code !== 'string') {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT', 'reasonCodes');
    }
    if (isRule5EngineeringNamespace(code)) {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_ENGINEERING_REASON_IN_CLINICAL', code);
    }
  }
  for (const code of limitationCodes) {
    if (typeof code !== 'string') {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT', 'limitationCodes');
    }
    if (isRule5ClinicalReasonNamespace(code)) {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_CLINICAL_REASON_IN_LIMITATIONS', code);
    }
  }
}

function validateAuditContextRaw(raw: unknown): Rule5ContractAuditContext {
  if (!assertPlainObject(raw)) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT', 'auditContext');
  }
  rejectUnexpectedKeys(raw, AUDIT_CONTEXT_KEYS);
  assertContractVersion(raw.contractVersion, 'auditContext.contractVersion');
  assertRuleSetVersion(raw.ruleSetVersion, 'auditContext.ruleSetVersion');
  requireNonEmptyString(raw.reasonRegistryVersion, 'auditContext.reasonRegistryVersion');
  if (raw.reasonRegistryVersion !== RULE5_REASON_REGISTRY_VERSION) {
    throw new Rule5ContractValidationError(
      'RULE5_CONTRACT_WRONG_AUDIT_CONTEXT',
      'reasonRegistryVersion',
    );
  }
  requireNonEmptyString(raw.hardBlockerMatrixVersion, 'auditContext.hardBlockerMatrixVersion');
  if (raw.hardBlockerMatrixVersion !== RULE5_HARD_BLOCKER_MATRIX_VERSION) {
    throw new Rule5ContractValidationError(
      'RULE5_CONTRACT_WRONG_AUDIT_CONTEXT',
      'hardBlockerMatrixVersion',
    );
  }
  requireNonEmptyString(raw.fingerprintVersion, 'auditContext.fingerprintVersion');
  if (raw.fingerprintVersion !== RULE5_FINGERPRINT_VERSION) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_FINGERPRINT_VERSION');
  }
  return RULE5_CANONICAL_CONTRACT_FOUNDATION.canonicalOutput.auditContext;
}

function assertFalseFlag(value: unknown, code: Rule5ContractValidationFailureCode): void {
  if (value !== false) {
    throw new Rule5ContractValidationError(code);
  }
}

export function validateRule5ContractFoundationInputDocument(
  rawDocument: unknown,
): Rule5ContractFoundationInput {
  if (!assertPlainObject(rawDocument)) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT');
  }
  rejectForbiddenNestedKeys(rawDocument);
  rejectUnexpectedKeys(rawDocument, INPUT_KEYS);
  assertContractVersion(rawDocument.contractVersion);
  assertRuleSetVersion(rawDocument.ruleSetVersion);
  const mode = parseEvaluationModeForInput(rawDocument.evaluationMode);
  if (mode !== 'OFF') {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_EVALUATION_MODE');
  }
  requireNonEmptyString(rawDocument.invocationKind, 'invocationKind');
  if (rawDocument.invocationKind !== RULE5_CONTRACT_INVOCATION_KIND) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_INVOCATION_KIND');
  }
  const canonical = RULE5_CANONICAL_CONTRACT_FOUNDATION.canonicalInput;
  if (
    rawDocument.contractVersion !== canonical.contractVersion ||
    rawDocument.ruleSetVersion !== canonical.ruleSetVersion ||
    rawDocument.evaluationMode !== canonical.evaluationMode ||
    rawDocument.invocationKind !== canonical.invocationKind
  ) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_CANONICAL_MISMATCH', 'canonicalInput');
  }
  return canonical;
}

export function validateRule5ContractFoundationOutputDocument(
  rawDocument: unknown,
): Rule5ContractFoundationOutput {
  if (!assertPlainObject(rawDocument)) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT');
  }
  rejectForbiddenNestedKeys(rawDocument);
  rejectUnexpectedKeys(rawDocument, OUTPUT_KEYS);
  assertContractVersion(rawDocument.contractVersion);
  assertRuleSetVersion(rawDocument.ruleSetVersion);
  if (rawDocument.ruleNumber !== RULE5_CANONICAL_RULE_NUMBER) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_RULE_NUMBER');
  }
  requireNonEmptyString(rawDocument.ruleName, 'ruleName');
  if (rawDocument.ruleName !== RULE5_CANONICAL_RULE_NAME) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_RULE_NAME');
  }
  requireNonEmptyString(rawDocument.status, 'status');
  if (rawDocument.status !== 'NOT_IMPLEMENTED') {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_STATUS');
  }
  const mode = parseEvaluationModeForInput(rawDocument.evaluationMode);
  if (mode !== 'OFF') {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_EVALUATION_MODE');
  }
  assertFalseFlag(rawDocument.implemented, 'RULE5_CONTRACT_IMPLEMENTED_NOT_ALLOWED');
  assertFalseFlag(rawDocument.connected, 'RULE5_CONTRACT_CONNECTED_NOT_ALLOWED');
  assertFalseFlag(
    rawDocument.affectsClinicalSelection,
    'RULE5_CONTRACT_AFFECTS_CLINICAL_SELECTION_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.clinicalActionAuthorized,
    'RULE5_CONTRACT_CLINICAL_ACTION_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.prescriptionMutationAuthorized,
    'RULE5_CONTRACT_PRESCRIPTION_MUTATION_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.medicineMutationAuthorized,
    'RULE5_CONTRACT_MEDICINE_MUTATION_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.potencyMutationAuthorized,
    'RULE5_CONTRACT_POTENCY_MUTATION_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.dosageMutationAuthorized,
    'RULE5_CONTRACT_DOSAGE_MUTATION_NOT_ALLOWED',
  );
  validateReasonAndLimitationNamespaces(rawDocument.reasonCodes, rawDocument.limitationCodes);
  const reasonCodes = rawDocument.reasonCodes as unknown[];
  const limitationCodes = rawDocument.limitationCodes as unknown[];
  if (reasonCodes.length !== 0) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_REASON_CODES_MUST_BE_EMPTY');
  }
  if (limitationCodes.length !== RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES.length) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_LIMITATION_SET');
  }
  for (let i = 0; i < RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES.length; i++) {
    const expected = RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES[i]!;
    const actual = limitationCodes[i];
    if (typeof actual !== 'string') {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_UNKNOWN_LIMITATION_CODE');
    }
    if (actual !== expected) {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_LIMITATION_SET', actual);
    }
    if (!isKnownRule5EngineeringLimitationCode(actual)) {
      throw new Rule5ContractValidationError('RULE5_CONTRACT_UNKNOWN_LIMITATION_CODE', actual);
    }
  }
  validateAuditContextRaw(rawDocument.auditContext);
  requireNonEmptyString(rawDocument.fingerprintVersion, 'fingerprintVersion');
  if (rawDocument.fingerprintVersion !== RULE5_FINGERPRINT_VERSION) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_FINGERPRINT_VERSION');
  }
  if (rawDocument.deterministicFingerprint !== null) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_FINGERPRINT_MUST_BE_NULL');
  }
  return RULE5_CANONICAL_CONTRACT_FOUNDATION.canonicalOutput;
}

export function validateRule5ContractFoundationDocument(
  rawDocument: unknown,
): Rule5ContractFoundationDocument {
  if (!assertPlainObject(rawDocument)) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT');
  }
  rejectForbiddenNestedKeys(rawDocument);
  rejectUnexpectedKeys(rawDocument, FOUNDATION_DOC_KEYS);
  validateRule5ContractFoundationInputDocument(rawDocument.canonicalInput);
  validateRule5ContractFoundationOutputDocument(rawDocument.canonicalOutput);
  return RULE5_CANONICAL_CONTRACT_FOUNDATION;
}

/** Validate arbitrary input-shaped document (e.g. mode rejection tests). */
export function validateRule5ContractFoundationInputShape(rawDocument: unknown): void {
  if (!assertPlainObject(rawDocument)) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_INVALID_DOCUMENT');
  }
  rejectForbiddenNestedKeys(rawDocument);
  rejectUnexpectedKeys(rawDocument, INPUT_KEYS);
  assertContractVersion(rawDocument.contractVersion);
  assertRuleSetVersion(rawDocument.ruleSetVersion);
  parseEvaluationModeForInput(rawDocument.evaluationMode);
  requireNonEmptyString(rawDocument.invocationKind, 'invocationKind');
  if (rawDocument.invocationKind !== RULE5_CONTRACT_INVOCATION_KIND) {
    throw new Rule5ContractValidationError('RULE5_CONTRACT_WRONG_INVOCATION_KIND');
  }
}
