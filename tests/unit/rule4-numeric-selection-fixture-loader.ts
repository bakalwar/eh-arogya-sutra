import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rule4SelectionAdapterInput } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import type { Rule4SelectionEvaluationContext } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import type { Rule4SelectionAdapterOutput } from '../../packages/clinical-contracts/src/rule4/selection/types.js';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_NUMERIC_SELECTION_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/numeric-selection-scenarios.v1.json',
);

export type Rule4NumericSelectionFixtureScenario = {
  id: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  expected: Record<string, unknown>;
};

export type Rule4NumericSelectionFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  canonical_payload: string;
  numeric_selection_sha256: string;
};

export type Rule4NumericSelectionFixture = {
  fixtureVersion: string;
  fingerprintNote?: string;
  fingerprintV1References: Rule4NumericSelectionFingerprintV1Reference[];
  scenarioCount: number;
  scenarios: Rule4NumericSelectionFixtureScenario[];
};

export let RULE4_NUMERIC_SELECTION_FIXTURE_SHA256 =
  '6AC12D4B8BA6E6CA71A1F0EB2DC6A80B995632239E407723711F6B4065788E40';

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

export function loadRule4NumericSelectionFixture(): Rule4NumericSelectionFixture {
  const raw = JSON.parse(
    readFileSync(RULE4_NUMERIC_SELECTION_FIXTURE_PATH, 'utf8'),
  ) as Rule4NumericSelectionFixture;
  if (!Array.isArray(raw.fingerprintV1References)) {
    raw.fingerprintV1References = [];
  }
  return raw;
}

export function refreshNumericSelectionFixtureSha256(): void {
  RULE4_NUMERIC_SELECTION_FIXTURE_SHA256 = createHash('sha256')
    .update(readFileSync(RULE4_NUMERIC_SELECTION_FIXTURE_PATH))
    .digest('hex')
    .toUpperCase();
}

refreshNumericSelectionFixtureSha256();

export function selectionAdapterInputFromFixture(
  scenario: Rule4NumericSelectionFixtureScenario,
): Rule4SelectionAdapterInput {
  return snakeToCamelDeep(scenario.input) as Rule4SelectionAdapterInput;
}

export function selectionEvaluationContextFromFixture(
  scenario: Rule4NumericSelectionFixtureScenario,
): Rule4SelectionEvaluationContext {
  const ctx = scenario.context ?? {};
  const mapped = snakeToCamelDeep(ctx) as Rule4SelectionEvaluationContext;
  if (ctx.evidence_items != null) {
    mapped.evidenceItems = snakeToCamelDeep(
      ctx.evidence_items,
    ) as Rule4SelectionEvaluationContext['evidenceItems'];
  }
  if (ctx.evidence_resolution != null) {
    mapped.evidenceAdapter = snakeToCamelDeep(
      ctx.evidence_resolution,
    ) as Rule4SelectionEvaluationContext['evidenceAdapter'];
  }
  return mapped;
}

export function slotSelectionView(
  out: Rule4SelectionAdapterOutput,
  slotId?: string,
): Record<string, unknown> {
  const slot = out.slotResolutions.find((s) => s.formulaSlotId === (slotId ?? 's1'));
  if (!slot) {
    return {};
  }
  return {
    selection_status: slot.selectionStatus,
    selected_cascade: slot.selectedCascade,
    selected_dilution: slot.selectedDilution,
    selection_basis: slot.selectionBasis,
    eligible_family_consumed: slot.eligibleFamilyConsumed,
    tie_break_status: slot.tieBreakStatus,
    fallback_status: slot.fallbackStatus,
    pre_pediatric_overlay_status: slot.prePediatricOverlayStatus,
    reason_codes: [...slot.reasonCodes],
    limitation_codes: [...slot.limitationCodes],
  };
}
