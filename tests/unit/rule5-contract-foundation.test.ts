import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  RULE5_CANONICAL_CONTRACT_FOUNDATION,
  RULE5_CANONICAL_RULE_NAME,
  RULE5_CANONICAL_RULE_NUMBER,
  RULE5_HARD_BLOCKER_CONDITION_COUNT,
  RULE5_HARD_BLOCKER_MAPPING_COUNT,
  RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
  RULE5_CLINICAL_REASON_CODES,
  RULE5_CONTRACT_VERSION,
  RULE5_FINGERPRINT_VERSION,
  RULE5_HARD_BLOCKER_MATRIX_VERSION,
  RULE5_REASON_REGISTRY_VERSION,
  RULE_SET_VERSION,
  Rule5ContractValidationError,
  createNotConnectedAnalyzeResult,
  serializeRule5ContractFoundationDocument,
  serializeRule5ContractFoundationInput,
  serializeRule5ContractFoundationOutput,
  serializeRule5ContractFingerprintV1Payload,
  validateRule5ClinicalReasonRegistryDocument,
  validateRule5ContractFoundationDocument,
  validateRule5ContractFoundationInputDocument,
  validateRule5ContractFoundationInputShape,
  validateRule5ContractFoundationOutputDocument,
  validateRule5HardBlockerMatrixDocument,
} from '../../packages/clinical-contracts/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, 'fixtures/rule5/contract-foundation.v1.json');
const rule5IndexSourcePath = path.join(root, 'packages/clinical-contracts/src/rule5/index.ts');
const contractModules = [
  'contractFoundation.ts',
  'contractValidation.ts',
  'contractSerialization.ts',
  'engineeringCodes.ts',
];

function readFixture(): unknown {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as unknown;
}

function expectContractFailure(
  fn: () => void,
  code: Rule5ContractValidationError['failureCode'],
): Rule5ContractValidationError {
  try {
    fn();
    expect.fail('expected contract validation error');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule5ContractValidationError);
    expect((e as Rule5ContractValidationError).failureCode).toBe(code);
    return e as Rule5ContractValidationError;
  }
}

function canonicalInputFromFixture(): Record<string, unknown> {
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
    canonicalInput: Record<string, unknown>;
  };
  return { ...raw.canonicalInput };
}

function canonicalOutputFromFixture(): Record<string, unknown> {
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
    canonicalOutput: Record<string, unknown>;
  };
  return JSON.parse(JSON.stringify(raw.canonicalOutput)) as Record<string, unknown>;
}

function assertErrorDoesNotEchoRawValue(error: Rule5ContractValidationError, raw: string): void {
  expect(error.message).not.toContain(raw);
  if (error.detail !== undefined) {
    expect(error.detail).not.toContain(raw);
  }
  expect(JSON.stringify(error)).not.toContain(raw);
}

const SYNTHETIC_PRIVATE_TEXT_5550001111 = 'SYNTHETIC_PRIVATE_TEXT_5550001111';

function expectRedactedFailure(
  fn: () => void,
  code: Rule5ContractValidationError['failureCode'],
  sentinel: string,
  expectedSafeDetail?: string,
): void {
  const err = expectContractFailure(fn, code);
  assertErrorDoesNotEchoRawValue(err, sentinel);
  if (expectedSafeDetail !== undefined) {
    expect(err.detail).toBe(expectedSafeDetail);
  }
}

