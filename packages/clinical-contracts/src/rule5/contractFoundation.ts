/**
 * R5-M4 — minimal non-executable Rule 5 contract foundation (canonical document).
 */

import { RULE_SET_VERSION } from '../nineRules.js';
import { RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES } from './engineeringCodes.js';
import {
  RULE5_CONTRACT_VERSION,
  RULE5_FINGERPRINT_VERSION,
  RULE5_HARD_BLOCKER_MATRIX_VERSION,
  RULE5_REASON_REGISTRY_VERSION,
} from './version.js';

export const RULE5_CANONICAL_RULE_NUMBER = 5 as const;

export const RULE5_CANONICAL_RULE_NAME =
  'Monitoring, Follow-up & Post-Release Safety Surveillance' as const;

export const RULE5_CONTRACT_INVOCATION_KIND = 'CONTRACT_VALIDATION' as const;

/** Full mode vocabulary (M4 contract validation accepts OFF only). */
export const RULE5_EVALUATION_MODE_VOCABULARY = Object.freeze(['OFF', 'SHADOW', 'ACTIVE'] as const);

export type Rule5EvaluationModeVocabulary = (typeof RULE5_EVALUATION_MODE_VOCABULARY)[number];

export type Rule5M4SupportedEvaluationMode = 'OFF';

export type Rule5ContractFoundationInput = {
  contractVersion: typeof RULE5_CONTRACT_VERSION;
  ruleSetVersion: typeof RULE_SET_VERSION;
  evaluationMode: Rule5M4SupportedEvaluationMode;
  invocationKind: typeof RULE5_CONTRACT_INVOCATION_KIND;
};

export type Rule5ContractAuditContext = {
  contractVersion: typeof RULE5_CONTRACT_VERSION;
  ruleSetVersion: typeof RULE_SET_VERSION;
  reasonRegistryVersion: typeof RULE5_REASON_REGISTRY_VERSION;
  hardBlockerMatrixVersion: typeof RULE5_HARD_BLOCKER_MATRIX_VERSION;
  fingerprintVersion: typeof RULE5_FINGERPRINT_VERSION;
};

export type Rule5ContractFoundationOutput = {
  contractVersion: typeof RULE5_CONTRACT_VERSION;
  ruleSetVersion: typeof RULE_SET_VERSION;
  ruleNumber: typeof RULE5_CANONICAL_RULE_NUMBER;
  ruleName: typeof RULE5_CANONICAL_RULE_NAME;
  status: 'NOT_IMPLEMENTED';
  evaluationMode: Rule5M4SupportedEvaluationMode;
  implemented: false;
  connected: false;
  affectsClinicalSelection: false;
  clinicalActionAuthorized: false;
  prescriptionMutationAuthorized: false;
  medicineMutationAuthorized: false;
  potencyMutationAuthorized: false;
  dosageMutationAuthorized: false;
  reasonCodes: readonly [];
  limitationCodes: typeof RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES;
  auditContext: Rule5ContractAuditContext;
  fingerprintVersion: typeof RULE5_FINGERPRINT_VERSION;
  deterministicFingerprint: null;
};

export type Rule5ContractFoundationDocument = {
  canonicalInput: Rule5ContractFoundationInput;
  canonicalOutput: Rule5ContractFoundationOutput;
};

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  for (const v of Object.values(value)) {
    if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
      deepFreeze(v as object);
    }
  }
  return value;
}

const CANONICAL_AUDIT_CONTEXT: Rule5ContractAuditContext = deepFreeze({
  contractVersion: RULE5_CONTRACT_VERSION,
  ruleSetVersion: RULE_SET_VERSION,
  reasonRegistryVersion: RULE5_REASON_REGISTRY_VERSION,
  hardBlockerMatrixVersion: RULE5_HARD_BLOCKER_MATRIX_VERSION,
  fingerprintVersion: RULE5_FINGERPRINT_VERSION,
});

const CANONICAL_INPUT: Rule5ContractFoundationInput = deepFreeze({
  contractVersion: RULE5_CONTRACT_VERSION,
  ruleSetVersion: RULE_SET_VERSION,
  evaluationMode: 'OFF',
  invocationKind: RULE5_CONTRACT_INVOCATION_KIND,
});

const CANONICAL_OUTPUT: Rule5ContractFoundationOutput = deepFreeze({
  contractVersion: RULE5_CONTRACT_VERSION,
  ruleSetVersion: RULE_SET_VERSION,
  ruleNumber: RULE5_CANONICAL_RULE_NUMBER,
  ruleName: RULE5_CANONICAL_RULE_NAME,
  status: 'NOT_IMPLEMENTED',
  evaluationMode: 'OFF',
  implemented: false,
  connected: false,
  affectsClinicalSelection: false,
  clinicalActionAuthorized: false,
  prescriptionMutationAuthorized: false,
  medicineMutationAuthorized: false,
  potencyMutationAuthorized: false,
  dosageMutationAuthorized: false,
  reasonCodes: Object.freeze([] as const),
  limitationCodes: RULE5_M4_CANONICAL_OUTPUT_LIMITATION_CODES,
  auditContext: CANONICAL_AUDIT_CONTEXT,
  fingerprintVersion: RULE5_FINGERPRINT_VERSION,
  deterministicFingerprint: null,
});

export const RULE5_CANONICAL_CONTRACT_FOUNDATION: Rule5ContractFoundationDocument = deepFreeze({
  canonicalInput: CANONICAL_INPUT,
  canonicalOutput: CANONICAL_OUTPUT,
});

/** Future fingerprint payload schema (serialization only — no hash in M4). */
export type Rule5ContractFingerprintV1Payload = {
  fingerprintVersion: typeof RULE5_FINGERPRINT_VERSION;
  contractVersion: typeof RULE5_CONTRACT_VERSION;
  ruleSetVersion: typeof RULE_SET_VERSION;
  reasonRegistryVersion: typeof RULE5_REASON_REGISTRY_VERSION;
  hardBlockerMatrixVersion: typeof RULE5_HARD_BLOCKER_MATRIX_VERSION;
};

export const RULE5_CONTRACT_FINGERPRINT_V1_PAYLOAD: Rule5ContractFingerprintV1Payload = deepFreeze({
  fingerprintVersion: RULE5_FINGERPRINT_VERSION,
  contractVersion: RULE5_CONTRACT_VERSION,
  ruleSetVersion: RULE_SET_VERSION,
  reasonRegistryVersion: RULE5_REASON_REGISTRY_VERSION,
  hardBlockerMatrixVersion: RULE5_HARD_BLOCKER_MATRIX_VERSION,
});
