import {
  RULE3_ANNOTATION_KEY_ORDER,
  RULE3_BLOCKING_LIFECYCLE,
  RULE3_OUTPUT_KEY_ORDER,
  RULE3_REASON_CODES,
  RULE3_SYNTHETIC_TEST_CLASSIFICATION,
  RULE3_UNRESOLVED_REASON,
  type Rule3IndicationStatus,
  type Rule3Outcome,
} from './constants.js';
import { Rule3EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import type {
  Rule3Input,
  Rule3OrganSystemAnnotation,
  Rule3OrganSystemEvidenceEntry,
  Rule3Output,
  Rule3OutputCaseOrganSystemSummary,
} from './types.js';
import { isActivatingOrganSystemEvidence, validateRule3Input } from './validateInput.js';
import {
  RULE3_OUTPUT_CONTRACT_VERSION,
  RULE3_RULE_IDENTITY,
  RULE3_RULE_NUMBER,
} from './version.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildOrderedAnnotation(partial: Rule3OrganSystemAnnotation): Rule3OrganSystemAnnotation {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE3_ANNOTATION_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule3OrganSystemAnnotation);
}

function buildOrderedOutput(partial: Rule3Output): Rule3Output {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE3_OUTPUT_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule3Output);
}

function fingerprint(parts: readonly string[]): string {
  return `r3:${parts.join('|')}`;
}

function echoCaseSummary(input: Rule3Input): Rule3OutputCaseOrganSystemSummary {
  if (input.caseOrganSystemSummary.status === 'NOT_SUPPLIED') return null;
  return deepFreeze({
    displayOnly: true as const,
    mustNotDriveSelection: true as const,
    headline: input.caseOrganSystemSummary.headline,
  });
}

function isCandidateLike(entry: Rule3OrganSystemEvidenceEntry): boolean {
  return (
    entry.systemRole === 'CANDIDATE' ||
    entry.systemRole === 'CO_INVOLVEMENT_CANDIDATE' ||
    entry.verificationStatus === 'LOW_CONFIDENCE_CANDIDATE' ||
    entry.detectionMethodClass === 'KEYWORD_LOW_CONFIDENCE' ||
    entry.detectionMethodClass === 'CO_INVOLVEMENT_CANDIDATE'
  );
}

