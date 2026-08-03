import type {
  Rule4FormulaSeverityRecord,
  Rule4SeverityAdapterInput,
  Rule4SlotSeverityResolution,
} from './types.js';
import {
  type CrossRoleGuardOptions,
  isAcuteChronicCross,
  isFlareOrChronic,
  resolveAssertionBinding,
  type ResolvedAssertionBinding,
} from './assertionBinding.js';

export const CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON =
  'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED' as const;

export const TARGET_BINDING_MISSING_REASON = 'TARGET_BINDING_MISSING' as const;

const STANDARD = 'STANDARD_FORMULA_TARGET' as const;

function crossRoleGuardOptions(input: Rule4SeverityAdapterInput): CrossRoleGuardOptions {
  return {
    label: input.label,
    trustedSyntheticBindingBypass: input.trustedSyntheticBindingBypass === true,
  };
}

function collapseBindingFailure(
  slot: Rule4SlotSeverityResolution,
  reason: string,
): Rule4SlotSeverityResolution {
  return {
    ...slot,
    severityStatus: 'NOT_EVALUATED',
    severityScore: null,
    severityBand: null,
    severityResolutionSource: 'NONE',
    bindingStatus: 'LEAKAGE_BLOCKED',
    selectedCascade: null,
    selectedDilution: null,
    reasonCodes: [...new Set([...slot.reasonCodes, reason])].sort(),
    limitationCodes: [...new Set([...slot.limitationCodes, 'PHASE6_NO_NUMERIC_CASCADE'])].sort(),
  };
}

export { resolveAssertionBinding } from './assertionBinding.js';

/**
 * Acute/chronic cross-role leakage guard (Phase 6). Runs after per-slot resolve, before evidence binding gate.
 */
export function applyCrossRoleLeakageGuard(
  slots: Rule4SlotSeverityResolution[],
  records: readonly Rule4FormulaSeverityRecord[],
  input: Rule4SeverityAdapterInput,
): Rule4SlotSeverityResolution[] {
  const options = crossRoleGuardOptions(input);
  const blockSlotIds = new Map<string, string>();
  const allBindings: ResolvedAssertionBinding[] = [];

  for (const record of records) {
    if (record.patientGlobalMaxSeverityLabelOnly) {
      continue;
    }
    for (const assertion of record.severityEvidenceAssertions) {
      const binding = resolveAssertionBinding(assertion, record, options);
      allBindings.push(binding);

      if (binding.missingAcuteChronicAuthority) {
        blockSlotIds.set(binding.receivingFormulaSlotId, TARGET_BINDING_MISSING_REASON);
        continue;
      }

      if (isAcuteChronicCross(binding.boundTargetRole, binding.receivingTargetRole)) {
        blockSlotIds.set(
          binding.receivingFormulaSlotId,
          CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON,
        );
      }

      if (binding.receivingTargetRole === STANDARD && isFlareOrChronic(binding.boundTargetRole)) {
        blockSlotIds.set(
          binding.receivingFormulaSlotId,
          CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON,
        );
      }
    }
  }

  const byEvidence = new Map<string, ResolvedAssertionBinding[]>();
  for (const b of allBindings) {
    const list = byEvidence.get(b.evidenceItemId) ?? [];
    list.push(b);
    byEvidence.set(b.evidenceItemId, list);
  }

  for (const occs of byEvidence.values()) {
    const flareReceiving = occs.filter((o) => o.receivingTargetRole === 'CURRENT_ACUTE_FLARE');
    const chronicReceiving = occs.filter(
      (o) => o.receivingTargetRole === 'UNDERLYING_CHRONIC_TARGET',
    );
    if (flareReceiving.length === 0 || chronicReceiving.length === 0) {
      continue;
    }

    if (occs.some((o) => o.missingAcuteChronicAuthority)) {
      for (const o of occs) {
        if (isFlareOrChronic(o.receivingTargetRole)) {
          blockSlotIds.set(o.receivingFormulaSlotId, TARGET_BINDING_MISSING_REASON);
        }
      }
      continue;
    }

    const boundRoles = new Set(occs.map((o) => o.boundTargetRole));
    const eachAuthoritative = occs.every(
      (o) => o.bindingAuthoritative && o.boundTargetRole === o.receivingTargetRole,
    );
    if (eachAuthoritative && boundRoles.size > 1) {
      for (const o of occs) {
        if (isFlareOrChronic(o.receivingTargetRole)) {
          blockSlotIds.set(o.receivingFormulaSlotId, CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON);
        }
      }
    }
  }

  if (blockSlotIds.size === 0) {
    return slots;
  }

  return slots.map((slot) => {
    const reason = blockSlotIds.get(slot.formulaSlotId);
    return reason ? collapseBindingFailure(slot, reason) : slot;
  });
}
