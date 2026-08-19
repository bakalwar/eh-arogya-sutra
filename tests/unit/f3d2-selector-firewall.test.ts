import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TERMINOLOGY_PACK_SELECTOR_FORBIDDEN_KEYS,
  TERMINOLOGY_SELECTOR_FORBIDDEN_FIELD_NAMES,
} from '../../packages/evidence-extract/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TERM_DIR = 'packages/evidence-extract/src/terminology';

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function listTs(relDir: string): string[] {
  const abs = path.join(root, relDir);
  const out: string[] = [];
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${relDir}/${ent.name}`;
    if (ent.isDirectory()) out.push(...listTs(rel));
    else if (ent.name.endsWith('.ts')) out.push(rel);
  }
  return out;
}

const COUPLING =
  /@ehas2\/rule[1-9]|@ehas2\/medicine-registry|@ehas2\/engine-adapter|@ehas2\/clinical-engine|@ehas2\/clinical-data-manifest|evaluateRule[1-9]|LibreTranslate|addStructuredFindings|CORRECTED_BY_DOCTOR|clinically_used\s*=\s*true|clinically_used\s*:\s*true|structured_report_findings/;

const ANALYZE_COMPLETE_COUPLING =
  /import\s+.*analyzeComplete|import\s*\([^)]*analyzeComplete|require\s*\([^)]*analyzeComplete|from\s+.*analyzeComplete|analyzeComplete\s*\(/i;

const OCR_COUPLING =
  /from ['"]tesseract(?:\.js)?['"]|require\s*\(\s*['"]tesseract|tesseract\.js|pdf-parse|@napi-rs\/canvas/;

const NLP_COUPLING =
  /from ['"](?:compromise(?:\/[\w.-]+)?|natural|wink-nlp|openai|@xenova\/transformers|node-nlp)['"]|require\s*\(\s*['"](?:compromise|natural|wink-nlp|openai|@xenova\/transformers|node-nlp)|import\s*\(\s*['"](?:openai|node-nlp|wink-nlp|compromise|natural|@xenova\/transformers)/;

const RX_SUMMARY_COUPLING =
  /from ['"].*\/(?:summary|prescription)['"]|ConfirmPrescription|prescriptionDraft/;

function hitsFirewall(source: string): boolean {
  return (
    COUPLING.test(source) ||
    ANALYZE_COMPLETE_COUPLING.test(source) ||
    OCR_COUPLING.test(source) ||
    NLP_COUPLING.test(source) ||
    RX_SUMMARY_COUPLING.test(source)
  );
}

describe('F3D-2 terminology-pack selector firewall', () => {
  it('does not import Rules, engine, OCR, NLP, Rx, or findings writes', () => {
    const blob = listTs(TERM_DIR).map(read).join('\n');
    expect(blob).not.toMatch(/from ['"]@ehas2\/rule[1-9]/);
    expect(blob).not.toMatch(/from ['"]@ehas2\/clinical-engine/);
    expect(blob).not.toMatch(/from ['"]@ehas2\/medicine-registry/);
    expect(blob).not.toMatch(/from ['"]@ehas2\/clinical-data-manifest/);
    expect(blob).not.toMatch(ANALYZE_COMPLETE_COUPLING);
    expect(blob).not.toMatch(OCR_COUPLING);
    expect(blob).not.toMatch(NLP_COUPLING);
    expect(blob).not.toMatch(/LibreTranslate/);
    expect(blob).not.toMatch(/structured_report_findings/);
    expect(blob).not.toMatch(/fetch\s*\(/);
    expect(blob).not.toMatch(RX_SUMMARY_COUPLING);
    expect(hitsFirewall(blob)).toBe(false);
  });

  it('keeps analyzeComplete on the pack deny-list without treating the literal as coupling', () => {
    expect(TERMINOLOGY_PACK_SELECTOR_FORBIDDEN_KEYS).toContain('analyzeComplete');
    expect(TERMINOLOGY_SELECTOR_FORBIDDEN_FIELD_NAMES).toContain('analyzeComplete');
    const types = read(`${TERM_DIR}/types.ts`);
    expect(types).toMatch(/'analyzeComplete'/);
    expect(types).not.toMatch(ANALYZE_COMPLETE_COUPLING);
    expect(hitsFirewall(types)).toBe(false);
  });

  it('negative probes detect forbidden coupling then restore source files', () => {
    const targetRel = `${TERM_DIR}/loader.ts`;
    const target = path.join(root, targetRel);
    const original = fs.readFileSync(target, 'utf8');
    const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2-fw-'));
    const probes = [
      {
        name: 'bare clinical-engine import',
        snippet: `\nimport engine from '@ehas2/clinical-engine';\nvoid engine;\n`,
      },
      { name: 'analyzeComplete call', snippet: `\nanalyzeComplete({ caseId: 'synthetic' });\n` },
      {
        name: 'native tesseract import',
        snippet: `\nimport tesseract from 'tesseract';\nvoid tesseract;\n`,
      },
      {
        name: 'Rule 1 import',
        snippet: `\nimport { evaluateRule1 } from '@ehas2/rule1';\nvoid evaluateRule1;\n`,
      },
      {
        name: 'medicine registry',
        snippet: `\nimport { getMedicineById } from '@ehas2/medicine-registry';\nvoid getMedicineById;\n`,
      },
      {
        name: 'disease package',
        snippet: `\nimport { DISEASE_PACKAGE_DIR } from '@ehas2/clinical-data-manifest';\nvoid DISEASE_PACKAGE_DIR;\n`,
      },
      { name: 'findings write', snippet: `\nvoid 'structured_report_findings';\n` },
      {
        name: 'clinically_used true',
        snippet: `\nconst patch = { clinically_used: true };\nvoid patch;\n`,
      },
      { name: 'LibreTranslate', snippet: `\nvoid 'LibreTranslate';\n` },
      {
        name: 'summary import',
        snippet: `\nimport summary from '../../apps/web/src/app/cases/summary';\nvoid summary;\n`,
      },
      {
        name: 'node-nlp import',
        snippet: `\nimport nlp from 'node-nlp';\nvoid nlp;\n`,
      },
      {
        name: 'wink-nlp import',
        snippet: `\nimport wink from 'wink-nlp';\nvoid wink;\n`,
      },
      {
        name: 'openai import',
        snippet: `\nimport OpenAI from 'openai';\nvoid OpenAI;\n`,
      },
      {
        name: 'transformers import',
        snippet: `\nimport { pipeline } from '@xenova/transformers';\nvoid pipeline;\n`,
      },
      {
        name: 'dynamic openai import',
        snippet: `\nvoid import('openai');\n`,
      },
      {
        name: 'spaced require nlp',
        snippet: `\nvoid require( 'node-nlp' );\n`,
      },
    ];
    try {
      expect(hitsFirewall(original)).toBe(false);
      for (const probe of probes) {
        const injected = `${original}${probe.snippet}`;
        expect(hitsFirewall(injected), probe.name).toBe(true);
        fs.writeFileSync(path.join(probeDir, `${probe.name.replace(/\s+/g, '-')}.ts`), injected);
        expect(fs.readFileSync(target, 'utf8')).toBe(original);
      }
    } finally {
      if (fs.readFileSync(target, 'utf8') !== original) {
        fs.writeFileSync(target, original, 'utf8');
      }
      fs.rmSync(probeDir, { recursive: true, force: true });
      expect(fs.readFileSync(target, 'utf8')).toBe(original);
    }
  });
});

afterEach(() => {
  const loader = path.join(root, `${TERM_DIR}/loader.ts`);
  expect(fs.readFileSync(loader, 'utf8')).not.toMatch(/@ehas2\/clinical-engine/);
});
