import type { Rule4PhaseAdapterOutput } from '../phase/types.js';
import type { Rule4PolarityAdapterOutput } from '../polarity/types.js';
import type { Rule4SeverityAdapterOutput } from '../severity/types.js';
import { evaluateFormulaBpStageGate } from './formulaBpGate.js';
import { blockingGateCodesFrom, gateResult } from './gateLedger.js';
import type {
  Rule4CandidateFamily,
  Rule4EligibilityAdapterInput,
  Rule4EligibilityEvaluationContext,
  Rule4EligibilityStatus,
  Rule4FormulaEligibilityRecord,
  Rule4GateResult,
  Rule4SlotEligibilityResolution,
} from './types.js';

const PHASE7_LIMITATION = 'PHASE7_NO_NUMERIC_SELECTION';

function trustedSyntheticBypass(input: Rule4EligibilityAdapterInput): boolean {
  return input.label === 'SYNTHETIC' && input.trustedSyntheticEligibilityBypass === true;
}

function structuredAllowed(
  input: Rule4EligibilityAdapterInput,
  context: Rule4EligibilityEvaluationContext,
): boolean {
  if (input.label === 'PRODUCTION') {
    return false;
  }
  if (context.bindingGateMandatory !== false) {
    return trustedSyntheticBypass(input);
  }
  return trustedSyntheticBypass(input);
}

function severityScoreForSlot(
  severity: Rule4SeverityAdapterOutput | null | undefined,
  slotId: string,
): { score: number | null; band: string | null; ok: boolean } {
  const slot = severity?.slotResolutions.find((s) => s.formulaSlotId === slotId);
  if (
    !slot ||
    (slot.severityStatus !== 'RESOLVED_NUMERIC' && slot.severityStatus !== 'RESOLVED_BAND_ONLY')
  ) {
    return { score: null, band: null, ok: false };
  }
  return { score: slot.severityScore, band: slot.severityBand, ok: true };
}

function phaseForSlot(
  phase: Rule4PhaseAdapterOutput | null | undefined,
  slotId: string,
): { phase: string | null; ok: boolean } {
  const slot = phase?.slotResolutions.find((s) => s.formulaSlotId === slotId);
  if (
    !slot ||
    (slot.phaseStatus !== 'RESOLVED_BY_DAY_BAND' &&
      slot.phaseStatus !== 'RESOLVED_BY_EVIDENCE' &&
      slot.phaseStatus !== 'RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE')
  ) {
    return { phase: null, ok: false };
  }
  return { phase: slot.resolvedPhase, ok: true };
}

function polarityForSlot(polarity: Rule4PolarityAdapterOutput | null | undefined, slotId: string) {
  return polarity?.slotRoutings.find((s) => s.formulaSlotId === slotId) ?? null;
}

function isHighSeverity(score: number | null, band: string | null): boolean {
  if (score != null && score >= 7) {
    return true;
  }
  return band === 'HIGH';
}

function isLowModerateSeverity(score: number | null, band: string | null): boolean {
  if (score != null && score >= 1 && score <= 6) {
    return true;
  }
  return band === 'LOW' || band === 'MODERATE';
}

function emptySlotResolution(
  slotId: string,
  targetId: string | null,
  status: Rule4EligibilityStatus,
  family: Rule4CandidateFamily,
  gates: Rule4GateResult[],
  reasonCodes: readonly string[],
): Rule4SlotEligibilityResolution {
  return {
    formulaSlotId: slotId,
    formulaTargetId: targetId,
    targetRole: 'STANDARD_FORMULA_TARGET',
    eligibilityStatus: status,
    candidateFamily: family,
    eligibleFamilyOptions: family === 'NONE' ? [] : [family],
    familyGateStatus: 'COMPLETE',
    gateResults: gates,
    blockingGateCodes: blockingGateCodesFrom(gates),
    selectionStatus: 'NOT_STARTED',
    selectedCascade: null,
    selectedDilution: null,
    upstreamContextStatus: 'NOT_EVALUATED',
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [PHASE7_LIMITATION],
  };
}

