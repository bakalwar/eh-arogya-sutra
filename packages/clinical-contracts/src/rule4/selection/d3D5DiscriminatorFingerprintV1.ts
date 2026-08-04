import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4GateResult } from '../eligibility/types.js';
import { evidenceProvenanceFingerprintPayload } from './d3D5EvidenceProvenance.js';
import type {
  Rule4CloseD05DiscriminatorStatus,
  Rule4D08ConfidenceStatus,
  Rule4D08UsabilityStatus,
  Rule4D3D5DiscriminatorEnvelope,
  Rule4D3D5SensitivityAssessmentStatus,
} from './types.js';

export const RULE4_D3D5_DISCRIMINATOR_FINGERPRINT_V1 =
  'rule4-d3d5-discriminator-fingerprint-v1' as const;

function gatePayload(gate: Rule4GateResult): Record<string, unknown> {
  return {
    gate_id: gate.gateId,
    outcome: gate.outcome,
    evidence_item_ids: [...gate.evidenceItemIds].sort(),
    reason_codes: [...gate.reasonCodes].sort(),
    limitation_codes: [...gate.limitationCodes].sort(),
  };
}

export function rule4D3D5DiscriminatorFingerprintV1Payload(
  envelope: Omit<Rule4D3D5DiscriminatorEnvelope, 'discriminatorFingerprint'>,
): string {
  const gates = [...envelope.q7bfGateResults]
    .sort((a, b) => a.gateId.localeCompare(b.gateId))
    .map(gatePayload);
  return canonicalStableDumps({
    fingerprint_version: RULE4_D3D5_DISCRIMINATOR_FINGERPRINT_V1,
    formula_slot_id: envelope.formulaSlotId,
    formula_target_id: envelope.formulaTargetId,
    upstream_phase7_eligibility_fingerprint: envelope.upstreamPhase7EligibilityFingerprint,
    q7bf_gate_results: gates,
    d08_document_status: envelope.d08DocumentStatus,
    d08_document_confidence: envelope.d08DocumentConfidence,
    d08_item_status: envelope.d08ItemStatus,
    d08_item_confidence: envelope.d08ItemConfidence,
    sensitivity_assessment_status: envelope.sensitivityAssessmentStatus,
    close_d05_discriminator_status: envelope.closeD05DiscriminatorStatus,
    evidence_item_ids: [...envelope.evidenceItemIds].sort(),
    evidence_provenance: evidenceProvenanceFingerprintPayload(envelope.evidenceProvenance ?? []),
    source_reference_ids: [...envelope.sourceReferenceIds].sort(),
    binding_status: envelope.bindingStatus,
  });
}

export function rule4D3D5DiscriminatorFingerprintV1Hash(
  envelope: Omit<Rule4D3D5DiscriminatorEnvelope, 'discriminatorFingerprint'>,
): string {
  const payload = rule4D3D5DiscriminatorFingerprintV1Payload(envelope);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function withComputedDiscriminatorFingerprint(
  envelope: Omit<Rule4D3D5DiscriminatorEnvelope, 'discriminatorFingerprint'>,
): Rule4D3D5DiscriminatorEnvelope {
  return {
    ...envelope,
    discriminatorFingerprint: rule4D3D5DiscriminatorFingerprintV1Hash(envelope),
  };
}

export type Rule4D3D5DiscriminatorFingerprintFields = {
  formulaSlotId: string;
  formulaTargetId: string;
  upstreamPhase7EligibilityFingerprint: string;
  q7bfGateResults: readonly Rule4GateResult[];
  d08DocumentStatus: Rule4D08UsabilityStatus;
  d08DocumentConfidence: Rule4D08ConfidenceStatus;
  d08ItemStatus: Rule4D08UsabilityStatus;
  d08ItemConfidence: Rule4D08ConfidenceStatus;
  sensitivityAssessmentStatus: Rule4D3D5SensitivityAssessmentStatus;
  closeD05DiscriminatorStatus: Rule4CloseD05DiscriminatorStatus;
  evidenceItemIds: readonly string[];
  evidenceProvenance: readonly import('./types.js').Rule4D3D5EvidenceProvenanceRecord[];
  sourceReferenceIds: readonly string[];
  bindingStatus: Rule4D3D5DiscriminatorEnvelope['bindingStatus'];
};
