import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RULE4_EVIDENCE_FIXTURE_PATH,
  loadRule4EvidenceAdapterFixture,
} from './rule4-evidence-fixture-loader.ts';

const REPO = resolve(import.meta.dirname, '../..');
const RULE4_TEST_DIR = resolve(REPO, 'tests/unit');

const FORBIDDEN_WRITE_PATTERNS: RegExp[] = [
  /writeFileSync\s*\(/,
  /writeFile\s*\(/,
  /\.write_text\s*\(/,
];

const FORBIDDEN_WRITE_SUBSTRINGS = ['updateGolden', 'update-golden'];

describe('Rule 4 evidence golden fixture immutability', () => {
  it('fixture file hash is stable for the duration of this file tests', () => {
    const hashAtStart = createHash('sha256')
      .update(readFileSync(RULE4_EVIDENCE_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    const hashAtEnd = createHash('sha256')
      .update(readFileSync(RULE4_EVIDENCE_FIXTURE_PATH))
      .digest('hex')
      .toUpperCase();
    expect(hashAtEnd).toBe(hashAtStart);
  });

  it('Rule 4 unit tests do not use file-write APIs on fixtures', () => {
    const rule4TestFiles = readdirSync(RULE4_TEST_DIR).filter(
      (f) => f.startsWith('rule4') && (f.endsWith('.ts') || f.endsWith('.tsx')),
    );
    for (const file of rule4TestFiles) {
      if (file === 'rule4-evidence-fixture-golden.test.ts') {
        continue;
      }
      const src = readFileSync(resolve(RULE4_TEST_DIR, file), 'utf8');
      for (const pattern of FORBIDDEN_WRITE_PATTERNS) {
        expect(src, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
      for (const sub of FORBIDDEN_WRITE_SUBSTRINGS) {
        expect(src.includes(sub), `${file} must not contain ${sub}`).toBe(false);
      }
    }
  });

  it('fixture expected blocks are not evaluator-generated fingerprints', () => {
    const fixture = loadRule4EvidenceAdapterFixture();
    for (const scenario of fixture.scenarios) {
      expect(scenario.expected).not.toHaveProperty('deterministic_evidence_pool_fingerprint');
    }
    expect(fixture.fingerprintV1References.length).toBeGreaterThanOrEqual(3);
    for (const ref of fixture.fingerprintV1References) {
      expect(ref.canonicalPayload.length).toBeGreaterThan(10);
      expect(ref.evidencePoolSha256).toMatch(/^[A-F0-9]{64}$/);
    }
  });
});