function evaluateNegD1D2(
  record: Rule4FormulaEligibilityRecord,
  input: Rule4EligibilityAdapterInput,
  context: Rule4EligibilityEvaluationContext,
  sev: { score: number | null; band: string | null; ok: boolean },
): { family: Rule4CandidateFamily; gates: Rule4GateResult[]; status: Rule4EligibilityStatus } {
  const gates: Rule4GateResult[] = [];
  const allowStructured = structuredAllowed(input, context);

  gates.push(
    gateResult(
      'COMMON_NEG_PRECONDITIONS',
      allowStructured && record.commonGateBundle?.negComplete ? 'PASS' : 'MISSING_INPUT',
      allowStructured && record.commonGateBundle?.negComplete
        ? {}
        : { reasonCodes: ['NEG_COMMON_GATES_INCOMPLETE'] },
    ),
  );

  if (!sev.ok) {
    gates.push(
      gateResult('UPSTREAM_SEVERITY_READY', 'MISSING_INPUT', {
        reasonCodes: ['SEVERITY_UPSTREAM_MISSING'],
      }),
    );
    return { family: 'NONE', gates, status: 'NO_FAMILY_ELIGIBLE' };
  }
  gates.push(gateResult('UPSTREAM_SEVERITY_READY', 'PASS'));

  const high = isHighSeverity(sev.score, sev.band);
  if (high) {
    gates.push(
      gateResult('NEG_HIGH_D1_PROHIBITED', 'PASS', {
        reasonCodes: ['D1_PROHIBITED_HIGH_SEVERITY'],
      }),
    );
  }

  let d1Pass = false;
  let d2Pass = false;

  if (!high) {
    if (allowStructured && record.structuredHypofunctionEvidence?.pass) {
      gates.push(
        gateResult('NEG_D1_HYPOFUNCTION_EVIDENCE', 'PASS', {
          evidenceItemIds: record.structuredHypofunctionEvidence.evidenceItemIds,
        }),
      );
      if (isLowModerateSeverity(sev.score, sev.band) && record.commonGateBundle?.negComplete) {
        gates.push(gateResult('NEG_D1_SEVERITY_BAND', 'PASS'));
        d1Pass = true;
      } else {
        gates.push(gateResult('NEG_D1_SEVERITY_BAND', 'FAIL'));
      }
    } else {
      gates.push(
        gateResult('NEG_D1_HYPOFUNCTION_EVIDENCE', 'MISSING_INPUT', {
          reasonCodes: ['D1_HYPOFUNCTION_EVIDENCE_MISSING'],
        }),
      );
    }
  } else {
    gates.push(
      gateResult('NEG_HIGH_D1_PROHIBITED', 'PASS', {
        reasonCodes: ['D1_PROHIBITED_HIGH_SEVERITY'],
      }),
    );
  }

  if (allowStructured && record.structuredModeratingForceEvidence?.pass) {
    gates.push(
      gateResult('NEG_D2_MODERATING_EVIDENCE', 'PASS', {
        evidenceItemIds: record.structuredModeratingForceEvidence.evidenceItemIds,
      }),
    );
    if (high) {
      gates.push(gateResult('NEG_D2_RESTRICTED_HIGH_SEVERITY', 'PASS'));
      d2Pass = true;
    } else if (isLowModerateSeverity(sev.score, sev.band)) {
      d2Pass = true;
    }
  } else if (high) {
    gates.push(
      gateResult('NEG_D2_MODERATING_EVIDENCE', 'MISSING_INPUT', {
        reasonCodes: ['D2_RESTRICTED_GATES_INCOMPLETE'],
      }),
    );
  } else {
    gates.push(
      gateResult('NEG_D2_MODERATING_EVIDENCE', 'MISSING_INPUT', {
        reasonCodes: ['D2_MODERATING_EVIDENCE_MISSING'],
      }),
    );
  }

  if (d1Pass && d2Pass) {
    return { family: 'BOTH_D1_D2_ELIGIBLE', gates, status: 'FAMILY_ELIGIBLE' };
  }
  if (d1Pass) {
    return { family: 'D1_ELIGIBLE', gates, status: 'FAMILY_ELIGIBLE' };
  }
  if (d2Pass) {
    return { family: 'D2_ELIGIBLE', gates, status: 'FAMILY_ELIGIBLE' };
  }
  return { family: 'NONE', gates, status: 'NO_FAMILY_ELIGIBLE' };
}

