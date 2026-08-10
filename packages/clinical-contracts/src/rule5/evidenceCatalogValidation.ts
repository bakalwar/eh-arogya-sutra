import {
  RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG,
  type Rule5EmptyEvidenceCatalogEnvelope,
  type Rule5EmptyEvidenceCatalogEntries,
} from './evidenceCatalogSchema.js';
import { RULE5_MATRIX_EVIDENCE_GATE, RULE5_MATRIX_THRESHOLD_POLICY } from './hardBlockerMatrix.js';
import { RULE5_EVIDENCE_CATALOG_SCHEMA_KIND, RULE5_EVIDENCE_CATALOG_VERSION } from './version.js';

export type Rule5EvidenceCatalogValidationFailureCode =
  | 'RULE5_EVIDENCE_CATALOG_INVALID_DOCUMENT'
  | 'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD'
  | 'RULE5_EVIDENCE_CATALOG_MISSING_MANDATORY_FIELD'
  | 'RULE5_EVIDENCE_CATALOG_WHITESPACE_ONLY_FIELD'
  | 'RULE5_EVIDENCE_CATALOG_INVALID_SCHEMA_VERSION'
  | 'RULE5_EVIDENCE_CATALOG_WRONG_SCHEMA_KIND'
  | 'RULE5_EVIDENCE_CATALOG_IMPLEMENTED_NOT_ALLOWED'
  | 'RULE5_EVIDENCE_CATALOG_CONNECTED_NOT_ALLOWED'
  | 'RULE5_EVIDENCE_CATALOG_EXECUTABLE_NOT_ALLOWED'
  | 'RULE5_EVIDENCE_CATALOG_AFFECTS_CLINICAL_SELECTION_NOT_ALLOWED'
  | 'RULE5_EVIDENCE_CATALOG_WRONG_THRESHOLD_POLICY'
  | 'RULE5_EVIDENCE_CATALOG_WRONG_EVIDENCE_POLICY'
  | 'RULE5_EVIDENCE_CATALOG_CATALOG_ROW_COUNT_NONZERO'
  | 'RULE5_EVIDENCE_CATALOG_ENTRIES_NOT_EMPTY'
  | 'RULE5_EVIDENCE_CATALOG_ENTRY_OBJECT_NOT_ALLOWED'
  | 'RULE5_EVIDENCE_CATALOG_FINGERPRINT_MUST_BE_NULL'
  | 'RULE5_EVIDENCE_CATALOG_FINGERPRINT_VERSION_NOT_ALLOWED'
  | 'RULE5_EVIDENCE_CATALOG_CANONICAL_MISMATCH'
  | 'RULE5_EVIDENCE_CATALOG_FORBIDDEN_CLINICAL_FIELD'
  | 'RULE5_EVIDENCE_CATALOG_NUMERIC_VALUE_FORBIDDEN'
  | 'RULE5_EVIDENCE_CATALOG_RULE4_REFERENCE_FORBIDDEN'
  | 'RULE5_EVIDENCE_CATALOG_EVIDENCE_ACTIVATION_FORBIDDEN'
  | 'RULE5_EVIDENCE_CATALOG_LIFECYCLE_ACTIVE_NOT_ALLOWED'
  | 'RULE5_EVIDENCE_CATALOG_APPROVAL_AXIS_FIELD_FORBIDDEN'
  | 'RULE5_EVIDENCE_CATALOG_EVIDENCE_ID_FIELD_FORBIDDEN'
  | 'RULE5_EVIDENCE_CATALOG_ROW_ID_FIELD_FORBIDDEN';

export class Rule5EvidenceCatalogValidationError extends Error {
  readonly failureCode: Rule5EvidenceCatalogValidationFailureCode;
  readonly detail?: string;

  constructor(failureCode: Rule5EvidenceCatalogValidationFailureCode, safeDetail?: string) {
    super(safeDetail ? `${failureCode}: ${safeDetail}` : failureCode);
    this.name = 'Rule5EvidenceCatalogValidationError';
    this.failureCode = failureCode;
    this.detail = safeDetail;
  }
}

const ROOT_KEYS = new Set([
  'schemaVersion',
  'schemaKind',
  'evidencePolicy',
  'thresholdPolicy',
  'catalogRowCount',
  'entries',
  'implemented',
  'connected',
  'executable',
  'affectsClinicalSelection',
  'deterministicFingerprint',
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
  'route',
  'electricity',
  'timing',
  'monitoring',
  'lifecycleState',
  'sourcePresent',
  'provenanceVerified',
  'licenseVerified',
  'schemaValidated',
  'clinicallyValidated',
  'ownerApproved',
  'activationApproved',
  'evidenceId',
  'rowId',
  'catalogRowId',
  'fingerprintVersion',
  'fields',
  'clinicalValuesAuthorized',
  'thresholdValuesAuthorized',
  'timingValuesAuthorized',
]);

