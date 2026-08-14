import {
  RULE1_BP_LYMPHATIC_SUPPORT,
  RULE1_BP_LYMPHATIC_SYSTOLIC_MAX_EXCLUSIVE,
  RULE1_BP_SANGUINE_SUPPORT,
  RULE1_BP_SANGUINE_SYSTOLIC_MIN,
  RULE1_BLOCKING_LIFECYCLE,
  RULE1_OUTPUT_KEY_ORDER,
  RULE1_REASON_CODES,
  RULE1_SYNTHETIC_TEST_CLASSIFICATION,
  type Rule1Outcome,
  type Rule1ResolutionState,
  type Rule1Rule8ComparisonState,
  type Rule1TemperamentToken,
} from './constants.js';
import { Rule1EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import type { Rule1DoshaMapping, Rule1Input, Rule1Output } from './types.js';
import { isActivatingTemperamentEvidence, validateRule1Input } from './validateInput.js';
import {
  RULE1_OUTPUT_CONTRACT_VERSION,
  RULE1_RULE_IDENTITY,
  RULE1_RULE_NUMBER,
} from './version.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildOrderedOutput(partial: Rule1Output): Rule1Output {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE1_OUTPUT_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule1Output);
}

function fingerprint(parts: readonly string[]): string {
  return `r1:${parts.join('|')}`;
}

