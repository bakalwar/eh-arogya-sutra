import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyModuleSpecifier,
  inspectSource,
  scanDirectory,
  scanParserRuntimeTrees,
} from '../../scripts/ehas2-parser-runtime-import-firewall.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const RUNTIME_TREES = [
  'apps/api',
  'apps/worker',
  'apps/web',
  'packages/database',
  'packages/evidence-extract-adapters',
];

function findingsAreBounded(findings: { path: string; rule: string }[]): void {
  const blob = JSON.stringify(findings);
  expect(blob).not.toMatch(/input,\s*pack/);
  expect(blob).not.toMatch(/b3abc204|checksum|owner-approval|Bearer |password/i);
  expect(blob).not.toMatch(/stack|EHAS2_TEST_PG_PASSWORD/);
  for (const f of findings) {
    expect(Object.keys(f).sort()).toEqual(['path', 'rule']);
    expect(f.rule).toMatch(/^H2_[A-Z0-9_]+$/);
    expect(f.path).not.toMatch(/\n/);
  }
}

function rulesOf(source: string, virtualPath = 'probe.ts'): string[] {
  const findings = inspectSource(source, virtualPath);
  findingsAreBounded(findings);
  return findings.map((f: { rule: string }) => f.rule);
}

function walkSourceFiles(absDir: string, out: string[] = []): string[] {
  if (!fs.existsSync(absDir)) return out;
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (
      ent.name === 'node_modules' ||
      ent.name === 'dist' ||
      ent.name === '.extract-tools' ||
      ent.name === '.next'
    ) {
      continue;
    }
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) walkSourceFiles(abs, out);
    else if (/\.[cm]?[jt]sx?$/.test(ent.name) && !ent.name.endsWith('.d.ts')) out.push(abs);
  }
  return out;
}

