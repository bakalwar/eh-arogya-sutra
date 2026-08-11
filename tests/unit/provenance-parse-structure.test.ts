import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BV_ENC_INVALID } from '../../tools/provenance/verifyCore.mjs';
import {
  BV_WRAPPER_MISMATCH,
  compareSyntheticStructure,
} from '../../tools/provenance/verifyStructure.mjs';
import {
  RULE5_WRAPPER_SOURCE_AMBIGUOUS,
  Rule5WrapperSourceAmbiguityError,
  parseSyntheticStructureFromBytes,
} from '../../tools/provenance/parseStructure.mjs';

const PARSER_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tools/provenance/parseStructure.mjs',
);

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:path['"]/,
  /from\s+['"]node:os['"]/,
  /from\s+['"]node:crypto['"]/,
  /from\s+['"]node:http['"]/,
  /from\s+['"]\.\/verifyStructure\.mjs['"]/,
  /process\.env/,
];

const MAX_BYTES = 262144;

function encInvalidObservation() {
  return {
    interpretiveEncoding: BV_ENC_INVALID,
    occurrences: [],
    lineAnchorObserved: 'ABSENT',
    jsonlAnchorObserved: 'ABSENT',
    wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 1 },
    excludedRanges: [],
    observedLength: 'ABSENT',
    observedLengthUnit: 'ABSENT',
  };
}

function u8(...parts) {
  const chunks = parts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : p));
  return Uint8Array.from(Buffer.concat(chunks));
}

describe('provenance parseStructure (P2-B2B basic in-memory parser)', () => {
  it('accepts Buffer input', () => {
    const obs = parseSyntheticStructureFromBytes(Buffer.from('MED=TOK1', 'utf8'), {
      lengthUnit: 'ABSENT',
    });
    expect(obs.occurrences[0].header).toBe('MED=TOK1');
  });

  it('accepts Uint8Array input', () => {
    const obs = parseSyntheticStructureFromBytes(new Uint8Array([0x4d, 0x45, 0x44, 0x3d, 0x41]), {
      lengthUnit: 'ABSENT',
    });
    expect(obs.occurrences[0].header).toBe('MED=A');
  });

  it('rejects non-byte input types with TypeError', () => {
    const bad = [
      null,
      undefined,
      'ascii',
      1,
      {},
      [],
      new ArrayBuffer(4),
      new DataView(new ArrayBuffer(4)),
    ];
    for (const v of bad) {
      expect(() => parseSyntheticStructureFromBytes(v, { lengthUnit: 'ABSENT' })).toThrow(
        TypeError,
      );
    }
  });

  it('rejects malformed and extra config keys', () => {
    expect(() => parseSyntheticStructureFromBytes(u8(''), null)).toThrow(TypeError);
    expect(() => parseSyntheticStructureFromBytes(u8(''), {})).toThrow(TypeError);
    expect(() =>
      parseSyntheticStructureFromBytes(u8(''), { lengthUnit: 'ABSENT', extra: 1 }),
    ).toThrow(TypeError);
    expect(() => parseSyntheticStructureFromBytes(u8(''), { lengthUnit: 'UNRESOLVED' })).toThrow(
      TypeError,
    );
  });

  describe('strict ParserConfig own-key contract', () => {
    const bytes = u8('');

    it('accepts ordinary literal { lengthUnit: BYTE }', () => {
      expect(() => parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'BYTE' })).not.toThrow();
    });

    it('accepts null-prototype config with one own data property lengthUnit', () => {
      const config = Object.create(null);
      Object.defineProperty(config, 'lengthUnit', {
        value: 'BYTE',
        enumerable: true,
        writable: true,
        configurable: true,
      });
      expect(parseSyntheticStructureFromBytes(bytes, config).observedLengthUnit).toBe('BYTE');
    });

    it('accepts null-prototype config with non-enumerable own data lengthUnit', () => {
      const config = Object.create(null);
      Object.defineProperty(config, 'lengthUnit', {
        value: 'ABSENT',
        enumerable: false,
        writable: true,
        configurable: true,
      });
      expect(parseSyntheticStructureFromBytes(bytes, config).observedLengthUnit).toBe('ABSENT');
    });

    it('rejects class instance with own lengthUnit property', () => {
      class ParserConfig {
        lengthUnit = 'BYTE';
      }
      expect(() => parseSyntheticStructureFromBytes(bytes, new ParserConfig())).toThrow(TypeError);
    });

    it('rejects class instance with inherited lengthUnit only', () => {
      class Base {
        lengthUnit = 'BYTE';
      }
      class Derived extends Base {}
      expect(() => parseSyntheticStructureFromBytes(bytes, new Derived())).toThrow(TypeError);
    });

    it('rejects Object.create({ lengthUnit: BYTE })', () => {
      const config = Object.create({ lengthUnit: 'BYTE' });
      expect(() => parseSyntheticStructureFromBytes(bytes, config)).toThrow(TypeError);
    });

    it('rejects ordinary object inheriting lengthUnit from prototype', () => {
      const config = Object.create({ lengthUnit: 'UTF8_CODEPOINT' });
      expect(() => parseSyntheticStructureFromBytes(bytes, config)).toThrow(TypeError);
    });

    it('rejects valid object plus symbol key', () => {
      const config = { lengthUnit: 'BYTE', [Symbol('meta')]: 1 };
      expect(() => parseSyntheticStructureFromBytes(bytes, config)).toThrow(TypeError);
    });

    it('rejects null-prototype object without own lengthUnit key', () => {
      expect(() => parseSyntheticStructureFromBytes(bytes, Object.create(null))).toThrow(TypeError);
    });

    it('rejects getter-only lengthUnit accessor descriptor', () => {
      const config = { lengthUnit: 'BYTE' };
      Object.defineProperty(config, 'lengthUnit', {
        get() {
          return 'BYTE';
        },
        configurable: true,
      });
      expect(() => parseSyntheticStructureFromBytes(bytes, config)).toThrow(TypeError);
    });

    it('rejects config with extra string key', () => {
      expect(() =>
        parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'BYTE', extra: true }),
      ).toThrow(TypeError);
    });

    it('rejects config with only symbol key described as lengthUnit', () => {
      const sym = Symbol('lengthUnit');
      expect(() => parseSyntheticStructureFromBytes(bytes, { [sym]: 'BYTE' })).toThrow(TypeError);
    });

    it('rejects array carrying lengthUnit property', () => {
      const config = ['BYTE'];
      config.lengthUnit = 'BYTE';
      expect(() => parseSyntheticStructureFromBytes(bytes, config)).toThrow(TypeError);
    });
  });

  it('accepts 262144 bytes and rejects 262145 with RangeError', () => {
    const ok = new Uint8Array(MAX_BYTES);
    expect(() => parseSyntheticStructureFromBytes(ok, { lengthUnit: 'BYTE' })).not.toThrow();
    const big = new Uint8Array(MAX_BYTES + 1);
    expect(() => parseSyntheticStructureFromBytes(big, { lengthUnit: 'BYTE' })).toThrow(RangeError);
  });

  it('empty bytes yield one logical line and boundary 1', () => {
    const obs = parseSyntheticStructureFromBytes(u8(''), { lengthUnit: 'LINE_COUNT' });
    expect(obs.wrapper.boundaryEndLine).toBe(1);
    expect(obs.observedLength).toBe(1);
    expect(obs.occurrences).toEqual([]);
    expect(obs.lineAnchorObserved).toBe('ABSENT');
  });

  it('locked line counts for A and terminators', () => {
    const cases = [
      ['A', 1],
      ['A\n', 1],
      ['A\r\n', 1],
      ['A\r', 1],
      ['A\nB', 2],
      ['A\nB\n', 2],
    ];
    for (const [text, count] of cases) {
      const obs = parseSyntheticStructureFromBytes(u8(text), { lengthUnit: 'LINE_COUNT' });
      expect(obs.wrapper.boundaryEndLine).toBe(count);
      expect(obs.observedLength).toBe(count);
    }
  });

  it('splits CRLF atomically and handles mixed EOL', () => {
    const obs = parseSyntheticStructureFromBytes(u8('MED=A\r\nMED=B\rMED=C\n'), {
      lengthUnit: 'ABSENT',
    });
    expect(obs.occurrences).toHaveLength(3);
    expect(obs.lineAnchorObserved).toBe('ABSENT');
    expect(obs.wrapper.boundaryEndLine).toBe(3);
  });

  it('invalid UTF-8 returns exact safe ENC observation', () => {
    const invalid = u8('\xff\xfe');
    const obs = parseSyntheticStructureFromBytes(invalid, { lengthUnit: 'BYTE' });
    expect(obs).toEqual(encInvalidObservation());
    expect(Object.isFrozen(obs)).toBe(true);
  });

  it('BOM allows first-line header match after comparison-view FEFF removal', () => {
    const bomHeader = u8('\xef\xbb\xbf', 'MED=TOK1');
    const obs = parseSyntheticStructureFromBytes(bomHeader, { lengthUnit: 'ABSENT' });
    expect(obs.occurrences).toEqual([
      { header: 'MED=TOK1', role: 'CANDIDATE', assertedPrimary: false },
    ]);
    expect(obs.lineAnchorObserved).toBe(1);
  });

  it('TextDecoder ignoreBOM strips decode output but BYTE length retains BOM', () => {
    const bomA = u8('\xef\xbb\xbf', 'a');
    const obs = parseSyntheticStructureFromBytes(bomA, { lengthUnit: 'BYTE' });
    expect(obs.observedLength).toBe(4);
  });

  it('UTF8_CODEPOINT counts BOM as one when present', () => {
    const bomA = u8('\xef\xbb\xbf', 'a');
    const obs = parseSyntheticStructureFromBytes(bomA, { lengthUnit: 'UTF8_CODEPOINT' });
    expect(obs.observedLength).toBe(2);
  });

  it('UTF16_CODE_UNIT counts BOM as one when present', () => {
    const bomA = u8('\xef\xbb\xbf', 'a');
    const obs = parseSyntheticStructureFromBytes(bomA, { lengthUnit: 'UTF16_CODE_UNIT' });
    expect(obs.observedLength).toBe(2);
  });

  it('MED= is ignored and MED=A is discovered', () => {
    const ignored = parseSyntheticStructureFromBytes(u8('MED='), { lengthUnit: 'ABSENT' });
    expect(ignored.occurrences).toEqual([]);
    const one = parseSyntheticStructureFromBytes(u8('MED=A'), { lengthUnit: 'ABSENT' });
    expect(one.occurrences[0].header).toBe('MED=A');
  });

  it('discovers valid and malformed MED= physical values unchanged', () => {
    const obs = parseSyntheticStructureFromBytes(
      u8('MED=TOK1\nMED=tok1\nMED=WRONG-CODE\nMED=ABC DEF'),
      { lengthUnit: 'ABSENT' },
    );
    expect(obs.occurrences.map((o) => o.header)).toEqual([
      'MED=TOK1',
      'MED=tok1',
      'MED=WRONG-CODE',
      'MED=ABC DEF',
    ]);
  });

  it('ignores lowercase med= prefix and leading-space or substring MED=', () => {
    const obs = parseSyntheticStructureFromBytes(u8('med=TOK1\n MED=TOK2\nX MED=TOK3\nMED=TOK4'), {
      lengthUnit: 'ABSENT',
    });
    expect(obs.occurrences).toEqual([
      { header: 'MED=TOK4', role: 'CANDIDATE', assertedPrimary: false },
    ]);
  });

  it('accepts 256-char header line and ignores 257-char header-like line', () => {
    const pad256 = `MED=${'X'.repeat(252)}`;
    expect(pad256.length).toBe(256);
    const ok = parseSyntheticStructureFromBytes(u8(pad256), { lengthUnit: 'ABSENT' });
    expect(ok.occurrences).toHaveLength(1);

    const pad257 = `MED=${'X'.repeat(253)}`;
    expect(pad257.length).toBe(257);
    const no = parseSyntheticStructureFromBytes(u8(pad257), { lengthUnit: 'ABSENT' });
    expect(no.occurrences).toEqual([]);
  });

  it('preserves MED=None unchanged', () => {
    const obs = parseSyntheticStructureFromBytes(u8('MED=None'), { lengthUnit: 'ABSENT' });
    expect(obs.occurrences[0].header).toBe('MED=None');
  });

  it('zero one and multiple occurrence line-anchor behavior', () => {
    const zero = parseSyntheticStructureFromBytes(u8('NOHDR'), { lengthUnit: 'ABSENT' });
    expect(zero.lineAnchorObserved).toBe('ABSENT');
    const one = parseSyntheticStructureFromBytes(u8('MED=A'), { lengthUnit: 'ABSENT' });
    expect(one.lineAnchorObserved).toBe(1);
    const two = parseSyntheticStructureFromBytes(u8('MED=A\nMED=B'), { lengthUnit: 'ABSENT' });
    expect(two.lineAnchorObserved).toBe('ABSENT');
  });

  it('duplicate headers leave lineAnchorObserved ABSENT', () => {
    const obs = parseSyntheticStructureFromBytes(u8('MED=TOK1\nMED=TOK1'), {
      lengthUnit: 'ABSENT',
    });
    expect(obs.occurrences).toHaveLength(2);
    expect(obs.lineAnchorObserved).toBe('ABSENT');
  });

  it('jsonl wrapper and exclusions fixed defaults', () => {
    const obs = parseSyntheticStructureFromBytes(u8('MED=A\n'), { lengthUnit: 'ABSENT' });
    expect(obs.jsonlAnchorObserved).toBe('ABSENT');
    expect(obs.wrapper).toEqual({
      openLine: 'ABSENT',
      closeLine: 'ABSENT',
      boundaryEndLine: 1,
    });
    expect(obs.excludedRanges).toEqual([]);
  });

  it('each authorized length unit on valid UTF-8', () => {
    const bytes = u8('ab');
    expect(parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'BYTE' }).observedLengthUnit).toBe(
      'BYTE',
    );
    expect(
      parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'UTF8_CODEPOINT' }).observedLength,
    ).toBe(2);
    expect(
      parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'UTF16_CODE_UNIT' }).observedLength,
    ).toBe(2);
    expect(
      parseSyntheticStructureFromBytes(u8('a\nb'), { lengthUnit: 'LINE_COUNT' }).observedLength,
    ).toBe(2);
    expect(parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'ABSENT' }).observedLength).toBe(
      'ABSENT',
    );
  });

  it('never emits UNRESOLVED length unit', () => {
    const obs = parseSyntheticStructureFromBytes(u8('MED=A'), { lengthUnit: 'BYTE' });
    expect(obs.observedLengthUnit).not.toBe('UNRESOLVED');
    const json = JSON.stringify(obs);
    expect(json).not.toContain('UNRESOLVED');
  });

  it('caller byte mutation after parse does not alter frozen output', () => {
    const bytes = u8('MED=TOK1');
    const obs = parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'ABSENT' });
    bytes[0] = 0x58;
    expect(obs.occurrences[0].header).toBe('MED=TOK1');
    expect(() => {
      obs.occurrences.push({});
    }).toThrow();
    expect(() => {
      obs.wrapper.boundaryEndLine = 99;
    }).toThrow();
  });

  it('deep-freezes root occurrences wrapper and excludedRanges', () => {
    const obs = parseSyntheticStructureFromBytes(u8('MED=A'), { lengthUnit: 'ABSENT' });
    expect(Object.isFrozen(obs)).toBe(true);
    expect(Object.isFrozen(obs.occurrences)).toBe(true);
    expect(Object.isFrozen(obs.occurrences[0])).toBe(true);
    expect(Object.isFrozen(obs.wrapper)).toBe(true);
    expect(Object.isFrozen(obs.excludedRanges)).toBe(true);
  });

  it('output is accepted directly by compareSyntheticStructure', () => {
    const bytes = u8('MED=TOK1\n');
    const observation = parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'ABSENT' });
    const expectation = {
      assessmentMode: 'COMPARE',
      expectedPhysicalHeader: 'MED=TOK1',
      lineAnchorExpected: 1,
      jsonlAnchorExpected: 'ABSENT',
      wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 1 },
      excludedRanges: [],
      declaredLength: 'ABSENT',
      lengthUnit: 'ABSENT',
    };
    expect(compareSyntheticStructure(expectation, observation).outcome).toBe('PASS');
  });

  it('malformed MED value composes to HDR-CODE-MISMATCH not HDR-MISSING', () => {
    const observation = parseSyntheticStructureFromBytes(u8('MED=tok1'), {
      lengthUnit: 'ABSENT',
    });
    const result = compareSyntheticStructure(
      {
        assessmentMode: 'COMPARE',
        expectedPhysicalHeader: 'MED=TOK1',
        lineAnchorExpected: 'ABSENT',
        jsonlAnchorExpected: 'ABSENT',
        wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 1 },
        excludedRanges: [],
        declaredLength: 'ABSENT',
        lengthUnit: 'ABSENT',
      },
      observation,
    );
    expect(result.primaryBvCode).toBe('BV-HDR-CODE-MISMATCH');
  });

  it('invalid UTF-8 composed with comparator yields ENC-only FAIL', () => {
    const observation = parseSyntheticStructureFromBytes(u8('\xff'), { lengthUnit: 'BYTE' });
    const result = compareSyntheticStructure(
      {
        assessmentMode: 'COMPARE',
        expectedPhysicalHeader: 'MED=TOK1',
        lineAnchorExpected: 'ABSENT',
        jsonlAnchorExpected: 'ABSENT',
        wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 1 },
        excludedRanges: [],
        declaredLength: 'ABSENT',
        lengthUnit: 'ABSENT',
      },
      observation,
    );
    expect(result).toEqual({
      outcome: 'FAIL',
      primaryBvCode: BV_ENC_INVALID,
      bvCodes: [BV_ENC_INVALID],
    });
  });

  it('parseStructure.mjs import boundary', () => {
    const source = readFileSync(PARSER_PATH, 'utf8');
    expect(source).toMatch(/from\s+['"]\.\/verifyCore\.mjs['"]/);
    for (const re of FORBIDDEN_IMPORT_PATTERNS) {
      expect(source).not.toMatch(re);
    }
  });

  it('observation JSON has no raw multiline body beyond MED tokens', () => {
    const body = 'LINEONE\nLINETWO\nMED=TOK1';
    const obs = parseSyntheticStructureFromBytes(u8(body), { lengthUnit: 'ABSENT' });
    const json = JSON.stringify(obs);
    expect(json).not.toContain('LINEONE');
    expect(json).not.toContain('LINETWO');
    expect(json).toContain('MED=TOK1');
  });

  it('exact observation keys only', () => {
    const obs = parseSyntheticStructureFromBytes(u8('MED=A'), { lengthUnit: 'ABSENT' });
    expect(Object.keys(obs).sort()).toEqual([
      'excludedRanges',
      'interpretiveEncoding',
      'jsonlAnchorObserved',
      'lineAnchorObserved',
      'observedLength',
      'observedLengthUnit',
      'occurrences',
      'wrapper',
    ]);
  });
});