const RULE4_FORBIDDEN_PATTERN = /^(TH-\d{2}|DA-\d{2})$/;

const EVIDENCE_FORBIDDEN_LITERALS = new Set([
  'EVIDENCE_CATALOG_ACTIVE',
  'EVIDENCE_ACTIVE',
  'ACTIVE_EVIDENCE',
  'ACTIVE',
]);

const APPROVAL_AXIS_KEYS = new Set([
  'clinicallyValidated',
  'ownerApproved',
  'activationApproved',
  'sourcePresent',
  'provenanceVerified',
  'licenseVerified',
  'schemaValidated',
]);

function assertPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnexpectedKeys(
  raw: Record<string, unknown>,
  allowed: Set<string>,
  failure: Rule5EvidenceCatalogValidationFailureCode = 'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
): void {
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      throw new Rule5EvidenceCatalogValidationError(failure, 'unexpectedField');
    }
  }
}

function requireNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_MISSING_MANDATORY_FIELD',
      field,
    );
  }
  if (value.trim() === '') {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_WHITESPACE_ONLY_FIELD',
      field,
    );
  }
}

function assertFalseFlag(value: unknown, code: Rule5EvidenceCatalogValidationFailureCode): void {
  if (value !== false) {
    throw new Rule5EvidenceCatalogValidationError(code);
  }
}

function rejectForbiddenNested(
  value: unknown,
  path: string,
  allowCatalogRowCountZero: boolean,
): void {
  if (value === null || value === undefined) return;

  if (typeof value === 'number') {
    if (allowCatalogRowCountZero && path === 'catalogRowCount' && value === 0) {
      return;
    }
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_NUMERIC_VALUE_FORBIDDEN',
      path,
    );
  }

  if (typeof value === 'string') {
    if (RULE4_FORBIDDEN_PATTERN.test(value)) {
      throw new Rule5EvidenceCatalogValidationError(
        'RULE5_EVIDENCE_CATALOG_RULE4_REFERENCE_FORBIDDEN',
        path,
      );
    }
    if (EVIDENCE_FORBIDDEN_LITERALS.has(value)) {
      if (value === 'ACTIVE') {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_LIFECYCLE_ACTIVE_NOT_ALLOWED',
          path,
        );
      }
      throw new Rule5EvidenceCatalogValidationError(
        'RULE5_EVIDENCE_CATALOG_EVIDENCE_ACTIVATION_FORBIDDEN',
        path,
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    if (path === 'entries') {
      if (value.length !== 0) {
        throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_ENTRIES_NOT_EMPTY');
      }
      return;
    }
    value.forEach((item, i) => rejectForbiddenNested(item, `${path}[${i}]`, false));
    return;
  }

  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'evidenceId') {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_EVIDENCE_ID_FIELD_FORBIDDEN',
          path,
        );
      }
      if (k === 'rowId' || k === 'catalogRowId') {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_ROW_ID_FIELD_FORBIDDEN',
          path,
        );
      }
      if (APPROVAL_AXIS_KEYS.has(k)) {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_APPROVAL_AXIS_FIELD_FORBIDDEN',
          k,
        );
      }
      if (k === 'lifecycleState') {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_LIFECYCLE_ACTIVE_NOT_ALLOWED',
          k,
        );
      }
      if (k === 'fingerprintVersion') {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_FINGERPRINT_VERSION_NOT_ALLOWED',
          k,
        );
      }
      if (FORBIDDEN_KEY_NAMES.has(k)) {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_FORBIDDEN_CLINICAL_FIELD',
          k,
        );
      }
      if (RULE4_FORBIDDEN_PATTERN.test(k)) {
        throw new Rule5EvidenceCatalogValidationError(
          'RULE5_EVIDENCE_CATALOG_RULE4_REFERENCE_FORBIDDEN',
          k,
        );
      }
      rejectForbiddenNested(v, `${path}.${k}`, false);
    }
  }
}

function entriesExactlyEmpty(raw: unknown): Rule5EmptyEvidenceCatalogEntries {
  if (!Array.isArray(raw)) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_INVALID_DOCUMENT',
      'entries',
    );
  }
  if (raw.length !== 0) {
    throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_ENTRIES_NOT_EMPTY');
  }
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (item !== null && typeof item === 'object') {
      throw new Rule5EvidenceCatalogValidationError(
        'RULE5_EVIDENCE_CATALOG_ENTRY_OBJECT_NOT_ALLOWED',
      );
    }
  }
  return Object.freeze([]) as Rule5EmptyEvidenceCatalogEntries;
}