describe('F3D-2B H2 runtime parser import boundary', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    expect(scanParserRuntimeTrees(root)).toEqual([]);
  });

  it('keeps package exports on the public root only', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, 'packages/evidence-extract/package.json'), 'utf8'),
    );
    expect(Object.keys(pkg.exports)).toEqual(['.']);
    expect(JSON.stringify(pkg.exports)).not.toMatch(/parser|internalForTests|match|execute/);
    const index = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/index.ts'),
      'utf8',
    );
    expect(index).not.toMatch(/internalForTests|parseOwnerFrozenCuesInternalForTests/);
    const publicParser = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/terminology/parser/index.ts'),
      'utf8',
    );
    expect(publicParser).not.toMatch(/export \{[\s\S]*internalForTests/);
    expect(publicParser).toMatch(/export function parseOwnerFrozenCues\(/);
  });

  it('finds no forbidden deep import or parser caller in runtime trees', () => {
    expect(scanParserRuntimeTrees(root)).toEqual([]);
    const hits: string[] = [];
    for (const tree of RUNTIME_TREES) {
      for (const abs of walkSourceFiles(path.join(root, tree))) {
        const rel = path.relative(root, abs).split(path.sep).join('/');
        if (/\.(?:test|spec)\./.test(rel) || /(?:^|\/)tests\//.test(rel)) continue;
        const src = fs.readFileSync(abs, 'utf8');
        const allowlistedAdapter =
          rel === 'packages/database/src/services/cueEligibleSourceService.ts' ||
          rel === 'packages/database/src/services/f3cReviewedCueSourceService.ts';
        if (allowlistedAdapter) {
          expect(src).toMatch(/loadPinnedProductionPack/);
          expect(src).toMatch(/parseOwnerFrozenCues/);
          expect(src).toMatch(/from '@ehas2\/evidence-extract'/);
          expect(src).not.toMatch(/terminology\/parser|internalForTests|scanFrozenAliases/);
          continue;
        }
        if (
          /terminology\/parser|internalForTests|executeOwnerFrozenCueParse|scanFrozenAliases|parseOwnerFrozenCues/.test(
            src,
          )
        ) {
          hits.push(rel);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('allows public-root readiness and foundation imports', () => {
    const allowed = `
      import {
        CUE_PARSER_FOUNDATION,
        CUE_PARSER_CONNECTED,
        CUE_PARSER_PRODUCTION_ENABLED,
        F3D2_TERMINOLOGY_PACK_FOUNDATION,
        getTerminologyReadinessPosture,
      } from '@ehas2/evidence-extract';
      void CUE_PARSER_FOUNDATION;
      void CUE_PARSER_CONNECTED;
      void CUE_PARSER_PRODUCTION_ENABLED;
      void F3D2_TERMINOLOGY_PACK_FOUNDATION;
      void getTerminologyReadinessPosture;
    `;
    expect(inspectSource(allowed, 'apps/api/src/createApp.ts')).toEqual([]);
    const createApp = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(inspectSource(createApp, 'apps/api/src/createApp.ts')).toEqual([]);
  });

  it('negative probes detect forbidden runtime imports then leave the worktree clean', () => {
    const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2b-h2-'));
    tmpDirs.push(probeDir);
    const probes: { name: string; snippet: string; rule: string }[] = [
      {
        name: 'relative parser match',
        snippet: `import { scanFrozenAliases } from '../../packages/evidence-extract/src/terminology/parser/match.ts';\nvoid scanFrozenAliases;\n`,
        rule: 'H2_RELATIVE_PARSER_MATCH',
      },
      {
        name: 'relative parser execute',
        snippet: `import { executeOwnerFrozenCueParse } from '../../packages/evidence-extract/src/terminology/parser/execute.ts';\nvoid executeOwnerFrozenCueParse;\n`,
        rule: 'H2_RELATIVE_PARSER_EXECUTE',
      },
      {
        name: 'internalForTests',
        snippet: `import { parseOwnerFrozenCuesInternalForTests } from '../../packages/evidence-extract/src/terminology/parser/internalForTests.ts';\nvoid parseOwnerFrozenCuesInternalForTests;\n`,
        rule: 'H2_INTERNAL_FOR_TESTS',
      },
      {
        name: 'package parser subpath',
        snippet: `import { scanFrozenAliases } from '@ehas2/evidence-extract/src/terminology/parser/match.js';\nvoid scanFrozenAliases;\n`,
        rule: 'H2_PACKAGE_PARSER_SUBPATH',
      },
      {
        name: 'dist parser path',
        snippet: `import { parseOwnerFrozenCues } from '@ehas2/evidence-extract/dist/terminology/parser/index.js';\nvoid parseOwnerFrozenCues;\n`,
        rule: 'H2_DIST_PARSER_PATH',
      },
      {
        name: 'dynamic import',
        snippet: `void import('@ehas2/evidence-extract/src/terminology/parser/match.js');\n`,
        rule: 'H2_DYNAMIC_IMPORT',
      },
      {
        name: 'multiline dynamic import',
        snippet: `void import(\n  '@ehas2/evidence-extract/src/terminology/parser/execute.js'\n);\n`,
        rule: 'H2_DYNAMIC_IMPORT',
      },
      {
        name: 'require',
        snippet: `void require('@ehas2/evidence-extract/src/terminology/parser/match.js');\n`,
        rule: 'H2_REQUIRE',
      },
      {
        name: 'spaced multiline require',
        snippet: `void require(\n  '@ehas2/evidence-extract/dist/terminology/parser/match.js'\n);\n`,
        rule: 'H2_REQUIRE',
      },
      {
        name: 'windows-style path',
        snippet: `import x from '..\\\\packages\\\\evidence-extract\\\\src\\\\terminology\\\\parser\\\\match.ts';\nvoid x;\n`,
        rule: 'H2_WINDOWS_PARSER_PATH',
      },
      {
        name: 'scanFrozenAliases',
        snippet: `import { scanFrozenAliases } from '@ehas2/evidence-extract';\nscanFrozenAliases();\n`,
        rule: 'H2_SCAN_FROZEN_ALIASES',
      },
      {
        name: 'executeOwnerFrozenCueParse',
        snippet: `executeOwnerFrozenCueParse();\n`,
        rule: 'H2_EXECUTE_OWNER_FROZEN_CUE_PARSE',
      },
      {
        name: 'parseOwnerFrozenCuesInternalForTests',
        snippet: `parseOwnerFrozenCuesInternalForTests();\n`,
        rule: 'H2_PARSE_INTERNAL_FOR_TESTS',
      },
      {
        name: 'root import parseOwnerFrozenCues',
        snippet: `import { parseOwnerFrozenCues } from '@ehas2/evidence-extract';\nvoid parseOwnerFrozenCues;\n`,
        rule: 'H2_ROOT_PARSE_IMPORT',
      },
      {
        name: 'runtime call parseOwnerFrozenCues',
        snippet: `parseOwnerFrozenCues({} as never, {} as never);\n`,
        rule: 'H2_PARSE_OWNER_FROZEN_CUES_CALL',
      },
      {
        name: 'renamed parser import',
        snippet: `import { parseOwnerFrozenCues as runCues } from '@ehas2/evidence-extract';\nrunCues({} as never, {} as never);\n`,
        rule: 'H2_ALIASED_PARSER_IMPORT',
      },
      {
        name: 'namespace parser access',
        snippet: `import * as extract from '@ehas2/evidence-extract';\nextract.parseOwnerFrozenCues({} as never, {} as never);\n`,
        rule: 'H2_NAMESPACE_PARSER_ACCESS',
      },
    ];

    for (const probe of probes) {
      const found = rulesOf(probe.snippet);
      expect(found, probe.name).toContain(probe.rule);
      fs.writeFileSync(path.join(probeDir, `${probe.name.replace(/\s+/g, '-')}.ts`), probe.snippet);
    }

    const dirFindings = scanDirectory(probeDir, probeDir);
    const dirRules = new Set(dirFindings.map((f: { rule: string }) => f.rule));
    for (const probe of probes) {
      expect(dirRules.has(probe.rule), probe.name).toBe(true);
    }
    expect(scanParserRuntimeTrees(root)).toEqual([]);
  });

  it('detects root require, dynamic import, re-export, and alias parser access', () => {
    const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2b-h2-root-'));
    tmpDirs.push(probeDir);
    const probes: { name: string; snippet: string; rule: string }[] = [
      {
        name: 'root require namespace dot call',
        snippet: `const extract = require('@ehas2/evidence-extract');\nextract.parseOwnerFrozenCues(input, pack);\n`,
        rule: 'H2_NAMESPACE_PARSER_ACCESS',
      },
      {
        name: 'root require namespace bracket call',
        snippet: `const extract = require('@ehas2/evidence-extract');\nextract['parseOwnerFrozenCues'](input, pack);\n`,
        rule: 'H2_NAMESPACE_PARSER_ACCESS',
      },
      {
        name: 'root require direct destructuring',
        snippet: `const { parseOwnerFrozenCues } =\n  require('@ehas2/evidence-extract');\nparseOwnerFrozenCues(input, pack);\n`,
        rule: 'H2_ROOT_PARSE_IMPORT',
      },
      {
        name: 'root require renamed destructuring',
        snippet: `const { parseOwnerFrozenCues: run } =\n  require('@ehas2/evidence-extract');\nrun(input, pack);\n`,
        rule: 'H2_ALIASED_PARSER_IMPORT',
      },
      {
        name: 'direct alias from namespace property then call',
        snippet: `const extract = require('@ehas2/evidence-extract');\nconst run = extract.parseOwnerFrozenCues;\nrun(input, pack);\n`,
        rule: 'H2_PARSE_OWNER_FROZEN_CUES_CALL',
      },
      {
        name: 'root dynamic-import namespace dot call',
        snippet: `const extract =\n  await import('@ehas2/evidence-extract');\nextract.parseOwnerFrozenCues(input, pack);\n`,
        rule: 'H2_NAMESPACE_PARSER_ACCESS',
      },
      {
        name: 'root dynamic-import namespace bracket call',
        snippet: `const extract =\n  await import('@ehas2/evidence-extract');\nextract['parseOwnerFrozenCues'](input, pack);\n`,
        rule: 'H2_NAMESPACE_PARSER_ACCESS',
      },
      {
        name: 'root dynamic-import direct destructuring',
        snippet: `const { parseOwnerFrozenCues } =\n  await import('@ehas2/evidence-extract');\nparseOwnerFrozenCues(input, pack);\n`,
        rule: 'H2_ROOT_PARSE_IMPORT',
      },
      {
        name: 'root dynamic-import renamed destructuring',
        snippet: `const { parseOwnerFrozenCues: run } =\n  await import('@ehas2/evidence-extract');\nrun(input, pack);\n`,
        rule: 'H2_ALIASED_PARSER_IMPORT',
      },
      {
        name: 'named re-export',
        snippet: `export { parseOwnerFrozenCues }\n  from '@ehas2/evidence-extract';\n`,
        rule: 'H2_ROOT_PARSE_IMPORT',
      },
      {
        name: 'renamed re-export',
        snippet: `export {\n  parseOwnerFrozenCues as runtimeParser\n} from '@ehas2/evidence-extract';\n`,
        rule: 'H2_ALIASED_PARSER_IMPORT',
      },
      {
        name: 'forbidden internal symbol through root namespace',
        snippet: `const extract = require('@ehas2/evidence-extract');\nextract.scanFrozenAliases();\n`,
        rule: 'H2_SCAN_FROZEN_ALIASES',
      },
      {
        name: 'multiline spaced require namespace call',
        snippet: `const extract =\n  require(\n    '@ehas2/evidence-extract'\n  );\nextract.parseOwnerFrozenCues(\n  input,\n  pack\n);\n`,
        rule: 'H2_NAMESPACE_PARSER_ACCESS',
      },
    ];
    try {
      for (const probe of probes) {
        const found = rulesOf(probe.snippet);
        expect(found, probe.name).toContain(probe.rule);
        fs.writeFileSync(
          path.join(probeDir, `${probe.name.replace(/\s+/g, '-')}.ts`),
          probe.snippet,
        );
      }
      const dirFindings = scanDirectory(probeDir, probeDir);
      findingsAreBounded(dirFindings);
      const dirRules = new Set(dirFindings.map((f: { rule: string }) => f.rule));
      for (const probe of probes) {
        expect(dirRules.has(probe.rule), probe.name).toBe(true);
      }
    } finally {
      fs.rmSync(probeDir, { recursive: true, force: true });
    }
  });

  it('allows unrelated require/dynamic import and readiness root imports', () => {
    expect(
      inspectSource(`require('@ehas2/database');\nawait import('@ehas2/database');\n`),
    ).toEqual([]);
    expect(inspectSource(`const db = require('@ehas2/database');\nvoid db;\n`)).toEqual([]);
    expect(
      inspectSource(
        `const extract = require('@ehas2/evidence-extract');\nvoid extract.CUE_PARSER_FOUNDATION;\n`,
      ),
    ).toEqual([]);
  });

  it('does not treat comments or readiness strings as parser imports', () => {
    const documented = `
      // import { parseOwnerFrozenCues } from '@ehas2/evidence-extract'
      /* from '../../terminology/parser/match' require('./execute') */
      export const CUE_PARSER_FOUNDATION = true;
      const note = 'must not call parseOwnerFrozenCues in runtime';
      void note;
    `;
    expect(inspectSource(documented)).toEqual([]);
  });

  it('fail-closes on parse failure and symlink escape', () => {
    expect(rulesOf('const x = "', 'broken.ts')).toContain('H2_SCAN_PARSE_FAILED');
    const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2b-h2-link-'));
    tmpDirs.push(probeDir);
    const escapeTarget = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2b-h2-out-'));
    tmpDirs.push(escapeTarget);
    fs.writeFileSync(path.join(escapeTarget, 'outside.ts'), 'export const x = 1;\n');
    const linkPath = path.join(probeDir, 'escape-link');
    try {
      fs.symlinkSync(escapeTarget, linkPath, 'junction');
    } catch {
      fs.symlinkSync(escapeTarget, linkPath, 'dir');
    }
    const findings = scanDirectory(probeDir, probeDir);
    expect(findings.some((f: { rule: string }) => f.rule === 'H2_SYMLINK_ESCAPE')).toBe(true);
    expect(JSON.stringify(findings)).not.toMatch(/export const x/);
  });

  it('classifies dist and package subpaths without printing source text', () => {
    expect(
      classifyModuleSpecifier('@ehas2/evidence-extract/dist/terminology/parser/execute.js'),
    ).toEqual(expect.arrayContaining(['H2_DIST_PARSER_PATH', 'H2_PACKAGE_PARSER_SUBPATH']));
    expect(classifyModuleSpecifier('@ehas2/evidence-extract')).toEqual([]);
  });

  it('H2 exact-file allowlist permits only the C1 and C2 adapter public named imports', () => {
    const adapterRels = [
      'packages/database/src/services/cueEligibleSourceService.ts',
      'packages/database/src/services/f3cReviewedCueSourceService.ts',
    ];
    const allowed = `
      import { loadPinnedProductionPack, parseOwnerFrozenCues } from '@ehas2/evidence-extract';
      parseOwnerFrozenCues({} as never, loadPinnedProductionPack());
    `;
    for (const adapterRel of adapterRels) {
      expect(inspectSource(allowed, adapterRel)).toEqual([]);
    }
    expect(
      inspectSource(allowed, 'packages/database/src/services/factCandidateService.ts'),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'H2_ROOT_PARSE_IMPORT' }),
        expect.objectContaining({ rule: 'H2_PARSE_OWNER_FROZEN_CUES_CALL' }),
      ]),
    );
    expect(inspectSource(allowed, 'apps/api/src/createApp.ts')).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'H2_ROOT_PARSE_IMPORT' })]),
    );
    expect(inspectSource(allowed, 'apps/worker/src/index.ts')).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'H2_ROOT_PARSE_IMPORT' })]),
    );
    expect(
      inspectSource(allowed, 'packages/database/src/services/cueEligibleSourceService.copy.ts'),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'H2_ROOT_PARSE_IMPORT' })]));
    expect(
      inspectSource(allowed, 'packages/database/src/services/f3cReviewedCueSourceService.copy.ts'),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'H2_ROOT_PARSE_IMPORT' })]));

    const adapterRel = adapterRels[1]!;
    const deep = `import { parseOwnerFrozenCues } from '@ehas2/evidence-extract/src/terminology/parser/index.js';\nvoid parseOwnerFrozenCues;\n`;
    expect(inspectSource(deep, adapterRel).map((f: { rule: string }) => f.rule)).toEqual(
      expect.arrayContaining(['H2_PACKAGE_NON_ROOT', 'H2_PACKAGE_PARSER_SUBPATH']),
    );

    const req = `const { parseOwnerFrozenCues } = require('@ehas2/evidence-extract');\nparseOwnerFrozenCues({} as never, {} as never);\n`;
    expect(inspectSource(req, adapterRel).map((f: { rule: string }) => f.rule)).toEqual(
      expect.arrayContaining(['H2_ROOT_PARSE_IMPORT', 'H2_PARSE_OWNER_FROZEN_CUES_CALL']),
    );

    const dyn = `const { parseOwnerFrozenCues } = await import('@ehas2/evidence-extract');\nparseOwnerFrozenCues({} as never, {} as never);\n`;
    expect(inspectSource(dyn, adapterRel).map((f: { rule: string }) => f.rule)).toEqual(
      expect.arrayContaining(['H2_ROOT_PARSE_IMPORT']),
    );

    const aliased = `import { parseOwnerFrozenCues as run } from '@ehas2/evidence-extract';\nrun({} as never, {} as never);\n`;
    expect(inspectSource(aliased, adapterRel).map((f: { rule: string }) => f.rule)).toEqual(
      expect.arrayContaining(['H2_ALIASED_PARSER_IMPORT']),
    );

    const reexport = `export { parseOwnerFrozenCues } from '@ehas2/evidence-extract';\n`;
    expect(inspectSource(reexport, adapterRel).map((f: { rule: string }) => f.rule)).toEqual(
      expect.arrayContaining(['H2_ROOT_PARSE_IMPORT']),
    );

    const ns = `import * as extract from '@ehas2/evidence-extract';\nextract.parseOwnerFrozenCues({} as never, {} as never);\n`;
    expect(inspectSource(ns, adapterRel).map((f: { rule: string }) => f.rule)).toEqual(
      expect.arrayContaining(['H2_NAMESPACE_PARSER_ACCESS']),
    );

    const seam = `import { parseOwnerFrozenCuesInternalForTests } from '@ehas2/evidence-extract';\nparseOwnerFrozenCuesInternalForTests();\n`;
    expect(inspectSource(seam, adapterRel).map((f: { rule: string }) => f.rule)).toEqual(
      expect.arrayContaining(['H2_PARSE_INTERNAL_FOR_TESTS']),
    );

    for (const rel of adapterRels) {
      const adapterSrc = fs.readFileSync(path.join(root, rel), 'utf8');
      expect(inspectSource(adapterSrc, rel)).toEqual([]);
    }
  });
});
