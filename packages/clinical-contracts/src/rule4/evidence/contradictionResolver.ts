import type { Rule4EvidenceItemEnvelope, Rule4SlotContradictionStatus } from './types.js';
import { normalizedFindingSignature } from './sourceComparabilityTier.js';
import { isComparableTimestamp, supersessionGroupKey } from './supersession.js';

function positivePolarity(item: Rule4EvidenceItemEnvelope): boolean {
  return item.assertionStatus === 'PRESENT' || item.assertionStatus === 'POSITIVE';
}

/** Same comparability group + same timestamp window — value/unit disagreement only. */
function contradictionGroupKey(item: Rule4EvidenceItemEnvelope): string {
  if (!isComparableTimestamp(item.timestampOrCaseContext)) {
    return `${supersessionGroupKey(item)}|__NO_TS__|${item.findingId}`;
  }
  return `${supersessionGroupKey(item)}|${item.timestampOrCaseContext}`;
}

export function resolveSlotContradiction(
  formulaSlotId: string,
  activeUsableItems: readonly Rule4EvidenceItemEnvelope[],
): Rule4SlotContradictionStatus {
  const slotItems = activeUsableItems.filter((i) => i.formulaSlotId === formulaSlotId);
  const buckets = new Map<string, Rule4EvidenceItemEnvelope[]>();
  for (const item of slotItems) {
    if (!positivePolarity(item)) {
      continue;
    }
    const key = contradictionGroupKey(item);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  for (const group of buckets.values()) {
    if (group.length < 2) {
      continue;
    }
    const signatures = new Set(group.map((g) => normalizedFindingSignature(g)));
    if (signatures.size > 1) {
      return {
        formulaSlotId,
        evidenceStatus: 'CONTRADICTORY_EVIDENCE',
        doctorReviewRequired: true,
        reasonCodes: ['CONTRADICTORY_EVIDENCE'],
        limitationCodes: ['PHASE3_NO_POTENCY_CASCADE'],
      };
    }
  }

  return {
    formulaSlotId,
    evidenceStatus: 'CLEAR',
    doctorReviewRequired: true,
    reasonCodes: [],
    limitationCodes: [],
  };
}
