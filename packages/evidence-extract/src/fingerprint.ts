import { createHash } from 'node:crypto';
import type { ExtractionCandidateDto, ExtractionMethod } from './types.js';

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function extractorFingerprint(input: {
  name: string;
  version: string;
  modelOrLangpackVersion: string;
  method: ExtractionMethod;
}): string {
  return sha256Hex(
    `${input.name}|${input.version}|${input.modelOrLangpackVersion}|${input.method}`,
  );
}

export function candidateContentFingerprint(
  candidate: Pick<
    ExtractionCandidateDto,
    | 'pageNumber'
    | 'sourceLocator'
    | 'candidateType'
    | 'rawText'
    | 'normalizedText'
    | 'unitText'
    | 'referenceRangeText'
    | 'method'
    | 'extractorName'
    | 'extractorVersion'
    | 'modelOrLangpackVersion'
  >,
): string {
  const locator = {
    page: candidate.sourceLocator.page,
    blockIndex: candidate.sourceLocator.blockIndex ?? null,
    bbox: candidate.sourceLocator.bbox
      ? {
          x: candidate.sourceLocator.bbox.x,
          y: candidate.sourceLocator.bbox.y,
          w: candidate.sourceLocator.bbox.w,
          h: candidate.sourceLocator.bbox.h,
        }
      : null,
  };
  return sha256Hex(
    JSON.stringify({
      pageNumber: candidate.pageNumber,
      sourceLocator: locator,
      candidateType: candidate.candidateType,
      rawText: candidate.rawText,
      normalizedText: candidate.normalizedText,
      unitText: candidate.unitText,
      referenceRangeText: candidate.referenceRangeText,
      method: candidate.method,
      extractorName: candidate.extractorName,
      extractorVersion: candidate.extractorVersion,
      modelOrLangpackVersion: candidate.modelOrLangpackVersion,
    }),
  );
}

export function assertNoStorageInLocator(locator: unknown): void {
  const blob = JSON.stringify(locator);
  if (/object_key|objectKey|object_url|presigned|public_url|"path"|storage|bucket/i.test(blob)) {
    throw Object.assign(new Error('SOURCE_LOCATOR_STORAGE_FORBIDDEN'), {
      code: 'SOURCE_LOCATOR_STORAGE_FORBIDDEN',
    });
  }
}
