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
  return selectionEvaluationContextFromPhase8Context(scenario.context);
}

/** Phase 8 parity context — maps evidence_resolution → evidenceAdapter (mandated). */
export function selectionEvaluationContextFromPhase8Context(
  ctx: Record<string, unknown> | undefined,
): Rule4SelectionEvaluationContext {
  const raw = ctx ?? {};
  const mapped = snakeToCamelDeep(raw) as Rule4SelectionEvaluationContext;
  if (raw.evidence_items != null) {
    mapped.evidenceItems = snakeToCamelDeep(
      raw.evidence_items,
    ) as Rule4SelectionEvaluationContext['evidenceItems'];
  }
  if (raw.evidence_resolution != null) {
    mapped.evidenceAdapter = snakeToCamelDeep(
      raw.evidence_resolution,
    ) as Rule4SelectionEvaluationContext['evidenceAdapter'];
  }
  for (const key of [
    'polarity_context',
    'phase_context',
    'severity_context',
    'safety_context',
    'selection_records',
  ] as const) {
    if (raw[key] != null) {
      (mapped as Record<string, unknown>)[snakeToCamelKey(key)] = snakeToCamelDeep(raw[key]);
    }
  }
  if (raw.binding_gate_mandatory != null) {
    mapped.bindingGateMandatory = raw.binding_gate_mandatory as boolean;
  }
  return mapped;
}

/** Incomplete Phase 8 context (negative tests only — no evidence adapter binding). */
export function selectionEvaluationContextIncompleteFromPhase8Context(
  ctx: Record<string, unknown> | undefined,
): Rule4SelectionEvaluationContext {
  const raw = ctx ?? {};
  return {
    safetyGate: snakeToCamelDeep(raw.safety_gate) as Rule4SelectionEvaluationContext['safetyGate'],
    verifiedAge: snakeToCamelDeep(
      raw.verified_age,
    ) as Rule4SelectionEvaluationContext['verifiedAge'],
    eligibilityResolution: snakeToCamelDeep(
      raw.eligibility_resolution,
    ) as Rule4SelectionEvaluationContext['eligibilityResolution'],
    bindingGateMandatory: (raw.binding_gate_mandatory as boolean | undefined) ?? true,
  };
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
