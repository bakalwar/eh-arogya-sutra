import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  evaluateRule4Phase2Safety,
  rule4SafetyFingerprintV1CanonicalString,
  rule4SafetyFingerprintV1Hash,
  type Rule4InputContract,
} from '../../packages/clinical-contracts/src/rule4/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = path.join(root, 'fixtures/rule4/safety-gate-scenarios.v1.json');

function snakeToCamel(obj: unknown): unknown {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = snakeToCamel(v);
  }
  return out;
}

describe('Rule 4 safety fingerprint v1 (TypeScript)', () => {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as {
    fingerprintV1Reference: {
      scenarioId: string;
      canonicalPayload: string;
      safetySha256: string;
      emptyResultSha256: string;
    };
    scenarios: { id: string; input: Record<string, unknown> }[];
  };

  it('valid-adult-clear matches fixture reference hash', () => {
    const sc = fixture.scenarios.find((s) => s.id === fixture.fingerprintV1Reference.scenarioId)!;
    const input = snakeToCamel(sc.input) as Rule4InputContract;
    const out = evaluateRule4Phase2Safety(input);
    expect(out.safetyGate?.deterministicSafetyFingerprint).toBe(
      fixture.fingerprintV1Reference.safetySha256,
    );
    expect(out.deterministicFingerprint).toBe(fixture.fingerprintV1Reference.emptyResultSha256);
    expect(
      rule4SafetyFingerprintV1Hash({
        safetyGateStatus: out.safetyGate!.safetyGateStatus,
        safetyStatus: out.safetyGate!.safetyStatus,
        prescriptionStatus: out.safetyGate!.prescriptionStatus,
        holdStatus: out.safetyGate!.holdStatus,
        patientWideHold: out.safetyGate!.patientWideHold,
        urgentEscalationRequired: out.safetyGate!.urgentEscalationRequired,
        analysisStatus: out.safetyGate!.analysisStatus,
        d13HardStopActive: out.safetyGate!.d13HardStopActive,
        ageVerification: out.safetyGate!.ageVerificationStatus,
        pediatricBand: out.safetyGate!.pediatricBand,
        bpCrisis: false,
        reasonCodes: out.safetyGate!.reasonCodes,
        limitationCodes: out.safetyGate!.limitationCodes,
      }),
    ).toBe(fixture.fingerprintV1Reference.safetySha256);
    expect(
      rule4SafetyFingerprintV1CanonicalString({
        safetyGateStatus: out.safetyGate!.safetyGateStatus,
        safetyStatus: out.safetyGate!.safetyStatus,
        prescriptionStatus: out.safetyGate!.prescriptionStatus,
        holdStatus: out.safetyGate!.holdStatus,
        patientWideHold: out.safetyGate!.patientWideHold,
        urgentEscalationRequired: out.safetyGate!.urgentEscalationRequired,
        analysisStatus: out.safetyGate!.analysisStatus,
        d13HardStopActive: out.safetyGate!.d13HardStopActive,
        ageVerification: out.safetyGate!.ageVerificationStatus,
        pediatricBand: out.safetyGate!.pediatricBand,
        bpCrisis: false,
        reasonCodes: out.safetyGate!.reasonCodes,
        limitationCodes: out.safetyGate!.limitationCodes,
      }),
    ).toBe(fixture.fingerprintV1Reference.canonicalPayload);
  });

  it('input key order does not change safety fingerprint', () => {
    const a = snakeToCamel(fixture.scenarios.find((s) => s.id === 'valid-adult-clear')!.input);
    const b = JSON.parse(JSON.stringify(a));
    const reordered = { ...b, zzz_reorder_probe: 1 };
    delete (reordered as Record<string, unknown>).engineMode;
    (reordered as Record<string, unknown>).engineMode = 'shadow';
    const fpA = evaluateRule4Phase2Safety(a as Rule4InputContract).safetyGate!
      .deterministicSafetyFingerprint;
    const fpB = evaluateRule4Phase2Safety(reordered as Rule4InputContract).safetyGate!
      .deterministicSafetyFingerprint;
    expect(fpA).toBe(fpB);
  });

  it('canonical payload contains no raw PHI field names', () => {
    const payload = fixture.fingerprintV1Reference.canonicalPayload;
    expect(payload).not.toMatch(/date_of_birth|patient_name|phone/i);
  });
});
