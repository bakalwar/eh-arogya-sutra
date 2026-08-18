import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES } from '../../packages/evidence-extract/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const adaptersSrc = path.join(root, 'packages/evidence-extract-adapters/src');

function readAllTs(dir: string): string {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return [readAllTs(full)];
      if (entry.name.endsWith('.ts')) return [fs.readFileSync(full, 'utf8')];
      return [];
    })
    .join('\n');
}

describe('F3B adapters selector firewall', () => {
  it('does not import clinical rule engines', () => {
    const blob = readAllTs(adaptersSrc);
    expect(blob).not.toMatch(/@ehas2\/rule[1-9]/);
    expect(blob).not.toMatch(/evaluateRule[1-9]/);
  });

  it('does not use forbidden npm OCR/PDF shortcuts in adapters package', () => {
    const blob = readAllTs(adaptersSrc);
    expect(blob).not.toMatch(/\btesseract\.js\b/);
    expect(blob).not.toMatch(/\bpdf-parse\b/);
  });

  it('segment output avoids selector-forbidden candidate fields', () => {
    const segment = fs.readFileSync(path.join(adaptersSrc, 'segment/textToCandidates.ts'), 'utf8');
    for (const field of CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES) {
      expect(segment).not.toMatch(new RegExp(`\\b${field}\\b\\s*:`));
    }
  });
});
