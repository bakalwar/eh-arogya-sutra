import { RULE4_FORBIDDEN_SELECTOR_INPUT_FIELDS } from '../version.js';
import type { Rule4EvidenceAdapterInput, Rule4QuarantineProbe } from './types.js';

export type Rule4QuarantineResult = {
  blocked: boolean;
  reasonCodes: string[];
};

const QUARANTINE_KEYS = new Set<string>([
  ...RULE4_FORBIDDEN_SELECTOR_INPUT_FIELDS,
  'registryNearestMatch',
  'raw_ocr_text',
  'rawOcrText',
  'keyword_selector',
  'keywordSelector',
  'registry_potency_logic',
  'nearest_match_pathology',
  'nearestMatchPathology',
  'clinical_photo_inference',
  'clinicalPhotoInference',
]);

/**
 * Quarantine semantics (Phase 3):
 * - Top-level forbidden Rule 4 orchestrator fields still fail-closed via validateRule4InputContract.
 * - `quarantineProbe` is audit-only: records blocked selector *attempts*; does not destroy independently
 *   valid structured evidence items in the adapter pipeline.
 * - Prohibited global-text paths must never become selector authority.
 */
export function evaluateQuarantineProbe(
  probe: Rule4QuarantineProbe | undefined,
): Rule4QuarantineResult {
  if (!probe) {
    return { blocked: false, reasonCodes: [] };
  }
  const reasonCodes: string[] = [];
  for (const key of Object.keys(probe)) {
    if (!QUARANTINE_KEYS.has(key)) {
      continue;
    }
    if (probe[key as keyof Rule4QuarantineProbe] !== true) {
      continue;
    }
    if (key === 'global_text' || key === 'globalText') {
      reasonCodes.push('GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED');
    } else if (key === 'sys_text_full' || key === 'sysTextFull') {
      reasonCodes.push('GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED');
    } else if (
      key === 'registry_nearest_match' ||
      key === 'registryNearestMatch' ||
      key === 'nearest_match_pathology'
    ) {
      reasonCodes.push('REGISTRY_Q16_SELECTOR_BLOCKED');
    } else if (key === 'disease_keyword') {
      reasonCodes.push('REPORT_KEYWORD_SELECTOR_BLOCKED');
    } else if (key === 'potency_logic' || key === 'registry_potency_logic') {
      reasonCodes.push('REGISTRY_POTENCY_SELECTOR_NOT_EXECUTABLE');
    } else if (key === 'raw_ocr_text' || key === 'rawOcrText') {
      reasonCodes.push('REPORT_KEYWORD_SELECTOR_BLOCKED');
    } else {
      reasonCodes.push('REGISTRY_Q16_SELECTOR_BLOCKED');
    }
  }
  return { blocked: reasonCodes.length > 0, reasonCodes: [...new Set(reasonCodes)] };
}

export function validateQuarantineProbeShape(probe: Rule4QuarantineProbe | undefined): void {
  if (!probe) {
    return;
  }
  for (const [key, val] of Object.entries(probe)) {
    if (!QUARANTINE_KEYS.has(key)) {
      throw new Error('RULE4_QUARANTINE_PROBE_KEY_NOT_ALLOWED');
    }
    if (typeof val !== 'boolean') {
      throw new Error('RULE4_QUARANTINE_PROBE_VALUE_MUST_BE_BOOLEAN');
    }
  }
}

export function assertEvidenceAdapterInputFreeOfPhiText(input: Rule4EvidenceAdapterInput): void {
  const forbiddenPatterns = ['patient_name', 'phone', 'address', 'raw_report_text'];
  const json = JSON.stringify(input);
  for (const pat of forbiddenPatterns) {
    if (json.includes(`"${pat}"`)) {
      throw new Error('RULE4_EVIDENCE_PHI_FIELD_PROHIBITED');
    }
  }
}
