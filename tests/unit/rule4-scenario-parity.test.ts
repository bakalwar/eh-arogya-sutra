import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  evaluateRule4Phase2Safety,
  type Rule4InputContract,
} from '../../packages/clinical-contracts/src/rule4/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = path.join(root, 'fixtures/rule4/safety-gate-scenarios.v1.json');

type Scenario = {
  id: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
};

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function snakeToCamel(obj: unknown): unknown {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[snakeToCamelKey(k)] = snakeToCamel(v);
  }
  return out;
}

function normalizedView(result: ReturnType<typeof evaluateRule4Phase2Safety>) {
  const sg = result.safetyGate!;
  return {
    ageVerificationStatus: sg.ageVerificationStatus,
    pediatricBand: sg.pediatricBand,
    safetyGateStatus: sg.safetyGateStatus,
    safetyStatus: sg.safetyStatus,
    prescriptionStatus: sg.prescriptionStatus,
    holdStatus: sg.holdStatus,
    patientWideHold: sg.patientWideHold,
    urgentEscalationRequired: sg.urgentEscalationRequired,
    safetyClearForFutureCascade: sg.safetyClearForFutureCascade,
    reasonCodes: [...sg.reasonCodes].sort(),
    limitationCodes: [...sg.limitationCodes].sort(),
    slotPotencyStatus: result.slots[0]?.potencyStatus ?? null,
    selectedDilution: result.slots[0]?.selectedDilution ?? null,
    safetyFingerprint: sg.deterministicSafetyFingerprint,
  };
}

describe('Rule 4 safety scenario fixture (TypeScript)', () => {
  const { scenarios } = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as { scenarios: Scenario[] };

  for (const scenario of scenarios) {
    it(`scenario ${scenario.id}`, () => {
      const input = snakeToCamel(scenario.input) as Rule4InputContract;
      const view = normalizedView(evaluateRule4Phase2Safety(input));
      for (const [key, value] of Object.entries(scenario.expected)) {
        expect(view[key as keyof typeof view]).toEqual(value);
      }
      expect(view.selectedDilution).toBeNull();
      expect(view.safetyFingerprint).toMatch(/^[A-F0-9]{64}$/);
    });
  }
});