function annotateBinding(
  bindingRefId: string,
  recordIndex: number,
  entriesForBinding: readonly Rule3OrganSystemEvidenceEntry[],
): {
  annotation: Rule3OrganSystemAnnotation;
  forbidden: boolean;
  contradictory: boolean;
  blockingLifecycle: boolean;
  staleLike: boolean;
  candidateOnly: boolean;
  activating: boolean;
} {
  const gaps: string[] = [];
  const reasons: string[] = [];
  let forbidden = false;
  let contradictory = false;
  let blockingLifecycle = false;
  let staleLike = false;
  let candidateOnly = false;

  for (const entry of entriesForBinding) {
    if ((RULE3_BLOCKING_LIFECYCLE as readonly string[]).includes(entry.effectiveStatus)) {
      blockingLifecycle = true;
      reasons.push(RULE3_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE);
      if (
        entry.effectiveStatus === 'STALE' ||
        entry.effectiveStatus === 'DISPUTED' ||
        entry.effectiveStatus === 'SUPERSEDED'
      ) {
        staleLike = true;
      }
    }
    if (
      entry.testClassification !== RULE3_SYNTHETIC_TEST_CLASSIFICATION &&
      entry.effectiveStatus === 'APPROVED_AND_ACTIVE'
    ) {
      forbidden = true;
      reasons.push(RULE3_REASON_CODES.FORBIDDEN_EVIDENCE_SOURCE);
    }
    if (isCandidateLike(entry)) {
      candidateOnly = true;
      if (entry.detectionMethodClass === 'KEYWORD_LOW_CONFIDENCE') {
        reasons.push(RULE3_REASON_CODES.KEYWORD_LOW_CONFIDENCE_CANDIDATE);
      }
      if (
        entry.systemRole === 'CO_INVOLVEMENT_CANDIDATE' ||
        entry.detectionMethodClass === 'CO_INVOLVEMENT_CANDIDATE'
      ) {
        reasons.push(RULE3_REASON_CODES.CO_INVOLVEMENT_CANDIDATE_ONLY);
      }
      reasons.push(RULE3_REASON_CODES.CANDIDATE_ONLY);
    }
  }

  const activating = entriesForBinding.filter(isActivatingOrganSystemEvidence);
  const activatingTokens = new Set(activating.map((e) => e.organSystemToken));
  if (activatingTokens.size > 1) {
    contradictory = true;
    reasons.push(RULE3_REASON_CODES.CONTRADICTORY_BINDING_EVIDENCE);
  }

  if (contradictory) {
    return {
      annotation: buildOrderedAnnotation({
        organSystemIndicationId: `OSA_SYN_${recordIndex}`,
        bindingRefId,
        organSystemToken: null,
        systemRole: null,
        indicationStatus: 'BLOCKED_CONTRADICTION',
        verificationStatus: null,
        detectionMethodClass: null,
        unresolvedReason: null,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze(['binding_contradiction']),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
      }),
      forbidden,
      contradictory: true,
      blockingLifecycle,
      staleLike,
      candidateOnly,
      activating: false,
    };
  }

  if (forbidden) {
    return {
      annotation: buildOrderedAnnotation({
        organSystemIndicationId: `OSA_SYN_${recordIndex}`,
        bindingRefId,
        organSystemToken: null,
        systemRole: null,
        indicationStatus: 'UNRESOLVED',
        verificationStatus: null,
        detectionMethodClass: null,
        unresolvedReason: RULE3_UNRESOLVED_REASON,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze(['forbidden_or_non_synthetic_source']),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
      }),
      forbidden: true,
      contradictory: false,
      blockingLifecycle,
      staleLike,
      candidateOnly,
      activating: false,
    };
  }

  if (activating.length === 0) {
    if (candidateOnly && entriesForBinding.length > 0) {
      const candidateEntry = entriesForBinding.find(isCandidateLike)!;
      reasons.push(RULE3_REASON_CODES.EVIDENCE_NON_ACTIVATING);
      return {
        annotation: buildOrderedAnnotation({
          organSystemIndicationId: `OSA_SYN_${recordIndex}`,
          bindingRefId,
          organSystemToken: candidateEntry.organSystemToken,
          systemRole: candidateEntry.systemRole,
          indicationStatus: 'CANDIDATE_ONLY',
          verificationStatus: candidateEntry.verificationStatus,
          detectionMethodClass: candidateEntry.detectionMethodClass,
          unresolvedReason: null,
          doctorReviewRequired: true,
          evidenceGaps: Object.freeze(['candidate_or_low_confidence_only']),
          reasonCodes: Object.freeze(sortedUnique(reasons)),
        }),
        forbidden: false,
        contradictory: false,
        blockingLifecycle,
        staleLike,
        candidateOnly: true,
        activating: false,
      };
    }

    gaps.push('insufficient_organ_system_evidence');
    reasons.push(RULE3_REASON_CODES.NO_EVIDENCE);
    reasons.push(RULE3_REASON_CODES.EMPTY_ACTIVE_ANNOTATIONS);
    if (entriesForBinding.length > 0) {
      reasons.push(RULE3_REASON_CODES.EVIDENCE_NON_ACTIVATING);
    }
    return {
      annotation: buildOrderedAnnotation({
        organSystemIndicationId: `OSA_SYN_${recordIndex}`,
        bindingRefId,
        organSystemToken: null,
        systemRole: null,
        indicationStatus: 'UNRESOLVED',
        verificationStatus: null,
        detectionMethodClass: null,
        unresolvedReason: RULE3_UNRESOLVED_REASON,
        doctorReviewRequired: true,
        evidenceGaps: Object.freeze([...gaps]),
        reasonCodes: Object.freeze(sortedUnique(reasons)),
      }),
      forbidden: false,
      contradictory: false,
      blockingLifecycle,
      staleLike,
      candidateOnly: false,
      activating: false,
    };
  }

  // Deterministic pick among activating: sort by entryId.
  const chosen = [...activating].sort((a, b) =>
    a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0,
  )[0]!;
  reasons.push(RULE3_REASON_CODES.ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE);

  return {
    annotation: buildOrderedAnnotation({
      organSystemIndicationId: `OSA_SYN_${recordIndex}`,
      bindingRefId,
      organSystemToken: chosen.organSystemToken,
      systemRole: chosen.systemRole,
      indicationStatus: 'SHADOW_ACTIVE_TECHNICAL' as Rule3IndicationStatus,
      verificationStatus: chosen.verificationStatus,
      detectionMethodClass: chosen.detectionMethodClass,
      unresolvedReason: null,
      doctorReviewRequired: false,
      evidenceGaps: Object.freeze([]),
      reasonCodes: Object.freeze(sortedUnique(reasons)),
    }),
    forbidden: false,
    contradictory: false,
    blockingLifecycle,
    staleLike,
    candidateOnly: false,
    activating: true,
  };
}

