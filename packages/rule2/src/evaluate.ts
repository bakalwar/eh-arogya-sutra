import {
  RULE2_ANNOTATION_KEY_ORDER,
  RULE2_BLOCKING_LIFECYCLE,
  RULE2_FALLBACK_OWNER_APPROVED_NEUTRAL,
  RULE2_OUTPUT_KEY_ORDER,
  RULE2_REASON_CODES,
  RULE2_SYNTHETIC_TEST_CLASSIFICATION,
  type Rule2DiseasePolarityToken,
  type Rule2Outcome,
  type Rule2ResolutionStatus,
  type Rule2TherapeuticPolarityToken,
} from './constants.js';
import { Rule2EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import type {
  Rule2FormulaSlotAnnotation,
  Rule2Input,
  Rule2Output,
  Rule2OutputCasePolaritySummary,
  Rule2PolarityEvidenceEntry,
} from './types.js';
import { isActivatingPolarityEvidence, validateRule2Input } from './validateInput.js';
import {
  RULE2_OUTPUT_CONTRACT_VERSION,
  RULE2_RULE_IDENTITY,
  RULE2_RULE_NUMBER,
} from './version.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildOrderedAnnotation(partial: Rule2FormulaSlotAnnotation): Rule2FormulaSlotAnnotation {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE2_ANNOTATION_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule2FormulaSlotAnnotation);
}

function buildOrderedOutput(partial: Rule2Output): Rule2Output {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE2_OUTPUT_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule2Output);
}

function fingerprint(parts: readonly string[]): string {
  return `r2:${parts.join('|')}`;
}

function echoCaseSummary(input: Rule2Input): Rule2OutputCasePolaritySummary {
  if (input.casePolaritySummary.status === 'NOT_SUPPLIED') return null;
  return deepFreeze({
    displayOnly: true as const,
    mustNotDriveSelection: true as const,
    headline: input.casePolaritySummary.headline,
  });
}

function therapeuticForDisease(disease: Rule2DiseasePolarityToken): Rule2TherapeuticPolarityToken {
  if (disease === 'POSITIVE') return 'NEGATIVE';
  if (disease === 'NEGATIVE') return 'POSITIVE';
  return 'NEUTRAL';
}

