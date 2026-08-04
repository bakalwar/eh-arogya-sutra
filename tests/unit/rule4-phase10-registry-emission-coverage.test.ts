import { describe, expect, it } from 'vitest';
import { evaluateDoctorReviewAdapter } from '../../packages/clinical-contracts/src/rule4/doctorReview/evaluateDoctorReviewAdapter.js';
import {
  RULE4_PHASE10_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE10_REASON_CODE_REGISTRY,
} from '../../packages/clinical-contracts/src/rule4/reasonCodesPhase10.js';
import { assertKnownRule4ReasonCode } from '../../packages/clinical-contracts/src/rule4/reasonCodes.js';
import {
  doctorReviewContextFromScenario,
  doctorReviewInputFromScenario,
  loadRule4DoctorReviewFixture,
} from './rule4-doctor-review-fixture-loader.ts';

function collectEmittedReasonCodes(
  out: ReturnType<typeof evaluateDoctorReviewAdapter>,
): Set<string> {
  const codes = new Set<string>();
  for (const c of out.reasonCodes) {
    codes.add(c);
  }
  for (const g of out.issuanceGateResults) {
    for (const c of g.reasonCodes) {
      codes.add(c);
    }
  }
  return codes;
}

describe('Rule 4 Phase 10 registry runtime emission coverage', () => {
  const fixture = loadRule4DoctorReviewFixture();
  const emittedAcrossMatrix = new Set<string>();
  const scenarioByCode = new Map<string, string>();

  for (const scenario of fixture.scenarios) {
    const out = evaluateDoctorReviewAdapter(
      doctorReviewInputFromScenario(scenario),
      doctorReviewContextFromScenario(scenario),
    );
    for (const code of collectEmittedReasonCodes(out)) {
      emittedAcrossMatrix.add(code);
      if (!scenarioByCode.has(code)) {
        scenarioByCode.set(code, scenario.id);
      }
    }
    for (const code of out.limitationCodes) {
      emittedAcrossMatrix.add(code);
      if (!scenarioByCode.has(code)) {
        scenarioByCode.set(code, scenario.id);
      }
    }
  }

  it.each(RULE4_PHASE10_REASON_CODE_REGISTRY.map((e) => e.code))(
    'reason code %s emitted by adapter in scenario matrix',
    (code) => {
      expect(
        emittedAcrossMatrix.has(code),
        `missing emission for ${code}; example scenario: ${scenarioByCode.get(code) ?? 'none'}`,
      ).toBe(true);
    },
  );

  it.each(RULE4_PHASE10_LIMITATION_CODE_REGISTRY.map((e) => e.code))(
    'limitation code %s emitted by adapter in scenario matrix',
    (code) => {
      expect(emittedAcrossMatrix.has(code)).toBe(true);
    },
  );
});

describe('Rule 4 Phase 10 unknown reason code rejection', () => {
  it('rejects unknown reason codes on output validation', () => {
    expect(() => assertKnownRule4ReasonCode('NOT_A_REAL_PHASE10_CODE_XYZ')).toThrow();
  });
});