function deriveRule8ComparisonState(input: Rule1Input): Rule1Rule8ComparisonState {
  const ref = input.rule8ComparisonRef;
  if (ref.status === 'NOT_SUPPLIED') return 'NOT_SUPPLIED';
  if (ref.status === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (ref.status === 'CONFLICT') return 'CONFLICT';
  if (ref.status === 'UNRESOLVED') return 'UNRESOLVED';
  if (ref.status === 'CONSISTENT') return 'CONSISTENT';
  return 'NOT_COMPARED';
}

function doshaFor(
  token: Rule1TemperamentToken | null,
  mixed: readonly Rule1TemperamentToken[],
): Rule1DoshaMapping | null {
  if (token === null && mixed.length === 0) return null;
  if (token === 'UNKNOWN') {
    return { doshaPrimary: null, doshaSecondary: null, doshaClassification: 'UNKNOWN' };
  }
  if (token === 'MIXED' || mixed.length >= 2) {
    const n = mixed.length >= 2 ? mixed.length : 2;
    return {
      doshaPrimary: null,
      doshaSecondary: null,
      doshaClassification: n >= 3 ? 'TRIDOSHAJA' : 'DWANDVAJA',
    };
  }
  if (token === 'LYMPHATIC') {
    return { doshaPrimary: 'KAPHA', doshaSecondary: null, doshaClassification: null };
  }
  if (token === 'SANGUINE') {
    return { doshaPrimary: 'PITTA', doshaSecondary: null, doshaClassification: null };
  }
  if (token === 'NERVOUS') {
    return { doshaPrimary: 'VATA', doshaSecondary: null, doshaClassification: null };
  }
  if (token === 'BILIOUS_HEPATIC') {
    return { doshaPrimary: 'PITTA', doshaSecondary: 'UNRESOLVED', doshaClassification: null };
  }
  return null;
}

function baseOutput(
  input: Rule1Input,
  status: Rule1Outcome,
  applicability: string,
  rule8ComparisonState: Rule1Rule8ComparisonState,
  resolutionState: Rule1ResolutionState,
  primary: Rule1TemperamentToken | null,
  secondary: Rule1TemperamentToken | null,
  mixed: readonly Rule1TemperamentToken[],
  gaps: readonly string[],
  reasonCodes: readonly string[],
  blockers: readonly string[],
): Rule1Output {
  return buildOrderedOutput({
    contractVersion: RULE1_OUTPUT_CONTRACT_VERSION,
    ruleNumber: RULE1_RULE_NUMBER,
    ruleIdentity: RULE1_RULE_IDENTITY,
    requestId: input.requestId,
    status,
    applicability,
    primaryTemperament: primary,
    secondaryTemperament: secondary,
    mixedComponents: Object.freeze([...mixed]),
    resolutionState,
    doshaMapping: deepFreeze(doshaFor(primary, mixed)),
    evidenceGaps: Object.freeze([...gaps]),
    reasonCodes: Object.freeze(sortedUnique(reasonCodes)),
    blockersOrUnresolvedEvidence: Object.freeze(sortedUnique(blockers)),
    rule8ComparisonState,
    deterministicFingerprint: fingerprint([
      input.requestId,
      status,
      resolutionState,
      rule8ComparisonState,
      primary ?? 'null',
      ...mixed,
    ]),
    shadowOnly: true,
    clinicalActivation: 'NONE',
    medicineSelectionInfluence: 'NONE',
    prescriptionEffect: 'NONE',
  });
}

/**
 * Shadow-only Rule 1 Temperament Engine evaluator.
 * Empty production registry; synthetic activating evidence only; no medicine/Rx influence.
 */
export function evaluateRule1Shadow(raw: unknown): Rule1Output {
  try {
    const input = validateRule1Input(raw);
    const rule8ComparisonState = deriveRule8ComparisonState(input);

    if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
      return baseOutput(
        input,
        'NOT_APPLICABLE',
        'NOT_APPLICABLE',
        rule8ComparisonState,
        'NOT_EVALUABLE',
        null,
        null,
        [],
        ['upstream_not_applicable'],
        [RULE1_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
        [RULE1_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
      );
    }

    if (input.upstreamApplicability.status === 'NOT_EVALUABLE') {
      return baseOutput(
        input,
        'NOT_EVALUABLE',
        'NOT_EVALUABLE',
        rule8ComparisonState,
        'NOT_EVALUABLE',
        null,
        null,
        [],
        ['upstream_not_evaluable'],
        [RULE1_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
        [RULE1_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
      );
    }

    const entries = [...input.caseTemperamentEvidenceRegistry.entries].sort((a, b) =>
      a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0,
    );

    const reasonCodes: string[] = [];
    const blockers: string[] = [];
    const gaps: string[] = [];
    let unresolvedContradiction = false;
    let sawBlockingLifecycle = false;
    let sawForbidden = false;

    if (rule8ComparisonState === 'NOT_SUPPLIED') {
      reasonCodes.push(RULE1_REASON_CODES.RULE8_NOT_SUPPLIED);
    }
    reasonCodes.push(RULE1_REASON_CODES.NO_QUESTION_BANK);

    for (const entry of entries) {
      if (entry.contradictionMarkers.length > 0) {
        unresolvedContradiction = true;
        blockers.push(RULE1_REASON_CODES.CONTRADICTORY_EVIDENCE);
        reasonCodes.push(RULE1_REASON_CODES.CONTRADICTORY_EVIDENCE);
      }
      if ((RULE1_BLOCKING_LIFECYCLE as readonly string[]).includes(entry.effectiveStatus)) {
        sawBlockingLifecycle = true;
        reasonCodes.push(RULE1_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE);
      }
      if (
        entry.testClassification !== RULE1_SYNTHETIC_TEST_CLASSIFICATION &&
        entry.effectiveStatus === 'APPROVED_AND_ACTIVE'
      ) {
        // Non-synthetic cannot activate under empty production registry / current stage.
        sawForbidden = true;
        reasonCodes.push(RULE1_REASON_CODES.FORBIDDEN_EVIDENCE_SOURCE);
      }
    }

    // Precedence §11: forbidden → stale/lifecycle → contradictory → Rule 8 CONFLICT.
    if (sawForbidden) {
      return baseOutput(
        input,
        'NOT_EVALUABLE',
        'APPLICABLE',
        rule8ComparisonState,
        'NOT_EVALUABLE',
        null,
        null,
        [],
        ['forbidden_or_non_synthetic_source'],
        reasonCodes,
        [RULE1_REASON_CODES.FORBIDDEN_EVIDENCE_SOURCE],
      );
    }

    if (sawBlockingLifecycle && entries.every((e) => !isActivatingTemperamentEvidence(e))) {
      // Stale/disputed/superseded etc. with no activating synthetic rows.
      const hasStaleLike = entries.some(
        (e) =>
          e.effectiveStatus === 'STALE' ||
          e.effectiveStatus === 'DISPUTED' ||
          e.effectiveStatus === 'SUPERSEDED',
      );
      if (hasStaleLike) {
        return baseOutput(
          input,
          'UNRESOLVED_EVIDENCE',
          'APPLICABLE',
          rule8ComparisonState,
          'UNRESOLVED_EVIDENCE',
          null,
          null,
          [],
          ['blocking_lifecycle'],
          reasonCodes,
          [RULE1_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE],
        );
      }
    }

    if (unresolvedContradiction) {
      return baseOutput(
        input,
        'UNRESOLVED_EVIDENCE',
        'APPLICABLE',
        rule8ComparisonState,
        'UNRESOLVED_EVIDENCE',
        null,
        null,
        [],
        ['contradictory_evidence'],
        reasonCodes,
        blockers,
      );
    }

    if (rule8ComparisonState === 'CONFLICT') {
      return baseOutput(
        input,
        'BLOCKED_BY_RULE8_CONTRADICTION',
        'APPLICABLE',
        'CONFLICT',
        'UNRESOLVED_EVIDENCE',
        null,
        null,
        [],
        ['rule8_conflict'],
        [...reasonCodes, RULE1_REASON_CODES.RULE8_CONFLICT],
        [RULE1_REASON_CODES.RULE8_CONFLICT],
      );
    }

    const scores = new Map<Rule1TemperamentToken, number>();
    const addScore = (token: Rule1TemperamentToken, units: number): void => {
      if (token === 'UNKNOWN' || token === 'MIXED') return;
      scores.set(token, (scores.get(token) ?? 0) + units);
    };

    let activatingNonBp = 0;
    const activatingRefs: string[] = [];

    for (const entry of entries) {
      if (!isActivatingTemperamentEvidence(entry)) {
        if (entry.testClassification === RULE1_SYNTHETIC_TEST_CLASSIFICATION) {
          reasonCodes.push(RULE1_REASON_CODES.EVIDENCE_NON_ACTIVATING);
        }
        continue;
      }
      if (entry.evidenceKind === 'BP_SUPPORT' || entry.evidenceKind === 'PHOTO_SUPPORT') {
        // BP/photo support rows in registry are supporting metadata only; scoring uses BP/photo fields.
        continue;
      }
      activatingNonBp += 1;
      addScore(entry.temperamentToken, entry.supportUnits);
      activatingRefs.push(entry.evidenceSourceId);
      reasonCodes.push(RULE1_REASON_CODES.ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE);
    }

    const bp = input.bloodPressureEvidence;
    let bpSupportApplied = false;
    if (bp.status === 'SUPPLIED') {
      if (bp.systolicMmHg >= RULE1_BP_SANGUINE_SYSTOLIC_MIN) {
        addScore('SANGUINE', RULE1_BP_SANGUINE_SUPPORT);
        bpSupportApplied = true;
      } else if (bp.systolicMmHg < RULE1_BP_LYMPHATIC_SYSTOLIC_MAX_EXCLUSIVE) {
        addScore('LYMPHATIC', RULE1_BP_LYMPHATIC_SUPPORT);
        bpSupportApplied = true;
      }
    }

    const photoSupplied = input.photoEvidenceRef.status === 'SUPPLIED';

    // No evidence at all
    if (activatingNonBp === 0 && !bpSupportApplied && !photoSupplied && entries.length === 0) {
      gaps.push('insufficient_clinical_evidence');
      return baseOutput(
        input,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'APPLICABLE',
        rule8ComparisonState,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'UNKNOWN',
        null,
        [],
        gaps,
        [
          ...reasonCodes,
          RULE1_REASON_CODES.NO_EVIDENCE,
          RULE1_REASON_CODES.ADDITIONAL_INFORMATION_REQUIRED,
        ],
        [],
      );
    }

    // BP alone insufficient
    if (activatingNonBp === 0 && bpSupportApplied && !photoSupplied) {
      gaps.push('bp_alone_insufficient');
      return baseOutput(
        input,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'APPLICABLE',
        rule8ComparisonState,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'UNKNOWN',
        null,
        [],
        gaps,
        [
          ...reasonCodes,
          RULE1_REASON_CODES.BP_ALONE_INSUFFICIENT,
          RULE1_REASON_CODES.ADDITIONAL_INFORMATION_REQUIRED,
        ],
        [],
      );
    }

    // Photo alone insufficient (no non-BP activating + no BP resolve path)
    if (activatingNonBp === 0 && photoSupplied && !bpSupportApplied) {
      gaps.push('photo_alone_insufficient');
      return baseOutput(
        input,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'APPLICABLE',
        rule8ComparisonState,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'UNKNOWN',
        null,
        [],
        gaps,
        [
          ...reasonCodes,
          RULE1_REASON_CODES.PHOTO_ALONE_INSUFFICIENT,
          RULE1_REASON_CODES.ADDITIONAL_INFORMATION_REQUIRED,
        ],
        [],
      );
    }

    // Photo + BP without non-BP clinical evidence still cannot resolve
    if (activatingNonBp === 0 && photoSupplied && bpSupportApplied) {
      gaps.push('bp_and_photo_without_non_bp_evidence');
      return baseOutput(
        input,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'APPLICABLE',
        rule8ComparisonState,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'UNKNOWN',
        null,
        [],
        gaps,
        [
          ...reasonCodes,
          RULE1_REASON_CODES.BP_ALONE_INSUFFICIENT,
          RULE1_REASON_CODES.PHOTO_ALONE_INSUFFICIENT,
          RULE1_REASON_CODES.ADDITIONAL_INFORMATION_REQUIRED,
        ],
        [],
      );
    }

    if (activatingNonBp === 0) {
      gaps.push('insufficient_clinical_evidence');
      return baseOutput(
        input,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'APPLICABLE',
        rule8ComparisonState,
        'ADDITIONAL_INFORMATION_REQUIRED',
        'UNKNOWN',
        null,
        [],
        gaps,
        [
          ...reasonCodes,
          RULE1_REASON_CODES.NO_EVIDENCE,
          RULE1_REASON_CODES.ADDITIONAL_INFORMATION_REQUIRED,
        ],
        [],
      );
    }

    const scored = [...scores.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    });

    if (scored.length === 0) {
      return baseOutput(
        input,
        'NOT_EVALUABLE',
        'APPLICABLE',
        rule8ComparisonState,
        'NOT_EVALUABLE',
        null,
        null,
        [],
        ['no_scored_temperament'],
        reasonCodes,
        [],
      );
    }

    const topScore = scored[0]![1];
    const tied = scored.filter(([, s]) => s === topScore).map(([t]) => t);

    if (tied.length >= 2) {
      return baseOutput(
        input,
        'UNRESOLVED_TIE',
        'APPLICABLE',
        rule8ComparisonState,
        'UNRESOLVED_TIE',
        null,
        null,
        tied,
        ['exact_equal_tie'],
        [...reasonCodes, RULE1_REASON_CODES.UNRESOLVED_TIE],
        [RULE1_REASON_CODES.UNRESOLVED_TIE],
      );
    }

    const winner = tied[0]!;

    // Owner-clarification pending: Bilious secondary-dosha remains unresolved — fail-closed, no guess.
    if (winner === 'BILIOUS_HEPATIC') {
      return baseOutput(
        input,
        'UNRESOLVED_EVIDENCE',
        'APPLICABLE',
        rule8ComparisonState,
        'UNRESOLVED_EVIDENCE',
        null,
        null,
        [],
        ['bilious_secondary_unresolved'],
        [...reasonCodes, RULE1_REASON_CODES.BILIOUS_SECONDARY_UNRESOLVED],
        [RULE1_REASON_CODES.BILIOUS_SECONDARY_UNRESOLVED],
      );
    }

    const secondaryCandidates = scored.filter(([t, s]) => t !== winner && s > 0);
    const secondary = secondaryCandidates.length === 1 ? secondaryCandidates[0]![0] : null;

    return baseOutput(
      input,
      'SHADOW_TEMPERAMENT_INDICATION_PROPOSED',
      'APPLICABLE',
      rule8ComparisonState,
      'OK',
      winner,
      secondary,
      [],
      [],
      reasonCodes,
      [],
    );
  } catch (e) {
    if (e instanceof Rule1EvaluationError) throw e;
    throw new Rule1EvaluationError('INTERNAL_FAILURE');
  }
}
