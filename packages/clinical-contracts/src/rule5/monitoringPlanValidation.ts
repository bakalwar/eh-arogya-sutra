import {
  RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION,
  RULE5_MONITORING_PLAN_FIELD_COUNT,
  RULE5_MONITORING_PLAN_FIELD_SPECS,
  RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_OWNER_ANCHOR,
  RULE5_MONITORING_PLAN_FIELD_OWNER_ANCHOR,
  RULE5_MONITORING_PLAN_FIELD_REPRESENTATION,
  RULE5_MONITORING_PLAN_SCHEMA_KIND,
  type Rule5MonitoringPlanFieldDefinition,
  type Rule5MonitoringPlanSchemaDefinition,
} from './monitoringPlanSchema.js';
import {
  RULE5_CANONICAL_MISSING_MONITORING_PLAN_POLICY,
  RULE5_MISSING_PLAN_OWNER_ANCHOR,
  RULE5_MISSING_PLAN_REASON_CODE,
  RULE5_MISSING_PLAN_REQUIRED_ACTION_REFERENCE,
  RULE5_MISSING_PLAN_STATUS_REFERENCE,
  type Rule5MissingMonitoringPlanPolicy,
} from './missingMonitoringPlanPolicy.js';
import { RULE5_MATRIX_EVIDENCE_GATE, RULE5_MATRIX_THRESHOLD_POLICY } from './hardBlockerMatrix.js';
import { isKnownRule5ClinicalReasonCode } from './reasonCodes.js';
import {
  RULE5_MONITORING_PLAN_FINGERPRINT_VERSION,
  RULE5_MONITORING_PLAN_SCHEMA_VERSION,
} from './version.js';
import type { Rule5ClinicianReviewPolicy } from './monitoringPlanSchema.js';

export type Rule5MonitoringPlanValidationFailureCode =
  | 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'
  | 'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD'
  | 'RULE5_MONITORING_PLAN_MISSING_MANDATORY_FIELD'
  | 'RULE5_MONITORING_PLAN_WHITESPACE_ONLY_FIELD'
  | 'RULE5_MONITORING_PLAN_INVALID_SCHEMA_VERSION'
  | 'RULE5_MONITORING_PLAN_WRONG_SCHEMA_KIND'
  | 'RULE5_MONITORING_PLAN_IMPLEMENTED_NOT_ALLOWED'
  | 'RULE5_MONITORING_PLAN_CONNECTED_NOT_ALLOWED'
  | 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED'
  | 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'
  | 'RULE5_MONITORING_PLAN_WRONG_FIELD_COUNT'
  | 'RULE5_MONITORING_PLAN_FIELD_ORDER_MISMATCH'
  | 'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH'
  | 'RULE5_MONITORING_PLAN_NON_NULL_REFERENCE'
  | 'RULE5_MONITORING_PLAN_WRONG_THRESHOLD_POLICY'
  | 'RULE5_MONITORING_PLAN_WRONG_EVIDENCE_POLICY'
  | 'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH'
  | 'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH'
  | 'RULE5_MONITORING_PLAN_WRONG_FINGERPRINT_VERSION'
  | 'RULE5_MONITORING_PLAN_FINGERPRINT_MUST_BE_NULL'
  | 'RULE5_MONITORING_PLAN_CANONICAL_MISMATCH'
  | 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'
  | 'RULE5_MONITORING_PLAN_NUMERIC_VALUE_FORBIDDEN'
  | 'RULE5_MONITORING_PLAN_RULE4_REFERENCE_FORBIDDEN'
  | 'RULE5_MONITORING_PLAN_EVIDENCE_ACTIVATION_FORBIDDEN'
  | 'RULE5_MONITORING_PLAN_INVALID_REASON_CODE';

export class Rule5MonitoringPlanValidationError extends Error {
  readonly failureCode: Rule5MonitoringPlanValidationFailureCode;
  /** Static safe field path only — never caller-provided values. */
  readonly detail?: string;

