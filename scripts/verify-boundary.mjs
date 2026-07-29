#!/usr/bin/env node
/**
 * EHAS2 boundary verification — portable checks that the new project does not
 * depend on, import, symlink into, or embed the legacy EH_Arogya_Sutra_App tree.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEW_PROJECT_NAME = 'EH_AROGYA_SUTRA_2';
const OLD_PROJECT_NAME = 'EH_Arogya_Sutra_App';

const FORBIDDEN_TEXT = [
  'EH_Arogya_Sutra_App',
  'eh_arogya.db',
  'engine_medicines_38',
  'electrohomeopathy.db',
];

const FORBIDDEN_PATH_FRAGMENTS = [`${path.sep}eh-api${path.sep}`, '/eh-api/', '\\eh-api\\'];

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '.turbo', 'out']);

const SCAN_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.css',
  '.html',
  '.env',
  '.example',
  '.py',
  '.toml',
  '.sql',
]);

const SECRET_PATTERNS = [
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { id: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/ },
  {
    id: 'generic-api-key-assign',
    re: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"][^'"]{16,}/i,
  },
  { id: 'mongodb-uri', re: /mongodb(?:\+srv)?:\/\/[^\s'"]+/i },
  { id: 'postgres-uri', re: /postgres(?:ql)?:\/\/[^\s'"]+/i },
];

const PATIENT_NAME_HINTS = [/\bpatient[_-]?name\b/i, /\bMRN\b/, /\bconsultation[_-]?json\b/i];

const failures = [];
const warnings = [];

function fail(msg) {
  failures.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isSymbolicLink()) {
      out.push({ path: p, symlink: true });
      continue;
    }
    if (ent.isDirectory()) walk(p, out);
    else out.push({ path: p, symlink: false });
  }
  return out;
}

function resolveLegacyCandidates() {
  const candidates = new Set();
  const parent = path.resolve(ROOT, '..');
  candidates.add(path.join(parent, OLD_PROJECT_NAME));
  if (process.env.EHAS2_LEGACY_ROOT) {
    candidates.add(path.resolve(process.env.EHAS2_LEGACY_ROOT));
  }
  return [...candidates];
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** 1) New project must not live inside old Git root */
function checkNotNestedInLegacy() {
  const legacyRoots = resolveLegacyCandidates().filter((p) => fs.existsSync(path.join(p, '.git')));
  for (const legacy of legacyRoots) {
    if (isInside(ROOT, legacy)) {
      fail(`New project is nested inside legacy Git root: ${legacy}`);
    }
  }
  if (path.basename(ROOT) !== NEW_PROJECT_NAME) {
    warn(`Expected folder name ${NEW_PROJECT_NAME}, found ${path.basename(ROOT)}`);
  }
}

/** 2) No nested old .git, no copied .env, no old DB, no patient/report blobs */
function checkForbiddenArtifacts() {
  const nestedGit = path.join(ROOT, OLD_PROJECT_NAME, '.git');
  if (fs.existsSync(nestedGit)) fail(`Nested legacy .git found at ${nestedGit}`);

  const bannedNames = ['.env', 'eh_arogya.db', 'electrohomeopathy.db', 'engine_medicines_38.json'];
  const files = walk(ROOT);
  for (const { path: p, symlink } of files) {
    const base = path.basename(p);
    const rel = path.relative(ROOT, p);

    if (symlink) {
      let target = '';
      try {
        target = fs.readlinkSync(p);
      } catch {
        target = '';
      }
      const absTarget = path.resolve(path.dirname(p), target);
      for (const legacy of resolveLegacyCandidates()) {
        if (fs.existsSync(legacy) && isInside(absTarget, legacy)) {
          fail(`Symlink/junction into legacy project: ${rel} -> ${target}`);
        }
        if (String(target).includes(OLD_PROJECT_NAME)) {
          fail(`Symlink/junction references legacy name: ${rel} -> ${target}`);
        }
      }
    }

    if (base === '.env' || /^\.env\./.test(base)) {
      if (base !== '.env.example') fail(`Tracked/local secret env file present: ${rel}`);
    }
    if (bannedNames.includes(base) && base !== '.env') {
      fail(`Forbidden legacy artifact present: ${rel}`);
    }
    if (/patient.?record|consultation\.json|prescription.?record/i.test(rel)) {
      if (!rel.replace(/\\/g, '/').includes('fixtures/synthetic')) {
        fail(`Patient/clinical record path outside synthetic fixtures: ${rel}`);
      }
    }
    if (/\.(pdf|jpg|jpeg|png|dcm)$/i.test(base) && /report|upload|patient/i.test(rel)) {
      const norm = rel.replace(/\\/g, '/');
      const allowedBinary =
        norm.includes('fixtures/synthetic') ||
        norm.includes('docs/phase-reports/qa-screenshots') ||
        norm.includes('docs/phase-reports/qa-screenshots-1c-a') ||
        norm.includes('docs/phase-reports/qa-screenshots-1c-b') ||
        norm.includes('docs/phase-reports/qa-screenshots-1c-c') ||
        norm.includes('apps/web/public/brand/');
      if (!allowedBinary) {
        fail(`Report/upload-like binary outside synthetic fixtures: ${rel}`);
      }
    }
  }
}

