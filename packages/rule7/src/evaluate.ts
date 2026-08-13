import {
  RULE7_INDICATION_KEY_ORDER,
  RULE7_OUTPUT_KEY_ORDER,
  RULE7_REASON_CODES,
  type Rule7Outcome,
} from './constants.js';
import { Rule7EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import type { Rule7Output, Rule7RouteIndication } from './types.js';
import { isActivatingRouteEvidence, validateRule7Input } from './validateInput.js';
import {
  RULE7_OUTPUT_CONTRACT_VERSION,
  RULE7_RULE_IDENTITY,
  RULE7_RULE_NUMBER,
} from './version.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildOrderedOutput(partial: Rule7Output): Rule7Output {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE7_OUTPUT_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return deepFreeze(ordered as unknown as Rule7Output);
}

/** Exact six-field indication shape (§6.2 key order). */
function buildIndication(partial: Rule7RouteIndication): Rule7RouteIndication {
  const ordered: Record<string, unknown> = {};
  for (const key of RULE7_INDICATION_KEY_ORDER) {
    ordered[key] = partial[key];
  }
  return Object.freeze(ordered as unknown as Rule7RouteIndication);
}

function fingerprint(parts: readonly string[]): string {
  return `r7:${parts.join('|')}`;
}

/**
 * Shadow-only Rule 7 evaluator. Outcomes align with contract §6.3 closed vocabulary.
 * Does not invent clinical route meanings; only processes explicitly supplied synthetic evidence.
 */
