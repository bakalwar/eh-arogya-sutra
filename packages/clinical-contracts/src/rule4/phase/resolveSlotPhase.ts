import { fallbackPhaseFromDurationDays } from './dayBands.js';
import {
  inclusiveDurationDays,
  isValidPositiveIntegerDuration,
  parseIsoDateOnly,
} from './durationCalendar.js';
import type {
  Rule4ClinicalPhase,
  Rule4DurationConsistencyStatus,
  Rule4FlareStatus,
  Rule4FormulaPhaseRecord,
  Rule4PhaseEvidenceAssertion,
  Rule4PhaseResolutionSource,
  Rule4PhaseStatus,
  Rule4SlotPhaseResolution,
} from './types.js';

function emptySlot(
  record: Rule4FormulaPhaseRecord,
  partial: Partial<Rule4SlotPhaseResolution>,
): Rule4SlotPhaseResolution {
  return {
    formulaSlotId: record.formulaSlotId,
    formulaTargetId: record.formulaTargetId,
    phaseStatus: 'NOT_EVALUATED',
    resolvedPhase: null,
    phaseResolutionSource: 'NONE',
    calculatedDurationDays: null,
    suppliedDurationDays: null,
    durationConsistencyStatus: 'NONE',
    baselinePhase: record.baselinePhase ?? null,
    currentManifestationPhase: record.currentManifestationPhase ?? null,
    targetRole: record.targetRole,
    flareStatus: 'NOT_APPLICABLE',
    evidenceItemIds: [],
    selectedCascade: null,
    selectedDilution: null,
    reasonCodes: [],
    limitationCodes: ['PHASE5_NO_NUMERIC_CASCADE'],
    ...partial,
  };
}

const NON_EXECUTABLE_ASSERTION_TIERS = new Set([
  'INVALID_ITEM',
  'VAGUE_TIMELINE',
  'REGISTRY_KEYWORD',
  'NEGATED',
  'UNVERIFIED',
  'STRUCTURED_PHASE_AMBIGUOUS',
]);

function explicitlyAmbiguousAssertions(
  assertions: readonly Rule4PhaseEvidenceAssertion[],
): Rule4PhaseEvidenceAssertion[] {
  return assertions.filter((a) => a.sourceTier === 'STRUCTURED_PHASE_AMBIGUOUS');
}

const INVALID_ONLY_ASSERTION_TIERS = new Set(['INVALID_ITEM', 'NEGATED', 'UNVERIFIED']);

function isInvalidOnlyAssertionPool(assertions: readonly Rule4PhaseEvidenceAssertion[]): boolean {
  if (assertions.length === 0) {
    return false;
  }
  return assertions.every((a) => INVALID_ONLY_ASSERTION_TIERS.has(a.sourceTier));
}

function executableAssertions(
  assertions: readonly Rule4PhaseEvidenceAssertion[],
): Rule4PhaseEvidenceAssertion[] {
  const seenDedupe = new Set<string>();
  const byDedupe = new Map<string, Rule4PhaseEvidenceAssertion>();
  for (const a of assertions) {
    if (NON_EXECUTABLE_ASSERTION_TIERS.has(a.sourceTier) || !a.phaseLabel) {
      continue;
    }
    const existing = byDedupe.get(a.dedupeKey);
    if (!existing || a.sequenceToken.localeCompare(existing.sequenceToken) > 0) {
      byDedupe.set(a.dedupeKey, a);
    }
    seenDedupe.add(a.dedupeKey);
  }
  return [...byDedupe.values()];
}

function countByPhase(items: Rule4PhaseEvidenceAssertion[]): Map<Rule4ClinicalPhase, number> {
  const m = new Map<Rule4ClinicalPhase, number>();
  for (const i of items) {
    if (!i.phaseLabel) {
      continue;
    }
    m.set(i.phaseLabel, (m.get(i.phaseLabel) ?? 0) + 1);
  }
  return m;
}