  constructor(failureCode: Rule5MonitoringPlanValidationFailureCode, safeDetail?: string) {
    super(safeDetail ? `${failureCode}: ${safeDetail}` : failureCode);
    this.name = 'Rule5MonitoringPlanValidationError';
    this.failureCode = failureCode;
    this.detail = safeDetail;
  }
}

const ROOT_KEYS = new Set([
  'schemaVersion',
  'schemaKind',
  'implemented',
  'connected',
  'executable',
  'clinicalValuesAuthorized',
  'thresholdValuesAuthorized',
  'timingValuesAuthorized',
  'freeTextAuthorized',
  'patientIdentifiersAuthorized',
  'clinicianIdentifiersAuthorized',
  'fields',
  'thresholdPolicy',
  'evidencePolicy',
  'missingPlanPolicy',
  'clinicianReviewPolicy',
  'fingerprintVersion',
  'deterministicFingerprint',
]);

const FIELD_KEYS = new Set([
  'fieldId',
  'fieldKey',
  'ownerLabel',
  'representation',
  'reference',
  'clinicalValueAuthorized',
  'executable',
  'ownerDecisionAnchor',
]);

const MISSING_PLAN_KEYS = new Set([
  'reasonCode',
  'statusReference',
  'requiredActionReference',
  'noPass',
  'noAutoContinue',
  'executable',
  'ownerDecisionAnchor',
]);

const CLINICIAN_REVIEW_KEYS = new Set([
  'clinicianReviewRequired',
  'acknowledgmentIsNotPass',
  'restartRequiresNewReviewedPlan',
  'executionAuthorized',
  'clinicianIdentityAuthorized',
  'ownerDecisionAnchor',
]);

const FORBIDDEN_KEY_NAMES = new Set([
  'patientId',
  'patientName',
  'caseId',
  'consultationId',
  'tenantId',
  'requestId',
  'validationRunId',
  'correlationId',
  'symptoms',
  'diagnosis',
  'vitals',
  'labs',
  'monitoringPlanVersionId',
  'evidence',
  'evidenceCatalog',
  'evidenceBody',
  'adverseEvent',
  'medicine',
  'mixture',
  'potency',
  'dosage',
  'threshold',
  'cutoff',
  'interval',
  'duration',
  'phone',
  'email',
  'license',
  'signature',
  'phi',
  'instructionText',
  'clinicianName',
]);

const RULE4_FORBIDDEN_PATTERN = /^(TH-\d{2}|DA-\d{2})$/;

const EVIDENCE_FORBIDDEN_LITERALS = new Set([
  'EVIDENCE_CATALOG_ACTIVE',
  'EVIDENCE_ACTIVE',
  'ACTIVE_EVIDENCE',
]);

function assertPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnexpectedKeys(
  raw: Record<string, unknown>,
  allowed: Set<string>,
  failure: Rule5MonitoringPlanValidationFailureCode = 'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD',
): void {
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      throw new Rule5MonitoringPlanValidationError(failure, 'unexpectedField');
    }
  }
}

function requireNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_MISSING_MANDATORY_FIELD',
      field,
    );
  }
  if (value.trim() === '') {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_WHITESPACE_ONLY_FIELD',
      field,
    );
  }
}

function assertFalseFlag(value: unknown, code: Rule5MonitoringPlanValidationFailureCode): void {
  if (value !== false) {
    throw new Rule5MonitoringPlanValidationError(code);
  }
}

function assertTrueFlag(
  value: unknown,
  code: Rule5MonitoringPlanValidationFailureCode,
  field?: string,
): void {
  if (value !== true) {
    throw new Rule5MonitoringPlanValidationError(code, field);
  }
}

