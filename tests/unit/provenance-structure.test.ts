import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BV_ENC_INVALID } from '../../tools/provenance/verifyCore.mjs';
import {
  BV_EXCL_REGION_MISMATCH,
  BV_HDR_CODE_MISMATCH,
  BV_HDR_DUPLICATE,
  BV_HDR_MISSING,
  BV_JSONL_ANCHOR_MISMATCH,
  BV_LEN_MISMATCH,
  BV_LEN_UNIT_UNRESOLVED,
  BV_LINE_ANCHOR_MISMATCH,
  BV_MED_NONE_ATTRIBUTION,
  BV_OCC_QUARANTINED,
  BV_WRAPPER_MISMATCH,
  compareSyntheticStructure,
} from '../../tools/provenance/verifyStructure.mjs';

const STRUCTURE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tools/provenance/verifyStructure.mjs',
);

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:path['"]/,
  /from\s+['"]node:os['"]/,
  /from\s+['"]node:crypto['"]/,
  /from\s+['"]node:http['"]/,
  /process\.env/,
];

function baseExpectation(overrides = {}) {
  return {
    assessmentMode: 'COMPARE',
    expectedPhysicalHeader: 'MED=TOK1',
    lineAnchorExpected: 'ABSENT',
    jsonlAnchorExpected: 'ABSENT',
    wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 20 },
    excludedRanges: [],
    declaredLength: 'ABSENT',
    lengthUnit: 'ABSENT',
    ...overrides,
  };
}

function baseObservation(overrides = {}) {
  return {
    interpretiveEncoding: 'PASS',
    occurrences: [{ header: 'MED=TOK1', role: 'CANDIDATE', assertedPrimary: false }],
    lineAnchorObserved: 'ABSENT',
    jsonlAnchorObserved: 'ABSENT',
    wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 20 },
    excludedRanges: [],
    observedLength: 'ABSENT',
    observedLengthUnit: 'ABSENT',
    ...overrides,
  };
}

describe('provenance verifyStructure (P2-B2A synthetic comparator)', () => {
  it('NOT_APPLICABLE with undefined observation', () => {
    const result = compareSyntheticStructure({ assessmentMode: 'NOT_APPLICABLE' }, undefined);
    expect(result).toEqual({
      outcome: 'NOT_APPLICABLE',
      reason: 'AUDIT_EXPECTATION_NOT_APPLICABLE',
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('NOT_APPLICABLE does not emit encoding or structural BV', () => {
    const result = compareSyntheticStructure({ assessmentMode: 'NOT_APPLICABLE' }, undefined);
    expect(JSON.stringify(result)).not.toContain('BV-');
  });

  it('COMPARE without observation throws TypeError', () => {
    expect(() => compareSyntheticStructure(baseExpectation(), undefined)).toThrow(TypeError);
    expect(() => compareSyntheticStructure(baseExpectation(), null)).toThrow(TypeError);
  });

  it('ENC-invalid observation returns ENC-only FAIL', () => {
    const result = compareSyntheticStructure(
      baseExpectation(),
      baseObservation({ interpretiveEncoding: BV_ENC_INVALID }),
    );
    expect(result).toEqual({
      outcome: 'FAIL',
      primaryBvCode: BV_ENC_INVALID,
      bvCodes: [BV_ENC_INVALID],
    });
    expect(Object.isFrozen(result.bvCodes)).toBe(true);
  });

  it('rejects unexpected keys on expectation root', () => {
    expect(() =>
      compareSyntheticStructure({ assessmentMode: 'NOT_APPLICABLE', extra: 1 }, undefined),
    ).toThrow(TypeError);
    expect(() =>
      compareSyntheticStructure({ ...baseExpectation(), path: '/x' }, baseObservation()),
    ).toThrow(TypeError);
  });

  it('rejects occurrence anchor and extra keys', () => {
    expect(() =>
      compareSyntheticStructure(
        baseExpectation(),
        baseObservation({
          occurrences: [
            {
              header: 'MED=TOK1',
              role: 'CANDIDATE',
              assertedPrimary: false,
              lineAnchor: 1,
            },
          ],
        }),
      ),
    ).toThrow(TypeError);
  });

  it('valid single candidate PASS', () => {
    const result = compareSyntheticStructure(baseExpectation(), baseObservation());
    expect(result.outcome).toBe('PASS');
    expect(result.primaryBvCode).toBeNull();
    expect(result.bvCodes).toEqual([]);
  });

  it('missing candidate emits HDR-MISSING', () => {
    const result = compareSyntheticStructure(
      baseExpectation(),
      baseObservation({ occurrences: [] }),
    );
    expect(result.outcome).toBe('FAIL');
    expect(result.primaryBvCode).toBe(BV_HDR_MISSING);
  });

  it('duplicate candidates including different headers', () => {
    const result = compareSyntheticStructure(
      baseExpectation(),
      baseObservation({
        occurrences: [
          { header: 'MED=TOK1', role: 'CANDIDATE', assertedPrimary: false },
          { header: 'MED=TOK2', role: 'CANDIDATE', assertedPrimary: false },
        ],
      }),
    );
    expect(result.primaryBvCode).toBe(BV_HDR_DUPLICATE);
  });

  it('MED=None special attribution', () => {
    const result = compareSyntheticStructure(
      baseExpectation({ expectedPhysicalHeader: 'MED=TOK1' }),
      baseObservation({
        occurrences: [{ header: 'MED=None', role: 'CANDIDATE', assertedPrimary: false }],
      }),
    );
    expect(result.bvCodes).toContain(BV_MED_NONE_ATTRIBUTION);
    expect(result.bvCodes).not.toContain(BV_HDR_CODE_MISMATCH);
  });

  it('ordinary header mismatch', () => {
    const result = compareSyntheticStructure(
      baseExpectation(),
      baseObservation({
        occurrences: [{ header: 'MED=TOK2', role: 'CANDIDATE', assertedPrimary: false }],
      }),
    );
    expect(result.primaryBvCode).toBe(BV_HDR_CODE_MISMATCH);
  });

  it('quarantine ignored when not promoted', () => {
    const result = compareSyntheticStructure(
      baseExpectation(),
      baseObservation({
        occurrences: [
          { header: 'MED=TOK1', role: 'CANDIDATE', assertedPrimary: false },
          { header: 'MED=TOK9', role: 'QUARANTINED', assertedPrimary: false },
        ],
      }),
    );
    expect(result.outcome).toBe('PASS');
  });

  it('quarantine failure when assertedPrimary', () => {
    const result = compareSyntheticStructure(
      baseExpectation(),
      baseObservation({
        occurrences: [
          { header: 'MED=TOK1', role: 'CANDIDATE', assertedPrimary: false },
          { header: 'MED=TOK9', role: 'QUARANTINED', assertedPrimary: true },
        ],
      }),
    );
    expect(result.bvCodes).toContain(BV_OCC_QUARANTINED);
  });

  it('line anchor match mismatch and ABSENT', () => {
    expect(
      compareSyntheticStructure(
        baseExpectation({ lineAnchorExpected: 5 }),
        baseObservation({ lineAnchorObserved: 5 }),
      ).outcome,
    ).toBe('PASS');
    const fail = compareSyntheticStructure(
      baseExpectation({ lineAnchorExpected: 5 }),
      baseObservation({ lineAnchorObserved: 6 }),
    );
    expect(fail.primaryBvCode).toBe(BV_LINE_ANCHOR_MISMATCH);
    const mixed = compareSyntheticStructure(
      baseExpectation({ lineAnchorExpected: 'ABSENT' }),
      baseObservation({ lineAnchorObserved: 1 }),
    );
    expect(mixed.primaryBvCode).toBe(BV_LINE_ANCHOR_MISMATCH);
  });

  it('JSONL anchor match mismatch ABSENT and zero', () => {
    expect(
      compareSyntheticStructure(
        baseExpectation({ jsonlAnchorExpected: 0 }),
        baseObservation({ jsonlAnchorObserved: 0 }),
      ).outcome,
    ).toBe('PASS');
    const fail = compareSyntheticStructure(
      baseExpectation({ jsonlAnchorExpected: 1 }),
      baseObservation({ jsonlAnchorObserved: 2 }),
    );
    expect(fail.primaryBvCode).toBe(BV_JSONL_ANCHOR_MISMATCH);
  });

  it('wrapper equality and ordering failures', () => {
    const pass = compareSyntheticStructure(
      baseExpectation({
        wrapper: { openLine: 2, closeLine: 5, boundaryEndLine: 10 },
      }),
      baseObservation({
        wrapper: { openLine: 2, closeLine: 5, boundaryEndLine: 10 },
      }),
    );
    expect(pass.outcome).toBe('PASS');
    const fail = compareSyntheticStructure(
      baseExpectation({
        wrapper: { openLine: 2, closeLine: 5, boundaryEndLine: 10 },
      }),
      baseObservation({
        wrapper: { openLine: 2, closeLine: 4, boundaryEndLine: 10 },
      }),
    );
    expect(fail.primaryBvCode).toBe(BV_WRAPPER_MISMATCH);
  });

  describe('wrapper pair invariant (mixed open/close forbidden)', () => {
    it('expectation open ABSENT + numeric close throws TypeError', () => {
      expect(() =>
        compareSyntheticStructure(
          baseExpectation({
            wrapper: { openLine: 'ABSENT', closeLine: 3, boundaryEndLine: 10 },
          }),
          baseObservation(),
        ),
      ).toThrow(TypeError);
    });

    it('expectation numeric open + close ABSENT throws TypeError', () => {
      expect(() =>
        compareSyntheticStructure(
          baseExpectation({
            wrapper: { openLine: 2, closeLine: 'ABSENT', boundaryEndLine: 10 },
          }),
          baseObservation(),
        ),
      ).toThrow(TypeError);
    });

    it('observation open ABSENT + numeric close throws TypeError', () => {
      expect(() =>
        compareSyntheticStructure(
          baseExpectation(),
          baseObservation({
            wrapper: { openLine: 'ABSENT', closeLine: 3, boundaryEndLine: 20 },
          }),
        ),
      ).toThrow(TypeError);
    });

    it('observation numeric open + close ABSENT throws TypeError', () => {
      expect(() =>
        compareSyntheticStructure(
          baseExpectation(),
          baseObservation({
            wrapper: { openLine: 2, closeLine: 'ABSENT', boundaryEndLine: 20 },
          }),
        ),
      ).toThrow(TypeError);
    });

    it('closeLine > boundaryEndLine throws TypeError', () => {
      expect(() =>
        compareSyntheticStructure(
          baseExpectation({
            wrapper: { openLine: 2, closeLine: 12, boundaryEndLine: 10 },
          }),
          baseObservation({
            wrapper: { openLine: 2, closeLine: 5, boundaryEndLine: 10 },
          }),
        ),
      ).toThrow(TypeError);
    });

    it('openLine > closeLine throws TypeError', () => {
      expect(() =>
        compareSyntheticStructure(
          baseExpectation({
            wrapper: { openLine: 8, closeLine: 5, boundaryEndLine: 10 },
          }),
          baseObservation({
            wrapper: { openLine: 2, closeLine: 5, boundaryEndLine: 10 },
          }),
        ),
      ).toThrow(TypeError);
    });

    it('valid ABSENT/ABSENT wrappers matching yields no wrapper BV', () => {
      const result = compareSyntheticStructure(baseExpectation(), baseObservation());
      expect(result.outcome).toBe('PASS');
      expect(result.bvCodes ?? []).not.toContain(BV_WRAPPER_MISMATCH);
    });

    it('valid present wrappers matching yields no wrapper BV', () => {
      const wrapper = { openLine: 2, closeLine: 5, boundaryEndLine: 10 };
      const result = compareSyntheticStructure(
        baseExpectation({ wrapper }),
        baseObservation({ wrapper }),
      );
      expect(result.outcome).toBe('PASS');
      expect(result.bvCodes ?? []).not.toContain(BV_WRAPPER_MISMATCH);
    });

    it('valid wrappers with boundary mismatch returns BV-WRAPPER-MISMATCH', () => {
      const result = compareSyntheticStructure(
        baseExpectation({
          wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 20 },
        }),
        baseObservation({
          wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 21 },
        }),
      );
      expect(result.primaryBvCode).toBe(BV_WRAPPER_MISMATCH);
    });

    it('valid absent vs valid present wrapper returns BV-WRAPPER-MISMATCH', () => {
      const result = compareSyntheticStructure(
        baseExpectation({
          wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 20 },
        }),
        baseObservation({
          wrapper: { openLine: 2, closeLine: 5, boundaryEndLine: 20 },
        }),
      );
      expect(result.primaryBvCode).toBe(BV_WRAPPER_MISMATCH);
    });
  });

  it('excluded-range sorting mismatch and overlap rejection', () => {
    const pass = compareSyntheticStructure(
      baseExpectation({ excludedRanges: [{ startLine: 5, endLine: 6 }] }),
      baseObservation({ excludedRanges: [{ startLine: 5, endLine: 6 }] }),
    );
    expect(pass.outcome).toBe('PASS');
    const mismatch = compareSyntheticStructure(
      baseExpectation({ excludedRanges: [{ startLine: 1, endLine: 2 }] }),
      baseObservation({ excludedRanges: [{ startLine: 3, endLine: 4 }] }),
    );
    expect(mismatch.primaryBvCode).toBe(BV_EXCL_REGION_MISMATCH);
    expect(() =>
      compareSyntheticStructure(
        baseExpectation(),
        baseObservation({
          excludedRanges: [
            { startLine: 1, endLine: 5 },
            { startLine: 4, endLine: 6 },
          ],
        }),
      ),
    ).toThrow(TypeError);
  });

  it('length truth table', () => {
    expect(compareSyntheticStructure(baseExpectation(), baseObservation()).outcome).toBe('PASS');

    const oneAbsent = compareSyntheticStructure(
      baseExpectation({ declaredLength: 10, lengthUnit: 'BYTE' }),
      baseObservation({ observedLength: 'ABSENT', observedLengthUnit: 'ABSENT' }),
    );
    expect(oneAbsent.bvCodes).toEqual([BV_LEN_MISMATCH]);

    const unresolved = compareSyntheticStructure(
      baseExpectation({ declaredLength: 10, lengthUnit: 'UNRESOLVED' }),
      baseObservation({ observedLength: 10, observedLengthUnit: 'BYTE' }),
    );
    expect(unresolved.bvCodes).toEqual([BV_LEN_UNIT_UNRESOLVED]);

    const diffUnits = compareSyntheticStructure(
      baseExpectation({ declaredLength: 10, lengthUnit: 'BYTE' }),
      baseObservation({ observedLength: 10, observedLengthUnit: 'LINE_COUNT' }),
    );
    expect(diffUnits.bvCodes).toEqual([BV_LEN_UNIT_UNRESOLVED]);

    const lenMismatch = compareSyntheticStructure(
      baseExpectation({ declaredLength: 10, lengthUnit: 'BYTE' }),
      baseObservation({ observedLength: 11, observedLengthUnit: 'BYTE' }),
    );
    expect(lenMismatch.bvCodes).toEqual([BV_LEN_MISMATCH]);

    const lenPass = compareSyntheticStructure(
      baseExpectation({ declaredLength: 10, lengthUnit: 'UTF8_CODEPOINT' }),
      baseObservation({ observedLength: 10, observedLengthUnit: 'UTF8_CODEPOINT' }),
    );
    expect(lenPass.outcome).toBe('PASS');

    expect(() =>
      compareSyntheticStructure(
        baseExpectation({ declaredLength: 'ABSENT', lengthUnit: 'BYTE' }),
        baseObservation(),
      ),
    ).toThrow(TypeError);
  });

  it('multi-failure deterministic order and uniqueness', () => {
    const result = compareSyntheticStructure(
      baseExpectation(),
      baseObservation({
        occurrences: [],
        lineAnchorObserved: 9,
        wrapper: { openLine: 'ABSENT', closeLine: 'ABSENT', boundaryEndLine: 99 },
      }),
    );
    expect(result.bvCodes[0]).toBe(BV_HDR_MISSING);
    expect(new Set(result.bvCodes).size).toBe(result.bvCodes.length);
  });

  it('caller-input mutation does not alter frozen result', () => {
    const exp = baseExpectation();
    const obs = baseObservation();
    const result = compareSyntheticStructure(exp, obs);
    exp.expectedPhysicalHeader = 'MED=HACK';
    obs.occurrences[0].header = 'MED=HACK';
    expect(result.outcome).toBe('PASS');
    expect(() => {
      result.bvCodes.push('x');
    }).toThrow();
  });

  it('malformed expected header throws TypeError', () => {
    expect(() =>
      compareSyntheticStructure(
        baseExpectation({ expectedPhysicalHeader: 'med=TOK1' }),
        baseObservation(),
      ),
    ).toThrow(TypeError);
  });

  it('verifyStructure.mjs import boundary', () => {
    const source = readFileSync(STRUCTURE_PATH, 'utf8');
    expect(source).toMatch(/from\s+['"]\.\/verifyCore\.mjs['"]/);
    for (const re of FORBIDDEN_IMPORT_PATTERNS) {
      expect(source).not.toMatch(re);
    }
  });

  it('result shapes contain no forbidden fields', () => {
    const fail = compareSyntheticStructure(baseExpectation(), baseObservation({ occurrences: [] }));
    expect(Object.keys(fail).sort()).toEqual(['bvCodes', 'outcome', 'primaryBvCode']);
  });
});
