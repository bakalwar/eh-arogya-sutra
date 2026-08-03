import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  evaluateEvidenceAdapter,
  evaluateRule4ShadowBundle,
  mergeRule4RegistryEntries,
  RULE4_CONTRACT_VERSION_PHASE2,
  RULE4_PHASE3_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE3_REASON_CODE_REGISTRY,
  RULE4_REASON_CODE_REGISTRY,
  RULE4_LIMITATION_CODE_REGISTRY,
  RULE4_PHASE2_REASON_CODE_REGISTRY,
  RULE4_PHASE2_LIMITATION_CODE_REGISTRY,
  canonicalStableDumps,
  buildRule4EvidencePoolFingerprintV1Payload,
  rule4EvidencePoolFingerprintV1Hash,
} from '../../packages/clinical-contracts/src/rule4/index.ts';
import {
  evidenceAdapterInputFromFixture,
  loadRule4EvidenceAdapterFixture,
} from './rule4-evidence-fixture-loader.ts';
import { docTier1, itemBase } from './rule4-evidence-scenarios.ts';
import { applySupersession } from '../../packages/clinical-contracts/src/rule4/evidence/supersession.ts';

function poolView(out: ReturnType<typeof evaluateEvidenceAdapter>) {
  const bySlot: Record<string, string[]> = {};
  for (const pool of out.formulaBoundPools) {
    bySlot[pool.formulaSlotId] = [...pool.usableFindingIds];
  }
  const contradictorySlots = out.formulaBoundPools
    .filter((p) => p.contradiction.evidenceStatus === 'CONTRADICTORY_EVIDENCE')
    .map((p) => p.formulaSlotId);
  return {
    usableBySlot: bySlot,
    contradictorySlots,
    fingerprint: out.deterministicEvidencePoolFingerprint,
    quarantineReasonCodes: out.quarantineReasonCodes,
  };
}

function fingerprintPayloadFromOutput(out: ReturnType<typeof evaluateEvidenceAdapter>) {
  return buildRule4EvidencePoolFingerprintV1Payload({
    rulesetVersion: out.rulesetVersion,
    registryVersion: out.registryVersion,
    dataAssetVersion: out.dataAssetVersion,
    formulaBoundPools: out.formulaBoundPools,
    reasonCodes: out.reasonCodes,
    limitationCodes: out.limitationCodes,
  });
}

