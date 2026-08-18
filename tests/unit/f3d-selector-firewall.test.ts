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
] as const;

const TYPES_REL = 'packages/evidence-extract/src/factCandidateTypes.ts';
const REPO_REL = 'packages/database/src/repositories/factCandidate.ts';
const SERVICE_REL = 'packages/database/src/services/factCandidateService.ts';

const COUPLING =
  /@ehas2\/rule[1-9]|@ehas2\/medicine-registry|@ehas2\/engine-adapter|evaluateRule[1-9]|tesseract\.js|pdf-parse|LibreTranslate|addStructuredFindings|CORRECTED_BY_DOCTOR|clinically_used\s*=\s*true|clinically_used\s*:\s*true/;

const ANALYZE_COMPLETE_COUPLING =
  /import\s+.*analyzeComplete|import\s*\([^)]*analyzeComplete|require\s*\([^)]*analyzeComplete|from\s+.*analyzeComplete|analyzeComplete\s*\(/i;

const FINDINGS_WRITE = /structured_report_findings|addStructuredFindings/;

function hitsF3dFirewall(source: string): boolean {
  return (
    COUPLING.test(source) || ANALYZE_COMPLETE_COUPLING.test(source) || FINDINGS_WRITE.test(source)
  );
}

function restoreIfChanged(rel: string, original: string): void {
  const target = path.join(root, rel);
  if (fs.readFileSync(target, 'utf8') !== original) {
    fs.writeFileSync(target, original, 'utf8');
  }
}

describe('F3D-1 selector firewall', () => {
  it('does not import Rules 1–9, AnalyzeComplete, translation, Rx, or findings writes', () => {
    const blob = F3D_PATHS.map(read).join('\n');
    expect(blob).not.toMatch(/from ['"]@ehas2\/rule[1-9]/);
    expect(blob).not.toMatch(/evaluateRule[1-9]/);
    expect(blob).not.toMatch(ANALYZE_COMPLETE_COUPLING);
    expect(blob).not.toMatch(/LibreTranslate|tesseract\.js|pdf-parse/);
    expect(blob).not.toMatch(/clinically_used\s*=\s*true/);
    expect(blob).not.toMatch(/clinically_used\s*:\s*true/);
    expect(blob).not.toMatch(/addStructuredFindings/);
    expect(blob).not.toMatch(/CORRECTED_BY_DOCTOR/);
    expect(read(REPO_REL)).not.toMatch(/structured_report_findings/);
    expect(read(SERVICE_REL)).not.toMatch(/structured_report_findings/);
    expect(read(REPO_REL)).not.toMatch(/FACT_NORMALIZED_SOURCE_LINKED/);
    expect(read(SERVICE_REL)).not.toMatch(/FACT_NORMALIZED_SOURCE_LINKED/);
  });

  it('keeps analyzeComplete on the deny-list without treating that literal as coupling', () => {
    expect(FACT_SELECTOR_FORBIDDEN_FIELD_NAMES).toContain('analyzeComplete');
    const types = read(TYPES_REL);
    expect(types).toMatch(/export const FACT_SELECTOR_FORBIDDEN_FIELD_NAMES/);
    expect(types).toMatch(/'analyzeComplete'/);
    expect(types).not.toMatch(ANALYZE_COMPLETE_COUPLING);
    expect(types).not.toMatch(/from ['"]@ehas2\/rule[1-9]/);
    expect(types).not.toMatch(/evaluateRule[1-9]/);
    expect(types).toMatch(/^import type \{ SourceLocator \} from '\.\/types\.js';$/m);
    expect(types).not.toMatch(/^\s*import\s+(?!type\b)/m);
    expect(types).not.toMatch(/require\s*\(/);
    expect(types).not.toMatch(/import\s*\(/);
    expect(hitsF3dFirewall(types)).toBe(false);
  });

  it('fact DTO avoids selector-forbidden field names as writable selectors', () => {
    const types = read(TYPES_REL);
    const start = types.indexOf('export type FactCandidateDto');
    const slice = types.slice(start);
    for (const field of FACT_SELECTOR_FORBIDDEN_FIELD_NAMES) {
      expect(slice).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('negative probes detect forbidden coupling then restore source files', () => {
    const repoPath = path.join(root, REPO_REL);
    const typesPath = path.join(root, TYPES_REL);
    const originalRepo = fs.readFileSync(repoPath, 'utf8');
    const originalTypes = fs.readFileSync(typesPath, 'utf8');
    const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d-fw-'));

    const probes: { name: string; snippet: string }[] = [
      {
        name: 'static AnalyzeComplete import',
        snippet: `\nimport { analyzeComplete } from '@ehas2/clinical-engine';\nvoid analyzeComplete;\n`,
      },
      {
        name: 'dynamic import of AnalyzeComplete',
        snippet: `\nconst loaded = await import('./analyzeComplete.js');\nvoid loaded;\n`,
      },
      {
        name: 'require of AnalyzeComplete',
        snippet: `\nconst loaded = require('./analyzeComplete');\nvoid loaded;\n`,
      },
      {
        name: 'direct analyzeComplete invocation',
        snippet: `\nanalyzeComplete({ caseId: 'synthetic' });\n`,
      },
      {
        name: 'Rule 1 import',
        snippet: `\nimport { evaluateRule1 } from '@ehas2/rule1';\nvoid evaluateRule1;\n`,
      },
      {
        name: 'structured_report_findings write',
        snippet: `\nawait tx.query('INSERT INTO structured_report_findings (id) VALUES ($1)', [id]);\n`,
      },
      {
        name: 'clinically_used true write',
        snippet: `\nconst patch = { clinically_used: true };\nvoid patch;\n`,
      },
    ];

    try {
      expect(hitsF3dFirewall(originalTypes)).toBe(false);
      expect(hitsF3dFirewall(originalRepo)).toBe(false);

      for (const probe of probes) {
        const injected = `${originalRepo}${probe.snippet}`;
        expect(hitsF3dFirewall(injected), probe.name).toBe(true);
        const probeFile = path.join(probeDir, `${probe.name.replace(/\s+/g, '-')}.ts`);
        fs.writeFileSync(probeFile, injected);
        expect(hitsF3dFirewall(fs.readFileSync(probeFile, 'utf8')), probe.name).toBe(true);
        expect(fs.readFileSync(repoPath, 'utf8')).toBe(originalRepo);
        expect(fs.readFileSync(typesPath, 'utf8')).toBe(originalTypes);
      }

      expect(hitsF3dFirewall(`  'analyzeComplete',\n`)).toBe(false);
      expect(hitsF3dFirewall(originalTypes)).toBe(false);
    } finally {
      restoreIfChanged(REPO_REL, originalRepo);
      restoreIfChanged(TYPES_REL, originalTypes);
      fs.rmSync(probeDir, { recursive: true, force: true });
      expect(fs.readFileSync(repoPath, 'utf8')).toBe(originalRepo);
      expect(fs.readFileSync(typesPath, 'utf8')).toBe(originalTypes);
    }
  });
});

afterEach(() => {
  const repo = path.join(root, REPO_REL);
  const types = path.join(root, TYPES_REL);
  expect(fs.readFileSync(repo, 'utf8')).not.toMatch(/@ehas2\/rule1/);
  expect(fs.readFileSync(repo, 'utf8')).not.toMatch(ANALYZE_COMPLETE_COUPLING);
  expect(fs.readFileSync(types, 'utf8')).toMatch(/'analyzeComplete'/);
});
