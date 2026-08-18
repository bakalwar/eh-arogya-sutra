import {
  MAX_EXTRACT_CANDIDATES,
  VERIFICATION_POSTURE_F3A,
  boundRawText,
  candidateContentFingerprint,
  detectScriptHint,
  normalizeCandidateText,
  type ExtractionCandidateDto,
  type ExtractionMethod,
  type ExtractionRequest,
  type LimitationCode,
} from '@ehas2/evidence-extract';

export type PageTextBlock = {
  pageNumber: number;
  blockIndex: number;
  rawText: string;
  bbox?: { x: number; y: number; w: number; h: number };
  method: ExtractionMethod;
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

export function segmentPageTextToCandidates(input: {
  request: ExtractionRequest;
  blocks: readonly PageTextBlock[];
  extractorName: string;
  extractorVersion: string;
  modelOrLangpackVersion: string;
  extraLimitationCodes?: readonly LimitationCode[];
  maxCandidates?: number;
}): ExtractionCandidateDto[] {
  const maxCandidates = input.maxCandidates ?? MAX_EXTRACT_CANDIDATES;
  const out: ExtractionCandidateDto[] = [];
  for (const block of input.blocks) {
    if (out.length >= maxCandidates) break;
    const rawText = boundRawText(block.rawText, 'PAGE_BLOCK_TEXT');
    const normalizedText = normalizeCandidateText(rawText);
    const dto: ExtractionCandidateDto = {
      ...identity(input.request),
      pageNumber: block.pageNumber,
      sourceLocator: {
        page: block.pageNumber,
        blockIndex: block.blockIndex,
        ...(block.bbox ? { bbox: block.bbox } : {}),
      },
      candidateType: 'PAGE_BLOCK_TEXT',
      rawText,
      normalizedText,
      unitText: null,
      referenceRangeText: null,
      method: block.method,
      extractorName: input.extractorName,
      extractorVersion: input.extractorVersion,
      modelOrLangpackVersion: input.modelOrLangpackVersion,
      confidence: block.confidence ?? null,
      status: 'EXTRACTED_UNVERIFIED',
      limitationCodes: [
        ...(input.extraLimitationCodes ?? []),
        'NOT_AUTHORITATIVE',
        'NO_TRANSLATION',
        ...(block.limitationCodes ?? []),
      ],
      contentFingerprint: '',
      verificationPosture: VERIFICATION_POSTURE_F3A,
      scriptHint: detectScriptHint(rawText),
    };
    dto.contentFingerprint = candidateContentFingerprint(dto);
    out.push(dto);
  }
  return out;
}

export function textItemsToBlocks(input: {
  pageNumber: number;
  items: readonly { text: string; bbox: { x: number; y: number; w: number; h: number } }[];
  method: ExtractionMethod;
  confidence?: number | null;
}): PageTextBlock[] {
  const blocks: PageTextBlock[] = [];
  let blockIndex = 0;
  let current = '';
  let currentBbox: PageTextBlock['bbox'];
  const flush = () => {
    const trimmed = current.trim();
    if (!trimmed) {
      current = '';
      currentBbox = undefined;
      return;
    }
    blocks.push({
      pageNumber: input.pageNumber,
      blockIndex,
      rawText: trimmed,
      bbox: currentBbox,
      method: input.method,
      confidence: input.confidence ?? null,
    });
    blockIndex += 1;
    current = '';
    currentBbox = undefined;
  };
  for (const item of input.items) {
    const piece = item.text;
    if (!piece.trim()) {
      flush();
      continue;
    }
    if (!current) {
      current = piece;
      currentBbox = item.bbox;
      continue;
    }
    current = `${current} ${piece}`;
    if (currentBbox) {
      const right = Math.max(currentBbox.x + currentBbox.w, item.bbox.x + item.bbox.w);
      const bottom = Math.max(currentBbox.y + currentBbox.h, item.bbox.y + item.bbox.h);
      currentBbox = {
        x: Math.min(currentBbox.x, item.bbox.x),
        y: Math.min(currentBbox.y, item.bbox.y),
        w: Math.min(1, right - Math.min(currentBbox.x, item.bbox.x)),
        h: Math.min(1, bottom - Math.min(currentBbox.y, item.bbox.y)),
      };
    }
  }
  flush();
  return blocks;
}
