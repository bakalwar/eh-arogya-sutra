import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4PolarityAdapterOutput } from '../polarity/types.js';
import { RULE4_POLARITY_GROUP_PATHWAYS } from '../polarity/bindingGate.js';
import type { Rule4PhaseAdapterInput, Rule4SlotPhaseResolution } from './types.js';

export const TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION =
  'TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY' as const;

export function trustedSyntheticPhaseBindingBypassActive(input: Rule4PhaseAdapterInput): boolean {
  return input.label === 'SYNTHETIC' && input.trustedSyntheticBindingBypass === true;
}

function slotEvidenceBinding(
  evidence: Rule4EvidenceAdapterOutput | null | undefined,
  slotId: string,
): { usableCount: number; evidenceTargetId: string | null } {
  if (!evidence) {
    return { usableCount: 0, evidenceTargetId: null };
  }
  const pool = evidence.formulaBoundPools.find((p) => p.formulaSlotId === slotId);
  if (!pool) {
    return { usableCount: 0, evidenceTargetId: null };
  }
  return {
    usableCount: pool.usableFindingIds.length,
    evidenceTargetId: pool.formulaTargetId,
  };
}

function polarityForSlot(
  polarity: Rule4PolarityAdapterOutput | null | undefined,
  slotId: string,
): string | null {
  if (!polarity) {
    return null;
  }
  const row = polarity.slotRoutings.find((s) => s.formulaSlotId === slotId);
  return row?.pathway ?? null;
}

function collapseBinding(
  slot: Rule4SlotPhaseResolution,
  reasons: string[],
): Rule4SlotPhaseResolution {
  return {
    ...slot,
    phaseStatus: 'NOT_EVALUATED',
    resolvedPhase: null,
    phaseResolutionSource: 'NONE',
    reasonCodes: [...new Set([...slot.reasonCodes, ...reasons])].sort(),
    limitationCodes: [...new Set([...slot.limitationCodes, 'PHASE5_NO_NUMERIC_CASCADE'])].sort(),
  };
}

export function applyPhaseBindingGate(
  slots: Rule4SlotPhaseResolution[],
  input: Rule4PhaseAdapterInput,
  evidenceAdapter: Rule4EvidenceAdapterOutput | null | undefined,
  polarityRouting: Rule4PolarityAdapterOutput | null | undefined,
  options: { bindingGateMandatory: boolean },
): Rule4SlotPhaseResolution[] {
  const bypass = !options.bindingGateMandatory && trustedSyntheticPhaseBindingBypassActive(input);

  return slots.map((slot) => {
    if (bypass) {
      return {
        ...slot,
        limitationCodes: [
          ...new Set([...slot.limitationCodes, TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION]),
        ].sort(),
      };
    }

    if (!evidenceAdapter) {
      const reason =
        input.label === 'PRODUCTION'
          ? 'PRODUCTION_PHASE_RESOLUTION_NOT_CONNECTED'
          : 'RULE3_BINDING_PORT_NOT_RESOLVED';
      return collapseBinding(slot, [reason]);
    }

    const binding = slotEvidenceBinding(evidenceAdapter, slot.formulaSlotId);
    if (binding.usableCount <= 0) {
      return collapseBinding(slot, ['RULE3_BINDING_PORT_NOT_RESOLVED']);
    }
    if (
      !slot.formulaTargetId ||
      !binding.evidenceTargetId ||
      binding.evidenceTargetId !== slot.formulaTargetId
    ) {
      return collapseBinding(slot, ['CROSS_FORMULA_PHASE_LEAKAGE_BLOCKED']);
    }

    const pathway = polarityForSlot(polarityRouting, slot.formulaSlotId);
    if (
      pathway &&
      (RULE4_POLARITY_GROUP_PATHWAYS as readonly string[]).includes(pathway) &&
      !polarityRouting
    ) {
      return collapseBinding(slot, ['PRODUCTION_POLARITY_ROUTING_NOT_CONNECTED']);
    }

    return slot;
  });
}

export function applyPolarityContradictionBlock(
  slots: Rule4SlotPhaseResolution[],
  polarityRouting: Rule4PolarityAdapterOutput | null | undefined,
): Rule4SlotPhaseResolution[] {
  if (!polarityRouting) {
    return slots;
  }
  return slots.map((slot) => {
    const row = polarityRouting.slotRoutings.find((s) => s.formulaSlotId === slot.formulaSlotId);
    if (row?.pathway === 'POLARITY_CONTRADICTORY') {
      return {
        ...slot,
        phaseStatus: 'BLOCKED_BY_POLARITY_CONTRADICTION',
        resolvedPhase: null,
        phaseResolutionSource: 'NONE',
        reasonCodes: [
          ...new Set([...slot.reasonCodes, 'POLARITY_SAME_TARGET_CONTRADICTION']),
        ].sort(),
        limitationCodes: slot.limitationCodes,
      };
    }
    return slot;
  });
}
