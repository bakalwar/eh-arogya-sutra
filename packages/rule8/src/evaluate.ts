import {
  RULE8_INDICATION_KEY_ORDER,
  RULE8_OUTPUT_KEY_ORDER,
  RULE8_REASON_CODES,
  RULE8_SYNTHETIC_TEST_CLASSIFICATION,
  type Rule8Outcome,
  type Rule8Rule1ComparisonState,
} from './constants.js';
import { Rule8EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import type { Rule8Input, Rule8Output, Rule8PrakritiIndication } from './types.js';
import { isActivatingPrakritiEvidence, validateRule8Input } from './validateInput.js';
import {
  RULE8_OUTPUT_CONTRACT_VERSION,
  RULE8_RULE_IDENTITY,
  RULE8_RULE_NUMBER,
} from './version.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildOrderedOutput(partial: Rule8Output): Rule8Output {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE8_OUTPUT_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule8Output);
}

/** Exact six-field indication shape (§6.2 key order). */
function buildIndication(partial: Rule8PrakritiIndication): Rule8PrakritiIndication {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE8_INDICATION_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return Object.freeze(ordered as unknown as Rule8PrakritiIndication);
}

function fingerprint(parts: readonly string[]): string {
  return `r8:${parts.join('|')}`;
}

function deriveRule1ComparisonState(input: Rule8Input): Rule8Rule1ComparisonState {
  const ref = input.rule1TemperamentRef;
  if (ref.status === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (ref.status === 'CONFLICT' || ref.status === 'CONTRADICTORY') return 'CONFLICT';
  if (ref.status === 'UNRESOLVED') return 'UNRESOLVED';
  if (ref.status === 'CONSISTENT') return 'CONSISTENT';
  // No owner reconciliation policy — presence alone does not merge or invent consistency.
  return 'NOT_COMPARED';
}

function emptyShadowBase(
  input: Rule8Input,
  status: Rule8Outcome,
  applicability: string,
  diseases: readonly string[],
  rule1ComparisonState: Rule8Rule1ComparisonState,
  reasonCodes: readonly string[],
  blockers: readonly string[] = [],
): Rule8Output {
  return buildOrderedOutput({
    contractVersion: RULE8_OUTPUT_CONTRACT_VERSION,
    ruleNumber: RULE8_RULE_NUMBER,
    ruleIdentity: RULE8_RULE_IDENTITY,
    requestId: input.requestId,
    status,
    applicability,
    evaluatedDiseaseRefs: Object.freeze([...diseases]),
    prakritiIndications: Object.freeze([]),
    notClinicallyIndicated: status === 'NOT_CLINICALLY_INDICATED',
    rule1ComparisonState,
    evidenceRefs: Object.freeze([]),
    reasonCodes: Object.freeze(sortedUnique(reasonCodes)),
    blockersOrUnresolvedEvidence: Object.freeze(sortedUnique(blockers)),
    deterministicFingerprint: fingerprint([
      input.requestId,
      status,
      rule1ComparisonState,
      ...diseases,
    ]),
    shadowOnly: true,
    clinicalActivation: 'NONE',
    medicineSelectionInfluence: 'NONE',
    notRequiredForPrescription: true,
  });
}

/**
 * Shadow-only Rule 8 evaluator. Outcomes align with contract §6.3 closed vocabulary.
 * Does not invent clinical disease→prakriti meanings; only processes explicitly supplied
 * synthetic evidence that passes conjunctive gates. Never influences medicine or Rx.
 */
export function evaluateRule8Shadow(raw: unknown): Rule8Output {
  try {
    const input = validateRule8Input(raw);
    const diseases = sortedUnique(input.diseaseConditionRefs);
    const diseaseSet = new Set(diseases);
    const rule1ComparisonState = deriveRule1ComparisonState(input);

    // §6.3 precedence 1
    if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
      return emptyShadowBase(
        input,
        'NOT_APPLICABLE',
        'NOT_APPLICABLE',
        diseases,
        rule1ComparisonState,
        [RULE8_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
        [RULE8_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
      );
    }

    // §6.3 precedence 3 — Rule 1 conflict fail-closed (no merge / no positive)
    if (rule1ComparisonState === 'CONFLICT') {
      return emptyShadowBase(
        input,
        'BLOCKED_BY_RULE1_CONTRADICTION',
        input.upstreamApplicability.status === 'NOT_EVALUABLE' ? 'NOT_EVALUABLE' : 'APPLICABLE',
        diseases,
        'CONFLICT',
        [RULE8_REASON_CODES.RULE1_CONFLICT],
        [RULE8_REASON_CODES.RULE1_CONFLICT],
      );
    }

    if (input.upstreamApplicability.status === 'NOT_EVALUABLE') {
      return emptyShadowBase(
        input,
        'NOT_EVALUABLE',
        'NOT_EVALUABLE',
        diseases,
        rule1ComparisonState,
        [
          RULE8_REASON_CODES.UPSTREAM_NOT_EVALUABLE,
          rule1ComparisonState === 'UNAVAILABLE'
            ? RULE8_REASON_CODES.RULE1_UNAVAILABLE
            : RULE8_REASON_CODES.RULE1_NOT_COMPARED,
        ],
        [RULE8_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
      );
    }

    const indications: Rule8PrakritiIndication[] = [];
    const evidenceRefs: string[] = [];
    const reasonCodes: string[] = [];
    const blockers: string[] = [];
    let unresolved = false;
    let hasInsufficient = false;
    let hasMissingEvidence = false;
    let sawNonActivating = false;

    if (rule1ComparisonState === 'UNAVAILABLE') {
      reasonCodes.push(RULE8_REASON_CODES.RULE1_UNAVAILABLE);
    } else if (rule1ComparisonState === 'NOT_COMPARED') {
      reasonCodes.push(RULE8_REASON_CODES.RULE1_NOT_COMPARED);
    }

    const entries = [...input.prakritiEvidenceRegistry.entries].sort((a, b) =>
      a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0,
    );

    for (const entry of entries) {
      if (!diseaseSet.has(entry.diseaseConditionRef)) {
        reasonCodes.push(RULE8_REASON_CODES.DISEASE_MISMATCH);
        continue;
      }

      if (entry.contradictionMarkers.length > 0) {
        unresolved = true;
        blockers.push(RULE8_REASON_CODES.CONTRADICTORY_EVIDENCE);
        reasonCodes.push(RULE8_REASON_CODES.CONTRADICTORY_EVIDENCE);
        continue;
      }

      if (entry.effectiveStatus === 'missing-evidence') {
        hasMissingEvidence = true;
        reasonCodes.push(RULE8_REASON_CODES.EVIDENCE_MISSING);
        continue;
      }

      if (
        entry.applicabilityConditions.length > 0 &&
        !entry.applicabilityConditions.every((c) => diseaseSet.has(c))
      ) {
        // Applicability conditions that are not satisfied → insufficient, not inventing match.
        hasInsufficient = true;
        reasonCodes.push(RULE8_REASON_CODES.EVIDENCE_INSUFFICIENT);
        continue;
      }

      if (!isActivatingPrakritiEvidence(entry)) {
        sawNonActivating = true;
        if (entry.testClassification !== RULE8_SYNTHETIC_TEST_CLASSIFICATION) {
          reasonCodes.push(RULE8_REASON_CODES.NON_SYNTHETIC_CLASSIFICATION);
        } else {
          reasonCodes.push(RULE8_REASON_CODES.EVIDENCE_NON_ACTIVATING);
        }
        continue;
      }

      const priorSameDisease = indications.find(
        (i) => i.diseaseConditionRef === entry.diseaseConditionRef,
      );
      if (priorSameDisease) {
        if (priorSameDisease.prakritiCategoryRef !== entry.prakritiCategoryRef) {
          unresolved = true;
          blockers.push(RULE8_REASON_CODES.CONTRADICTORY_EVIDENCE);
          reasonCodes.push(RULE8_REASON_CODES.CONTRADICTORY_EVIDENCE);
        }
        // Identical disease+prakriti duplicate activating row: skip without inventing a tie-break.
        continue;
      }

      evidenceRefs.push(entry.evidenceSourceId);
      reasonCodes.push(RULE8_REASON_CODES.ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE);
      indications.push(
        buildIndication({
          indicationId: `IND_${entry.entryId}`,
          diseaseConditionRef: entry.diseaseConditionRef,
          prakritiCategoryRef: entry.prakritiCategoryRef,
          eligibilityState: 'ELIGIBLE',
          evidenceRefs: Object.freeze([entry.evidenceSourceId]),
          reasonCodes: Object.freeze([RULE8_REASON_CODES.ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE]),
        }),
      );
    }

    indications.sort((a, b) =>
      a.indicationId < b.indicationId ? -1 : a.indicationId > b.indicationId ? 1 : 0,
    );

    // §6.3 precedence 4–7
    let status: Rule8Outcome;
    if (unresolved) {
      status = 'UNRESOLVED_EVIDENCE';
      indications.length = 0;
      evidenceRefs.length = 0;
    } else if (indications.length > 0) {
      status = 'SHADOW_PRAKRUTI_INDICATIONS_PROPOSED';
    } else if (hasMissingEvidence && !sawNonActivating && entries.length > 0) {
      status = 'NOT_EVALUABLE';
      reasonCodes.push(RULE8_REASON_CODES.EVIDENCE_MISSING);
    } else if (hasInsufficient && !sawNonActivating && entries.length > 0 && !hasMissingEvidence) {
      status = 'NOT_EVALUABLE';
      reasonCodes.push(RULE8_REASON_CODES.EVIDENCE_INSUFFICIENT);
    } else {
      status = 'NOT_CLINICALLY_INDICATED';
      reasonCodes.push(RULE8_REASON_CODES.NOT_CLINICALLY_INDICATED);
    }

    const uniqueReasons = sortedUnique(reasonCodes);
    const uniqueEvidence = sortedUnique(evidenceRefs);
    const uniqueBlockers = sortedUnique(blockers);

    return buildOrderedOutput({
      contractVersion: RULE8_OUTPUT_CONTRACT_VERSION,
      ruleNumber: RULE8_RULE_NUMBER,
      ruleIdentity: RULE8_RULE_IDENTITY,
      requestId: input.requestId,
      status,
      applicability: 'APPLICABLE',
      evaluatedDiseaseRefs: Object.freeze(diseases),
      prakritiIndications: Object.freeze(
        status === 'SHADOW_PRAKRUTI_INDICATIONS_PROPOSED' ? indications : [],
      ),
      notClinicallyIndicated: status === 'NOT_CLINICALLY_INDICATED',
      rule1ComparisonState,
      evidenceRefs: Object.freeze(
        status === 'SHADOW_PRAKRUTI_INDICATIONS_PROPOSED' ? uniqueEvidence : [],
      ),
      reasonCodes: Object.freeze(uniqueReasons),
      blockersOrUnresolvedEvidence: Object.freeze(uniqueBlockers),
      deterministicFingerprint: fingerprint([
        input.requestId,
        status,
        rule1ComparisonState,
        ...diseases,
        ...(status === 'SHADOW_PRAKRUTI_INDICATIONS_PROPOSED'
          ? indications.map((i) => i.indicationId)
          : []),
        ...(status === 'SHADOW_PRAKRUTI_INDICATIONS_PROPOSED' ? uniqueEvidence : []),
      ]),
      shadowOnly: true,
      clinicalActivation: 'NONE',
      medicineSelectionInfluence: 'NONE',
      notRequiredForPrescription: true,
    });
  } catch (e) {
    if (e instanceof Rule8EvaluationError) throw e;
    throw new Rule8EvaluationError('INTERNAL_FAILURE');
  }
}
