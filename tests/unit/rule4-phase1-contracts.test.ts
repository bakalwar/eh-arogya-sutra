import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RULE4_CLINICAL_REGISTRY_STATUS,
  RULE4_DOCUMENTATION_BASELINE_COMMIT,
  RULE4_FULL_REGISTRY_STATUS,
  RULE4_LIMITATION_CODES,
  RULE4_REASON_CODES,
  RULE4_REGISTRY_COMPLETE,
  RULE4_REGISTRY_SCOPE,
  RULE4_REGISTRY_VERSION,
  RULE4_UNKNOWN_CODE_POLICY,
  Rule4UnknownCodeError,
  assertKnownRule4LimitationCode,
  assertKnownRule4ReasonCode,
  evaluateRule4Empty,
  parseRule4EngineMode,
  validateRule4InputContract,
  validateRule4OutputCodes,
  type Rule4InputContract,
} from '../../packages/clinical-contracts/src/rule4/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY_FIXTURE = path.join(
  root,
  'fixtures/rule4/reason-code-registry.phase1-foundation-subset.v1.json',
);

function syntheticInput(overrides: Partial<Rule4InputContract> = {}): Rule4InputContract {
  return {
    contractVersion: 'ehas2-rule4-contract-v1-phase1',
    caseId: 'syn-case-1',
    consultationId: 'syn-consult-1',
    rulesetVersion: 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469',
    engineMode: 'shadow',
    label: 'SYNTHETIC',
    formulaSlots: [
      {
        formulaSlotId: 'slot-a',
        formulaTargetId: 'target-a',
        polarityRef: null,
        organTargetRef: null,
        temperamentRef: null,
        phaseRef: null,
        severityRef: null,
        structuredEvidenceItemIds: ['ev-1'],
      },
    ],
    verifiedAge: { ageYears: null, verificationStatus: 'MISSING' },
    patientWideSafety: {
      crisisHold: false,
      prescriptionHold: false,
      d13HardStopUnderOneYear: false,
    },
    structuredEvidenceItemIds: [],
    ...overrides,
  };
}

