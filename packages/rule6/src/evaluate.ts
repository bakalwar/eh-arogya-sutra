import {
  RULE6_OUTPUT_KEY_ORDER,
  RULE6_REASON_CODES,
  type Rule6CandidateState,
  type Rule6Outcome,
} from './constants.js';
import { Rule6EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import type {
  Rule6CandidateEvaluation,
  Rule6CompositionCandidate,
  Rule6Input,
  Rule6Output,
  Rule6RelationshipEdge,
} from './types.js';
import { isActivatingEdge, validateRule6Input } from './validateInput.js';
import {
  RULE6_OUTPUT_CONTRACT_VERSION,
  RULE6_RULE_IDENTITY,
  RULE6_RULE_NUMBER,
} from './version.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function contextTokens(input: Rule6Input): Set<string> {
  return new Set([...input.diseaseConditionRefs, ...input.clinicalTargetRefs]);
}

function edgeMentionsMedicine(edge: Rule6RelationshipEdge, medicineId: string): boolean {
  if (edge.sourceMedicineId === medicineId) return true;
  if (typeof edge.targetMedicineIdOrSet === 'string') {
    return edge.targetMedicineIdOrSet === medicineId;
  }
  return edge.targetMedicineIdOrSet.includes(medicineId);
}

function applicabilitySatisfied(edge: Rule6RelationshipEdge, ctx: Set<string>): boolean {
  if (edge.applicabilityConditions.length === 0) return true;
  return edge.applicabilityConditions.every((c) => ctx.has(c));
}

function prohibitionActive(edge: Rule6RelationshipEdge, ctx: Set<string>): boolean {
  return edge.prohibitionConditions.some((c) => ctx.has(c));
}

function buildOrderedOutput(partial: Rule6Output): Rule6Output {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE6_OUTPUT_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule6Output);
}

