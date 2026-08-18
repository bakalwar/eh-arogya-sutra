/**
 * Synthetic F3C preview fixtures only. No PHI, no original report bytes, no storage keys.
 */

export type PreviewBbox = { x: number; y: number; w: number; h: number };

export type PreviewSourceLocator = {
  page: number;
  blockIndex?: number;
  bbox?: PreviewBbox;
};

export type PreviewCandidateFixture = {
  id: string;
  language: 'en' | 'hi';
  candidateType: 'TEST_ANALYTE_LABEL' | 'TEXTUAL_VALUE' | 'WRITTEN_IMPRESSION_TEXT';
  rawText: string;
  normalizedText: string;
  method: 'DETERMINISTIC_FIXTURE';
  extractorName: string;
  extractorVersion: string;
  modelOrLangpackVersion: string;
  confidence: number;
  limitationCodes: readonly string[];
  evidenceId: string;
  sourceLocator: PreviewSourceLocator;
};

export const SYNTHETIC_CANDIDATE_REVIEW_FIXTURES: readonly PreviewCandidateFixture[] = [
  {
    id: 'syn-en-hemoglobin-label',
    language: 'en',
    candidateType: 'TEST_ANALYTE_LABEL',
    rawText: 'Hemoglobin',
    normalizedText: 'Hemoglobin',
    method: 'DETERMINISTIC_FIXTURE',
    extractorName: 'deterministic-fake',
    extractorVersion: '1.0.0-f3c-preview',
    modelOrLangpackVersion: 'none',
    confidence: 0.82,
    limitationCodes: [
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'LOW_CONFIDENCE',
      'NO_TRANSLATION',
    ],
    evidenceId: 'syn-evidence-en-001',
    sourceLocator: {
      page: 1,
      blockIndex: 2,
      bbox: { x: 0.12, y: 0.18, w: 0.28, h: 0.06 },
    },
  },
  {
    id: 'syn-hi-hemoglobin-label',
    language: 'hi',
    candidateType: 'TEST_ANALYTE_LABEL',
    rawText: 'हीमोग्लोबिन',
    normalizedText: 'हीमोग्लोबिन',
    method: 'DETERMINISTIC_FIXTURE',
    extractorName: 'deterministic-fake',
    extractorVersion: '1.0.0-f3c-preview',
    modelOrLangpackVersion: 'none',
    confidence: 0.74,
    limitationCodes: [
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'LOW_CONFIDENCE',
      'PARTIAL_EXTRACTION',
      'NO_TRANSLATION',
    ],
    evidenceId: 'syn-evidence-hi-001',
    sourceLocator: {
      page: 1,
      blockIndex: 3,
      bbox: { x: 0.12, y: 0.28, w: 0.34, h: 0.07 },
    },
  },
];

export function bboxToCssPercent(bbox: PreviewBbox): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  const pct = (n: number): string => `${Number((n * 100).toFixed(4))}%`;
  return {
    left: pct(bbox.x),
    top: pct(bbox.y),
    width: pct(bbox.w),
    height: pct(bbox.h),
  };
}
