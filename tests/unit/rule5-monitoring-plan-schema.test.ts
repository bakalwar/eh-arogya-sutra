import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
  RULE5_CANONICAL_CONTRACT_FOUNDATION,
  RULE5_CANONICAL_MISSING_MONITORING_PLAN_POLICY,
  RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION,
  RULE5_CLINICAL_REASON_CODES,
  RULE5_CONTRACT_VERSION,
  RULE5_FINGERPRINT_VERSION,
  RULE5_HARD_BLOCKER_CONDITION_COUNT,
  RULE5_HARD_BLOCKER_MAPPING_COUNT,
  RULE5_HARD_BLOCKER_MATRIX_VERSION,
  RULE5_MATRIX_EVIDENCE_GATE,
  RULE5_MATRIX_THRESHOLD_POLICY,
  RULE5_MISSING_PLAN_REASON_CODE,
  RULE5_MONITORING_PLAN_FIELD_COUNT,
  RULE5_MONITORING_PLAN_FIELD_SPECS,
  RULE5_MONITORING_PLAN_FINGERPRINT_VERSION,
  RULE5_MONITORING_PLAN_SCHEMA_VERSION,
  RULE5_REASON_REGISTRY_VERSION,
  RULE_SET_VERSION,
  Rule5MonitoringPlanValidationError,
  createNotConnectedAnalyzeResult,
  serializeRule5ContractFoundationDocument,
  serializeRule5MonitoringPlanSchemaDefinition,
  serializeRule5MonitoringPlanSchemaFingerprintFoundation,
  validateRule5ContractFoundationDocument,
  validateRule5HardBlockerMatrixDocument,
  validateRule5MonitoringPlanSchemaDefinitionDocument,
  validateRule5MonitoringPlanSchemaDefinitionShape,
} from '../../packages/clinical-contracts/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, 'fixtures/rule5/monitoring-plan-schema.v1.json');
const m4FixturePath = path.join(root, 'fixtures/rule5/contract-foundation.v1.json');
const rule5IndexSourcePath = path.join(root, 'packages/clinical-contracts/src/rule5/index.ts');
const m5Modules = [
  'monitoringPlanSchema.ts',
  'monitoringPlanValidation.ts',
  'monitoringPlanSerialization.ts',
  'missingMonitoringPlanPolicy.ts',
];

function readFixture(): unknown {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as unknown;
}

function schemaFromFixture(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(readFixture())) as Record<string, unknown>;
}

function expectM5Failure(
  fn: () => void,
  code: Rule5MonitoringPlanValidationError['failureCode'],
): Rule5MonitoringPlanValidationError {
  try {
    fn();
    expect.fail('expected monitoring plan validation error');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule5MonitoringPlanValidationError);
    expect((e as Rule5MonitoringPlanValidationError).failureCode).toBe(code);
    return e as Rule5MonitoringPlanValidationError;
  }
}

const SYNTHETIC_PRIVATE_TEXT_5550001111 = 'SYNTHETIC_PRIVATE_TEXT_5550001111';

function assertErrorDoesNotEchoRawValue(
  error: Rule5MonitoringPlanValidationError,
  raw: string,
): void {
  expect(error.message).not.toContain(raw);
  if (error.detail !== undefined) {
    expect(error.detail).not.toContain(raw);
  }
  expect(JSON.stringify(error)).not.toContain(raw);
  expect(`${error.name}:${error.failureCode}:${error.message}:${error.detail ?? ''}`).not.toContain(
    raw,
  );
}

function fieldsClone(): Record<string, unknown>[] {
  return JSON.parse(JSON.stringify(schemaFromFixture().fields)) as Record<string, unknown>[];
}

function withFields(fields: unknown[]): Record<string, unknown> {
  return { ...schemaFromFixture(), fields };
}

function fieldEntry(index: number, patch: Record<string, unknown> = {}): Record<string, unknown> {
  const fields = fieldsClone();
  fields[index] = { ...fields[index]!, ...patch };
  return withFields(fields);
}