function resolveDuration(record: Rule4FormulaPhaseRecord): {
  calculated: number | null;
  supplied: number | null;
  consistency: Rule4DurationConsistencyStatus;
  effective: number | null;
  invalidDates: boolean;
} {
  const onsetPresent = record.structuredOnsetDate != null && record.structuredOnsetDate !== '';
  const assessPresent =
    record.consultationAssessmentDate != null && record.consultationAssessmentDate !== '';
  const hasRaw = record.rawDurationDays != null;

  if (onsetPresent && !parseIsoDateOnly(record.structuredOnsetDate)) {
    return {
      calculated: null,
      supplied:
        hasRaw && isValidPositiveIntegerDuration(record.rawDurationDays!)
          ? record.rawDurationDays!
          : null,
      consistency: 'INVALID_DATES',
      effective: null,
      invalidDates: true,
    };
  }
  if (assessPresent && !parseIsoDateOnly(record.consultationAssessmentDate)) {
    return {
      calculated: null,
      supplied:
        hasRaw && isValidPositiveIntegerDuration(record.rawDurationDays!)
          ? record.rawDurationDays!
          : null,
      consistency: 'INVALID_DATES',
      effective: null,
      invalidDates: true,
    };
  }

  const bothDates = onsetPresent && assessPresent;
  const calc = bothDates
    ? inclusiveDurationDays(record.structuredOnsetDate, record.consultationAssessmentDate)
    : { days: null, invalid: false };

  if (calc.invalid) {
    return {
      calculated: null,
      supplied:
        hasRaw && isValidPositiveIntegerDuration(record.rawDurationDays!)
          ? record.rawDurationDays!
          : null,
      consistency: 'INVALID_DATES',
      effective: null,
      invalidDates: true,
    };
  }

  const supplied =
    hasRaw && isValidPositiveIntegerDuration(record.rawDurationDays!)
      ? record.rawDurationDays!
      : null;

  if (bothDates && calc.days != null && supplied != null) {
    if (calc.days !== supplied) {
      return {
        calculated: calc.days,
        supplied,
        consistency: 'MISMATCH',
        effective: null,
        invalidDates: false,
      };
    }
    return {
      calculated: calc.days,
      supplied,
      consistency: 'MATCH',
      effective: calc.days,
      invalidDates: false,
    };
  }
  if (bothDates && calc.days != null) {
    return {
      calculated: calc.days,
      supplied: null,
      consistency: 'CALCULATED_ONLY',
      effective: calc.days,
      invalidDates: false,
    };
  }
  if (onsetPresent !== assessPresent && supplied != null) {
    return {
      calculated: null,
      supplied,
      consistency: 'INCOMPLETE_DATES',
      effective: supplied,
      invalidDates: false,
    };
  }
  if (onsetPresent !== assessPresent && supplied == null) {
    return {
      calculated: null,
      supplied: null,
      consistency: 'INCOMPLETE_DATES',
      effective: null,
      invalidDates: false,
    };
  }
  if (supplied != null) {
    return {
      calculated: null,
      supplied,
      consistency: 'SUPPLIED_ONLY',
      effective: supplied,
      invalidDates: false,
    };
  }
  return {
    calculated: null,
    supplied: null,
    consistency: 'NONE',
    effective: null,
    invalidDates: false,
  };
}

function tryCrossBoundaryAcuteSubAcute(
  fallback: Rule4ClinicalPhase,
  counts: Map<Rule4ClinicalPhase, number>,
  doctorStructured: Rule4ClinicalPhase | null,
): { phase: Rule4ClinicalPhase | null; source: Rule4PhaseResolutionSource; limitation: string[] } {
  if (fallback === 'ACUTE') {
    const sub = counts.get('SUB_ACUTE') ?? 0;
    const ac = counts.get('ACUTE') ?? 0;
    if (doctorStructured === 'SUB_ACUTE' || sub > ac) {
      if (doctorStructured === 'SUB_ACUTE' || sub >= 2) {
        return { phase: 'SUB_ACUTE', source: 'CROSS_BOUNDARY_OVERRIDE', limitation: [] };
      }
      if (sub === 1 && ac === 0) {
        return {
          phase: fallback,
          source: 'DAY_BAND',
          limitation: ['INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE'],
        };
      }
    }
    if (sub === ac && sub > 0) {
      return { phase: null, source: 'NONE', limitation: [] };
    }
    return { phase: fallback, source: 'DAY_BAND', limitation: [] };
  }
  if (fallback === 'SUB_ACUTE') {
    const ac = counts.get('ACUTE') ?? 0;
    const sub = counts.get('SUB_ACUTE') ?? 0;
    if (doctorStructured === 'ACUTE' || ac > sub) {
      if (doctorStructured === 'ACUTE' || ac >= 2) {
        return { phase: 'ACUTE', source: 'CROSS_BOUNDARY_OVERRIDE', limitation: [] };
      }
      if (ac === 1 && sub === 0) {
        return {
          phase: fallback,
          source: 'DAY_BAND',
          limitation: ['INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE'],
        };
      }
    }
    if (sub === ac && ac > 0) {
      return { phase: null, source: 'NONE', limitation: [] };
    }
    return { phase: fallback, source: 'DAY_BAND', limitation: [] };
  }
  return { phase: fallback, source: 'DAY_BAND', limitation: [] };
}