function rejectNumericAndRule4Nested(value: unknown, path: string): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'number') {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_NUMERIC_VALUE_FORBIDDEN',
      path,
    );
  }
  if (typeof value === 'string') {
    if (RULE4_FORBIDDEN_PATTERN.test(value)) {
      throw new Rule5MonitoringPlanValidationError(
        'RULE5_MONITORING_PLAN_RULE4_REFERENCE_FORBIDDEN',
        path,
      );
    }
    if (EVIDENCE_FORBIDDEN_LITERALS.has(value)) {
      throw new Rule5MonitoringPlanValidationError(
        'RULE5_MONITORING_PLAN_EVIDENCE_ACTIVATION_FORBIDDEN',
        path,
      );
    }
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => rejectNumericAndRule4Nested(item, `${path}[${i}]`));
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEY_NAMES.has(k)) {
        throw new Rule5MonitoringPlanValidationError(
          'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
          'forbiddenField',
        );
      }
      if (RULE4_FORBIDDEN_PATTERN.test(k)) {
        throw new Rule5MonitoringPlanValidationError(
          'RULE5_MONITORING_PLAN_RULE4_REFERENCE_FORBIDDEN',
          'forbiddenField',
        );
      }
      rejectNumericAndRule4Nested(v, `${path}.${k}`);
    }
  }
}

function validateMissingPlanPolicyRaw(raw: unknown): Rule5MissingMonitoringPlanPolicy {
  if (!assertPlainObject(raw)) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_INVALID_DOCUMENT',
      'missingPlanPolicy',
    );
  }
  rejectUnexpectedKeys(raw, MISSING_PLAN_KEYS, 'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD');
  requireNonEmptyString(raw.reasonCode, 'missingPlanPolicy.reasonCode');
  if (raw.reasonCode !== RULE5_MISSING_PLAN_REASON_CODE) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
      'reasonCode',
    );
  }
  if (!isKnownRule5ClinicalReasonCode(raw.reasonCode)) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_INVALID_REASON_CODE',
      'reasonCode',
    );
  }
  requireNonEmptyString(raw.statusReference, 'missingPlanPolicy.statusReference');
  if (raw.statusReference !== RULE5_MISSING_PLAN_STATUS_REFERENCE) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
      'statusReference',
    );
  }
  requireNonEmptyString(raw.requiredActionReference, 'missingPlanPolicy.requiredActionReference');
  if (raw.requiredActionReference !== RULE5_MISSING_PLAN_REQUIRED_ACTION_REFERENCE) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
      'requiredActionReference',
    );
  }
  assertTrueFlag(
    raw.noPass,
    'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
    'missingPlanPolicy.noPass',
  );
  assertTrueFlag(
    raw.noAutoContinue,
    'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
    'missingPlanPolicy.noAutoContinue',
  );
  assertFalseFlag(raw.executable, 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED');
  requireNonEmptyString(raw.ownerDecisionAnchor, 'missingPlanPolicy.ownerDecisionAnchor');
  if (raw.ownerDecisionAnchor !== RULE5_MISSING_PLAN_OWNER_ANCHOR) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
      'ownerDecisionAnchor',
    );
  }
  return RULE5_CANONICAL_MISSING_MONITORING_PLAN_POLICY;
}

function validateClinicianReviewPolicyRaw(raw: unknown): Rule5ClinicianReviewPolicy {
  if (!assertPlainObject(raw)) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_INVALID_DOCUMENT',
      'clinicianReviewPolicy',
    );
  }
  rejectUnexpectedKeys(raw, CLINICIAN_REVIEW_KEYS, 'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD');
  assertTrueFlag(
    raw.clinicianReviewRequired,
    'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH',
    'clinicianReviewPolicy.clinicianReviewRequired',
  );
  assertTrueFlag(
    raw.acknowledgmentIsNotPass,
    'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH',
    'clinicianReviewPolicy.acknowledgmentIsNotPass',
  );
  assertTrueFlag(
    raw.restartRequiresNewReviewedPlan,
    'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH',
    'clinicianReviewPolicy.restartRequiresNewReviewedPlan',
  );
  assertFalseFlag(raw.executionAuthorized, 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED');
  assertFalseFlag(
    raw.clinicianIdentityAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  requireNonEmptyString(raw.ownerDecisionAnchor, 'clinicianReviewPolicy.ownerDecisionAnchor');
  if (raw.ownerDecisionAnchor !== RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_OWNER_ANCHOR) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH',
      'ownerDecisionAnchor',
    );
  }
  return RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION.clinicianReviewPolicy;
}