function evaluateCandidates(input: Rule6Input): {
  evaluations: Rule6CandidateEvaluation[];
  selected: string[];
  rejected: string[];
  evidenceRefs: string[];
  edgeIdsUsed: string[];
  reasonCodes: string[];
  blockers: string[];
  unresolved: boolean;
  blockedBySafety: boolean;
} {
  const ctx = contextTokens(input);
  const safety = new Set(input.safetyExclusionRefs);
  const pool = sortedUnique(input.candidateMedicinePool);
  const evaluations: Rule6CandidateEvaluation[] = [];
  const selected: string[] = [];
  const rejected: string[] = [];
  const evidenceRefs: string[] = [];
  const edgeIdsUsed: string[] = [];
  const reasonCodes: string[] = [];
  const blockers: string[] = [];
  let unresolved = false;
  let blockedBySafety = false;

  for (const medicineId of pool) {
    const reasons: string[] = [];
    const evid: string[] = [];
    const edges: string[] = [];

    if (safety.has(medicineId)) {
      reasons.push(RULE6_REASON_CODES.SAFETY_EXCLUSION);
      reasonCodes.push(RULE6_REASON_CODES.SAFETY_EXCLUSION);
      rejected.push(medicineId);
      blockedBySafety = true;
      evaluations.push({
        medicineId,
        state: 'REJECTED',
        reasonCodes: Object.freeze([...reasons]),
        evidenceIds: Object.freeze([]),
        edgeIds: Object.freeze([]),
      });
      continue;
    }

    const related = input.relationshipEvidenceRegistry.edges.filter((e) =>
      edgeMentionsMedicine(e, medicineId),
    );
    const activating: Rule6RelationshipEdge[] = [];
    const contradictory: Rule6RelationshipEdge[] = [];

    for (const edge of related) {
      if (!applicabilitySatisfied(edge, ctx)) {
        continue;
      }
      if (prohibitionActive(edge, ctx)) {
        if (isActivatingEdge(edge)) {
          contradictory.push(edge);
        }
        reasons.push(RULE6_REASON_CODES.PROHIBITION_ACTIVE);
        continue;
      }
      if (isActivatingEdge(edge)) {
        activating.push(edge);
      } else {
        reasons.push(RULE6_REASON_CODES.EDGE_NON_ACTIVATING);
      }
    }

    if (contradictory.length > 0) {
      unresolved = true;
      reasons.push(RULE6_REASON_CODES.CONTRADICTORY_EVIDENCE);
      blockers.push(RULE6_REASON_CODES.CONTRADICTORY_EVIDENCE);
      evaluations.push({
        medicineId,
        state: 'UNRESOLVED',
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        evidenceIds: Object.freeze(sortedUnique(contradictory.map((e) => e.evidenceSourceId))),
        edgeIds: Object.freeze(sortedUnique(contradictory.map((e) => e.edgeId))),
      });
      continue;
    }

    if (activating.length > 0) {
      for (const edge of activating) {
        evid.push(edge.evidenceSourceId);
        edges.push(edge.edgeId);
        evidenceRefs.push(edge.evidenceSourceId);
        edgeIdsUsed.push(edge.edgeId);
      }
      reasons.push(RULE6_REASON_CODES.ELIGIBLE_BY_APPROVED_EDGE);
      reasonCodes.push(RULE6_REASON_CODES.ELIGIBLE_BY_APPROVED_EDGE);
      selected.push(medicineId);
      evaluations.push({
        medicineId,
        state: 'ELIGIBLE',
        reasonCodes: Object.freeze(sortedUnique(reasons)),
        evidenceIds: Object.freeze(sortedUnique(evid)),
        edgeIds: Object.freeze(sortedUnique(edges)),
      });
      continue;
    }

    reasons.push(RULE6_REASON_CODES.EVIDENCE_INSUFFICIENT);
    reasonCodes.push(RULE6_REASON_CODES.EVIDENCE_INSUFFICIENT);
    evaluations.push({
      medicineId,
      state: 'EVIDENCE_INSUFFICIENT',
      reasonCodes: Object.freeze(sortedUnique(reasons)),
      evidenceIds: Object.freeze([]),
      edgeIds: Object.freeze([]),
    });
  }

  return {
    evaluations,
    selected,
    rejected,
    evidenceRefs: sortedUnique(evidenceRefs),
    edgeIdsUsed: sortedUnique(edgeIdsUsed),
    reasonCodes: sortedUnique(reasonCodes),
    blockers: sortedUnique(blockers),
    unresolved,
    blockedBySafety,
  };
}

