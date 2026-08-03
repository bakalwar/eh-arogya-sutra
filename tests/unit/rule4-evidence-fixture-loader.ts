import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rule4EvidenceAdapterInput } from '../../packages/clinical-contracts/src/rule4/evidence/types.js';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_EVIDENCE_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/evidence-adapter-scenarios.v1.json',
);

export type Rule4EvidenceFixtureScenario = {
  id: string;
  input: Record<string, unknown>;
  expected: {
    usable_by_slot: Record<string, string[]>;
    contradictory_slots?: string[];
    quarantine_blocked?: boolean;
    corroborating_parent_count?: Record<string, number>;
    corroborating_parent_source_ids?: Record<string, string[]>;
    superseded_finding_ids?: string[];
  };
};

export type Rule4EvidenceFingerprintV1Reference = {
  referenceId: string;
  scenarioId: string;
  canonicalPayload: string;
  evidencePoolSha256: string;
};

export type Rule4EvidenceAdapterFixture = {
  fixtureVersion: string;
  fingerprintNote?: string;
  fingerprintV1References: Rule4EvidenceFingerprintV1Reference[];
  scenarioCount: number;
  scenarios: Rule4EvidenceFixtureScenario[];
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

export function loadRule4EvidenceAdapterFixture(): Rule4EvidenceAdapterFixture {
  const raw = JSON.parse(
    readFileSync(RULE4_EVIDENCE_FIXTURE_PATH, 'utf8'),
  ) as Rule4EvidenceAdapterFixture;
  if (!Array.isArray(raw.fingerprintV1References)) {
    raw.fingerprintV1References = [];
  }
  return raw;
}

export function evidenceAdapterInputFromFixture(
  scenario: Rule4EvidenceFixtureScenario,
): Rule4EvidenceAdapterInput {
  return snakeToCamelDeep(scenario.input) as Rule4EvidenceAdapterInput;
}