describe('Rule 5 R5-M4 contract foundation', () => {
  const canon = RULE5_CANONICAL_CONTRACT_FOUNDATION;

  it('matches exact canonical input and output singletons', () => {
    expect(canon.canonicalInput.contractVersion).toBe(RULE5_CONTRACT_VERSION);
    expect(canon.canonicalInput.ruleSetVersion).toBe(RULE_SET_VERSION);
    expect(canon.canonicalInput.evaluationMode).toBe('OFF');
    expect(canon.canonicalInput.invocationKind).toBe('CONTRACT_VALIDATION');
    expect(canon.canonicalOutput.ruleNumber).toBe(RULE5_CANONICAL_RULE_NUMBER);
    expect(canon.canonicalOutput.ruleName).toBe(RULE5_CANONICAL_RULE_NAME);
    expect(canon.canonicalOutput.status).toBe('NOT_IMPLEMENTED');
    expect(canon.canonicalOutput.deterministicFingerprint).toBe(null);
    expect(canon.canonicalOutput.fingerprintVersion).toBe(RULE5_FINGERPRINT_VERSION);
  });

  it('validates JSON fixture with full TypeScript parity', () => {
    const validated = validateRule5ContractFoundationDocument(readFixture());
    expect(validated).toBe(canon);
    expect(serializeRule5ContractFoundationDocument(validated)).toBe(
      serializeRule5ContractFoundationDocument(JSON.parse(fs.readFileSync(fixturePath, 'utf8'))),
    );
  });

  it('rejects unknown contract version', () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const input = { ...(raw.canonicalInput as object), contractVersion: 'ehas2-rule5-contract-v0' };
    expectContractFailure(
      () => validateRule5ContractFoundationInputDocument(input),
      'RULE5_CONTRACT_INVALID_VERSION',
    );
  });

  it('accepts evaluationMode OFF on canonical input', () => {
    expect(validateRule5ContractFoundationInputDocument(canon.canonicalInput)).toBe(
      canon.canonicalInput,
    );
  });

  it('rejects SHADOW, ACTIVE, and invalid evaluation modes on input shape', () => {
    const base = { ...canon.canonicalInput };
    expectContractFailure(
      () => validateRule5ContractFoundationInputShape({ ...base, evaluationMode: 'SHADOW' }),
      'RULE5_ENGINE_MODE_SHADOW_NOT_AUTHORIZED',
    );
    expectContractFailure(
      () => validateRule5ContractFoundationInputShape({ ...base, evaluationMode: 'ACTIVE' }),
      'RULE5_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED',
    );
    expectContractFailure(
      () => validateRule5ContractFoundationInputShape({ ...base, evaluationMode: 'BOGUS' }),
      'RULE5_ENGINE_MODE_INVALID',
    );
  });

  it('rejects all non-claim flags when true on output', () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
      canonicalOutput: Record<string, unknown>;
    };
    const flags = [
      ['implemented', 'RULE5_CONTRACT_IMPLEMENTED_NOT_ALLOWED'],
      ['connected', 'RULE5_CONTRACT_CONNECTED_NOT_ALLOWED'],
      ['affectsClinicalSelection', 'RULE5_CONTRACT_AFFECTS_CLINICAL_SELECTION_NOT_ALLOWED'],
      ['clinicalActionAuthorized', 'RULE5_CONTRACT_CLINICAL_ACTION_NOT_ALLOWED'],
      ['prescriptionMutationAuthorized', 'RULE5_CONTRACT_PRESCRIPTION_MUTATION_NOT_ALLOWED'],
      ['medicineMutationAuthorized', 'RULE5_CONTRACT_MEDICINE_MUTATION_NOT_ALLOWED'],
      ['potencyMutationAuthorized', 'RULE5_CONTRACT_POTENCY_MUTATION_NOT_ALLOWED'],
      ['dosageMutationAuthorized', 'RULE5_CONTRACT_DOSAGE_MUTATION_NOT_ALLOWED'],
    ] as const;
    for (const [key, code] of flags) {
      expectContractFailure(
        () =>
          validateRule5ContractFoundationOutputDocument({
            ...raw.canonicalOutput,
            [key]: true,
          }),
        code,
      );
    }
  });

  it('requires reasonCodes empty and exact engineering limitationCodes', () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
      canonicalOutput: Record<string, unknown>;
    };
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...raw.canonicalOutput,
          reasonCodes: ['R5_REQUIRED_MONITORING_DATA_MISSING'],
        }),
      'RULE5_CONTRACT_REASON_CODES_MUST_BE_EMPTY',
    );
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...raw.canonicalOutput,
          limitationCodes: ['RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED'],
        }),
      'RULE5_CONTRACT_WRONG_LIMITATION_SET',
    );
  });

  it('rejects namespace mixing between reasonCodes and limitationCodes', () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
      canonicalOutput: Record<string, unknown>;
    };
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...raw.canonicalOutput,
          reasonCodes: [],
          limitationCodes: ['R5_REQUIRED_MONITORING_DATA_MISSING'],
        }),
      'RULE5_CONTRACT_CLINICAL_REASON_IN_LIMITATIONS',
    );
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...raw.canonicalOutput,
          reasonCodes: ['RULE5_CONTRACT_RUNTIME_NOT_CONNECTED'],
          limitationCodes: [
            'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
            'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED',
          ],
        }),
      'RULE5_CONTRACT_ENGINEERING_REASON_IN_CLINICAL',
    );
  });

  it('rejects unexpected clinical and PHI-like fields', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canon.canonicalInput,
          unexpectedField: 'x',
        }),
      'RULE5_CONTRACT_UNEXPECTED_FIELD',
    );
    expectContractFailure(
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canon.canonicalInput,
          patientId: 'x',
        }),
      'RULE5_CONTRACT_FORBIDDEN_CLINICAL_FIELD',
    );
  });

  it('rejects non-null deterministicFingerprint', () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
      canonicalOutput: Record<string, unknown>;
    };
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...raw.canonicalOutput,
          deterministicFingerprint: 'ABC',
        }),
      'RULE5_CONTRACT_FINGERPRINT_MUST_BE_NULL',
    );
  });

  it('produces identical repeated canonical serialization', () => {
    const a = serializeRule5ContractFoundationDocument();
    const b = serializeRule5ContractFoundationDocument();
    expect(a).toBe(b);
    expect(serializeRule5ContractFoundationInput()).toBe(serializeRule5ContractFoundationInput());
    expect(serializeRule5ContractFoundationOutput()).toBe(serializeRule5ContractFoundationOutput());
    expect(serializeRule5ContractFingerprintV1Payload()).toBe(
      serializeRule5ContractFingerprintV1Payload(),
    );
  });

  it('deep-freezes canonical foundation root and nested values', () => {
    expect(Object.isFrozen(canon)).toBe(true);
    expect(Object.isFrozen(canon.canonicalInput)).toBe(true);
    expect(Object.isFrozen(canon.canonicalOutput)).toBe(true);
    expect(Object.isFrozen(canon.canonicalOutput.reasonCodes)).toBe(true);
    expect(Object.isFrozen(canon.canonicalOutput.limitationCodes)).toBe(true);
    expect(Object.isFrozen(canon.canonicalOutput.auditContext)).toBe(true);
    expect(() => {
      (canon.canonicalOutput as { connected: boolean }).connected = true;
    }).toThrow();
  });

  it('does not export mutable Set or Map from Rule 5 barrel', async () => {
    const rule5Barrel = await import('../../packages/clinical-contracts/src/rule5/index.ts');
    for (const value of Object.values(rule5Barrel)) {
      expect(value).not.toBeInstanceOf(Set);
      expect(value).not.toBeInstanceOf(Map);
    }
  });

  it('public Rule 5 contract modules exclude Node fs/path/crypto', () => {
    const base = path.join(root, 'packages/clinical-contracts/src/rule5');
    for (const file of contractModules) {
      const src = fs.readFileSync(path.join(base, file), 'utf8');
      expect(src).not.toMatch(/node:fs|node:path|node:crypto|readFileSync|createHash/);
    }
    const indexSource = fs.readFileSync(rule5IndexSourcePath, 'utf8');
    expect(indexSource).not.toMatch(/node:fs|node:path|node:crypto/);
  });

  it('preserves M2 registry (34 codes) and M3 matrix (16/17) invariants', () => {
    expect(RULE5_CLINICAL_REASON_CODES).toHaveLength(34);
    expect(RULE5_CANONICAL_CLINICAL_REASON_REGISTRY.entries).toHaveLength(34);
    const matrixPath = path.join(root, 'fixtures/rule5/hard-blocker-matrix.v1.json');
    const matrix = validateRule5HardBlockerMatrixDocument(
      JSON.parse(fs.readFileSync(matrixPath, 'utf8')),
    );
    expect(matrix.conditions).toHaveLength(RULE5_HARD_BLOCKER_CONDITION_COUNT);
    expect(matrix.mappings).toHaveLength(RULE5_HARD_BLOCKER_MAPPING_COUNT);
    expect(RULE5_REASON_REGISTRY_VERSION).toBe('ehas2-rule5-reason-registry-v2');
    expect(RULE5_HARD_BLOCKER_MATRIX_VERSION).toBe('ehas2-rule5-hard-blocker-matrix-v1');
  });

  it('preserves nine-rule and AnalyzeComplete boundaries', () => {
    expect(RULE_SET_VERSION).toBe('ehas2-nine-rule-interfaces-v2-rule5-monitoring');
    const analyze = createNotConnectedAnalyzeResult('r5-m4-contract-test');
    expect(analyze.status).toBe('CLINICAL_ENGINE_NOT_CONNECTED');
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
    const fpAgain = execFileSync(py, ['-c', script], { encoding: 'utf8' }).trim();
    expect(fpAgain).toBe(fp);
  });
});

