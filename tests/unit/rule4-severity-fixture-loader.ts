import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rule4EvidenceAdapterOutput } from '../../packages/clinical-contracts/src/rule4/evidence/types.js';
import type { Rule4SafetyGateOutput } from '../../packages/clinical-contracts/src/rule4/output.js';
import type { Rule4SeverityAdapterInput } from '../../packages/clinical-contracts/src/rule4/severity/types.js';
import type { Rule4SeverityEvaluationContext } from '../../packages/clinical-contracts/src/rule4/severity/types.js';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_SEVERITY_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/severity-resolution-scenarios.v1.json',
);

export const RULE4_SEVERITY_FIXTURE_SHA256 =
  '6299440860A3D67E8CC7BED89DADE0E5BC81071FC5114F4F68BCEF34E4F0A30C';

export type Rule4SeverityFixtureScenario = {
  id: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  expected: Record<string, unknown>;
};

export type Rule4SeverityFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  canonical_payload: string;
  severity_resolution_sha256: string;
};

export type Rule4SeverityResolutionFixture = {
  fixtureVersion: string;
  fingerprintNote?: string;
  fingerprintV1References: Rule4SeverityFingerprintV1Reference[];
  scenarioCount: number;
  scenarios: Rule4SeverityFixtureScenario[];
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

export function loadRule4SeverityResolutionFixture(): Rule4SeverityResolutionFixture {
  const raw = JSON.parse(
    readFileSync(RULE4_SEVERITY_FIXTURE_PATH, 'utf8'),
  ) as Rule4SeverityResolutionFixture;
  if (!Array.isArray(raw.fingerprintV1References)) {
    raw.fingerprintV1References = [];
  }
  return raw;
}

export function severityAdapterInputFromFixture(
  scenario: Rule4SeverityFixtureScenario,
): Rule4SeverityAdapterInput {
  return snakeToCamelDeep(scenario.input) as Rule4SeverityAdapterInput;
}

export function severityEvaluationContextFromFixture(
  scenario: Rule4SeverityFixtureScenario,
): Rule4SeverityEvaluationContext {
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
    polarityRouting:
      (mapped.polarityRouting as Rule4SeverityEvaluationContext['polarityRouting']) ?? null,
    phaseResolution:
      (mapped.phaseResolution as Rule4SeverityEvaluationContext['phaseResolution']) ?? null,
    bindingGateMandatory,
  };
}

export function slotView(
  output: { slotResolutions: Array<Record<string, unknown>> },
  slotId?: string,
): Record<string, unknown> {
  const id = slotId ?? (output.slotResolutions[0] as { formulaSlotId: string }).formulaSlotId;
  const s = output.slotResolutions.find((r) => r.formulaSlotId === id) as Record<string, unknown>;
  if (!s) {
    throw new Error(`slot ${id} not found`);
  }
  return {
    formula_slot_id: s.formulaSlotId,
    severity_status: s.severityStatus,
    severity_score: s.severityScore,
    severity_band: s.severityBand,
    severity_resolution_source: s.severityResolutionSource,
    binding_status: s.bindingStatus,
    reason_codes: s.reasonCodes,
    limitation_codes: s.limitationCodes,
  };
}
