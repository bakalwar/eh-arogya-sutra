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
): void {
  try {
    fn();
    expect.fail('expected contract validation error');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule5ContractValidationError);
    expect((e as Rule5ContractValidationError).failureCode).toBe(code);
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
