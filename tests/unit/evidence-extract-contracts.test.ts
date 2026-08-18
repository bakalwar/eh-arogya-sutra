import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES,
  CANDIDATE_TYPES,
  DeterministicFakeExtractor,
  EVIDENCE_EXTRACT_PRODUCTION,
  EVIDENCE_OCR_ADAPTER_CONNECTED,
  EXTRACT_JOB_TYPE,
  F3A_EXTRACTION_CANDIDATE_FOUNDATION,
  F3C_CANDIDATE_REVIEW_FOUNDATION,
  F3D_FACT_CANDIDATE_FOUNDATION,
  NeverSettlingExtractor,
  RETENTION_JOB_TYPES,
  VERIFICATION_POSTURE_F3A,
  assertNoStorageInLocator,
  boundRawText,
  candidateContentFingerprint,
  candidateReviewEnabled,
  factCandidatesEnabled,
  claimableEvidenceJobTypes,
  detectScriptHint,
  extractJobsEnabled,
  extractorFingerprint,
  normalizeCandidateText,
} from '../../packages/evidence-extract/src/index.ts';

const ids = {
  organizationId: '00000000-0000-4000-8000-000000000001',
  clinicId: '00000000-0000-4000-8000-000000000002',
  patientId: '00000000-0000-4000-8000-000000000003',
  consultationId: '00000000-0000-4000-8000-000000000004',
  evidenceItemId: '00000000-0000-4000-8000-000000000005',
};

