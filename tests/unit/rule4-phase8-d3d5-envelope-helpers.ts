import { RULE4_Q7BF_MANDATORY_GATE_IDS } from '../../packages/clinical-contracts/src/rule4/selection/q7bfGateIds.js';
import {
  rule4D3D5DiscriminatorFingerprintV1Hash,
  withComputedDiscriminatorFingerprint,
} from '../../packages/clinical-contracts/src/rule4/selection/d3D5DiscriminatorFingerprintV1.js';
import type { Rule4D3D5DiscriminatorEnvelope } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import type { Rule4D3D5EvidenceProvenanceRecord } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import type { Rule4GateResult } from '../../packages/clinical-contracts/src/rule4/eligibility/types.js';

export function q7bfPassGateResults(evidenceItemIds: string[] = ['e1']): Rule4GateResult[] {
  return RULE4_Q7BF_MANDATORY_GATE_IDS.map((gateId) => ({
    gateId,
    outcome: 'PASS' as const,
    evidenceItemIds,
    reasonCodes: [],
    limitationCodes: [],
  }));
}

export function defaultEvidenceProvenance(
  findingIds: readonly string[],
  documentId = 'doc-1',
): Rule4D3D5EvidenceProvenanceRecord[] {
  return findingIds.map((findingId) => ({
    findingId,
    documentId,
    itemGatePassed: true,
    documentGatePassed: true,
  }));
}

export function passingPhase3GateResults(findingId = 'e1', documentId = 'doc-1') {
  return {
    document_gate_results: [
      {
        document_id: documentId,
        passed: true,
        reason_codes: [],
        limitation_codes: [],
      },
    ],
    item_gate_results: [
      {
        finding_id: findingId,
        document_id: documentId,
        passed: true,
        reason_codes: [],
        limitation_codes: [],
      },
    ],
  };
}

export function buildD3D5DiscriminatorEnvelope(
  partial: Omit<
    Rule4D3D5DiscriminatorEnvelope,
    'discriminatorFingerprint' | 'q7bfGateResults' | 'bindingStatus' | 'evidenceProvenance'
  > & {
    q7bfGateResults?: readonly Rule4GateResult[];
    bindingStatus?: Rule4D3D5DiscriminatorEnvelope['bindingStatus'];
    evidenceProvenance?: readonly Rule4D3D5EvidenceProvenanceRecord[];
  },
): Rule4D3D5DiscriminatorEnvelope {
  const evidenceProvenance =
    partial.evidenceProvenance ?? defaultEvidenceProvenance(partial.evidenceItemIds, 'doc-1');
  const body = {
    ...partial,
    evidenceProvenance,
    q7bfGateResults: partial.q7bfGateResults ?? q7bfPassGateResults([...partial.evidenceItemIds]),
    bindingStatus: partial.bindingStatus ?? 'BOUND',
  };
  return withComputedDiscriminatorFingerprint(body);
}

export function standardD3D5EvidenceContext(slotId = 's1', targetId = 't1', findingId = 'e1') {
  const gates = passingPhase3GateResults(findingId, 'doc-1');
  return {
    evidence_items: [
      {
        finding_id: findingId,
        document_id: 'doc-1',
        parent_source_id: 'src-1',
        source_type: 'DOCTOR_STRUCTURED_ENTRY',
        source_reference: 'ref-1',
        timestamp_or_case_context: 'c1',
        formula_slot_id: slotId,
        formula_target_id: targetId,
        target_organ_system: 'organ',
        anatomical_site: 'site',
        target_pathology_id: 'path-1',
        assertion_status: 'PRESENT',
        verification_status: 'VERIFIED',
        formula_relevance: 'DIRECT',
        confidence_score: 0.95,
      },
    ],
    evidence_resolution: {
      contract_version: 'ehas2-rule4-contract-v1-phase3-evidence',
      ruleset_version: 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469',
      registry_version: 'rule4-reason-codes-phase3-evidence-subset-v1',
      execution_status: 'NOT_IMPLEMENTED',
      current_runtime_potency_delta: 'NONE',
      registry_q16_selector_status: 'NOT_EXECUTABLE_AS_Q16_SELECTOR',
      formula_bound_pools: [
        {
          formula_slot_id: slotId,
          formula_target_id: targetId,
          usable_finding_ids: [findingId],
          ignored_finding_ids: [],
          corroboration_distinct_parent_count: 1,
          corroborating_parent_source_ids: ['src-1'],
          contradiction: {
            formula_slot_id: slotId,
            evidence_status: 'CLEAR',
            doctor_review_required: true,
            reason_codes: [],
            limitation_codes: [],
          },
        },
      ],
      reason_codes: [],
      limitation_codes: [],
      deterministic_evidence_pool_fingerprint: 'EVIDENCE_FP_STUB',
      quarantine_reason_codes: [],
      document_gate_results: gates.document_gate_results,
      item_gate_results: gates.item_gate_results,
      ignored_audit: [],
      dedupe_supersession: [],
    },
  };
}

export { rule4D3D5DiscriminatorFingerprintV1Hash };
