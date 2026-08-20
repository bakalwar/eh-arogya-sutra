import { describe, expect, it } from 'vitest';
import {
  CUE_PARSER_SOURCE_CHANNELS,
  CUE_PARSER_SOURCE_COMBINATIONS,
  CUE_PARSER_SOURCE_FIELDS,
  loadPinnedProductionPack,
  parseOwnerFrozenCues,
  type EligibleCueParserInput,
} from '../../packages/evidence-extract/src/index.ts';

const ORG = '00000000-0000-4000-8000-0000000000b1';
const CLINIC = '00000000-0000-4000-8000-0000000000b2';
const PATIENT = '00000000-0000-4000-8000-0000000000b3';
const CONSULT = '00000000-0000-4000-8000-0000000000b4';
const FP = 'a'.repeat(64);

function base(extra: Partial<EligibleCueParserInput> = {}): EligibleCueParserInput {
  return {
    sourceIdentityFingerprint: FP,
    sourceChannel: 'DOCTOR_DECLARED',
    sourceField: 'CHIEF_COMPLAINT',
    eligibleText: 'denies fever',
    organizationId: ORG,
    clinicId: CLINIC,
    patientId: PATIENT,
    consultationId: CONSULT,
    ...extra,
  };
}

describe('F3D-2C2 parser closed source channel/field contract', () => {
  const pack = loadPinnedProductionPack();

  it('accepts REVIEWED_REPORT_TEXT + REVIEWED_EXTRACTION_CANDIDATE only as the new pair', () => {
    expect(CUE_PARSER_SOURCE_CHANNELS).toEqual(['DOCTOR_DECLARED', 'REVIEWED_REPORT_TEXT']);
    expect(CUE_PARSER_SOURCE_FIELDS).toContain('REVIEWED_EXTRACTION_CANDIDATE');
    expect(CUE_PARSER_SOURCE_COMBINATIONS).toEqual(
      expect.arrayContaining([
        { sourceChannel: 'DOCTOR_DECLARED', sourceField: 'CHIEF_COMPLAINT' },
        {
          sourceChannel: 'REVIEWED_REPORT_TEXT',
          sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        },
      ]),
    );
    expect(CUE_PARSER_SOURCE_COMBINATIONS).toHaveLength(5);

    const res = parseOwnerFrozenCues(
      base({
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
      }),
      pack,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.matches.length).toBeGreaterThan(0);
    for (const m of res.matches) {
      expect(m.sourceChannel).toBe('REVIEWED_REPORT_TEXT');
      expect(m.sourceField).toBe('REVIEWED_EXTRACTION_CANDIDATE');
      expect(m.authorityScope).toBe('TERMINOLOGY_CUE_MATCH_ONLY');
      expect(m.clinicallyUsed).toBe(false);
      expect(m.selectorProhibition).toBe('SELECTOR_FORBIDDEN');
      expect(m).not.toHaveProperty('diseaseId');
      expect(m).not.toHaveProperty('medicineCode');
    }
  });

  it('keeps doctor-declared chief-complaint behavior unchanged', () => {
    const res = parseOwnerFrozenCues(base(), pack);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.matches.some((m) => m.entryId === 'neg-04')).toBe(true);
    expect(res.matches.every((m) => m.sourceChannel === 'DOCTOR_DECLARED')).toBe(true);
    expect(res.matches.every((m) => m.sourceField === 'CHIEF_COMPLAINT')).toBe(true);
  });

  it('fails closed on illegal channel/field combinations', () => {
    const illegal: Partial<EligibleCueParserInput>[] = [
      { sourceChannel: 'REVIEWED_REPORT_TEXT', sourceField: 'CHIEF_COMPLAINT' },
      { sourceChannel: 'DOCTOR_DECLARED', sourceField: 'REVIEWED_EXTRACTION_CANDIDATE' },
      { sourceChannel: 'OCR_RAW' as never, sourceField: 'CHIEF_COMPLAINT' },
      { sourceChannel: 'DOCTOR_DECLARED', sourceField: 'PATIENT_PHOTO' as never },
      { sourceChannel: 'REVIEWED_REPORT_TEXT', sourceField: 'SYMPTOM_ROW' },
    ];
    for (const row of illegal) {
      const res = parseOwnerFrozenCues(base(row), pack);
      expect(res).toEqual({ ok: false, reason: 'UNTRUSTED_INPUT', matches: [] });
    }
  });

  it('binds distinct match identities when source channel/field change', () => {
    const doctor = parseOwnerFrozenCues(base(), pack);
    const reviewed = parseOwnerFrozenCues(
      base({
        sourceChannel: 'REVIEWED_REPORT_TEXT',
        sourceField: 'REVIEWED_EXTRACTION_CANDIDATE',
        sourceIdentityFingerprint: 'b'.repeat(64),
      }),
      pack,
    );
    expect(doctor.ok && reviewed.ok).toBe(true);
    if (!doctor.ok || !reviewed.ok) return;
    const dIds = new Set(doctor.matches.map((m) => m.candidateId));
    const rIds = new Set(reviewed.matches.map((m) => m.candidateId));
    for (const id of rIds) {
      expect(dIds.has(id)).toBe(false);
    }
  });
});