function validateFieldDefinitionRaw(raw: unknown, index: number): void {
  const path = `fields[${index}]`;
  if (!assertPlainObject(raw)) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_INVALID_DOCUMENT', path);
  }
  rejectUnexpectedKeys(raw, FIELD_KEYS, 'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD');
  const expected = RULE5_MONITORING_PLAN_FIELD_SPECS[index];
  if (!expected) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_WRONG_FIELD_COUNT');
  }
  requireNonEmptyString(raw.fieldId, `${path}.fieldId`);
  requireNonEmptyString(raw.fieldKey, `${path}.fieldKey`);
  requireNonEmptyString(raw.ownerLabel, `${path}.ownerLabel`);
  if (raw.fieldId !== expected.fieldId) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
      `${path}.fieldId`,
    );
  }
  if (raw.fieldKey !== expected.fieldKey) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
      `${path}.fieldKey`,
    );
  }
  if (raw.ownerLabel !== expected.ownerLabel) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
      `${path}.ownerLabel`,
    );
  }
  requireNonEmptyString(raw.representation, `${path}.representation`);
  if (raw.representation !== RULE5_MONITORING_PLAN_FIELD_REPRESENTATION) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
      `${path}.representation`,
    );
  }
  if (raw.reference !== null) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_NON_NULL_REFERENCE', path);
  }
  assertFalseFlag(
    raw.clinicalValueAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  assertFalseFlag(raw.executable, 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED');
  requireNonEmptyString(raw.ownerDecisionAnchor, `${path}.ownerDecisionAnchor`);
  if (raw.ownerDecisionAnchor !== RULE5_MONITORING_PLAN_FIELD_OWNER_ANCHOR) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
      `${path}.ownerDecisionAnchor`,
    );
  }
}

function fieldsMatchCanonical(fields: readonly Rule5MonitoringPlanFieldDefinition[]): boolean {
  const canon = RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION.fields;
  if (fields.length !== canon.length) return false;
  for (let i = 0; i < canon.length; i++) {
    const a = fields[i]!;
    const b = canon[i]!;
    if (
      a.fieldId !== b.fieldId ||
      a.fieldKey !== b.fieldKey ||
      a.ownerLabel !== b.ownerLabel ||
      a.representation !== b.representation ||
      a.reference !== b.reference ||
      a.clinicalValueAuthorized !== b.clinicalValueAuthorized ||
      a.executable !== b.executable ||
      a.ownerDecisionAnchor !== b.ownerDecisionAnchor
    ) {
      return false;
    }
  }
  return true;
}

