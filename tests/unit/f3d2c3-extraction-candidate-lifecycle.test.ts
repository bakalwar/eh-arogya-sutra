import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('F3D-2C3 extraction-candidate lifecycle eligibility contract', () => {
  it('C2 cue reader uses exact EXTRACTED_UNVERIFIED positive allowlist', () => {
    const src = fs.readFileSync(
      path.join(root, 'packages/database/src/services/f3cReviewedCueSourceService.ts'),
      'utf8',
    );
    expect(src).toMatch(/candidate\.status\s*!==\s*'EXTRACTED_UNVERIFIED'/);
    expect(src).toMatch(/ValidationError\('SOURCE_INELIGIBLE'\)/);
    expect(src).not.toMatch(/candidate\.status\s*===\s*'SUPERSEDED'/);
    expect(src).toMatch(/lockF3cReviewedCueSource\s*\(/);
  });

  it('F3D-1 reviewed materialize locks then requires EXTRACTED_UNVERIFIED', () => {
    const src = fs.readFileSync(
      path.join(root, 'packages/database/src/services/factCandidateService.ts'),
      'utf8',
    );
    const deriveStart = src.indexOf('private async deriveReviewed(');
    expect(deriveStart).toBeGreaterThan(-1);
    const derive = src.slice(deriveStart, deriveStart + 2500);
    expect(derive).toMatch(/await lockF3cReviewedCueSource\s*\(\s*tx,\s*tenant,\s*candidateId/);
    expect(derive).toMatch(/candidate\.status\s*!==\s*'EXTRACTED_UNVERIFIED'/);
    expect(derive).toMatch(/ValidationError\('SOURCE_INELIGIBLE'\)/);
    const lockIdx = derive.indexOf('lockF3cReviewedCueSource');
    const statusIdx = derive.indexOf("!== 'EXTRACTED_UNVERIFIED'");
    expect(lockIdx).toBeGreaterThan(-1);
    expect(statusIdx).toBeGreaterThan(lockIdx);
  });

  it('supersedeRuns takes sorted lifecycle locks and conditional EXTRACTED_UNVERIFIED UPDATE', () => {
    const src = fs.readFileSync(
      path.join(root, 'packages/database/src/repositories/extraction.ts'),
      'utf8',
    );
    const start = src.indexOf('async supersedeRuns(');
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, start + 3200);
    expect(body).toMatch(/lockF3cReviewedCueSource/);
    expect(body).toMatch(/\.sort\(/);
    expect(body).toMatch(/status = 'EXTRACTED_UNVERIFIED'/);
    expect(body).toMatch(
      /UPDATE clinical_evidence_extraction_candidates SET status = 'SUPERSEDED'[\s\S]*AND status = 'EXTRACTED_UNVERIFIED'/,
    );
    expect(body).toMatch(/lockIdentitiesForActiveLinkedCandidates/);
    expect(body).toMatch(/supersedeActiveLinkedToCandidates/);
    const candLock = body.indexOf('lockF3cReviewedCueSource');
    const factLock = body.indexOf('lockIdentitiesForActiveLinkedCandidates');
    const candUpdate = body.indexOf(
      "UPDATE clinical_evidence_extraction_candidates SET status = 'SUPERSEDED'",
    );
    const factUpdate = body.indexOf('supersedeActiveLinkedToCandidates');
    expect(candLock).toBeGreaterThan(-1);
    expect(factLock).toBeGreaterThan(candLock);
    expect(candUpdate).toBeGreaterThan(factLock);
    expect(factUpdate).toBeGreaterThan(candUpdate);
    expect(body).not.toMatch(
      /UPDATE clinical_evidence_extraction_candidates SET status = 'SUPERSEDED'\s*\n\s*WHERE organization_id = \$1 AND clinic_id = \$2\s*\n\s*AND extraction_run_id = ANY\(\$3::uuid\[\]\)\s*`/,
    );
  });

  it('writer audit: every production candidate SUPERSEDE path uses shared lifecycle lock', () => {
    const productionTrees = ['packages/database/src', 'apps/api/src', 'apps/worker/src'];
    const supersedeHits: string[] = [];
    for (const tree of productionTrees) {
      const absTree = path.join(root, tree);
      if (!fs.existsSync(absTree)) continue;
      const files = fs.readdirSync(absTree, { recursive: true, encoding: 'utf8' }) as string[];
      for (const file of files) {
        if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
        const abs = path.join(absTree, file);
        const rel = path.relative(root, abs).split(path.sep).join('/');
        const src = fs.readFileSync(abs, 'utf8');
        if (
          /UPDATE clinical_evidence_extraction_candidates\s+SET status = 'SUPERSEDED'/i.test(src)
        ) {
          supersedeHits.push(rel);
        }
      }
    }
    expect(supersedeHits).toEqual(['packages/database/src/repositories/extraction.ts']);
    const extraction = fs.readFileSync(path.join(root, supersedeHits[0]!), 'utf8');
    expect(extraction).toMatch(/lockF3cReviewedCueSource/);
  });

  it('keeps readiness inactive after candidate-lifecycle work', () => {
    const ready = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).toMatch(/cueParserConnected:\s*CUE_PARSER_CONNECTED/);
    expect(ready).toMatch(/cueParserProductionEnabled:\s*CUE_PARSER_PRODUCTION_ENABLED/);
  });
});
