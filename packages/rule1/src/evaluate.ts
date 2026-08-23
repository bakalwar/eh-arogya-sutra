import { getCatalogEntry, type Rule1CatalogEntry } from './catalog.js';
import {
  RULE1_BP_LYMPHATIC_SYSTOLIC_MAX_EXCLUSIVE,
  RULE1_BP_LYMPHATIC_WEIGHT,
  RULE1_BP_SANGUINE_SYSTOLIC_MIN,
  RULE1_BP_SANGUINE_WEIGHT,
  RULE1_REASON_CODES,
  RULE1_REPRESENTATION_ORDER,
} from './constants.js';
import { Rule1EvaluationError } from './errors.js';
import { deepFreeze } from './freeze.js';
import { computeCatalogFingerprint, sha256Hex } from './fingerprint.js';
import { computeHamiltonPercentages, sumPercentages } from './hamilton.js';
import type {
  Rule1AcceptedContribution,
  Rule1ExcludedEvidence,
  Rule1Input,
  Rule1Output,
  Rule1PercentageMap,
  Rule1RankedPercentageEntry,
  Rule1ScoreMap,
} from './types.js';
import { validateRule1Input } from './validateInput.js';
import {
  RULE1_CATALOG_VERSION,
  RULE1_INPUT_SCHEMA_VERSION,
  RULE1_ORCHESTRATION_STATUS,
  RULE1_OUTPUT_CONTRACT_VERSION,
  RULE1_PERCENTAGE_ALGORITHM,
  RULE1_PRESCRIPTION_EFFECT,
  RULE1_RULE_CONTRACT_VERSION,
  RULE1_RUNTIME_STATUS,
  RULE1_SCORING_ALGORITHM_VERSION,
} from './version.js';

type MutableScores = {
  BILIOUS: number;
  SANGUINE: number;
  LYMPHATIC: number;
  NERVOUS: number;
};

function emptyScores(): MutableScores {
  return { BILIOUS: 0, SANGUINE: 0, LYMPHATIC: 0, NERVOUS: 0 };
}

function inputFingerprintMaterial(input: Rule1Input): string {
  const ev = [...input.evidence]
    .map(
      (e) =>
        `${e.conceptId}|${e.sourceFactFingerprint}|${e.temporalPosture}|${e.negationPosture}|${e.acceptancePosture}`,
    )
    .sort();
  const bp = input.structuredVitals?.systolicBpMmHg;
  const bpPart = bp ? `bp:${bp.value}:${bp.unit}:${bp.validationPosture}` : 'bp:none';
  return [
    input.inputSchemaVersion,
    input.ruleContractVersion,
    input.consultationId,
    input.episodeId,
    ...ev,
    bpPart,
  ].join('\n');
}

function rankPercentages(
  scores: Rule1ScoreMap,
  percentages: Rule1PercentageMap,
): Rule1RankedPercentageEntry[] {
  const entries: Rule1RankedPercentageEntry[] = RULE1_REPRESENTATION_ORDER.map((t) => ({
    temperament: t,
    percentage: percentages[t],
    score: scores[t],
  }));
  entries.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return (
      RULE1_REPRESENTATION_ORDER.indexOf(a.temperament) -
      RULE1_REPRESENTATION_ORDER.indexOf(b.temperament)
    );
  });
  return entries;
}

function finish(out: Rule1Output): Rule1Output {
  return deepFreeze(out);
}

/**
 * Pure non-persistent Rule 1 v1 synthetic-shadow evaluator.
 * Catalog-driven; no raw-text parsing; no E2/medicine/API reachability.
 */
export function evaluateRule1Shadow(raw: unknown): Rule1Output {
  try {
    return evaluateValidated(validateRule1Input(raw));
  } catch (err) {
    if (err instanceof Rule1EvaluationError) throw err;
    throw new Rule1EvaluationError(
      'INTERNAL_FAILURE',
      err instanceof Error ? err.message : 'internal failure',
    );
  }
}

