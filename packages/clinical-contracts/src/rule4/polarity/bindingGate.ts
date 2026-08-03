import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4PolarityAdapterInput, Rule4SlotPolarityRouting } from './types.js';

export const RULE4_POLARITY_GROUP_PATHWAYS = [
  'POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP',
  'NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP',
] as const;

export type Rule4PolarityGroupPathway = (typeof RULE4_POLARITY_GROUP_PATHWAYS)[number];

export const TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION =
  'TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY' as const;

function isGroupPathway(pathway: string): pathway is Rule4PolarityGroupPathway {
  return (RULE4_POLARITY_GROUP_PATHWAYS as readonly string[]).includes(pathway);
}

type SlotEvidenceBinding = {
  usableCount: number;
  evidenceTargetId: string | null;
};

function slotEvidenceBinding(
  evidence: Rule4EvidenceAdapterOutput | null | undefined,
  slotId: string,
): SlotEvidenceBinding {
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

function collapseGroupRoute(
  routing: Rule4SlotPolarityRouting,
  reasonCodes: string[],
  extraLimitations: string[] = [],
): Rule4SlotPolarityRouting {
  return {
    ...routing,
    pathway: 'NOT_EVALUATED',
    potencyStatus: 'NOT_EVALUATED',
    reasonCodes: [...new Set([...routing.reasonCodes, ...reasonCodes])].sort(),
    limitationCodes: [
      ...new Set([...routing.limitationCodes, 'PHASE4_NO_NUMERIC_CASCADE', ...extraLimitations]),
    ].sort(),
  };
}

export function trustedSyntheticBindingBypassActive(input: Rule4PolarityAdapterInput): boolean {
  return input.label === 'SYNTHETIC' && input.trustedSyntheticBindingBypass === true;
}

/** Shadow/orchestrator paths must pass mandatory=true and ignore input bypass. */
export function applyPolarityBindingGate(
  routings: Rule4SlotPolarityRouting[],
  input: Rule4PolarityAdapterInput,
  evidenceAdapter: Rule4EvidenceAdapterOutput | null | undefined,
  options: { bindingGateMandatory: boolean },
): Rule4SlotPolarityRouting[] {
  const bypassAllowed = !options.bindingGateMandatory && trustedSyntheticBindingBypassActive(input);

  return routings.map((r) => {
    if (!isGroupPathway(r.pathway)) {
      return r;
    }

    if (bypassAllowed) {
      return {
        ...r,
        limitationCodes: [
          ...new Set([...r.limitationCodes, TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION]),
        ].sort(),
      };
    }

    if (!evidenceAdapter) {
      const reason =
        input.label === 'PRODUCTION'
          ? 'PRODUCTION_POLARITY_ROUTING_NOT_CONNECTED'
          : 'RULE3_BINDING_PORT_NOT_RESOLVED';
      return collapseGroupRoute(r, [reason]);
    }

    const binding = slotEvidenceBinding(evidenceAdapter, r.formulaSlotId);
    if (binding.usableCount <= 0) {
      return collapseGroupRoute(r, ['RULE3_BINDING_PORT_NOT_RESOLVED']);
    }

    const polarityTarget = r.formulaTargetId;
    if (
      !polarityTarget ||
      !binding.evidenceTargetId ||
      binding.evidenceTargetId !== polarityTarget
    ) {
      return collapseGroupRoute(r, ['CROSS_FORMULA_POLARITY_LEAKAGE_BLOCKED']);
    }

    return r;
  });
}