describe('Rule 4 Phase 1 contracts', () => {
  it('defaults engine mode to off', () => {
    expect(parseRule4EngineMode(undefined)).toBe('off');
    expect(parseRule4EngineMode('')).toBe('off');
    expect(parseRule4EngineMode('OFF')).toBe('off');
  });

  it('rejects unknown engine mode fail-closed', () => {
    expect(() => parseRule4EngineMode('bogus')).toThrow(/RULE4_ENGINE_MODE_INVALID/);
  });

  it('blocks active mode in empty evaluator', () => {
    expect(() => evaluateRule4Empty(syntheticInput({ engineMode: 'active' }))).toThrow(
      /RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED/,
    );
  });

  it('empty evaluator is NOT_IMPLEMENTED with null dilution and no issuance', () => {
    const input = syntheticInput({ engineMode: 'shadow' });
    const before = structuredClone(input);
    const out = evaluateRule4Empty(input);
    expect(input).toEqual(before);
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(out.automaticPotencyRuntime).toBe(false);
    expect(out.automaticPrescriptionIssuanceRuntime).toBe(false);
    expect(out.currentRuntimePotencyDelta).toBe('NONE');
    expect(out.currentRuntimeIssuanceDelta).toBe('NONE');
    expect(out.finalDoctorApprovalRequired).toBe(true);
    expect(out.prescriptionIssueAllowed).toBe(false);
    expect(out.slots.every((s) => s.selectedDilution === null)).toBe(true);
    expect(out.slots.every((s) => s.potencyStatus === 'NOT_EVALUATED')).toBe(true);
    expect(out.deterministicFingerprint).toMatch(/^[A-F0-9]{64}$/);
  });

  it('deterministic fingerprint for same input', () => {
    const a = evaluateRule4Empty(syntheticInput());
    const b = evaluateRule4Empty(syntheticInput());
    expect(a.deterministicFingerprint).toBe(b.deterministicFingerprint);
  });

  it('rejects forbidden global_text selector input', () => {
    const bad = syntheticInput() as Rule4InputContract & { global_text?: string };
    bad.global_text = 'cancer';
    expect(() => validateRule4InputContract(bad)).toThrow(/Forbidden Rule4 selector input/);
  });

  it('does not inject legacy default polarity/BP/severity/age/dilution', () => {
    const out = evaluateRule4Empty(syntheticInput());
    const serialized = JSON.stringify(out);
    expect(serialized).not.toMatch(/"D30"|"D10"|"MIXED"|"120"|"severity":5|"age":40/);
  });

  it('TypeScript reason/limitation registry includes phase 1 fixture codes', () => {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_FIXTURE, 'utf8')) as {
      reasonCodes: { code: string }[];
      limitationCodes: { code: string }[];
    };
    const jsonReason = registry.reasonCodes.map((r) => r.code);
    const jsonLimit = registry.limitationCodes.map((r) => r.code);
    for (const code of jsonReason) {
      expect(RULE4_REASON_CODES).toContain(code);
    }
    for (const code of jsonLimit) {
      expect(RULE4_LIMITATION_CODES).toContain(code);
    }
  });

  it('registry metadata parity with fixtures JSON', () => {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_FIXTURE, 'utf8')) as {
      registryVersion: string;
      scope: string;
      complete: boolean;
      clinicalRegistryStatus: string;
      documentationBaselineCommit: string;
      unknownCodePolicy: string;
      fullRegistryStatus: string;
    };
    expect(RULE4_REGISTRY_VERSION).toBe(registry.registryVersion);
    expect(RULE4_REGISTRY_SCOPE).toBe(registry.scope);
    expect(RULE4_REGISTRY_COMPLETE).toBe(registry.complete);
    expect(RULE4_CLINICAL_REGISTRY_STATUS).toBe(registry.clinicalRegistryStatus);
    expect(RULE4_DOCUMENTATION_BASELINE_COMMIT).toBe(registry.documentationBaselineCommit);
    expect(RULE4_UNKNOWN_CODE_POLICY).toBe(registry.unknownCodePolicy);
    expect(RULE4_FULL_REGISTRY_STATUS).toBe(registry.fullRegistryStatus);
  });

  it('accepts registered reason and limitation codes', () => {
    expect(() => assertKnownRule4ReasonCode('SEVERITY_VALUE_MISSING')).not.toThrow();
    expect(() => assertKnownRule4LimitationCode('PHASE1_NO_CLINICAL_EVALUATION')).not.toThrow();
    expect(() =>
      validateRule4OutputCodes({
        reasonCodes: ['RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED'],
        limitationCodes: ['PHASE1_NO_CLINICAL_EVALUATION'],
        slots: [
          {
            reasonCodes: ['RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED'],
            limitationCodes: ['PHASE1_NO_CLINICAL_EVALUATION'],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects unknown reason and limitation codes fail-closed', () => {
    expect(() => assertKnownRule4ReasonCode('POLARITY_CONTRADICTORY')).toThrow(
      Rule4UnknownCodeError,
    );
    expect(() => assertKnownRule4ReasonCode('POLARITY_CONTRADICTORY')).toThrow(
      /RULE4_UNKNOWN_REASON_CODE/,
    );
    expect(() => assertKnownRule4LimitationCode('NOT_A_REAL_LIMITATION')).toThrow(
      /RULE4_UNKNOWN_LIMITATION_CODE/,
    );
    expect(() => validateRule4OutputCodes({ reasonCodes: ['POLARITY_CONTRADICTORY'] })).toThrow(
      /RULE4_UNKNOWN_REASON_CODE/,
    );
    expect(() => validateRule4OutputCodes({ limitationCodes: ['NOT_A_REAL_LIMITATION'] })).toThrow(
      /RULE4_UNKNOWN_LIMITATION_CODE/,
    );
  });
});
