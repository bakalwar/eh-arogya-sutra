/**
 * F3D-2D2 firewall: pure normalizer paths must stay database-/clinical-free.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const NORMALIZER_DIR = path.join(root, 'packages/evidence-extract/src/terminology/normalizer');

const FORBIDDEN_IMPORT =
  /from\s+['"]@ehas2\/(?:database|rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]|require\(['"]@ehas2\/(?:database|rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]\)|from\s+['"][^'"]*(?:tesseract\.js|pdf-parse|LibreTranslate|openai|anthropic|@xenova\/transformers|node-fetch|undici|convert-units|mathjs|luxon|moment)['"]/i;

const FORBIDDEN_CALL =
  /\b(?:parseOwnerFrozenCues|evaluateRule[1-9]|addStructuredFindings|Date\.now)\s*\(|new\s+PgFactNormalizationRepository\b|clinicallyUsed\s*:\s*true|clinically_used\s*:\s*true|f3d2dFoundation\s*:\s*true|INSERT\s+INTO\s+clinical_fact|CREATE\s+TABLE\s+clinical_fact/i;

const FORBIDDEN_PATH_COUPLING =
  /from\s+['"][^'"]*(?:apps\/api|apps\/worker|apps\/web|repositories\/factNormalization|services\/factCandidate)['"]/i;

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(abs));
    else if (/\.[cm]?[jt]sx?$/.test(ent.name)) out.push(abs);
  }
  return out;
}

function scanFiles(files) {
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (
      FORBIDDEN_IMPORT.test(text) ||
      FORBIDDEN_CALL.test(text) ||
      FORBIDDEN_PATH_COUPLING.test(text)
    ) {
      hits.push(path.relative(root, file).split(path.sep).join('/'));
    }
  }
  return hits;
}

function assertClean(label, files) {
  const hits = scanFiles(files);
  if (hits.length) {
    console.error(`F3D-2D2 firewall failed (${label}):`, hits.join(', '));
    process.exit(1);
  }
}

if (!fs.existsSync(NORMALIZER_DIR)) {
  console.error('F3D-2D2 normalizer directory missing');
  process.exit(1);
}

const normalizerFiles = walk(NORMALIZER_DIR);
assertClean('normalizer', normalizerFiles);

const indexPath = path.join(root, 'packages/evidence-extract/src/terminology/normalizer/index.ts');
const indexText = fs.readFileSync(indexPath, 'utf8');
if (!indexText.includes('normalizeSourceLinkedFact')) {
  console.error('F3D-2D2 public normalizeSourceLinkedFact export missing');
  process.exit(1);
}
if (indexText.includes('ownerFrozenEntries') || indexText.includes('OWNER_FROZEN_ENTRIES')) {
  console.error('F3D-2D2 must not re-export raw pack entries');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2d2-fw-'));
try {
  const probe = path.join(tmp, 'probe.ts');
  fs.writeFileSync(
    probe,
    `import { PgFactNormalizationRepository } from '@ehas2/database';\nDate.now();\n`,
    'utf8',
  );
  const probeHits = scanFiles([probe]);
  if (probeHits.length !== 1) {
    console.error('F3D-2D2 negative probe did not detect forbidden imports');
    process.exit(1);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('F3D-2D2 deterministic normalizer firewall OK');
