export type Rule4CriticalSourceType =
  'STRUCTURED_REPORT' | 'OWNER_STRUCTURED' | 'DOCTOR_STRUCTURED' | 'APPROVED_UPSTREAM';

export type Rule4CriticalAssertionStatus = 'ACTIVE' | 'PRESENT';

export type Rule4CriticalVerificationStatus = 'VERIFIED' | 'INVALID' | 'UNRESOLVED';

export type Rule4StructuredCriticalFinding = {
  criticalFlagCode: string;
  verificationStatus: Rule4CriticalVerificationStatus;
  sourceReferenceId: string;
  sourceType: Rule4CriticalSourceType;
  assertionStatus: Rule4CriticalAssertionStatus;
};

export type Rule4StructuredFrozenRedFlag = {
  redFlagCode: string;
  verificationStatus: Rule4CriticalVerificationStatus;
  sourceReferenceId: string;
  sourceType: Rule4CriticalSourceType;
  assertionStatus: Rule4CriticalAssertionStatus;
};

/** Q16-H source-declared categories (fixture: phase2-allowed-critical-codes.v1.json). */
export const RULE4_SOURCE_DECLARED_CRITICAL_CODES = [
  'SOURCE_DECLARED_CRITICAL',
  'SOURCE_DECLARED_LIFE_THREATENING',
  'SOURCE_DECLARED_URGENT',
] as const;

/** Q4F acute neurological red flag (fixture: phase2-allowed-critical-codes.v1.json). */
export const RULE4_FROZEN_RED_FLAG_CODES = ['ACUTE_NEUROLOGICAL_RED_FLAG'] as const;

export type Rule4CriticalEvaluation = {
  escalationEligible: boolean;
  hasUnknownCodes: boolean;
  hasInvalidEntries: boolean;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

const SOURCE_DECLARED = new Set<string>(RULE4_SOURCE_DECLARED_CRITICAL_CODES);
const FROZEN_RED = new Set<string>(RULE4_FROZEN_RED_FLAG_CODES);

const USABLE_VERIFICATION = new Set<Rule4CriticalVerificationStatus>(['VERIFIED']);
const USABLE_ASSERTION = new Set<Rule4CriticalAssertionStatus>(['ACTIVE', 'PRESENT']);
const USABLE_SOURCE_TYPES = new Set<Rule4CriticalSourceType>([
  'STRUCTURED_REPORT',
  'OWNER_STRUCTURED',
  'DOCTOR_STRUCTURED',
  'APPROVED_UPSTREAM',
]);

function entryUsable(
  verificationStatus: Rule4CriticalVerificationStatus,
  assertionStatus: Rule4CriticalAssertionStatus,
  sourceType: Rule4CriticalSourceType,
  sourceReferenceId: string,
): boolean {
  return (
    USABLE_VERIFICATION.has(verificationStatus) &&
    USABLE_ASSERTION.has(assertionStatus) &&
    USABLE_SOURCE_TYPES.has(sourceType) &&
    typeof sourceReferenceId === 'string' &&
    sourceReferenceId.trim().length > 0
  );
}

export function evaluateStructuredCriticalInputs(input: {
  structuredCriticalFindings: readonly Rule4StructuredCriticalFinding[];
  structuredFrozenRedFlags: readonly Rule4StructuredFrozenRedFlag[];
}): Rule4CriticalEvaluation {
  const reasonCodes: string[] = [];
  const limitationCodes: string[] = [];
  let escalationEligible = false;
  let hasUnknownCodes = false;
  let hasInvalidEntries = false;

  for (const finding of input.structuredCriticalFindings) {
    if (!SOURCE_DECLARED.has(finding.criticalFlagCode)) {
      hasUnknownCodes = true;
      reasonCodes.push('UNKNOWN_CRITICAL_FLAG_CODE');
      continue;
    }
    if (
      !entryUsable(
        finding.verificationStatus,
        finding.assertionStatus,
        finding.sourceType,
        finding.sourceReferenceId,
      )
    ) {
      hasInvalidEntries = true;
      reasonCodes.push('CRITICAL_FINDING_INPUT_INVALID');
      continue;
    }
    escalationEligible = true;
    reasonCodes.push('SOURCE_DECLARED_CRITICAL_FINDING');
  }

  for (const flag of input.structuredFrozenRedFlags) {
    if (!FROZEN_RED.has(flag.redFlagCode)) {
      hasUnknownCodes = true;
      reasonCodes.push('UNKNOWN_CRITICAL_FLAG_CODE');
      continue;
    }
    if (
      !entryUsable(
        flag.verificationStatus,
        flag.assertionStatus,
        flag.sourceType,
        flag.sourceReferenceId,
      )
    ) {
      hasInvalidEntries = true;
      reasonCodes.push('CRITICAL_FINDING_INPUT_INVALID');
      continue;
    }
    escalationEligible = true;
    reasonCodes.push('FROZEN_RED_FLAG_ESCALATION');
  }

  if (hasUnknownCodes) {
    limitationCodes.push('CRITICAL_FLAG_CODE_NOT_IN_PHASE2_ALLOWLIST');
  }

  return {
    escalationEligible,
    hasUnknownCodes,
    hasInvalidEntries,
    reasonCodes: [...new Set(reasonCodes)],
    limitationCodes: [...new Set(limitationCodes)],
  };
}
