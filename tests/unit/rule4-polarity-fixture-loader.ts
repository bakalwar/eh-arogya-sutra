import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rule4PolarityAdapterInput } from '../../packages/clinical-contracts/src/rule4/polarity/types.js';
import type { Rule4PolarityEvaluationContext } from '../../packages/clinical-contracts/src/rule4/polarity/types.js';
import type { Rule4SafetyGateOutput } from '../../packages/clinical-contracts/src/rule4/output.js';
import type { Rule4EvidenceAdapterOutput } from '../../packages/clinical-contracts/src/rule4/evidence/types.js';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_POLARITY_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/polarity-routing-scenarios.v1.json',
);

export type Rule4PolarityFixtureScenario = {
  id: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  expected: {
    pathways_by_slot: Record<string, string>;
    execution_status?: string;
  };
};

export type Rule4PolarityFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  canonical_payload: string;
  polarity_routing_sha256: string;
};

export type Rule4PolarityRoutingFixture = {
  fixtureVersion: string;
  fingerprintNote?: string;
  fingerprintV1References: Rule4PolarityFingerprintV1Reference[];
  scenarioCount: number;
  scenarios: Rule4PolarityFixtureScenario[];
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

export function loadRule4PolarityRoutingFixture(): Rule4PolarityRoutingFixture {
  const raw = JSON.parse(
    readFileSync(RULE4_POLARITY_FIXTURE_PATH, 'utf8'),
  ) as Rule4PolarityRoutingFixture;
  if (!Array.isArray(raw.fingerprintV1References)) {
    raw.fingerprintV1References = [];
  }
  return raw;
}

export function polarityAdapterInputFromFixture(
  scenario: Rule4PolarityFixtureScenario,
): Rule4PolarityAdapterInput {
  return snakeToCamelDeep(scenario.input) as Rule4PolarityAdapterInput;
}

export function polarityEvaluationContextFromFixture(
  scenario: Rule4PolarityFixtureScenario,
): Rule4PolarityEvaluationContext {
  const ctx = scenario.context ?? {};
  const mapped = snakeToCamelDeep(ctx) as Record<string, unknown>;
  const safetyGate = mapped.safetyGate as Rule4SafetyGateOutput | undefined;
  const evidenceAdapter = mapped.evidenceAdapter as Rule4EvidenceAdapterOutput | undefined;
  const inputBypass =
    (scenario.input as Record<string, unknown>).trusted_synthetic_binding_bypass === true;
  const mandatoryFromContext = mapped.bindingGateMandatory;
  const bindingGateMandatory = inputBypass
    ? false
    : mandatoryFromContext !== undefined
      ? Boolean(mandatoryFromContext)
      : true;
  return {
    safetyGate: safetyGate ?? null,
    evidenceAdapter: evidenceAdapter ?? null,
    bindingGateMandatory,
  };
}
