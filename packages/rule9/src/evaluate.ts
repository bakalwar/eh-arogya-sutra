import {
  RULE9_OUTPUT_KEY_ORDER,
  RULE9_PACKAGE_KEY_ORDER,
  RULE9_REASON_CODES,
  RULE9_TIER_TO_COUNT,
  type Rule9ComplexityTier,
  type Rule9CountValidationState,
  type Rule9Outcome,
} from './constants.js';
import { Rule9EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import type {
  Rule9ComplexityApproved,
  Rule9Input,
  Rule9OralMixture,
  Rule9Output,
  Rule9RuleEnvelope,
  Rule9ShadowPackage,
  Rule9UpstreamRuleState,
} from './types.js';
import { validateRule9Input } from './validateInput.js';
import {
  RULE9_OUTPUT_CONTRACT_VERSION,
  RULE9_RULE_IDENTITY,
  RULE9_RULE_NUMBER,
} from './version.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildOrderedOutput(partial: Rule9Output): Rule9Output {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE9_OUTPUT_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule9Output);
}

function buildPackage(partial: Rule9ShadowPackage): Rule9ShadowPackage {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE9_PACKAGE_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return Object.freeze(ordered as unknown as Rule9ShadowPackage);
}

function fingerprint(parts: readonly string[]): string {
  return `r9:${parts.join('|')}`;
}

function isAbsent(env: Rule9RuleEnvelope): env is {
  readonly status: 'UNAVAILABLE' | 'NOT_IMPLEMENTED';
} {
  return !('ruleNumber' in env);
}

function envelopeState(
  ruleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
  env: Rule9RuleEnvelope,
): Rule9UpstreamRuleState {
  if (isAbsent(env)) {
    return {
      ruleNumber,
      status: env.status,
      applicability: env.status,
    };
  }
  return {
    ruleNumber,
    status: env.status,
    applicability: env.applicability,
  };
}

function collectUpstreamStates(input: Rule9Input): readonly Rule9UpstreamRuleState[] {
  return Object.freeze([
    envelopeState(1, input.rule1Envelope),
    envelopeState(2, input.rule2Envelope),
    envelopeState(3, input.rule3Envelope),
    envelopeState(4, input.rule4Envelope),
    envelopeState(5, input.rule5Envelope),
    envelopeState(6, input.rule6Envelope),
    envelopeState(7, input.rule7Envelope),
    envelopeState(8, input.rule8Envelope),
  ]);
}

function requiredClinicalDataZero(env: Rule9RuleEnvelope): boolean {
  if (isAbsent(env)) return false;
  if (env.applicability === 'NOT_APPLICABLE') return false;
  // Required when applicability is APPLICABLE or NOT_EVALUABLE (caller-declared).
  if (env.applicability === 'NOT_EVALUABLE') return true;
  const count = env.validatedActiveClinicalDataCount;
  return typeof count === 'number' && count === 0;
}

function requiredNotEvaluable(env: Rule9RuleEnvelope): boolean {
  if (isAbsent(env)) return false;
  return env.applicability === 'NOT_EVALUABLE' || env.status === 'NOT_EVALUABLE';
}

