import type {
  Rule2FormulaPolarityRecord,
  Rule4PolarityPathway,
  Rule4SlotPolarityRouting,
} from './types.js';
import { findSameTargetPolarityContradictions, validateRule2Record } from './rule2Validate.js';

function emptyRouting(
  slotId: string,
  targetId: string | null,
  pathway: Rule4PolarityPathway,
  potencyStatus: Rule4SlotPolarityRouting['potencyStatus'],
  reasonCodes: string[],
  limitationCodes: string[],
): Rule4SlotPolarityRouting {
  return {
    formulaSlotId: slotId,
    formulaTargetId: targetId,
    rule2RecordId: null,
    diseasePolarity: null,
    requiredTherapeuticPolarity: null,
    resolutionStatus: null,
    pathway,
    potencyStatus,
    selectedCascade: null,
    selectedDilution: null,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
  };
}

function routeValidatedRecord(
  record: Rule2FormulaPolarityRecord,
  contradictoryTargets: Set<string>,
): Rule4SlotPolarityRouting {
  const baseLimitation = ['PHASE4_NO_NUMERIC_CASCADE'];
  if (contradictoryTargets.has(record.formulaTargetId)) {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: record.diseasePolarity,
      requiredTherapeuticPolarity: record.requiredTherapeuticPolarity,
      resolutionStatus: record.resolutionStatus,
      pathway: 'POLARITY_CONTRADICTORY',
      potencyStatus: 'UNRESOLVED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: ['POLARITY_SAME_TARGET_CONTRADICTION'],
      limitationCodes: baseLimitation,
    };
  }

  const disease = record.diseasePolarity;
  const therapeutic = record.requiredTherapeuticPolarity;
  const status = record.resolutionStatus;

  if (status === 'CONTRADICTORY' || status === 'AMBIGUOUS') {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeutic,
      resolutionStatus: status,
      pathway: status === 'CONTRADICTORY' ? 'POLARITY_CONTRADICTORY' : 'UNRESOLVED_NO_CASCADE',
      potencyStatus: 'UNRESOLVED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: [
        status === 'CONTRADICTORY'
          ? 'POLARITY_SAME_TARGET_CONTRADICTION'
          : 'RULE2_POLARITY_STATUS_AMBIGUOUS',
      ],
      limitationCodes: baseLimitation,
    };
  }

  if (disease === 'SUPPORT_ONLY') {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeutic,
      resolutionStatus: status,
      pathway: 'SUPPORT_ONLY_NON_POTENCY',
      potencyStatus: 'UNRESOLVED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: ['POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT'],
      limitationCodes: baseLimitation,
    };
  }

  if (
    disease === 'UNRESOLVED' ||
    status === 'UNRESOLVED' ||
    status === 'NEUTRAL_FALLBACK_PENDING_REVIEW'
  ) {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeutic,
      resolutionStatus: status,
      pathway: 'UNRESOLVED_NO_CASCADE',
      potencyStatus: 'UNRESOLVED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: ['UPSTREAM_TARGET_POLARITY_NOT_RESOLVED'],
      limitationCodes: baseLimitation,
    };
  }

  if (disease === 'NEUTRAL' && status === 'RESOLVED') {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeutic,
      resolutionStatus: status,
      pathway: 'NEUTRAL_NON_POTENCY',
      potencyStatus: 'NOT_EVALUATED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: ['POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET'],
      limitationCodes: baseLimitation,
    };
  }

  if (disease === 'MIXED') {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeutic,
      resolutionStatus: status,
      pathway: 'UNRESOLVED_NO_CASCADE',
      potencyStatus: 'UNRESOLVED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: ['UPSTREAM_TARGET_POLARITY_NOT_RESOLVED', 'REGISTRY_Q9_SELECTOR_BLOCKED'],
      limitationCodes: baseLimitation,
    };
  }

  if (disease === 'NEGATIVE' && therapeutic === 'POSITIVE' && status === 'RESOLVED') {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeutic,
      resolutionStatus: status,
      pathway: 'NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP',
      potencyStatus: 'NOT_EVALUATED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: ['RULE4_POLARITY_PATHWAY_ROUTED'],
      limitationCodes: baseLimitation,
    };
  }

  if (disease === 'POSITIVE' && therapeutic === 'NEGATIVE' && status === 'RESOLVED') {
    return {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      rule2RecordId: record.rule2RecordId,
      diseasePolarity: disease,
      requiredTherapeuticPolarity: therapeutic,
      resolutionStatus: status,
      pathway: 'POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP',
      potencyStatus: 'NOT_EVALUATED',
      selectedCascade: null,
      selectedDilution: null,
      reasonCodes: ['RULE4_POLARITY_PATHWAY_ROUTED'],
      limitationCodes: baseLimitation,
    };
  }

  return {
    formulaSlotId: record.formulaSlotId,
    formulaTargetId: record.formulaTargetId,
    rule2RecordId: record.rule2RecordId,
    diseasePolarity: disease,
    requiredTherapeuticPolarity: therapeutic,
    resolutionStatus: status,
    pathway: 'POLARITY_CONTRADICTORY',
    potencyStatus: 'UNRESOLVED',
    selectedCascade: null,
    selectedDilution: null,
    reasonCodes: ['RULE2_THERAPEUTIC_POLARITY_MISMATCH'],
    limitationCodes: baseLimitation,
  };
}

export function routePolarityForSlots(
  formulaSlotIds: readonly string[],
  records: readonly Rule2FormulaPolarityRecord[],
): Rule4SlotPolarityRouting[] {
  const contradictoryTargets = findSameTargetPolarityContradictions(records);
  const bySlot = new Map<string, Rule2FormulaPolarityRecord>();
  for (const r of records) {
    bySlot.set(r.formulaSlotId, r);
  }

  const routings: Rule4SlotPolarityRouting[] = [];
  for (const slotId of [...formulaSlotIds].sort()) {
    const record = bySlot.get(slotId);
    if (!record) {
      routings.push(
        emptyRouting(
          slotId,
          null,
          'UNRESOLVED_NO_CASCADE',
          'UNRESOLVED',
          ['RULE2_POLARITY_RECORD_MISSING'],
          ['PHASE4_NO_NUMERIC_CASCADE'],
        ),
      );
      continue;
    }
    const validated = validateRule2Record(record);
    if (!validated.ok) {
      routings.push(
        emptyRouting(
          slotId,
          record.formulaTargetId ?? null,
          'UNRESOLVED_NO_CASCADE',
          'UNRESOLVED',
          validated.reasonCodes,
          ['PHASE4_NO_NUMERIC_CASCADE'],
        ),
      );
      continue;
    }
    routings.push(routeValidatedRecord(record, contradictoryTargets));
  }

  return routings.sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId));
}