function evaluatePosFamilies(
  record: Rule4FormulaEligibilityRecord,
  input: Rule4EligibilityAdapterInput,
  context: Rule4EligibilityEvaluationContext,
  sev: { score: number | null; band: string | null; ok: boolean },
  ph: { phase: string | null; ok: boolean },
): {
  family: Rule4CandidateFamily;
  gates: Rule4GateResult[];
  status: Rule4EligibilityStatus;
  options: Rule4CandidateFamily[];
} {
  const gates: Rule4GateResult[] = [];
  const allowStructured = structuredAllowed(input, context);
  const options: Rule4CandidateFamily[] = [];

  gates.push(
    gateResult(
      'COMMON_POS_PRECONDITIONS',
      allowStructured && record.commonGateBundle?.posComplete ? 'PASS' : 'MISSING_INPUT',
    ),
  );

  if (!sev.ok) {
    gates.push(gateResult('UPSTREAM_SEVERITY_READY', 'MISSING_INPUT'));
    return { family: 'NONE', gates, status: 'NO_FAMILY_ELIGIBLE', options: [] };
  }
  gates.push(gateResult('UPSTREAM_SEVERITY_READY', 'PASS'));

  if (!ph.ok) {
    gates.push(gateResult('UPSTREAM_PHASE_READY', 'MISSING_INPUT'));
    return { family: 'NONE', gates, status: 'NO_FAMILY_ELIGIBLE', options: [] };
  }
  gates.push(gateResult('UPSTREAM_PHASE_READY', 'PASS'));

  const high = isHighSeverity(sev.score, sev.band);

  if (high && allowStructured && record.d30fStructuredBundle?.complete) {
    gates.push(
      gateResult('POS_D30F_COMPLETE', 'PASS', {
        evidenceItemIds: record.d30fStructuredBundle.evidenceItemIds,
      }),
    );
    options.push('D30_FAMILY_ELIGIBLE');
  } else if (high) {
    gates.push(
      gateResult('POS_D30F_COMPLETE', record.d30fStructuredBundle ? 'FAIL' : 'MISSING_INPUT', {
        reasonCodes: ['D30F_INCOMPLETE'],
      }),
    );
  }

  if (
    !high &&
    (ph.phase === 'SUB_ACUTE' || ph.phase === 'CHRONIC_MODERATE') &&
    allowStructured &&
    record.d10PathVariant
  ) {
    const sens = record.structuredSensitivity;
    const pathOk = record.d10PathVariant === 'PATH_B' || record.d10PathVariant === 'PATH_C';
    gates.push(
      gateResult('POS_D10_PATH', pathOk ? 'PASS' : 'FAIL'),
      gateResult(
        'POS_D10_SENSITIVITY',
        sens?.executableStatus === 'PASS'
          ? 'PASS'
          : sens?.executableStatus === 'MISSING_INPUT'
            ? 'MISSING_INPUT'
            : 'FAIL',
        { evidenceItemIds: sens?.evidenceItemIds },
      ),
    );
    if (pathOk && sens?.executableStatus === 'PASS' && record.commonGateBundle?.posComplete) {
      options.push('D10_FAMILY_ELIGIBLE');
    }
  } else if (!high && (ph.phase === 'SUB_ACUTE' || ph.phase === 'CHRONIC_MODERATE')) {
    gates.push(gateResult('POS_D10_PATH', 'MISSING_INPUT'));
  }

  if (!high && ph.phase === 'ACUTE') {
    const sens = record.structuredSensitivity;
    gates.push(
      gateResult('POS_ACUTE_PHASE', 'PASS'),
      gateResult('POS_SEVERITY_1_6', isLowModerateSeverity(sev.score, sev.band) ? 'PASS' : 'FAIL'),
      gateResult(
        'POS_SENSITIVITY_CLOSE_D05',
        sens?.executableStatus === 'PASS'
          ? 'PASS'
          : sens?.executableStatus === 'NON_EXECUTABLE_PENDING_FREEZE'
            ? 'NON_EXECUTABLE_PENDING_FREEZE'
            : 'MISSING_INPUT',
        { evidenceItemIds: sens?.evidenceItemIds },
      ),
    );
    if (
      sens?.executableStatus === 'PASS' &&
      isLowModerateSeverity(sev.score, sev.band) &&
      record.commonGateBundle?.posComplete
    ) {
      options.push('D3_D5_FAMILY_ELIGIBLE');
    }
  }

  if (!high && ph.phase === 'DEEP_CHRONIC') {
    const path = record.structuredPathology;
    if (path?.tier3MappingStatus === 'PENDING') {
      gates.push(
        gateResult('POS_D60_TIER3_PATHOLOGY', 'NON_EXECUTABLE_PENDING_FREEZE', {
          reasonCodes: ['TIER3_PATHOLOGY_MAPPING_PENDING'],
        }),
      );
    } else if (path?.authority === 'TIER3_SUGGESTIVE_ONLY') {
      gates.push(
        gateResult('POS_D60_TIER3_PATHOLOGY', 'FAIL', { reasonCodes: ['TIER3_SUGGESTIVE_ONLY'] }),
      );
    } else if (
      allowStructured &&
      record.d60StructuredBundle?.tripleGatePass &&
      record.d60StructuredBundle.extremeHypersensitivityVerified
    ) {
      gates.push(
        gateResult('POS_D60_TRIPLE_GATE', 'PASS', {
          evidenceItemIds: record.d60StructuredBundle.evidenceItemIds,
        }),
      );
      gates.push(gateResult('POS_D60_EXTREME_HYPERSENSITIVITY', 'PASS'));
      if (
        record.d60StructuredBundle.dayBandDays != null &&
        record.d60StructuredBundle.dayBandDays >= 91 &&
        !record.d60StructuredBundle.tripleGatePass
      ) {
        gates.push(
          gateResult('POS_D60_DAY_BAND_ONLY', 'FAIL', {
            reasonCodes: ['DAY_91_ALONE_INSUFFICIENT'],
          }),
        );
      } else {
        options.push('D60_FAMILY_ELIGIBLE');
      }
    } else if (record.d60FallbackStructured?.ready) {
      gates.push(
        gateResult('POS_D60_FALLBACK_READY', 'PASS', {
          evidenceItemIds: record.d60FallbackStructured.evidenceItemIds,
        }),
      );
      options.push('D60_D10_FALLBACK_READY');
    } else {
      gates.push(gateResult('POS_D60_TRIPLE_GATE', 'MISSING_INPUT'));
    }
  }

  if (options.length === 0) {
    return { family: 'NONE', gates, status: 'NO_FAMILY_ELIGIBLE', options: [] };
  }
  return { family: options[0]!, gates, status: 'FAMILY_ELIGIBLE', options };
}