function annotateSlot(
  slotId: string,
  targetId: string,
  recordIndex: number,
  entriesForSlot: readonly Rule2PolarityEvidenceEntry[],
): {
  annotation: Rule2FormulaSlotAnnotation;
  forbidden: boolean;
  contradictory: boolean;
  blockingLifecycle: boolean;
  staleLike: boolean;
  activating: boolean;
} {
  const gaps: string[] = [];
  const reasons: string[] = [];
  let forbidden = false;
  let contradictory = false;
  let blockingLifecycle = false;
  let staleLike = false;

  for (const entry of entriesForSlot) {
    if (entry.contradictionMarkers.length > 0) {
      contradictory = true;
      reasons.push(RULE2_REASON_CODES.CONTRADICTORY_SLOT_EVIDENCE);
    }
    if ((RULE2_BLOCKING_LIFECYCLE as readonly string[]).includes(entry.effectiveStatus)) {
      blockingLifecycle = true;
      reasons.push(RULE2_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE);
      if (
        entry.effectiveStatus === 'STALE' ||
        entry.effectiveStatus === 'DISPUTED' ||
        entry.effectiveStatus === 'SUPERSEDED'
      ) {
        staleLike = true;
      }
    }
    if (
      entry.testClassification !== RULE2_SYNTHETIC_TEST_CLASSIFICATION &&
      entry.effectiveStatus === 'APPROVED_AND_ACTIVE'
    ) {
      forbidden = true;
      reasons.push(RULE2_REASON_CODES.FORBIDDEN_EVIDENCE_SOURCE);
    }
  }

  const activating = entriesForSlot.filter(isActivatingPolarityEvidence);
  const activatingPolarities = new Set(activating.map((e) => e.diseasePolarity));
  if (activatingPolarities.has('POSITIVE') && activatingPolarities.has('NEGATIVE')) {
    contradictory = true;
    reasons.push(RULE2_REASON_CODES.CONTRADICTORY_SLOT_EVIDENCE);
  }

  if (contradictory) {
    return {
      annotation: buildOrderedAnnotation({
        formulaSlotId: slotId,
        formulaTargetId: targetId,
        rule2RecordId: `POL_SYN_REC_${recordIndex}`,
        targetPathologyRef: null,
        diseasePolarity: null,
        requiredTherapeuticPolarity: 'NEUTRAL',
        resolutionStatus: 'CONTRADICTORY',
        fallbackPolicy: null,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze(['slot_contradiction']),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        mutatesMixtures: false,
      }),
      forbidden,
      contradictory: true,
      blockingLifecycle,
      staleLike,
      activating: false,
    };
  }

  if (forbidden) {
    return {
      annotation: buildOrderedAnnotation({
        formulaSlotId: slotId,
        formulaTargetId: targetId,
        rule2RecordId: `POL_SYN_REC_${recordIndex}`,
        targetPathologyRef: null,
        diseasePolarity: null,
        requiredTherapeuticPolarity: 'NEUTRAL',
        resolutionStatus: 'UNRESOLVED',
        fallbackPolicy: RULE2_FALLBACK_OWNER_APPROVED_NEUTRAL,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze(['forbidden_or_non_synthetic_source']),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        mutatesMixtures: false,
      }),
      forbidden: true,
      contradictory: false,
      blockingLifecycle,
      staleLike,
      activating: false,
    };
  }

  if (activating.length === 0) {
    gaps.push('insufficient_slot_polarity_evidence');
    reasons.push(RULE2_REASON_CODES.NO_EVIDENCE);
    reasons.push(RULE2_REASON_CODES.UNRESOLVED_NEUTRAL_FALLBACK);
    if (entriesForSlot.length > 0) {
      reasons.push(RULE2_REASON_CODES.EVIDENCE_NON_ACTIVATING);
    }
    const resolutionStatus: Rule2ResolutionStatus =
      entriesForSlot.length === 0 || blockingLifecycle
        ? 'NEUTRAL_FALLBACK_PENDING_REVIEW'
        : 'UNRESOLVED';
    return {
      annotation: buildOrderedAnnotation({
        formulaSlotId: slotId,
        formulaTargetId: targetId,
        rule2RecordId: `POL_SYN_REC_${recordIndex}`,
        targetPathologyRef: null,
        diseasePolarity: 'UNRESOLVED',
        requiredTherapeuticPolarity: 'NEUTRAL',
        resolutionStatus,
        fallbackPolicy: RULE2_FALLBACK_OWNER_APPROVED_NEUTRAL,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze([...gaps]),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        mutatesMixtures: false,
      }),
      forbidden: false,
      contradictory: false,
      blockingLifecycle,
      staleLike,
      activating: false,
    };
  }

  // Deterministic pick among activating: sort by entryId.
  const chosen = [...activating].sort((a, b) =>
    a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0,
  )[0]!;
  const disease = chosen.diseasePolarity;
  reasons.push(RULE2_REASON_CODES.ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE);

  if (disease === 'MIXED') {
    reasons.push(RULE2_REASON_CODES.MIXED_REQUIRES_DOCTOR_REVIEW);
    return {
      annotation: buildOrderedAnnotation({
        formulaSlotId: slotId,
        formulaTargetId: targetId,
        rule2RecordId: `POL_SYN_REC_${recordIndex}`,
        targetPathologyRef: null,
        diseasePolarity: 'MIXED',
        requiredTherapeuticPolarity: 'NEUTRAL',
        resolutionStatus: 'UNRESOLVED',
        fallbackPolicy: RULE2_FALLBACK_OWNER_APPROVED_NEUTRAL,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze(['mixed_polarity_review_only']),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        mutatesMixtures: false,
      }),
      forbidden: false,
      contradictory: false,
      blockingLifecycle,
      staleLike,
      activating: true,
    };
  }

  if (disease === 'SUPPORT_ONLY') {
    reasons.push(RULE2_REASON_CODES.SUPPORT_ONLY_ANNOTATED);
    return {
      annotation: buildOrderedAnnotation({
        formulaSlotId: slotId,
        formulaTargetId: targetId,
        rule2RecordId: `POL_SYN_REC_${recordIndex}`,
        targetPathologyRef: null,
        diseasePolarity: 'SUPPORT_ONLY',
        requiredTherapeuticPolarity: 'NEUTRAL',
        resolutionStatus: 'RESOLVED_SUPPORT_ROLE',
        fallbackPolicy: null,
        doctorReviewRequired: false,
        evidenceGaps: Object.freeze([]),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        mutatesMixtures: false,
      }),
      forbidden: false,
      contradictory: false,
      blockingLifecycle,
      staleLike,
      activating: true,
    };
  }

  if (disease === 'UNRESOLVED') {
    reasons.push(RULE2_REASON_CODES.UNRESOLVED_NEUTRAL_FALLBACK);
    return {
      annotation: buildOrderedAnnotation({
        formulaSlotId: slotId,
        formulaTargetId: targetId,
        rule2RecordId: `POL_SYN_REC_${recordIndex}`,
        targetPathologyRef: null,
        diseasePolarity: 'UNRESOLVED',
        requiredTherapeuticPolarity: 'NEUTRAL',
        resolutionStatus: 'NEUTRAL_FALLBACK_PENDING_REVIEW',
        fallbackPolicy: RULE2_FALLBACK_OWNER_APPROVED_NEUTRAL,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze(['unresolved_disease_polarity']),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        mutatesMixtures: false,
      }),
      forbidden: false,
      contradictory: false,
      blockingLifecycle,
      staleLike,
      activating: true,
    };
  }

  // POSITIVE / NEGATIVE / NEUTRAL → law of opposites / locked neutral posture
  return {
    annotation: buildOrderedAnnotation({
      formulaSlotId: slotId,
      formulaTargetId: targetId,
      rule2RecordId: `POL_SYN_REC_${recordIndex}`,
      targetPathologyRef: null,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeuticForDisease(disease),
      resolutionStatus: 'RESOLVED',
      fallbackPolicy: null,
      doctorReviewRequired: false,
      evidenceGaps: Object.freeze([]),
      reasonCodes: Object.freeze(sortedUnique(reasons)),
      mutatesMixtures: false,
    }),
    forbidden: false,
    contradictory: false,
    blockingLifecycle,
    staleLike,
    activating: true,
  };
}

