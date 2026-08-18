import type { EvidenceType } from '@ehas2/evidence-ingest';
import { candidateContentFingerprint, extractorFingerprint } from './fingerprint.js';
import {
  boundRange,
  boundRawText,
  boundUnit,
  detectScriptHint,
  normalizeCandidateText,
} from './normalize.js';
import {
  MAGIC_PREFIX_MAX,
  MAX_EXTRACT_CANDIDATES,
  type CandidateType,
  type ExtractionCandidateDto,
  type ExtractionProvider,
  type ExtractionRefusal,
  type ExtractionRequest,
  type ExtractionResult,
  type LimitationCode,
  VERIFICATION_POSTURE_F3A,
} from './types.js';

const METHOD = 'DETERMINISTIC_FIXTURE' as const;
const MODEL = 'none';
const NAME = 'deterministic-fake';

type FixtureRow = {
  candidateType: CandidateType;
  rawText: string;
  unitText?: string | null;
  referenceRangeText?: string | null;
  pageNumber?: number;
  blockIndex?: number;
  confidence?: number | null;
  limitationCodes?: readonly LimitationCode[];
};

function identity(input: ExtractionRequest) {
  return {
    organizationId: input.organizationId,
    clinicId: input.clinicId,
    patientId: input.patientId,
    consultationId: input.consultationId,
    evidenceItemId: input.evidenceItemId,
  };
}

function toCandidates(
  input: ExtractionRequest,
  rows: readonly FixtureRow[],
  extractor: { name: string; version: string },
  extraLimits: readonly LimitationCode[],
): ExtractionCandidateDto[] {
  const out: ExtractionCandidateDto[] = [];
  for (const row of rows.slice(0, MAX_EXTRACT_CANDIDATES)) {
    const rawText = boundRawText(row.rawText, row.candidateType);
    const normalizedText = normalizeCandidateText(rawText);
    const dto: ExtractionCandidateDto = {
      ...identity(input),
      pageNumber: row.pageNumber ?? 1,
      sourceLocator: {
        page: row.pageNumber ?? 1,
        blockIndex: row.blockIndex ?? 0,
      },
      candidateType: row.candidateType,
      rawText,
      normalizedText,
      unitText: boundUnit(row.unitText ?? null),
      referenceRangeText: boundRange(row.referenceRangeText ?? null),
      method: METHOD,
      extractorName: extractor.name,
      extractorVersion: extractor.version,
      modelOrLangpackVersion: MODEL,
      confidence: row.confidence ?? 0.99,
      status: 'EXTRACTED_UNVERIFIED',
      limitationCodes: [...extraLimits, ...(row.limitationCodes ?? [])],
      contentFingerprint: '',
      verificationPosture: VERIFICATION_POSTURE_F3A,
      scriptHint: detectScriptHint(rawText),
    };
    dto.contentFingerprint = candidateContentFingerprint(dto);
    out.push(dto);
  }
  return out;
}

function refuse(
  extractor: { name: string; version: string; fingerprint: string },
  code: LimitationCode,
  extra: readonly LimitationCode[] = [],
): ExtractionRefusal {
  return {
    ok: false,
    code,
    method: METHOD,
    extractorName: extractor.name,
    extractorVersion: extractor.version,
    modelOrLangpackVersion: MODEL,
    extractorFingerprint: extractor.fingerprint,
    limitationCodes: [code, 'SYNTHETIC_FIXTURE_ONLY', 'NOT_AUTHORITATIVE', ...extra],
    candidates: [],
  };
}

function looksLikePdfHeader(magic: Uint8Array): boolean {
  return Buffer.from(magic.subarray(0, 5)).toString('latin1') === '%PDF-';
}

function imagingWrittenReport(): FixtureRow[] {
  return [
    {
      candidateType: 'REPORT_HEADING',
      rawText: 'Synthetic written imaging report',
      blockIndex: 0,
    },
    {
      candidateType: 'WRITTEN_IMPRESSION_TEXT',
      rawText: 'Impression: synthetic written report text only; not an image diagnosis.',
      blockIndex: 1,
      limitationCodes: ['IMAGE_INTERPRETATION_FORBIDDEN', 'NOT_AUTHORITATIVE'],
    },
    {
      candidateType: 'DATE',
      rawText: '2024-01-15',
      blockIndex: 2,
    },
  ];
}

