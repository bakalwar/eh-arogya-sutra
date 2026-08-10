import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  NINE_RULE_DEFINITIONS,
  ORCHESTRATION_STATUS,
  RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG,
  RULE5_EVIDENCE_CATALOG_FIXTURE_RELATIVE,
  RULE5_EVIDENCE_CATALOG_SCHEMA_KIND,
  RULE5_EVIDENCE_CATALOG_VERSION,
  Rule5EvidenceCatalogValidationError,
  serializeRule5EmptyEvidenceCatalog,
  validateRule5EmptyEvidenceCatalogDocument,
} from '../../packages/clinical-contracts/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = path.join(root, RULE5_EVIDENCE_CATALOG_FIXTURE_RELATIVE);
const catalogModules = [
  'evidenceCatalogSchema.ts',
  'evidenceCatalogValidation.ts',
  'evidenceCatalogSerialization.ts',
];
const catalogModuleBase = path.join(root, 'packages/clinical-contracts/src/rule5');
const nineRulesPath = path.join(root, 'packages/clinical-contracts/src/nineRules.ts');
const nineRulesBaseline = execFileSync(
  'git',
  ['show', '6f412e2:packages/clinical-contracts/src/nineRules.ts'],
  { cwd: root, encoding: 'utf8' },
);

function readFixture(): unknown {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as unknown;
}

function canonicalFromFixture(): Record<string, unknown> {
  const raw = readFixture() as Record<string, unknown>;
  return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
}

function expectCatalogFailure(
  fn: () => void,
  code: Rule5EvidenceCatalogValidationError['failureCode'],
): Rule5EvidenceCatalogValidationError {
  try {
    fn();
    expect.fail('expected catalog validation error');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule5EvidenceCatalogValidationError);
    expect((e as Rule5EvidenceCatalogValidationError).failureCode).toBe(code);
    return e as Rule5EvidenceCatalogValidationError;
  }
}