export function resolveSlotEligibility(
  record: Rule4FormulaEligibilityRecord | undefined,
  slotId: string,
  input: Rule4EligibilityAdapterInput,
  context: Rule4EligibilityEvaluationContext,
): Rule4SlotEligibilityResolution {
  const safety = context.safetyGate;
  if (safety?.patientWideHold || safety?.d13HardStopActive) {
    return emptySlotResolution(
      slotId,
      record?.formulaTargetId ?? null,
      'BLOCKED_BY_SAFETY',
      'NONE',
      [gateResult('SAFETY_PATIENT_WIDE', 'BLOCKED_BY_SAFETY', { reasonCodes: safety.reasonCodes })],
      ['BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE'],
    );
  }

  const routing = polarityForSlot(context.polarityRouting, slotId);
  if (!routing) {
    return emptySlotResolution(
      slotId,
      record?.formulaTargetId ?? null,
      'NOT_EVALUATED',
      'NONE',
      [gateResult('UPSTREAM_POLARITY_READY', 'NOT_EVALUATED')],
      ['UPSTREAM_POLARITY_MISSING'],
    );
  }

  if (routing.pathway === 'NEUTRAL_NON_POTENCY') {
    return emptySlotResolution(
      slotId,
      routing.formulaTargetId,
      'NON_POTENCY',
      'NONE',
      [
        gateResult('POLARITY_NEUTRAL', 'PASS', {
          reasonCodes: ['POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET'],
        }),
      ],
      ['POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET'],
    );
  }
  if (routing.pathway === 'SUPPORT_ONLY_NON_POTENCY') {
    return emptySlotResolution(
      slotId,
      routing.formulaTargetId,
      'NON_POTENCY',
      'NONE',
      [gateResult('POLARITY_SUPPORT_ONLY', 'PASS')],
      ['POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT'],
    );
  }
  if (routing.pathway === 'UNRESOLVED_NO_CASCADE' || routing.pathway === 'POLARITY_CONTRADICTORY') {
    return emptySlotResolution(
      slotId,
      routing.formulaTargetId,
      'BLOCKED_BY_UPSTREAM',
      'NONE',
      [gateResult('UPSTREAM_POLARITY_READY', 'BLOCKED_BY_UPSTREAM')],
      routing.reasonCodes,
    );
  }

  if (!record || record.formulaSlotId !== slotId) {
    return emptySlotResolution(
      slotId,
      routing.formulaTargetId,
      'NOT_EVALUATED',
      'NONE',
      [
        gateResult('ELIGIBILITY_RECORD_BINDING', 'MISSING_INPUT', {
          reasonCodes: ['TARGET_BINDING_MISSING'],
        }),
      ],
      ['TARGET_BINDING_MISSING'],
    );
  }
  if (record.formulaTargetId !== routing.formulaTargetId) {
    return emptySlotResolution(
      slotId,
      routing.formulaTargetId,
      'BLOCKED_BY_UPSTREAM',
      'NONE',
      [
        gateResult('ELIGIBILITY_TARGET_MISMATCH', 'CONTRADICTORY', {
          reasonCodes: ['CROSS_FORMULA_ELIGIBILITY_LEAKAGE_BLOCKED'],
        }),
      ],
      ['CROSS_FORMULA_ELIGIBILITY_LEAKAGE_BLOCKED'],
    );
  }

  const sev = severityScoreForSlot(context.severityResolution, slotId);
  const ph = phaseForSlot(context.phaseResolution, slotId);

  if (routing.pathway === 'NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP') {
    const neg = evaluateNegD1D2(record, input, context, sev);
    return {
      formulaSlotId: slotId,
      formulaTargetId: record.formulaTargetId,
      targetRole: record.targetRole,
      eligibilityStatus: neg.status,
      candidateFamily: neg.family,
      eligibleFamilyOptions: neg.family === 'NONE' ? [] : [neg.family],
      familyGateStatus: 'COMPLETE',
      gateResults: neg.gates,
      blockingGateCodes: blockingGateCodesFrom(neg.gates),
      selectionStatus: 'NOT_STARTED',
      selectedCascade: null,
      selectedDilution: null,
      upstreamContextStatus: 'READY_FOR_FUTURE_GATE_EVALUATION',
      reasonCodes: neg.gates.flatMap((g) => g.reasonCodes),
      limitationCodes: [PHASE7_LIMITATION],
    };
  }

  if (routing.pathway === 'POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP') {
    const pos = evaluatePosFamilies(record, input, context, sev, ph);
    if (record.formulaBpReading) {
      const bpGate = evaluateFormulaBpStageGate(record.formulaBpReading, 2);
      pos.gates.push(
        gateResult(
          'FORMULA_BP_STAGE2',
          bpGate.outcome === 'PASS'
            ? 'PASS'
            : bpGate.outcome === 'MISSING_INPUT'
              ? 'MISSING_INPUT'
              : 'FAIL',
          {
            reasonCodes: bpGate.reasonCodes,
            evidenceItemIds: record.formulaBpReading.evidenceItemId
              ? [record.formulaBpReading.evidenceItemId]
              : [],
          },
        ),
      );
    }
    return {
      formulaSlotId: slotId,
      formulaTargetId: record.formulaTargetId,
      targetRole: record.targetRole,
      eligibilityStatus: pos.status,
      candidateFamily: pos.family,
      eligibleFamilyOptions: pos.options,
      familyGateStatus: 'COMPLETE',
      gateResults: pos.gates,
      blockingGateCodes: blockingGateCodesFrom(pos.gates),
      selectionStatus: 'NOT_STARTED',
      selectedCascade: null,
      selectedDilution: null,
      upstreamContextStatus: 'READY_FOR_FUTURE_GATE_EVALUATION',
      reasonCodes: pos.gates.flatMap((g) => g.reasonCodes),
      limitationCodes: [PHASE7_LIMITATION],
    };
  }

  return emptySlotResolution(
    slotId,
    record.formulaTargetId,
    'NOT_EVALUATED',
    'NONE',
    [gateResult('POLARITY_PATHWAY', 'NOT_EVALUATED')],
    ['ELIGIBILITY_PATHWAY_NOT_EVALUATED'],
  );
}