describe('Rule 5 R5-M5 monitoring-plan schema foundation', () => {
  const canon = RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION;
  const missing = RULE5_CANONICAL_MISSING_MONITORING_PLAN_POLICY;

  it('defines exact schema version, kind, and authorization posture', () => {
    expect(canon.schemaVersion).toBe(RULE5_MONITORING_PLAN_SCHEMA_VERSION);
    expect(canon.schemaKind).toBe('REFERENCE_ONLY_SCHEMA_DEFINITION');
    expect(canon.implemented).toBe(false);
    expect(canon.connected).toBe(false);
    expect(canon.executable).toBe(false);
    expect(canon.clinicalValuesAuthorized).toBe(false);
    expect(canon.thresholdValuesAuthorized).toBe(false);
    expect(canon.timingValuesAuthorized).toBe(false);
    expect(canon.freeTextAuthorized).toBe(false);
    expect(canon.patientIdentifiersAuthorized).toBe(false);
    expect(canon.clinicianIdentifiersAuthorized).toBe(false);
    expect(canon.thresholdPolicy).toBe(RULE5_MATRIX_THRESHOLD_POLICY);
    expect(canon.evidencePolicy).toBe(RULE5_MATRIX_EVIDENCE_GATE);
    expect(canon.fingerprintVersion).toBe(RULE5_MONITORING_PLAN_FINGERPRINT_VERSION);
    expect(canon.deterministicFingerprint).toBe(null);
  });

  it('lists exactly 11 ordered field definitions with null references', () => {
    expect(canon.fields).toHaveLength(RULE5_MONITORING_PLAN_FIELD_COUNT);
    expect(RULE5_MONITORING_PLAN_FIELD_SPECS).toHaveLength(11);
    for (let i = 0; i < 11; i++) {
      const field = canon.fields[i]!;
      const spec = RULE5_MONITORING_PLAN_FIELD_SPECS[i]!;
      expect(field.fieldId).toBe(spec.fieldId);
      expect(field.fieldKey).toBe(spec.fieldKey);
      expect(field.ownerLabel).toBe(spec.ownerLabel);
      expect(field.representation).toBe('REFERENCE_ONLY');
      expect(field.reference).toBe(null);
      expect(field.clinicalValueAuthorized).toBe(false);
      expect(field.executable).toBe(false);
      expect(field.ownerDecisionAnchor).toBe('OD-R5-M0-003');
    }
  });

  it('embeds exact missing-plan governance metadata', () => {
    expect(missing.reasonCode).toBe(RULE5_MISSING_PLAN_REASON_CODE);
    expect(missing.reasonCode).toBe('R5_REQUIRED_MONITORING_DATA_MISSING');
    expect(missing.statusReference).toBe('STATUS_NOT_EVALUABLE');
    expect(missing.requiredActionReference).toBe('DOCTOR_REVIEW_REQUIRED');
    expect(missing.noPass).toBe(true);
    expect(missing.noAutoContinue).toBe(true);
    expect(missing.executable).toBe(false);
  });

  it('embeds exact clinician-review requirement metadata', () => {
    const review = canon.clinicianReviewPolicy;
    expect(review.clinicianReviewRequired).toBe(true);
    expect(review.acknowledgmentIsNotPass).toBe(true);
    expect(review.restartRequiresNewReviewedPlan).toBe(true);
    expect(review.executionAuthorized).toBe(false);
    expect(review.clinicianIdentityAuthorized).toBe(false);
    expect(review.ownerDecisionAnchor).toBe('OD-R5-M0-006');
  });

  it('validates JSON fixture with full TypeScript parity', () => {
    const validated = validateRule5MonitoringPlanSchemaDefinitionDocument(readFixture());
    expect(validated).toBe(canon);
    expect(serializeRule5MonitoringPlanSchemaDefinition(validated)).toBe(
      serializeRule5MonitoringPlanSchemaDefinition(
        JSON.parse(fs.readFileSync(fixturePath, 'utf8')),
      ),
    );
  });

  it('rejects unknown schema version', () => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionShape({
          ...schemaFromFixture(),
          schemaVersion: 'ehas2-rule5-monitoring-plan-schema-v0',
        }),
      'RULE5_MONITORING_PLAN_INVALID_SCHEMA_VERSION',
    );
  });

  it('rejects wrong schemaKind and authorization flags when true', () => {
    const base = schemaFromFixture();
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, schemaKind: 'ACTIVE_PLAN' }),
      'RULE5_MONITORING_PLAN_WRONG_SCHEMA_KIND',
    );
    const flags = [
      'implemented',
      'connected',
      'executable',
      'clinicalValuesAuthorized',
      'thresholdValuesAuthorized',
      'timingValuesAuthorized',
      'freeTextAuthorized',
      'patientIdentifiersAuthorized',
      'clinicianIdentifiersAuthorized',
    ] as const;
    for (const key of flags) {
      expectM5Failure(
        () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, [key]: true }),
        key === 'implemented'
          ? 'RULE5_MONITORING_PLAN_IMPLEMENTED_NOT_ALLOWED'
          : key === 'connected'
            ? 'RULE5_MONITORING_PLAN_CONNECTED_NOT_ALLOWED'
            : key === 'executable'
              ? 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED'
              : 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED',
      );
    }
  });

  it('rejects non-null field reference and reordered fields', () => {
    const base = schemaFromFixture();
    const fields = [...(base.fields as object[])];
    const first = { ...(fields[0] as object), reference: 'REF-001' };
    fields[0] = first;
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, fields }),
      'RULE5_MONITORING_PLAN_NON_NULL_REFERENCE',
    );
    const swapped = [...(base.fields as object[])];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, fields: swapped }),
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
    );
  });

  it('rejects numeric thresholds, durations, vitals, and clinical text in nested payloads', () => {
    const base = schemaFromFixture();
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, threshold: 120 }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, days: 7 }),
      'RULE5_MONITORING_PLAN_NUMERIC_VALUE_FORBIDDEN',
    );
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, vitals: { bp: 140 } }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          instructionText: 'take rest',
        }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
  });

  it('rejects patient/clinician identity and medicine fields', () => {
    const base = schemaFromFixture();
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, patientId: 'P1' }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, clinicianName: 'Dr X' }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, dosage: '5ml' }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, potency: '30C' }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
  });

  it('rejects Rule 4 TH/DA references and evidence catalog activation', () => {
    const base = schemaFromFixture();
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, 'TH-01': true }),
      'RULE5_MONITORING_PLAN_RULE4_REFERENCE_FORBIDDEN',
    );
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          evidenceCatalog: { state: 'EVIDENCE_CATALOG_ACTIVE' },
        }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          nested: { code: 'TH-02' },
        }),
      'RULE5_MONITORING_PLAN_RULE4_REFERENCE_FORBIDDEN',
    );
  });

  it('rejects wrong threshold/evidence policies and non-null fingerprint', () => {
    const base = schemaFromFixture();
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          thresholdPolicy: 'THRESHOLD_VALUES_ACTIVE',
        }),
      'RULE5_MONITORING_PLAN_WRONG_THRESHOLD_POLICY',
    );
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          evidencePolicy: 'EVIDENCE_POLICY_NOT_AUTHORIZED',
        }),
      'RULE5_MONITORING_PLAN_WRONG_EVIDENCE_POLICY',
    );
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          deterministicFingerprint: 'ABC',
        }),
      'RULE5_MONITORING_PLAN_FINGERPRINT_MUST_BE_NULL',
    );
  });

  it('rejects altered missing-plan and clinician-review policies', () => {
    const base = schemaFromFixture();
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          missingPlanPolicy: { ...(base.missingPlanPolicy as object), noPass: false },
        }),
      'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
    );
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          clinicianReviewPolicy: {
            ...(base.clinicianReviewPolicy as object),
            acknowledgmentIsNotPass: false,
          },
        }),
      'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH',
    );
  });

  it('produces identical repeated canonical serialization and null fingerprint foundation', () => {
    const a = serializeRule5MonitoringPlanSchemaDefinition();
    const b = serializeRule5MonitoringPlanSchemaDefinition();
    expect(a).toBe(b);
    const fpA = serializeRule5MonitoringPlanSchemaFingerprintFoundation();
    const fpB = serializeRule5MonitoringPlanSchemaFingerprintFoundation();
    expect(fpA).toBe(fpB);
    expect(canon.deterministicFingerprint).toBe(null);
  });

  it('deep-freezes canonical schema root and nested values', () => {
    expect(Object.isFrozen(canon)).toBe(true);
    expect(Object.isFrozen(canon.fields)).toBe(true);
    expect(Object.isFrozen(canon.fields[0])).toBe(true);
    expect(Object.isFrozen(canon.missingPlanPolicy)).toBe(true);
    expect(Object.isFrozen(canon.clinicianReviewPolicy)).toBe(true);
    expect(() => {
      (canon as { executable: boolean }).executable = true;
    }).toThrow();
  });

  it('does not export mutable Set or Map from Rule 5 barrel', async () => {
    const rule5Barrel = await import('../../packages/clinical-contracts/src/rule5/index.ts');
    for (const value of Object.values(rule5Barrel)) {
      expect(value).not.toBeInstanceOf(Set);
      expect(value).not.toBeInstanceOf(Map);
    }
  });

  it('public Rule 5 M5 modules exclude Node fs/path/crypto', () => {
    const base = path.join(root, 'packages/clinical-contracts/src/rule5');
    for (const file of m5Modules) {
      const src = fs.readFileSync(path.join(base, file), 'utf8');
      expect(src).not.toMatch(/node:fs|node:path|node:crypto|readFileSync|createHash/);
    }
    const indexSource = fs.readFileSync(rule5IndexSourcePath, 'utf8');
    expect(indexSource).not.toMatch(/node:fs|node:path|node:crypto/);
  });

  it('preserves M2 registry (34), M3 matrix (16/17), and M4 contract unchanged', () => {
    expect(RULE5_CLINICAL_REASON_CODES).toHaveLength(34);
    expect(RULE5_CANONICAL_CLINICAL_REASON_REGISTRY.entries).toHaveLength(34);
    const matrixPath = path.join(root, 'fixtures/rule5/hard-blocker-matrix.v1.json');
    const matrix = validateRule5HardBlockerMatrixDocument(
      JSON.parse(fs.readFileSync(matrixPath, 'utf8')),
    );
    expect(matrix.conditions).toHaveLength(RULE5_HARD_BLOCKER_CONDITION_COUNT);
    expect(matrix.mappings).toHaveLength(RULE5_HARD_BLOCKER_MAPPING_COUNT);
    const m4 = validateRule5ContractFoundationDocument(
      JSON.parse(fs.readFileSync(m4FixturePath, 'utf8')),
    );
    expect(m4).toBe(RULE5_CANONICAL_CONTRACT_FOUNDATION);
    expect(RULE5_CONTRACT_VERSION).toBe('ehas2-rule5-contract-v1');
    expect(RULE5_FINGERPRINT_VERSION).toBe('ehas2-rule5-contract-fingerprint-v1');
    expect(RULE5_REASON_REGISTRY_VERSION).toBe('ehas2-rule5-reason-registry-v2');
    expect(RULE5_HARD_BLOCKER_MATRIX_VERSION).toBe('ehas2-rule5-hard-blocker-matrix-v1');
  });

  it('preserves nine-rule and AnalyzeComplete boundaries', () => {
    expect(RULE_SET_VERSION).toBe('ehas2-nine-rule-interfaces-v2-rule5-monitoring');
    const analyze = createNotConnectedAnalyzeResult('r5-m5-schema-test');
    expect(analyze.status).toBe('CLINICAL_ENGINE_NOT_CONNECTED');
    expect(serializeRule5ContractFoundationDocument()).toBe(
      serializeRule5ContractFoundationDocument(JSON.parse(fs.readFileSync(m4FixturePath, 'utf8'))),
    );
  });

  it('keeps synthetic orchestrator output fingerprint stable when clinical-engine venv is present', () => {
    const pyWin = path.join(root, 'apps/clinical-engine/.venv/Scripts/python.exe');
    const pyUnix = path.join(root, 'apps/clinical-engine/.venv/bin/python');
    const py = fs.existsSync(pyWin) ? pyWin : fs.existsSync(pyUnix) ? pyUnix : null;
    if (!py) return;

    const script = `
import json, sys
from pathlib import Path
ROOT = Path(${JSON.stringify(path.join(root, 'apps/clinical-engine/src'))})
sys.path.insert(0, str(ROOT))
from ehas2_clinical_engine.orchestrator import NineRuleOrchestrator, OrchestratorRun
from ehas2_clinical_engine.disease_package import synthetic_fixture_dir
o = NineRuleOrchestrator()
run = OrchestratorRun(label='SYNTHETIC', package_dir=synthetic_fixture_dir(), allow_synthetic_package=True)
payload = {'chief_complaint': 'fever', 'symptoms': ['fever', 'weakness']}
a = o.orchestrate(payload, run)
b = o.orchestrate(payload, run)
assert a['output_fingerprint'] == b['output_fingerprint']
print(a['output_fingerprint'])
`.trim();

    const fp = execFileSync(py, ['-c', script], { encoding: 'utf8' }).trim();
    expect(fp).toMatch(/^[A-F0-9]{64}$/);
  });
});

