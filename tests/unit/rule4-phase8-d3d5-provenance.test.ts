import { describe, expect, it } from 'vitest';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import {
  buildD3D5DiscriminatorEnvelope,
  standardD3D5EvidenceContext,
} from './rule4-phase8-d3d5-envelope-helpers.ts';
import { RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION } from '../../packages/clinical-contracts/src/rule4/version.js';
import type { Rule4SelectionEvaluationContext } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import {
  loadRule4NumericSelectionFixture,
  selectionAdapterInputFromFixture,
  selectionEvaluationContextFromFixture,
  snakeToCamelDeep,
} from './rule4-numeric-selection-fixture-loader.ts';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REGISTRY = 'rule4-reason-codes-phase8-numeric-selection-subset-v1';
const UPSTREAM_FP = '1B0F098FA015D4903EC40FC691EA5E0DF6B81D6FF4F099022E85E5DEA0912F4E';

function minimalEligibility() {
  return {
    contract_version: 'ehas2-rule4-contract-v1-phase7-candidate-eligibility',
    ruleset_version: RULESET,
    registry_version: 'rule4-reason-codes-phase7-candidate-eligibility-subset-v1',
    execution_status: 'NOT_IMPLEMENTED',
    automatic_potency_runtime: false,
    automatic_prescription_issuance_runtime: false,
    prescription_issue_allowed: false,
    current_runtime_potency_delta: 'NONE',
    final_doctor_approval_required: true,
    selection_status: 'NOT_STARTED',
    slot_resolutions: [
      {
        formula_slot_id: 's1',
        formula_target_id: 't1',
        target_role: 'STANDARD_FORMULA_TARGET',
        eligibility_status: 'FAMILY_ELIGIBLE',
        candidate_family: 'D3_D5_FAMILY_ELIGIBLE',
        eligible_family_options: ['D3_D5_FAMILY_ELIGIBLE'],
        family_gate_status: 'COMPLETE',
        gate_results: [
          {
            gate_id: 'G_PASS',
            outcome: 'PASS',
            evidence_item_ids: [],
            reason_codes: [],
            limitation_codes: [],
          },
        ],
        blocking_gate_codes: [],
        selection_status: 'NOT_STARTED',
        selected_cascade: null,
        selected_dilution: null,
        upstream_context_status: 'READY_FOR_FUTURE_GATE_EVALUATION',
        reason_codes: [],
        limitation_codes: ['PHASE7_NO_NUMERIC_SELECTION'],
      },
    ],
    reason_codes: ['ELIGIBILITY_ALONE_NOT_A_POTENCY_SELECTOR'],
    limitation_codes: ['PHASE7_NO_NUMERIC_SELECTION'],
  };
}

function d3D5EvalContext(extra: Record<string, unknown> = {}): Rule4SelectionEvaluationContext {
  const std = standardD3D5EvidenceContext();
  const base = snakeToCamelDeep({
    eligibility_resolution: minimalEligibility(),
    verified_age: { age_years: 30, verification_status: 'VERIFIED' },
    ...extra,
  }) as Rule4SelectionEvaluationContext;
  return {
    ...base,
    evidenceItems: snakeToCamelDeep(
      std.evidence_items,
    ) as Rule4SelectionEvaluationContext['evidenceItems'],
    evidenceAdapter: snakeToCamelDeep(
      std.evidence_resolution,
    ) as Rule4SelectionEvaluationContext['evidenceAdapter'],
  };
}

function d3Envelope() {
  return buildD3D5DiscriminatorEnvelope({
    formulaSlotId: 's1',
    formulaTargetId: 't1',
    upstreamPhase7EligibilityFingerprint: UPSTREAM_FP,
    d08DocumentStatus: 'USABLE',
    d08DocumentConfidence: 'PASS',
    d08ItemStatus: 'USABLE',
    d08ItemConfidence: 'PASS',
    sensitivityAssessmentStatus: 'ASSESSED_D5_NOT_QUALIFIED',
    closeD05DiscriminatorStatus: 'QUALIFIES_D3',
    evidenceItemIds: ['e1'],
    sourceReferenceIds: ['ref-1'],
  });
}

