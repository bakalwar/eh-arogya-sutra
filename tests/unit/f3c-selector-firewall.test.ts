import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES } from '../../packages/evidence-extract/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const F3C_PATHS = [
  'packages/database/src/repositories/candidateReview.ts',
  'packages/database/src/services/evidenceService.ts',
  'packages/evidence-extract/src/reviewPresentation.ts',
  'packages/evidence-extract/src/flags.ts',
  'apps/api/src/routes/evidence.ts',
  'apps/web/src/app/preview/candidate-review/page.tsx',
  'apps/web/src/components/preview/CandidateSourceLocatorView.tsx',
  'apps/web/src/components/preview/CandidateReviewLocalBoard.tsx',
  'apps/web/src/lib/preview/candidateReviewFixtures.ts',
];

describe('F3C selector firewall', () => {
  it('does not import Rules 1–9, AnalyzeComplete, translation, or Rx', () => {
    const blob = F3C_PATHS.map(read).join('\n');
    expect(blob).not.toMatch(/from ['"]@ehas2\/rule[1-9]/);
    expect(blob).not.toMatch(/evaluateRule[1-9]/);
    expect(blob).not.toMatch(/import\s+.*analyzeComplete/i);
    expect(blob).not.toMatch(/LibreTranslate|tesseract\.js|pdf-parse/);
    expect(blob).not.toMatch(/clinically_used\s*=\s*true/);
    expect(blob).not.toMatch(/UPDATE clinical_evidence_extraction_candidates/i);
  });

  it('review DTO avoids selector-forbidden field names as writable selectors', () => {
    const types = read('packages/evidence-extract/src/types.ts');
    const start = types.indexOf('export type CandidateReviewEventDto');
    const slice = types.slice(start, types.indexOf('export type SourceLinkedCandidateView', start));
    for (const field of CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES) {
      expect(slice).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('negative probe detects forbidden coupling then restores the source file', () => {
    const target = path.join(root, 'packages/database/src/repositories/candidateReview.ts');
    const original = fs.readFileSync(target, 'utf8');
    const probePath = path.join(os.tmpdir(), `ehas2-f3c-selector-probe-${process.pid}.ts`);
    try {
      const injected = `${original}\nimport { evaluateRule1 } from '@ehas2/rule1';\nvoid evaluateRule1;\n`;
      fs.writeFileSync(probePath, injected);
      expect(fs.readFileSync(probePath, 'utf8')).toMatch(/@ehas2\/rule1/);
      expect(original).not.toMatch(/@ehas2\/rule1/);
      expect(original).not.toMatch(/analyzeComplete/);
    } finally {
      fs.rmSync(probePath, { force: true });
      expect(fs.readFileSync(target, 'utf8')).toBe(original);
    }
  });
});

afterEach(() => {
  const target = path.join(root, 'packages/database/src/repositories/candidateReview.ts');
  expect(fs.readFileSync(target, 'utf8')).not.toMatch(/@ehas2\/rule1/);
});
