import {
  bandFromScore,
  bandsMatch,
  isValidBand,
  isValidIntegerScore,
  type Rule4SeverityBand,
} from './severityScale.js';
import type {
  Rule4FormulaSeverityRecord,
  Rule4SeverityEvidenceAssertion,
  Rule4SeverityEvidenceSourceTier,
  Rule4SeverityResolutionSource,
  Rule4SeverityStatus,
  Rule4SlotSeverityResolution,
} from './types.js';

const NON_EXECUTABLE_TIERS = new Set<Rule4SeverityEvidenceSourceTier>([
  'INVALID_ITEM',
  'INVALID_SCORE',
  'INVALID_BAND',
  'VAGUE_TEXT',
  'REGISTRY_KEYWORD',
  'NEGATED',
  'UNVERIFIED',
  'STRUCTURED_SEVERITY_AMBIGUOUS',
]);

const INVALID_ONLY_TIERS = new Set<Rule4SeverityEvidenceSourceTier>([
  'INVALID_ITEM',
  'INVALID_SCORE',
  'INVALID_BAND',
  'NEGATED',
  'UNVERIFIED',
]);

type UsableEntry = {
  evidenceItemId: string;
  score: number | null;
  band: Rule4SeverityBand;
  tier: Rule4SeverityEvidenceSourceTier;
  sequenceToken: string;
  dedupeKey: string;
  parentSourceId: string | null;
};

function emptySlot(
  record: Rule4FormulaSeverityRecord,
  partial: Partial<Rule4SlotSeverityResolution>,
): Rule4SlotSeverityResolution {
  return {
    formulaSlotId: record.formulaSlotId,
    formulaTargetId: record.formulaTargetId,
    targetRole: record.targetRole,
    severityStatus: 'NOT_EVALUATED',
    severityScore: null,
    severityBand: null,
    severityResolutionSource: 'NONE',
    bindingStatus: 'BOUND',
    evidenceItemIds: [],
    corroboratingSourceIds: [],
    selectedCascade: null,
    selectedDilution: null,
    reasonCodes: [],
    limitationCodes: ['PHASE6_NO_NUMERIC_CASCADE'],
    upstreamContextStatus: 'NOT_EVALUATED',
    ...partial,
  };
}

function parseAssertion(a: Rule4SeverityEvidenceAssertion): {
  usable: UsableEntry | null;
  scoreBandMismatch: boolean;
} {
  if (NON_EXECUTABLE_TIERS.has(a.sourceTier)) {
    return { usable: null, scoreBandMismatch: false };
  }

  const scoreOk = a.severityScore != null && isValidIntegerScore(a.severityScore);
  const bandOk = a.severityBand != null && isValidBand(a.severityBand);

  if (a.sourceTier === 'DOCTOR_STRUCTURED' || a.sourceTier === 'INDEPENDENT_USABLE') {
    if (scoreOk && bandOk && !bandsMatch(a.severityScore!, a.severityBand!)) {
      return { usable: null, scoreBandMismatch: true };
    }
    if (scoreOk && bandOk) {
      return {
        usable: {
          evidenceItemId: a.evidenceItemId,
          score: a.severityScore!,
          band: a.severityBand!,
          tier: a.sourceTier,
          sequenceToken: a.sequenceToken,
          dedupeKey: a.dedupeKey,
          parentSourceId: a.parentSourceId ?? null,
        },
        scoreBandMismatch: false,
      };
    }
    if (scoreOk) {
      const band = bandFromScore(a.severityScore!);
      return {
        usable: {
          evidenceItemId: a.evidenceItemId,
          score: a.severityScore!,
          band,
          tier: a.sourceTier,
          sequenceToken: a.sequenceToken,
          dedupeKey: a.dedupeKey,
          parentSourceId: a.parentSourceId ?? null,
        },
        scoreBandMismatch: false,
      };
    }
    if (bandOk) {
      return {
        usable: {
          evidenceItemId: a.evidenceItemId,
          score: null,
          band: a.severityBand!,
          tier: a.sourceTier,
          sequenceToken: a.sequenceToken,
          dedupeKey: a.dedupeKey,
          parentSourceId: a.parentSourceId ?? null,
        },
        scoreBandMismatch: false,
      };
    }
  }
  return { usable: null, scoreBandMismatch: false };
}

