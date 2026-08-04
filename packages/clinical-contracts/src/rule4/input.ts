import type { Rule4BpReadingInput, Rule4VerifiedAgeContextPhase2 } from './safety/types.js';
import type { Rule4EngineMode } from './version.js';
import {
  RULE4_CONTRACT_VERSION,
  RULE4_CONTRACT_VERSION_PHASE2,
  RULE4_FORBIDDEN_SELECTOR_INPUT_FIELDS,
} from './version.js';

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
  verificationStatus: 'VERIFIED' | 'MISSING' | 'UNRESOLVED' | 'INVALID' | 'CONTRADICTORY';
  verifiedDateOfBirth?: string | null;
  consultationAssessmentDate?: string | null;
  ageSource?: string | null;
  upstreamVerifiedPediatricBand?: 'P13_A' | 'P13_B' | 'P13_C' | 'P13_D' | 'P13_E' | null;
  pediatricBandVerificationStatus?:
    'VERIFIED' | 'MISSING' | 'UNRESOLVED' | 'INVALID' | 'CONTRADICTORY' | null;
};

export type Rule4PatientWideSafetyFlags = {
  crisisHold: boolean | null;
  prescriptionHold: boolean | null;
  d13HardStopUnderOneYear?: boolean;
  contraindicationHold?: boolean | null;
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
  bpReadings?: readonly Rule4BpReadingInput[];
  structuredCriticalFindings?: readonly import('./safety/structuredCritical.js').Rule4StructuredCriticalFinding[];
  structuredFrozenRedFlags?: readonly import('./safety/structuredCritical.js').Rule4StructuredFrozenRedFlag[];
  /** @deprecated Phase 2 — ignored; use structuredCriticalFindings */
  sourceDeclaredCriticalFlags?: readonly string[];
  /** @deprecated Phase 2 — ignored; use structuredFrozenRedFlags */
  frozenRedFlagCodes?: readonly string[];
  rawLabKeywordPresent?: boolean;
  /** Phase 3 — shadow-only structured evidence adapter input (in-memory). */
  evidenceAdapter?: import('./evidence/types.js').Rule4EvidenceAdapterInput;
  /** Phase 4 — shadow-only typed Rule 2 polarity envelope (in-memory). */
  polarityAdapter?: import('./polarity/types.js').Rule4PolarityAdapterInput;
  /** Phase 5 — shadow-only structured disease-phase envelope (in-memory). */
  phaseAdapter?: import('./phase/types.js').Rule4PhaseAdapterInput;
  /** Phase 6 — shadow-only structured per-target severity envelope (in-memory). */
  severityAdapter?: import('./severity/types.js').Rule4SeverityAdapterInput;
  /** Phase 7 — shadow-only candidate eligibility envelope (in-memory). */
  eligibilityAdapter?: import('./eligibility/types.js').Rule4EligibilityAdapterInput;
  /** Phase 8 — shadow-only numeric draft selection envelope (in-memory). */
  selectionAdapter?: import('./selection/types.js').Rule4SelectionAdapterInput;
};

export type Rule4InputContractPhase2 = Rule4InputContract & {
  contractVersion: typeof RULE4_CONTRACT_VERSION_PHASE2;
  verifiedAge: Rule4VerifiedAgeContextPhase2;
};

const ACCEPTED_CONTRACT_VERSIONS = new Set<string>([
  RULE4_CONTRACT_VERSION,
  RULE4_CONTRACT_VERSION_PHASE2,
]);

export function isRule4Phase2SafetyContract(
  input: Rule4InputContract,
): input is Rule4InputContractPhase2 {
  return input.contractVersion === RULE4_CONTRACT_VERSION_PHASE2;
}

export function toPhase2VerifiedAge(ctx: Rule4VerifiedAgeContext): Rule4VerifiedAgeContextPhase2 {
  return {
    ageYears: ctx.ageYears ?? null,
    verificationStatus: ctx.verificationStatus ?? 'MISSING',
    verifiedDateOfBirth: ctx.verifiedDateOfBirth ?? null,
    consultationAssessmentDate: ctx.consultationAssessmentDate ?? null,
    ageSource: ctx.ageSource ?? null,
    upstreamVerifiedPediatricBand: ctx.upstreamVerifiedPediatricBand ?? null,
    pediatricBandVerificationStatus: ctx.pediatricBandVerificationStatus ?? null,
  };
}

function validateBpReading(reading: Rule4BpReadingInput, index: number): void {
  if (reading.systolic != null && typeof reading.systolic !== 'number') {
    throw new Rule4ValidationError(`bpReadings[${index}].systolic must be number or null`);
  }
  if (reading.diastolic != null && typeof reading.diastolic !== 'number') {
    throw new Rule4ValidationError(`bpReadings[${index}].diastolic must be number or null`);
  }
  if (!reading.evidenceStatus) {
    throw new Rule4ValidationError(`bpReadings[${index}].evidenceStatus required`);
  }
}

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
  if (!ACCEPTED_CONTRACT_VERSIONS.has(input.contractVersion)) {
    throw new Rule4ValidationError('contractVersion not supported');
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
  if (input.bpReadings) {
    input.bpReadings.forEach((r, i) => validateBpReading(r, i));
  }
  if (input.rawLabKeywordPresent != null && typeof input.rawLabKeywordPresent !== 'boolean') {
    throw new Rule4ValidationError('rawLabKeywordPresent must be boolean when provided');
  }
}