function bloodReportRows(): FixtureRow[] {
  return [
    {
      candidateType: 'DOCUMENT_METADATA',
      rawText: 'Synthetic lab report fixture',
      blockIndex: 0,
    },
    {
      candidateType: 'REPORT_HEADING',
      rawText: 'Complete Blood Count',
      blockIndex: 1,
    },
    {
      candidateType: 'TEST_ANALYTE_LABEL',
      rawText: 'Hemoglobin',
      blockIndex: 2,
    },
    {
      candidateType: 'TEXTUAL_VALUE',
      rawText: '13.2',
      blockIndex: 3,
    },
    {
      candidateType: 'UNIT',
      rawText: 'g/dL',
      unitText: 'g/dL',
      blockIndex: 4,
    },
    {
      candidateType: 'REFERENCE_RANGE_TEXT',
      rawText: '12.0-15.0',
      referenceRangeText: '12.0-15.0',
      blockIndex: 5,
    },
    {
      candidateType: 'TEST_ANALYTE_LABEL',
      rawText: 'हीमोग्लोबिन',
      blockIndex: 6,
      limitationCodes: ['NO_TRANSLATION'],
    },
    {
      candidateType: 'TEXTUAL_VALUE',
      rawText: '13,2',
      blockIndex: 7,
      limitationCodes: ['NO_TRANSLATION'],
    },
    {
      candidateType: 'REPORT_SECTION',
      rawText: 'Haematology',
      blockIndex: 8,
    },
    {
      candidateType: 'CONFIDENCE_OR_LIMITATION',
      rawText: 'SYNTHETIC_FIXTURE_ONLY',
      confidence: 1,
      blockIndex: 9,
      limitationCodes: ['SYNTHETIC_FIXTURE_ONLY', 'NOT_AUTHORITATIVE'],
    },
    {
      candidateType: 'WRITTEN_IMPRESSION_TEXT',
      rawText: 'Impression: synthetic source-stated finding only; not a confirmed diagnosis.',
      blockIndex: 10,
      limitationCodes: ['NOT_AUTHORITATIVE', 'NO_TRANSLATION'],
    },
    {
      candidateType: 'WRITTEN_IMPRESSION_TEXT',
      rawText: 'निष्कर्ष: केवल सिंथेटिक स्रोत कथन, पुष्ट निदान नहीं।',
      blockIndex: 11,
      limitationCodes: ['NOT_AUTHORITATIVE', 'NO_TRANSLATION'],
    },
  ];
}

function otherReportRows(): FixtureRow[] {
  return [
    {
      candidateType: 'PAGE_BLOCK_TEXT',
      rawText: 'Synthetic investigation report page text',
      blockIndex: 0,
    },
    {
      candidateType: 'DATE',
      rawText: '2024-02-01',
      blockIndex: 1,
    },
  ];
}

function fixturesFor(evidenceType: EvidenceType): FixtureRow[] {
  if (evidenceType === 'BLOOD_REPORT') return bloodReportRows();
  if (
    evidenceType === 'USG' ||
    evidenceType === 'CT' ||
    evidenceType === 'MRI' ||
    evidenceType === 'XRAY'
  ) {
    return imagingWrittenReport();
  }
  return otherReportRows();
}

/**
 * In-process fake extractor for F3A tests.
 * Does not run OCR, download models, or interpret diagnostic images.
 */
export class DeterministicFakeExtractor implements ExtractionProvider {
  readonly productionReady = false as const;
  readonly ocrConnected = false as const;
  readonly method = METHOD;
  readonly modelOrLangpackVersion = MODEL;
  readonly name: string;
  readonly version: string;

  constructor(version = '1.0.0-f3a', name = NAME) {
    this.version = version;
    this.name = name;
  }

  fingerprint(): string {
    return extractorFingerprint({
      name: this.name,
      version: this.version,
      modelOrLangpackVersion: MODEL,
      method: METHOD,
    });
  }

  async extract(input: ExtractionRequest): Promise<ExtractionResult> {
    if (input.abortSignal?.aborted) {
      return refuse(
        { name: this.name, version: this.version, fingerprint: this.fingerprint() },
        'TIMEOUT',
      );
    }
    const meta = {
      name: this.name,
      version: this.version,
      fingerprint: this.fingerprint(),
    };
    const magic = input.magicPrefix.subarray(0, MAGIC_PREFIX_MAX);
    if (input.byteSize <= 0 || magic.byteLength === 0) {
      return refuse(meta, 'MALFORMED_DOCUMENT');
    }
    if (input.declaredMime === 'application/pdf' && !looksLikePdfHeader(magic)) {
      return refuse(meta, 'MALFORMED_DOCUMENT');
    }
    if (input.evidenceType === 'PATIENT_PHOTO') {
      return refuse(meta, 'PHOTO_DIAGNOSIS_FORBIDDEN', ['UNSUPPORTED_TYPE']);
    }
    const extra: LimitationCode[] = [
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'NO_TRANSLATION',
    ];
    if (
      input.evidenceType === 'USG' ||
      input.evidenceType === 'CT' ||
      input.evidenceType === 'MRI' ||
      input.evidenceType === 'XRAY'
    ) {
      extra.push('IMAGE_INTERPRETATION_FORBIDDEN');
    }
    const candidates = toCandidates(input, fixturesFor(input.evidenceType), this, extra);
    return {
      ok: true,
      method: METHOD,
      extractorName: this.name,
      extractorVersion: this.version,
      modelOrLangpackVersion: MODEL,
      extractorFingerprint: this.fingerprint(),
      limitationCodes: extra,
      candidates,
    };
  }
}

/** Test helper: never settles (timeout/cancellation). */
export class NeverSettlingExtractor implements ExtractionProvider {
  readonly productionReady = false as const;
  readonly ocrConnected = false as const;
  readonly method = METHOD;
  readonly modelOrLangpackVersion = MODEL;
  readonly name = 'never-settling-fake';
  readonly version = '0.0.0-test';

  async extract(_input: ExtractionRequest): Promise<ExtractionResult> {
    return new Promise(() => {
      /* ignores abort and never settles */
    });
  }
}

export function defaultDeterministicExtractor(): DeterministicFakeExtractor {
  return new DeterministicFakeExtractor();
}
