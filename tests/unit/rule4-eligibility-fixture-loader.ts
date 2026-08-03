import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rule4EligibilityAdapterInput } from '../../packages/clinical-contracts/src/rule4/eligibility/types.js';
import type { Rule4EligibilityEvaluationContext } from '../../packages/clinical-contracts/src/rule4/eligibility/types.js';
import type { Rule4EligibilityAdapterOutput } from '../../packages/clinical-contracts/src/rule4/eligibility/types.js';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_ELIGIBILITY_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/candidate-eligibility-scenarios.v1.json',
);

export const RULE4_ELIGIBILITY_FIXTURE_SHA256 =
  'B93C78A431102FB28A2D3CE249DC7C3817934E4AA245A34F1D13A5AA4C0D4084';

export type Rule4EligibilityFixtureScenario = {
  id: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  expected: Record<string, unknown>;
};

export type Rule4EligibilityFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  canonical_payload: string;
  candidate_eligibility_sha256: string;
};

export type Rule4CandidateEligibilityFixture = {
  fixtureVersion: string;
  fingerprintNote?: string;
  fingerprintV1References: Rule4EligibilityFingerprintV1Reference[];
  scenarioCount: number;
  scenarios: Rule4EligibilityFixtureScenario[];
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

export function loadRule4CandidateEligibilityFixture(): Rule4CandidateEligibilityFixture {
  const raw = JSON.parse(
    readFileSync(RULE4_ELIGIBILITY_FIXTURE_PATH, 'utf8'),
  ) as Rule4CandidateEligibilityFixture;
  if (!Array.isArray(raw.fingerprintV1References)) {
    raw.fingerprintV1References = [];
  }
  return raw;
}

export function eligibilityAdapterInputFromFixture(
  scenario: Rule4EligibilityFixtureScenario,
): Rule4EligibilityAdapterInput {
  return snakeToCamelDeep(scenario.input) as Rule4EligibilityAdapterInput;
}

export function eligibilityEvaluationContextFromFixture(
  scenario: Rule4EligibilityFixtureScenario,
): Rule4EligibilityEvaluationContext {
  const ctx = scenario.context ?? {};
  return snakeToCamelDeep(ctx) as Rule4EligibilityEvaluationContext;
}

export function slotEligibilityView(
  out: Rule4EligibilityAdapterOutput,
  slotId?: string,
): Record<string, unknown> {
  const slot = out.slotResolutions.find((s) => s.formulaSlotId === (slotId ?? 's1'));
  if (!slot) {
    return {};
  }
  return {
    eligibility_status: slot.eligibilityStatus,
    candidate_family: slot.candidateFamily,
    selection_status: slot.selectionStatus,
    selected_cascade: slot.selectedCascade,
    selected_dilution: slot.selectedDilution,
    blocking_gate_codes: [...slot.blockingGateCodes],
    reason_codes: [...slot.reasonCodes],
    limitation_codes: [...slot.limitationCodes],
    gate_ids: slot.gateResults.map((g) => g.gateId).sort(),
  };
}