function proposeCompositions(
  input: Rule6Input,
  selected: readonly string[],
  evaluations: readonly Rule6CandidateEvaluation[],
): { compositions: Rule6CompositionCandidate[]; tieUnresolved: boolean } {
  if (selected.length === 0) {
    return { compositions: [], tieUnresolved: false };
  }

  const eligibleSet = new Set(selected);
  const evalById = new Map(evaluations.map((e) => [e.medicineId, e]));
  const compositions: Rule6CompositionCandidate[] = [];
  const ctx = [...input.diseaseConditionRefs, ...input.clinicalTargetRefs];
  let tieUnresolved = false;

  // Pair compositions from activating undirected/directed edges between two eligible medicines.
  const pairKeys = new Set<string>();
  for (const edge of input.relationshipEvidenceRegistry.edges) {
    if (!isActivatingEdge(edge)) continue;
    if (!applicabilitySatisfied(edge, new Set(ctx))) continue;
    if (prohibitionActive(edge, new Set(ctx))) continue;
    const targets =
      typeof edge.targetMedicineIdOrSet === 'string'
        ? [edge.targetMedicineIdOrSet]
        : [...edge.targetMedicineIdOrSet];
    for (const target of targets) {
      const a = edge.sourceMedicineId;
      const b = target;
      if (!eligibleSet.has(a) || !eligibleSet.has(b) || a === b) continue;
      const meds = sortedUnique([a, b]);
      const key = meds.join('+');
      if (pairKeys.has(key)) continue;
      pairKeys.add(key);
      const evid = sortedUnique([
        ...(evalById.get(a)?.evidenceIds ?? []),
        ...(evalById.get(b)?.evidenceIds ?? []),
        edge.evidenceSourceId,
      ]);
      compositions.push({
        compositionId: `shadow-comp-${key}`,
        medicineIds: Object.freeze(meds),
        evidenceIds: Object.freeze(evid),
        relationshipEdgeIds: Object.freeze([edge.edgeId]),
        targetOrSystemReasons: Object.freeze(sortedUnique(ctx)),
        rejectionOrBlockerInfo: Object.freeze([]),
        rule9ValidationRequired: true,
      });
    }
  }

  // Single-medicine compositions for eligible medicines not appearing in a pair.
  const covered = new Set<string>();
  for (const c of compositions) {
    for (const m of c.medicineIds) covered.add(m);
  }
  for (const medicineId of selected) {
    if (covered.has(medicineId)) continue;
    const ev = evalById.get(medicineId);
    compositions.push({
      compositionId: `shadow-comp-${medicineId}`,
      medicineIds: Object.freeze([medicineId]),
      evidenceIds: Object.freeze([...(ev?.evidenceIds ?? [])]),
      relationshipEdgeIds: Object.freeze([...(ev?.edgeIds ?? [])]),
      targetOrSystemReasons: Object.freeze(sortedUnique(ctx)),
      rejectionOrBlockerInfo: Object.freeze([]),
      rule9ValidationRequired: true,
    });
  }

  compositions.sort((a, b) =>
    a.compositionId < b.compositionId ? -1 : a.compositionId > b.compositionId ? 1 : 0,
  );

  // Deterministic tie: multiple compositions with identical medicine-set size and no distinguishing edge rank → unresolved if >1 and all singles with equal evidence count and no pair edge
  if (compositions.length > 1) {
    const allSingles = compositions.every((c) => c.medicineIds.length === 1);
    if (allSingles) {
      const evidenceCounts = compositions.map((c) => c.evidenceIds.length);
      const allEqual = evidenceCounts.every((n) => n === evidenceCounts[0]);
      if (allEqual && pairKeys.size === 0) {
        // Multiple equally evidenced singles with no relationship edge to prefer — unresolved tie
        tieUnresolved = true;
        return { compositions: [], tieUnresolved: true };
      }
    }
  }

  // Mark selected for shadow proposal
  for (const c of compositions) {
    for (const m of c.medicineIds) {
      const idx = evaluations.findIndex((e) => e.medicineId === m);
      if (idx >= 0 && evaluations[idx]!.state === 'ELIGIBLE') {
        (evaluations as Rule6CandidateEvaluation[])[idx] = {
          ...evaluations[idx]!,
          state: 'SELECTED_FOR_SHADOW_PROPOSAL' as Rule6CandidateState,
        };
      }
    }
  }

  return { compositions, tieUnresolved };
}

function decideStatus(args: {
  input: Rule6Input;
  selected: readonly string[];
  compositions: readonly Rule6CompositionCandidate[];
  unresolved: boolean;
  tieUnresolved: boolean;
  blockedBySafety: boolean;
  poolSize: number;
}): Rule6Outcome {
  const { input, selected, compositions, unresolved, tieUnresolved, blockedBySafety, poolSize } =
    args;

  if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
    return 'NOT_APPLICABLE';
  }
  if (blockedBySafety && selected.length === 0 && poolSize > 0) {
    const allSafetyRejected =
      input.candidateMedicinePool.length > 0 &&
      input.candidateMedicinePool.every((m) => input.safetyExclusionRefs.includes(m));
    if (allSafetyRejected) return 'BLOCKED_BY_SAFETY';
  }
  if (
    input.rule1TemperamentRef.status === 'NOT_EVALUABLE' ||
    input.rule3OrganSystemRef.status === 'NOT_EVALUABLE' ||
    input.upstreamApplicability.status === 'NOT_EVALUABLE'
  ) {
    return 'NOT_EVALUABLE';
  }
  if (tieUnresolved || unresolved) {
    return 'UNRESOLVED_EVIDENCE';
  }
  if (compositions.length > 0) {
    return 'SHADOW_CANDIDATES_PROPOSED';
  }
  if (blockedBySafety && selected.length === 0) {
    return 'BLOCKED_BY_SAFETY';
  }
  if (selected.length === 0) {
    return 'EVALUATED_NO_ELIGIBLE_CANDIDATE';
  }
  return 'EVALUATED_NO_ELIGIBLE_CANDIDATE';
}

