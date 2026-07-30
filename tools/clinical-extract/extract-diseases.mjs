#!/usr/bin/env node
/**
 * Offline disease-only extraction — never runs at application startup.
 *
 * Usage:
 *   node tools/clinical-extract/extract-diseases.mjs --source <path-to.sqlite> --out <dir> [--expected-sha <sha>]
 *
 * Opens SQLite read-only. Fail-closed on checksum/schema mismatch.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import {
  APPROVED_DISEASE_FIELDS,
  APPROVED_TABLES,
  DENYLIST_FIELD_PATTERNS,
  DENYLIST_TABLES,
  DISEASE_DATASET_VERSION,
  DISEASE_PACKAGE_SCHEMA_VERSION,
  EXPECTED_DISEASE_COUNT,
  EXPECTED_SOURCE_DB_SHA256,
} from './schema.mjs';

function parseArgs(argv) {
  const out = {
    source: null,
    outDir: null,
    expectedSha: EXPECTED_SOURCE_DB_SHA256,
    expectedCount: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--source') out.source = argv[++i];
    else if (a === '--out') out.outDir = argv[++i];
    else if (a === '--expected-sha') out.expectedSha = String(argv[++i] || '').toUpperCase();
    else if (a === '--expected-count') out.expectedCount = Number(argv[++i]);
    else if (a === '--help') out.help = true;
  }
  return out;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(1024 * 1024);
    let n;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      hash.update(buf.subarray(0, n));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex').toUpperCase();
}

function fail(msg) {
  console.error(`EXTRACT_FAIL: ${msg}`);
  process.exit(1);
}

function assertReadonly(dbPath) {
  // Opening with readonly:true — any write attempt must throw.
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    try {
      db.exec('CREATE TABLE ehas2_write_probe (id INTEGER)');
      fail('Source database accepted a write — not read-only');
    } catch {
      /* expected */
    }
    return db;
  } catch (e) {
    db.close();
    throw e;
  }
}

function listUserTables(db) {
  return db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY 1`,
    )
    .all()
    .map((r) => r.name);
}

function extract(db) {
  const tables = listUserTables(db);
  for (const t of DENYLIST_TABLES) {
    // Denylist tables may exist in source — they must not be selected.
    if (tables.includes(t)) {
      console.log(`INFO: denylist table present in source (will not extract): ${t}`);
    }
  }
  for (const t of APPROVED_TABLES) {
    if (!tables.includes(t)) fail(`Approved table missing: ${t}`);
  }

  const cols = db
    .prepare(`PRAGMA table_info(diseases)`)
    .all()
    .map((c) => c.name);
  for (const f of APPROVED_DISEASE_FIELDS) {
    if (!cols.includes(f)) fail(`Approved field missing on diseases: ${f}`);
  }

  const selectList = APPROVED_DISEASE_FIELDS.join(', ');
  const rows = db.prepare(`SELECT ${selectList} FROM diseases ORDER BY id`).all();
  return rows;
}

function sanitizeScan(rows) {
  const sample = JSON.stringify(rows.slice(0, 50));
  for (const re of DENYLIST_FIELD_PATTERNS) {
    // Field names in output keys
    for (const key of Object.keys(rows[0] || {})) {
      if (re.test(key)) fail(`Prohibited field name in output: ${key}`);
    }
  }
  // Structural: no consultation-shaped objects
  for (const row of rows) {
    if ('patient_name' in row || 'formula_json' in row || 'phone' in row) {
      fail('Prohibited patient/consultation field leaked into a disease row');
    }
  }
  void sample;
}

function writePackage(outDir, rows, meta) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonlPath = path.join(outDir, 'diseases.v1.jsonl');
  const manifestPath = path.join(outDir, 'manifest.json');
  const ws = fs.createWriteStream(jsonlPath, { encoding: 'utf8' });
  for (const row of rows) {
    const record = {};
    for (const f of APPROVED_DISEASE_FIELDS) record[f] = row[f] ?? null;
    ws.write(`${JSON.stringify(record)}\n`);
  }
  ws.end();

  // Wait for stream flush synchronously via close sync rewrite for determinism
  const lines = rows.map((row) => {
    const record = {};
    for (const f of APPROVED_DISEASE_FIELDS) record[f] = row[f] ?? null;
    return JSON.stringify(record);
  });
  const body = `${lines.join('\n')}\n`;
  fs.writeFileSync(jsonlPath, body, 'utf8');

  const artifactSha = crypto.createHash('sha256').update(body, 'utf8').digest('hex').toUpperCase();
  const manifest = {
    schemaVersion: DISEASE_PACKAGE_SCHEMA_VERSION,
    datasetVersion: DISEASE_DATASET_VERSION,
    recordCount: rows.length,
    approvedFields: [...APPROVED_DISEASE_FIELDS],
    approvedTables: [...APPROVED_TABLES],
    denylistTablesExcluded: [...DENYLIST_TABLES],
    sourceFingerprint: meta.sourceSha,
    artifactSha256: artifactSha,
    artifactFile: 'diseases.v1.jsonl',
    generatedAt: meta.generatedAt,
    notes: [
      'Disease knowledge only — no consultations, patients, reports, or prescriptions.',
      'Do not commit the full artifact to Git; store under data/clinical-artifacts/.',
      'Production must receive a signed/versioned artifact — never an old laptop path.',
    ],
  };
  // Deterministic manifest: omit wall-clock for hash of package content; keep generatedAt informational
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.source || !args.outDir) {
    console.log(
      'Usage: node extract-diseases.mjs --source <sqlite> --out <dir> [--expected-sha SHA] [--expected-count N]',
    );
    process.exit(args.help ? 0 : 2);
  }

  const source = path.resolve(args.source);
  const outDir = path.resolve(args.outDir);
  if (!fs.existsSync(source)) fail(`Source not found: ${source}`);

  const sourceSha = sha256File(source);
  if (args.expectedSha && sourceSha !== args.expectedSha.toUpperCase()) {
    fail(`Source checksum mismatch. expected=${args.expectedSha} actual=${sourceSha}`);
  }

  const db = assertReadonly(source);
  let rows;
  try {
    rows = extract(db);
  } finally {
    db.close();
  }

  const expectedCount = args.expectedCount ?? EXPECTED_DISEASE_COUNT;
  if (rows.length !== expectedCount) {
    fail(`Disease count mismatch. expected=${expectedCount} actual=${rows.length}`);
  }

  sanitizeScan(rows);
  const manifest = writePackage(outDir, rows, {
    sourceSha,
    generatedAt: new Date().toISOString(),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        recordCount: manifest.recordCount,
        artifactSha256: manifest.artifactSha256,
        outDir,
      },
      null,
      2,
    ),
  );
}

main();
