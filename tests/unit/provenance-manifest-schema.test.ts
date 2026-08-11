import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MANIFEST_VERSION,
  MANUAL_REVIEW_STATUS,
  PHI_STATUS,
  POLICY_VERSION,
  PERSISTENCE_CLASS,
  RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY,
  RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY,
  RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE,
  RULE5_SYNTHETIC_MANIFEST_INVALID_ARTIFACT_ID,
  RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT,
  RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE,
  RULE5_SYNTHETIC_MANIFEST_INVALID_MANIFEST_VERSION,
  RULE5_SYNTHETIC_MANIFEST_INVALID_MANUAL_REVIEW_STATUS,
  RULE5_SYNTHETIC_MANIFEST_INVALID_PERSISTENCE_CLASS,
  RULE5_SYNTHETIC_MANIFEST_INVALID_PHI_STATUS,
  RULE5_SYNTHETIC_MANIFEST_INVALID_POLICY_VERSION,
  RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE,
  RULE5_SYNTHETIC_MANIFEST_INVALID_SCHEMA_KIND,
  RULE5_SYNTHETIC_MANIFEST_INVALID_STRUCTURAL_STATUS,
  RULE5_SYNTHETIC_MANIFEST_INVALID_TOOL_VERSION,
  RULE5_SYNTHETIC_MANIFEST_INVALID_TRUST_ZONE,
  RULE5_SYNTHETIC_MANIFEST_MISSING_FIELD,
  RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN,
  RULE5_SYNTHETIC_MANIFEST_OWNER_PRIMARY_NOT_FALSE,
  RULE5_SYNTHETIC_MANIFEST_PROTECTED_SOURCE_NOT_FALSE,
  RULE5_SYNTHETIC_MANIFEST_SYMBOL_KEY,
  RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD,
  SCHEMA_KIND,
  STRUCTURAL_STATUS,
  TOOL_VERSION,
  TRUST_ZONE,
  Rule5SyntheticManifestValidationError,
  serializeSyntheticManifest,
  validateSyntheticManifest,
} from '../../tools/provenance/manifestSchema.mjs';

const SCHEMA_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tools/provenance/manifestSchema.mjs',
);

const CANONICAL_FIELD_ORDER = [
  'manifestVersion',
  'schemaKind',
  'trustZone',
  'persistenceClass',
  'sourceArtifactId',
  'toolVersion',
  'policyVersion',
  'protectedSourceAccessed',
  'ownerPrimaryVerified',
  'phiStatus',
  'manualReviewStatus',
  'structuralStatus',
];

const ALL_FAILURE_CODES = [
  'RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE',
  'RULE5_SYNTHETIC_MANIFEST_SYMBOL_KEY',
  'RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY',
  'RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD',
  'RULE5_SYNTHETIC_MANIFEST_MISSING_FIELD',
  'RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY',
  'RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_MANIFEST_VERSION',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_SCHEMA_KIND',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_TRUST_ZONE',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_PERSISTENCE_CLASS',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_TOOL_VERSION',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_POLICY_VERSION',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_ARTIFACT_ID',
  'RULE5_SYNTHETIC_MANIFEST_PROTECTED_SOURCE_NOT_FALSE',
  'RULE5_SYNTHETIC_MANIFEST_OWNER_PRIMARY_NOT_FALSE',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_PHI_STATUS',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_MANUAL_REVIEW_STATUS',
  'RULE5_SYNTHETIC_MANIFEST_INVALID_STRUCTURAL_STATUS',
  'RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE',
];