function baseOutput(
  input: Rule3Input,
  status: Rule3Outcome,
  applicability: string,
  annotations: readonly Rule3OrganSystemAnnotation[],
  gaps: readonly string[],
  reasonCodes: readonly string[],
  blockers: readonly string[],
  doctorReviewRequired: boolean,
): Rule3Output {
  const fpParts = [
    input.requestId,
    status,
    ...annotations.map(
      (a) =>
        `${a.bindingRefId}:${a.organSystemToken ?? 'null'}:${a.indicationStatus}:${a.systemRole ?? 'null'}`,
    ),
  ];
  return buildOrderedOutput({
    contractVersion: RULE3_OUTPUT_CONTRACT_VERSION,
    ruleNumber: RULE3_RULE_NUMBER,
    ruleIdentity: RULE3_RULE_IDENTITY,
    requestId: input.requestId,
    status,
    applicability,
    organSystemAnnotations: Object.freeze([...annotations]),
    caseOrganSystemSummary: echoCaseSummary(input),
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
 * Shadow-only Rule 3 Organ-System Affinity evaluator.
 * Empty production registry; synthetic activating evidence only; annotation-only; no medicine/formula/Rx influence.
 */
export function evaluateRule3Shadow(raw: unknown): Rule3Output {
  try {
    const input = validateRule3Input(raw);

    if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
      return baseOutput(
        input,
        'NOT_APPLICABLE',
        'NOT_APPLICABLE',
        [],
        ['upstream_not_applicable'],
        [RULE3_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
        [RULE3_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
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
        [RULE3_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
        [RULE3_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
        false,
      );
    }

    const reasonCodes: string[] = [RULE3_REASON_CODES.CATALOG_NOT_CREATED];
    if (input.caseOrganSystemSummary.status === 'SUPPLIED') {
      reasonCodes.push(RULE3_REASON_CODES.CASE_SUMMARY_MUST_NOT_DRIVE_SELECTION);
    }
    reasonCodes.push(RULE3_REASON_CODES.BINDING_ORDER_PRESERVED);

    const annotations: Rule3OrganSystemAnnotation[] = [];
    let anyForbidden = false;
    let anyContradiction = false;
    let anyStaleLike = false;
    let anyBlocking = false;
    let anyActivatingResolved = false;
    let anyDoctorReview = false;
    let anyInsufficient = false;
    let anyCandidateOnly = false;

    let index = 1;
    for (const binding of input.orderedEvidenceBindingRefs) {
      const entriesForBinding = input.organSystemAffinityEvidenceRegistry.entries.filter(
        (e) => e.bindingRefId === binding.bindingRefId,
      );
      const result = annotateBinding(binding.bindingRefId, index, entriesForBinding);
      index += 1;
      annotations.push(result.annotation);
      if (result.forbidden) anyForbidden = true;
      if (result.contradictory) anyContradiction = true;
      if (result.staleLike) anyStaleLike = true;
      if (result.blockingLifecycle) anyBlocking = true;
      if (result.candidateOnly) anyCandidateOnly = true;
      if (result.annotation.doctorReviewRequired) anyDoctorReview = true;
      if (result.annotation.indicationStatus === 'SHADOW_ACTIVE_TECHNICAL') {
        anyActivatingResolved = true;
      }
      if (
        result.annotation.indicationStatus === 'UNRESOLVED' &&
        result.annotation.unresolvedReason === RULE3_UNRESOLVED_REASON
      ) {
        anyInsufficient = true;
      }
    }

    const aggregateGaps = sortedUnique(annotations.flatMap((a) => [...a.evidenceGaps]));
    const aggregateReasons = sortedUnique([
      ...reasonCodes,
      ...annotations.flatMap((a) => [...a.reasonCodes]),
    ]);

    // Precedence: forbidden → contradiction → stale → candidate/insufficient → synthetic proposed
    if (anyForbidden) {
      return baseOutput(
        input,
        'NOT_EVALUABLE',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE3_REASON_CODES.FORBIDDEN_EVIDENCE_SOURCE],
        true,
      );
    }

    if (anyContradiction) {
      return baseOutput(
        input,
        'BLOCKED_BY_CONTRADICTION',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE3_REASON_CODES.CONTRADICTORY_BINDING_EVIDENCE],
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
        [RULE3_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE],
        true,
      );
    }

    const allShadowActive =
      annotations.length > 0 &&
      annotations.every(
        (a) =>
          a.indicationStatus === 'SHADOW_ACTIVE_TECHNICAL' &&
          a.doctorReviewRequired === false &&
          a.organSystemToken !== null,
      );

    if (allShadowActive) {
      return baseOutput(
        input,
        'SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED',
        'APPLICABLE',
        annotations,
        [],
        aggregateReasons,
        [],
        false,
      );
    }

    if (anyCandidateOnly && !anyActivatingResolved) {
      return baseOutput(
        input,
        'DOCTOR_REVIEW_REQUIRED',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE3_REASON_CODES.CANDIDATE_ONLY],
        true,
      );
    }

    if (anyDoctorReview) {
      const onlyInsufficient =
        anyInsufficient &&
        !anyCandidateOnly &&
        annotations.every(
          (a) => a.indicationStatus === 'UNRESOLVED' || a.indicationStatus === 'CANDIDATE_ONLY',
        );
      if (onlyInsufficient && !anyBlocking) {
        return baseOutput(
          input,
          'ADDITIONAL_INFORMATION_REQUIRED',
          'APPLICABLE',
          annotations,
          aggregateGaps,
          [...aggregateReasons, RULE3_REASON_CODES.ADDITIONAL_INFORMATION_REQUIRED],
          [],
          true,
        );
      }
      return baseOutput(
        input,
        'DOCTOR_REVIEW_REQUIRED',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [],
        true,
      );
    }

    if (anyBlocking) {
      return baseOutput(
        input,
        'UNRESOLVED_EVIDENCE',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE3_REASON_CODES.EVIDENCE_BLOCKING_LIFECYCLE],
        true,
      );
    }

    if (anyInsufficient) {
      return baseOutput(
        input,
        'UNRESOLVED_EVIDENCE',
        'APPLICABLE',
        annotations,
        aggregateGaps,
        aggregateReasons,
        [RULE3_REASON_CODES.NO_EVIDENCE],
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
    if (e instanceof Rule3EvaluationError) throw e;
    throw new Rule3EvaluationError('INTERNAL_FAILURE');
  }
}
