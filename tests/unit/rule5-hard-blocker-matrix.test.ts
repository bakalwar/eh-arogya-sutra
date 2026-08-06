import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RULE5_BLOCKER_SAFETY_GROUP_G1_CODES,
  RULE5_BLOCKER_SAFETY_GROUP_G2_CODES,
  RULE5_BLOCKER_SAFETY_GROUP_G3_CODES,
  RULE5_BLOCKER_SAFETY_GROUP_G4_CODES,
  RULE5_CANONICAL_HARD_BLOCKER_MATRIX,
  RULE5_HARD_BLOCKER_CONDITION_COUNT,
  RULE5_HARD_BLOCKER_MAPPING_COUNT,
  RULE5_MATRIX_EVIDENCE_GATE,
  RULE5_MATRIX_THRESHOLD_POLICY,
  RULE5_HARD_BLOCKER_MATRIX_VERSION,
  RULE5_CLINICAL_REASON_CODES,
  isKnownRule5ClinicalReasonCode,
  Rule5MatrixValidationError,
  validateRule5HardBlockerMatrixDocument,
} from '../../packages/clinical-contracts/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const matrixFixturePath = path.join(root, 'fixtures/rule5/hard-blocker-matrix.v1.json');
const matrixSourcePath = path.join(
  root,
  'packages/clinical-contracts/src/rule5/hardBlockerMatrix.ts',
);

function readMatrixFixture(): unknown {
  return JSON.parse(fs.readFileSync(matrixFixturePath, 'utf8')) as unknown;
}

function expectMatrixFailure(
  fn: () => void,
  code: Rule5MatrixValidationError['failureCode'],
): void {
  try {
    fn();
    expect.fail('expected matrix validation error');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule5MatrixValidationError);
    expect((e as Rule5MatrixValidationError).failureCode).toBe(code);
  }
}