export function validateRule5MonitoringPlanSchemaDefinitionDocument(
  rawDocument: unknown,
): Rule5MonitoringPlanSchemaDefinition {
  if (!assertPlainObject(rawDocument)) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_INVALID_DOCUMENT');
  }
  rejectNumericAndRule4Nested(rawDocument, 'root');
  rejectUnexpectedKeys(rawDocument, ROOT_KEYS);
  requireNonEmptyString(rawDocument.schemaVersion, 'schemaVersion');
  if (rawDocument.schemaVersion !== RULE5_MONITORING_PLAN_SCHEMA_VERSION) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_INVALID_SCHEMA_VERSION',
      'schemaVersion',
    );
  }
  requireNonEmptyString(rawDocument.schemaKind, 'schemaKind');
  if (rawDocument.schemaKind !== RULE5_MONITORING_PLAN_SCHEMA_KIND) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_WRONG_SCHEMA_KIND',
      'schemaKind',
    );
  }
  assertFalseFlag(rawDocument.implemented, 'RULE5_MONITORING_PLAN_IMPLEMENTED_NOT_ALLOWED');
  assertFalseFlag(rawDocument.connected, 'RULE5_MONITORING_PLAN_CONNECTED_NOT_ALLOWED');
  assertFalseFlag(rawDocument.executable, 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED');
  assertFalseFlag(
    rawDocument.clinicalValuesAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.thresholdValuesAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.timingValuesAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.freeTextAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.patientIdentifiersAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  assertFalseFlag(
    rawDocument.clinicianIdentifiersAuthorized,
    'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
  );
  if (!Array.isArray(rawDocument.fields)) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_INVALID_DOCUMENT',
      'fields',
    );
  }
  if (rawDocument.fields.length !== RULE5_MONITORING_PLAN_FIELD_COUNT) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_WRONG_FIELD_COUNT');
  }
  for (let i = 0; i < rawDocument.fields.length; i++) {
    validateFieldDefinitionRaw(rawDocument.fields[i], i);
  }
  requireNonEmptyString(rawDocument.thresholdPolicy, 'thresholdPolicy');
  if (rawDocument.thresholdPolicy !== RULE5_MATRIX_THRESHOLD_POLICY) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_WRONG_THRESHOLD_POLICY',
      'thresholdPolicy',
    );
  }
  requireNonEmptyString(rawDocument.evidencePolicy, 'evidencePolicy');
  if (rawDocument.evidencePolicy !== RULE5_MATRIX_EVIDENCE_GATE) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_WRONG_EVIDENCE_POLICY',
      'evidencePolicy',
    );
  }
  validateMissingPlanPolicyRaw(rawDocument.missingPlanPolicy);
  validateClinicianReviewPolicyRaw(rawDocument.clinicianReviewPolicy);
  requireNonEmptyString(rawDocument.fingerprintVersion, 'fingerprintVersion');
  if (rawDocument.fingerprintVersion !== RULE5_MONITORING_PLAN_FINGERPRINT_VERSION) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_WRONG_FINGERPRINT_VERSION',
      'fingerprintVersion',
    );
  }
  if (rawDocument.deterministicFingerprint !== null) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_FINGERPRINT_MUST_BE_NULL');
  }
  const canonical = RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION;
  if (
    rawDocument.schemaVersion !== canonical.schemaVersion ||
    rawDocument.schemaKind !== canonical.schemaKind ||
    rawDocument.implemented !== canonical.implemented ||
    rawDocument.connected !== canonical.connected ||
    rawDocument.executable !== canonical.executable ||
    rawDocument.clinicalValuesAuthorized !== canonical.clinicalValuesAuthorized ||
    rawDocument.thresholdValuesAuthorized !== canonical.thresholdValuesAuthorized ||
    rawDocument.timingValuesAuthorized !== canonical.timingValuesAuthorized ||
    rawDocument.freeTextAuthorized !== canonical.freeTextAuthorized ||
    rawDocument.patientIdentifiersAuthorized !== canonical.patientIdentifiersAuthorized ||
    rawDocument.clinicianIdentifiersAuthorized !== canonical.clinicianIdentifiersAuthorized ||
    rawDocument.thresholdPolicy !== canonical.thresholdPolicy ||
    rawDocument.evidencePolicy !== canonical.evidencePolicy ||
    rawDocument.fingerprintVersion !== canonical.fingerprintVersion ||
    rawDocument.deterministicFingerprint !== canonical.deterministicFingerprint
  ) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_CANONICAL_MISMATCH',
      'root',
    );
  }
  if (!fieldsMatchCanonical(rawDocument.fields as Rule5MonitoringPlanFieldDefinition[])) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_FIELD_ORDER_MISMATCH');
  }
  return canonical;
}

/** Validate arbitrary document shape (e.g. rejection tests) without requiring full canonical parity. */
export function validateRule5MonitoringPlanSchemaDefinitionShape(rawDocument: unknown): void {
  if (!assertPlainObject(rawDocument)) {
    throw new Rule5MonitoringPlanValidationError('RULE5_MONITORING_PLAN_INVALID_DOCUMENT');
  }
  rejectNumericAndRule4Nested(rawDocument, 'root');
  rejectUnexpectedKeys(rawDocument, ROOT_KEYS);
  requireNonEmptyString(rawDocument.schemaVersion, 'schemaVersion');
  if (rawDocument.schemaVersion !== RULE5_MONITORING_PLAN_SCHEMA_VERSION) {
    throw new Rule5MonitoringPlanValidationError(
      'RULE5_MONITORING_PLAN_INVALID_SCHEMA_VERSION',
      'schemaVersion',
    );
  }
}