export function evaluateRule6Shadow(rawInput: unknown): Rule6Output {
  try {
    const input = validateRule6Input(rawInput);

    if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
      const emptyEvals = sortedUnique(input.candidateMedicinePool).map((medicineId) =>
        deepFreeze({
          medicineId,
          state: 'CONSIDERED' as const,
          reasonCodes: Object.freeze([RULE6_REASON_CODES.UPSTREAM_NOT_APPLICABLE]),
          evidenceIds: Object.freeze([] as string[]),
          edgeIds: Object.freeze([] as string[]),
        }),
      );
      return buildOrderedOutput({
        contractVersion: RULE6_OUTPUT_CONTRACT_VERSION,
        ruleNumber: RULE6_RULE_NUMBER,
        ruleIdentity: RULE6_RULE_IDENTITY,
        requestId: input.requestId,
        status: 'NOT_APPLICABLE',
        applicability: 'NOT_APPLICABLE',
        evaluatedSystemsOrConditions: Object.freeze(
          sortedUnique([...input.diseaseConditionRefs, ...input.clinicalTargetRefs]),
        ),
        candidateEvaluations: Object.freeze(emptyEvals),
        selectedEligibleCandidates: Object.freeze([]),
        rejectedCandidates: Object.freeze([]),
        proposedCompositionCandidates: Object.freeze([]),
        evidenceRefs: Object.freeze([]),
        reasonCodes: Object.freeze([RULE6_REASON_CODES.UPSTREAM_NOT_APPLICABLE]),
        blockersOrUnresolvedEvidence: Object.freeze([]),
        rule9SectionFValidationRequired: false,
        deterministicFingerprint: null,
        shadowOnly: true,
        clinicalActivation: 'NONE',
      });
    }

    if (
      input.rule1TemperamentRef.status === 'NOT_EVALUABLE' ||
      input.rule3OrganSystemRef.status === 'NOT_EVALUABLE' ||
      input.upstreamApplicability.status === 'NOT_EVALUABLE'
    ) {
      const emptyEvals = sortedUnique(input.candidateMedicinePool).map((medicineId) =>
        deepFreeze({
          medicineId,
          state: 'CONSIDERED' as const,
          reasonCodes: Object.freeze([RULE6_REASON_CODES.UPSTREAM_NOT_EVALUABLE]),
          evidenceIds: Object.freeze([] as string[]),
          edgeIds: Object.freeze([] as string[]),
        }),
      );
      return buildOrderedOutput({
        contractVersion: RULE6_OUTPUT_CONTRACT_VERSION,
        ruleNumber: RULE6_RULE_NUMBER,
        ruleIdentity: RULE6_RULE_IDENTITY,
        requestId: input.requestId,
        status: 'NOT_EVALUABLE',
        applicability: 'NOT_EVALUABLE',
        evaluatedSystemsOrConditions: Object.freeze(
          sortedUnique([...input.diseaseConditionRefs, ...input.clinicalTargetRefs]),
        ),
        candidateEvaluations: Object.freeze(emptyEvals),
        selectedEligibleCandidates: Object.freeze([]),
        rejectedCandidates: Object.freeze([]),
        proposedCompositionCandidates: Object.freeze([]),
        evidenceRefs: Object.freeze([]),
        reasonCodes: Object.freeze([RULE6_REASON_CODES.UPSTREAM_NOT_EVALUABLE]),
        blockersOrUnresolvedEvidence: Object.freeze([RULE6_REASON_CODES.UPSTREAM_NOT_EVALUABLE]),
        rule9SectionFValidationRequired: false,
        deterministicFingerprint: null,
        shadowOnly: true,
        clinicalActivation: 'NONE',
      });
    }

    const result = evaluateCandidates(input);
    const { compositions, tieUnresolved } = proposeCompositions(
      input,
      result.selected,
      result.evaluations,
    );

    const status = decideStatus({
      input,
      selected: result.selected,
      compositions,
      unresolved: result.unresolved,
      tieUnresolved,
      blockedBySafety: result.blockedBySafety,
      poolSize: input.candidateMedicinePool.length,
    });

    const finalCompositions =
      status === 'SHADOW_CANDIDATES_PROPOSED' ? compositions : ([] as Rule6CompositionCandidate[]);
    const reasons = [...result.reasonCodes];
    if (status === 'SHADOW_CANDIDATES_PROPOSED') {
      reasons.push(RULE6_REASON_CODES.SHADOW_COMPOSITION_PROPOSED);
      reasons.push(RULE6_REASON_CODES.RULE9_VALIDATION_REQUIRED);
    }
    if (tieUnresolved) {
      reasons.push(RULE6_REASON_CODES.UNRESOLVED_TIE);
    }

    // Fix candidate states if tie cleared compositions
    let finalEvals = result.evaluations;
    if (tieUnresolved) {
      finalEvals = result.evaluations.map((e) =>
        e.state === 'ELIGIBLE' || e.state === 'SELECTED_FOR_SHADOW_PROPOSAL'
          ? {
              ...e,
              state: 'UNRESOLVED' as const,
              reasonCodes: Object.freeze(
                sortedUnique([...e.reasonCodes, RULE6_REASON_CODES.UNRESOLVED_TIE]),
              ),
            }
          : e,
      );
    } else if (status === 'SHADOW_CANDIDATES_PROPOSED') {
      // re-run proposal mutation already applied on evaluations array
      finalEvals = result.evaluations;
    }

    return buildOrderedOutput({
      contractVersion: RULE6_OUTPUT_CONTRACT_VERSION,
      ruleNumber: RULE6_RULE_NUMBER,
      ruleIdentity: RULE6_RULE_IDENTITY,
      requestId: input.requestId,
      status,
      applicability: input.upstreamApplicability.status,
      evaluatedSystemsOrConditions: Object.freeze(
        sortedUnique([...input.diseaseConditionRefs, ...input.clinicalTargetRefs]),
      ),
      candidateEvaluations: Object.freeze(finalEvals.map((e) => deepFreeze({ ...e }))),
      selectedEligibleCandidates: Object.freeze(
        status === 'SHADOW_CANDIDATES_PROPOSED' ? [...result.selected].sort() : [],
      ),
      rejectedCandidates: Object.freeze([...result.rejected].sort()),
      proposedCompositionCandidates: Object.freeze(
        finalCompositions.map((c) => deepFreeze({ ...c })),
      ),
      evidenceRefs: Object.freeze(result.evidenceRefs),
      reasonCodes: Object.freeze(sortedUnique(reasons)),
      blockersOrUnresolvedEvidence: Object.freeze(
        sortedUnique([
          ...result.blockers,
          ...(tieUnresolved ? [RULE6_REASON_CODES.UNRESOLVED_TIE] : []),
        ]),
      ),
      rule9SectionFValidationRequired: finalCompositions.length > 0,
      deterministicFingerprint: null,
      shadowOnly: true,
      clinicalActivation: 'NONE',
    });
  } catch (e) {
    if (e instanceof Rule6EvaluationError) throw e;
    throw new Rule6EvaluationError('INTERNAL_FAILURE');
  }
}
