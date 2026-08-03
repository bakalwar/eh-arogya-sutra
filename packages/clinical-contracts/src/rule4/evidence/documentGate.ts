import type { Rule4DocumentGateResult, Rule4ReportDocumentEnvelope } from './types.js';

const TIER2_DOC_MIN = 0.85;
const TIER3_DOC_MIN = 0.8;

function requiresModelCalibration(doc: Rule4ReportDocumentEnvelope): boolean {
  if (doc.sourceType === 'OCR_EXTRACTED_DOCUMENT_IMAGE') {
    return true;
  }
  if (doc.sourceType === 'DOCTOR_FREE_TEXT_NLP_EXTRACTION') {
    return true;
  }
  if (doc.sourceType === 'DIGITAL_STRUCTURED_REPORT' && doc.extractionModelDerived === true) {
    return true;
  }
  return false;
}

function calibrationBlocked(doc: Rule4ReportDocumentEnvelope): string | null {
  if (!requiresModelCalibration(doc)) {
    return null;
  }
  const status = doc.modelCalibrationStatus ?? 'NOT_CALIBRATED';
  if (status !== 'CALIBRATED_AND_VERIFIED') {
    return 'UNCALIBRATED_MODEL_BLOCKED_PRE_EXECUTION';
  }
  return null;
}

export function evaluateDocumentGate(doc: Rule4ReportDocumentEnvelope): Rule4DocumentGateResult {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = [];

  if (doc.sourceType === 'CLINICAL_PHOTO_RAW') {
    reasonCodes.push('CLINICAL_PHOTO_NOT_USABLE_ALONE');
    return { documentId: doc.documentId, passed: false, reasonCodes, limitationCodes };
  }

  const calBlock = calibrationBlocked(doc);
  if (calBlock) {
    reasonCodes.push(calBlock);
    return { documentId: doc.documentId, passed: false, reasonCodes, limitationCodes };
  }

  switch (doc.sourceType) {
    case 'DOCTOR_STRUCTURED_ENTRY':
    case 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION':
      return { documentId: doc.documentId, passed: true, reasonCodes, limitationCodes };
    case 'DIGITAL_STRUCTURED_REPORT': {
      const score = doc.documentIntegrityScore;
      if (score == null || score < TIER2_DOC_MIN) {
        reasonCodes.push('D08_DOCUMENT_GATE_FAILED');
        return { documentId: doc.documentId, passed: false, reasonCodes, limitationCodes };
      }
      return { documentId: doc.documentId, passed: true, reasonCodes, limitationCodes };
    }
    case 'OCR_EXTRACTED_DOCUMENT_IMAGE': {
      const score = doc.documentReadabilityScore;
      if (score == null || score < TIER3_DOC_MIN) {
        reasonCodes.push('D08_DOCUMENT_GATE_FAILED');
        return { documentId: doc.documentId, passed: false, reasonCodes, limitationCodes };
      }
      return { documentId: doc.documentId, passed: true, reasonCodes, limitationCodes };
    }
    case 'DOCTOR_FREE_TEXT_NLP_EXTRACTION':
    case 'DATASET_TAXONOMY_ALIGNMENT':
      return { documentId: doc.documentId, passed: true, reasonCodes, limitationCodes };
    default:
      reasonCodes.push('UNKNOWN_SOURCE_TYPE');
      return { documentId: doc.documentId, passed: false, reasonCodes, limitationCodes };
  }
}
