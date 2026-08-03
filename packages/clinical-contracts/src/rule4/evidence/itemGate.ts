import type {
  Rule4EvidenceItemEnvelope,
  Rule4ItemGateResult,
  Rule4ReportDocumentEnvelope,
} from './types.js';

const TIER2_ITEM_MIN = 0.9;
const TIER3_ITEM_MIN = 0.85;
const TIER4A_ENTITY_MIN = 0.8;
const TIER4B_ALIGN_MIN = 0.8;
const TIER1_CONFIDENCE = 1.0;

function requiresItemModelCalibration(item: Rule4EvidenceItemEnvelope): boolean {
  if (item.sourceType === 'OCR_EXTRACTED_DOCUMENT_IMAGE') {
    return true;
  }
  if (item.sourceType === 'DOCTOR_FREE_TEXT_NLP_EXTRACTION') {
    return true;
  }
  if (item.sourceType === 'DIGITAL_STRUCTURED_REPORT' && item.extractionModelDerived === true) {
    return true;
  }
  return false;
}

function scoreInRange(score: number): boolean {
  return score >= 0 && score <= 1;
}

export function evaluateItemGate(
  item: Rule4EvidenceItemEnvelope,
  doc: Rule4ReportDocumentEnvelope | undefined,
  documentGatePassed: boolean,
): Rule4ItemGateResult {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = [];

  if (!documentGatePassed) {
    reasonCodes.push('D08_DOCUMENT_GATE_FAILED');
    return {
      findingId: item.findingId,
      documentId: item.documentId,
      passed: false,
      reasonCodes,
      limitationCodes,
    };
  }

  if (item.sourceType === 'CLINICAL_PHOTO_RAW') {
    reasonCodes.push('CLINICAL_PHOTO_NOT_USABLE_ALONE');
    return {
      findingId: item.findingId,
      documentId: item.documentId,
      passed: false,
      reasonCodes,
      limitationCodes,
    };
  }

  if (requiresItemModelCalibration(item)) {
    const status = item.modelCalibrationStatus ?? doc?.modelCalibrationStatus ?? 'NOT_CALIBRATED';
    if (status !== 'CALIBRATED_AND_VERIFIED') {
      reasonCodes.push('UNCALIBRATED_MODEL_BLOCKED_PRE_EXECUTION');
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: false,
        reasonCodes,
        limitationCodes,
      };
    }
  }

  const score = item.confidenceScore;
  if (
    item.sourceType !== 'DOCTOR_STRUCTURED_ENTRY' &&
    item.sourceType !== 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION'
  ) {
    if (score == null || !scoreInRange(score)) {
      reasonCodes.push('MISSING_CONFIDENCE_SCORE');
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: false,
        reasonCodes,
        limitationCodes,
      };
    }
  }

  switch (item.sourceType) {
    case 'DOCTOR_STRUCTURED_ENTRY':
    case 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION':
      if (score !== TIER1_CONFIDENCE) {
        reasonCodes.push('ITEM_BELOW_CONFIDENCE_THRESHOLD');
        return {
          findingId: item.findingId,
          documentId: item.documentId,
          passed: false,
          reasonCodes,
          limitationCodes,
        };
      }
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: true,
        reasonCodes,
        limitationCodes,
      };
    case 'DIGITAL_STRUCTURED_REPORT':
      if (score < TIER2_ITEM_MIN) {
        reasonCodes.push('ITEM_BELOW_CONFIDENCE_THRESHOLD');
        return {
          findingId: item.findingId,
          documentId: item.documentId,
          passed: false,
          reasonCodes,
          limitationCodes,
        };
      }
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: true,
        reasonCodes,
        limitationCodes,
      };
    case 'OCR_EXTRACTED_DOCUMENT_IMAGE':
      if (score < TIER3_ITEM_MIN) {
        reasonCodes.push('ITEM_BELOW_CONFIDENCE_THRESHOLD');
        return {
          findingId: item.findingId,
          documentId: item.documentId,
          passed: false,
          reasonCodes,
          limitationCodes,
        };
      }
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: true,
        reasonCodes,
        limitationCodes,
      };
    case 'DOCTOR_FREE_TEXT_NLP_EXTRACTION':
      if (score < TIER4A_ENTITY_MIN) {
        reasonCodes.push('ITEM_BELOW_CONFIDENCE_THRESHOLD');
        return {
          findingId: item.findingId,
          documentId: item.documentId,
          passed: false,
          reasonCodes,
          limitationCodes,
        };
      }
      limitationCodes.push('TIER4A_SUPPORTED_CANDIDATE_ONLY');
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: true,
        reasonCodes,
        limitationCodes,
      };
    case 'DATASET_TAXONOMY_ALIGNMENT':
      if (score < TIER4B_ALIGN_MIN) {
        reasonCodes.push('ITEM_BELOW_CONFIDENCE_THRESHOLD');
        return {
          findingId: item.findingId,
          documentId: item.documentId,
          passed: false,
          reasonCodes,
          limitationCodes,
        };
      }
      limitationCodes.push('DATASET_TAXONOMY_SUPPORTING_ONLY');
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: true,
        reasonCodes,
        limitationCodes,
      };
    default:
      reasonCodes.push('UNKNOWN_SOURCE_TYPE');
      return {
        findingId: item.findingId,
        documentId: item.documentId,
        passed: false,
        reasonCodes,
        limitationCodes,
      };
  }
}
