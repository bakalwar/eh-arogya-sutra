import type { Rule4EvidenceItemEnvelope } from './types.js';

export function buildDedupeGroupKey(item: Rule4EvidenceItemEnvelope): string {
  const identity = item.findingIdentityKey ?? item.findingId;
  return [
    item.parentSourceId,
    identity,
    item.assertionStatus,
    item.targetOrganSystem,
    item.anatomicalSite,
    item.targetPathologyId,
    item.formulaSlotId,
    item.formulaTargetId,
    item.testPanelIdentity ?? '',
    item.laterality ?? '',
  ].join('|');
}

export type Rule4DedupePlan = {
  representativeFindingId: string;
  duplicateFindingIds: string[];
  dedupeGroupKey: string;
};

/** Deterministic dedupe — first sorted finding id wins within each group. */
export function planDedupe(items: readonly Rule4EvidenceItemEnvelope[]): Rule4DedupePlan[] {
  const groups = new Map<string, Rule4EvidenceItemEnvelope[]>();
  for (const item of items) {
    const key = buildDedupeGroupKey(item);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  const plans: Rule4DedupePlan[] = [];
  for (const [dedupeGroupKey, group] of groups) {
    const sorted = [...group].sort((a, b) => a.findingId.localeCompare(b.findingId));
    const rep = sorted[0];
    if (!rep) {
      continue;
    }
    plans.push({
      representativeFindingId: rep.findingId,
      duplicateFindingIds: sorted.slice(1).map((x) => x.findingId),
      dedupeGroupKey,
    });
  }
  return plans.sort((a, b) => a.dedupeGroupKey.localeCompare(b.dedupeGroupKey));
}

export function isDedupeDuplicate(findingId: string, plans: readonly Rule4DedupePlan[]): boolean {
  return plans.some((p) => p.duplicateFindingIds.includes(findingId));
}

export function countDistinctParentCorroboration(
  usableItems: readonly Rule4EvidenceItemEnvelope[],
  compareKey: (item: Rule4EvidenceItemEnvelope) => string,
): number {
  const parents = new Set<string>();
  for (const item of usableItems) {
    parents.add(`${compareKey(item)}::${item.parentSourceId}`);
  }
  const byCompare = new Map<string, Set<string>>();
  for (const item of usableItems) {
    const ck = compareKey(item);
    const set = byCompare.get(ck) ?? new Set<string>();
    set.add(item.parentSourceId);
    byCompare.set(ck, set);
  }
  let max = 0;
  for (const set of byCompare.values()) {
    max = Math.max(max, set.size);
  }
  return max;
}
