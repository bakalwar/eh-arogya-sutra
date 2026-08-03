import type { Rule4EvidenceItemEnvelope, Rule4Rule3BindingPort } from './types.js';

export type Rule4BindingValidationResult = {
  passed: boolean;
  reasonCodes: string[];
  limitationCodes: string[];
};

export function resolveRule3BindingPort(
  ports: readonly Rule4Rule3BindingPort[],
  formulaSlotId: string,
): Rule4Rule3BindingPort | null {
  return ports.find((p) => p.formulaSlotId === formulaSlotId) ?? null;
}

export function validateFormulaTargetBinding(
  item: Rule4EvidenceItemEnvelope,
  port: Rule4Rule3BindingPort | null,
): Rule4BindingValidationResult {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = [];

  if (!port || port.portStatus !== 'RESOLVED') {
    reasonCodes.push('RULE3_BINDING_PORT_NOT_RESOLVED');
    return { passed: false, reasonCodes, limitationCodes };
  }
  if (!port.formulaTargetId || !port.organSystemKey || !port.anatomicalSite || !port.pathologyId) {
    reasonCodes.push('MISSING_MANDATORY_BINDING_FIELD');
    return { passed: false, reasonCodes, limitationCodes };
  }
  if (item.formulaTargetId !== port.formulaTargetId) {
    reasonCodes.push('CROSS_FORMULA_REPORT_LEAKAGE_BLOCKED');
    return { passed: false, reasonCodes, limitationCodes };
  }
  if (item.targetOrganSystem !== port.organSystemKey) {
    reasonCodes.push('ORGAN_SYSTEM_BINDING_MISMATCH');
    return { passed: false, reasonCodes, limitationCodes };
  }
  if (item.anatomicalSite !== port.anatomicalSite) {
    reasonCodes.push('ANATOMICAL_SITE_BINDING_MISMATCH');
    return { passed: false, reasonCodes, limitationCodes };
  }
  if (item.targetPathologyGroupId) {
    reasonCodes.push('PATHOLOGY_PARENT_GROUP_MATCH_NOT_EXECUTABLE');
    limitationCodes.push('TIER3_PATHOLOGY_MAPPING_DATA_ASSET_NOT_EXECUTABLE');
    return { passed: false, reasonCodes, limitationCodes };
  }
  if (item.targetPathologyId !== port.pathologyId) {
    reasonCodes.push('PATHOLOGY_ID_BINDING_MISMATCH');
    return { passed: false, reasonCodes, limitationCodes };
  }
  if (item.formulaSlotId !== port.formulaSlotId) {
    reasonCodes.push('CROSS_FORMULA_REPORT_LEAKAGE_BLOCKED');
    return { passed: false, reasonCodes, limitationCodes };
  }
  return { passed: true, reasonCodes, limitationCodes };
}