function buildUsablePool(assertions: readonly Rule4SeverityEvidenceAssertion[]): {
  usable: UsableEntry[];
  hasScoreBandMismatch: boolean;
  hasExplicitAmbiguous: boolean;
  hasInvalidSubmitted: boolean;
} {
  const byDedupe = new Map<string, UsableEntry>();
  let hasScoreBandMismatch = false;
  let hasExplicitAmbiguous = false;
  let hasInvalidSubmitted = false;

  for (const a of assertions) {
    if (a.sourceTier === 'STRUCTURED_SEVERITY_AMBIGUOUS') {
      hasExplicitAmbiguous = true;
      continue;
    }
    if (INVALID_ONLY_TIERS.has(a.sourceTier)) {
      hasInvalidSubmitted = true;
      continue;
    }
    const parsed = parseAssertion(a);
    if (parsed.scoreBandMismatch) {
      hasScoreBandMismatch = true;
      continue;
    }
    if (!parsed.usable) {
      if (a.sourceTier === 'DOCTOR_STRUCTURED' || a.sourceTier === 'INDEPENDENT_USABLE') {
        hasInvalidSubmitted = true;
      }
      continue;
    }
    const existing = byDedupe.get(a.dedupeKey);
    if (!existing || a.sequenceToken.localeCompare(existing.sequenceToken) > 0) {
      byDedupe.set(a.dedupeKey, parsed.usable);
    }
  }

  return {
    usable: [...byDedupe.values()],
    hasScoreBandMismatch,
    hasExplicitAmbiguous,
    hasInvalidSubmitted,
  };
}

function resolveSameTimestampGroup(entries: UsableEntry[]): {
  status: Rule4SeverityStatus;
  score: number | null;
  band: Rule4SeverityBand | null;
  contradictory: boolean;
} {
  const scores = entries.map((e) => e.score).filter((s): s is number => s != null);
  const bands = [...new Set(entries.map((e) => e.band))];
  if (bands.length > 1) {
    return { status: 'SEVERITY_CONTRADICTORY', score: null, band: null, contradictory: true };
  }
  const band = bands[0]!;
  if (scores.length === 0) {
    return { status: 'RESOLVED_BAND_ONLY', score: null, band, contradictory: false };
  }
  const uniqueScores = [...new Set(scores)];
  if (uniqueScores.length === 1) {
    return {
      status: 'RESOLVED_NUMERIC',
      score: uniqueScores[0]!,
      band,
      contradictory: false,
    };
  }
  if (uniqueScores.every((s) => bandFromScore(s) === band)) {
    return { status: 'RESOLVED_BAND_ONLY', score: null, band, contradictory: false };
  }
  return { status: 'SEVERITY_CONTRADICTORY', score: null, band: null, contradictory: true };
}

function resolveCorroboration(entries: UsableEntry[]): {
  status: Rule4SeverityStatus;
  score: number | null;
  band: Rule4SeverityBand | null;
  source: Rule4SeverityResolutionSource;
} {
  const doctor = entries.filter((e) => e.tier === 'DOCTOR_STRUCTURED');
  if (doctor.length === 1) {
    const d = doctor[0]!;
    return {
      status: d.score != null ? 'RESOLVED_NUMERIC' : 'RESOLVED_BAND_ONLY',
      score: d.score,
      band: d.band,
      source: 'DOCTOR_STRUCTURED',
    };
  }
  if (doctor.length > 1) {
    const g = resolveSameTimestampGroup(doctor);
    if (g.contradictory) {
      return {
        status: 'SEVERITY_CONTRADICTORY',
        score: null,
        band: null,
        source: 'NONE',
      };
    }
    return {
      status: g.status,
      score: g.score,
      band: g.band,
      source: 'DOCTOR_STRUCTURED',
    };
  }

  const independent = entries.filter((e) => e.tier === 'INDEPENDENT_USABLE');
  if (independent.length === 0) {
    return {
      status: 'MISSING_EVIDENCE',
      score: null,
      band: null,
      source: 'NONE',
    };
  }
  if (independent.length === 1) {
    return {
      status: 'INSUFFICIENT_CORROBORATION',
      score: null,
      band: null,
      source: 'NONE',
    };
  }

  const byTime = new Map<string, UsableEntry[]>();
  for (const e of independent) {
    const list = byTime.get(e.sequenceToken) ?? [];
    list.push(e);
    byTime.set(e.sequenceToken, list);
  }
  if (byTime.size > 1) {
    const bands = new Set<Rule4SeverityBand>();
    for (const e of independent) {
      bands.add(e.band);
    }
    if (bands.size > 1) {
      return {
        status: 'SEVERITY_CONTRADICTORY',
        score: null,
        band: null,
        source: 'NONE',
      };
    }
  }

  const group = independent;
  const g = resolveSameTimestampGroup(group);
  if (g.contradictory) {
    return {
      status: 'SEVERITY_CONTRADICTORY',
      score: null,
      band: null,
      source: 'NONE',
    };
  }
  return {
    status: g.status,
    score: g.score,
    band: g.band,
    source:
      g.status === 'RESOLVED_BAND_ONLY' ? 'INDEPENDENT_CORROBORATION' : 'INDEPENDENT_CORROBORATION',
  };
}

