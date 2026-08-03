import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4SeverityAdapterInput, Rule4SlotSeverityResolution } from './types.js';

export const TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION =
  'TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY' as const;

export function trustedSyntheticSeverityBindingBypassActive(
  input: Rule4SeverityAdapterInput,
): boolean {
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

function collapseBinding(
  slot: Rule4SlotSeverityResolution,
  reasons: string[],
): Rule4SlotSeverityResolution {
  return {
    ...slot,
    severityStatus: 'NOT_EVALUATED',
    severityScore: null,
    severityBand: null,
    severityResolutionSource: 'NONE',
    bindingStatus: 'NOT_EVALUATED',
    reasonCodes: [...new Set([...slot.reasonCodes, ...reasons])].sort(),
    limitationCodes: [...new Set([...slot.limitationCodes, 'PHASE6_NO_NUMERIC_CASCADE'])].sort(),
  };
}

export function applySeverityBindingGate(
  slots: Rule4SlotSeverityResolution[],
  input: Rule4SeverityAdapterInput,
  evidenceAdapter: Rule4EvidenceAdapterOutput | null | undefined,
  options: { bindingGateMandatory: boolean },
): Rule4SlotSeverityResolution[] {
  const bypass =
    !options.bindingGateMandatory && trustedSyntheticSeverityBindingBypassActive(input);

  return slots.map((slot) => {
    if (bypass) {
      return {
        ...slot,
        limitationCodes: [
          ...new Set([
            ...slot.limitationCodes,
            TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION,
          ]),
        ].sort(),
      };
    }

    if (!evidenceAdapter) {
      const reason =
        input.label === 'PRODUCTION'
          ? 'PRODUCTION_SEVERITY_RESOLUTION_NOT_CONNECTED'
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
      return {
        ...collapseBinding(slot, ['CROSS_FORMULA_SEVERITY_LEAKAGE_BLOCKED']),
        bindingStatus: 'LEAKAGE_BLOCKED',
      };
    }

    return { ...slot, bindingStatus: 'BOUND' };
  });
}