describe('Rule 5 R5-M4 contract input validation hardening', () => {
  const canonInput = () => canonicalInputFromFixture();

  it.each([
    ['null document', null, 'RULE5_CONTRACT_INVALID_DOCUMENT'],
    ['array document', [], 'RULE5_CONTRACT_INVALID_DOCUMENT'],
    ['primitive document', 'text', 'RULE5_CONTRACT_INVALID_DOCUMENT'],
  ] as const)('rejects %s', (_label, value, code) => {
    expectContractFailure(() => validateRule5ContractFoundationInputDocument(value), code);
  });

  it('rejects missing contractVersion', () => {
    const input = canonInput();
    delete input.contractVersion;
    expectContractFailure(
      () => validateRule5ContractFoundationInputDocument(input),
      'RULE5_CONTRACT_MISSING_MANDATORY_FIELD',
    );
  });

  it('rejects whitespace-only contractVersion', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationInputDocument({ ...canonInput(), contractVersion: '   ' }),
      'RULE5_CONTRACT_WHITESPACE_ONLY_FIELD',
    );
  });

  it('rejects wrong contractVersion', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonInput(),
          contractVersion: 'ehas2-rule5-contract-v0',
        }),
      'RULE5_CONTRACT_INVALID_VERSION',
    );
  });

  it('rejects wrong ruleSetVersion', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonInput(),
          ruleSetVersion: 'ehas2-nine-rule-interfaces-v0',
        }),
      'RULE5_CONTRACT_WRONG_RULE_SET_VERSION',
    );
  });

  it('rejects wrong invocationKind', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonInput(),
          invocationKind: 'PRODUCTION_RUN',
        }),
      'RULE5_CONTRACT_WRONG_INVOCATION_KIND',
    );
  });

  it('rejects whitespace-only evaluationMode', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationInputShape({ ...canonInput(), evaluationMode: '  \t  ' }),
      'RULE5_CONTRACT_WHITESPACE_ONLY_FIELD',
    );
  });

  it('rejects unexpected input field', () => {
    expectContractFailure(
      () => validateRule5ContractFoundationInputDocument({ ...canonInput(), extraKey: true }),
      'RULE5_CONTRACT_UNEXPECTED_FIELD',
    );
  });

  it('rejects forbidden clinical/PHI-like input field', () => {
    expectContractFailure(
      () => validateRule5ContractFoundationInputDocument({ ...canonInput(), phone: '9000000000' }),
      'RULE5_CONTRACT_FORBIDDEN_CLINICAL_FIELD',
    );
  });
});

