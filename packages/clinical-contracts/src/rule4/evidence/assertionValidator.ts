import type { Rule4AssertionStatus, Rule4EvidenceItemEnvelope } from './types.js';

export type Rule4AssertionValidationResult = {
  selectorEligible: boolean;
  reasonCodes: string[];
  limitationCodes: string[];
};

const POSITIVE_ASSERTIONS = new Set<Rule4AssertionStatus>(['PRESENT', 'POSITIVE']);

export function validateAssertionStatus(
  assertionStatus: Rule4AssertionStatus,
): Rule4AssertionValidationResult {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = [];

  if (POSITIVE_ASSERTIONS.has(assertionStatus)) {
    return { selectorEligible: true, reasonCodes, limitationCodes };
  }
  if (assertionStatus === 'NEGATED' || assertionStatus === 'RULE_OUT') {
    reasonCodes.push('NEGATED_ASSERTION_EXCLUDED');
    return { selectorEligible: false, reasonCodes, limitationCodes };
  }
  if (assertionStatus === 'SUSPECTED') {
    reasonCodes.push('SUSPECTED_ASSERTION_EXCLUDED');
    return { selectorEligible: false, reasonCodes, limitationCodes };
  }
  if (assertionStatus === 'HISTORICAL_ONLY') {
    reasonCodes.push('HISTORICAL_ONLY_EXCLUDED');
    return { selectorEligible: false, reasonCodes, limitationCodes };
  }
  if (assertionStatus === 'RESOLVED') {
    reasonCodes.push('HISTORICAL_ONLY_EXCLUDED');
    return { selectorEligible: false, reasonCodes, limitationCodes };
  }
  reasonCodes.push('AMBIGUOUS_ASSERTION_EXCLUDED');
  return { selectorEligible: false, reasonCodes, limitationCodes };
}

export function validateMandatoryItemFields(item: Rule4EvidenceItemEnvelope): string[] {
  const missing: string[] = [];
  const required: (keyof Rule4EvidenceItemEnvelope)[] = [
    'findingId',
    'documentId',
    'parentSourceId',
    'sourceType',
    'sourceReference',
    'timestampOrCaseContext',
    'formulaSlotId',
    'formulaTargetId',
    'targetOrganSystem',
    'anatomicalSite',
    'targetPathologyId',
    'assertionStatus',
    'verificationStatus',
    'formulaRelevance',
  ];
  for (const key of required) {
    const val = item[key];
    if (val === undefined || val === null || val === '') {
      missing.push(key);
    }
  }
  if (item.confidenceScore == null || Number.isNaN(item.confidenceScore)) {
    missing.push('confidenceScore');
  }
  if (item.requiresInterpretationFields) {
    if (item.value == null || item.value === '') {
      missing.push('value');
    }
    if (!item.unit) {
      missing.push('unit');
    }
  }
  return missing;
}

export function evaluateD04Usability(
  item: Rule4EvidenceItemEnvelope,
  itemGatePassed: boolean,
  bindingPassed: boolean,
): { usable: boolean; reasonCodes: string[]; limitationCodes: string[] } {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = [];

  const missing = validateMandatoryItemFields(item);
  if (missing.length > 0) {
    reasonCodes.push('MISSING_MANDATORY_BINDING_FIELD');
    return { usable: false, reasonCodes, limitationCodes };
  }

  if (!itemGatePassed) {
    reasonCodes.push('ITEM_BELOW_CONFIDENCE_THRESHOLD');
    return { usable: false, reasonCodes, limitationCodes };
  }

  const assertion = validateAssertionStatus(item.assertionStatus);
  if (!assertion.selectorEligible) {
    reasonCodes.push(...assertion.reasonCodes);
    return { usable: false, reasonCodes, limitationCodes };
  }

  if (item.verificationStatus !== 'SUPPORTED' && item.verificationStatus !== 'VERIFIED') {
    reasonCodes.push('INVALID_NOT_USABLE');
    return { usable: false, reasonCodes, limitationCodes };
  }

  if (item.formulaRelevance !== 'DIRECT') {
    if (item.sourceType === 'DATASET_TAXONOMY_ALIGNMENT') {
      reasonCodes.push('DATASET_TAXONOMY_SUPPORTING_ONLY');
    } else {
      reasonCodes.push('FORMULA_RELEVANCE_NOT_DIRECT');
    }
    return { usable: false, reasonCodes, limitationCodes };
  }

  if (!bindingPassed) {
    return { usable: false, reasonCodes, limitationCodes };
  }

  if (item.sourceType === 'DATASET_TAXONOMY_ALIGNMENT') {
    reasonCodes.push('DATASET_TAXONOMY_SUPPORTING_ONLY');
    limitationCodes.push('DATASET_TAXONOMY_SUPPORTING_ONLY');
    return { usable: false, reasonCodes, limitationCodes };
  }

  return { usable: true, reasonCodes, limitationCodes };
}