describe('Rule 5 R5-M5 monitoring-plan rejection matrix', () => {
  it.each([
    [null, 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
    [[], 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
    ['not-an-object', 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
    [42, 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
    [true, 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
    [{}, 'RULE5_MONITORING_PLAN_MISSING_MANDATORY_FIELD'],
  ] as const)('rejects invalid root document %p', (doc, code) => {
    expectM5Failure(() => validateRule5MonitoringPlanSchemaDefinitionDocument(doc), code);
  });

  it('rejects missing schemaVersion on otherwise valid shape', () => {
    const doc = schemaFromFixture();
    delete doc.schemaVersion;
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument(doc),
      'RULE5_MONITORING_PLAN_MISSING_MANDATORY_FIELD',
    );
  });

  it.each([
    ['schemaVersion', '   ', 'RULE5_MONITORING_PLAN_WHITESPACE_ONLY_FIELD'],
    [
      'schemaVersion',
      'ehas2-rule5-monitoring-plan-schema-v0',
      'RULE5_MONITORING_PLAN_INVALID_SCHEMA_VERSION',
    ],
    ['schemaKind', 'ACTIVE_PLAN', 'RULE5_MONITORING_PLAN_WRONG_SCHEMA_KIND'],
  ] as const)('rejects root string field tamper %s', (key, value, code) => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          [key]: value,
        }),
      code,
    );
  });

  it('rejects unexpected root field', () => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          unexpectedRootField: true,
        }),
      'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD',
    );
  });

  it.each([
    ['implemented', 'RULE5_MONITORING_PLAN_IMPLEMENTED_NOT_ALLOWED'],
    ['connected', 'RULE5_MONITORING_PLAN_CONNECTED_NOT_ALLOWED'],
    ['executable', 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED'],
    ['clinicalValuesAuthorized', 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
    ['thresholdValuesAuthorized', 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
    ['timingValuesAuthorized', 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
    ['freeTextAuthorized', 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
    ['patientIdentifiersAuthorized', 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
    ['clinicianIdentifiersAuthorized', 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
  ] as const)('rejects authorization flag %s=true', (flag, code) => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          [flag]: true,
        }),
      code,
    );
  });

  it.each([
    [10, 'RULE5_MONITORING_PLAN_WRONG_FIELD_COUNT'],
    [12, 'RULE5_MONITORING_PLAN_WRONG_FIELD_COUNT'],
  ] as const)('rejects field count %i', (count, code) => {
    const fields = fieldsClone().slice(0, count === 10 ? 10 : 12);
    if (count === 12) {
      fields.push(JSON.parse(JSON.stringify(fields[0])) as Record<string, unknown>);
    }
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument(withFields(fields)),
      code,
    );
  });

  it('rejects reordered fields', () => {
    const fields = fieldsClone();
    [fields[0], fields[1]] = [fields[1]!, fields[0]!];
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument(withFields(fields)),
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
    );
  });

  it('rejects duplicate fieldId at second slot', () => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument(fieldEntry(1, { fieldId: 'MPF-001' })),
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
    );
  });

  it('rejects duplicate fieldKey at second slot', () => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument(
          fieldEntry(1, { fieldKey: 'baselineRequirements' }),
        ),
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
    );
  });

  it.each([
    [null, 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
    [[], 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
    ['primitive', 'RULE5_MONITORING_PLAN_INVALID_DOCUMENT'],
  ] as const)('rejects invalid field entry %p', (entry, code) => {
    const fields = fieldsClone();
    fields[0] = entry as unknown as Record<string, unknown>;
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument(withFields(fields)),
      code,
    );
  });

  it('rejects extra property on field entry', () => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument(
          fieldEntry(0, { unexpectedFieldProperty: true }),
        ),
      'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD',
    );
  });

  it.each([
    [{ fieldId: 'MPF-999' }, 'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH'],
    [{ fieldKey: 'wrongFieldKey' }, 'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH'],
    [{ ownerLabel: 'Tampered label' }, 'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH'],
    [{ ownerLabel: '   ' }, 'RULE5_MONITORING_PLAN_WHITESPACE_ONLY_FIELD'],
    [{ representation: 'ACTIVE_VALUES' }, 'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH'],
    [{ reference: 'PLAN-REF-001' }, 'RULE5_MONITORING_PLAN_NON_NULL_REFERENCE'],
    [{ reference: 42 }, 'RULE5_MONITORING_PLAN_NUMERIC_VALUE_FORBIDDEN'],
    [{ reference: { id: 'x' } }, 'RULE5_MONITORING_PLAN_NON_NULL_REFERENCE'],
    [{ clinicalValueAuthorized: true }, 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
    [{ executable: true }, 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED'],
    [{ ownerDecisionAnchor: 'OD-R5-M0-004' }, 'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH'],
  ] as const)('rejects field content tamper %o', (patch, code) => {
    expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument(fieldEntry(0, patch)),
      code,
    );
  });

  it.each([
    ['threshold', 120, 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['cutoff', 90, 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['interval', '7d', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['duration', 14, 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['symptoms', ['SYNTHETIC_SYMPTOM_TEXT'], 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['vitals', { bp: 140 }, 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['labs', { hb: 12 }, 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    [
      'instructionText',
      'SYNTHETIC_INSTRUCTION_TEXT',
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    ],
    ['patientId', 'SYNTHETIC_PATIENT_ID', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['patientName', 'SYNTHETIC_PATIENT_NAME', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['phone', '5550001111', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['email', 'synthetic@example.invalid', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['license', 'SYNTHETIC_LICENSE', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['clinicianName', 'SYNTHETIC_CLINICIAN_NAME', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['tenantId', 'SYNTHETIC_TENANT', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['caseId', 'SYNTHETIC_CASE', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['consultationId', 'SYNTHETIC_CONSULTATION', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['medicine', 'SYNTHETIC_MED', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['mixture', 'SYNTHETIC_MIX', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['potency', '30C', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['dosage', '5ml', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['evidenceCatalog', { body: 'SYNTHETIC' }, 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
    ['evidenceBody', 'SYNTHETIC_EVIDENCE_BODY', 'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD'],
  ] as const)('rejects forbidden clinical content key %s', (key, value, code) => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          [key]: value,
        }),
      code,
    );
  });

  it('rejects evidence ACTIVE policy literal before wrong-policy check', () => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          evidencePolicy: 'EVIDENCE_ACTIVE',
        }),
      'RULE5_MONITORING_PLAN_EVIDENCE_ACTIVATION_FORBIDDEN',
    );
  });

  it.each(['TH-01', 'TH-02', 'TH-03', 'TH-04'] as const)(
    'rejects Rule 4 threshold reference key %s',
    (ref) => {
      expectM5Failure(
        () =>
          validateRule5MonitoringPlanSchemaDefinitionDocument({
            ...schemaFromFixture(),
            [ref]: true,
          }),
        'RULE5_MONITORING_PLAN_RULE4_REFERENCE_FORBIDDEN',
      );
    },
  );

  it.each(['DA-01', 'DA-02', 'DA-03', 'DA-04', 'DA-05', 'DA-06', 'DA-07'] as const)(
    'rejects Rule 4 dose reference key %s',
    (ref) => {
      expectM5Failure(
        () =>
          validateRule5MonitoringPlanSchemaDefinitionDocument({
            ...schemaFromFixture(),
            [ref]: true,
          }),
        'RULE5_MONITORING_PLAN_RULE4_REFERENCE_FORBIDDEN',
      );
    },
  );

  it.each([
    ['thresholdPolicy', 'THRESHOLD_VALUES_ACTIVE', 'RULE5_MONITORING_PLAN_WRONG_THRESHOLD_POLICY'],
    [
      'evidencePolicy',
      'EVIDENCE_POLICY_NOT_AUTHORIZED',
      'RULE5_MONITORING_PLAN_WRONG_EVIDENCE_POLICY',
    ],
  ] as const)('rejects wrong %s', (key, value, code) => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          [key]: value,
        }),
      code,
    );
  });

  it.each([
    ['reasonCode', 'R5_ENGINE_MODE_INVALID', 'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH'],
    ['statusReference', 'STATUS_PASS', 'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH'],
    [
      'requiredActionReference',
      'AUTO_CONTINUE',
      'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH',
    ],
    ['ownerDecisionAnchor', 'OD-R5-M0-004', 'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH'],
    ['executable', true, 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED'],
    ['noPass', false, 'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH'],
    ['noAutoContinue', false, 'RULE5_MONITORING_PLAN_MISSING_PLAN_POLICY_MISMATCH'],
  ] as const)('rejects missing-plan policy tamper %s', (key, value, code) => {
    const base = schemaFromFixture();
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          missingPlanPolicy: { ...(base.missingPlanPolicy as object), [key]: value },
        }),
      code,
    );
  });

  it.each([
    ['clinicianReviewRequired', false, 'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH'],
    ['acknowledgmentIsNotPass', false, 'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH'],
    [
      'restartRequiresNewReviewedPlan',
      false,
      'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH',
    ],
    ['executionAuthorized', true, 'RULE5_MONITORING_PLAN_EXECUTABLE_NOT_ALLOWED'],
    ['clinicianIdentityAuthorized', true, 'RULE5_MONITORING_PLAN_AUTHORIZATION_FLAG_NOT_ALLOWED'],
    [
      'ownerDecisionAnchor',
      'OD-R5-M0-004',
      'RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_POLICY_MISMATCH',
    ],
  ] as const)('rejects clinician-review policy tamper %s', (key, value, code) => {
    const base = schemaFromFixture();
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...base,
          clinicianReviewPolicy: { ...(base.clinicianReviewPolicy as object), [key]: value },
        }),
      code,
    );
  });

  it.each([
    [
      'fingerprintVersion',
      'ehas2-rule5-monitoring-plan-fingerprint-v0',
      'RULE5_MONITORING_PLAN_WRONG_FINGERPRINT_VERSION',
    ],
    ['deterministicFingerprint', 'SYNTHETIC_FP', 'RULE5_MONITORING_PLAN_FINGERPRINT_MUST_BE_NULL'],
    ['deterministicFingerprint', 12345, 'RULE5_MONITORING_PLAN_NUMERIC_VALUE_FORBIDDEN'],
    ['deterministicFingerprint', { hash: 'x' }, 'RULE5_MONITORING_PLAN_FINGERPRINT_MUST_BE_NULL'],
  ] as const)('rejects fingerprint tamper %s=%p', (key, value, code) => {
    expectM5Failure(
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          [key]: value,
        }),
      code,
    );
  });
});

describe('Rule 5 R5-M5 validation error privacy', () => {
  const S = SYNTHETIC_PRIVATE_TEXT_5550001111;

  function expectRedacted(
    fn: () => void,
    code: Rule5MonitoringPlanValidationError['failureCode'],
  ): void {
    const err = expectM5Failure(fn, code);
    assertErrorDoesNotEchoRawValue(err, S);
  }

  it.each([
    [
      'schemaVersion',
      () =>
        validateRule5MonitoringPlanSchemaDefinitionShape({
          ...schemaFromFixture(),
          schemaVersion: S,
        }),
      'RULE5_MONITORING_PLAN_INVALID_SCHEMA_VERSION',
    ],
    [
      'schemaKind',
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          schemaKind: S,
        }),
      'RULE5_MONITORING_PLAN_WRONG_SCHEMA_KIND',
    ],
    [
      'ownerLabel',
      () => validateRule5MonitoringPlanSchemaDefinitionDocument(fieldEntry(0, { ownerLabel: S })),
      'RULE5_MONITORING_PLAN_FIELD_DEFINITION_MISMATCH',
    ],
    [
      'reference string',
      () => validateRule5MonitoringPlanSchemaDefinitionDocument(fieldEntry(0, { reference: S })),
      'RULE5_MONITORING_PLAN_NON_NULL_REFERENCE',
    ],
    [
      'unexpected key',
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({ ...schemaFromFixture(), [S]: true }),
      'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD',
    ],
    [
      'patient instruction',
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          instructionText: S,
        }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    ],
    [
      'clinician identity',
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          clinicianName: S,
        }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    ],
    [
      'evidence value',
      () =>
        validateRule5MonitoringPlanSchemaDefinitionDocument({
          ...schemaFromFixture(),
          evidencePolicy: S,
        }),
      'RULE5_MONITORING_PLAN_WRONG_EVIDENCE_POLICY',
    ],
  ] as const)('redacts sentinel in invalid %s', (_label, fn, code) => {
    expectRedacted(fn, code);
  });

  it('redacts malicious schemaVersion and unexpected property values', () => {
    const base = schemaFromFixture();
    const err = expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionShape({ ...base, schemaVersion: S }),
      'RULE5_MONITORING_PLAN_INVALID_SCHEMA_VERSION',
    );
    assertErrorDoesNotEchoRawValue(err, S);
    expect(err.detail).toBe('schemaVersion');
    const err2 = expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, [S]: true }),
      'RULE5_MONITORING_PLAN_UNEXPECTED_FIELD',
    );
    assertErrorDoesNotEchoRawValue(err2, S);
    expect(err2.detail).toBe('unexpectedField');
  });

  it('redacts forbidden nested clinical field value', () => {
    const base = schemaFromFixture();
    const err = expectM5Failure(
      () => validateRule5MonitoringPlanSchemaDefinitionDocument({ ...base, phone: S }),
      'RULE5_MONITORING_PLAN_FORBIDDEN_CLINICAL_FIELD',
    );
    assertErrorDoesNotEchoRawValue(err, S);
  });
});