describe('Rule 5 CA-1 empty evidence catalog structural contract', () => {
  const canon = RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG;

  it('1. exposes exact RULE5_EVIDENCE_CATALOG_VERSION', () => {
    expect(RULE5_EVIDENCE_CATALOG_VERSION).toBe('ehas2-rule5-evidence-catalog-v1');
    expect(canon.schemaVersion).toBe(RULE5_EVIDENCE_CATALOG_VERSION);
  });

  it('2. fixture-path constant resolves to physical JSON', () => {
    expect(fs.existsSync(fixturePath)).toBe(true);
    expect(fixturePath).toBe(path.join(root, 'fixtures/rule5/evidence-catalog.v1.json'));
  });

  it('3–5. fixture validates, equals canonical, serialization parity', () => {
    const validated = validateRule5EmptyEvidenceCatalogDocument(readFixture());
    expect(validated).toBe(canon);
    expect(serializeRule5EmptyEvidenceCatalog(validated)).toBe(
      serializeRule5EmptyEvidenceCatalog(canon),
    );
    expect(serializeRule5EmptyEvidenceCatalog(validated)).toBe(
      serializeRule5EmptyEvidenceCatalog(
        validateRule5EmptyEvidenceCatalogDocument(JSON.parse(fs.readFileSync(fixturePath, 'utf8'))),
      ),
    );
  });

  it('6–7. catalogRowCount is 0 and entries are empty', () => {
    expect(canon.catalogRowCount).toBe(0);
    expect(canon.entries).toEqual([]);
    expect(canon.entries).toHaveLength(0);
  });

  it('8. rejects populated entries', () => {
    const doc = canonicalFromFixture();
    doc.entries = [{ smuggled: true }];
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc),
      'RULE5_EVIDENCE_CATALOG_ENTRIES_NOT_EMPTY',
    );
  });

  it('9. rejects entry objects via non-empty entries array', () => {
    const doc = canonicalFromFixture();
    doc.entries = [{}];
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc),
      'RULE5_EVIDENCE_CATALOG_ENTRIES_NOT_EMPTY',
    );
  });

  it('10. rejects evidenceId, rowId and catalogRowId keys at root', () => {
    for (const key of ['evidenceId', 'rowId', 'catalogRowId'] as const) {
      const doc = canonicalFromFixture();
      (doc as Record<string, unknown>)[key] = 'X';
      expectCatalogFailure(
        () => validateRule5EmptyEvidenceCatalogDocument(doc),
        'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
      );
    }
  });

  it('11. rejects medicine keys', () => {
    const doc = canonicalFromFixture();
    doc.medicine = 'MED-A1';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc),
      'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
    );
  });

  it('12. rejects route, potency, dosage and electricity', () => {
    for (const key of ['route', 'potency', 'dosage', 'electricity'] as const) {
      const doc = canonicalFromFixture();
      (doc as Record<string, unknown>)[key] = 'X';
      expectCatalogFailure(
        () => validateRule5EmptyEvidenceCatalogDocument(doc),
        'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
      );
    }
  });

  it('13. rejects timing, threshold and monitoring values', () => {
    for (const key of ['timing', 'threshold', 'monitoring'] as const) {
      const doc = canonicalFromFixture();
      (doc as Record<string, unknown>)[key] = 'X';
      expectCatalogFailure(
        () => validateRule5EmptyEvidenceCatalogDocument(doc),
        'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
      );
    }
  });

  it('14. rejects TH/DA references in string fields', () => {
    const doc = canonicalFromFixture();
    doc.schemaKind = 'TH-01';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc),
      'RULE5_EVIDENCE_CATALOG_RULE4_REFERENCE_FORBIDDEN',
    );
    const doc2 = canonicalFromFixture();
    doc2.evidencePolicy = 'DA-02';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc2),
      'RULE5_EVIDENCE_CATALOG_RULE4_REFERENCE_FORBIDDEN',
    );
  });

  it('15. rejects lifecycleState and ACTIVE literals', () => {
    const doc = canonicalFromFixture();
    doc.lifecycleState = 'MISSING';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc),
      'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
    );
    const doc2 = canonicalFromFixture();
    doc2.schemaKind = 'ACTIVE';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc2),
      'RULE5_EVIDENCE_CATALOG_LIFECYCLE_ACTIVE_NOT_ALLOWED',
    );
  });

  it('16. rejects clinicallyValidated, ownerApproved and activationApproved even when false', () => {
    for (const key of ['clinicallyValidated', 'ownerApproved', 'activationApproved'] as const) {
      const doc = canonicalFromFixture();
      (doc as Record<string, unknown>)[key] = false;
      expectCatalogFailure(
        () => validateRule5EmptyEvidenceCatalogDocument(doc),
        'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
      );
    }
  });

  it('17. rejects true authorization flags', () => {
    for (const [key, code] of [
      ['implemented', 'RULE5_EVIDENCE_CATALOG_IMPLEMENTED_NOT_ALLOWED'],
      ['connected', 'RULE5_EVIDENCE_CATALOG_CONNECTED_NOT_ALLOWED'],
      ['executable', 'RULE5_EVIDENCE_CATALOG_EXECUTABLE_NOT_ALLOWED'],
      ['affectsClinicalSelection', 'RULE5_EVIDENCE_CATALOG_AFFECTS_CLINICAL_SELECTION_NOT_ALLOWED'],
    ] as const) {
      const doc = canonicalFromFixture();
      doc[key] = true;
      expectCatalogFailure(() => validateRule5EmptyEvidenceCatalogDocument(doc), code);
    }
  });

  it('18. rejects non-null deterministicFingerprint', () => {
    const doc = canonicalFromFixture();
    doc.deterministicFingerprint = 'abc';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc),
      'RULE5_EVIDENCE_CATALOG_FINGERPRINT_MUST_BE_NULL',
    );
  });

  it('19. rejects unexpected root keys', () => {
    const doc = canonicalFromFixture();
    doc.fingerprintVersion = 'ehas2-rule5-evidence-catalog-fingerprint-v1';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(doc),
      'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
    );
  });

  it('20. rejects wrong version, schemaKind and policies', () => {
    const badVersion = canonicalFromFixture();
    badVersion.schemaVersion = 'ehas2-rule5-evidence-catalog-v2';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(badVersion),
      'RULE5_EVIDENCE_CATALOG_INVALID_SCHEMA_VERSION',
    );

    const badKind = canonicalFromFixture();
    badKind.schemaKind = 'WRONG';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(badKind),
      'RULE5_EVIDENCE_CATALOG_WRONG_SCHEMA_KIND',
    );

    const badEvidence = canonicalFromFixture();
    badEvidence.evidencePolicy = 'NO_THRESHOLD_AUTHORIZED';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(badEvidence),
      'RULE5_EVIDENCE_CATALOG_WRONG_EVIDENCE_POLICY',
    );

    const badThreshold = canonicalFromFixture();
    badThreshold.thresholdPolicy = 'EVIDENCE_AUDIT_REQUIRED_BEFORE_ACTIVATION';
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(badThreshold),
      'RULE5_EVIDENCE_CATALOG_WRONG_THRESHOLD_POLICY',
    );
  });

  it('21. barrel exports empty catalog symbols', async () => {
    const rule5Barrel = await import('../../packages/clinical-contracts/src/rule5/index.ts');
    expect(rule5Barrel).toHaveProperty('RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG');
    expect(rule5Barrel).toHaveProperty('validateRule5EmptyEvidenceCatalogDocument');
    expect(rule5Barrel).toHaveProperty('serializeRule5EmptyEvidenceCatalog');
    expect(rule5Barrel.RULE5_EVIDENCE_CATALOG_SCHEMA_KIND).toBe(
      'METADATA_ONLY_EMPTY_EVIDENCE_CATALOG',
    );
  });

  it('22. catalog modules forbid Rule 4 clinical import paths', () => {
    const forbidden = [
      /rule4\/selection/,
      /rule4\/evidence/,
      /rule4\/evaluator/,
      /rule4\/severity/,
      /rule4\/polarity/,
    ];
    for (const file of catalogModules) {
      const src = fs.readFileSync(path.join(catalogModuleBase, file), 'utf8');
      for (const pattern of forbidden) {
        expect(src).not.toMatch(pattern);
      }
    }
  });

  it('23. public catalog modules exclude Node fs/path/crypto', () => {
    for (const file of catalogModules) {
      const src = fs.readFileSync(path.join(catalogModuleBase, file), 'utf8');
      expect(src).not.toMatch(/node:fs|node:path|node:crypto|readFileSync|createHash/);
    }
  });

  it('24. nineRules.ts unchanged; Rule 5 remains NOT_IMPLEMENTED / no clinical selection', () => {
    const current = fs.readFileSync(nineRulesPath, 'utf8');
    expect(current).toBe(nineRulesBaseline);
    const rule5 = NINE_RULE_DEFINITIONS.find((d) => d.ruleNumber === 5);
    expect(rule5?.phase5bStatus).toBe('NOT_IMPLEMENTED');
    expect(rule5?.affectsClinicalSelection).toBe(false);
    expect(ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
  });

  it('rejects nonzero catalogRowCount and other root numerics', () => {
    const badCount = canonicalFromFixture();
    badCount.catalogRowCount = 1;
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(badCount),
      'RULE5_EVIDENCE_CATALOG_CATALOG_ROW_COUNT_NONZERO',
    );

    const badNumeric = canonicalFromFixture();
    (badNumeric as Record<string, unknown>).potency = 30;
    expectCatalogFailure(
      () => validateRule5EmptyEvidenceCatalogDocument(badNumeric),
      'RULE5_EVIDENCE_CATALOG_UNEXPECTED_FIELD',
    );
  });

  it('deep-freezes canonical empty catalog', () => {
    expect(Object.isFrozen(canon)).toBe(true);
    expect(Object.isFrozen(canon.entries)).toBe(true);
    expect(() => {
      (canon as { connected: boolean }).connected = true;
    }).toThrow();
  });
});
