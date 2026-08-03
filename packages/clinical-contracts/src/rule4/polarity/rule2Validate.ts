import type { Rule2FormulaPolarityRecord } from './types.js';
import {
  RULE2_DISEASE_POLARITY_VALUES,
  RULE2_RESOLUTION_STATUS_VALUES,
  RULE2_THERAPEUTIC_POLARITY_VALUES,
} from './types.js';

export type Rule2ValidationResult =
  { ok: true; record: Rule2FormulaPolarityRecord } | { ok: false; reasonCodes: string[] };

function isEnum(value: string, allowed: readonly string[]): boolean {
  return allowed.includes(value);
}

export function validateRule2Record(record: Rule2FormulaPolarityRecord): Rule2ValidationResult {
  const reasonCodes: string[] = [];
  if (!record.formulaSlotId?.trim()) {
    reasonCodes.push('RULE2_POLARITY_RECORD_INVALID');
  }
  if (!record.formulaTargetId?.trim()) {
    reasonCodes.push('RULE2_POLARITY_RECORD_INVALID');
  }
  if (!record.rule2RecordId?.trim()) {
    reasonCodes.push('RULE2_POLARITY_RECORD_INVALID');
  }
  if (!isEnum(String(record.diseasePolarity), RULE2_DISEASE_POLARITY_VALUES)) {
    reasonCodes.push('RULE2_DISEASE_POLARITY_INVALID');
  }
  if (!isEnum(String(record.requiredTherapeuticPolarity), RULE2_THERAPEUTIC_POLARITY_VALUES)) {
    reasonCodes.push('RULE2_THERAPEUTIC_POLARITY_INVALID');
  }
  if (!isEnum(String(record.resolutionStatus), RULE2_RESOLUTION_STATUS_VALUES)) {
    reasonCodes.push('RULE2_RESOLUTION_STATUS_INVALID');
  }
  if (reasonCodes.length > 0) {
    return { ok: false, reasonCodes: [...new Set(reasonCodes)] };
  }
  return { ok: true, record };
}

/** Same formula_target_id with conflicting resolved disease polarities. */
export function findSameTargetPolarityContradictions(
  records: readonly Rule2FormulaPolarityRecord[],
): Set<string> {
  const byTarget = new Map<string, Set<string>>();
  for (const r of records) {
    const validated = validateRule2Record(r);
    if (!validated.ok) {
      continue;
    }
    if (r.diseasePolarity === 'UNRESOLVED' || r.diseasePolarity === 'SUPPORT_ONLY') {
      continue;
    }
    const set = byTarget.get(r.formulaTargetId) ?? new Set<string>();
    set.add(r.diseasePolarity);
    byTarget.set(r.formulaTargetId, set);
  }
  const contradictoryTargets = new Set<string>();
  for (const [target, polarities] of byTarget) {
    if (polarities.has('POSITIVE') && polarities.has('NEGATIVE')) {
      contradictoryTargets.add(target);
    }
  }
  return contradictoryTargets;
}