describe('Rule 5 R5-M4 contract output validation hardening', () => {
  const canonOutput = () => canonicalOutputFromFixture();

  it.each([
    ['null document', null, 'RULE5_CONTRACT_INVALID_DOCUMENT'],
    ['array document', [], 'RULE5_CONTRACT_INVALID_DOCUMENT'],
    ['primitive document', 42, 'RULE5_CONTRACT_INVALID_DOCUMENT'],
  ] as const)('rejects %s', (_label, value, code) => {
    expectContractFailure(() => validateRule5ContractFoundationOutputDocument(value), code);
  });

  it('rejects wrong ruleNumber', () => {
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...canonOutput(), ruleNumber: 4 }),
      'RULE5_CONTRACT_WRONG_RULE_NUMBER',
    );
  });

  it('rejects wrong ruleName', () => {
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...canonOutput(), ruleName: 'Dosage' }),
      'RULE5_CONTRACT_WRONG_RULE_NAME',
    );
  });

  it('rejects whitespace-only ruleName', () => {
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...canonOutput(), ruleName: '  ' }),
      'RULE5_CONTRACT_WHITESPACE_ONLY_FIELD',
    );
  });

  it('rejects wrong status', () => {
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...canonOutput(), status: 'EXECUTED' }),
      'RULE5_CONTRACT_WRONG_STATUS',
    );
  });

  it('rejects wrong output contractVersion', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          contractVersion: 'ehas2-rule5-contract-v0',
        }),
      'RULE5_CONTRACT_INVALID_VERSION',
    );
  });

  it('rejects wrong output ruleSetVersion', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          ruleSetVersion: 'wrong-ruleset',
        }),
      'RULE5_CONTRACT_WRONG_RULE_SET_VERSION',
    );
  });

  it('rejects wrong output evaluationMode', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          evaluationMode: 'SHADOW',
        }),
      'RULE5_ENGINE_MODE_SHADOW_NOT_AUTHORIZED',
    );
  });

  it.each([
    ['implemented', 'RULE5_CONTRACT_IMPLEMENTED_NOT_ALLOWED'],
    ['connected', 'RULE5_CONTRACT_CONNECTED_NOT_ALLOWED'],
    ['affectsClinicalSelection', 'RULE5_CONTRACT_AFFECTS_CLINICAL_SELECTION_NOT_ALLOWED'],
    ['clinicalActionAuthorized', 'RULE5_CONTRACT_CLINICAL_ACTION_NOT_ALLOWED'],
    ['prescriptionMutationAuthorized', 'RULE5_CONTRACT_PRESCRIPTION_MUTATION_NOT_ALLOWED'],
    ['medicineMutationAuthorized', 'RULE5_CONTRACT_MEDICINE_MUTATION_NOT_ALLOWED'],
    ['potencyMutationAuthorized', 'RULE5_CONTRACT_POTENCY_MUTATION_NOT_ALLOWED'],
    ['dosageMutationAuthorized', 'RULE5_CONTRACT_DOSAGE_MUTATION_NOT_ALLOWED'],
  ] as const)('rejects tampered authority flag %s=true', (field, code) => {
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...canonOutput(), [field]: true }),
      code,
    );
  });

  it('rejects non-empty reasonCodes', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          reasonCodes: ['R5_REQUIRED_MONITORING_DATA_MISSING'],
        }),
      'RULE5_CONTRACT_REASON_CODES_MUST_BE_EMPTY',
    );
  });

  it('rejects RULE5_* codes in reasonCodes', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          reasonCodes: ['RULE5_CONTRACT_RUNTIME_NOT_CONNECTED'],
          limitationCodes: [
            'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
            'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED',
          ],
        }),
      'RULE5_CONTRACT_ENGINEERING_REASON_IN_CLINICAL',
    );
  });

  it('rejects R5_* codes in limitationCodes', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          reasonCodes: [],
          limitationCodes: [
            'R5_REQUIRED_MONITORING_DATA_MISSING',
            'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED',
          ],
        }),
      'RULE5_CONTRACT_CLINICAL_REASON_IN_LIMITATIONS',
    );
  });

  it('rejects missing limitation code', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          limitationCodes: ['RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED'],
        }),
      'RULE5_CONTRACT_WRONG_LIMITATION_SET',
    );
  });

  it('rejects extra limitation code', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          limitationCodes: [
            'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
            'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED',
            'RULE5_ENGINE_MODE_INVALID',
          ],
        }),
      'RULE5_CONTRACT_WRONG_LIMITATION_SET',
    );
  });

  it('rejects duplicate limitation codes', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          limitationCodes: [
            'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
            'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
          ],
        }),
      'RULE5_CONTRACT_WRONG_LIMITATION_SET',
    );
  });

  it('rejects swapped limitation code order', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          limitationCodes: [
            'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED',
            'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
          ],
        }),
      'RULE5_CONTRACT_WRONG_LIMITATION_SET',
    );
  });

  it('rejects wrong auditContext contractVersion', () => {
    const output = canonOutput();
    const audit = { ...(output.auditContext as Record<string, unknown>) };
    audit.contractVersion = 'ehas2-rule5-contract-v0';
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_INVALID_VERSION',
    );
  });

  it('rejects wrong auditContext ruleSetVersion', () => {
    const output = canonOutput();
    const audit = { ...(output.auditContext as Record<string, unknown>) };
    audit.ruleSetVersion = 'wrong';
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_WRONG_RULE_SET_VERSION',
    );
  });

  it('rejects wrong auditContext reasonRegistryVersion', () => {
    const output = canonOutput();
    const audit = { ...(output.auditContext as Record<string, unknown>) };
    audit.reasonRegistryVersion = 'ehas2-rule5-reason-registry-v0';
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_WRONG_AUDIT_CONTEXT',
    );
  });

  it('rejects wrong auditContext hardBlockerMatrixVersion', () => {
    const output = canonOutput();
    const audit = { ...(output.auditContext as Record<string, unknown>) };
    audit.hardBlockerMatrixVersion = 'ehas2-rule5-hard-blocker-matrix-v0';
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_WRONG_AUDIT_CONTEXT',
    );
  });

  it('rejects wrong auditContext fingerprintVersion', () => {
    const output = canonOutput();
    const audit = { ...(output.auditContext as Record<string, unknown>) };
    audit.fingerprintVersion = 'ehas2-rule5-contract-fingerprint-v0';
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_WRONG_FINGERPRINT_VERSION',
    );
  });

  it('rejects wrong top-level fingerprintVersion', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          fingerprintVersion: 'ehas2-rule5-contract-fingerprint-v0',
        }),
      'RULE5_CONTRACT_WRONG_FINGERPRINT_VERSION',
    );
  });

  it('rejects non-null deterministicFingerprint', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonOutput(),
          deterministicFingerprint: 'DEADBEEF',
        }),
      'RULE5_CONTRACT_FINGERPRINT_MUST_BE_NULL',
    );
  });

  it('rejects unexpected output field', () => {
    expectContractFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({ ...canonOutput(), extraOutputField: true }),
      'RULE5_CONTRACT_UNEXPECTED_FIELD',
    );
  });

  it('rejects unexpected auditContext field', () => {
    const output = canonOutput();
    const audit = { ...(output.auditContext as Record<string, unknown>), extraAuditField: 'x' };
    expectContractFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_UNEXPECTED_FIELD',
    );
  });
});

