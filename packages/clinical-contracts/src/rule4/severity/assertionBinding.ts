import { RULE4_PHASE_TARGET_ROLE_VALUES, type Rule4PhaseTargetRole } from '../phase/types.js';
import type { Rule4FormulaSeverityRecord, Rule4SeverityEvidenceAssertion } from './types.js';

const FLARE: Rule4PhaseTargetRole = 'CURRENT_ACUTE_FLARE';
const CHRONIC: Rule4PhaseTargetRole = 'UNDERLYING_CHRONIC_TARGET';

export type CrossRoleGuardOptions = {
  label: 'SYNTHETIC' | 'PRODUCTION';
  trustedSyntheticBindingBypass: boolean;
};

export function syntheticBindingBypassActive(options: CrossRoleGuardOptions): boolean {
  return options.label === 'SYNTHETIC' && options.trustedSyntheticBindingBypass === true;
}

export function isKnownTargetRole(value: unknown): value is Rule4PhaseTargetRole {
  return (
    typeof value === 'string' &&
    (RULE4_PHASE_TARGET_ROLE_VALUES as readonly string[]).includes(value)
  );
}

export function validateAssertionBoundTargetRoles(
  records: readonly Rule4FormulaSeverityRecord[],
): void {
  for (const record of records) {
    for (const assertion of record.severityEvidenceAssertions) {
      const raw = assertion.boundTargetRole;
      if (raw != null && !isKnownTargetRole(raw)) {
        throw new Error('RULE4_SEVERITY_BOUND_TARGET_ROLE_INVALID');
      }
    }
  }
}

export type ResolvedAssertionBinding = {
  evidenceItemId: string;
  receivingFormulaSlotId: string;
  receivingFormulaTargetId: string;
  receivingTargetRole: Rule4PhaseTargetRole;
  boundFormulaSlotId: string;
  boundFormulaTargetId: string;
  boundTargetRole: Rule4PhaseTargetRole;
  bindingAuthoritative: boolean;
  missingAcuteChronicAuthority: boolean;
};

export function resolveAssertionBinding(
  assertion: Rule4SeverityEvidenceAssertion,
  record: Rule4FormulaSeverityRecord,
  options: CrossRoleGuardOptions,
): ResolvedAssertionBinding {
  const receivingTargetRole = record.targetRole;
  const explicitRole = assertion.boundTargetRole;

  let boundTargetRole: Rule4PhaseTargetRole;
  let missingAcuteChronicAuthority = false;

  if (explicitRole != null) {
    boundTargetRole = explicitRole;
  } else if (receivingTargetRole === FLARE || receivingTargetRole === CHRONIC) {
    if (syntheticBindingBypassActive(options)) {
      boundTargetRole = receivingTargetRole;
    } else {
      missingAcuteChronicAuthority = true;
      boundTargetRole = receivingTargetRole;
    }
  } else {
    boundTargetRole = receivingTargetRole;
  }

  const boundFormulaSlotId = assertion.boundFormulaSlotId ?? record.formulaSlotId;
  const boundFormulaTargetId = assertion.boundFormulaTargetId ?? record.formulaTargetId;

  const bindingAuthoritative =
    !missingAcuteChronicAuthority &&
    (explicitRole != null ||
      (receivingTargetRole === 'STANDARD_FORMULA_TARGET' &&
        boundFormulaSlotId === record.formulaSlotId &&
        boundFormulaTargetId === record.formulaTargetId) ||
      (syntheticBindingBypassActive(options) &&
        (receivingTargetRole === FLARE || receivingTargetRole === CHRONIC)));

  return {
    evidenceItemId: assertion.evidenceItemId,
    receivingFormulaSlotId: record.formulaSlotId,
    receivingFormulaTargetId: record.formulaTargetId,
    receivingTargetRole,
    boundFormulaSlotId,
    boundFormulaTargetId,
    boundTargetRole,
    bindingAuthoritative,
    missingAcuteChronicAuthority,
  };
}

export function isFlareOrChronic(role: Rule4PhaseTargetRole): boolean {
  return role === FLARE || role === CHRONIC;
}

export function isAcuteChronicCross(
  boundRole: Rule4PhaseTargetRole,
  receivingRole: Rule4PhaseTargetRole,
): boolean {
  return (
    (boundRole === FLARE && receivingRole === CHRONIC) ||
    (boundRole === CHRONIC && receivingRole === FLARE)
  );
}
