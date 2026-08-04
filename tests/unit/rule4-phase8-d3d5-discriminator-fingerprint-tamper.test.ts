import { describe, expect, it } from 'vitest';

import {
  rule4D3D5DiscriminatorFingerprintV1Hash,
  withComputedDiscriminatorFingerprint,
} from '../../packages/clinical-contracts/src/rule4/selection/d3D5DiscriminatorFingerprintV1.js';
import { validateD3D5DiscriminatorEnvelope } from '../../packages/clinical-contracts/src/rule4/selection/validateD3D5Discriminator.js';
import { RULE4_Q7BF_MANDATORY_GATE_IDS } from '../../packages/clinical-contracts/src/rule4/selection/q7bfGateIds.js';
import {
  buildD3D5DiscriminatorEnvelope,
  standardD3D5EvidenceContext,
} from './rule4-phase8-d3d5-envelope-helpers.ts';
import { snakeToCamelDeep } from './rule4-numeric-selection-fixture-loader.ts';

const UPSTREAM_FP = '1B0F098FA015D4903EC40FC691EA5E0DF6B81D6FF4F099022E85E5DEA0912F4E';

function baseEnvelope() {
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

function evalCtx() {
  const std = standardD3D5EvidenceContext();
  return {
    formulaSlotId: 's1',
    formulaTargetId: 't1',
    upstreamPhase7EligibilityFingerprint: UPSTREAM_FP,
    evidenceAdapter: snakeToCamelDeep(std.evidence_resolution),
    evidenceItems: snakeToCamelDeep(std.evidence_items),
  };
}

function expectStaleFingerprintRejected(tampered: ReturnType<typeof baseEnvelope>) {
  const out = validateD3D5DiscriminatorEnvelope(tampered, evalCtx());
  expect(out.reasonCodes).toContain('D3_D5_DISCRIMINATOR_FINGERPRINT_INVALID');
  expect(out.dilution).toBeNull();
}

function expectFailClosedNoD3D5(tampered: ReturnType<typeof baseEnvelope>) {
  const out = validateD3D5DiscriminatorEnvelope(tampered, evalCtx());
  expect(out.dilution).toBeNull();
  expect(out.status).toBe('unresolved');
}

describe('Rule 4 Phase 8 discriminator fingerprint tamper matrix', () => {
  it('rejects stale fingerprint when Q7B-F gate evidence binding changes', () => {
    const env = baseEnvelope();
    const gates = env.q7bfGateResults.map((g, i) =>
      i === 0 ? { ...g, evidenceItemIds: [...g.evidenceItemIds, 'e-extra'] } : g,
    );
    const tampered = withComputedDiscriminatorFingerprint({ ...env, q7bfGateResults: gates });
    tampered.discriminatorFingerprint = env.discriminatorFingerprint;
    expectStaleFingerprintRejected(tampered);
  });

  it('invalidates hash when D08 document field changes (canonical payload)', () => {
    const env = baseEnvelope();
    const next = withComputedDiscriminatorFingerprint({ ...env, d08DocumentStatus: 'NOT_USABLE' });
    expect(next.discriminatorFingerprint).not.toBe(env.discriminatorFingerprint);
    const tampered = { ...next, discriminatorFingerprint: env.discriminatorFingerprint };
    expectFailClosedNoD3D5(tampered);
  });

  it('invalidates hash when D08 item confidence changes (canonical payload)', () => {
    const env = baseEnvelope();
    const next = withComputedDiscriminatorFingerprint({ ...env, d08ItemConfidence: 'FAIL' });
    expect(next.discriminatorFingerprint).not.toBe(env.discriminatorFingerprint);
    const tampered = { ...next, discriminatorFingerprint: env.discriminatorFingerprint };
    expectFailClosedNoD3D5(tampered);
  });

  it('rejects stale fingerprint when sensitivity assessment changes', () => {
    const env = baseEnvelope();
    const tampered = withComputedDiscriminatorFingerprint({
      ...env,
      sensitivityAssessmentStatus: 'MISSING',
    });
    tampered.discriminatorFingerprint = env.discriminatorFingerprint;
    expectStaleFingerprintRejected(tampered);
  });

  it('rejects stale fingerprint when CLOSE-D05 status changes', () => {
    const env = baseEnvelope();
    const tampered = withComputedDiscriminatorFingerprint({
      ...env,
      closeD05DiscriminatorStatus: 'QUALIFIES_D5',
    });
    tampered.discriminatorFingerprint = env.discriminatorFingerprint;
    expectStaleFingerprintRejected(tampered);
  });

  it('invalidates hash when binding status changes (fail-closed before D3/D5)', () => {
    const env = baseEnvelope();
    const next = withComputedDiscriminatorFingerprint({ ...env, bindingStatus: 'UNBOUND' });
    expect(next.discriminatorFingerprint).not.toBe(env.discriminatorFingerprint);
    const tampered = { ...next, discriminatorFingerprint: env.discriminatorFingerprint };
    expectFailClosedNoD3D5(tampered);
    expect(validateD3D5DiscriminatorEnvelope(tampered, evalCtx()).reasonCodes).toContain(
      'D3_D5_ENVELOPE_BINDING_INVALID',
    );
  });

  it('invalidates hash when evidence item id changes (fail-closed via membership)', () => {
    const env = baseEnvelope();
    const next = withComputedDiscriminatorFingerprint({ ...env, evidenceItemIds: ['e2'] });
    expect(next.discriminatorFingerprint).not.toBe(env.discriminatorFingerprint);
    const tampered = { ...next, discriminatorFingerprint: env.discriminatorFingerprint };
    expectFailClosedNoD3D5(tampered);
  });

  it('invalidates hash when evidence provenance document id changes', () => {
    const env = baseEnvelope();
    const prov = [
      { findingId: 'e1', documentId: 'doc-2', itemGatePassed: true, documentGatePassed: true },
    ];
    const next = withComputedDiscriminatorFingerprint({ ...env, evidenceProvenance: prov });
    expect(next.discriminatorFingerprint).not.toBe(env.discriminatorFingerprint);
    const tampered = { ...next, discriminatorFingerprint: env.discriminatorFingerprint };
    expectFailClosedNoD3D5(tampered);
  });

  it('invalidates hash when provenance item gate flag changes', () => {
    const env = baseEnvelope();
    const prov = [
      { findingId: 'e1', documentId: 'doc-1', itemGatePassed: false, documentGatePassed: true },
    ];
    const next = withComputedDiscriminatorFingerprint({ ...env, evidenceProvenance: prov });
    expect(next.discriminatorFingerprint).not.toBe(env.discriminatorFingerprint);
    const tampered = { ...next, discriminatorFingerprint: env.discriminatorFingerprint };
    expectFailClosedNoD3D5(tampered);
  });

  it('rejects stale fingerprint when source reference id changes', () => {
    const env = baseEnvelope();
    const tampered = withComputedDiscriminatorFingerprint({
      ...env,
      sourceReferenceIds: ['ref-2'],
    });
    tampered.discriminatorFingerprint = env.discriminatorFingerprint;
    expectStaleFingerprintRejected(tampered);
  });

  it('recomputed hash must match envelope when authentic', () => {
    const env = baseEnvelope();
    expect(rule4D3D5DiscriminatorFingerprintV1Hash(env)).toBe(env.discriminatorFingerprint);
    expect(RULE4_Q7BF_MANDATORY_GATE_IDS.length).toBe(8);
  });
});
