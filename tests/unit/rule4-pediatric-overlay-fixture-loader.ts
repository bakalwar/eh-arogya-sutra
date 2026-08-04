import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rule4SelectionAdapterInput } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import type { Rule4SelectionEvaluationContext } from '../../packages/clinical-contracts/src/rule4/selection/types.js';
import type { Rule4PediatricOverlayAdapterInput } from '../../packages/clinical-contracts/src/rule4/pediatricOverlay/types.js';
import type { Rule4PediatricOverlayEvaluationContext } from '../../packages/clinical-contracts/src/rule4/pediatricOverlay/types.js';
import type { Rule4PediatricOverlayAdapterOutput } from '../../packages/clinical-contracts/src/rule4/pediatricOverlay/types.js';
import { evaluatePediatricOverlayAdapter } from '../../packages/clinical-contracts/src/rule4/pediatricOverlay/evaluatePediatricOverlayAdapter.js';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import { fingerprintFromSelectionOutput } from '../../packages/clinical-contracts/src/rule4/selection/selectionFingerprintV1.js';
import {
  selectionAdapterInputFromFixture,
  selectionEvaluationContextFromPhase8Context,
  selectionEvaluationContextIncompleteFromPhase8Context,
  type Rule4NumericSelectionFixtureScenario,
} from './rule4-numeric-selection-fixture-loader.ts';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_PEDIATRIC_OVERLAY_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/pediatric-overlay-scenarios.v1.json',
);

export type Rule4PediatricOverlayFixtureScenario = {
  id: string;
  phase8_ref: string;
  verified_age: Record<string, unknown>;
  safety_gate?: Record<string, unknown> | null;
  restrict_gate_ledger?: Record<string, unknown> | null;
  overlay_label?: 'SYNTHETIC' | 'PRODUCTION';
  phase8_fingerprint_override?: string | null;
  slot_target_override?: string | null;
  expected: Record<string, unknown>;
};

export type Rule4PediatricOverlayFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  canonical_payload: string;
  pediatric_overlay_sha256: string;
};

export type Rule4PediatricOverlayFixture = {
  fixtureVersion: string;
  scenarioCount: number;
  fingerprintV1References: Rule4PediatricOverlayFingerprintV1Reference[];
  scenarios: Rule4PediatricOverlayFixtureScenario[];
};

export let RULE4_PEDIATRIC_OVERLAY_FIXTURE_SHA256 =
  '1222B8CC5654450E30D3159A8143B3FD854B2DE5663DAF2BB05BCB436B5841D7';

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

export function loadRule4PediatricOverlayFixture(): Rule4PediatricOverlayFixture {
  return JSON.parse(
    readFileSync(RULE4_PEDIATRIC_OVERLAY_FIXTURE_PATH, 'utf8'),
  ) as Rule4PediatricOverlayFixture;
}