const FORBIDDEN_MODULE_IMPORTS = [
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:path['"]/,
  /from\s+['"]node:os['"]/,
  /from\s+['"]node:crypto['"]/,
  /process\.env/,
  /from\s+['"]node:http['"]/,
  /from\s+['"]node:https['"]/,
  /from\s+['"]node:net['"]/,
  /from\s+['"]child_process['"]/,
  /from\s+['"]node:child_process['"]/,
  /WeakSet/,
  /WeakMap/,
  /__set.*Seam/,
  /TestSeam/,
];

/** @param {Record<string, unknown>} [overrides] */
function canonicalInput(overrides = {}) {
  return {
    manifestVersion: MANIFEST_VERSION,
    schemaKind: SCHEMA_KIND,
    trustZone: TRUST_ZONE,
    persistenceClass: PERSISTENCE_CLASS,
    sourceArtifactId: 'SYN-0001',
    toolVersion: TOOL_VERSION,
    policyVersion: POLICY_VERSION,
    protectedSourceAccessed: false,
    ownerPrimaryVerified: false,
    phiStatus: PHI_STATUS,
    manualReviewStatus: MANUAL_REVIEW_STATUS,
    structuralStatus: STRUCTURAL_STATUS,
    ...overrides,
  };
}

/** @param {unknown} input @param {string} code */
function expectFailureCode(input, code) {
  try {
    validateSyntheticManifest(input);
    throw new Error('expected validation failure');
  } catch (err) {
    expect(err).toBeInstanceOf(Rule5SyntheticManifestValidationError);
    expect(err.failureCode).toBe(code);
    expect(err.message).toBe(code);
  }
}

function shaLike() {
  return 'sha256:' + 'a'.repeat(64);
}

describe('provenance manifestSchema (P2-C2 synthetic repo-safe)', () => {
  it('accepts canonical object with phiStatus present', () => {
    const input = canonicalInput();
    const copy = validateSyntheticManifest(input);
    expect(copy.phiStatus).toBe(PHI_STATUS);
    expect(Object.isFrozen(copy)).toBe(true);
    expect(copy).not.toBe(input);
  });

  it('canonical object has exactly 12 keys', () => {
    const copy = validateSyntheticManifest(canonicalInput());
    expect(Object.keys(copy).sort()).toEqual([...CANONICAL_FIELD_ORDER].sort());
    expect(Object.keys(copy)).toHaveLength(12);
  });

  it('serializes deterministically with exactly one LF', () => {
    const a = serializeSyntheticManifest(canonicalInput({ sourceArtifactId: 'SYN-00000001' }));
    const b = serializeSyntheticManifest(canonicalInput({ sourceArtifactId: 'SYN-00000001' }));
    expect(a).toBe(b);
    expect(a.endsWith('\n')).toBe(true);
    expect(a.match(/\n/g)).toHaveLength(1);
    expect(a.endsWith('\n\n')).toBe(false);
  });

  it('serializeSyntheticManifest validates internally', () => {
    expectFailureCode(null, RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
    expect(() => serializeSyntheticManifest(null)).toThrow(Rule5SyntheticManifestValidationError);
  });

  it('exports all 22 failure codes as string constants', () => {
    const source = readFileSync(SCHEMA_PATH, 'utf8');
    for (const code of ALL_FAILURE_CODES) {
      expect(source).toContain(code);
    }
  });

  it('module has zero forbidden imports and no registry/seam', () => {
    const source = readFileSync(SCHEMA_PATH, 'utf8');
    for (const pattern of FORBIDDEN_MODULE_IMPORTS) {
      expect(source).not.toMatch(pattern);
    }
    expect(source).not.toMatch(/^import\s/m);
  });

  it('rejects non-object, null, and array roots', () => {
    for (const bad of [null, undefined, 1, 'x', true]) {
      expectFailureCode(bad, RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
    }
    expectFailureCode([], RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
  });

  it('rejects null-prototype, class instance, and custom prototype objects', () => {
    expectFailureCode(Object.create(null), RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE);
    class Box {}
    expectFailureCode(new Box(), RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE);
    expectFailureCode(
      Object.create({ manifestVersion: MANIFEST_VERSION }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE,
    );
  });

  it('reports MISSING_FIELD for ordinary object missing own field', () => {
    const input = canonicalInput();
    delete input.toolVersion;
    expectFailureCode(input, RULE5_SYNTHETIC_MANIFEST_MISSING_FIELD);
  });

  it('rejects inherited required field on custom prototype as INVALID_PROTOTYPE', () => {
    const base = canonicalInput();
    const child = Object.create(base);
    expectFailureCode(child, RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE);
  });

  it('rejects symbol keys before unexpected string keys', () => {
    const input = canonicalInput();
    Object.defineProperty(input, Symbol('extra'), { value: 1, enumerable: true });
    Object.defineProperty(input, 'foo', { value: 1, enumerable: true });
    expectFailureCode(input, RULE5_SYNTHETIC_MANIFEST_SYMBOL_KEY);
  });

  it('classifies sensitive unexpected key as FORBIDDEN_KEY', () => {
    expectFailureCode(
      { ...canonicalInput(), patientId: 'x' },
      RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY,
    );
    expectFailureCode({ ...canonicalInput(), phi: 'x' }, RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY);
    expectFailureCode(
      { ...canonicalInput(), 'TH-01': 'x' },
      RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY,
    );
  });

  it('classifies neutral unexpected key as UNEXPECTED_FIELD', () => {
    expectFailureCode({ ...canonicalInput(), foo: 'x' }, RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD);
    expectFailureCode(
      { ...canonicalInput(), phiData: 'x' },
      RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD,
    );
  });

  it('picks same first unexpected key regardless of insertion order', () => {
    const a = { ...canonicalInput(), zebra: 1, alpha: 2 };
    const b = { ...canonicalInput(), alpha: 2, zebra: 1 };
    expectFailureCode(a, RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD);
    expectFailureCode(b, RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD);
  });

  it('rejects getter without invoking it', () => {
    let calls = 0;
    const input = canonicalInput();
    Object.defineProperty(input, 'toolVersion', {
      get() {
        calls += 1;
        return TOOL_VERSION;
      },
      enumerable: true,
      configurable: true,
    });
    expectFailureCode(input, RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY);
    expect(calls).toBe(0);
  });

  it('rejects setter and getter+setter descriptors', () => {
    const withSetter = canonicalInput();
    Object.defineProperty(withSetter, 'policyVersion', {
      set() {},
      enumerable: true,
      configurable: true,
    });
    expectFailureCode(withSetter, RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY);

    const withBoth = canonicalInput();
    Object.defineProperty(withBoth, 'policyVersion', {
      get() {
        return POLICY_VERSION;
      },
      set() {},
      enumerable: true,
      configurable: true,
    });
    expectFailureCode(withBoth, RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY);
  });

  it('rejects nested, null, and undefined values before boolean guards', () => {
    expectFailureCode(
      canonicalInput({ protectedSourceAccessed: null }),
      RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN,
    );
    expectFailureCode(
      canonicalInput({ protectedSourceAccessed: {} }),
      RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN,
    );
    expectFailureCode(
      canonicalInput({ ownerPrimaryVerified: undefined }),
      RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN,
    );
  });

  it('rejects wrong primitive types on boolean fields', () => {
    expectFailureCode(
      canonicalInput({ protectedSourceAccessed: 'false' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE,
    );
    expectFailureCode(
      canonicalInput({ ownerPrimaryVerified: 0 }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE,
    );
  });

  it('rejects boolean true with NOT_FALSE codes', () => {
    expectFailureCode(
      canonicalInput({ protectedSourceAccessed: true }),
      RULE5_SYNTHETIC_MANIFEST_PROTECTED_SOURCE_NOT_FALSE,
    );
    expectFailureCode(
      canonicalInput({ ownerPrimaryVerified: true }),
      RULE5_SYNTHETIC_MANIFEST_OWNER_PRIMARY_NOT_FALSE,
    );
  });

  it('reports each missing field in canonical order', () => {
    for (const field of CANONICAL_FIELD_ORDER) {
      const input = canonicalInput();
      delete input[field];
      expectFailureCode(input, RULE5_SYNTHETIC_MANIFEST_MISSING_FIELD);
    }
  });

  it('rejects wrong exact literals with field-specific codes', () => {
    expectFailureCode(
      canonicalInput({ manifestVersion: 'WRONG' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_MANIFEST_VERSION,
    );
    expectFailureCode(
      canonicalInput({ schemaKind: 'WRONG' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_SCHEMA_KIND,
    );
    expectFailureCode(
      canonicalInput({ trustZone: 'WRONG' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_TRUST_ZONE,
    );
    expectFailureCode(
      canonicalInput({ persistenceClass: 'WRONG' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_PERSISTENCE_CLASS,
    );
    expectFailureCode(
      canonicalInput({ toolVersion: 'WRONG' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_TOOL_VERSION,
    );
    expectFailureCode(
      canonicalInput({ policyVersion: 'WRONG' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_POLICY_VERSION,
    );
  });

  it('applies SHA-like precedence before artifact and status literals', () => {
    const sha = shaLike();
    expectFailureCode(
      canonicalInput({ sourceArtifactId: sha }),
      RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE,
    );
    expectFailureCode(canonicalInput({ phiStatus: sha }), RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE);
    expectFailureCode(
      canonicalInput({ manifestVersion: sha }),
      RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE,
    );
  });

  it('validates artifact ID numeric grammar and rejects semantic IDs', () => {
    expect(
      validateSyntheticManifest(canonicalInput({ sourceArtifactId: 'SYN-0001' })).sourceArtifactId,
    ).toBe('SYN-0001');
    expect(
      validateSyntheticManifest(canonicalInput({ sourceArtifactId: 'SYN-00000001' }))
        .sourceArtifactId,
    ).toBe('SYN-00000001');
    for (const bad of [
      'SYN-001',
      'SYN-PASS',
      'SYN-PATIENT1',
      'SYN-MED1',
      'syn-0001',
      'SYN-0001 ',
    ]) {
      expectFailureCode(
        canonicalInput({ sourceArtifactId: bad }),
        RULE5_SYNTHETIC_MANIFEST_INVALID_ARTIFACT_ID,
      );
    }
  });

  it('maps wrong status strings to FORBIDDEN_VALUE or field-specific codes', () => {
    expectFailureCode(
      canonicalInput({ phiStatus: 'VERIFIED' }),
      RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE,
    );
    expectFailureCode(
      canonicalInput({ manualReviewStatus: 'READY' }),
      RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE,
    );
    expectFailureCode(
      canonicalInput({ structuralStatus: 'WRONG' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_STRUCTURAL_STATUS,
    );
    expectFailureCode(
      canonicalInput({ phiStatus: 'OTHER' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_PHI_STATUS,
    );
    expectFailureCode(
      canonicalInput({ manualReviewStatus: 'OTHER' }),
      RULE5_SYNTHETIC_MANIFEST_INVALID_MANUAL_REVIEW_STATUS,
    );
  });

  it('returns frozen copy that survives input mutation', () => {
    const input = canonicalInput();
    const copy = validateSyntheticManifest(input);
    input.sourceArtifactId = 'SYN-9999';
    input.protectedSourceAccessed = true;
    expect(copy.sourceArtifactId).toBe('SYN-0001');
    expect(copy.protectedSourceAccessed).toBe(false);
    expect(Object.isFrozen(copy)).toBe(true);
  });
});
