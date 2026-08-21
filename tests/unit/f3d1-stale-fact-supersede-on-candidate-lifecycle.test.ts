import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('F3D-1 stale fact supersede on candidate lifecycle contract', () => {
  it('fact repo locks sorted identities then conditionally ACTIVE → SUPERSEDED by extraction_candidate_id', () => {
    const src = fs.readFileSync(
      path.join(root, 'packages/database/src/repositories/factCandidate.ts'),
      'utf8',
    );
    expect(src).toMatch(/async lockIdentitiesForActiveLinkedCandidates\(/);
    expect(src).toMatch(/async supersedeActiveLinkedToCandidates\(/);
    expect(src).toMatch(/ORDER BY|\.sort\(/);
    expect(src).toMatch(/decision_status = 'ACTIVE'/);
    expect(src).toMatch(
      /SET decision_status = 'SUPERSEDED'[\s\S]*AND extraction_candidate_id = ANY\(\$3::uuid\[\]\)[\s\S]*AND decision_status = 'ACTIVE'/,
    );
    expect(src).not.toMatch(/DELETE FROM clinical_fact_candidates/);
  });

  it('supersedeRuns acquires candidate locks before fact locks and supersedes linked ACTIVE facts', () => {
    const src = fs.readFileSync(
      path.join(root, 'packages/database/src/repositories/extraction.ts'),
      'utf8',
    );
    const start = src.indexOf('async supersedeRuns(');
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, start + 3500);
    const candLock = body.indexOf('lockF3cReviewedCueSource');
    const factLock = body.indexOf('lockIdentitiesForActiveLinkedCandidates');
    const factSuper = body.indexOf('supersedeActiveLinkedToCandidates');
    expect(candLock).toBeGreaterThan(-1);
    expect(factLock).toBeGreaterThan(candLock);
    expect(factSuper).toBeGreaterThan(factLock);
  });

  it('keeps readiness inactive; D3 normalization service exists without API activation', () => {
    const ready = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).not.toMatch(/f3d2dFoundation:\s*true/);
    expect(ready).not.toMatch(/materializeFactNormalizations/);
    const services = fs.readdirSync(path.join(root, 'packages/database/src/services'));
    expect(services.some((n) => /factNormalizationService/i.test(n))).toBe(true);
    const extraction = fs.readFileSync(
      path.join(root, 'packages/database/src/repositories/extraction.ts'),
      'utf8',
    );
    expect(extraction).not.toMatch(/supersedeActiveLinkedToFacts|factNormalization/);
  });
});
