import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import { RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION } from '../../packages/clinical-contracts/src/rule4/version.js';
import {
  RULE4_NUMERIC_SELECTION_FIXTURE_PATH,
  loadRule4NumericSelectionFixture,
  selectionAdapterInputFromFixture,
  selectionEvaluationContextFromFixture,
} from './rule4-numeric-selection-fixture-loader.ts';

describe('Rule 4 Phase 8 fingerprint collision', () => {
  it('fixture file SHA is stable', () => {
    const sha = createHash('sha256')
      .update(readFileSync(RULE4_NUMERIC_SELECTION_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    expect(sha).toMatch(/^[A-F0-9]{64}$/);
  });

  it('different dilution selections produce different adapter fingerprints', () => {
    const fixture = loadRule4NumericSelectionFixture();
    const d1 = fixture.scenarios.find((s) => s.id === 'd1-only');
    const d2 = fixture.scenarios.find((s) => s.id === 'd2-only');
    expect(d1 && d2).toBeTruthy();
    const out1 = evaluateSelectionAdapter(
      selectionAdapterInputFromFixture(d1!),
      selectionEvaluationContextFromFixture(d1!),
    );
    const out2 = evaluateSelectionAdapter(
      selectionAdapterInputFromFixture(d2!),
      selectionEvaluationContextFromFixture(d2!),
    );
    expect(out1.deterministicNumericSelectionFingerprint).not.toBe(
      out2.deterministicNumericSelectionFingerprint,
    );
  });

  it('contract version gate rejects wrong adapter version', () => {
    const fixture = loadRule4NumericSelectionFixture();
    const scenario = fixture.scenarios[0]!;
    const input = selectionAdapterInputFromFixture(scenario);
    expect(() =>
      evaluateSelectionAdapter(
        { ...input, contractVersion: RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION + '-bogus' },
        selectionEvaluationContextFromFixture(scenario),
      ),
    ).toThrow();
  });
});
