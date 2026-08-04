import { describe, expect, it } from 'vitest';
import {
  evaluateRule4Empty,
  evaluateRule4ShadowBundle,
} from '../../packages/clinical-contracts/src/rule4/evaluator.js';
import { RULE4_CONTRACT_VERSION_PHASE2 } from '../../packages/clinical-contracts/src/rule4/version.js';
import { RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION } from '../../packages/clinical-contracts/src/rule4/version.js';
import {
  loadRule4NumericSelectionFixture,
  selectionAdapterInputFromFixture,
} from './rule4-numeric-selection-fixture-loader.ts';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';

describe('Rule 4 Phase 8 shadow/public equivalence', () => {
  const fixture = loadRule4NumericSelectionFixture();
  const scenario = fixture.scenarios.find((s) => s.id === 'd1-only')!;

  it('public result unchanged when selection adapter present in shadow', () => {
    const base = {
      contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
      caseId: 'c1',
      consultationId: 'consult',
      rulesetVersion: RULESET,
      engineMode: 'shadow' as const,
      label: 'SYNTHETIC' as const,
      formulaSlots: [
        {
          formulaSlotId: 's1',
          formulaTargetId: 't1',
          polarityRef: null,
          organTargetRef: null,
          temperamentRef: null,
          phaseRef: null,
          severityRef: null,
          structuredEvidenceItemIds: [],
        },
      ],
      verifiedAge: { ageYears: 30, verificationStatus: 'VERIFIED' as const },
      patientWideSafety: {},
      structuredEvidenceItemIds: [],
      selectionAdapter: {
        ...selectionAdapterInputFromFixture(scenario),
        contractVersion: RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION,
      },
    };
    const without = evaluateRule4Empty({ ...base, selectionAdapter: undefined });
    const bundle = evaluateRule4ShadowBundle(base);
    expect(bundle.result.deterministicFingerprint).toBe(without.deterministicFingerprint);
    expect(bundle.selectionResolution).not.toBeNull();
    expect(bundle.selectionResolution?.prescriptionIssueAllowed).toBe(false);
    expect(bundle.result.slots[0]?.selectedDilution).toBeNull();
  });
});