describe('Rule 5 R5-M3 hard-blocker matrix', () => {
  const validated = validateRule5HardBlockerMatrixDocument(readMatrixFixture());

  it('validates fixture against frozen canonical matrix singleton', () => {
    expect(validated).toBe(RULE5_CANONICAL_HARD_BLOCKER_MATRIX);
    expect(validated.matrixVersion).toBe(RULE5_HARD_BLOCKER_MATRIX_VERSION);
  });

  it('contains exactly 16 conditions and 17 blocker mappings', () => {
    expect(validated.conditions).toHaveLength(RULE5_HARD_BLOCKER_CONDITION_COUNT);
    expect(validated.mappings).toHaveLength(RULE5_HARD_BLOCKER_MAPPING_COUNT);
    expect(validated.conditions.every((c) => c.executable === false)).toBe(true);
    expect(validated.mappings.every((m) => m.executable === false)).toBe(true);
  });

  it('splits overdose and uncomputable exposure across HB-010A and HB-010B', () => {
    const a = validated.mappings.find((m) => m.mappingId === 'HB-010A');
    const b = validated.mappings.find((m) => m.mappingId === 'HB-010B');
    expect(a?.conditionId).toBe('HB-010');
    expect(b?.conditionId).toBe('HB-010');
    expect(a?.reasonCode).toBe('R5_OVERDOSE_SUSPECTED');
    expect(b?.reasonCode).toBe('R5_EXPOSURE_UNCOMPUTABLE');
    expect(a?.safetyGroup).toBe('G1');
    expect(b?.safetyGroup).toBe('G2');
  });

  it('assigns exact four-group membership for blocker reason codes', () => {
    expect([...RULE5_BLOCKER_SAFETY_GROUP_G1_CODES].sort()).toEqual(
      [
        'R5_EMERGENCY_RED_FLAG_DETECTED',
        'R5_SEVERE_REACTION_SUSPECTED',
        'R5_ACUTE_CLINICAL_DETERIORATION',
        'R5_OVERDOSE_SUSPECTED',
      ].sort(),
    );
    expect([...RULE5_BLOCKER_SAFETY_GROUP_G2_CODES].sort()).toEqual(
      [
        'R5_SERIOUS_ADVERSE_EVENT_SUSPECTED',
        'R5_DANGEROUS_VITAL_OR_LAB_RESULT',
        'R5_EXPOSURE_UNCOMPUTABLE',
      ].sort(),
    );
    expect(RULE5_BLOCKER_SAFETY_GROUP_G3_CODES).toHaveLength(8);
    expect([...RULE5_BLOCKER_SAFETY_GROUP_G4_CODES].sort()).toEqual(
      ['R5_REQUIRED_MONITORING_DATA_MISSING', 'R5_CRITICAL_FOLLOW_UP_CONTRADICTION'].sort(),
    );
  });

  it('requires M6 evidence gate, no threshold policy, and doctor review on every mapping', () => {
    expect(RULE5_MATRIX_EVIDENCE_GATE).toBe('EVIDENCE_AUDIT_REQUIRED_BEFORE_ACTIVATION');
    expect(validated.mappings).toHaveLength(17);
    for (const m of validated.mappings) {
      expect(m.evidenceGate).toBe('EVIDENCE_AUDIT_REQUIRED_BEFORE_ACTIVATION');
      expect(m.evidenceGate).toBe(RULE5_MATRIX_EVIDENCE_GATE);
      expect(m.thresholdPolicy).toBe(RULE5_MATRIX_THRESHOLD_POLICY);
      expect(m.doctorReviewRequired).toBe(true);
      expect(m.ownerDecisionAnchor).toBe('OD-R5-M0-016');
    }
  });

  it('keeps neutral evidence gate out of the 34-code clinical reason registry', () => {
    expect(RULE5_CLINICAL_REASON_CODES).toHaveLength(34);
    expect(isKnownRule5ClinicalReasonCode('EVIDENCE_AUDIT_REQUIRED_BEFORE_ACTIVATION')).toBe(false);
    expect(isKnownRule5ClinicalReasonCode('R5_M6_EVIDENCE_AUDIT_REQUIRED')).toBe(false);
    const matrixFixtureText = fs.readFileSync(matrixFixturePath, 'utf8');
    const matrixSourceText = fs.readFileSync(matrixSourcePath, 'utf8');
    expect(matrixFixtureText).not.toContain('R5_M6_EVIDENCE_AUDIT_REQUIRED');
    expect(matrixSourceText).not.toContain('R5_M6_EVIDENCE_AUDIT_REQUIRED');
    expect(matrixFixtureText).not.toMatch(/R5_M6_EVIDENCE/);
  });

  it('keeps cross-cutting governance references outside 16/17 counts', () => {
    const gov = validated.crossCuttingGovernance;
    expect(gov.reasonCodeReferences).toEqual([
      'R5_UNKNOWN_SEVERITY',
      'R5_EVIDENCE_MISSING_OR_UNVERIFIED',
    ]);
    expect(gov.acknowledgmentDoesNotClearBlocker).toBe(true);
    expect(gov.missingEvidenceNeverMeansPass).toBe(true);
    expect(gov.automaticClinicalActionAuthorized).toBe(false);
    expect(gov.evidenceStateCatalogDeferredToM6).toBe(true);
    expect(gov.rule4ExcludedThresholdsAndDataAssets).toBe(true);
    expect(gov.automatedBlockerActivationAuthorized).toBe(false);
    expect(validated.conditions).toHaveLength(16);
    expect(validated.mappings).toHaveLength(17);
  });

  it('deep-freezes matrix root, arrays, and entries', () => {
    const m = RULE5_CANONICAL_HARD_BLOCKER_MATRIX;
    expect(Object.isFrozen(m)).toBe(true);
    expect(Object.isFrozen(m.conditions)).toBe(true);
    expect(Object.isFrozen(m.mappings)).toBe(true);
    expect(Object.isFrozen(m.crossCuttingGovernance)).toBe(true);
    for (const c of m.conditions) expect(Object.isFrozen(c)).toBe(true);
    for (const row of m.mappings) expect(Object.isFrozen(row)).toBe(true);
  });

  it('rejects wrong mapping count and invalid safety group fail-closed', () => {
    const base = readMatrixFixture() as Record<string, unknown>;
    const shortMappings = {
      ...base,
      mappings: (base.mappings as unknown[]).slice(0, 16),
    };
    expectMatrixFailure(
      () => validateRule5HardBlockerMatrixDocument(shortMappings),
      'RULE5_MATRIX_WRONG_MAPPING_COUNT',
    );
    const badGroup = {
      ...base,
      mappings: (base.mappings as Record<string, unknown>[]).map((m) =>
        m.mappingId === 'HB-001' ? { ...m, safetyGroup: 'G9' } : m,
      ),
    };
    expectMatrixFailure(
      () => validateRule5HardBlockerMatrixDocument(badGroup),
      'RULE5_MATRIX_INVALID_SAFETY_GROUP',
    );
  });

  it('rejects executable mappings and wrong evidence gate', () => {
    const base = readMatrixFixture() as Record<string, unknown>;
    expectMatrixFailure(
      () =>
        validateRule5HardBlockerMatrixDocument({
          ...base,
          mappings: (base.mappings as Record<string, unknown>[]).map((m) =>
            m.mappingId === 'HB-002' ? { ...m, executable: true } : m,
          ),
        }),
      'RULE5_MATRIX_EXECUTABLE_NOT_ALLOWED',
    );
    expectMatrixFailure(
      () =>
        validateRule5HardBlockerMatrixDocument({
          ...base,
          mappings: (base.mappings as Record<string, unknown>[]).map((m) =>
            m.mappingId === 'HB-002' ? { ...m, evidenceGate: 'ACTIVE' } : m,
          ),
        }),
      'RULE5_MATRIX_WRONG_EVIDENCE_GATE',
    );
    expectMatrixFailure(
      () =>
        validateRule5HardBlockerMatrixDocument({
          ...base,
          mappings: (base.mappings as Record<string, unknown>[]).map((m) =>
            m.mappingId === 'HB-003' ? { ...m, evidenceGate: 'R5_M6_EVIDENCE_AUDIT_REQUIRED' } : m,
          ),
        }),
      'RULE5_MATRIX_WRONG_EVIDENCE_GATE',
    );
  });
});