describe('P2-B2C fixed wrapper token parser', () => {
  const OPEN = '<user_query>';
  const CLOSE = '</user_query>';
  const LEGACY = { lengthUnit: 'ABSENT' as const };
  const WRAPPER = { lengthUnit: 'ABSENT' as const, wrapperMode: 'FIXED_USER_QUERY_V1' as const };

  function baseExpectation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      assessmentMode: 'COMPARE',
      expectedPhysicalHeader: 'MED=TOK1',
      lineAnchorExpected: 1,
      jsonlAnchorExpected: 'ABSENT',
      wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 3 },
      excludedRanges: [],
      declaredLength: 'ABSENT',
      lengthUnit: 'ABSENT',
      ...overrides,
    };
  }

  function expectAmbiguity(fn: () => unknown) {
    let caught: unknown;
    try {
      fn();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Rule5WrapperSourceAmbiguityError);
    expect(caught).toBeInstanceOf(Error);
    const err = caught as Rule5WrapperSourceAmbiguityError;
    expect(err.name).toBe('Rule5WrapperSourceAmbiguityError');
    expect(err.message).toBe('Wrapper source structure is ambiguous');
    expect(err.failureCode).toBe(RULE5_WRAPPER_SOURCE_AMBIGUOUS);
    expect(Object.getOwnPropertyNames(err).sort()).toEqual([
      'failureCode',
      'message',
      'name',
      'stack',
    ]);
    expect(err.message).not.toContain(OPEN);
    expect(err.message).not.toContain(CLOSE);
    return err;
  }

  describe('config contract', () => {
    const bytes = u8('MED=A');

    it('legacy one-key config remains accepted with unchanged absent wrapper behavior', () => {
      const obs = parseSyntheticStructureFromBytes(u8('MED=A\n'), LEGACY);
      expect(obs.wrapper).toEqual({
        openLine: 'ABSENT',
        closeLine: 'ABSENT',
        boundaryEndLine: 1,
      });
    });

    it('accepts two-key config', () => {
      expect(() => parseSyntheticStructureFromBytes(bytes, WRAPPER)).not.toThrow();
    });

    it('accepts two-key config regardless of key order', () => {
      const obs = parseSyntheticStructureFromBytes(bytes, {
        wrapperMode: 'FIXED_USER_QUERY_V1',
        lengthUnit: 'ABSENT',
      });
      expect(obs.wrapper.boundaryEndLine).toBe(1);
    });

    it('accepts null-prototype two-key config', () => {
      const config = Object.create(null);
      Object.defineProperty(config, 'lengthUnit', {
        value: 'ABSENT',
        enumerable: true,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(config, 'wrapperMode', {
        value: 'FIXED_USER_QUERY_V1',
        enumerable: true,
        writable: true,
        configurable: true,
      });
      expect(parseSyntheticStructureFromBytes(bytes, config).interpretiveEncoding).toBe('PASS');
    });

    it('accepts non-enumerable own data properties on two-key config', () => {
      const config = Object.create(null);
      Object.defineProperty(config, 'lengthUnit', {
        value: 'ABSENT',
        enumerable: false,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(config, 'wrapperMode', {
        value: 'FIXED_USER_QUERY_V1',
        enumerable: false,
        writable: true,
        configurable: true,
      });
      expect(parseSyntheticStructureFromBytes(bytes, config).interpretiveEncoding).toBe('PASS');
    });

    it('rejects invalid wrapperMode values', () => {
      for (const bad of ['OFF', '', 'fixed_user_query_v1', null, undefined, 1]) {
        expect(() =>
          parseSyntheticStructureFromBytes(bytes, { lengthUnit: 'ABSENT', wrapperMode: bad }),
        ).toThrow(TypeError);
      }
    });

    it('rejects extra, symbol, inherited, class, and accessor wrapperMode without getter execution', () => {
      expect(() =>
        parseSyntheticStructureFromBytes(bytes, {
          lengthUnit: 'ABSENT',
          wrapperMode: 'FIXED_USER_QUERY_V1',
          extra: 1,
        }),
      ).toThrow(TypeError);

      expect(() =>
        parseSyntheticStructureFromBytes(bytes, {
          lengthUnit: 'ABSENT',
          wrapperMode: 'FIXED_USER_QUERY_V1',
          [Symbol('meta')]: 1,
        }),
      ).toThrow(TypeError);

      class ParserConfig {
        lengthUnit = 'ABSENT';
        wrapperMode = 'FIXED_USER_QUERY_V1';
      }
      expect(() => parseSyntheticStructureFromBytes(bytes, new ParserConfig())).toThrow(TypeError);

      const inherited = Object.create({ wrapperMode: 'FIXED_USER_QUERY_V1' });
      inherited.lengthUnit = 'ABSENT';
      expect(() => parseSyntheticStructureFromBytes(bytes, inherited)).toThrow(TypeError);

      let getterCalls = 0;
      const accessor = { lengthUnit: 'ABSENT' };
      Object.defineProperty(accessor, 'wrapperMode', {
        get() {
          getterCalls += 1;
          return 'FIXED_USER_QUERY_V1';
        },
        configurable: true,
      });
      expect(() => parseSyntheticStructureFromBytes(bytes, accessor)).toThrow(TypeError);
      expect(getterCalls).toBe(0);
    });
  });

  describe('wrapper scan states', () => {
    it('enabled mode with no tokens returns absent wrapper at document end', () => {
      const obs = parseSyntheticStructureFromBytes(u8('MED=TOK1\nLINE\nTAIL'), WRAPPER);
      expect(obs.wrapper).toEqual({
        openLine: 'ABSENT',
        closeLine: 'ABSENT',
        boundaryEndLine: 3,
      });
    });

    it('exact one ordered pair returns numeric wrapper triple', () => {
      const obs = parseSyntheticStructureFromBytes(
        u8(`MED=TOK1\n${OPEN}\nBODY\n${CLOSE}\nTAIL`),
        WRAPPER,
      );
      expect(obs.wrapper).toEqual({
        openLine: 2,
        closeLine: 4,
        boundaryEndLine: 5,
      });
    });

    it('open only throws dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(u8(`MED=TOK1\n${OPEN}\nBODY`), WRAPPER),
      );
    });

    it('close only throws dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(u8(`MED=TOK1\nBODY\n${CLOSE}`), WRAPPER),
      );
    });

    it('reversed close-before-open throws dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(u8(`MED=TOK1\n${CLOSE}\n${OPEN}`), WRAPPER),
      );
    });

    it('duplicate opens with one close throws dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(u8(`MED=TOK1\n${OPEN}\n${OPEN}\n${CLOSE}`), WRAPPER),
      );
    });

    it('one open with duplicate closes throws dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(u8(`MED=TOK1\n${OPEN}\n${CLOSE}\n${CLOSE}`), WRAPPER),
      );
    });

    it('duplicate complete pairs throws dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(
          u8(`MED=TOK1\n${OPEN}\n${CLOSE}\n${OPEN}\n${CLOSE}`),
          WRAPPER,
        ),
      );
    });

    it('nested pair throws dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(
          u8(`MED=TOK1\n${OPEN}\n${OPEN}\nINNER\n${CLOSE}\n${CLOSE}`),
          WRAPPER,
        ),
      );
    });

    it('interleaved tokens throw dedicated ambiguity error', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(
          u8(`MED=TOK1\n${OPEN}\n${CLOSE}\n${OPEN}\nMID\n${CLOSE}`),
          WRAPPER,
        ),
      );
    });

    it('ignores substring token embeddings', () => {
      const obs = parseSyntheticStructureFromBytes(u8(`MED=TOK1\nX${OPEN}Y\nX${CLOSE}Y`), WRAPPER);
      expect(obs.wrapper).toEqual({
        openLine: 'ABSENT',
        closeLine: 'ABSENT',
        boundaryEndLine: 3,
      });
    });

    it('ignores leading and trailing whitespace variants', () => {
      const obs = parseSyntheticStructureFromBytes(u8(`MED=TOK1\n ${OPEN}\n${CLOSE} `), WRAPPER);
      expect(obs.wrapper).toEqual({
        openLine: 'ABSENT',
        closeLine: 'ABSENT',
        boundaryEndLine: 3,
      });
    });

    it('ignores case variants', () => {
      const obs = parseSyntheticStructureFromBytes(
        u8('MED=TOK1\n<USER_QUERY>\n</USER_QUERY>'),
        WRAPPER,
      );
      expect(obs.wrapper).toEqual({
        openLine: 'ABSENT',
        closeLine: 'ABSENT',
        boundaryEndLine: 3,
      });
    });

    it('recognizes opening token on line 1 after BOM via comparisonView', () => {
      const obs = parseSyntheticStructureFromBytes(
        u8('\xef\xbb\xbf', `${OPEN}\nBODY\n${CLOSE}`),
        WRAPPER,
      );
      expect(obs.wrapper).toEqual({
        openLine: 1,
        closeLine: 3,
        boundaryEndLine: 3,
      });
    });

    it('does not normalize BOM on later lines', () => {
      expectAmbiguity(() =>
        parseSyntheticStructureFromBytes(u8(`MED=TOK1\n${OPEN}\n`, '\xef\xbb\xbf', CLOSE), WRAPPER),
      );
    });

    it('invalid UTF-8 returns ENC observation without wrapper ambiguity error', () => {
      expect(() => parseSyntheticStructureFromBytes(u8('\xff'), WRAPPER)).not.toThrow(
        Rule5WrapperSourceAmbiguityError,
      );
      expect(parseSyntheticStructureFromBytes(u8('\xff'), WRAPPER)).toEqual(
        encInvalidObservation(),
      );
    });
  });

  describe('error contract', () => {
    it('does not retain input bytes, decoded lines, or config references on ambiguity error', () => {
      const bytes = u8(`MED=TOK1\n${OPEN}\n${OPEN}`);
      const config = { lengthUnit: 'ABSENT', wrapperMode: 'FIXED_USER_QUERY_V1' };
      const err = expectAmbiguity(() => parseSyntheticStructureFromBytes(bytes, config));
      expect(Object.prototype.hasOwnProperty.call(err, 'bytes')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(err, 'lines')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(err, 'config')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(err, 'openCount')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(err, 'closeCount')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(err, 'openLine')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(err, 'closeLine')).toBe(false);
    });
  });

  describe('comparator integration', () => {
    it('absent source vs absent expectation passes wrapper comparison', () => {
      const observation = parseSyntheticStructureFromBytes(u8('MED=TOK1\nLINE\nTAIL'), WRAPPER);
      const result = compareSyntheticStructure(baseExpectation(), observation);
      expect(result.outcome).toBe('PASS');
      expect(result.bvCodes ?? []).not.toContain(BV_WRAPPER_MISMATCH);
    });

    it('absent source vs present expectation returns BV-WRAPPER-MISMATCH', () => {
      const observation = parseSyntheticStructureFromBytes(u8('MED=TOK1\nLINE\nTAIL'), WRAPPER);
      const result = compareSyntheticStructure(
        baseExpectation({
          wrapper: { openLine: 2, closeLine: 3, boundaryEndLine: 3 },
        }),
        observation,
      );
      expect(result.primaryBvCode).toBe(BV_WRAPPER_MISMATCH);
    });

    it('exact pair vs matching expectation passes wrapper comparison', () => {
      const observation = parseSyntheticStructureFromBytes(
        u8(`MED=TOK1\n${OPEN}\nBODY\n${CLOSE}`),
        WRAPPER,
      );
      const result = compareSyntheticStructure(
        baseExpectation({
          wrapper: { openLine: 2, closeLine: 4, boundaryEndLine: 4 },
        }),
        observation,
      );
      expect(result.outcome).toBe('PASS');
      expect(result.bvCodes ?? []).not.toContain(BV_WRAPPER_MISMATCH);
    });

    it('exact pair vs absent expectation returns BV-WRAPPER-MISMATCH', () => {
      const observation = parseSyntheticStructureFromBytes(
        u8(`MED=TOK1\n${OPEN}\nBODY\n${CLOSE}`),
        WRAPPER,
      );
      const result = compareSyntheticStructure(baseExpectation(), observation);
      expect(result.primaryBvCode).toBe(BV_WRAPPER_MISMATCH);
    });

    it('malformed wrapper source throws before comparator can run', () => {
      const bytes = u8(`MED=TOK1\n${OPEN}\n${OPEN}`);
      expect(() => {
        const observation = parseSyntheticStructureFromBytes(bytes, WRAPPER);
        compareSyntheticStructure(baseExpectation(), observation);
      }).toThrow(Rule5WrapperSourceAmbiguityError);
    });
  });

  describe('regression and security', () => {
    it('keeps 262144-byte cap unchanged', () => {
      const ok = new Uint8Array(MAX_BYTES);
      expect(() => parseSyntheticStructureFromBytes(ok, WRAPPER)).not.toThrow();
      const big = new Uint8Array(MAX_BYTES + 1);
      expect(() => parseSyntheticStructureFromBytes(big, WRAPPER)).toThrow(RangeError);
    });

    it('keeps frozen observation output without wrapper token content leak', () => {
      const obs = parseSyntheticStructureFromBytes(
        u8(`MED=TOK1\n${OPEN}\nBODY\n${CLOSE}`),
        WRAPPER,
      );
      expect(Object.isFrozen(obs)).toBe(true);
      expect(Object.isFrozen(obs.wrapper)).toBe(true);
      const json = JSON.stringify(obs);
      expect(json).not.toContain(OPEN);
      expect(json).not.toContain(CLOSE);
      expect(json).not.toContain('BODY');
    });

    it('parseStructure.mjs import boundary remains verifyCore-only', () => {
      const source = readFileSync(PARSER_PATH, 'utf8');
      expect(source).toMatch(/from\s+['"]\.\/verifyCore\.mjs['"]/);
      for (const re of FORBIDDEN_IMPORT_PATTERNS) {
        expect(source).not.toMatch(re);
      }
    });
  });
});
