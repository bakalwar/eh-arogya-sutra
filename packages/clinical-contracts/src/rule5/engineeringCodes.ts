/**
 * Rule 5 engineering limitation / gate codes (non-clinical).
 * Never part of the 34-code R5_* clinical registry (OD-R5-M0-013).
 */

export const RULE5_ENGINEERING_LIMITATION_CODES = Object.freeze([
  'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
  'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED',
  'RULE5_ENGINE_MODE_SHADOW_NOT_AUTHORIZED',
  'RULE5_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED',
  'RULE5_ENGINE_MODE_INVALID',
] as const);

export type Rule5EngineeringLimitationCode = (typeof RULE5_ENGINEERING_LIMITATION_CODES)[number];

/** Canonical M4 output limitation pair (metadata-only posture). */
export const RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES = Object.freeze([
  'RULE5_CONTRACT_FOUNDATION_NOT_IMPLEMENTED',
  'RULE5_CONTRACT_RUNTIME_NOT_CONNECTED',
] as const);

export type Rule5M4CanonicalOutputLimitationCode =
  (typeof RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES)[number];

function engineeringCodeLookup(code: string): boolean {
  for (const known of RULE5_ENGINEERING_LIMITATION_CODES) {
    if (known === code) return true;
  }
  return false;
}

export function isKnownRule5EngineeringLimitationCode(
  code: string,
): code is Rule5EngineeringLimitationCode {
  return engineeringCodeLookup(code);
}

export function isRule5ClinicalReasonNamespace(code: string): boolean {
  return code.startsWith('R5_');
}

export function isRule5EngineeringNamespace(code: string): boolean {
  return code.startsWith('RULE5_');
}