export function refreshPediatricOverlayFixtureSha256(): void {
  try {
    RULE4_PEDIATRIC_OVERLAY_FIXTURE_SHA256 = createHash('sha256')
      .update(readFileSync(RULE4_PEDIATRIC_OVERLAY_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
  } catch {
    RULE4_PEDIATRIC_OVERLAY_FIXTURE_SHA256 = '';
  }
}

refreshPediatricOverlayFixtureSha256();

export function loadPhase8ScenarioByRef(ref: string): {
  input: Rule4SelectionAdapterInput;
  context: Rule4SelectionEvaluationContext;
} {
  const phase8 = JSON.parse(
    readFileSync(resolve(REPO, 'fixtures/rule4/numeric-selection-scenarios.v1.json'), 'utf8'),
  ) as {
    scenarios: Rule4NumericSelectionFixtureScenario[];
  };
  const row = phase8.scenarios.find((s) => s.id === ref);
  if (!row) {
    throw new Error(`phase8_ref not found: ${ref}`);
  }
  return {
    input: selectionAdapterInputFromFixture(row),
    context: selectionEvaluationContextFromPhase8Context(row.context),
  };
}

export function loadPhase8ScenarioByRefIncomplete(ref: string): {
  input: Rule4SelectionAdapterInput;
  context: Rule4SelectionEvaluationContext;
} {
  const phase8 = JSON.parse(
    readFileSync(resolve(REPO, 'fixtures/rule4/numeric-selection-scenarios.v1.json'), 'utf8'),
  ) as {
    scenarios: Rule4NumericSelectionFixtureScenario[];
  };
  const row = phase8.scenarios.find((s) => s.id === ref);
  if (!row) {
    throw new Error(`phase8_ref not found: ${ref}`);
  }
  return {
    input: selectionAdapterInputFromFixture(row),
    context: selectionEvaluationContextIncompleteFromPhase8Context(row.context),
  };
}

export function overlaySlotView(
  out: Rule4PediatricOverlayAdapterOutput,
  slotId: string,
): Record<string, unknown> {
  const slot = out.slotResolutions.find((s) => s.formulaSlotId === slotId);
  if (!slot) {
    throw new Error(`slot missing: ${slotId}`);
  }
  return {
    pediatric_overlay_status: slot.pediatricOverlayStatus,
    final_draft_dilution: slot.finalDraftDilution,
    final_draft_cascade: slot.finalDraftCascade,
    base_selected_dilution: slot.baseSelectedDilution,
    verified_age_band: slot.verifiedAgeBand,
    pediatric_matrix_authority: slot.pediatricMatrixAuthority,
    d13_d_justification_status: slot.d13DJustificationStatus,
    reason_codes: slot.reasonCodes,
  };
}

export function buildOverlayInputFromScenario(
  scenario: Rule4PediatricOverlayFixtureScenario,
  phase8Fingerprint: string,
  targetId: string,
): Rule4PediatricOverlayAdapterInput {
  const ledger = scenario.restrict_gate_ledger
    ? (snakeToCamelDeep(scenario.restrict_gate_ledger) as Record<string, unknown>)
    : {};
  return {
    contractVersion: 'ehas2-rule4-contract-v1-phase9-pediatric-overlay',
    rulesetVersion: 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469',
    registryVersion: 'rule4-reason-codes-phase9-pediatric-overlay-subset-v1',
    label: scenario.overlay_label ?? 'SYNTHETIC',
    formulaSlotIds: ['s1'],
    slotOverlayRecords: [
      {
        formulaSlotId: 's1',
        formulaTargetId: targetId,
        phase8SelectionFingerprint: scenario.phase8_fingerprint_override ?? phase8Fingerprint,
        restrictGateLedger:
          ledger as Rule4PediatricOverlayAdapterInput['slotOverlayRecords'][0]['restrictGateLedger'],
      },
    ],
  };
}

export function overlayContextFromScenario(
  scenario: Rule4PediatricOverlayFixtureScenario,
  selectionResolution: Rule4PediatricOverlayEvaluationContext['selectionResolution'],
): Rule4PediatricOverlayEvaluationContext {
  return {
    verifiedAge: snakeToCamelDeep(
      scenario.verified_age,
    ) as Rule4PediatricOverlayEvaluationContext['verifiedAge'],
    safetyGate: scenario.safety_gate
      ? (snakeToCamelDeep(
          scenario.safety_gate,
        ) as Rule4PediatricOverlayEvaluationContext['safetyGate'])
      : null,
    selectionResolution,
    upstreamEligibilityFingerprint:
      selectionResolution?.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
  };
}

export function safetyFlagsFromScenario(scenario: Rule4PediatricOverlayFixtureScenario): {
  d13HsActive: boolean;
  patientWideHold: boolean;
  urgentEscalationRequired: boolean;
} {
  const sg = scenario.safety_gate
    ? (snakeToCamelDeep(scenario.safety_gate) as Record<string, unknown>)
    : null;
  return {
    d13HsActive: Boolean(sg?.d13HardStopActive),
    patientWideHold: Boolean(sg?.patientWideHold),
    urgentEscalationRequired: Boolean(sg?.urgentEscalationRequired),
  };
}

export function evaluatePediatricOverlayFromScenario(
  scenario: Rule4PediatricOverlayFixtureScenario,
): {
  overlayOut: Rule4PediatricOverlayAdapterOutput;
  safetyFlags: ReturnType<typeof safetyFlagsFromScenario>;
} {
  const p8 = loadPhase8ScenarioByRef(scenario.phase8_ref);
  const selOut = evaluateSelectionAdapter(p8.input, p8.context);
  const fp = fingerprintFromSelectionOutput(
    selOut,
    selOut.slotResolutions[0]?.upstreamEligibilityFingerprint ?? null,
  );
  const targetId =
    scenario.slot_target_override ?? selOut.slotResolutions[0]?.formulaTargetId ?? 't1';
  const overlayIn = buildOverlayInputFromScenario(scenario, fp, targetId);
  const overlayOut = evaluatePediatricOverlayAdapter(
    overlayIn,
    overlayContextFromScenario(scenario, selOut),
  );
  return { overlayOut, safetyFlags: safetyFlagsFromScenario(scenario) };
}

export function findPediatricOverlayScenario(
  fixture: Rule4PediatricOverlayFixture,
  scenarioId: string,
): Rule4PediatricOverlayFixtureScenario {
  const row = fixture.scenarios.find((s) => s.id === scenarioId);
  if (!row) {
    throw new Error(`pediatric overlay scenario not found: ${scenarioId}`);
  }
  return row;
}

export function verifiedAgeInputFromScenario(
  scenario: Rule4PediatricOverlayFixtureScenario,
): Rule4InputContractVerifiedAge {
  return snakeToCamelDeep(scenario.verified_age) as Rule4InputContractVerifiedAge;
}

/** Minimal verified-age shape for Rule4InputContract (Phase 2 calendar fields). */
export type Rule4InputContractVerifiedAge = {
  verifiedDateOfBirth?: string;
  consultationAssessmentDate?: string;
  verificationStatus?: string;
  ageSource?: string;
  pediatricBandVerificationStatus?: string;
  upstreamVerifiedPediatricBand?: string;
  ageYears?: number;
};
