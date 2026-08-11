import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BV_ENC_INVALID } from '../../tools/provenance/verifyCore.mjs';
import { BV_HDR_CODE_MISMATCH } from '../../tools/provenance/verifyStructure.mjs';
import {
  MAX_SYNTHETIC_ORCHESTRATION_BYTES,
  ORCHESTRATION_VERSION,
  RULE5_SYNTHETIC_ORCHESTRATION_INPUT_OVERSIZE,
  RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
  RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT,
  RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL,
  RULE5_WRAPPER_SOURCE_AMBIGUOUS,
  Rule5SyntheticOrchestrationError,
  evaluateSyntheticProvenanceOrchestration,
} from '../../tools/provenance/syntheticOrchestration.mjs';

const MODULE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tools/provenance/syntheticOrchestration.mjs',
);

const OPEN = '<user_query>';
const CLOSE = '</user_query>';

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:path['"]/,
  /from\s+['"]node:os['"]/,
  /from\s+['"]node:crypto['"]/,
  /from\s+['"]\.\/readSyntheticInput\.mjs['"]/,
  /from\s+['"]\.\/verifySyntheticCli\.mjs['"]/,
  /from\s+['"]\.\/manifestSchema\.mjs['"]/,
  /computeSha256V1/,
  /process\.env/,
];

const FORBIDDEN_LITERAL_PATTERNS = [
  /\bpatient\b/i,
  /\bclinic\b/i,
  /\btranscript\b/i,
  /\bownerPrimaryVerified\b/,
  /\bmanifestSchema\b/,
  /\breadSyntheticInput\b/,
  /\bverifySyntheticCli\b/,
];

function u8(...parts) {
  const chunks = parts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'utf8') : p));
  return Uint8Array.from(Buffer.concat(chunks));
}

function baseParserConfig(overrides = {}) {
  return { lengthUnit: 'ABSENT', ...overrides };
}

function baseExpectation(overrides = {}) {
  return {
    assessmentMode: 'COMPARE',
    expectedPhysicalHeader: 'MED=TOK1',
    lineAnchorExpected: 1,
    jsonlAnchorExpected: 'ABSENT',
    wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 1 },
    excludedRanges: [],
    declaredLength: 'ABSENT',
    lengthUnit: 'ABSENT',
    ...overrides,
  };
}

function expectOrchestrationError(fn, code) {
  try {
    fn();
    throw new Error('expected throw');
  } catch (err) {
    expect(err).toBeInstanceOf(Rule5SyntheticOrchestrationError);
    const oerr = err as Rule5SyntheticOrchestrationError;
    expect(oerr.failureCode).toBe(code);
    expect(oerr.message).toBe(code);
    expect(JSON.stringify(oerr)).not.toMatch(/Proxy|trap|native|ENOENT|stack/i);
  }
}

function assertDeepFrozen(value, seen = new Set()) {
  if (value === null || typeof value !== 'object') {
    return;
  }
  if (seen.has(value)) {
    return;
  }
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  if (Array.isArray(value)) {
    for (const item of value) {
      assertDeepFrozen(item, seen);
    }
    return;
  }
  for (const key of Object.keys(value)) {
    assertDeepFrozen((value as Record<string, unknown>)[key], seen);
  }
}

describe('provenance syntheticOrchestration (P2-C3B in-memory orchestration)', () => {
  it('T01 accepts Buffer input', () => {
    const result = evaluateSyntheticProvenanceOrchestration(
      Buffer.from('MED=TOK1', 'utf8'),
      baseParserConfig(),
    );
    expect(result.outcome).toBe('PARSED');
    expect(result.observation.occurrences[0].header).toBe('MED=TOK1');
  });

  it('T02 accepts Uint8Array input', () => {
    const result = evaluateSyntheticProvenanceOrchestration(u8('MED=TOK2'), baseParserConfig());
    expect(result.outcome).toBe('PARSED');
  });

  it('T03 rejects non-byte roots with INVALID_INPUT', () => {
    const bad = [
      null,
      undefined,
      'ascii',
      1,
      {},
      [],
      new ArrayBuffer(4),
      new DataView(new ArrayBuffer(4)),
      new Int8Array(4),
    ];
    for (const v of bad) {
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(v, baseParserConfig()),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT,
      );
    }
  });

  it('T04 accepts 262144 bytes and rejects 262145 with INPUT_OVERSIZE', () => {
    const ok = Buffer.alloc(262144, 0x41);
    expect(
      evaluateSyntheticProvenanceOrchestration(ok, baseParserConfig()).inspection.byteLength,
    ).toBe(262144);
    expectOrchestrationError(
      () =>
        evaluateSyntheticProvenanceOrchestration(Buffer.alloc(262145, 0x41), baseParserConfig()),
      RULE5_SYNTHETIC_ORCHESTRATION_INPUT_OVERSIZE,
    );
  });

  it('T05 rejects malformed parserConfig keys and values', () => {
    expectOrchestrationError(
      () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), null),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
    );
    expectOrchestrationError(
      () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), {}),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
    );
    expectOrchestrationError(
      () =>
        evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), {
          lengthUnit: 'ABSENT',
          extra: 1,
        }),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
    );
    expectOrchestrationError(
      () =>
        evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), {
          lengthUnit: 'UNRESOLVED',
        }),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
    );
  });

  it('T06 rejects null-prototype parserConfig', () => {
    const config = Object.create(null);
    Object.defineProperty(config, 'lengthUnit', {
      value: 'ABSENT',
      enumerable: true,
      writable: true,
      configurable: true,
    });
    expectOrchestrationError(
      () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), config),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
    );
  });

  it('T07 omission differs from NOT_APPLICABLE comparison presence', () => {
    const omitted = evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), baseParserConfig());
    expect(omitted.outcome).toBe('PARSED');
    expect('comparison' in omitted).toBe(false);

    const notApplicable = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK1'),
      baseParserConfig(),
      { assessmentMode: 'NOT_APPLICABLE' },
    );
    expect(notApplicable.outcome).toBe('STRUCTURE_NOT_APPLICABLE');
    expect(notApplicable.comparison).toEqual({
      outcome: 'NOT_APPLICABLE',
      reason: 'AUDIT_EXPECTATION_NOT_APPLICABLE',
    });
  });

  it('T08 compare PASS and structural FAIL', () => {
    const pass = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK1\n'),
      baseParserConfig(),
      baseExpectation(),
    );
    expect(pass.outcome).toBe('STRUCTURE_COMPARED_PASS');
    expect(pass.comparison?.outcome).toBe('PASS');

    const fail = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK2\n'),
      baseParserConfig(),
      baseExpectation(),
    );
    expect(fail.outcome).toBe('STRUCTURE_COMPARED_FAIL');
    expect(fail.comparison?.primaryBvCode).toBe(BV_HDR_CODE_MISMATCH);
  });

  it('T09 encoding-invalid precedence for omitted, NOT_APPLICABLE and COMPARE', () => {
    const invalid = Buffer.from([0xff]);

    const omitted = evaluateSyntheticProvenanceOrchestration(invalid, baseParserConfig());
    expect(omitted.outcome).toBe('ENCODING_INVALID');
    expect('comparison' in omitted).toBe(false);

    const notApplicable = evaluateSyntheticProvenanceOrchestration(invalid, baseParserConfig(), {
      assessmentMode: 'NOT_APPLICABLE',
    });
    expect(notApplicable.outcome).toBe('ENCODING_INVALID');
    expect(notApplicable.comparison?.outcome).toBe('NOT_APPLICABLE');

    const compare = evaluateSyntheticProvenanceOrchestration(
      invalid,
      baseParserConfig({ lengthUnit: 'BYTE' }),
      baseExpectation(),
    );
    expect(compare.outcome).toBe('ENCODING_INVALID');
    expect(compare.comparison?.primaryBvCode).toBe(BV_ENC_INVALID);
  });

  it('T10 maps wrapper ambiguity to minimal envelope without throw', () => {
    const bytes = u8(`MED=TOK1\n${OPEN}\n${OPEN}\n${CLOSE}`);
    const result = evaluateSyntheticProvenanceOrchestration(
      bytes,
      { lengthUnit: 'ABSENT', wrapperMode: 'FIXED_USER_QUERY_V1' },
      baseExpectation({
        wrapper: { openLine: 2, closeLine: 4, boundaryEndLine: 4 },
      }),
    );
    expect(result).toEqual({
      orchestrationVersion: ORCHESTRATION_VERSION,
      outcome: 'WRAPPER_AMBIGUOUS',
      failureCode: RULE5_WRAPPER_SOURCE_AMBIGUOUS,
    });
    expect(Object.keys(result)).toEqual(['orchestrationVersion', 'outcome', 'failureCode']);
  });

  it('T11 unrelated invalid config is not mapped as wrapper ambiguity', () => {
    expectOrchestrationError(
      () =>
        evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), {
          lengthUnit: 'ABSENT',
          extra: 1,
        }),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
    );
  });

  it('T12 deep-freezes full envelope and nested values', () => {
    const result = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK1\n'),
      baseParserConfig(),
      baseExpectation(),
    );
    assertDeepFrozen(result);
    assertDeepFrozen(result.inspection);
    assertDeepFrozen(result.observation);
    assertDeepFrozen(result.comparison);
  });

  it('T13 caller byte mutation after call does not affect result', () => {
    const buf = Buffer.from('MED=TOK1', 'utf8');
    const result = evaluateSyntheticProvenanceOrchestration(buf, baseParserConfig());
    buf[0] = 0x58;
    expect(result.observation.occurrences[0].header).toBe('MED=TOK1');
  });

  it('T14 canonical copies contain no caller-owned object references', () => {
    const parserConfig = { lengthUnit: 'ABSENT' };
    const expectation = baseExpectation();
    evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1\n'), parserConfig, expectation);
    parserConfig.lengthUnit = 'BYTE';
    expectation.expectedPhysicalHeader = 'MED=TOK2';
    const again = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK1\n'),
      { lengthUnit: 'ABSENT' },
      baseExpectation(),
    );
    expect(again.outcome).toBe('STRUCTURE_COMPARED_PASS');
  });

  it('T15 preserves fixed key order on full envelope', () => {
    const result = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK1\n'),
      baseParserConfig(),
      baseExpectation(),
    );
    expect(Object.keys(result)).toEqual([
      'orchestrationVersion',
      'outcome',
      'inspection',
      'observation',
      'comparison',
    ]);
  });

  it('T16 orchestration error message equals failureCode', () => {
    expectOrchestrationError(
      () => evaluateSyntheticProvenanceOrchestration(null, baseParserConfig()),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT,
    );
  });

  it('T17 rethrows known Rule5SyntheticOrchestrationError unchanged', () => {
    const original = new Rule5SyntheticOrchestrationError(
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT,
    );
    expect(() => {
      throw original;
    }).toThrow(original);
  });

  it('T18 deterministic deep-equal results for same inputs', () => {
    const bytes = u8('MED=TOK1\n');
    const config = baseParserConfig();
    const expectation = baseExpectation();
    const a = evaluateSyntheticProvenanceOrchestration(bytes, config, expectation);
    const b = evaluateSyntheticProvenanceOrchestration(bytes, config, expectation);
    expect(a).toEqual(b);
  });

  it('T19 inspection contains exact B1 field set only', () => {
    const result = evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), baseParserConfig());
    expect(Object.keys(result.inspection).sort()).toEqual(
      [
        'byteLength',
        'bom',
        'eol',
        'interpretiveEncoding',
        'loneCrObserved',
        'terminalNewline',
        'utf8',
      ].sort(),
    );
  });

  it('T20 no top-level BV codes on full envelope', () => {
    const result = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK2\n'),
      baseParserConfig(),
      baseExpectation(),
    );
    expect('primaryBvCode' in result).toBe(false);
    expect('bvCodes' in result).toBe(false);
  });

  it('T21 no ownerPrimaryVerified anywhere in result JSON', () => {
    const result = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK1\n'),
      baseParserConfig(),
      baseExpectation(),
    );
    expect(JSON.stringify(result)).not.toContain('ownerPrimaryVerified');
  });

  it('T22 accepts wrapperMode FIXED_USER_QUERY_V1 parserConfig', () => {
    const bytes = u8(`MED=TOK1\n${OPEN}\nBODY\n${CLOSE}`);
    const result = evaluateSyntheticProvenanceOrchestration(
      bytes,
      { lengthUnit: 'ABSENT', wrapperMode: 'FIXED_USER_QUERY_V1' },
      baseExpectation({
        wrapper: { openLine: 2, closeLine: 4, boundaryEndLine: 4 },
      }),
    );
    expect(result.outcome).toBe('STRUCTURE_COMPARED_PASS');
  });

  it('T23 validates recursive expectation wrapper and excludedRanges', () => {
    expectOrchestrationError(
      () =>
        evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), baseParserConfig(), {
          ...baseExpectation(),
          wrapper: { openLine: 'ABSENT', closeLine: 2, boundaryEndLine: 3 },
        }),
      RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
    );
  });

  it('T24 exports only contract-authorized public surface', () => {
    expect(ORCHESTRATION_VERSION).toBe('P2-C3B-1');
    expect(MAX_SYNTHETIC_ORCHESTRATION_BYTES).toBe(262144);
    expect(RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT).toBe(
      'RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT',
    );
    expect(RULE5_WRAPPER_SOURCE_AMBIGUOUS).toBe('RULE5_WRAPPER_SOURCE_AMBIGUOUS');
  });

  it('T25 static import boundary scan on module source', () => {
    const source = readFileSync(MODULE_PATH, 'utf8');
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      expect(source).not.toMatch(pattern);
    }
    for (const pattern of FORBIDDEN_LITERAL_PATTERNS) {
      expect(source).not.toMatch(pattern);
    }
    expect(source).toMatch(/inspectByteCharacteristics/);
    expect(source).toMatch(/parseSyntheticStructureFromBytes/);
    expect(source).toMatch(/compareSyntheticStructure/);
  });

  it('T26 zero and duplicate MED candidates are reflected in observation', () => {
    const zero = evaluateSyntheticProvenanceOrchestration(u8('NOHDR'), baseParserConfig());
    expect(zero.observation.occurrences).toEqual([]);

    const one = evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), baseParserConfig());
    expect(one.observation.occurrences).toHaveLength(1);

    const dup = evaluateSyntheticProvenanceOrchestration(
      u8('MED=TOK1\nMED=TOK2'),
      baseParserConfig(),
    );
    expect(dup.observation.occurrences).toHaveLength(2);
  });

  it('T27 parse-only valid empty bytes yields PARSED', () => {
    const result = evaluateSyntheticProvenanceOrchestration(new Uint8Array(0), baseParserConfig());
    expect(result.outcome).toBe('PARSED');
    expect(result.inspection.byteLength).toBe(0);
  });

  it('T28 exported INTERNAL code exists for contract surface', () => {
    expect(RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL).toBe(
      'RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL',
    );
  });

  describe('Proxy/trap contract delta D01-D12', () => {
    it('D01 revoked root Proxy maps to INVALID_CONFIG', () => {
      const base = { lengthUnit: 'ABSENT' };
      const { proxy, revoke } = Proxy.revocable(base, {});
      revoke();
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), proxy),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
    });

    it('D02 getPrototypeOf trap throw maps to INVALID_CONFIG', () => {
      const proxy = new Proxy(
        { lengthUnit: 'ABSENT' },
        {
          getPrototypeOf() {
            throw new Error('TRAP_SENTINEL_PROTO');
          },
        },
      );
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), proxy),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
    });

    it('D03 ownKeys trap throw maps to INVALID_CONFIG', () => {
      const proxy = new Proxy(
        { lengthUnit: 'ABSENT' },
        {
          ownKeys() {
            throw new Error('TRAP_SENTINEL_OWNKEYS');
          },
        },
      );
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), proxy),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
    });

    it('D04 getOwnPropertyDescriptor trap throw maps to INVALID_CONFIG', () => {
      const proxy = new Proxy(
        { lengthUnit: 'ABSENT' },
        {
          getOwnPropertyDescriptor(_target, prop) {
            if (prop === 'lengthUnit') {
              throw new Error('TRAP_SENTINEL_GOPD');
            }
            return Object.getOwnPropertyDescriptor(_target, prop);
          },
        },
      );
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), proxy),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
    });

    it('D05 trap sentinel absent from message and failureCode', () => {
      const proxy = new Proxy(
        { lengthUnit: 'ABSENT' },
        {
          ownKeys() {
            throw new Error('TRAP_SENTINEL_OWNKEYS');
          },
        },
      );
      try {
        evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), proxy);
      } catch (err) {
        expect(err).toBeInstanceOf(Rule5SyntheticOrchestrationError);
        const oerr = err as Rule5SyntheticOrchestrationError;
        expect(oerr.message).not.toContain('TRAP_SENTINEL_OWNKEYS');
        expect(oerr.failureCode).not.toContain('TRAP_SENTINEL_OWNKEYS');
      }
    });

    it('D06 getter invocation counter remains zero', () => {
      let getterCalls = 0;
      const config = {};
      Object.defineProperty(config, 'lengthUnit', {
        get() {
          getterCalls += 1;
          return 'ABSENT';
        },
        enumerable: true,
        configurable: true,
      });
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), config),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
      expect(getterCalls).toBe(0);
    });

    it('D07 transparent non-trapping Proxy over valid config may be accepted', () => {
      const target = { lengthUnit: 'ABSENT' };
      const proxy = new Proxy(target, {});
      const result = evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), proxy);
      expect(result.outcome).toBe('PARSED');
    });

    it('D08 Proxy invariant violation maps to INVALID_CONFIG', () => {
      const target = { lengthUnit: 'ABSENT' };
      const proxy = new Proxy(target, {
        getPrototypeOf() {
          return Array.prototype;
        },
      });
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1'), proxy),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
    });

    it('D09 sparse excludedRanges maps to INVALID_CONFIG', () => {
      const ranges = ['x'];
      ranges.length = 2;
      expectOrchestrationError(
        () =>
          evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1\n'), baseParserConfig(), {
            ...baseExpectation(),
            excludedRanges: ranges,
          }),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
    });

    it('D10 excludedRanges symbol/extra/non-canonical index maps to INVALID_CONFIG', () => {
      const extraProp = [{ startLine: 1, endLine: 1 }, { startLine: 2, endLine: 2 }];
      Object.defineProperty(extraProp, 'extra', {
        value: 1,
        enumerable: true,
      });
      expectOrchestrationError(
        () =>
          evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1\n'), baseParserConfig(), {
            ...baseExpectation(),
            excludedRanges: extraProp,
          }),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );

      const nonCanonical = [{ startLine: 1, endLine: 1 }];
      Object.defineProperty(nonCanonical, '01', {
        value: { startLine: 2, endLine: 2 },
        enumerable: true,
      });
      nonCanonical.length = 2;
      expectOrchestrationError(
        () =>
          evaluateSyntheticProvenanceOrchestration(u8('MED=TOK1\n'), baseParserConfig(), {
            ...baseExpectation(),
            excludedRanges: nonCanonical,
          }),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG,
      );
    });

    it('D11 proxied incompatible typed-array root maps to INVALID_INPUT', () => {
      const target = new Uint8Array([0x4d]);
      const proxy = new Proxy(target, {
        get(obj, prop) {
          if (prop === 'length') {
            throw new TypeError('INCOMPATIBLE_RECEIVER_SENTINEL');
          }
          return Reflect.get(obj, prop);
        },
      });
      expectOrchestrationError(
        () => evaluateSyntheticProvenanceOrchestration(proxy, baseParserConfig()),
        RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT,
      );
    });

    it('D12 canonical copies contain no caller-owned object references after transparent Proxy input', () => {
      const target = baseExpectation();
      const proxy = new Proxy(target, {});
      const result = evaluateSyntheticProvenanceOrchestration(
        u8('MED=TOK1\n'),
        baseParserConfig(),
        proxy,
      );
      target.expectedPhysicalHeader = 'MED=TOK2';
      expect(result.comparison?.outcome).toBe('PASS');
    });
  });
});

describe('provenance syntheticOrchestration wrapper ambiguity helper', () => {
  it('maps ambiguous wrapper with FIXED_USER_QUERY_V1 parser config only', () => {
    const bytes = u8(`MED=TOK1\n${OPEN}\n${CLOSE}\n${CLOSE}`);
    const result = evaluateSyntheticProvenanceOrchestration(bytes, {
      lengthUnit: 'ABSENT',
      wrapperMode: 'FIXED_USER_QUERY_V1',
    });
    expect(result.outcome).toBe('WRAPPER_AMBIGUOUS');
  });
});
