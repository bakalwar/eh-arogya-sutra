#!/usr/bin/env node
/**
 * Offline medicine-registry extraction from the verified canonical Python MM source.
 * Explicit --source path required. Never used at application startup.
 *
 * Usage:
 *   node tools/clinical-extract/extract-medicines.mjs --source <engine_medicines_*.py> --out <dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  EXPECTED_MEDICINE_COUNT,
  MEDICINE_REGISTRY_VERSION,
  REQUIRED_MEDICINE_CODE,
} from './schema.mjs';

const APPROVED_MED_FIELDS = [
  'id',
  'name',
  'group_type',
  'polarity',
  'nickname',
  'target_organ',
  'description',
  'organ_action',
  'when_to_give',
  'disease_clusters',
  'potency_logic',
  'temperament_affinity',
  'search_tags',
  'medicine_number',
];

function parseArgs(argv) {
  const out = { source: null, outDir: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--source') out.source = argv[++i];
    else if (argv[i] === '--out') out.outDir = argv[++i];
  }
  return out;
}

function fail(msg) {
  console.error(`MED_EXTRACT_FAIL: ${msg}`);
  process.exit(1);
}

/**
 * Deterministic parse of MEDICINES_* list-of-dicts Python literals without exec.
 */
function parseMedicinesPy(text) {
  const start = text.search(/MEDICINES_\d+\s*=\s*\[/);
  if (start < 0) fail('MEDICINES_* list not found');
  const listStart = text.indexOf('[', start);
  let depth = 0;
  let end = -1;
  for (let i = listStart; i < text.length; i++) {
    const ch = text[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) fail('Unclosed MEDICINES list');
  const body = text.slice(listStart + 1, end);

  // Split top-level dicts by tracking braces
  const dicts = [];
  let dDepth = 0;
  let cur = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') {
      dDepth++;
      cur += ch;
    } else if (ch === '}') {
      dDepth--;
      cur += ch;
      if (dDepth === 0) {
        dicts.push(cur);
        cur = '';
      }
    } else if (dDepth > 0) {
      cur += ch;
    }
  }

  const medicines = dicts.map((raw) => {
    const obj = {};
    for (const field of APPROVED_MED_FIELDS) {
      const re = new RegExp(`["']${field}["']\\s*:\\s*["']([^"']*)["']`);
      const m = raw.match(re);
      if (m) obj[field] = m[1];
    }
    if (!obj.id) fail(`Medicine dict missing id near: ${raw.slice(0, 80)}`);
    if (!obj.name) fail(`Medicine ${obj.id} missing name`);
    return obj;
  });
  return medicines;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.source || !args.outDir) {
    console.log('Usage: node extract-medicines.mjs --source <py> --out <dir>');
    process.exit(2);
  }
  const source = path.resolve(args.source);
  const outDir = path.resolve(args.outDir);
  if (!fs.existsSync(source)) fail(`Source not found: ${source}`);

  const text = fs.readFileSync(source, 'utf8');
  const sourceSha = crypto.createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
  const medicines = parseMedicinesPy(text);

  const ids = medicines.map((m) => m.id);
  const unique = new Set(ids);
  if (unique.size !== ids.length) fail('Duplicate medicine codes');
  if (medicines.length !== EXPECTED_MEDICINE_COUNT) {
    fail(`Expected ${EXPECTED_MEDICINE_COUNT} medicines, got ${medicines.length}`);
  }
  if (!unique.has(REQUIRED_MEDICINE_CODE))
    fail(`${REQUIRED_MEDICINE_CODE} missing from canonical registry`);

  // Sort by id for determinism
  medicines.sort((a, b) => a.id.localeCompare(b.id));
  const body = `${JSON.stringify(medicines, null, 2)}\n`;
  const artifactSha = crypto.createHash('sha256').update(body, 'utf8').digest('hex').toUpperCase();

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'medicines.v1.json'), body, 'utf8');
  const manifest = {
    registryVersion: MEDICINE_REGISTRY_VERSION,
    medicineCount: medicines.length,
    codes: medicines.map((m) => m.id),
    requiredCodePresent: REQUIRED_MEDICINE_CODE,
    sourceFingerprint: sourceSha,
    artifactSha256: artifactSha,
    sqliteSeedIsCanonical: false,
    notes: [
      'Canonical count is 39 despite legacy Python module filename.',
      'SQLite medicines seed (38, missing C11) must never be treated as canonical.',
    ],
  };
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  console.log(
    JSON.stringify(
      { ok: true, medicineCount: medicines.length, artifactSha256: artifactSha },
      null,
      2,
    ),
  );
}

main();
