import { describe, expect, it } from 'vitest';
import {
  RULE4_CONTRACT_VERSION_PHASE2,
  evaluateRule4Phase2Safety,
  evaluateBpCrisisFromSingleReading,
  resolveVerifiedAge,
  toPhase2VerifiedAge,
  type Rule4InputContract,
} from '../../packages/clinical-contracts/src/rule4/index.ts';

function phase2Input(
  overrides: Partial<Rule4InputContract> & {
    verifiedAge?: Rule4InputContract['verifiedAge'];
  } = {},
): Rule4InputContract {
  return {
    contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
    caseId: 'ts-p2',
    consultationId: 'ts-consult',
    rulesetVersion: 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469',
    engineMode: 'shadow',
    label: 'SYNTHETIC',
    formulaSlots: [
      {
        formulaSlotId: 'a',
        formulaTargetId: 't1',
        polarityRef: null,
        organTargetRef: null,
        temperamentRef: null,
        phaseRef: null,
        severityRef: null,
        structuredEvidenceItemIds: [],
      },
    ],
    verifiedAge: {
      ageYears: null,
      verificationStatus: 'VERIFIED',
      verifiedDateOfBirth: '1990-01-01',
      consultationAssessmentDate: '2026-01-01',
    },
    patientWideSafety: {},
    structuredEvidenceItemIds: [],
    bpReadings: [],
    ...overrides,
  };
}

describe('Rule 4 Phase 2 safety gate', () => {
  it('systolic-only crisis', () => {
    const out = evaluateRule4Phase2Safety(
      phase2Input({
        bpReadings: [
          {
            systolic: 181,
            diastolic: 85,
            unit: 'mmHg',
            evidenceStatus: 'VERIFIED_CURRENT_READING',
            sourceKind: 'STRUCTURED',
            measuredAt: null,
          },
        ],
      }),
    );
    expect(out.safetyGate?.patientWideHold).toBe(true);
    expect(out.safetyGate?.holdStatus).toBe('PRESCRIPTION_HOLD');
    expect(out.slots[0]?.selectedDilution).toBeNull();
  });

  it('diastolic-only crisis', () => {
    const crisis = evaluateBpCrisisFromSingleReading(130, 110, 'mmHg', 'VERIFIED_CURRENT_READING');
    expect(crisis.crisisDetected).toBe(true);
  });

  it('missing unit does not trigger crisis', () => {
    const crisis = evaluateBpCrisisFromSingleReading(200, 120, null, 'VERIFIED_CURRENT_READING');
    expect(crisis.crisisDetected).toBe(false);
  });

  it('exactly 12 months maps to P13-C not D13-HS', () => {
    const age = resolveVerifiedAge(
      toPhase2VerifiedAge({
        ageYears: null,
        verificationStatus: 'VERIFIED',
        verifiedDateOfBirth: '2024-06-01',
        consultationAssessmentDate: '2025-06-01',
      }),
    );
    expect(age.pediatricBand).toBe('P13_C');
    expect(age.isUnderOneYear).toBe(false);
  });

  it('crisis with missing age still holds', () => {
    const out = evaluateRule4Phase2Safety(
      phase2Input({
        verifiedAge: { ageYears: null, verificationStatus: 'MISSING' },
        bpReadings: [
          {
            systolic: 190,
            diastolic: 70,
            unit: 'mmHg',
            evidenceStatus: 'VERIFIED_CURRENT_READING',
            sourceKind: 'STRUCTURED',
            measuredAt: null,
          },
        ],
      }),
    );
    expect(out.safetyGate?.patientWideHold).toBe(true);
    expect(out.safetyGate?.reasonCodes).toContain('VERIFIED_AGE_MISSING');
  });
});
