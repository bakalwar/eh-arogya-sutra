import type { Rule4PhaseAdapterOutput } from '../phase/types.js';
import type { Rule4PolarityAdapterOutput } from '../polarity/types.js';
import type { Rule4SlotSeverityResolution } from './types.js';

export const RULE4_UPSTREAM_CONTEXT_STATUS_VALUES = [
  'READY_FOR_FUTURE_GATE_EVALUATION',
  'AUDIT_ONLY_NON_POTENCY_CONTEXT',
  'AUDIT_ONLY_UPSTREAM_UNRESOLVED',
  'NOT_EVALUATED',
] as const;

export type Rule4UpstreamContextStatus = (typeof RULE4_UPSTREAM_CONTEXT_STATUS_VALUES)[number];

const GROUP_PATHWAYS = new Set([
  'POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP',
  'NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP',
]);

const NON_POTENCY_PATHWAYS = new Set(['NEUTRAL_NON_POTENCY', 'SUPPORT_ONLY_NON_POTENCY']);

const UNRESOLVED_POLARITY_PATHWAYS = new Set([
  'UNRESOLVED_NO_CASCADE',
  'POLARITY_CONTRADICTORY',
  'BLOCKED_BY_SAFETY_GATE',
  'NOT_EVALUATED',
]);

function phaseIsResolved(
  phase: Rule4PhaseAdapterOutput['slotResolutions'][0] | undefined,
): boolean {
  if (!phase) return false;
  return (
    phase.phaseStatus === 'RESOLVED_BY_DAY_BAND' ||
    phase.phaseStatus === 'RESOLVED_BY_EVIDENCE' ||
    phase.phaseStatus === 'RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE'
  );
}

function phaseIsUnresolved(
  phase: Rule4PhaseAdapterOutput['slotResolutions'][0] | undefined,
): boolean {
  if (!phase) return false;
  return (
    phase.phaseStatus === 'PHASE_AMBIGUOUS' ||
    phase.phaseStatus === 'PHASE_CONTRADICTORY' ||
    phase.phaseStatus === 'PHASE_TARGET_CONTRADICTORY' ||
    phase.phaseStatus === 'MISSING_EVIDENCE' ||
    phase.phaseStatus === 'NOT_EVALUATED'
  );
}

function deriveUpstreamStatus(
  pathway: string | undefined,
  phaseSlot: Rule4PhaseAdapterOutput['slotResolutions'][0] | undefined,
  polarityProvided: boolean,
  phaseProvided: boolean,
): Rule4UpstreamContextStatus {
  if (!polarityProvided && !phaseProvided) {
    return 'NOT_EVALUATED';
  }

  if (pathway && UNRESOLVED_POLARITY_PATHWAYS.has(pathway)) {
    return 'AUDIT_ONLY_UPSTREAM_UNRESOLVED';
  }

  if (pathway && NON_POTENCY_PATHWAYS.has(pathway)) {
    return 'AUDIT_ONLY_NON_POTENCY_CONTEXT';
  }

  if (pathway && GROUP_PATHWAYS.has(pathway)) {
    if (phaseProvided && phaseIsUnresolved(phaseSlot)) {
      return 'AUDIT_ONLY_UPSTREAM_UNRESOLVED';
    }
    if (phaseProvided && phaseIsResolved(phaseSlot)) {
      return 'READY_FOR_FUTURE_GATE_EVALUATION';
    }
    if (!phaseProvided) {
      return 'AUDIT_ONLY_UPSTREAM_UNRESOLVED';
    }
  }

  if (phaseProvided && phaseIsUnresolved(phaseSlot)) {
    return 'AUDIT_ONLY_UPSTREAM_UNRESOLVED';
  }

  return 'NOT_EVALUATED';
}

function findPolaritySlot(
  polarity: Rule4PolarityAdapterOutput | null | undefined,
  slot: Rule4SlotSeverityResolution,
) {
  return polarity?.slotRoutings.find(
    (r) =>
      r.formulaSlotId === slot.formulaSlotId &&
      (r.formulaTargetId == null || r.formulaTargetId === slot.formulaTargetId),
  );
}

function findPhaseSlot(
  phase: Rule4PhaseAdapterOutput | null | undefined,
  slot: Rule4SlotSeverityResolution,
) {
  return phase?.slotResolutions.find(
    (r) =>
      r.formulaSlotId === slot.formulaSlotId &&
      (r.formulaTargetId == null || r.formulaTargetId === slot.formulaTargetId),
  );
}

/**
 * Phase 6 upstream polarity/phase context boundary — audit-only; not potency eligibility.
 */
export function applyUpstreamContextBoundary(
  slots: Rule4SlotSeverityResolution[],
  polarityRouting: Rule4PolarityAdapterOutput | null | undefined,
  phaseResolution: Rule4PhaseAdapterOutput | null | undefined,
): Rule4SlotSeverityResolution[] {
  const polarityProvided = polarityRouting != null;
  const phaseProvided = phaseResolution != null;

  if (!polarityProvided && !phaseProvided) {
    return slots.map((s) => ({
      ...s,
      upstreamContextStatus: 'NOT_EVALUATED' as const,
    }));
  }

  return slots.map((slot) => {
    const pol = findPolaritySlot(polarityRouting, slot);
    const ph = findPhaseSlot(phaseResolution, slot);

    if (polarityProvided && !pol) {
      return {
        ...slot,
        upstreamContextStatus: 'NOT_EVALUATED' as const,
        severityStatus: 'NOT_EVALUATED' as const,
        severityScore: null,
        severityBand: null,
        severityResolutionSource: 'NONE' as const,
        selectedCascade: null,
        selectedDilution: null,
        reasonCodes: [
          ...new Set([...slot.reasonCodes, 'UPSTREAM_TARGET_POLARITY_NOT_RESOLVED']),
        ].sort(),
        limitationCodes: [
          ...new Set([...slot.limitationCodes, 'PHASE6_UPSTREAM_CONTEXT_BOUNDARY']),
        ].sort(),
      };
    }

    const upstreamContextStatus = deriveUpstreamStatus(
      pol?.pathway,
      ph,
      polarityProvided,
      phaseProvided,
    );

    let limitationCodes = [...slot.limitationCodes];
    if (
      upstreamContextStatus === 'AUDIT_ONLY_NON_POTENCY_CONTEXT' ||
      upstreamContextStatus === 'AUDIT_ONLY_UPSTREAM_UNRESOLVED'
    ) {
      limitationCodes = [...new Set([...limitationCodes, 'PHASE6_UPSTREAM_CONTEXT_BOUNDARY'])];
    }

    return {
      ...slot,
      upstreamContextStatus,
      selectedCascade: null,
      selectedDilution: null,
      limitationCodes: [...new Set(limitationCodes)].sort(),
    };
  });
}
