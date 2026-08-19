import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TERMINOLOGY_PACK_SELECTOR_FORBIDDEN_KEYS,
  TERMINOLOGY_SELECTOR_FORBIDDEN_FIELD_NAMES,
} from '../../packages/evidence-extract/src/index.ts';
import {
  hitsF3d2TerminologyFirewall,
  scanF3d2TerminologyTree,
  stripJsComments,
} from '../../scripts/f3d2-terminology-firewall.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TERM_DIR = 'packages/evidence-extract/src/terminology';

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('F3D-2 terminology-pack selector firewall', () => {
  it('does not import Rules, engine, OCR, NLP, Rx, or findings writes', () => {
    expect(scanF3d2TerminologyTree(root)).toEqual([]);
    const blob = fs
      .readdirSync(path.join(root, TERM_DIR), { recursive: true, encoding: 'utf8' })
      .filter((name) => String(name).endsWith('.ts'))
      .map((name) => read(`${TERM_DIR}/${String(name).replaceAll('\\', '/')}`))
      .join('\n');
    expect(hitsF3d2TerminologyFirewall(blob)).toBe(false);
  });

  it('keeps analyzeComplete on the pack deny-list without treating the literal as coupling', () => {
    expect(TERMINOLOGY_PACK_SELECTOR_FORBIDDEN_KEYS).toContain('analyzeComplete');
    expect(TERMINOLOGY_SELECTOR_FORBIDDEN_FIELD_NAMES).toContain('analyzeComplete');
    const types = read(`${TERM_DIR}/types.ts`);
    expect(types).toMatch(/'analyzeComplete'/);
    expect(types).toMatch(/TERMINOLOGY_LOOKUP_NOT_CONNECTED/);
    expect(hitsF3d2TerminologyFirewall(types)).toBe(false);
  });

  it('does not treat comments or deny-list documentation as coupling', () => {
    const documented = `
      // must not import('openai') or require('node-nlp')
      /* from 'compromise'
         require('wink-nlp')
      */
      export const TERMINOLOGY_LOOKUP_NOT_CONNECTED = 'TERMINOLOGY_LOOKUP_NOT_CONNECTED';
      export const keys = ['analyzeComplete', 'diseaseId'];
    `;
    expect(hitsF3d2TerminologyFirewall(documented)).toBe(false);
    expect(stripJsComments(documented)).not.toMatch(/import\('openai'\)/);
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
        name: 'dynamic openai whitespace',
        snippet: `\nvoid import(\n  'openai'\n);\n`,
      },
      {
        name: 'spaced require nlp',
        snippet: `\nvoid require( 'node-nlp' );\n`,
      },
      {
        name: 'multiline require openai',
        snippet: `\nvoid require(\n  'openai'\n);\n`,
      },
      {
        name: 'multiline static import openai',
        snippet: `\nimport OpenAI\n  from\n  'openai';\nvoid OpenAI;\n`,
      },
      {
        name: 'multiline from transformers',
        snippet: `\nimport {\n  pipeline\n} from\n  '@xenova/transformers';\nvoid pipeline;\n`,
      },
      {
        name: 'openai subpath',
        snippet: `\nimport { OpenAI } from 'openai/resources';\nvoid OpenAI;\n`,
      },
      {
        name: 'Confirm Rx',
        snippet: `\nvoid ConfirmPrescription;\n`,
      },
    ];
    try {
      expect(hitsF3d2TerminologyFirewall(original)).toBe(false);
      for (const probe of probes) {
        const injected = `${original}${probe.snippet}`;
        expect(hitsF3d2TerminologyFirewall(injected), probe.name).toBe(true);
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
