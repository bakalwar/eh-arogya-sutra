import type { Rule4EngineMode } from './version.js';
import { RULE4_FORBIDDEN_SELECTOR_INPUT_FIELDS } from './version.js';

export type Rule4PolarityPayloadRef = {
  diseasePolarity: string | null;
  requiredTherapeuticPolarity: string | null;
  sourceRule: 'rule2';
  /** Phase 1: reference only — not validated as production Rule 2 output. */
  referenceStatus: 'OPTIONAL_REFERENCE';
};

export type Rule4OrganTargetPayloadRef = {
  formulaTargetId: string | null;
  organSystemKey: string | null;
  sourceRule: 'rule3';
  referenceStatus: 'OPTIONAL_REFERENCE';
};

export type Rule4TemperamentPayloadRef = {
  temperamentLabel: string | null;
  sourceRule: 'rule1';
  referenceStatus: 'OPTIONAL_REFERENCE';
};

export type Rule4VerifiedAgeContext = {
  ageYears: number | null;
  verificationStatus: 'VERIFIED' | 'MISSING' | 'UNRESOLVED';
};

export type Rule4PatientWideSafetyFlags = {
  crisisHold: boolean;
  prescriptionHold: boolean;
  d13HardStopUnderOneYear: boolean;
};

export type Rule4PhaseInputRef = {
  phaseLabel: string | null;
  referenceStatus: 'OPTIONAL_REFERENCE';
};

export type Rule4SeverityInputRef = {
  severityScore: number | null;
  referenceStatus: 'OPTIONAL_REFERENCE';
};

export type Rule4FormulaSlotInput = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  polarityRef: Rule4PolarityPayloadRef | null;
  organTargetRef: Rule4OrganTargetPayloadRef | null;
  temperamentRef: Rule4TemperamentPayloadRef | null;
  phaseRef: Rule4PhaseInputRef | null;
  severityRef: Rule4SeverityInputRef | null;
  structuredEvidenceItemIds: readonly string[];
};

export type Rule4InputContract = {
  contractVersion: string;
  caseId: string | null;
  consultationId: string | null;
  rulesetVersion: string;
  engineMode: Rule4EngineMode;
  label: 'SYNTHETIC' | 'PRODUCTION';
  formulaSlots: readonly Rule4FormulaSlotInput[];
  verifiedAge: Rule4VerifiedAgeContext;
  patientWideSafety: Rule4PatientWideSafetyFlags;
  /** Explicit IDs only — no global_text / keyword / registry selector inputs. */
  structuredEvidenceItemIds: readonly string[];
};

export class Rule4ValidationError extends Error {
  readonly code = 'RULE4_INPUT_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4ValidationError';
  }
}

function assertForbiddenKeys(obj: Record<string, unknown>, path: string): void {
  for (const key of Object.keys(obj)) {
    if ((RULE4_FORBIDDEN_SELECTOR_INPUT_FIELDS as readonly string[]).includes(key)) {
      throw new Rule4ValidationError(`Forbidden Rule4 selector input at ${path}.${key}`);
    }
  }
}

export function validateRule4InputContract(input: Rule4InputContract): void {
  if (!input.contractVersion || typeof input.contractVersion !== 'string') {
    throw new Rule4ValidationError('contractVersion required');
  }
  if (!input.rulesetVersion || typeof input.rulesetVersion !== 'string') {
    throw new Rule4ValidationError('rulesetVersion required');
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4ValidationError('label must be SYNTHETIC or PRODUCTION');
  }
  if (!Array.isArray(input.formulaSlots)) {
    throw new Rule4ValidationError('formulaSlots must be an array');
  }
  assertForbiddenKeys(input as unknown as Record<string, unknown>, 'input');
  for (const slot of input.formulaSlots) {
    assertForbiddenKeys(slot as unknown as Record<string, unknown>, `slot:${slot.formulaSlotId}`);
    if (!slot.formulaSlotId) {
      throw new Rule4ValidationError('formulaSlotId required on each slot');
    }
  }
}
