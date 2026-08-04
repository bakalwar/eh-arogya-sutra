import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { rule4D3D5DiscriminatorFingerprintV1Hash } from '../../packages/clinical-contracts/src/rule4/selection/d3D5DiscriminatorFingerprintV1.js';
import { validateD3D5DiscriminatorEnvelope } from '../../packages/clinical-contracts/src/rule4/selection/validateD3D5Discriminator.js';
import { validateD3D5EvidenceProvenance } from '../../packages/clinical-contracts/src/rule4/selection/d3D5EvidenceProvenance.js';
import type { Rule4SelectionEvaluationContext } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import {
  buildD3D5DiscriminatorEnvelope,
  defaultEvidenceProvenance,
  passingPhase3GateResults,
  standardD3D5EvidenceContext,
} from './rule4-phase8-d3d5-envelope-helpers.ts';
import {
  RULE4_NUMERIC_SELECTION_FIXTURE_PATH,
  RULE4_NUMERIC_SELECTION_FIXTURE_SHA256,
  snakeToCamelDeep,
} from './rule4-numeric-selection-fixture-loader.ts';

const UPSTREAM_FP = '1B0F098FA015D4903EC40FC691EA5E0DF6B81D6FF4F099022E85E5DEA0912F4E';

function ctxFromStd(extra: Record<string, unknown> = {}) {
  const std = standardD3D5EvidenceContext();
  const evidenceResolution = { ...std.evidence_resolution, ...extra };
  return {
    formulaSlotId: 's1',
    formulaTargetId: 't1',
    upstreamPhase7EligibilityFingerprint: UPSTREAM_FP,
    evidenceAdapter: snakeToCamelDeep(evidenceResolution),
    evidenceItems: snakeToCamelDeep(std.evidence_items),
  };
}

describe('Rule 4 Phase 8 D3/D5 evidence provenance gates', () => {
  it('rejects NEGATED assertion with D3_D5_EVIDENCE_ITEM_GATE_NOT_MET', () => {
    const envelope = buildD3D5DiscriminatorEnvelope({
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
    const std = standardD3D5EvidenceContext();
    const items = [{ ...std.evidence_items[0], assertion_status: 'NEGATED' }];
    const out = validateD3D5DiscriminatorEnvelope(envelope, {
      ...ctxFromStd(),
      evidenceItems: snakeToCamelDeep(items),
    });
    expect(out.reasonCodes).toContain('D3_D5_EVIDENCE_ITEM_GATE_NOT_MET');
    expect(out.dilution).toBeNull();
  });

  it('discriminator fingerprint changes when evidence_provenance document_id changes', () => {
    const base = buildD3D5DiscriminatorEnvelope({
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
      evidenceProvenance: defaultEvidenceProvenance(['e1'], 'doc-1'),
    });
    const tampered = buildD3D5DiscriminatorEnvelope({
      ...base,
      evidenceProvenance: defaultEvidenceProvenance(['e1'], 'doc-2'),
    });
    expect(tampered.discriminatorFingerprint).not.toBe(base.discriminatorFingerprint);
    expect(rule4D3D5DiscriminatorFingerprintV1Hash(tampered)).toBe(
      tampered.discriminatorFingerprint,
    );
  });

  it('resolves D3 when Phase 3 gates and provenance align', () => {
    const envelope = buildD3D5DiscriminatorEnvelope({
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
    const gates = passingPhase3GateResults('e1', 'doc-1');
    const out = validateD3D5DiscriminatorEnvelope(
      envelope,
      ctxFromStd({
        document_gate_results: gates.document_gate_results,
        item_gate_results: gates.item_gate_results,
      }),
    );
    expect(out.status).toBe('resolved');
    expect(out.dilution).toBe('D3');
  });

  it('rejects contradictory evidence pool', () => {
    const envelope = buildD3D5DiscriminatorEnvelope({
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
    const std = standardD3D5EvidenceContext();
    const er = snakeToCamelDeep({
      ...std.evidence_resolution,
      formula_bound_pools: [
        {
          ...std.evidence_resolution.formula_bound_pools[0],
          contradiction: {
            formula_slot_id: 's1',
            evidence_status: 'CONTRADICTORY_EVIDENCE',
            doctor_review_required: true,
            reason_codes: [],
            limitation_codes: [],
          },
        },
      ],
    }) as Rule4SelectionEvaluationContext['evidenceAdapter'];
    const prov = validateD3D5EvidenceProvenance(envelope, {
      formulaSlotId: 's1',
      formulaTargetId: 't1',
      evidenceAdapter: er,
      evidenceItems: snakeToCamelDeep(
        std.evidence_items,
      ) as Rule4SelectionEvaluationContext['evidenceItems'],
    });
    expect(prov.reasonCode).toBe('D3_D5_EVIDENCE_POOL_CONTRADICTORY');
  });

  it('rejects item gate document binding mismatch', () => {
    const envelope = buildD3D5DiscriminatorEnvelope({
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
    const std = standardD3D5EvidenceContext();
    const resolution = {
      ...std.evidence_resolution,
      item_gate_results: [
        {
          finding_id: 'e1',
          document_id: 'doc-2',
          passed: true,
          reason_codes: [],
          limitation_codes: [],
        },
      ],
    };
    const prov = validateD3D5EvidenceProvenance(envelope, {
      formulaSlotId: 's1',
      formulaTargetId: 't1',
      evidenceAdapter: snakeToCamelDeep(
        resolution,
      ) as Rule4SelectionEvaluationContext['evidenceAdapter'],
      evidenceItems: snakeToCamelDeep(
        std.evidence_items,
      ) as Rule4SelectionEvaluationContext['evidenceItems'],
    });
    expect(prov.reasonCode).toBe('D3_D5_EVIDENCE_DOCUMENT_BINDING_INVALID');
  });
});

describe('Rule 4 Phase 8 fixture SHA integrity (read-only)', () => {
  it('fixture file sha256 matches pinned constant', () => {
    const sha = createHash('sha256')
      .update(readFileSync(RULE4_NUMERIC_SELECTION_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    expect(sha).toBe(RULE4_NUMERIC_SELECTION_FIXTURE_SHA256);
  });
});