export function evaluateRule7Shadow(raw: unknown): Rule7Output {
  try {
    const input = validateRule7Input(raw);
    const sites = sortedUnique(input.bodySiteRefs);
    const targets = new Set(input.clinicalTargetRefs);
    const siteSet = new Set(sites);

    if (input.upstreamApplicability.status === 'NOT_APPLICABLE') {
      return buildOrderedOutput({
        contractVersion: RULE7_OUTPUT_CONTRACT_VERSION,
        ruleNumber: RULE7_RULE_NUMBER,
        ruleIdentity: RULE7_RULE_IDENTITY,
        requestId: input.requestId,
        status: 'NOT_APPLICABLE',
        applicability: 'NOT_APPLICABLE',
        evaluatedBodySites: Object.freeze(sites),
        routeIndications: Object.freeze([]),
        notClinicallyIndicated: Object.freeze({
          reasons: Object.freeze([RULE7_REASON_CODES.UPSTREAM_NOT_APPLICABLE]),
        }),
        evidenceRefs: Object.freeze([]),
        reasonCodes: Object.freeze([RULE7_REASON_CODES.UPSTREAM_NOT_APPLICABLE]),
        blockersOrUnresolvedEvidence: Object.freeze([RULE7_REASON_CODES.UPSTREAM_NOT_APPLICABLE]),
        deterministicFingerprint: fingerprint([input.requestId, 'NOT_APPLICABLE', ...sites]),
        shadowOnly: true,
        clinicalActivation: 'NONE',
      });
    }

    if (input.upstreamApplicability.status === 'NOT_EVALUABLE') {
      return buildOrderedOutput({
        contractVersion: RULE7_OUTPUT_CONTRACT_VERSION,
        ruleNumber: RULE7_RULE_NUMBER,
        ruleIdentity: RULE7_RULE_IDENTITY,
        requestId: input.requestId,
        status: 'NOT_EVALUABLE',
        applicability: 'NOT_EVALUABLE',
        evaluatedBodySites: Object.freeze(sites),
        routeIndications: Object.freeze([]),
        notClinicallyIndicated: Object.freeze({
          reasons: Object.freeze([RULE7_REASON_CODES.UPSTREAM_NOT_EVALUABLE]),
        }),
        evidenceRefs: Object.freeze([]),
        reasonCodes: Object.freeze([RULE7_REASON_CODES.UPSTREAM_NOT_EVALUABLE]),
        blockersOrUnresolvedEvidence: Object.freeze([RULE7_REASON_CODES.UPSTREAM_NOT_EVALUABLE]),
        deterministicFingerprint: fingerprint([input.requestId, 'NOT_EVALUABLE', ...sites]),
        shadowOnly: true,
        clinicalActivation: 'NONE',
      });
    }

    const indications: Rule7RouteIndication[] = [];
    const evidenceRefs: string[] = [];
    const reasonCodes: string[] = [];
    const blockers: string[] = [];
    let blockedBySafety = false;
    let unresolved = false;
    let hasInsufficient = false;

    const entries = [...input.routeEvidenceRegistry.entries].sort((a, b) =>
      a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0,
    );

    for (const entry of entries) {
      if (!siteSet.has(entry.bodySiteRef)) {
        reasonCodes.push(RULE7_REASON_CODES.SITE_MISMATCH);
        continue;
      }

      if (
        entry.applicabilityConditions.length > 0 &&
        !entry.applicabilityConditions.every((c) => targets.has(c))
      ) {
        hasInsufficient = true;
        reasonCodes.push(RULE7_REASON_CODES.EVIDENCE_INSUFFICIENT);
        continue;
      }

      if (entry.prohibitionConditions.some((c) => targets.has(c))) {
        if (isActivatingRouteEvidence(entry)) {
          // Activating evidence that is also prohibition-matched → safety block (§6.3).
          blockedBySafety = true;
          blockers.push(RULE7_REASON_CODES.PROHIBITION_ACTIVE);
          reasonCodes.push(RULE7_REASON_CODES.PROHIBITION_ACTIVE);
        } else {
          reasonCodes.push(RULE7_REASON_CODES.PROHIBITION_ACTIVE);
        }
        continue;
      }

      if (!isActivatingRouteEvidence(entry)) {
        hasInsufficient = true;
        reasonCodes.push(RULE7_REASON_CODES.EVIDENCE_NON_ACTIVATING);
        continue;
      }

      // Contradictory: same site already has a different activating route proposed.
      const priorSameSite = indications.find((i) => i.bodySiteRef === entry.bodySiteRef);
      if (priorSameSite && priorSameSite.routeCode !== entry.routeCode) {
        unresolved = true;
        blockers.push(RULE7_REASON_CODES.CONTRADICTORY_EVIDENCE);
        reasonCodes.push(RULE7_REASON_CODES.CONTRADICTORY_EVIDENCE);
        continue;
      }

      evidenceRefs.push(entry.evidenceSourceId);
      reasonCodes.push(RULE7_REASON_CODES.ELIGIBLE_BY_APPROVED_EVIDENCE);
      indications.push(
        buildIndication({
          indicationId: `IND_${entry.entryId}`,
          routeCode: entry.routeCode,
          bodySiteRef: entry.bodySiteRef,
          eligibilityState: 'ELIGIBLE',
          evidenceRefs: Object.freeze([entry.evidenceSourceId]),
          reasonCodes: Object.freeze([RULE7_REASON_CODES.ELIGIBLE_BY_APPROVED_EVIDENCE]),
        }),
      );
    }

    indications.sort((a, b) =>
      a.indicationId < b.indicationId ? -1 : a.indicationId > b.indicationId ? 1 : 0,
    );

    // Closed outcomes per contract §6.3 (not §7 — §7 is evidence gates).
    let status: Rule7Outcome;
    if (blockedBySafety) {
      status = 'BLOCKED_BY_SAFETY';
      indications.length = 0;
      evidenceRefs.length = 0;
    } else if (unresolved) {
      status = 'UNRESOLVED_EVIDENCE';
      indications.length = 0;
      evidenceRefs.length = 0;
    } else if (indications.length > 0) {
      status = 'SHADOW_ROUTE_INDICATIONS_PROPOSED';
    } else if (hasInsufficient || entries.length === 0) {
      status = 'NOT_CLINICALLY_INDICATED';
      reasonCodes.push(RULE7_REASON_CODES.NOT_CLINICALLY_INDICATED);
    } else {
      status = 'NOT_CLINICALLY_INDICATED';
      reasonCodes.push(RULE7_REASON_CODES.NOT_CLINICALLY_INDICATED);
    }

    const uniqueReasons = sortedUnique(reasonCodes);
    const uniqueEvidence = sortedUnique(evidenceRefs);
    const uniqueBlockers = sortedUnique(blockers);

    return buildOrderedOutput({
      contractVersion: RULE7_OUTPUT_CONTRACT_VERSION,
      ruleNumber: RULE7_RULE_NUMBER,
      ruleIdentity: RULE7_RULE_IDENTITY,
      requestId: input.requestId,
      status,
      applicability: 'APPLICABLE',
      evaluatedBodySites: Object.freeze(sites),
      routeIndications: Object.freeze(indications),
      notClinicallyIndicated:
        status === 'NOT_CLINICALLY_INDICATED'
          ? Object.freeze({
              reasons: Object.freeze(
                sortedUnique([
                  RULE7_REASON_CODES.NOT_CLINICALLY_INDICATED,
                  ...uniqueReasons.filter(
                    (r) => r !== RULE7_REASON_CODES.ELIGIBLE_BY_APPROVED_EVIDENCE,
                  ),
                ]),
              ),
            })
          : false,
      evidenceRefs: Object.freeze(uniqueEvidence),
      reasonCodes: Object.freeze(uniqueReasons),
      blockersOrUnresolvedEvidence: Object.freeze(uniqueBlockers),
      deterministicFingerprint: fingerprint([
        input.requestId,
        status,
        ...sites,
        ...indications.map((i) => i.indicationId),
        ...uniqueEvidence,
      ]),
      shadowOnly: true,
      clinicalActivation: 'NONE',
    });
  } catch (e) {
    if (e instanceof Rule7EvaluationError) throw e;
    throw new Rule7EvaluationError('INTERNAL_FAILURE');
  }
}