function baseOutput(
  input: Rule2Input,
  status: Rule2Outcome,
  applicability: string,
  annotations: readonly Rule2FormulaSlotAnnotation[],
  gaps: readonly string[],
  reasonCodes: readonly string[],
  blockers: readonly string[],
  doctorReviewRequired: boolean,
): Rule2Output {
  const fpParts = [
    input.requestId,
    status,
    ...annotations.map(
      (a) =>
        `${a.formulaSlotId}:${a.diseasePolarity ?? 'null'}:${a.requiredTherapeuticPolarity}:${a.resolutionStatus}`,
    ),
  ];
  return buildOrderedOutput({
    contractVersion: RULE2_OUTPUT_CONTRACT_VERSION,
    ruleNumber: RULE2_RULE_NUMBER,
    ruleIdentity: RULE2_RULE_IDENTITY,
    requestId: input.requestId,
    status,
    applicability,
    formulaSlotAnnotations: Object.freeze([...annotations]),
    casePolaritySummary: echoCaseSummary(input),
    evidenceGaps: Object.freeze([...gaps]),
    reasonCodes: Object.freeze(sortedUnique(reasonCodes)),
    blockersOrUnresolvedEvidence: Object.freeze(sortedUnique(blockers)),
    doctorReviewRequired,
    deterministicFingerprint: fingerprint(fpParts),
    shadowOnly: true,
    formulaMutation: 'NONE',
    medicineSelectionInfluence: 'NONE',
    clinicalActivation: 'NONE',
    prescriptionEffect: 'NONE',
  });
}

/**
 * Shadow-only Rule 2 Polarity Engine evaluator.
 * Empty production registry; synthetic activating evidence only; annotation-only; no medicine/formula/Rx influence.
 */