describe('Rule 4 Phase 3 evidence adapter', () => {
  const fixture = loadRule4EvidenceAdapterFixture();
  const scenarios = fixture.scenarios;

  it('has at least 35 deterministic scenarios', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(35);
  });

  for (const scenario of scenarios) {
    it(`scenario ${scenario.id}`, () => {
      const input = evidenceAdapterInputFromFixture(scenario);
      const out = evaluateEvidenceAdapter(input);
      const view = poolView(out);
      const expected = scenario.expected;
      for (const [slot, ids] of Object.entries(expected.usable_by_slot)) {
        expect(view.usableBySlot[slot] ?? []).toEqual(ids);
      }
      if (expected.contradictory_slots?.length) {
        expect(view.contradictorySlots.sort()).toEqual([...expected.contradictory_slots].sort());
      } else {
        expect(view.contradictorySlots).toEqual([]);
      }
      if (expected.corroborating_parent_count) {
        for (const [slot, count] of Object.entries(expected.corroborating_parent_count)) {
          const pool = out.formulaBoundPools.find((p) => p.formulaSlotId === slot);
          expect(pool?.corroborationDistinctParentCount).toBe(count);
          expect(pool?.corroboratingParentSourceIds.length).toBe(count);
        }
      }
      if (expected.corroborating_parent_source_ids) {
        for (const [slot, ids] of Object.entries(expected.corroborating_parent_source_ids)) {
          const pool = out.formulaBoundPools.find((p) => p.formulaSlotId === slot);
          expect(pool?.corroboratingParentSourceIds).toEqual(ids);
        }
      }
      expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
      expect(out.deterministicEvidencePoolFingerprint).toMatch(/^[A-F0-9]{64}$/);
      expect(JSON.stringify(out)).not.toMatch(/patient_name|raw_report_text/);
    });
  }

  for (const ref of fixture.fingerprintV1References) {
    it(`fingerprintV1Reference ${ref.referenceId}`, () => {
      const scenario = scenarios.find((s) => s.id === ref.scenarioId);
      expect(scenario, `scenario ${ref.scenarioId} missing`).toBeDefined();
      const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario!));
      const payload = fingerprintPayloadFromOutput(out);
      const canon = canonicalStableDumps(payload);
      expect(canon).toBe(ref.canonicalPayload);
      const manual = createHash('sha256').update(canon, 'utf8').digest('hex').toUpperCase();
      expect(manual).toBe(ref.evidencePoolSha256);
      expect(
        rule4EvidencePoolFingerprintV1Hash({
          rulesetVersion: out.rulesetVersion,
          registryVersion: out.registryVersion,
          dataAssetVersion: out.dataAssetVersion,
          formulaBoundPools: out.formulaBoundPools,
          reasonCodes: out.reasonCodes,
          limitationCodes: out.limitationCodes,
        }),
      ).toBe(ref.evidencePoolSha256);
      expect(out.deterministicEvidencePoolFingerprint).toBe(ref.evidencePoolSha256);
    });
  }

  it('cross-parent supersession keeps only newer in active pool', () => {
    const scenario = scenarios.find((s) => s.id === 'cross-parent-supersession-newer-wins')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools[0]?.usableFindingIds).toEqual(['f24new']);
    const superseded = out.ignoredAudit.find((e) => e.findingId === 'f24old');
    expect(superseded?.itemUsabilityStatus).toBe('SUPERSEDED_HISTORICAL');
  });

  it('doctor entry does not supersede older photo observation', () => {
    const scenario = scenarios.find((s) => s.id === 'doctor-entry-no-supersede-older-photo')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools[0]?.usableFindingIds.sort()).toEqual(['f45entry', 'f45photo']);
  });

  it('photo observation does not supersede older doctor entry', () => {
    const scenario = scenarios.find((s) => s.id === 'photo-no-supersede-older-entry')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools[0]?.usableFindingIds.sort()).toEqual(['f46entry', 'f46photo']);
  });

  it('supersession monotonicity: re-run yields identical active set', () => {
    const scenario = scenarios.find((s) => s.id === 'cross-parent-supersession-newer-wins')!;
    const input = evidenceAdapterInputFromFixture(scenario);
    const a = evaluateEvidenceAdapter(input);
    const b = evaluateEvidenceAdapter(input);
    expect(a.formulaBoundPools[0]?.usableFindingIds).toEqual(
      b.formulaBoundPools[0]?.usableFindingIds,
    );
  });

  it('input-order independence for corroboration scenario', () => {
    const scenario = scenarios.find((s) => s.id === 'two-independent-corroborating')!;
    const input = evidenceAdapterInputFromFixture(scenario);
    const reversed = { ...input, items: [...input.items].reverse() };
    const a = evaluateEvidenceAdapter(input);
    const b = evaluateEvidenceAdapter(reversed);
    expect(a.deterministicEvidencePoolFingerprint).toBe(b.deterministicEvidencePoolFingerprint);
  });

  it('invalid newer does not supersede valid older', () => {
    const scenario = scenarios.find((s) => s.id === 'invalid-newer-does-not-supersede')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools[0]?.usableFindingIds).toContain('f25old');
  });

  it('quarantine probe rejects non-boolean values', () => {
    const scenario = scenarios.find((s) => s.id === 'tier1-valid-direct')!;
    const input = evidenceAdapterInputFromFixture(scenario);
    expect(() =>
      evaluateEvidenceAdapter({
        ...input,
        quarantineProbe: { global_text: 'raw' as unknown as boolean },
      }),
    ).toThrow();
  });

  it('dedupe is idempotent', () => {
    const scenario = scenarios.find((s) => s.id === 'duplicate-same-parent-source')!;
    const input = evidenceAdapterInputFromFixture(scenario);
    const a = evaluateEvidenceAdapter(input);
    const b = evaluateEvidenceAdapter(input);
    expect(a.deterministicEvidencePoolFingerprint).toBe(b.deterministicEvidencePoolFingerprint);
  });

  it('no cross-laterality or cross-site supersession at comparability layer', () => {
    const d1 = docTier1('doc-site-a', 'p-site-a');
    const d2 = docTier1('doc-site-b', 'p-site-b');
    const newerLeft = itemBase('fSiteNew', d1, {
      testPanelIdentity: 'panel-site',
      laterality: 'LEFT',
      anatomicalSite: 'kidney_cortex',
      timestampOrCaseContext: '2026-03-01T00:00:00Z',
    });
    const olderRight = itemBase('fSiteOld', d2, {
      testPanelIdentity: 'panel-site',
      laterality: 'RIGHT',
      anatomicalSite: 'kidney_cortex',
      timestampOrCaseContext: '2026-01-01T00:00:00Z',
    });
    const latDecisions = applySupersession([newerLeft, olderRight]);
    expect(latDecisions.every((d) => d.active)).toBe(true);

    const newerCortex = itemBase('fCortexNew', d1, {
      testPanelIdentity: 'panel-anat',
      anatomicalSite: 'kidney_cortex',
      timestampOrCaseContext: '2026-03-01T00:00:00Z',
    });
    const olderUreter = itemBase('fUreterOld', d2, {
      testPanelIdentity: 'panel-anat',
      anatomicalSite: 'ureter',
      timestampOrCaseContext: '2026-01-01T00:00:00Z',
    });
    const siteDecisions = applySupersession([newerCortex, olderUreter]);
    expect(siteDecisions.every((d) => d.active)).toBe(true);
  });

  it('different anatomical site two-slot integration fixture stays independent', () => {
    const scenario = scenarios.find((s) => s.id === 'different-anatomical-site-two-slots-active')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools.find((p) => p.formulaSlotId === 's1')?.usableFindingIds).toEqual([
      'f48cortex',
    ]);
    expect(out.formulaBoundPools.find((p) => p.formulaSlotId === 's2')?.usableFindingIds).toEqual([
      'f48ureter',
    ]);
  });

  it('same timestamp identical findings stay active without clinical winner', () => {
    const scenario = scenarios.find((s) => s.id === 'two-independent-corroborating')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools[0]?.usableFindingIds.sort()).toEqual(['f16a', 'f16b']);
  });

  it('same timestamp conflicting values produce slot contradiction', () => {
    const scenario = scenarios.find((s) => s.id === 'contradiction-same-binding')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools[0]?.contradiction.evidenceStatus).toBe('CONTRADICTORY_EVIDENCE');
  });

  it('no cross-slot leakage for leakage scenario', () => {
    const scenario = scenarios.find((s) => s.id === 'cross-formula-leakage-attempt')!;
    const out = evaluateEvidenceAdapter(evidenceAdapterInputFromFixture(scenario));
    expect(out.formulaBoundPools.find((p) => p.formulaSlotId === 's1')?.usableFindingIds).toEqual(
      [],
    );
  });

  it('Phase 3 registry merge fail-closed on conflict', () => {
    expect(() =>
      mergeRule4RegistryEntries(
        [{ code: 'X', namespace: 'reason', source: 'a' }],
        [{ code: 'X', namespace: 'reason', source: 'b' }],
      ),
    ).toThrow();
  });

  it('Phase 1+2+3 registry merge accepts identical duplicates', () => {
    const merged = mergeRule4RegistryEntries(
      mergeRule4RegistryEntries(
        [...RULE4_REASON_CODE_REGISTRY],
        [...RULE4_PHASE2_REASON_CODE_REGISTRY],
      ),
      [...RULE4_PHASE3_REASON_CODE_REGISTRY],
    );
    expect(merged.some((e) => e.code === 'D08_DOCUMENT_GATE_FAILED')).toBe(true);
    const lim = mergeRule4RegistryEntries(
      mergeRule4RegistryEntries(
        [...RULE4_LIMITATION_CODE_REGISTRY],
        [...RULE4_PHASE2_LIMITATION_CODE_REGISTRY],
      ),
      [...RULE4_PHASE3_LIMITATION_CODE_REGISTRY],
    );
    expect(lim.some((e) => e.code === 'PHASE3_NO_POTENCY_CASCADE')).toBe(true);
  });

  it('shadow bundle leaves public fingerprint unchanged when evidence attached', () => {
    const scenario = scenarios.find((s) => s.id === 'tier1-valid-direct')!;
    const evidenceInput = evidenceAdapterInputFromFixture(scenario);
    const input = {
      contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
      caseId: 'c1',
      consultationId: 'consult',
      rulesetVersion: 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469',
      engineMode: 'shadow' as const,
      label: 'SYNTHETIC' as const,
      formulaSlots: [
        {
          formulaSlotId: 's1',
          formulaTargetId: 't-renal-1',
          polarityRef: null,
          organTargetRef: null,
          temperamentRef: null,
          phaseRef: null,
          severityRef: null,
          structuredEvidenceItemIds: [],
        },
      ],
      verifiedAge: {
        ageYears: null,
        verificationStatus: 'VERIFIED' as const,
        verifiedDateOfBirth: '1990-01-01',
        consultationAssessmentDate: '2026-01-01',
      },
      patientWideSafety: {},
      structuredEvidenceItemIds: [],
      bpReadings: [],
      evidenceAdapter: evidenceInput,
    };
    const without = evaluateRule4ShadowBundle({ ...input, evidenceAdapter: undefined });
    const withEvidence = evaluateRule4ShadowBundle(input);
    expect(withEvidence.result.deterministicFingerprint).toBe(
      without.result.deterministicFingerprint,
    );
    expect(withEvidence.evidenceAdapter).not.toBeNull();
    expect(withEvidence.result.slots[0]?.selectedDilution).toBeNull();
  });
});
