/**
 * F3D-2 terminology-pack selector firewall.
 * Shared by unit negative probes and CI. No extra npm dependency.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN_MODULES =
  'openai(?:/[\\w.-]+)?|node-nlp|compromise(?:/[\\w.-]+)?|natural|wink-nlp|@xenova/transformers(?:/[\\w.-]+)?|@ehas2/rule[1-9]|@ehas2/medicine-registry|@ehas2/engine-adapter|@ehas2/clinical-engine|@ehas2/clinical-data-manifest|tesseract(?:\\.js)?|pdf-parse|pdfjs|@napi-rs/canvas';

const MODULE_SPEC = `(?:${FORBIDDEN_MODULES})`;

const IMPORT_REQUIRE = new RegExp(
  [
    `(?:^|\\W)from\\s+['"]${MODULE_SPEC}['"]`,
    `(?:^|\\W)import\\s*\\(\\s*['"]${MODULE_SPEC}['"]\\s*\\)`,
    `(?:^|\\W)require\\s*\\(\\s*['"]${MODULE_SPEC}['"]\\s*\\)`,
    `(?:^|\\W)export\\s+[^;]*?from\\s+['"]${MODULE_SPEC}['"]`,
  ].join('|'),
  'i',
);

const RX_SUMMARY =
  /from\s+['"][^'"]*\/(?:summary|prescription)['"]|ConfirmPrescription|prescriptionDraft/;

const COUPLING_TOKENS =
  /evaluateRule[1-9]|LibreTranslate|addStructuredFindings|CORRECTED_BY_DOCTOR|clinically_used\s*=\s*true|clinically_used\s*:\s*true|structured_report_findings|analyzeComplete\s*\(|fetch\s*\(|016_f3d/;

const PACK_FIXTURE_TOKENS =
  /@ehas2\/rule[1-9]|@ehas2\/medicine-registry|@ehas2\/engine-adapter|@ehas2\/clinical-engine|@ehas2\/clinical-data-manifest|evaluateRule[1-9]|LibreTranslate|addStructuredFindings|CORRECTED_BY_DOCTOR|clinically_used\s*=\s*true|clinically_used\s*:\s*true|ConfirmPrescription|prescriptionDraft|structured_report_findings|016_f3d/;

/** Strip // and /* comments without removing string contents (deny-list literals stay). */
export function stripJsComments(source) {
  let out = '';
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const n1 = source[i + 1];
    if (c === '/' && n1 === '/') {
      i += 2;
      while (i < n && source[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && n1 === '*') {
      i += 2;
      while (i + 1 < n && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      out += c;
      i += 1;
      while (i < n) {
        if (source[i] === '\\') {
          out += source[i];
          i += 1;
          if (i < n) {
            out += source[i];
            i += 1;
          }
          continue;
        }
        out += source[i];
        if (source[i] === q) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

export function hitsF3d2TerminologyFirewall(source) {
  const stripped = stripJsComments(source);
  const compact = stripped.replace(/\s+/g, ' ');
  return IMPORT_REQUIRE.test(compact) || RX_SUMMARY.test(compact) || COUPLING_TOKENS.test(stripped);
}

export function hitsF3d2PackOrFixtureToken(source) {
  return PACK_FIXTURE_TOKENS.test(source);
}

export function listTsFiles(absDir, out = []) {
  if (!fs.existsSync(absDir)) return out;
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) listTsFiles(abs, out);
    else if (ent.name.endsWith('.ts')) out.push(abs);
  }
  return out;
}

function walkFiles(absDir, out = []) {
  if (!fs.existsSync(absDir)) return out;
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, out);
    else out.push(abs);
  }
  return out;
}

export function scanF3d2TerminologyTree(repoRoot) {
  const findings = [];
  const termDir = path.join(repoRoot, 'packages', 'evidence-extract', 'src', 'terminology');
  for (const abs of listTsFiles(termDir)) {
    const src = fs.readFileSync(abs, 'utf8');
    if (hitsF3d2TerminologyFirewall(src)) {
      findings.push(path.relative(repoRoot, abs).replaceAll('\\', '/'));
    }
  }
  for (const rel of ['packages/evidence-extract/packs', 'tests/fixtures/terminology-packs']) {
    for (const abs of walkFiles(path.join(repoRoot, rel))) {
      const src = fs.readFileSync(abs, 'utf8');
      if (hitsF3d2PackOrFixtureToken(src)) {
        findings.push(path.relative(repoRoot, abs).replaceAll('\\', '/'));
      }
    }
  }
  return findings;
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? path.resolve(process.argv[1]) === thisFile : false;
if (invoked) {
  const repoRoot = path.resolve(path.dirname(thisFile), '..');
  const findings = scanF3d2TerminologyTree(repoRoot);
  if (findings.length > 0) {
    console.error('Forbidden F3D-2 terminology coupling:\n' + findings.join('\n'));
    process.exit(1);
  }
}
