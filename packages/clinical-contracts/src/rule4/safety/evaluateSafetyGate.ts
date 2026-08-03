import type { Rule4InputContractPhase2 } from '../input.js';
import { resolveVerifiedAge } from './ageValidator.js';
import { evaluateBpCrisis } from './bpCrisis.js';
import { aggregatePatientWideHolds } from './holdAggregator.js';
import { evaluateStructuredCriticalInputs } from './structuredCritical.js';

export function evaluateRule4SafetyGate(
  input: Rule4InputContractPhase2,
): ReturnType<typeof aggregatePatientWideHolds> {
  const bpCrisis = evaluateBpCrisis(input.bpReadings ?? []);
  const ageResolution = resolveVerifiedAge(input.verifiedAge);
  const criticalEvaluation = evaluateStructuredCriticalInputs({
    structuredCriticalFindings: input.structuredCriticalFindings ?? [],
    structuredFrozenRedFlags: input.structuredFrozenRedFlags ?? [],
  });
  const flags = input.patientWideSafety;
  return aggregatePatientWideHolds({
    bpCrisis,
    ageResolution,
    criticalEvaluation,
    explicitPrescriptionHold: flags.prescriptionHold === true,
    explicitContraindicationHold: flags.contraindicationHold === true,
    explicitCrisisHold: flags.crisisHold === true,
    rawLabKeywordPresent: input.rawLabKeywordPresent === true,
  });
}