function tryChronicCrossBoundary(
  fallback: Rule4ClinicalPhase,
  counts: Map<Rule4ClinicalPhase, number>,
  doctorStructured: Rule4ClinicalPhase | null,
): { phase: Rule4ClinicalPhase | null; source: Rule4PhaseResolutionSource; limitation: string[] } {
  if (fallback === 'CHRONIC_MODERATE') {
    const deep = counts.get('DEEP_CHRONIC') ?? 0;
    const mod = counts.get('CHRONIC_MODERATE') ?? 0;
    if (deep > mod && deep >= 2) {
      return { phase: 'DEEP_CHRONIC', source: 'CROSS_BOUNDARY_OVERRIDE', limitation: [] };
    }
    if (deep === mod && deep > 0) {
      return { phase: null, source: 'NONE', limitation: [] };
    }
    if (deep === 1 && mod === 0) {
      return {
        phase: fallback,
        source: 'DAY_BAND',
        limitation: ['INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE'],
      };
    }
    return { phase: fallback, source: 'DAY_BAND', limitation: [] };
  }
  if (fallback === 'DEEP_CHRONIC') {
    const mod = counts.get('CHRONIC_MODERATE') ?? 0;
    const deep = counts.get('DEEP_CHRONIC') ?? 0;
    if (doctorStructured === 'CHRONIC_MODERATE' || mod > deep) {
      if (doctorStructured === 'CHRONIC_MODERATE' || mod >= 2) {
        return { phase: 'CHRONIC_MODERATE', source: 'CROSS_BOUNDARY_OVERRIDE', limitation: [] };
      }
    }
    if (mod === deep && mod > 0) {
      return { phase: null, source: 'NONE', limitation: [] };
    }
    return { phase: fallback, source: 'DAY_BAND', limitation: [] };
  }
  return { phase: fallback, source: 'DAY_BAND', limitation: [] };
}

function resolveFromEvidenceOnly(usable: Rule4PhaseEvidenceAssertion[]): {
  phase: Rule4ClinicalPhase | null;
  ambiguous: boolean;
  contradictory: boolean;
} {
  const counts = countByPhase(usable);
  const labels = [...counts.keys()];
  if (labels.length === 0) {
    return { phase: null, ambiguous: false, contradictory: false };
  }
  if (labels.length === 1) {
    return { phase: labels[0]!, ambiguous: false, contradictory: false };
  }
  const max = Math.max(...[...counts.values()]);
  const top = labels.filter((l) => (counts.get(l) ?? 0) === max);
  if (top.length > 1) {
    return { phase: null, ambiguous: false, contradictory: true };
  }
  const second = Math.max(...labels.filter((l) => l !== top[0]).map((l) => counts.get(l) ?? 0));
  if (second === max) {
    return { phase: null, ambiguous: false, contradictory: true };
  }
  return { phase: top[0]!, ambiguous: false, contradictory: false };
}