describe('F3A extraction contracts', () => {
  it('keeps foundation on and production OCR/extract off', () => {
    expect(F3A_EXTRACTION_CANDIDATE_FOUNDATION).toBe(true);
    expect(F3C_CANDIDATE_REVIEW_FOUNDATION).toBe(true);
    expect(F3D_FACT_CANDIDATE_FOUNDATION).toBe(true);
    expect(EVIDENCE_OCR_ADAPTER_CONNECTED).toBe(false);
    expect(EVIDENCE_EXTRACT_PRODUCTION).toBe(false);
    expect(VERIFICATION_POSTURE_F3A).toBe('UNVERIFIED');
    expect(EXTRACT_JOB_TYPE).toBe('EXTRACT_CANDIDATES');
    expect(RETENTION_JOB_TYPES).toEqual(['DELETE_ORIGINAL', 'VERIFY_DELETION']);
  });

  it('enables extract jobs only with explicit non-production flag', () => {
    expect(extractJobsEnabled({})).toBe(false);
    expect(extractJobsEnabled({ EHAS2_EVIDENCE_EXTRACT_JOBS: '1' })).toBe(true);
    expect(extractJobsEnabled({ EHAS2_EVIDENCE_EXTRACT_JOBS: '1', NODE_ENV: 'production' })).toBe(
      false,
    );
    expect(claimableEvidenceJobTypes({})).toEqual(['DELETE_ORIGINAL', 'VERIFY_DELETION']);
    expect(claimableEvidenceJobTypes({ EHAS2_EVIDENCE_EXTRACT_JOBS: '1' })).toContain(
      'EXTRACT_CANDIDATES',
    );
  });

  it('enables candidate review only with explicit non-production flag', () => {
    expect(candidateReviewEnabled({})).toBe(false);
    expect(candidateReviewEnabled({ EHAS2_F3C_CANDIDATE_REVIEW: '1' })).toBe(true);
    expect(
      candidateReviewEnabled({ EHAS2_F3C_CANDIDATE_REVIEW: '1', NODE_ENV: 'production' }),
    ).toBe(false);
  });

  it('enables fact candidates only with explicit non-production flag', () => {
    expect(factCandidatesEnabled({})).toBe(false);
    expect(factCandidatesEnabled({ EHAS2_F3D_FACT_CANDIDATES: '1' })).toBe(true);
    expect(factCandidatesEnabled({ EHAS2_F3D_FACT_CANDIDATES: '1', NODE_ENV: 'production' })).toBe(
      false,
    );
  });

  it('fingerprints extractor version and candidate payload deterministically', () => {
    const a = extractorFingerprint({
      name: 'deterministic-fake',
      version: '1.0.0-f3a',
      modelOrLangpackVersion: 'none',
      method: 'DETERMINISTIC_FIXTURE',
    });
    const b = extractorFingerprint({
      name: 'deterministic-fake',
      version: '1.0.1-f3a',
      modelOrLangpackVersion: 'none',
      method: 'DETERMINISTIC_FIXTURE',
    });
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
    const locator = { page: 1, blockIndex: 0 };
    const fp1 = candidateContentFingerprint({
      pageNumber: 1,
      sourceLocator: locator,
      candidateType: 'TEXTUAL_VALUE',
      rawText: '13.2',
      normalizedText: '13.2',
      unitText: 'g/dL',
      referenceRangeText: null,
      method: 'DETERMINISTIC_FIXTURE',
      extractorName: 'deterministic-fake',
      extractorVersion: '1.0.0-f3a',
      modelOrLangpackVersion: 'none',
    });
    const fp2 = candidateContentFingerprint({
      pageNumber: 1,
      sourceLocator: locator,
      candidateType: 'TEXTUAL_VALUE',
      rawText: '13.2',
      normalizedText: '13.2',
      unitText: 'g/dL',
      referenceRangeText: null,
      method: 'DETERMINISTIC_FIXTURE',
      extractorName: 'deterministic-fake',
      extractorVersion: '1.0.0-f3a',
      modelOrLangpackVersion: 'none',
    });
    expect(fp1).toBe(fp2);
  });

  it('normalizes Unicode/whitespace without translating Hindi or English', () => {
    expect(normalizeCandidateText('  हीमोग्लोबिन \n ')).toBe('हीमोग्लोबिन');
    expect(detectScriptHint('हीमोग्लोबिन')).toBe('Deva');
    expect(detectScriptHint('Hemoglobin')).toBe('Latn');
    expect(boundRawText('Complete Blood Count', 'REPORT_HEADING')).toBe('Complete Blood Count');
    expect(normalizeCandidateText('13,2')).toBe('13,2');
  });

  it('rejects storage paths in source locators', () => {
    expect(() => assertNoStorageInLocator({ page: 1 })).not.toThrow();
    expect(() => assertNoStorageInLocator({ page: 1, object_key: 'ehas2/x' })).toThrow(
      /SOURCE_LOCATOR_STORAGE_FORBIDDEN/,
    );
  });

  it('emits source-linked unverified candidates from synthetic lab fixture', async () => {
    const extractor = new DeterministicFakeExtractor();
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = await extractor.extract({
      ...ids,
      evidenceType: 'BLOOD_REPORT',
      declaredMime: 'image/png',
      detectedMime: 'image/png',
      byteSize: png.byteLength,
      contentSha256: 'a'.repeat(64),
      magicPrefix: png,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidates.length).toBeGreaterThan(3);
    expect(result.candidates.every((c) => c.status === 'EXTRACTED_UNVERIFIED')).toBe(true);
    expect(result.candidates.every((c) => c.verificationPosture === 'UNVERIFIED')).toBe(true);
    expect(result.candidates.some((c) => c.rawText === 'हीमोग्लोबिन')).toBe(true);
    expect(result.candidates.some((c) => c.rawText === 'Hemoglobin')).toBe(true);
    expect(result.candidates.some((c) => c.candidateType === 'UNIT' && c.unitText === 'g/dL')).toBe(
      true,
    );
    for (const type of CANDIDATE_TYPES) {
      void type;
    }
    for (const c of result.candidates) {
      expect(JSON.stringify(c.sourceLocator)).not.toMatch(/object_key|ehas2\//);
      for (const field of CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES) {
        expect(c).not.toHaveProperty(field);
      }
    }
  });

  it('refuses patient-photo diagnosis and truncated PDFs', async () => {
    const extractor = new DeterministicFakeExtractor();
    const photo = await extractor.extract({
      ...ids,
      evidenceType: 'PATIENT_PHOTO',
      declaredMime: 'image/jpeg',
      detectedMime: 'image/jpeg',
      byteSize: 12,
      contentSha256: 'b'.repeat(64),
      magicPrefix: Uint8Array.from([0xff, 0xd8, 0xff]),
    });
    expect(photo.ok).toBe(false);
    if (photo.ok) return;
    expect(photo.code).toBe('PHOTO_DIAGNOSIS_FORBIDDEN');
    expect(photo.candidates).toEqual([]);

    const truncated = await extractor.extract({
      ...ids,
      evidenceType: 'BLOOD_REPORT',
      declaredMime: 'application/pdf',
      detectedMime: 'application/pdf',
      byteSize: 4,
      contentSha256: 'c'.repeat(64),
      magicPrefix: Uint8Array.from(Buffer.from('%PDF')),
    });
    expect(truncated.ok).toBe(false);
    if (truncated.ok) return;
    expect(truncated.code).toBe('MALFORMED_DOCUMENT');
  });

  it('copies written imaging report text without diagnosing pixels', async () => {
    const extractor = new DeterministicFakeExtractor();
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = await extractor.extract({
      ...ids,
      evidenceType: 'CT',
      declaredMime: 'image/png',
      detectedMime: 'image/png',
      byteSize: png.byteLength,
      contentSha256: 'd'.repeat(64),
      magicPrefix: png,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.limitationCodes).toContain('IMAGE_INTERPRETATION_FORBIDDEN');
    expect(result.candidates.some((c) => c.candidateType === 'WRITTEN_IMPRESSION_TEXT')).toBe(true);
  });

  it('never-settling extractor does not resolve', async () => {
    const pending = new NeverSettlingExtractor().extract({
      ...ids,
      evidenceType: 'BLOOD_REPORT',
      declaredMime: 'image/png',
      detectedMime: 'image/png',
      byteSize: 8,
      contentSha256: 'e'.repeat(64),
      magicPrefix: Uint8Array.from([0x89, 0x50]),
    });
    const raced = await Promise.race([
      pending.then(() => 'settled'),
      new Promise<'pending'>((resolve) => setTimeout(() => resolve('pending'), 20)),
    ]);
    expect(raced).toBe('pending');
  });
});