describe('Rule 4 Phase 8 D3/D5 provenance', () => {
  it('rejects legacy boolean record without envelope', () => {
    const out = evaluateSelectionAdapter(
      {
        contractVersion: RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION,
        rulesetVersion: RULESET,
        registryVersion: REGISTRY,
        label: 'SYNTHETIC',
        trustedSyntheticSelectionBypass: true,
        currentConsultationId: 'c1',
        formulaSlotIds: ['s1'],
        slotSelectionRecords: [
          {
            formulaSlotId: 's1',
            formulaTargetId: 't1',
            upstreamEligibilityFingerprint: UPSTREAM_FP,
            d3D5Selection: {
              formulaSlotId: 's1',
              formulaTargetId: 't1',
              q7bfPreconditionsPass: true,
              closeD05QualifiesD5: false,
            },
          },
        ],
      },
      d3D5EvalContext(),
    );
    expect(out.slotResolutions[0]?.reasonCodes).toContain(
      'D3_D5_LEGACY_BOOLEAN_AUTHORITY_REJECTED',
    );
  });

  it('rejects tampered discriminator fingerprint', () => {
    const env = d3Envelope();
    env.discriminatorFingerprint = 'DEADBEEF';
    const out = evaluateSelectionAdapter(
      {
        contractVersion: RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION,
        rulesetVersion: RULESET,
        registryVersion: REGISTRY,
        label: 'SYNTHETIC',
        trustedSyntheticSelectionBypass: true,
        currentConsultationId: 'c1',
        formulaSlotIds: ['s1'],
        slotSelectionRecords: [
          {
            formulaSlotId: 's1',
            formulaTargetId: 't1',
            upstreamEligibilityFingerprint: UPSTREAM_FP,
            d3D5DiscriminatorEnvelope: env,
          },
        ],
      },
      d3D5EvalContext(),
    );
    expect(out.slotResolutions[0]?.reasonCodes).toContain(
      'D3_D5_DISCRIMINATOR_FINGERPRINT_INVALID',
    );
  });

  it('missing sensitivity does not default to D3', () => {
    const env = buildD3D5DiscriminatorEnvelope({
      formulaSlotId: 's1',
      formulaTargetId: 't1',
      upstreamPhase7EligibilityFingerprint: UPSTREAM_FP,
      d08DocumentStatus: 'USABLE',
      d08DocumentConfidence: 'PASS',
      d08ItemStatus: 'USABLE',
      d08ItemConfidence: 'PASS',
      sensitivityAssessmentStatus: 'MISSING',
      closeD05DiscriminatorStatus: 'UNRESOLVED',
      evidenceItemIds: ['e1'],
      sourceReferenceIds: ['ref-1'],
    });
    const out = evaluateSelectionAdapter(
      {
        contractVersion: RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION,
        rulesetVersion: RULESET,
        registryVersion: REGISTRY,
        label: 'SYNTHETIC',
        trustedSyntheticSelectionBypass: true,
        currentConsultationId: 'c1',
        formulaSlotIds: ['s1'],
        slotSelectionRecords: [
          {
            formulaSlotId: 's1',
            formulaTargetId: 't1',
            upstreamEligibilityFingerprint: UPSTREAM_FP,
            d3D5DiscriminatorEnvelope: env,
          },
        ],
      },
      d3D5EvalContext(),
    );
    expect(out.slotResolutions[0]?.selectedDilution).toBeNull();
    expect(out.slotResolutions[0]?.reasonCodes).toContain('D3_D5_SENSITIVITY_MISSING');
  });

  it('temperament tie fingerprints differ for SANGUINE vs NERVOUS at same D2', () => {
    const fixture = loadRule4NumericSelectionFixture();
    const sScenario = fixture.scenarios.find((s) => s.id === 'tie-sanguine')!;
    const nScenario = fixture.scenarios.find((s) => s.id === 'tie-nervous')!;
    const s = evaluateSelectionAdapter(
      selectionAdapterInputFromFixture(sScenario),
      selectionEvaluationContextFromFixture(sScenario),
    );
    const n = evaluateSelectionAdapter(
      selectionAdapterInputFromFixture(nScenario),
      selectionEvaluationContextFromFixture(nScenario),
    );
    expect(s.deterministicNumericSelectionFingerprint).not.toBe(
      n.deterministicNumericSelectionFingerprint,
    );
  });
});
