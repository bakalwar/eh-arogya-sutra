import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluatePhaseAdapter } from '../../packages/clinical-contracts/src/rule4/phase/evaluatePhaseAdapter.js';
import { rule4PhaseResolutionFingerprintV1Hash } from '../../packages/clinical-contracts/src/rule4/phase/phaseFingerprintV1.js';
import {
  RULE4_PHASE_FIXTURE_PATH,
  loadRule4PhaseResolutionFixture,
  phaseAdapterInputFromFixture,
  phaseEvaluationContextFromFixture,
} from './rule4-phase-fixture-loader.ts';

const REPO = resolve(import.meta.dirname, '../..');
const RULE4_TEST_DIR = resolve(REPO, 'tests/unit');

const FORBIDDEN_WRITE_PATTERNS: RegExp[] = [
  /writeFileSync\s*\(/,
  /writeFile\s*\(/,
  /\.write_text\s*\(/,
];

const GOLDEN_IMMUTABILITY_SELF_FILES = new Set([
  'rule4-evidence-fixture-golden.test.ts',
  'rule4-polarity-fixture-golden.test.ts',
  'rule4-phase-fixture-golden.test.ts',
]);

describe('Rule 4 phase golden fixture immutability', () => {
  it('fixture file hash is stable for the duration of this file tests', () => {
    const hashAtStart = createHash('sha256')
      .update(readFileSync(RULE4_PHASE_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    const hashAtEnd = createHash('sha256')
      .update(readFileSync(RULE4_PHASE_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    expect(hashAtEnd).toBe(hashAtStart);
  });

  it('Rule 4 unit tests do not use file-write APIs on fixtures', () => {
    const rule4TestFiles = readdirSync(RULE4_TEST_DIR).filter(
      (f) => f.startsWith('rule4') && (f.endsWith('.ts') || f.endsWith('.tsx')),
    );
    for (const file of rule4TestFiles) {
      if (GOLDEN_IMMUTABILITY_SELF_FILES.has(file)) {
        continue;
      }
      const src = readFileSync(resolve(RULE4_TEST_DIR, file), 'utf8');
      for (const pattern of FORBIDDEN_WRITE_PATTERNS) {
        expect(src, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('fingerprint v1 references match independent evaluation', () => {
    const fixture = loadRule4PhaseResolutionFixture();
    expect(fixture.fingerprintV1References.length).toBeGreaterThanOrEqual(3);
    for (const ref of fixture.fingerprintV1References) {
      const scenario = fixture.scenarios.find((s) => s.id === ref.scenario_id);
      expect(scenario).toBeDefined();
      const out = evaluatePhaseAdapter(
        phaseAdapterInputFromFixture(scenario!),
        phaseEvaluationContextFromFixture(scenario!),
      );
      const sha = rule4PhaseResolutionFingerprintV1Hash({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        slotResolutions: out.slotResolutions,
        reasonCodes: out.reasonCodes,
        limitationCodes: out.limitationCodes,
      });
      expect(sha).toBe(ref.phase_resolution_sha256);
      expect(ref.canonical_payload).toBeTruthy();
    }
  });
});