describe('Rule 5 R5-M4 validation error privacy', () => {
  const S = SYNTHETIC_PRIVATE_TEXT_5550001111;

  it('does not echo arbitrary invalid evaluationMode values in errors', () => {
    const input = canonicalInputFromFixture();
    const err = expectContractFailure(
      () =>
        validateRule5ContractFoundationInputShape({
          ...input,
          evaluationMode: S,
        }),
      'RULE5_ENGINE_MODE_INVALID',
    );
    assertErrorDoesNotEchoRawValue(err, S);
    expect(err.detail).toBe('evaluationMode');
  });

  it('does not serialize full input document into invalid-mode errors', () => {
    const input = canonicalInputFromFixture();
    const malicious = { ...input, evaluationMode: S };
    const err = expectContractFailure(
      () => validateRule5ContractFoundationInputShape(malicious),
      'RULE5_ENGINE_MODE_INVALID',
    );
    expect(JSON.stringify(malicious)).toContain(S);
    assertErrorDoesNotEchoRawValue(err, JSON.stringify(malicious));
  });

  it.each([
    [
      'contractVersion',
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonicalInputFromFixture(),
          contractVersion: S,
        }),
      'RULE5_CONTRACT_INVALID_VERSION',
      'contractVersion',
    ],
    [
      'ruleSetVersion',
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonicalInputFromFixture(),
          ruleSetVersion: S,
        }),
      'RULE5_CONTRACT_WRONG_RULE_SET_VERSION',
      'ruleSetVersion',
    ],
    [
      'invocationKind',
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonicalInputFromFixture(),
          invocationKind: S,
        }),
      'RULE5_CONTRACT_WRONG_INVOCATION_KIND',
      undefined,
    ],
    [
      'ruleName',
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonicalOutputFromFixture(),
          ruleName: S,
        }),
      'RULE5_CONTRACT_WRONG_RULE_NAME',
      undefined,
    ],
    [
      'status',
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonicalOutputFromFixture(),
          status: S,
        }),
      'RULE5_CONTRACT_WRONG_STATUS',
      undefined,
    ],
    [
      'fingerprintVersion',
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonicalOutputFromFixture(),
          fingerprintVersion: S,
        }),
      'RULE5_CONTRACT_WRONG_FINGERPRINT_VERSION',
      undefined,
    ],
    [
      'deterministicFingerprint',
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonicalOutputFromFixture(),
          deterministicFingerprint: S,
        }),
      'RULE5_CONTRACT_FINGERPRINT_MUST_BE_NULL',
      undefined,
    ],
  ] as const)(
    'redacts malicious %s in contract validation errors',
    (_field, fn, code, safeDetail) => {
      expectRedactedFailure(fn, code, S, safeDetail);
    },
  );

  it('redacts unknown reason code value in output', () => {
    const output = canonicalOutputFromFixture();
    expectRedactedFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...output,
          reasonCodes: [S],
          limitationCodes: output.limitationCodes,
        }),
      'RULE5_CONTRACT_REASON_CODES_MUST_BE_EMPTY',
      S,
    );
  });

  it('redacts unknown limitation code value in output', () => {
    expectRedactedFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonicalOutputFromFixture(),
          limitationCodes: [S, 'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED'],
        }),
      'RULE5_CONTRACT_WRONG_LIMITATION_SET',
      S,
      'limitationCodes[0]',
    );
  });

  it('redacts unexpected input property name', () => {
    expectRedactedFailure(
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonicalInputFromFixture(),
          [S]: true,
        }),
      'RULE5_CONTRACT_UNEXPECTED_FIELD',
      S,
      'unexpectedField',
    );
  });

  it('redacts unexpected output property name', () => {
    expectRedactedFailure(
      () =>
        validateRule5ContractFoundationOutputDocument({
          ...canonicalOutputFromFixture(),
          [S]: true,
        }),
      'RULE5_CONTRACT_UNEXPECTED_FIELD',
      S,
      'unexpectedField',
    );
  });

  it('redacts unexpected auditContext property name', () => {
    const output = canonicalOutputFromFixture();
    const audit = { ...(output.auditContext as Record<string, unknown>), [S]: true };
    expectRedactedFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_UNEXPECTED_FIELD',
      S,
      'unexpectedField',
    );
  });

  it('redacts wrong auditContext reasonRegistryVersion value', () => {
    const output = canonicalOutputFromFixture();
    const audit = { ...(output.auditContext as Record<string, unknown>), reasonRegistryVersion: S };
    expectRedactedFailure(
      () => validateRule5ContractFoundationOutputDocument({ ...output, auditContext: audit }),
      'RULE5_CONTRACT_WRONG_AUDIT_CONTEXT',
      S,
      'reasonRegistryVersion',
    );
  });

  it('redacts forbidden nested field value', () => {
    expectRedactedFailure(
      () =>
        validateRule5ContractFoundationInputDocument({
          ...canonicalInputFromFixture(),
          phone: S,
        }),
      'RULE5_CONTRACT_FORBIDDEN_CLINICAL_FIELD',
      S,
      'forbiddenField',
    );
  });

  it('keeps SHADOW and ACTIVE failure codes without caller detail', () => {
    const base = canonicalInputFromFixture();
    const shadowErr = expectContractFailure(
      () => validateRule5ContractFoundationInputShape({ ...base, evaluationMode: 'SHADOW' }),
      'RULE5_ENGINE_MODE_SHADOW_NOT_AUTHORIZED',
    );
    expect(shadowErr.detail).toBeUndefined();
    const activeErr = expectContractFailure(
      () => validateRule5ContractFoundationInputShape({ ...base, evaluationMode: 'ACTIVE' }),
      'RULE5_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED',
    );
    expect(activeErr.detail).toBeUndefined();
  });
});

describe('Rule 5 R5-M4 registry document unchanged', () => {
  it('still validates clinical registry fixture v2', () => {
    const fixtureV2 = path.join(root, 'fixtures/rule5/reason-code-registry.clinical.v2.json');
    const doc = validateRule5ClinicalReasonRegistryDocument(
      JSON.parse(fs.readFileSync(fixtureV2, 'utf8')),
    );
    expect(doc.registryVersion).toBe(RULE5_REASON_REGISTRY_VERSION);
    expect(doc.entries).toHaveLength(34);
  });
});