function baseOutput(
  input: Rule9Input,
  status: Rule9Outcome,
  applicability: string,
  opts: {
    tier: Rule9ComplexityTier | null;
    requiredCount: 3 | 4 | 5 | null;
    observedCount: number | null;
    countState: Rule9CountValidationState;
    pkg: Rule9ShadowPackage | null;
    rejectionReasons: readonly string[];
    insufficient: boolean;
    doctorReview: boolean;
    reasonCodes: readonly string[];
    blockers: readonly string[];
    evidenceRefs: readonly string[];
  },
): Rule9Output {
  return buildOrderedOutput({
    contractVersion: RULE9_OUTPUT_CONTRACT_VERSION,
    ruleNumber: RULE9_RULE_NUMBER,
    ruleIdentity: RULE9_RULE_IDENTITY,
    requestId: input.requestId,
    status,
    applicability,
    complexityTierAccepted: opts.tier,
    requiredOralMixtureCount: opts.requiredCount,
    observedOralMixtureCount: opts.observedCount,
    countValidationState: opts.countState,
    packagedShadowProposal: opts.pkg,
    rejectionReasons: Object.freeze(sortedUnique(opts.rejectionReasons)),
    insufficientClinicalEvidence: opts.insufficient,
    doctorReviewRequired: opts.doctorReview,
    upstreamRuleStates: collectUpstreamStates(input),
    evidenceRefs: Object.freeze(sortedUnique(opts.evidenceRefs)),
    reasonCodes: Object.freeze(sortedUnique(opts.reasonCodes)),
    blockersOrUnresolvedEvidence: Object.freeze(sortedUnique(opts.blockers)),
    deterministicFingerprint: fingerprint([
      input.requestId,
      status,
      opts.tier ?? 'null',
      String(opts.observedCount),
    ]),
    shadowOnly: true,
    clinicalActivation: 'NONE',
    medicineSelectionInfluence: 'NONE',
    prescriptionEffect: 'NONE',
    notAClinicallyActivatedPrescription: true,
  });
}

function passThroughMixtures(mixtures: readonly Rule9OralMixture[]): readonly Rule9OralMixture[] {
  // Deterministic independent copy of upstream proposal content — no clinical mutation.
  const copied = mixtures.map((m) =>
    Object.freeze({
      mixtureId: m.mixtureId,
      medicineIds: Object.freeze([...m.medicineIds]),
      evidenceRefs: Object.freeze([...m.evidenceRefs]),
    }),
  );
  return Object.freeze(copied);
}

/**
 * Shadow-only Rule 9 Master Pipeline validator/packager.
 * Validate / reject / package only. Never selects medicines or mutates composition.
 */
