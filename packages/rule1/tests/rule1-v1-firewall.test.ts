import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RULE1_FORBIDDEN_OUTPUT_TOKENS, RULE1_PRODUCTION_MAPPING_REGISTRY } from '../src/index.js';

const ROOT = process.cwd();
const PKG = join(ROOT, 'packages/rule1');

function collectTs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...collectTs(p));
    } else if (
      name.name.endsWith('.ts') ||
      name.name.endsWith('.tsx') ||
      name.name.endsWith('.mjs')
    ) {
      out.push(p);
    }
  }
  return out;
}

describe('Rule1 v1 firewall', () => {
  it('production mapping registry remains empty', () => {
    expect(RULE1_PRODUCTION_MAPPING_REGISTRY.activeRealMappingCount).toBe(0);
    expect(RULE1_PRODUCTION_MAPPING_REGISTRY.entries).toHaveLength(0);
  });

  it('source does not emit forbidden v1 tokens as live outcomes', () => {
    const sources = collectTs(join(PKG, 'src'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    // Forbidden tokens may appear only as forbid-lists / comments / alias docs.
    expect(RULE1_FORBIDDEN_OUTPUT_TOKENS).toContain('UNRESOLVED_TIE');
    expect(sources).toContain('RULE1_FORBIDDEN_OUTPUT_TOKENS');
    expect(sources).not.toMatch(/status:\s*'UNRESOLVED_TIE'/);
    expect(sources).not.toMatch(/secondaryTemperament\s*:/);
    expect(sources).not.toMatch(/primaryTemperament:\s*'BILIOUS_HEPATIC'/);
  });

  it('source has no raw-text / medicine / persistence hooks', () => {
    const sources = collectTs(join(PKG, 'src'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(sources).not.toMatch(/\bDate\.now\s*\(/);
    expect(sources).not.toMatch(/\bMath\.random\s*\(/);
    expect(sources).not.toMatch(/\bfetch\s*\(/);
    expect(sources).not.toMatch(/INSERT\s+INTO/i);
    expect(sources).not.toMatch(/clinicallyUsed:\s*true/);
    expect(sources).not.toMatch(/ConfirmPrescription|AnalyzeComplete/);
  });

  it('no apps or worker caller imports evaluateRule1Shadow', () => {
    const callerRoots = ['apps', 'packages/api', 'packages/worker', 'packages/clinical-engine'].map(
      (r) => join(ROOT, r),
    );
    const files = callerRoots.flatMap((d) => collectTs(d));
    const hits = files.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return text.includes('evaluateRule1Shadow') || /from\s+['"]@ehas2\/rule1['"]/.test(text);
    });
    expect(hits).toEqual([]);
  });

  it('migration tip remains 018 with no 019', () => {
    const mig = join(ROOT, 'packages/database/migrations');
    const names = existsSync(mig) ? readdirSync(mig) : [];
    expect(names.some((n) => n.startsWith('018_'))).toBe(true);
    expect(names.some((n) => n.startsWith('019_'))).toBe(false);
  });
});
