import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FACT_SELECTOR_FORBIDDEN_FIELD_NAMES } from '../../packages/evidence-extract/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const F3D_PATHS = [
  'packages/database/src/repositories/factCandidate.ts',
  'packages/database/src/services/factCandidateService.ts',
  'packages/evidence-extract/src/factCandidateTypes.ts',
  'packages/evidence-extract/src/flags.ts',
  'apps/api/src/routes/factCandidates.ts',
];

describe('F3D-1 selector firewall', () => {
  it('does not import Rules 1–9, AnalyzeComplete, translation, Rx, or findings writes', () => {
    const blob = F3D_PATHS.map(read).join('\n');
    expect(blob).not.toMatch(/from ['"]@ehas2\/rule[1-9]/);
    expect(blob).not.toMatch(/evaluateRule[1-9]/);
    expect(blob).not.toMatch(/import\s+.*analyzeComplete/i);
    expect(blob).not.toMatch(/LibreTranslate|tesseract\.js|pdf-parse/);
    expect(blob).not.toMatch(/clinically_used\s*=\s*true/);
    expect(blob).not.toMatch(/addStructuredFindings/);
    expect(blob).not.toMatch(/CORRECTED_BY_DOCTOR/);
    expect(blob).not.toMatch(/structured_report_findings/);
    expect(read('packages/database/src/repositories/factCandidate.ts')).not.toMatch(
      /FACT_NORMALIZED_SOURCE_LINKED/,
    );
    expect(read('packages/database/src/services/factCandidateService.ts')).not.toMatch(
      /FACT_NORMALIZED_SOURCE_LINKED/,
    );
  });

  it('fact DTO avoids selector-forbidden field names as writable selectors', () => {
    const types = read('packages/evidence-extract/src/factCandidateTypes.ts');
    const start = types.indexOf('export type FactCandidateDto');
    const slice = types.slice(start);
    for (const field of FACT_SELECTOR_FORBIDDEN_FIELD_NAMES) {
      expect(slice).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('negative probe detects forbidden coupling then restores the source file', () => {
    const target = path.join(root, 'packages/database/src/repositories/factCandidate.ts');
    const original = fs.readFileSync(target, 'utf8');
    const probePath = path.join(os.tmpdir(), `ehas2-f3d-selector-probe-${process.pid}.ts`);
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
  const target = path.join(root, 'packages/database/src/repositories/factCandidate.ts');
  expect(fs.readFileSync(target, 'utf8')).not.toMatch(/@ehas2\/rule1/);
});