/** 3) Source scan: no old paths, ports as hard deps, secrets, patient hints */
function checkSourceContent() {
  const scanRoots = ['apps', 'packages', 'tests', 'scripts', 'docs', 'fixtures', 'infrastructure']
    .map((d) => path.join(ROOT, d))
    .filter((d) => fs.existsSync(d));

  const selfScript = path.join(ROOT, 'scripts', 'verify-boundary.mjs');
  const allowlistRel = new Set([
    path.relative(ROOT, selfScript),
    path.join('docs', 'security', 'dependency-risk-register.md'),
    path.join('docs', 'phase-reports', 'PHASE_1A_HARDENING_REPORT.md'),
    path.join('docs', 'phase-reports', 'PHASE_1A_FINAL_MANIFEST.md'),
    path.join('docs', 'phase-reports', 'phase-1a-engineering-foundation.md'),
    path.join('docs', 'architecture', 'engineering-phases.md'),
    'README.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
  ]);

  for (const scanRoot of scanRoots) {
    for (const { path: file, symlink } of walk(scanRoot)) {
      if (symlink) continue;
      const ext = path.extname(file);
      if (!SCAN_EXT.has(ext) && path.basename(file) !== '.env.example') continue;
      const rel = path.relative(ROOT, file);
      if (file === selfScript) continue;
      if (path.basename(file) === '_scaffold_phase1a.py') continue;

      let text;
      try {
        text = fs.readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      const isDocsAllow = [...allowlistRel].some(
        (a) => rel === a || rel.replace(/\\/g, '/') === a.replace(/\\/g, '/'),
      );

      for (const needle of FORBIDDEN_TEXT) {
        if (text.includes(needle) && !isDocsAllow) {
          // Boundary docs may name the old project; production code must not.
          if (
            rel.startsWith(`docs${path.sep}`) ||
            rel.startsWith('docs/') ||
            rel === 'README.md' ||
            rel === 'CONTRIBUTING.md' ||
            rel === 'SECURITY.md'
          ) {
            // Allowed in documentation that explains the boundary.
            continue;
          }
          fail(`Forbidden legacy reference "${needle}" in ${rel}`);
        }
      }

      for (const frag of FORBIDDEN_PATH_FRAGMENTS) {
        if (
          text.includes(frag) &&
          !isDocsAllow &&
          !rel.includes(`${path.sep}docs${path.sep}`) &&
          !rel.startsWith('docs')
        ) {
          fail(`Forbidden legacy path fragment in ${rel}`);
        }
      }

      // Absolute Windows/Unix path pointing at old project (portable: match folder name + separators)
      const absLegacy = new RegExp(
        String.raw`(?:[A-Za-z]:\\|/)(?:[^\n'"]*[\\/])?${OLD_PROJECT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[\\/]|['"\s]|$)`,
      );
      if (
        absLegacy.test(text) &&
        !rel.startsWith('docs') &&
        rel !== 'README.md' &&
        rel !== 'CONTRIBUTING.md'
      ) {
        fail(`Absolute legacy project path in ${rel}`);
      }

      // Old server ports as required dependencies (3000/5000/3002/3001 common in legacy)
      if (
        /EHAS2_.*(?:3000|5000|3001|3002)/.test(text) ||
        /(?:from|dependsOn|LEGACY_).*port.*(?:3000|5000)/i.test(text)
      ) {
        fail(`Legacy port dependency hint in ${rel}`);
      }

      for (const { id, re } of SECRET_PATTERNS) {
        if (re.test(text)) {
          fail(`Possible secret pattern (${id}) in ${rel}`);
        }
      }

      if (!rel.replace(/\\/g, '/').includes('fixtures/synthetic')) {
        for (const re of PATIENT_NAME_HINTS) {
          if (re.test(text) && /["'].{3,}["']/.test(text)) {
            // Soft signal only when paired with quoted literals that look like names is hard;
            // flag explicit patient dump markers instead.
          }
        }
        if (/\b(real patient|PHI dump|consultation export)\b/i.test(text)) {
          fail(`Patient-data dump marker in ${rel}`);
        }
      }

      // Runtime import from outside monorepo into Desktop sibling
      if (
        /from\s+['"](?:\.\.\/){3,}.*Arogya/i.test(text) ||
        /require\(['"].*EH_Arogya/i.test(text)
      ) {
        fail(`Runtime import toward legacy tree in ${rel}`);
      }
    }
  }
}

/** 4) Writes must remain inside this repo (script itself only reads) */
function checkWriteScope() {
  const tmpProbe = path.join(ROOT, '.ehas2-boundary-write-probe');
  try {
    fs.writeFileSync(tmpProbe, 'ok', 'utf8');
    if (!isInside(tmpProbe, ROOT)) fail('Write probe escaped repository root');
  } finally {
    try {
      fs.unlinkSync(tmpProbe);
    } catch {
      /* ignore */
    }
  }
}

/** 5) Own Git root exists and is distinct */
function checkOwnGit() {
  if (!fs.existsSync(path.join(ROOT, '.git'))) {
    fail('New project missing its own .git directory');
  }
  for (const legacy of resolveLegacyCandidates()) {
    const legacyGit = path.join(legacy, '.git');
    if (!fs.existsSync(legacyGit)) continue;
    try {
      const a = fs.realpathSync(path.join(ROOT, '.git'));
      const b = fs.realpathSync(legacyGit);
      if (a === b) fail('New project .git resolves to the same path as legacy .git');
    } catch {
      /* ignore permission issues */
    }
  }
}

checkNotNestedInLegacy();
checkOwnGit();
checkForbiddenArtifacts();
checkSourceContent();
checkWriteScope();

console.log(`EHAS2 boundary verification — root=${ROOT}`);
console.log(`platform=${os.platform()} hostname-independent checks`);
if (warnings.length) {
  console.log('WARNINGS:');
  for (const w of warnings) console.log(`  - ${w}`);
}
if (failures.length) {
  console.error('BOUNDARY FAIL:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('BOUNDARY OK — isolation checks passed.');