export function evaluateRule2Shadow(raw: unknown): Rule2Output {
  try {
    const input = validateRule2Input(raw);

    if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
      return baseOutput(
        input,
        'NOT_APPLICABLE',
        'NOT_APPLICABLE',
        [],
        ['upstream_not_applicable'],
        [RULE2_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
        [RULE2_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
        false,
      );
    }

    if (input.upstreamApplicability.status === 'NOT_EVALUABLE') {
      return baseOutput(
        input,
        'NOT_EVALUABLE',
        'NOT_EVALUABLE',
        [],
        ['upstream_not_evaluable'],
        [RULE2_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
        [RULE2_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
        false,
      );
    }

    const reasonCodes: string[] = [RULE2_REASON_CODES.CATALOG_NOT_CREATED];
    if (input.casePolaritySummary.status === 'SUPPLIED') {
      reasonCodes.push(RULE2_REASON_CODES.CASE_SUMMARY_MUST_NOT_DRIVE_SELECTION);
    }
    reasonCodes.push(RULE2_REASON_CODES.SLOT_ORDER_PRESERVED);

    const annotations: Rule2FormulaSlotAnnotation[] = [];
    let anyForbidden = false;
    let anyContradiction = false;
    let anyStaleLike = false;
    let anyBlocking = false;
    let anyActivatingResolved = false;
    let anyDoctorReview = false;
    let anyInsufficient = false;

    let index = 1;
    for (const slot of input.orderedFormulaSlotRefs) {
      const entriesForSlot = input.formulaSlotPolarityEvidenceRegistry.entries.filter(
        (e) => e.formulaSlotId === slot.formulaSlotId,
      );
      const result = annotateSlot(slot.formulaSlotId, slot.formulaTargetId, index, entriesForSlot);
      index += 1;
      annotations.push(result.annotation);
      if (result.forbidden) anyForbidden = true;
      if (result.contradictory) anyContradiction = true;
      if (result.staleLike) anyStaleLike = true;
      if (result.blockingLifecycle) anyBlocking = true;
      if (result.annotation.doctorReviewRequired) anyDoctorReview = true;
      if (
        result.annotation.resolutionStatus === 'RESOLVED' ||
        result.annotation.resolutionStatus === 'RESOLVED_SUPPORT_ROLE'
      ) {
        anyActivatingResolved = true;
      }
      if (
        result.annotation.diseasePolarity === 'UNRESOLVED' &&
        result.annotation.evidenceGaps.includes('insufficient_slot_polarity_evidence')
      ) {
        anyInsufficient = true;
      }
    }

    const aggregateGaps = sortedUnique(annotations.flatMap((a) => [...a.evidenceGaps]));
    const aggregateReasons = sortedUnique([
      ...reasonCodes,
      ...annotations.flatMap((a) => [...a.reasonCodes]),
    ]);

    // Precedence: forbidden → contradiction → stale → insufficient/review → synthetic proposed
    if (anyForbidden) {
      return baseOutput(
        input,
        'NOT_EVALUABLE',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE2_REASON_CODES.FORBIDDEN_EVIDENCE_SOURCE],
        true,
      );
    }

    if (anyContradiction) {
      return baseOutput(
        input,
        'BLOCKED_BY_SLOT_CONTRADICTION',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE2_REASON_CODES.CONTRADICTORY_SLOT_EVIDENCE],
        true,
      );
    }

    if (anyStaleLike && !anyActivatingResolved) {
      return baseOutput(
        input,
        'UNRESOLVED_EVIDENCE',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE2_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE],
        true,
      );
    }

    const allResolvedClean =
      annotations.length > 0 &&
      annotations.every(
        (a) =>
          (a.resolutionStatus === 'RESOLVED' || a.resolutionStatus === 'RESOLVED_SUPPORT_ROLE') &&
          a.doctorReviewRequired === false &&
          a.mutatesMixtures === false,
      );

    if (allResolvedClean) {
      return baseOutput(
        input,
        'SHADOW_POLARITY_ANNOTATIONS_PROPOSED',
        'APPLICABLE',
        annotations,
        [],
        aggregateReasons,
        [],
        false,
      );
    }

    if (anyDoctorReview) {
      const hasMixed = annotations.some((a) => a.diseasePolarity === 'MIXED');
      const onlyInsufficient =
        anyInsufficient &&
        !hasMixed &&
        annotations.every(
          (a) =>
            a.diseasePolarity === 'UNRESOLVED' ||
            a.resolutionStatus === 'NEUTRAL_FALLBACK_PENDING_REVIEW' ||
            a.resolutionStatus === 'UNRESOLVED',
        );
      if (onlyInsufficient && !anyBlocking) {
        return baseOutput(
          input,
          'ADDITIONAL_INFORMATION_REQUIRED',
          'APPLICABLE',
          annotations,
          aggregateGaps,
          [...aggregateReasons, RULE2_REASON_CODES.ADDITIONAL_INFORMATION_REQUIRED],
          [],
          true,
        );
      }
      if (hasMixed || anyDoctorReview) {
        return baseOutput(
          input,
          'DOCTOR_REVIEW_REQUIRED',
          'APPLICABLE',
          annotations,
          aggregateGaps,
          aggregateReasons,
          blockersForReview(annotations),
          true,
        );
      }
    }

    if (anyBlocking) {
      return baseOutput(
        input,
        'UNRESOLVED_EVIDENCE',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE2_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE],
        true,
      );
    }

    return baseOutput(
      input,
      'NOT_EVALUABLE',
      'APPLICABLE',
      annotations,
      aggregateGaps,
      aggregateReasons,
      [],
      anyDoctorReview,
    );
  } catch (e) {
    if (e instanceof Rule2EvaluationError) throw e;
    throw new Rule2EvaluationError('INTERNAL_FAILURE');
  }
}

function blockersForReview(annotations: readonly Rule2FormulaSlotAnnotation[]): string[] {
  const out: string[] = [];
  for (const a of annotations) {
    if (a.diseasePolarity === 'MIXED') out.push(RULE2_REASON_CODES.MIXED_REQUIRES_DOCTOR_REVIEW);
    if (
      a.resolutionStatus === 'UNRESOLVED' ||
      a.resolutionStatus === 'NEUTRAL_FALLBACK_PENDING_REVIEW'
    ) {
      out.push(RULE2_REASON_CODES.UNRESOLVED_NEUTRAL_FALLBACK);
    }
  }
  return sortedUnique(out);
}