export function evaluateRule9Shadow(raw: unknown): Rule9Output {
  try {
    const input = validateRule9Input(raw);
    const upstreamStates = collectUpstreamStates(input);

    // Precedence 1 — pipeline not applicable
    if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
      return baseOutput(input, 'NOT_APPLICABLE', 'NOT_APPLICABLE', {
        tier: null,
        requiredCount: null,
        observedCount: null,
        countState: 'NOT_APPLICABLE',
        pkg: null,
        rejectionReasons: [RULE9_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
        insufficient: false,
        doctorReview: false,
        reasonCodes: [
          RULE9_REASON_CODES.UPSTREAM_NOT_APPLICABLE,
          ...input.upstreamApplicability.reasonCodes,
        ],
        blockers: [RULE9_REASON_CODES.UPSTREAM_NOT_APPLICABLE],
        evidenceRefs: [],
      });
    }

    // Precedence 3 — complexity tier gate (before packaging / count success)
    const tierRef = input.complexityTierRef;
    if (!('tier' in tierRef)) {
      return baseOutput(input, 'NOT_EVALUABLE', input.upstreamApplicability.status, {
        tier: null,
        requiredCount: null,
        observedCount: null,
        countState: 'NOT_EVALUABLE',
        pkg: null,
        rejectionReasons: [RULE9_REASON_CODES.TIER_NOT_ACCEPTED],
        insufficient: false,
        doctorReview: false,
        reasonCodes: [
          RULE9_REASON_CODES.TIER_NOT_ACCEPTED,
          RULE9_REASON_CODES.TIER_INFERENCE_FORBIDDEN,
        ],
        blockers: [RULE9_REASON_CODES.TIER_NOT_ACCEPTED],
        evidenceRefs: [],
      });
    }

    const approved = tierRef as Rule9ComplexityApproved;
    const tier = approved.tier;
    const requiredCount = RULE9_TIER_TO_COUNT[tier] as 3 | 4 | 5;

    // Precedence 4 — upstream contradiction markers in declared statuses
    const contradictionHit = upstreamStates.some(
      (s) =>
        s.status === 'CONFLICT' ||
        s.status === 'CONTRADICTORY' ||
        s.applicability === 'CONTRADICTORY',
    );
    if (contradictionHit) {
      return baseOutput(input, 'BLOCKED_BY_UPSTREAM_CONTRADICTION', 'APPLICABLE', {
        tier,
        requiredCount,
        observedCount: null,
        countState: 'NOT_EVALUABLE',
        pkg: null,
        rejectionReasons: [RULE9_REASON_CODES.UPSTREAM_CONTRADICTION],
        insufficient: false,
        doctorReview: false,
        reasonCodes: [RULE9_REASON_CODES.UPSTREAM_CONTRADICTION],
        blockers: [RULE9_REASON_CODES.UPSTREAM_CONTRADICTION],
        evidenceRefs: [approved.evidenceSourceId],
      });
    }

    // Precedence 5 — required NOT_EVALUABLE / zero clinical data for Rules 6–8
    const r678 = [input.rule6Envelope, input.rule7Envelope, input.rule8Envelope];
    if (r678.some(requiredNotEvaluable) || r678.some(requiredClinicalDataZero)) {
      return baseOutput(input, 'INSUFFICIENT_CLINICAL_EVIDENCE', 'APPLICABLE', {
        tier,
        requiredCount,
        observedCount: null,
        countState: 'NOT_EVALUABLE',
        pkg: null,
        rejectionReasons: [
          RULE9_REASON_CODES.INSUFFICIENT_CLINICAL_EVIDENCE,
          RULE9_REASON_CODES.ZERO_REQUIRED_CLINICAL_DATA,
        ],
        insufficient: true,
        doctorReview: true,
        reasonCodes: [
          RULE9_REASON_CODES.INSUFFICIENT_CLINICAL_EVIDENCE,
          RULE9_REASON_CODES.DOCTOR_REVIEW_REQUIRED,
          RULE9_REASON_CODES.ZERO_REQUIRED_CLINICAL_DATA,
          RULE9_REASON_CODES.UPSTREAM_NOT_EVALUABLE,
        ],
        blockers: [
          RULE9_REASON_CODES.INSUFFICIENT_CLINICAL_EVIDENCE,
          RULE9_REASON_CODES.ZERO_REQUIRED_CLINICAL_DATA,
        ],
        evidenceRefs: [approved.evidenceSourceId],
      });
    }

    if (input.upstreamApplicability.status === 'NOT_EVALUABLE') {
      return baseOutput(input, 'INSUFFICIENT_CLINICAL_EVIDENCE', 'NOT_EVALUABLE', {
        tier,
        requiredCount,
        observedCount: null,
        countState: 'NOT_EVALUABLE',
        pkg: null,
        rejectionReasons: [RULE9_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
        insufficient: true,
        doctorReview: true,
        reasonCodes: [
          RULE9_REASON_CODES.INSUFFICIENT_CLINICAL_EVIDENCE,
          RULE9_REASON_CODES.DOCTOR_REVIEW_REQUIRED,
          RULE9_REASON_CODES.UPSTREAM_NOT_EVALUABLE,
        ],
        blockers: [RULE9_REASON_CODES.UPSTREAM_NOT_EVALUABLE],
        evidenceRefs: [approved.evidenceSourceId],
      });
    }

    // Composition presence
    const composition = input.proposedOralComposition;
    if ('status' in composition && composition.status === 'ABSENT') {
      return baseOutput(input, 'INSUFFICIENT_CLINICAL_EVIDENCE', 'APPLICABLE', {
        tier,
        requiredCount,
        observedCount: 0,
        countState: 'FAIL',
        pkg: null,
        rejectionReasons: [
          RULE9_REASON_CODES.COMPOSITION_ABSENT,
          RULE9_REASON_CODES.INSUFFICIENT_CLINICAL_EVIDENCE,
        ],
        insufficient: true,
        doctorReview: true,
        reasonCodes: [
          RULE9_REASON_CODES.COMPOSITION_ABSENT,
          RULE9_REASON_CODES.INSUFFICIENT_CLINICAL_EVIDENCE,
          RULE9_REASON_CODES.DOCTOR_REVIEW_REQUIRED,
        ],
        blockers: [RULE9_REASON_CODES.COMPOSITION_ABSENT],
        evidenceRefs: [approved.evidenceSourceId],
      });
    }

    if (!('mixtures' in composition)) {
      throw new Rule9EvaluationError('INTERNAL_FAILURE');
    }

    const observedCount = composition.mixtures.length;

    // Precedence 6 — count validation (no mutation)
    if (observedCount === 1 || observedCount === 2) {
      return baseOutput(input, 'BLOCKED_BY_COUNT_VALIDATION', 'APPLICABLE', {
        tier,
        requiredCount,
        observedCount,
        countState: 'FAIL',
        pkg: null,
        rejectionReasons: [RULE9_REASON_CODES.COUNT_ONE_OR_TWO, RULE9_REASON_CODES.COUNT_MISMATCH],
        insufficient: false,
        doctorReview: false,
        reasonCodes: [RULE9_REASON_CODES.COUNT_ONE_OR_TWO, RULE9_REASON_CODES.COUNT_MISMATCH],
        blockers: [RULE9_REASON_CODES.COUNT_ONE_OR_TWO],
        evidenceRefs: [approved.evidenceSourceId],
      });
    }

    if (observedCount !== requiredCount) {
      return baseOutput(input, 'BLOCKED_BY_COUNT_VALIDATION', 'APPLICABLE', {
        tier,
        requiredCount,
        observedCount,
        countState: 'FAIL',
        pkg: null,
        rejectionReasons: [RULE9_REASON_CODES.COUNT_MISMATCH],
        insufficient: false,
        doctorReview: false,
        reasonCodes: [RULE9_REASON_CODES.COUNT_MISMATCH],
        blockers: [RULE9_REASON_CODES.COUNT_MISMATCH],
        evidenceRefs: [approved.evidenceSourceId],
      });
    }

    // Precedence 7 — unresolved evidence markers on pipeline reasons
    if (input.upstreamApplicability.reasonCodes.includes('UNRESOLVED_EVIDENCE')) {
      return baseOutput(input, 'UNRESOLVED_EVIDENCE', 'APPLICABLE', {
        tier,
        requiredCount,
        observedCount,
        countState: 'PASS',
        pkg: null,
        rejectionReasons: [RULE9_REASON_CODES.UNRESOLVED_EVIDENCE],
        insufficient: false,
        doctorReview: false,
        reasonCodes: [RULE9_REASON_CODES.UNRESOLVED_EVIDENCE],
        blockers: [RULE9_REASON_CODES.UNRESOLVED_EVIDENCE],
        evidenceRefs: [approved.evidenceSourceId],
      });
    }

    // Precedence 8 — technical shadow package only
    const oralMixtures = passThroughMixtures(composition.mixtures);
    const sourceRefs = upstreamStates
      .filter((s) => s.status !== 'UNAVAILABLE' && s.status !== 'NOT_IMPLEMENTED')
      .map((s) => `rule${s.ruleNumber}:${s.status}`)
      .sort();

    const pkg = buildPackage({
      packageId: `pkg-${input.requestId}`,
      sourceRuleEnvelopes: Object.freeze(sourceRefs),
      oralMixtures,
      sectionSeparations: Object.freeze({
        tabletExcludedFromOralCount: true as const,
        externalExcludedFromOralCount: true as const,
      }),
      countValidated: true,
      packagingNotes: Object.freeze([RULE9_REASON_CODES.SHADOW_PACKAGE_BUILT]),
    });

    const evidenceRefs = sortedUnique([
      approved.evidenceSourceId,
      ...oralMixtures.flatMap((m) => m.evidenceRefs),
    ]);

    return baseOutput(input, 'SHADOW_PACKAGE_READY', 'APPLICABLE', {
      tier,
      requiredCount,
      observedCount,
      countState: 'PASS',
      pkg,
      rejectionReasons: [],
      insufficient: false,
      doctorReview: false,
      reasonCodes: [RULE9_REASON_CODES.SHADOW_PACKAGE_BUILT],
      blockers: [],
      evidenceRefs,
    });
  } catch (err) {
    if (err instanceof Rule9EvaluationError) {
      throw err;
    }
    throw new Rule9EvaluationError('INTERNAL_FAILURE');
  }
}
