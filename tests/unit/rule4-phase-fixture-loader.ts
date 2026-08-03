import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rule4EvidenceAdapterOutput } from '../../packages/clinical-contracts/src/rule4/evidence/types.js';
import type { Rule4PolarityAdapterOutput } from '../../packages/clinical-contracts/src/rule4/polarity/types.js';
import type { Rule4PhaseAdapterInput } from '../../packages/clinical-contracts/src/rule4/phase/types.js';
import type { Rule4PhaseEvaluationContext } from '../../packages/clinical-contracts/src/rule4/phase/types.js';
import type { Rule4SafetyGateOutput } from '../../packages/clinical-contracts/src/rule4/output.js';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_PHASE_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/phase-resolution-scenarios.v1.json',
);

export type Rule4PhaseFixtureScenario = {
  id: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  expected: Record<string, unknown>;
};

export type Rule4PhaseFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  canonical_payload: string;
  phase_resolution_sha256: string;
};

export type Rule4PhaseResolutionFixture = {
  fixtureVersion: string;
  fingerprintNote?: string;
  fingerprintV1References: Rule4PhaseFingerprintV1Reference[];
  scenarioCount: number;
  scenarios: Rule4PhaseFixtureScenario[];
};

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function snakeToCamelDeep(obj: unknown): unknown {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelDeep);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[snakeToCamelKey(k)] = snakeToCamelDeep(v);
  }
  return out;
}

export function loadRule4PhaseResolutionFixture(): Rule4PhaseResolutionFixture {
  const raw = JSON.parse(
    readFileSync(RULE4_PHASE_FIXTURE_PATH, 'utf8'),
  ) as Rule4PhaseResolutionFixture;
  if (!Array.isArray(raw.fingerprintV1References)) {
    raw.fingerprintV1References = [];
  }
  return raw;
}

export function phaseAdapterInputFromFixture(
  scenario: Rule4PhaseFixtureScenario,
): Rule4PhaseAdapterInput {
  return snakeToCamelDeep(scenario.input) as Rule4PhaseAdapterInput;
}

export function phaseEvaluationContextFromFixture(
  scenario: Rule4PhaseFixtureScenario,
): Rule4PhaseEvaluationContext {
  const ctx = scenario.context ?? {};
  const mapped = snakeToCamelDeep(ctx) as Record<string, unknown>;
  const inputBypass =
    (scenario.input as Record<string, unknown>).trusted_synthetic_binding_bypass === true;
  const mandatoryFromContext = mapped.bindingGateMandatory;
  const bindingGateMandatory = inputBypass
    ? false
    : mandatoryFromContext !== undefined
      ? Boolean(mandatoryFromContext)
      : true;
  return {
    safetyGate: (mapped.safetyGate as Rule4SafetyGateOutput | undefined) ?? null,
    evidenceAdapter: (mapped.evidenceAdapter as Rule4EvidenceAdapterOutput | undefined) ?? null,
    polarityRouting: (mapped.polarityRouting as Rule4PolarityAdapterOutput | undefined) ?? null,
    bindingGateMandatory,
  };
}

export function firstSlotView(output: {
  slotResolutions: Array<Record<string, unknown>>;
  reasonCodes: string[];
}): Record<string, unknown> {
  const s = output.slotResolutions[0] as Record<string, unknown>;
  return {
    phase_status: s.phaseStatus,
    resolved_phase: s.resolvedPhase,
    duration_consistency_status: s.durationConsistencyStatus,
    calculated_duration_days: s.calculatedDurationDays,
    flare_status: s.flareStatus,
    reason_codes: output.reasonCodes,
    limitation_codes: s.limitationCodes as string[],
  };
}
