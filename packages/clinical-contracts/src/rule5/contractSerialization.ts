import { canonicalStableDumps } from '../rule4/canonicalJson.js';
import {
  RULE5_CANONICAL_CONTRACT_FOUNDATION,
  type Rule5ContractAuditContext,
  type Rule5ContractFoundationDocument,
  type Rule5ContractFoundationInput,
  type Rule5ContractFoundationOutput,
  type Rule5ContractFingerprintV1Payload,
  RULE5_CONTRACT_FINGERPRINT_V1_PAYLOAD,
} from './contractFoundation.js';

function normalizeInput(input: Rule5ContractFoundationInput): Record<string, unknown> {
  return {
    contractVersion: input.contractVersion,
    ruleSetVersion: input.ruleSetVersion,
    evaluationMode: input.evaluationMode,
    invocationKind: input.invocationKind,
  };
}

function normalizeAuditContext(ctx: Rule5ContractAuditContext): Record<string, unknown> {
  return {
    contractVersion: ctx.contractVersion,
    ruleSetVersion: ctx.ruleSetVersion,
    reasonRegistryVersion: ctx.reasonRegistryVersion,
    hardBlockerMatrixVersion: ctx.hardBlockerMatrixVersion,
    fingerprintVersion: ctx.fingerprintVersion,
  };
}

function normalizeOutput(output: Rule5ContractFoundationOutput): Record<string, unknown> {
  return {
    contractVersion: output.contractVersion,
    ruleSetVersion: output.ruleSetVersion,
    ruleNumber: output.ruleNumber,
    ruleName: output.ruleName,
    status: output.status,
    evaluationMode: output.evaluationMode,
    implemented: output.implemented,
    connected: output.connected,
    affectsClinicalSelection: output.affectsClinicalSelection,
    clinicalActionAuthorized: output.clinicalActionAuthorized,
    prescriptionMutationAuthorized: output.prescriptionMutationAuthorized,
    medicineMutationAuthorized: output.medicineMutationAuthorized,
    potencyMutationAuthorized: output.potencyMutationAuthorized,
    dosageMutationAuthorized: output.dosageMutationAuthorized,
    reasonCodes: [...output.reasonCodes],
    limitationCodes: [...output.limitationCodes],
    auditContext: normalizeAuditContext(output.auditContext),
    fingerprintVersion: output.fingerprintVersion,
    deterministicFingerprint: output.deterministicFingerprint,
  };
}

export function serializeRule5ContractFoundationInput(
  input: Rule5ContractFoundationInput = RULE5_CANONICAL_CONTRACT_FOUNDATION.canonicalInput,
): string {
  return canonicalStableDumps(normalizeInput(input));
}

export function serializeRule5ContractFoundationOutput(
  output: Rule5ContractFoundationOutput = RULE5_CANONICAL_CONTRACT_FOUNDATION.canonicalOutput,
): string {
  return canonicalStableDumps(normalizeOutput(output));
}

export function serializeRule5ContractFoundationDocument(
  doc: Rule5ContractFoundationDocument = RULE5_CANONICAL_CONTRACT_FOUNDATION,
): string {
  return canonicalStableDumps({
    canonicalInput: normalizeInput(doc.canonicalInput),
    canonicalOutput: normalizeOutput(doc.canonicalOutput),
  });
}

export function serializeRule5ContractFingerprintV1Payload(
  payload: Rule5ContractFingerprintV1Payload = RULE5_CONTRACT_FINGERPRINT_V1_PAYLOAD,
): string {
  return canonicalStableDumps({
    contractVersion: payload.contractVersion,
    fingerprintVersion: payload.fingerprintVersion,
    hardBlockerMatrixVersion: payload.hardBlockerMatrixVersion,
    reasonRegistryVersion: payload.reasonRegistryVersion,
    ruleSetVersion: payload.ruleSetVersion,
  });
}
