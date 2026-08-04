import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4DoctorReviewAdapterOutput, Rule4IssuanceGateResult } from './types.js';

export const RULE4_DOCTOR_REVIEW_FINGERPRINT_V1 = 'rule4-doctor-review-fingerprint-v1' as const;

function gatePayload(g: Rule4IssuanceGateResult): Record<string, unknown> {
  return {
    gate_id: g.gateId,
    outcome: g.outcome,
    reason_codes: [...g.reasonCodes].sort(),
  };
}

export function rule4DoctorReviewFingerprintV1Payload(input: {
  rulesetVersion: string;
  registryVersion: string;
  doctorAction: string;
  consultationId: string;
  draftVersion: string;
  doctorId: string;
  output: Pick<
    Rule4DoctorReviewAdapterOutput,
    | 'doctorReviewStatus'
    | 'issuanceEligibilityStatus'
    | 'phase3ReviewState'
    | 'engineRevalidationStatus'
    | 'issuanceGateResults'
    | 'reasonCodes'
    | 'limitationCodes'
    | 'idempotencyReplay'
  >;
}): string {
  const gates = [...input.output.issuanceGateResults]
    .sort((a, b) => a.gateId.localeCompare(b.gateId))
    .map(gatePayload);
  return canonicalStableDumps({
    consultation_id: input.consultationId,
    doctor_action: input.doctorAction,
    doctor_id: input.doctorId,
    doctor_review_status: input.output.doctorReviewStatus,
    draft_version: input.draftVersion,
    engine_revalidation_status: input.output.engineRevalidationStatus,
    fingerprint_version: RULE4_DOCTOR_REVIEW_FINGERPRINT_V1,
    idempotency_replay: input.output.idempotencyReplay,
    issuance_eligibility_status: input.output.issuanceEligibilityStatus,
    issuance_gate_results: gates,
    limitation_codes: [...new Set(input.output.limitationCodes)].sort(),
    phase3_review_state: input.output.phase3ReviewState,
    reason_codes: [...new Set(input.output.reasonCodes)].sort(),
    registry_version: input.registryVersion,
    ruleset_version: input.rulesetVersion,
  });
}

export function rule4DoctorReviewFingerprintV1Hash(
  input: Parameters<typeof rule4DoctorReviewFingerprintV1Payload>[0],
): string {
  const payload = rule4DoctorReviewFingerprintV1Payload(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromDoctorReviewOutput(
  output: Rule4DoctorReviewAdapterOutput,
  bind: {
    doctorAction: string;
    consultationId: string;
    draftVersion: string;
    doctorId: string;
  },
): string {
  return rule4DoctorReviewFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    doctorAction: bind.doctorAction,
    consultationId: bind.consultationId,
    draftVersion: bind.draftVersion,
    doctorId: bind.doctorId,
    output,
  });
}

export function rule4ReviewInputFingerprintV1Hash(input: Record<string, unknown>): string {
  return createHash('sha256')
    .update(
      canonicalStableDumps({ fingerprint_version: 'rule4-review-input-fingerprint-v1', ...input }),
      'utf8',
    )
    .digest('hex')
    .toUpperCase();
}

export function rule4ModificationEnvelopeFingerprintV1Hash(input: Record<string, unknown>): string {
  return createHash('sha256')
    .update(
      canonicalStableDumps({
        fingerprint_version: 'rule4-modification-envelope-fingerprint-v1',
        ...input,
      }),
      'utf8',
    )
    .digest('hex')
    .toUpperCase();
}

export function rule4IssuanceGateLedgerFingerprintV1Hash(
  gates: readonly Rule4IssuanceGateResult[],
): string {
  const payload = canonicalStableDumps({
    fingerprint_version: 'rule4-issuance-gate-ledger-fingerprint-v1',
    gates: [...gates].sort((a, b) => a.gateId.localeCompare(b.gateId)).map(gatePayload),
  });
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function rule4ReviewAuditEventFingerprintV1Hash(input: Record<string, unknown>): string {
  return createHash('sha256')
    .update(
      canonicalStableDumps({
        fingerprint_version: 'rule4-review-audit-event-fingerprint-v1',
        ...input,
      }),
      'utf8',
    )
    .digest('hex')
    .toUpperCase();
}