export function resolveSeverityForSlot(
  record: Rule4FormulaSeverityRecord,
): Rule4SlotSeverityResolution {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = ['PHASE6_NO_NUMERIC_CASCADE'];

  if (record.patientGlobalMaxSeverityLabelOnly) {
    return emptySlot(record, {
      severityStatus: 'SEVERITY_CONTRADICTORY',
      reasonCodes: [...reasonCodes, 'GLOBAL_SEVERITY_LEAKAGE_BLOCKED'],
      limitationCodes,
    });
  }

  const hasVague = record.severityEvidenceAssertions.some((a) => a.sourceTier === 'VAGUE_TEXT');
  const hasRegistry = record.severityEvidenceAssertions.some(
    (a) => a.sourceTier === 'REGISTRY_KEYWORD',
  );
  if (hasVague) {
    reasonCodes.push('VAGUE_TIMELINE_NOT_EXECUTABLE');
  }
  if (hasRegistry) {
    reasonCodes.push('REGISTRY_Q13_SELECTOR_BLOCKED');
  }

  const pool = buildUsablePool(record.severityEvidenceAssertions);

  if (pool.hasScoreBandMismatch) {
    return emptySlot(record, {
      severityStatus: 'SEVERITY_CONTRADICTORY',
      reasonCodes: [...reasonCodes, 'SEVERITY_SCORE_BAND_MISMATCH'],
      limitationCodes,
    });
  }

  if (pool.hasExplicitAmbiguous && pool.usable.length === 0) {
    return emptySlot(record, {
      severityStatus: 'INSUFFICIENT_CORROBORATION',
      evidenceItemIds: record.severityEvidenceAssertions
        .filter((a) => a.sourceTier === 'STRUCTURED_SEVERITY_AMBIGUOUS')
        .map((a) => a.evidenceItemId),
      reasonCodes: [...reasonCodes, 'SEVERITY_EVIDENCE_AMBIGUOUS'],
      limitationCodes: [...limitationCodes, 'SEVERITY_AMBIGUOUS'],
    });
  }

  if (pool.usable.length === 0) {
    if (record.severityEvidenceAssertions.length === 0) {
      return emptySlot(record, {
        severityStatus: 'MISSING_EVIDENCE',
        reasonCodes: [...reasonCodes, 'SEVERITY_VALUE_MISSING'],
        limitationCodes,
      });
    }
    if (pool.hasInvalidSubmitted) {
      return emptySlot(record, {
        severityStatus: 'INVALID_EVIDENCE',
        reasonCodes: [...reasonCodes, 'INVALID_SEVERITY_NUMERIC_VALUE'],
        limitationCodes,
      });
    }
    return emptySlot(record, {
      severityStatus: 'MISSING_EVIDENCE',
      reasonCodes: [...reasonCodes, 'SEVERITY_VALUE_MISSING'],
      limitationCodes,
    });
  }

  const resolved = resolveCorroboration(pool.usable);
  const extraReason =
    resolved.status === 'INSUFFICIENT_CORROBORATION'
      ? []
      : ['SEVERITY_ALONE_NOT_A_POTENCY_SELECTOR'];

  return emptySlot(record, {
    severityStatus: resolved.status,
    severityScore: resolved.score,
    severityBand: resolved.band,
    severityResolutionSource: resolved.source,
    evidenceItemIds: pool.usable.map((u) => u.evidenceItemId),
    corroboratingSourceIds: [
      ...new Set(pool.usable.map((u) => u.parentSourceId).filter(Boolean) as string[]),
    ].sort(),
    reasonCodes: [...reasonCodes, ...extraReason].filter(Boolean).sort(),
    limitationCodes,
  });
}