function assertCanonicalMatch(
  doc: Rule5EmptyEvidenceCatalogEnvelope,
): Rule5EmptyEvidenceCatalogEnvelope {
  const canon = RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG;
  if (doc.schemaVersion !== canon.schemaVersion) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_CANONICAL_MISMATCH',
      'schemaVersion',
    );
  }
  if (doc.schemaKind !== canon.schemaKind) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_CANONICAL_MISMATCH',
      'schemaKind',
    );
  }
  if (doc.evidencePolicy !== canon.evidencePolicy) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_CANONICAL_MISMATCH',
      'evidencePolicy',
    );
  }
  if (doc.thresholdPolicy !== canon.thresholdPolicy) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_CANONICAL_MISMATCH',
      'thresholdPolicy',
    );
  }
  if (doc.catalogRowCount !== 0) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_CATALOG_ROW_COUNT_NONZERO',
    );
  }
  if (doc.entries.length !== 0) {
    throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_ENTRIES_NOT_EMPTY');
  }
  if (doc.implemented !== false || doc.connected !== false || doc.executable !== false) {
    throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_CANONICAL_MISMATCH');
  }
  if (doc.affectsClinicalSelection !== false) {
    throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_CANONICAL_MISMATCH');
  }
  if (doc.deterministicFingerprint !== null) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_FINGERPRINT_MUST_BE_NULL',
    );
  }
  return RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG;
}

export function validateRule5EmptyEvidenceCatalogDocument(
  rawDocument: unknown,
): Rule5EmptyEvidenceCatalogEnvelope {
  if (!assertPlainObject(rawDocument)) {
    throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_INVALID_DOCUMENT');
  }

  rejectUnexpectedKeys(rawDocument, ROOT_KEYS);

  if (typeof rawDocument.catalogRowCount !== 'number') {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_MISSING_MANDATORY_FIELD',
      'catalogRowCount',
    );
  }
  if (rawDocument.catalogRowCount !== 0) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_CATALOG_ROW_COUNT_NONZERO',
    );
  }

  for (const [key, value] of Object.entries(rawDocument)) {
    if (key === 'entries') {
      continue;
    }
    rejectForbiddenNested(value, key, key === 'catalogRowCount');
  }

  requireNonEmptyString(rawDocument.schemaVersion, 'schemaVersion');
  if (rawDocument.schemaVersion !== RULE5_EVIDENCE_CATALOG_VERSION) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_INVALID_SCHEMA_VERSION',
      'schemaVersion',
    );
  }

  requireNonEmptyString(rawDocument.schemaKind, 'schemaKind');
  if (rawDocument.schemaKind !== RULE5_EVIDENCE_CATALOG_SCHEMA_KIND) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_WRONG_SCHEMA_KIND',
      'schemaKind',
    );
  }

  requireNonEmptyString(rawDocument.evidencePolicy, 'evidencePolicy');
  if (rawDocument.evidencePolicy !== RULE5_MATRIX_EVIDENCE_GATE) {
    throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_WRONG_EVIDENCE_POLICY');
  }

  requireNonEmptyString(rawDocument.thresholdPolicy, 'thresholdPolicy');
  if (rawDocument.thresholdPolicy !== RULE5_MATRIX_THRESHOLD_POLICY) {
    throw new Rule5EvidenceCatalogValidationError('RULE5_EVIDENCE_CATALOG_WRONG_THRESHOLD_POLICY');
  }

  const entries = entriesExactlyEmpty(rawDocument.entries);

  assertFalseFlag(rawDocument.implemented, 'RULE5_EVIDENCE_CATALOG_IMPLEMENTED_NOT_ALLOWED');
  assertFalseFlag(rawDocument.connected, 'RULE5_EVIDENCE_CATALOG_CONNECTED_NOT_ALLOWED');
  assertFalseFlag(rawDocument.executable, 'RULE5_EVIDENCE_CATALOG_EXECUTABLE_NOT_ALLOWED');
  assertFalseFlag(
    rawDocument.affectsClinicalSelection,
    'RULE5_EVIDENCE_CATALOG_AFFECTS_CLINICAL_SELECTION_NOT_ALLOWED',
  );

  if (rawDocument.deterministicFingerprint !== null) {
    throw new Rule5EvidenceCatalogValidationError(
      'RULE5_EVIDENCE_CATALOG_FINGERPRINT_MUST_BE_NULL',
    );
  }

  const parsed: Rule5EmptyEvidenceCatalogEnvelope = {
    schemaVersion: RULE5_EVIDENCE_CATALOG_VERSION,
    schemaKind: RULE5_EVIDENCE_CATALOG_SCHEMA_KIND,
    evidencePolicy: RULE5_MATRIX_EVIDENCE_GATE,
    thresholdPolicy: RULE5_MATRIX_THRESHOLD_POLICY,
    catalogRowCount: 0,
    entries,
    implemented: false,
    connected: false,
    executable: false,
    affectsClinicalSelection: false,
    deterministicFingerprint: null,
  };

  return assertCanonicalMatch(parsed);
}