function evaluateValidated(input: Rule1Input): Rule1Output {
  const catalogFp = computeCatalogFingerprint();
  const inputFp = sha256Hex(inputFingerprintMaterial(input));
  const reasons: string[] = [];
  const excluded: Rule1ExcludedEvidence[] = [];
  const accepted: Rule1AcceptedContribution[] = [];
  const scores = emptyScores();

  // Sort evidence deterministically (caller order must not affect output).
  const sortedEvidence = [...input.evidence].sort((a, b) => {
    const c = a.conceptId.localeCompare(b.conceptId);
    if (c !== 0) return c;
    return a.sourceFactFingerprint.localeCompare(b.sourceFactFingerprint);
  });

  type Pending = {
    conceptId: string;
    fingerprint: string;
    entry: Rule1CatalogEntry;
  };
  const pending: Pending[] = [];
  const fingerprintsSeenInPending = new Map<string, string>(); // fp -> conceptId

  for (const ev of sortedEvidence) {
    const entry = getCatalogEntry(ev.conceptId);
    if (!entry) {
      throw new Rule1EvaluationError('UNKNOWN_CONCEPT_ID', `unknown conceptId`);
    }
    if (entry.isBpFeature) {
      // BP concepts are applied only via structured vitals, not evidence list.
      excluded.push({
        conceptId: ev.conceptId,
        sourceFactFingerprint: ev.sourceFactFingerprint,
        reasonCode: RULE1_REASON_CODES.BP_NOT_APPLICABLE,
      });
      continue;
    }
    if (ev.negationPosture === 'NEGATED') {
      excluded.push({
        conceptId: ev.conceptId,
        sourceFactFingerprint: ev.sourceFactFingerprint,
        reasonCode: RULE1_REASON_CODES.EXCLUDED_NEGATED,
      });
      continue;
    }
    if (ev.temporalPosture === 'HISTORICAL') {
      excluded.push({
        conceptId: ev.conceptId,
        sourceFactFingerprint: ev.sourceFactFingerprint,
        reasonCode: RULE1_REASON_CODES.EXCLUDED_HISTORICAL,
      });
      continue;
    }
    if (ev.acceptancePosture !== 'ACCEPTED') {
      excluded.push({
        conceptId: ev.conceptId,
        sourceFactFingerprint: ev.sourceFactFingerprint,
        reasonCode: RULE1_REASON_CODES.EXCLUDED_UNACCEPTED,
      });
      continue;
    }

    const priorConcept = fingerprintsSeenInPending.get(ev.sourceFactFingerprint);
    if (priorConcept && priorConcept !== ev.conceptId) {
      throw new Rule1EvaluationError(
        'CONFLICTING_CONCEPTS_SAME_FINGERPRINT',
        'same fingerprint cannot fund distinct concepts',
      );
    }
    fingerprintsSeenInPending.set(ev.sourceFactFingerprint, ev.conceptId);
    pending.push({
      conceptId: ev.conceptId,
      fingerprint: ev.sourceFactFingerprint,
      entry,
    });
  }

  const conceptCounts = new Map<string, number>();
  const usedFingerprints = new Set<string>();

  for (const item of pending) {
    const used = conceptCounts.get(item.conceptId) ?? 0;
    if (used >= item.entry.maxContributions) {
      excluded.push({
        conceptId: item.conceptId,
        sourceFactFingerprint: item.fingerprint,
        reasonCode: RULE1_REASON_CODES.DEDUPE_CONCEPT_CAP,
      });
      continue;
    }
    if (usedFingerprints.has(item.fingerprint)) {
      excluded.push({
        conceptId: item.conceptId,
        sourceFactFingerprint: item.fingerprint,
        reasonCode: RULE1_REASON_CODES.DEDUPE_FINGERPRINT,
      });
      continue;
    }
    usedFingerprints.add(item.fingerprint);
    conceptCounts.set(item.conceptId, used + 1);
    scores[item.entry.temperament] += item.entry.weight;
    accepted.push({
      conceptId: item.conceptId,
      sourceFactFingerprint: item.fingerprint,
      temperament: item.entry.temperament,
      weight: item.entry.weight,
      reasonCode: RULE1_REASON_CODES.EVIDENCE_ACCEPTED,
    });
    reasons.push(RULE1_REASON_CODES.EVIDENCE_ACCEPTED);
  }

  // Structured BP (max once each rule; Lymphatic requires non-BP Lymphatic support).
  const bp = input.structuredVitals?.systolicBpMmHg;
  const lymphaticNonBpPresent = accepted.some(
    (a) => a.temperament === 'LYMPHATIC' && !getCatalogEntry(a.conceptId)?.isBpFeature,
  );

  if (bp) {
    if (bp.validationPosture !== 'VALIDATED') {
      throw new Rule1EvaluationError('MALFORMED_VITAL', 'bp not validated');
    }
    if (bp.value >= RULE1_BP_SANGUINE_SYSTOLIC_MIN) {
      const fp = `structured-bp:ge140:${bp.value}`;
      if (!usedFingerprints.has(fp)) {
        usedFingerprints.add(fp);
        scores.SANGUINE += RULE1_BP_SANGUINE_WEIGHT;
        accepted.push({
          conceptId: 'R1_FEAT_SANGUINE_SYSTOLIC_BP_GE_140',
          sourceFactFingerprint: fp,
          temperament: 'SANGUINE',
          weight: RULE1_BP_SANGUINE_WEIGHT,
          reasonCode: RULE1_REASON_CODES.BP_SANGUINE_APPLIED,
        });
        reasons.push(RULE1_REASON_CODES.BP_SANGUINE_APPLIED);
        conceptCounts.set(
          'R1_FEAT_SANGUINE_SYSTOLIC_BP_GE_140',
          (conceptCounts.get('R1_FEAT_SANGUINE_SYSTOLIC_BP_GE_140') ?? 0) + 1,
        );
      }
    } else if (bp.value < RULE1_BP_LYMPHATIC_SYSTOLIC_MAX_EXCLUSIVE) {
      if (!lymphaticNonBpPresent) {
        reasons.push(RULE1_REASON_CODES.BP_LYMPHATIC_LACKS_NON_BP_SUPPORT);
      } else {
        const fp = `structured-bp:lt100:${bp.value}`;
        if (!usedFingerprints.has(fp)) {
          usedFingerprints.add(fp);
          scores.LYMPHATIC += RULE1_BP_LYMPHATIC_WEIGHT;
          accepted.push({
            conceptId: 'R1_FEAT_LYMPHATIC_SYSTOLIC_BP_LT_100',
            sourceFactFingerprint: fp,
            temperament: 'LYMPHATIC',
            weight: RULE1_BP_LYMPHATIC_WEIGHT,
            reasonCode: RULE1_REASON_CODES.BP_LYMPHATIC_APPLIED,
          });
          reasons.push(RULE1_REASON_CODES.BP_LYMPHATIC_APPLIED);
          conceptCounts.set(
            'R1_FEAT_LYMPHATIC_SYSTOLIC_BP_LT_100',
            (conceptCounts.get('R1_FEAT_LYMPHATIC_SYSTOLIC_BP_LT_100') ?? 0) + 1,
          );
        }
      }
    } else {
      reasons.push(RULE1_REASON_CODES.BP_NOT_APPLICABLE);
    }
  }

  const independentConceptCount = [...conceptCounts.keys()].filter((id) => {
    const e = getCatalogEntry(id);
    return e?.countsAsIndependentConcept !== false;
  }).length;

  const T = scores.BILIOUS + scores.SANGUINE + scores.LYMPHATIC + scores.NERVOUS;

  const baseMeta = {
    inputSchemaVersion: RULE1_INPUT_SCHEMA_VERSION,
    ruleContractVersion: RULE1_RULE_CONTRACT_VERSION,
    outputSchemaVersion: RULE1_OUTPUT_CONTRACT_VERSION,
    percentageAlgorithm: RULE1_PERCENTAGE_ALGORITHM,
    catalogVersion: RULE1_CATALOG_VERSION,
    scoringAlgorithmVersion: RULE1_SCORING_ALGORITHM_VERSION,
    catalogFingerprint: catalogFp,
    inputFingerprint: inputFp,
    acceptedContributions: accepted,
    excludedEvidence: excluded,
    clinicallyUsed: false as const,
    shadowOnly: true as const,
    clinicalActivation: 'NONE' as const,
    medicineSelectionInfluence: 'NONE' as const,
    prescriptionEffect: RULE1_PRESCRIPTION_EFFECT,
    orchestrationStatus: RULE1_ORCHESTRATION_STATUS,
    runtimeStatus: RULE1_RUNTIME_STATUS,
  };

  if (independentConceptCount < 2 || T <= 0) {
    reasons.push(RULE1_REASON_CODES.INSUFFICIENT_EVIDENCE);
    return finish({
      ...baseMeta,
      status: 'TEMPERAMENT_INSUFFICIENT_EVIDENCE',
      mixedSubtype: null,
      primaryTemperament: null,
      dominantTemperaments: null,
      scores,
      percentages: null,
      rankedPercentageProfile: null,
      reasonCodes: uniqueReasons(reasons),
    });
  }

  // Thermal contradiction (IMPL-05-CORR): current systemic heat+cold same consultation/episode.
  // Synthetic input binds consultationId+episodeId globally; accepted CURRENT systemic HEAT and COLD.
  const heat = accepted.some((a) => getCatalogEntry(a.conceptId)?.thermalAxis === 'HEAT');
  const cold = accepted.some((a) => getCatalogEntry(a.conceptId)?.thermalAxis === 'COLD');
  if (heat && cold) {
    // Same consultation/episode is inherent to single Rule1Input.
    reasons.push(RULE1_REASON_CODES.THERMAL_CONTRADICTION);
    const percentages = computeHamiltonPercentages(scores);
    if (sumPercentages(percentages) !== 100) {
      throw new Rule1EvaluationError('INTERNAL_FAILURE', 'percentage sum invariant');
    }
    return finish({
      ...baseMeta,
      status: 'TEMPERAMENT_CONTRADICTORY',
      mixedSubtype: null,
      primaryTemperament: null,
      dominantTemperaments: null,
      scores,
      percentages,
      rankedPercentageProfile: rankPercentages(scores, percentages),
      reasonCodes: uniqueReasons(reasons),
    });
  }

  const percentages = computeHamiltonPercentages(scores);
  if (sumPercentages(percentages) !== 100) {
    throw new Rule1EvaluationError('INTERNAL_FAILURE', 'percentage sum invariant');
  }
  const ranked = rankPercentages(scores, percentages);

  const max = Math.max(scores.BILIOUS, scores.SANGUINE, scores.LYMPHATIC, scores.NERVOUS);
  const tops = RULE1_REPRESENTATION_ORDER.filter((t) => scores[t] === max && max > 0);

  if (tops.length === 1) {
    reasons.push(RULE1_REASON_CODES.PROFILE_RESOLVED);
    reasons.push(RULE1_REASON_CODES.NO_SINGULAR_SECONDARY);
    reasons.push(RULE1_REASON_CODES.BILIOUS_CANONICAL);
    return finish({
      ...baseMeta,
      status: 'TEMPERAMENT_PROFILE_RESOLVED',
      mixedSubtype: null,
      primaryTemperament: tops[0]!,
      dominantTemperaments: null,
      scores,
      percentages,
      rankedPercentageProfile: ranked,
      reasonCodes: uniqueReasons(reasons),
    });
  }

  const subtype = tops.length === 2 ? 'DUAL_TEMPERAMENT' : 'MULTI_TEMPERAMENT';
  reasons.push(
    subtype === 'DUAL_TEMPERAMENT' ? RULE1_REASON_CODES.MIXED_DUAL : RULE1_REASON_CODES.MIXED_MULTI,
  );
  reasons.push(RULE1_REASON_CODES.NO_SINGULAR_SECONDARY);
  return finish({
    ...baseMeta,
    status: 'MIXED_TEMPERAMENT',
    mixedSubtype: subtype,
    primaryTemperament: null,
    dominantTemperaments: tops,
    scores,
    percentages,
    rankedPercentageProfile: ranked,
    reasonCodes: uniqueReasons(reasons),
  });
}

function uniqueReasons(codes: string[]): string[] {
  return [...new Set(codes)];
}
