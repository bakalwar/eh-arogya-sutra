import type { Rule4EvidenceItemEnvelope } from './types.js';
import {
  normalizeLateralityForComparability,
  normalizedFindingSignature,
  supersessionComparableSourceClass,
} from './sourceComparabilityTier.js';

const ISO_TS = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

export function isComparableTimestamp(timestampOrCaseContext: string | null | undefined): boolean {
  if (timestampOrCaseContext == null || String(timestampOrCaseContext).trim() === '') {
    return false;
  }
  const t = String(timestampOrCaseContext).trim();
  if (!ISO_TS.test(t)) {
    return false;
  }
  const ms = Date.parse(t);
  return !Number.isNaN(ms);
}

export function supersessionGroupKey(item: Rule4EvidenceItemEnvelope): string {
  const sourceClass = supersessionComparableSourceClass(item.sourceType);
  const testIdentity = item.testPanelIdentity ?? item.findingIdentityKey ?? item.findingId;
  return [
    item.formulaTargetId,
    item.targetOrganSystem,
    item.anatomicalSite,
    normalizeLateralityForComparability(item.laterality),
    item.targetPathologyId,
    testIdentity,
    sourceClass,
  ].join('|');
}

export type Rule4SupersessionDecision = {
  findingId: string;
  supersededByFindingId: string | null;
  active: boolean;
  reasonCodes: string[];
  limitationCodes: string[];
};

/**
 * Cross-parent supersession when strictly newer timestamp within the same comparability group.
 * Same timestamp: no clinical winner; identical signatures corroborate; conflicts defer to contradiction.
 */
export function applySupersession(
  usableItems: readonly Rule4EvidenceItemEnvelope[],
): Rule4SupersessionDecision[] {
  const byGroup = new Map<string, Rule4EvidenceItemEnvelope[]>();
  for (const item of usableItems) {
    const key = supersessionGroupKey(item);
    const list = byGroup.get(key) ?? [];
    list.push(item);
    byGroup.set(key, list);
  }

  const decisions: Rule4SupersessionDecision[] = [];

  for (const group of byGroup.values()) {
    const invalidTs: Rule4EvidenceItemEnvelope[] = [];
    const validTs: Rule4EvidenceItemEnvelope[] = [];
    for (const item of group) {
      if (isComparableTimestamp(item.timestampOrCaseContext)) {
        validTs.push(item);
      } else {
        invalidTs.push(item);
      }
    }

    for (const item of invalidTs) {
      decisions.push({
        findingId: item.findingId,
        supersededByFindingId: null,
        active: true,
        reasonCodes: ['SUPERSESSION_TIMESTAMP_NOT_COMPARABLE'],
        limitationCodes: ['SUPERSESSION_SKIPPED_INVALID_TIMESTAMP'],
      });
    }

    if (validTs.length === 0) {
      continue;
    }

    const sorted = [...validTs].sort((a, b) => {
      const cmp = a.timestampOrCaseContext.localeCompare(b.timestampOrCaseContext);
      if (cmp !== 0) {
        return cmp;
      }
      return a.findingId.localeCompare(b.findingId);
    });

    const maxTs = sorted[sorted.length - 1]!.timestampOrCaseContext;
    const atMax = sorted.filter((i) => i.timestampOrCaseContext === maxTs);
    const belowMax = sorted.filter((i) => i.timestampOrCaseContext !== maxTs);

    const signaturesAtMax = new Set(atMax.map((i) => normalizedFindingSignature(i)));
    const auditAnchorFindingId = [...atMax].sort((a, b) =>
      a.findingId.localeCompare(b.findingId),
    )[0]!.findingId;

    for (const item of atMax) {
      decisions.push({
        findingId: item.findingId,
        supersededByFindingId: null,
        active: true,
        reasonCodes: [],
        limitationCodes:
          signaturesAtMax.size > 1 ? ['SUPERSESSION_SAME_TIMESTAMP_NO_CLINICAL_WINNER'] : [],
      });
    }

    for (const item of belowMax) {
      decisions.push({
        findingId: item.findingId,
        supersededByFindingId: auditAnchorFindingId,
        active: false,
        reasonCodes: ['EVIDENCE_SUPERSEDED'],
        limitationCodes: [],
      });
    }
  }

  return decisions.sort((a, b) => a.findingId.localeCompare(b.findingId));
}