export function resolvePhaseForSlot(record: Rule4FormulaPhaseRecord): Rule4SlotPhaseResolution {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = ['PHASE5_NO_NUMERIC_CASCADE'];

  if (record.patientGlobalAcuteOnChronicLabelOnly) {
    return emptySlot(record, {
      phaseStatus: 'PHASE_TARGET_CONTRADICTORY',
      reasonCodes: [...reasonCodes, 'ACUTE_CHRONIC_TARGET_SEPARATION_FAILED'],
      limitationCodes,
    });
  }

  const hasVague = record.phaseEvidenceAssertions.some((a) => a.sourceTier === 'VAGUE_TIMELINE');
  const hasRegistry = record.phaseEvidenceAssertions.some(
    (a) => a.sourceTier === 'REGISTRY_KEYWORD',
  );
  if (hasVague) {
    reasonCodes.push('VAGUE_TIMELINE_NOT_EXECUTABLE');
  }
  if (hasRegistry) {
    reasonCodes.push('REGISTRY_Q12_SELECTOR_BLOCKED');
  }

  if (record.targetRole === 'CURRENT_ACUTE_FLARE') {
    if (!record.verifiedChronicBaseline || record.flareSeparationSafe === false) {
      return emptySlot(record, {
        phaseStatus: 'PHASE_TARGET_CONTRADICTORY',
        flareStatus: 'SEPARATION_FAILED',
        reasonCodes: [...reasonCodes, 'ACUTE_CHRONIC_TARGET_SEPARATION_FAILED'],
        limitationCodes,
      });
    }
  }

  const dur = resolveDuration(record);
  if (dur.consistency === 'MISMATCH') {
    return emptySlot(record, {
      phaseStatus: 'PHASE_CONTRADICTORY',
      calculatedDurationDays: dur.calculated,
      suppliedDurationDays: dur.supplied,
      durationConsistencyStatus: 'MISMATCH',
      reasonCodes: [...reasonCodes, 'PHASE_CONTRADICTORY'],
      limitationCodes,
    });
  }

  if (dur.invalidDates) {
    const usable = executableAssertions(record.phaseEvidenceAssertions);
    const ev = resolveFromEvidenceOnly(usable);
    if (ev.phase) {
      return emptySlot(record, {
        phaseStatus: 'RESOLVED_BY_EVIDENCE',
        resolvedPhase: ev.phase,
        phaseResolutionSource: 'STRUCTURED_EVIDENCE',
        durationConsistencyStatus: 'INVALID_DATES',
        evidenceItemIds: usable.map((u) => u.evidenceItemId),
        limitationCodes: [...limitationCodes, 'INVALID_DURATION_IGNORED'],
        reasonCodes,
      });
    }
    return emptySlot(record, {
      phaseStatus: 'INVALID_DURATION',
      durationConsistencyStatus: 'INVALID_DATES',
      reasonCodes: [...reasonCodes, 'PHASE_EVIDENCE_INVALID'],
      limitationCodes,
    });
  }

  const usable = executableAssertions(record.phaseEvidenceAssertions);
  const doctorStructured =
    usable.find((a) => a.sourceTier === 'DOCTOR_STRUCTURED')?.phaseLabel ?? null;
  const counts = countByPhase(usable);

  if (dur.effective == null && usable.length === 0) {
    const explicitAmbiguous = explicitlyAmbiguousAssertions(record.phaseEvidenceAssertions);
    if (explicitAmbiguous.length > 0) {
      return emptySlot(record, {
        phaseStatus: 'PHASE_AMBIGUOUS',
        durationConsistencyStatus: dur.consistency,
        evidenceItemIds: explicitAmbiguous.map((a) => a.evidenceItemId),
        reasonCodes: [...reasonCodes, 'PHASE_EVIDENCE_AMBIGUOUS'],
        limitationCodes,
      });
    }
    if (isInvalidOnlyAssertionPool(record.phaseEvidenceAssertions)) {
      return emptySlot(record, {
        phaseStatus: 'INVALID_EVIDENCE',
        durationConsistencyStatus: dur.consistency,
        reasonCodes: [...reasonCodes, 'PHASE_EVIDENCE_INVALID'],
        limitationCodes,
      });
    }
    return emptySlot(record, {
      phaseStatus: 'MISSING_EVIDENCE',
      durationConsistencyStatus: dur.consistency,
      reasonCodes: [...reasonCodes, 'PHASE_EVIDENCE_MISSING'],
      limitationCodes,
    });
  }

  if (dur.effective == null && usable.length > 0) {
    const ev = resolveFromEvidenceOnly(usable);
    if (ev.contradictory) {
      return emptySlot(record, {
        phaseStatus: 'PHASE_CONTRADICTORY',
        durationConsistencyStatus: dur.consistency,
        evidenceItemIds: usable.map((u) => u.evidenceItemId),
        reasonCodes: [...reasonCodes, 'PHASE_CONTRADICTORY'],
        limitationCodes,
      });
    }
    if (ev.ambiguous || !ev.phase) {
      return emptySlot(record, {
        phaseStatus: 'PHASE_AMBIGUOUS',
        durationConsistencyStatus: dur.consistency,
        evidenceItemIds: usable.map((u) => u.evidenceItemId),
        reasonCodes: [...reasonCodes, 'PHASE_EVIDENCE_AMBIGUOUS'],
        limitationCodes,
      });
    }
    return emptySlot(record, {
      phaseStatus: 'RESOLVED_BY_EVIDENCE',
      resolvedPhase: ev.phase,
      phaseResolutionSource: 'STRUCTURED_EVIDENCE',
      durationConsistencyStatus: dur.consistency,
      evidenceItemIds: usable.map((u) => u.evidenceItemId),
      reasonCodes,
      limitationCodes,
    });
  }

  const fallback = fallbackPhaseFromDurationDays(dur.effective!);
  let resolved: Rule4ClinicalPhase | null = fallback;
  let source: Rule4PhaseResolutionSource = 'DAY_BAND';
  let extraLim: string[] = [];

  if (usable.length > 0) {
    const acuteSub = tryCrossBoundaryAcuteSubAcute(fallback, counts, doctorStructured);
    if (acuteSub.phase == null && fallback !== 'CHRONIC_MODERATE' && fallback !== 'DEEP_CHRONIC') {
      return emptySlot(record, {
        phaseStatus: 'PHASE_CONTRADICTORY',
        calculatedDurationDays: dur.calculated,
        suppliedDurationDays: dur.supplied,
        durationConsistencyStatus: dur.consistency,
        evidenceItemIds: usable.map((u) => u.evidenceItemId),
        reasonCodes: [...reasonCodes, 'PHASE_CONTRADICTORY'],
        limitationCodes,
      });
    }
    if (acuteSub.phase != null && (fallback === 'ACUTE' || fallback === 'SUB_ACUTE')) {
      resolved = acuteSub.phase;
      source = acuteSub.source;
      extraLim = acuteSub.limitation;
    } else {
      const chronic = tryChronicCrossBoundary(fallback, counts, doctorStructured);
      if (chronic.phase == null) {
        return emptySlot(record, {
          phaseStatus: 'PHASE_CONTRADICTORY',
          calculatedDurationDays: dur.calculated,
          suppliedDurationDays: dur.supplied,
          durationConsistencyStatus: dur.consistency,
          evidenceItemIds: usable.map((u) => u.evidenceItemId),
          reasonCodes: [...reasonCodes, 'PHASE_CONTRADICTORY'],
          limitationCodes,
        });
      }
      resolved = chronic.phase;
      source = chronic.source;
      extraLim = chronic.limitation;
    }
  }

  let flareStatus: Rule4FlareStatus = 'NOT_APPLICABLE';
  if (record.targetRole === 'CURRENT_ACUTE_FLARE' && record.verifiedChronicBaseline) {
    flareStatus = 'ACUTE_EXACERBATION_ON_CHRONIC';
  } else if (record.currentManifestationPhase === 'STABLE_BASELINE') {
    flareStatus = 'STABLE_BASELINE';
  }

  const phaseStatus: Rule4PhaseStatus =
    source === 'CROSS_BOUNDARY_OVERRIDE'
      ? 'RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE'
      : source === 'STRUCTURED_EVIDENCE'
        ? 'RESOLVED_BY_EVIDENCE'
        : 'RESOLVED_BY_DAY_BAND';

  return emptySlot(record, {
    phaseStatus,
    resolvedPhase: resolved,
    phaseResolutionSource: source,
    calculatedDurationDays: dur.calculated,
    suppliedDurationDays: dur.supplied,
    durationConsistencyStatus: dur.consistency,
    evidenceItemIds: usable.map((u) => u.evidenceItemId),
    flareStatus,
    reasonCodes: [...reasonCodes, 'PHASE_ALONE_NOT_A_POTENCY_SELECTOR'],
    limitationCodes: [...new Set([...limitationCodes, ...extraLim])].sort(),
  });
}
