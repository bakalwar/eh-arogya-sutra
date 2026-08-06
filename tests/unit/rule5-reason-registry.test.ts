import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
  RULE5_CANONICAL_CLINICAL_REASON_ENTRIES,
  RULE5_CANONICAL_ENTRY_BY_CODE,
  RULE5_CLINICAL_REASON_CODES,
  RULE5_OD014_REASON_CODES,
  RULE5_OD015_REASON_CODES,
  RULE5_OD016_REASON_CODES,
  RULE5_M3_NEW_CLINICAL_REASON_CODE_COUNT,
  RULE5_REASON_REGISTRY_VERSION,
  RULE5_REASON_REGISTRY_VERSION_V1,
  assertKnownRule5ClinicalReasonCode,
  createNotConnectedAnalyzeResult,
  RULE_SET_VERSION,
  Rule5RegistryValidationError,
  Rule5UnknownClinicalReasonCodeError,
  serializeRule5ClinicalReasonRegistry,
  validateRule5ClinicalReasonRegistryDocument,
} from '../../packages/clinical-contracts/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureV2Path = path.join(root, 'fixtures/rule5/reason-code-registry.clinical.v2.json');
const fixtureV1Path = path.join(root, 'fixtures/rule5/reason-code-registry.clinical.v1.json');
const fixturePath = fixtureV2Path;
const rule5ReasonRegistrySourcePath = path.join(
  root,
  'packages/clinical-contracts/src/rule5/reasonRegistry.ts',
);
const rule5IndexSourcePath = path.join(root, 'packages/clinical-contracts/src/rule5/index.ts');
const rule5ReasonCodesSourcePath = path.join(
  root,
  'packages/clinical-contracts/src/rule5/reasonCodes.ts',
);

const M3_FUTURE_CODES = [
  'R5_EMERGENCY_RED_FLAG_DETECTED',
  'R5_ACUTE_CLINICAL_DETERIORATION',
  'R5_OVERDOSE_SUSPECTED',
  'R5_DANGEROUS_VITAL_OR_LAB_RESULT',
  'R5_EXPOSURE_UNCOMPUTABLE',
  'R5_CONFIRMED_APPLICABLE_ALLERGY',
  'R5_ABSOLUTE_CONTRAINDICATION_DETECTED',
  'R5_PROHIBITED_INTERACTION_DETECTED',
  'R5_FORMULATION_ROUTE_MISMATCH',
  'R5_MAXIMUM_DURATION_OR_CUMULATIVE_EXPOSURE_EXCEEDED',
  'R5_UNSAFE_CONCURRENT_MEDICINE_CHANGE',
  'R5_PATIENT_INSTRUCTIONS_NOT_DELIVERED',
  'R5_CRITICAL_FOLLOW_UP_CONTRADICTION',
] as const;

const FORBIDDEN_ENTRY_KEYS = new Set([
  'clinicalSelection',
  'medicine',
  'mixture',
  'potency',
  'dosage',
  'threshold',
  'patientId',
  'phone',
  'phi',
]);

function readFixtureJson(): unknown {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as unknown;
}

function loadValidatedFixtureRegistry() {
  return validateRule5ClinicalReasonRegistryDocument(readFixtureJson());
}

function collectKeys(value: unknown, keys: Set<string>): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    keys.add(k);
    collectKeys(v, keys);
  }
}

function expectValidationFailure(
  fn: () => void,
  code: Rule5RegistryValidationError['failureCode'],
): void {
  try {
    fn();
    expect.fail('expected validation error');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule5RegistryValidationError);
    expect((e as Rule5RegistryValidationError).failureCode).toBe(code);
  }
}

