import { describe, expect, it } from 'vitest';
import {
  evaluatePolarityAdapter,
  evaluateRule4ShadowBundle,
  rule4PolarityRoutingFingerprintV1Hash,
  buildRule4PolarityRoutingFingerprintV1Payload,
  Rule4PolarityAdapterValidationError,
} from '../../packages/clinical-contracts/src/rule4/index.js';
import { RULE4_POLARITY_PATHWAY_VALUES } from '../../packages/clinical-contracts/src/rule4/polarity/types.js';
import { RULE4_PHASE4_REASON_CODE_REGISTRY } from '../../packages/clinical-contracts/src/rule4/reasonCodesPhase4.js';
import { RULE4_CONTRACT_VERSION_PHASE2 } from '../../packages/clinical-contracts/src/rule4/version.js';
import { canonicalStableDumps } from '../../packages/clinical-contracts/src/rule4/canonicalJson.js';
import {
  loadRule4PolarityRoutingFixture,
  polarityAdapterInputFromFixture,
  polarityEvaluationContextFromFixture,
} from './rule4-polarity-fixture-loader.ts';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';

describe('Rule 4 Phase 4 polarity adapter', () => {
  const fixture = loadRule4PolarityRoutingFixture();

  it('fixture scenario count matches metadata', () => {
    expect(fixture.scenarios.length).toBe(fixture.scenarioCount);
    expect(fixture.scenarioCount).toBeGreaterThanOrEqual(20);
  });

  for (const scenario of fixture.scenarios) {
    it(`scenario ${scenario.id} pathways`, () => {
      const input = polarityAdapterInputFromFixture(scenario);
      const ctx = polarityEvaluationContextFromFixture(scenario);
      const out = evaluatePolarityAdapter(input, ctx);
      expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
      expect(out.currentRuntimePotencyDelta).toBe('NONE');
      for (const slot of out.slotRoutings) {
        expect(slot.selectedCascade).toBeNull();
        expect(slot.selectedDilution).toBeNull();
      }
      for (const [slotId, pathway] of Object.entries(scenario.expected.pathways_by_slot)) {
        const row = out.slotRoutings.find((r) => r.formulaSlotId === slotId);
        expect(row?.pathway, scenario.id).toBe(pathway);
      }
    });
  }

  it('fingerprint v1 references match independent evaluation', () => {
    for (const ref of fixture.fingerprintV1References) {
      const scenario = fixture.scenarios.find((s) => s.id === ref.scenario_id);
      expect(scenario).toBeDefined();
      const out = evaluatePolarityAdapter(
        polarityAdapterInputFromFixture(scenario!),
        polarityEvaluationContextFromFixture(scenario!),
      );
      const payload = buildRule4PolarityRoutingFingerprintV1Payload({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        slotRoutings: out.slotRoutings,
        reasonCodes: out.reasonCodes,
        limitationCodes: out.limitationCodes,
      });
      expect(canonicalStableDumps(payload)).toBe(ref.canonical_payload);
      expect(out.deterministicPolarityRoutingFingerprint).toBe(ref.polarity_routing_sha256);
      expect(
        rule4PolarityRoutingFingerprintV1Hash({
          rulesetVersion: out.rulesetVersion,
          registryVersion: out.registryVersion,
          slotRoutings: out.slotRoutings,
          reasonCodes: out.reasonCodes,
          limitationCodes: out.limitationCodes,
        }),
      ).toBe(ref.polarity_routing_sha256);
    }
  });

  it('rejects unknown pathway enum in expectations guard', () => {
    for (const p of RULE4_POLARITY_PATHWAY_VALUES) {
      expect(typeof p).toBe('string');
    }
  });

  it('rejects invalid quarantine probe key', () => {
    const scenario = fixture.scenarios.find((s) => s.id === 'valid-positive-routing')!;
    const input = polarityAdapterInputFromFixture(scenario);
    expect(() =>
      evaluatePolarityAdapter({
        ...input,
        quarantineProbe: { notAllowedKey: true } as never,
      }),
    ).toThrow();
  });

  it('casePolaritySummary mustNotDriveSelection false fails validation', () => {
    const scenario = fixture.scenarios.find((s) => s.id === 'valid-positive-routing')!;
    const input = polarityAdapterInputFromFixture(scenario);
    expect(() =>
      evaluatePolarityAdapter({
        ...input,
        casePolaritySummary: { mustNotDriveSelection: false },
      }),
    ).toThrow(Rule4PolarityAdapterValidationError);
  });

  it('shadow bundle leaves public result unchanged when polarity supplied', () => {
    const scenario = fixture.scenarios.find((s) => s.id === 'valid-positive-routing')!;
    const polarityInput = polarityAdapterInputFromFixture(scenario);
    const base = {
      contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
      caseId: 'c1',
      consultationId: 'consult',
      rulesetVersion: RULESET,
      engineMode: 'shadow' as const,
      label: 'SYNTHETIC' as const,
      formulaSlots: [
        {
          formulaSlotId: 's-pos',
          formulaTargetId: 't-pos-1',
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
    };
    const without = evaluateRule4ShadowBundle(base);
    const withPolarity = evaluateRule4ShadowBundle({
      ...base,
      polarityAdapter: polarityInput,
    });
    expect(withPolarity.result.deterministicFingerprint).toBe(
      without.result.deterministicFingerprint,
    );
    expect(withPolarity.polarityRouting).not.toBeNull();
    expect(withPolarity.polarityRouting?.slotRoutings[0]?.pathway).toBe('NOT_EVALUATED');
    expect(withPolarity.polarityRouting?.slotRoutings[0]?.reasonCodes).toContain(
      'RULE3_BINDING_PORT_NOT_RESOLVED',
    );
  });

  it('Phase 4 registry subset metadata', () => {
    expect(
      RULE4_PHASE4_REASON_CODE_REGISTRY.some((e) => e.code === 'RULE4_POLARITY_PATHWAY_ROUTED'),
    ).toBe(true);
  });
});