describe('Rule 5 R5-M2/M3 clinical reason registry', () => {
  const registry = loadValidatedFixtureRegistry();

  it('contains exactly 34 unique clinical codes with OD-014, OD-015, and OD-016 membership', () => {
    const codes = registry.entries.map((e) => e.code);
    expect(new Set(codes).size).toBe(34);
    expect(codes).toEqual([...RULE5_CLINICAL_REASON_CODES]);
    expect(RULE5_OD014_REASON_CODES).toHaveLength(12);
    expect(RULE5_OD015_REASON_CODES).toHaveLength(9);
    expect(RULE5_OD016_REASON_CODES).toHaveLength(RULE5_M3_NEW_CLINICAL_REASON_CODE_COUNT);
    expect(RULE5_OD014_REASON_CODES.every((c) => codes.includes(c))).toBe(true);
    expect(RULE5_OD015_REASON_CODES.every((c) => codes.includes(c))).toBe(true);
  });

  it('returns canonical TypeScript registry with full 34-entry parity', () => {
    expect(registry).toEqual(RULE5_CANONICAL_CLINICAL_REASON_REGISTRY);
    expect(validateRule5ClinicalReasonRegistryDocument(readFixtureJson())).toEqual(
      RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
    );
  });

  it('binds each code to exact ownerDecisionAnchor (OD-014 ×12, OD-015 ×9)', () => {
    for (const entry of RULE5_CANONICAL_CLINICAL_REASON_ENTRIES) {
      expect(
        RULE5_CANONICAL_ENTRY_BY_CODE[entry.code as keyof typeof RULE5_CANONICAL_ENTRY_BY_CODE],
      ).toEqual(entry);
    }
    for (const code of RULE5_OD014_REASON_CODES) {
      expect(
        RULE5_CANONICAL_ENTRY_BY_CODE[code as keyof typeof RULE5_CANONICAL_ENTRY_BY_CODE]
          .ownerDecisionAnchor,
      ).toBe('OD-R5-M0-014');
    }
    for (const code of RULE5_OD015_REASON_CODES) {
      expect(
        RULE5_CANONICAL_ENTRY_BY_CODE[code as keyof typeof RULE5_CANONICAL_ENTRY_BY_CODE]
          .ownerDecisionAnchor,
      ).toBe('OD-R5-M0-015');
    }
  });

  it('includes canonical intake code and excludes stale reported code', () => {
    const codes = new Set(registry.entries.map((e) => e.code));
    expect(codes.has('R5_ADVERSE_EVENT_INTAKE_RECORDED')).toBe(true);
    expect(codes.has('R5_ADVERSE_EVENT_REPORTED')).toBe(false);
  });

  it('keeps every entry metadata-only with executable=false and namespace R5', () => {
    for (const entry of registry.entries) {
      expect(entry.executable).toBe(false);
      expect(entry.namespace).toBe('R5');
    }
    for (const entry of registry.entries.filter((e) =>
      RULE5_OD016_REASON_CODES.includes(e.code as (typeof RULE5_OD016_REASON_CODES)[number]),
    )) {
      expect(entry.introducedInVersion).toBe(RULE5_REASON_REGISTRY_VERSION);
    }
    for (const entry of registry.entries.filter(
      (e) =>
        !RULE5_OD016_REASON_CODES.includes(e.code as (typeof RULE5_OD016_REASON_CODES)[number]),
    )) {
      expect(entry.introducedInVersion).toBe(RULE5_REASON_REGISTRY_VERSION_V1);
    }
  });

  it('includes exact 13 OD-R5-M0-016 codes and rejects RULE5_* / PHASE1_* prefixes', () => {
    const codes = registry.entries.map((e) => e.code);
    for (const code of codes) {
      expect(code.startsWith('RULE5_')).toBe(false);
      expect(code.startsWith('PHASE1_')).toBe(false);
    }
    for (const future of M3_FUTURE_CODES) {
      expect(codes).toContain(future);
      expect(
        RULE5_CANONICAL_ENTRY_BY_CODE[future as keyof typeof RULE5_CANONICAL_ENTRY_BY_CODE]
          .ownerDecisionAnchor,
      ).toBe('OD-R5-M0-016');
    }
  });

  it('preserves historical v1 fixture unchanged and rejects v1 as current canonical version', () => {
    const v1Raw = JSON.parse(fs.readFileSync(fixtureV1Path, 'utf8')) as {
      registryVersion: string;
      entries: unknown[];
    };
    expect(v1Raw.registryVersion).toBe(RULE5_REASON_REGISTRY_VERSION_V1);
    expect(v1Raw.entries).toHaveLength(21);
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(v1Raw),
      'RULE5_REGISTRY_INVALID_VERSION',
    );
    const v1Codes = (v1Raw.entries as { code: string }[]).map((e) => e.code);
    for (const code of v1Codes) {
      const current =
        RULE5_CANONICAL_ENTRY_BY_CODE[code as keyof typeof RULE5_CANONICAL_ENTRY_BY_CODE];
      expect(current).toBeDefined();
      expect(current.meaning).toBe(
        (v1Raw.entries as { code: string; meaning: string }[]).find((e) => e.code === code)!
          .meaning,
      );
      expect(current.ownerDecisionAnchor).toBe(
        (v1Raw.entries as { code: string; ownerDecisionAnchor: string }[]).find(
          (e) => e.code === code,
        )!.ownerDecisionAnchor,
      );
      expect(current.introducedInVersion).toBe(RULE5_REASON_REGISTRY_VERSION_V1);
    }
  });

  it('registry version constant matches v2 fixture header', () => {
    expect(registry.registryVersion).toBe(RULE5_REASON_REGISTRY_VERSION);
    expect(registry.registryVersion).toBe('ehas2-rule5-reason-registry-v2');
    const raw = readFixtureJson() as { registryVersion: string };
    expect(raw.registryVersion).toBe(RULE5_REASON_REGISTRY_VERSION);
  });

  it('serializes deterministically and matches canonical stable dump', () => {
    const a = serializeRule5ClinicalReasonRegistry(registry);
    const b = serializeRule5ClinicalReasonRegistry(RULE5_CANONICAL_CLINICAL_REASON_REGISTRY);
    const c = serializeRule5ClinicalReasonRegistry(loadValidatedFixtureRegistry());
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(() => JSON.parse(a)).not.toThrow();
  });

  it('meanings do not assert PASS/safe/stable as standalone claims and omit forbidden clinical fields', () => {
    const raw = readFixtureJson();
    const keys = new Set<string>();
    collectKeys(raw, keys);
    for (const forbidden of FORBIDDEN_ENTRY_KEYS) {
      expect(keys.has(forbidden)).toBe(false);
    }
    for (const entry of registry.entries) {
      expect(entry.meaning).not.toMatch(/^\s*(PASS|SAFE|STABLE)\s*$/i);
    }
  });

  it('rejects duplicate codes fail-closed', () => {
    const base = readFixtureJson() as { registryVersion: string; entries: unknown[] };
    const dup = {
      ...base,
      entries: [...base.entries, base.entries[0]],
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(dup),
      'RULE5_REGISTRY_DUPLICATE_CODE',
    );
  });

  it('rejects unknown clinical codes fail-closed', () => {
    expect(() => assertKnownRule5ClinicalReasonCode('R5_NOT_IN_CANONICAL_REGISTER')).toThrow(
      Rule5UnknownClinicalReasonCodeError,
    );
  });

  it('rejects extra unknown document entry fail-closed', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    const extra = {
      registryVersion: base.registryVersion,
      entries: [
        ...base.entries,
        {
          code: 'R5_NOT_IN_CANONICAL_REGISTER',
          namespace: 'R5',
          meaning: 'x',
          executable: false,
          introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
          ownerDecisionAnchor: 'OD-R5-M0-014',
        },
      ],
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(extra),
      'RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET',
    );
  });

  it('rejects missing canonical entry fail-closed', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    const missing = {
      registryVersion: base.registryVersion,
      entries: base.entries.slice(1),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(missing),
      'RULE5_REGISTRY_INCOMPLETE_MEMBERSHIP',
    );
  });

  it('rejects wrong namespace fail-closed', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    const bad = {
      registryVersion: base.registryVersion,
      entries: base.entries.map((e, i) => (i === 0 ? { ...e, namespace: 'reason' } : e)),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(bad),
      'RULE5_REGISTRY_WRONG_NAMESPACE',
    );
  });

  it('rejects invalid and missing registry version fail-closed', () => {
    const base = readFixtureJson() as { registryVersion: string; entries: unknown[] };
    expectValidationFailure(
      () =>
        validateRule5ClinicalReasonRegistryDocument({
          ...base,
          registryVersion: 'ehas2-rule5-reason-registry-v0',
        }),
      'RULE5_REGISTRY_INVALID_VERSION',
    );
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument({ entries: base.entries }),
      'RULE5_REGISTRY_MISSING_REGISTRY_VERSION',
    );
  });

  it('rejects missing mandatory metadata, whitespace-only fields, and executable=true', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    const missing = {
      registryVersion: base.registryVersion,
      entries: base.entries.map((e, i) =>
        i === 0
          ? { code: e.code, namespace: e.namespace, meaning: e.meaning, executable: e.executable }
          : e,
      ),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(missing),
      'RULE5_REGISTRY_MISSING_MANDATORY_FIELD',
    );

    const whitespaceMeaning = {
      registryVersion: base.registryVersion,
      entries: base.entries.map((e, i) => (i === 0 ? { ...e, meaning: '   ' } : e)),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(whitespaceMeaning),
      'RULE5_REGISTRY_WHITESPACE_ONLY_FIELD',
    );

    const executable = {
      registryVersion: base.registryVersion,
      entries: base.entries.map((e, i) => (i === 0 ? { ...e, executable: true } : e)),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(executable),
      'RULE5_REGISTRY_EXECUTABLE_NOT_ALLOWED',
    );
  });

  it('rejects changed canonical meaning and wrong ownerDecisionAnchor', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    const tamperedMeaning = {
      registryVersion: base.registryVersion,
      entries: base.entries.map((e, i) =>
        i === 0 ? { ...e, meaning: `${String(e.meaning)}.` } : e,
      ),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(tamperedMeaning),
      'RULE5_REGISTRY_CANONICAL_ENTRY_MISMATCH',
    );

    const wrongAnchor = {
      registryVersion: base.registryVersion,
      entries: base.entries.map((e) =>
        e.code === 'R5_ADVERSE_EVENT_INTAKE_RECORDED'
          ? { ...e, ownerDecisionAnchor: 'OD-R5-M0-015' }
          : e,
      ),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(wrongAnchor),
      'RULE5_REGISTRY_WRONG_OWNER_DECISION_ANCHOR',
    );
  });

  it('rejects unexpected keys, null root, array root, and non-object entry', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    expectValidationFailure(
      () =>
        validateRule5ClinicalReasonRegistryDocument({
          ...base,
          extraRoot: true,
        }),
      'RULE5_REGISTRY_UNEXPECTED_FIELD',
    );
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(null),
      'RULE5_REGISTRY_INVALID_DOCUMENT',
    );
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument([]),
      'RULE5_REGISTRY_INVALID_DOCUMENT',
    );
    expectValidationFailure(
      () =>
        validateRule5ClinicalReasonRegistryDocument({
          registryVersion: base.registryVersion,
          entries: [null, ...base.entries.slice(1)],
        }),
      'RULE5_REGISTRY_INVALID_DOCUMENT',
    );
  });

  it('rejects non-canonical entry order (deterministic policy: sorted by code)', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    const shuffled = {
      registryVersion: base.registryVersion,
      entries: [...base.entries].reverse(),
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(shuffled),
      'RULE5_REGISTRY_ENTRY_ORDER_NOT_CANONICAL',
    );
  });

  it('rejects stale reported and RULE5_/PHASE1_ codes in document', () => {
    const base = readFixtureJson() as {
      registryVersion: string;
      entries: Record<string, unknown>[];
    };
    const reported = {
      registryVersion: base.registryVersion,
      entries: [
        ...base.entries,
        {
          code: 'R5_ADVERSE_EVENT_REPORTED',
          namespace: 'R5',
          meaning: 'x',
          executable: false,
          introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
          ownerDecisionAnchor: 'OD-R5-M0-014',
        },
      ],
    };
    expectValidationFailure(
      () => validateRule5ClinicalReasonRegistryDocument(reported),
      'RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET',
    );
  });

  it('package barrel import does not expose Node filesystem loader', async () => {
    const barrel = await import('../../packages/clinical-contracts/src/index.ts');
    expect(barrel).toHaveProperty('RULE5_CANONICAL_CLINICAL_REASON_REGISTRY');
    expect(barrel).toHaveProperty('validateRule5ClinicalReasonRegistryDocument');
    expect(barrel).not.toHaveProperty('loadRule5ClinicalReasonRegistryFromRepoRoot');
    expect(barrel).not.toHaveProperty('RULE5_KNOWN_CLINICAL_REASON_CODE_SET');
    expect(barrel).toHaveProperty('isKnownRule5ClinicalReasonCode');
  });

  it('does not export mutable Set or Map on Rule 5 or root clinical-contracts barrels', async () => {
    const rootBarrel = await import('../../packages/clinical-contracts/src/index.ts');
    const rule5Barrel = await import('../../packages/clinical-contracts/src/rule5/index.ts');
    expect(rootBarrel).not.toHaveProperty('RULE5_KNOWN_CLINICAL_REASON_CODE_SET');
    expect(rule5Barrel).not.toHaveProperty('RULE5_KNOWN_CLINICAL_REASON_CODE_SET');
    for (const value of Object.values(rule5Barrel)) {
      expect(value).not.toBeInstanceOf(Set);
      expect(value).not.toBeInstanceOf(Map);
    }
    const reasonCodesSource = fs.readFileSync(rule5ReasonCodesSourcePath, 'utf8');
    expect(reasonCodesSource).not.toMatch(/export const RULE5_KNOWN_CLINICAL_REASON_CODE_SET/);
    expect(reasonCodesSource).not.toMatch(/export const \w+[^=]*=\s*new Set/);
    expect(reasonCodesSource).not.toMatch(/export const \w+[^=]*=\s*new Map/);
    const rule5IndexSource = fs.readFileSync(rule5IndexSourcePath, 'utf8');
    expect(rule5IndexSource).not.toMatch(/KNOWN_CLINICAL_REASON_CODE_SET/);
  });

  it('exposes known-code lookup only via pure predicate with no consumer-mutable membership', async () => {
    const barrel = await import('../../packages/clinical-contracts/src/index.ts');
    const { isKnownRule5ClinicalReasonCode } = barrel;
    for (const code of RULE5_CLINICAL_REASON_CODES) {
      expect(isKnownRule5ClinicalReasonCode(code)).toBe(true);
      expect(() => assertKnownRule5ClinicalReasonCode(code)).not.toThrow();
    }
    expect(isKnownRule5ClinicalReasonCode('R5_NOT_IN_CANONICAL_REGISTER')).toBe(false);
    expect(() => assertKnownRule5ClinicalReasonCode('R5_NOT_IN_CANONICAL_REGISTER')).toThrow(
      Rule5UnknownClinicalReasonCodeError,
    );
  });

  it('public Rule 5 registry module graph excludes Node fs/path and fixture loading', () => {
    const reasonRegistrySource = fs.readFileSync(rule5ReasonRegistrySourcePath, 'utf8');
    const rule5IndexSource = fs.readFileSync(rule5IndexSourcePath, 'utf8');
    expect(reasonRegistrySource).not.toMatch(/node:fs|'node:fs'|"node:fs"/);
    expect(reasonRegistrySource).not.toMatch(/node:path|'node:path'|"node:path"/);
    expect(reasonRegistrySource).not.toMatch(/readFileSync|process\.cwd|loadRule5/);
    expect(rule5IndexSource).not.toMatch(/node:fs|node:path|loadRule5/);
  });

  it('deep-freezes canonical registry root, entries array, and each entry', () => {
    const canon = RULE5_CANONICAL_CLINICAL_REASON_REGISTRY;
    expect(Object.isFrozen(canon)).toBe(true);
    expect(Object.isFrozen(canon.entries)).toBe(true);
    expect(canon.entries).toHaveLength(34);
    for (const entry of canon.entries) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
    expect(validateRule5ClinicalReasonRegistryDocument(readFixtureJson())).toBe(canon);
  });

  it('rejects runtime mutation of canonical registry and preserves validation/serialization', () => {
    const canon = RULE5_CANONICAL_CLINICAL_REASON_REGISTRY;
    const beforeSerialize = serializeRule5ClinicalReasonRegistry(canon);
    const entry0 = canon.entries[0]!;
    const meaningBefore = entry0.meaning;
    const anchorBefore = entry0.ownerDecisionAnchor;

    expect(() => {
      (canon as { registryVersion: string }).registryVersion = 'tampered';
    }).toThrow();
    expect(canon.registryVersion).toBe(RULE5_REASON_REGISTRY_VERSION);

    expect(() => {
      (canon.entries as unknown as unknown[]).push({});
    }).toThrow();

    expect(() => {
      (entry0 as { meaning: string }).meaning = 'tampered meaning';
    }).toThrow();
    expect(entry0.meaning).toBe(meaningBefore);

    expect(() => {
      (entry0 as { ownerDecisionAnchor: string }).ownerDecisionAnchor = 'OD-R5-M0-015';
    }).toThrow();
    expect(entry0.ownerDecisionAnchor).toBe(anchorBefore);

    const consumerA = validateRule5ClinicalReasonRegistryDocument(readFixtureJson());
    const consumerB = validateRule5ClinicalReasonRegistryDocument(readFixtureJson());
    expect(consumerA).toBe(consumerB);
    expect(consumerA).toBe(canon);
    expect(serializeRule5ClinicalReasonRegistry(canon)).toBe(beforeSerialize);
    expect(validateRule5ClinicalReasonRegistryDocument(readFixtureJson())).toEqual(canon);
  });
});

describe('Rule 5 R5-M2 nine-rule boundary (unchanged orchestration contracts)', () => {
  it('preserves post-M1b RULE_SET_VERSION and AnalyzeComplete NOT_CONNECTED', () => {
    expect(RULE_SET_VERSION).toBe('ehas2-nine-rule-interfaces-v2-rule5-monitoring');
    const analyze = createNotConnectedAnalyzeResult('r5-m2-registry-test');
    expect(analyze.status).toBe('CLINICAL_ENGINE_NOT_CONNECTED');
    expect(analyze.oralFormulaCandidates).toEqual([]);
    expect(analyze.defaultWeUsed).toBe(false);
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
