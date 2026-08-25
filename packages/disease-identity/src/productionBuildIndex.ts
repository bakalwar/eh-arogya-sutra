import { mkdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DiseaseIdentityError } from './errors.js';
import {
  EXPECTED_BRIDGE_ROW_COUNT,
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  EXPECTED_MAPPED_JSON_ROW_COUNT,
  EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
  MAX_CONTROLLED_INDEX_BYTES,
} from './fullCorpusConstants.js';
import type { ParsedBridgeRow } from './bridgeIngest.js';
import type { MappedDedupeEntry, MappedJsonRow } from './mappedIngest.js';
import type { LegacyDbRow } from './sqlitePrivacy.js';
import { mappedRawKey } from './namespaceResolution.js';
import { canonicalJsonString } from './canonicalJson.js';

type IndexMode =
  | { readonly mode?: 'production' }
  | {
      readonly mode: 'synthetic-test';
      readonly expectedDbRows: number;
      readonly expectedMappedRawRows: number;
      readonly expectedMappedUniqueRows: number;
      readonly expectedBridgeRows: number;
    };

type SqlRow = Record<string, unknown>;

export type ProductionBuildIndex = {
  readonly dbPath: string;
  readonly db: Database.Database;
  readonly mode: 'production' | 'synthetic-test';
  insertDbRow(row: LegacyDbRow): void;
  insertMappedRow(row: MappedJsonRow): void;
  insertBridgeRow(row: ParsedBridgeRow): void;
  setMeta(key: string, value: string): void;
  getMeta(key: string): string | null;
  counts(): {
    dbRows: number;
    mappedRawRows: number;
    mappedUniqueRows: number;
    bridgeRows: number;
    bridgeCandidates: number;
  };
  enforceConfiguredCounts(): void;
  setQueryOnlyAfterPopulate(): void;
  assertIndexSizeLimit(): void;
  iterateMappedEntries(): IterableIterator<MappedDedupeEntry>;
  iterateBridgeRows(): IterableIterator<ParsedBridgeRow>;
  iterateDbRows(): IterableIterator<LegacyDbRow>;
  bridgeRowsForDbId(dbId: number): ParsedBridgeRow[];
  addOutputRecord(kind: string, sortKey: string, json: string): void;
  iterateOutputRecords(kind: string): IterableIterator<{ json: string }>;
  outputCount(kind: string): number;
  scalarNumber(sql: string): number;
  close(): void;
  destroy(): void;
};

function safeJsonArray(value: string, label: string): unknown[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', `${label} must be a JSON array`);
  }
  return parsed;
}

export function createProductionBuildIndex(
  dir: string,
  options: IndexMode = {},
): ProductionBuildIndex {
  mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'production-build-index.sqlite');
  const db = new Database(dbPath);
  // Separate connection for output writes so ordered readers can stay open without
  // "database connection is busy" conflicts during streaming generation.
  const writeDb = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  writeDb.pragma('journal_mode = WAL');
  writeDb.pragma('synchronous = NORMAL');
  writeDb.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE db_disease (
      id INTEGER PRIMARY KEY,
      icd10_code TEXT
    ) STRICT;
    CREATE TABLE mapped_entry (
      dedupe_key TEXT PRIMARY KEY,
      source_label TEXT NOT NULL,
      code_raw TEXT NOT NULL,
      provenance_json TEXT NOT NULL
    ) STRICT;
    CREATE TABLE bridge_entry (
      dedupe_key TEXT PRIMARY KEY,
      source_label TEXT NOT NULL,
      code_raw TEXT NOT NULL,
      normalized_identity_key TEXT,
      disposition TEXT NOT NULL,
      candidates_json TEXT NOT NULL
    ) STRICT;
    CREATE TABLE bridge_candidate (
      db_id INTEGER NOT NULL,
      dedupe_key TEXT NOT NULL,
      PRIMARY KEY (db_id, dedupe_key),
      FOREIGN KEY (dedupe_key) REFERENCES bridge_entry(dedupe_key)
    ) STRICT;
    CREATE INDEX bridge_candidate_key_idx ON bridge_candidate(dedupe_key);
    CREATE TABLE meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    ) STRICT;
    CREATE TABLE output_record (
      kind TEXT NOT NULL,
      sort_key TEXT NOT NULL,
      json TEXT NOT NULL,
      PRIMARY KEY (kind, sort_key)
    ) STRICT;
  `);

  const insertDb = db.prepare('INSERT INTO db_disease(id, icd10_code) VALUES (?, ?)');
  const insertMapped = db.prepare(
    'INSERT OR IGNORE INTO mapped_entry(dedupe_key, source_label, code_raw, provenance_json) VALUES (?, ?, ?, ?)',
  );
  const insertBridge = db.prepare(
    `INSERT INTO bridge_entry
      (dedupe_key, source_label, code_raw, normalized_identity_key, disposition, candidates_json)
      VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertCandidate = db.prepare(
    'INSERT INTO bridge_candidate(db_id, dedupe_key) VALUES (?, ?)',
  );
  const insertBridgeTransaction = db.transaction((row: ParsedBridgeRow) => {
    insertBridge.run(
      row.dedupeKey,
      row.mappedSourceLabel,
      row.mappedCodeRaw,
      row.normalizedIdentityKey,
      row.disposition,
      canonicalJsonString(row.candidateLegacyDbIds),
    );
    for (const id of row.candidateLegacyDbIds) {
      insertCandidate.run(id, row.dedupeKey);
    }
  });
  const setMetaStatement = db.prepare(
    'INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
  );
  const incrementMappedRaw = db.prepare(
    `INSERT INTO meta(key, value) VALUES ('mappedRawRows', '1')
     ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(value AS INTEGER) + 1 AS TEXT)`,
  );
  const addOutput = writeDb.prepare(
    'INSERT INTO output_record(kind, sort_key, json) VALUES (?, ?, ?)',
  );

  let closed = false;
  let queryOnly = false;
  const configured =
    options.mode === 'synthetic-test'
      ? options
      : {
          mode: 'production' as const,
          expectedDbRows: EXPECTED_LEGACY_DB_DISEASE_COUNT,
          expectedMappedRawRows: EXPECTED_MAPPED_JSON_ROW_COUNT,
          expectedMappedUniqueRows: EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
          expectedBridgeRows: EXPECTED_BRIDGE_ROW_COUNT,
        };

  function count(table: string): number {
    return Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as SqlRow).count);
  }

  const api: ProductionBuildIndex = {
    dbPath,
    db,
    mode: configured.mode,
    insertDbRow(row) {
      insertDb.run(row.id, row.icd10_code);
    },
    insertMappedRow(row) {
      const dedupeKey = mappedRawKey(row.source, row.code);
      const variant = { mappedCodeRaw: row.code, mappedSourceLabel: row.source };
      const existing = db
        .prepare('SELECT provenance_json FROM mapped_entry WHERE dedupe_key = ?')
        .get(dedupeKey) as SqlRow | undefined;
      if (!existing) {
        insertMapped.run(dedupeKey, row.source, row.code, canonicalJsonString([variant]));
      } else {
        const variants = safeJsonArray(
          String(existing.provenance_json),
          'mapped provenance',
        ) as Array<{ mappedCodeRaw: string; mappedSourceLabel: string }>;
        if (
          !variants.some(
            (item) =>
              item.mappedCodeRaw === variant.mappedCodeRaw &&
              item.mappedSourceLabel === variant.mappedSourceLabel,
          )
        ) {
          variants.push(variant);
          variants.sort((a, b) => {
            const labelCmp = a.mappedSourceLabel.localeCompare(b.mappedSourceLabel);
            return labelCmp !== 0 ? labelCmp : a.mappedCodeRaw.localeCompare(b.mappedCodeRaw);
          });
          db.prepare(
            'UPDATE mapped_entry SET source_label = ?, code_raw = ?, provenance_json = ? WHERE dedupe_key = ?',
          ).run(
            variants[0]!.mappedSourceLabel,
            variants[0]!.mappedCodeRaw,
            canonicalJsonString(variants),
            dedupeKey,
          );
        }
      }
      incrementMappedRaw.run();
    },
    insertBridgeRow(row) {
      insertBridgeTransaction(row);
    },
    setMeta(key, value) {
      setMetaStatement.run(key, value);
    },
    getMeta(key) {
      const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as SqlRow | undefined;
      return row ? String(row.value) : null;
    },
    counts() {
      return {
        dbRows: count('db_disease'),
        mappedRawRows: Number(api.getMeta('mappedRawRows') ?? 0),
        mappedUniqueRows: count('mapped_entry'),
        bridgeRows: count('bridge_entry'),
        bridgeCandidates: count('bridge_candidate'),
      };
    },
    enforceConfiguredCounts() {
      const observed = api.counts();
      const checks = [
        ['DB rows', observed.dbRows, configured.expectedDbRows],
        ['mapped raw rows', observed.mappedRawRows, configured.expectedMappedRawRows],
        ['mapped unique rows', observed.mappedUniqueRows, configured.expectedMappedUniqueRows],
        ['bridge rows', observed.bridgeRows, configured.expectedBridgeRows],
      ] as const;
      for (const [label, actual, expected] of checks) {
        if (actual !== expected) {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            `Expected ${expected} ${label}, observed ${actual}`,
          );
        }
      }
    },
    setQueryOnlyAfterPopulate() {
      db.pragma('optimize');
      db.pragma('query_only = ON');
      writeDb.pragma('query_only = ON');
      queryOnly = true;
    },
    assertIndexSizeLimit() {
      try {
        db.pragma('wal_checkpoint(TRUNCATE)');
      } catch {
        // DELETE journal mode may not expose WAL checkpoint.
      }
      const bytes = statSync(dbPath).size;
      if (bytes > MAX_CONTROLLED_INDEX_BYTES) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Production build index exceeds MAX_CONTROLLED_INDEX_BYTES (${MAX_CONTROLLED_INDEX_BYTES})`,
        );
      }
    },
    *iterateMappedEntries() {
      const rows = db
        .prepare(
          'SELECT dedupe_key, source_label, code_raw, provenance_json FROM mapped_entry ORDER BY dedupe_key',
        )
        .iterate() as IterableIterator<SqlRow>;
      for (const row of rows) {
        yield {
          dedupeKey: String(row.dedupe_key),
          mappedSourceLabel: String(row.source_label),
          mappedCodeRaw: String(row.code_raw),
          provenanceVariants: safeJsonArray(
            String(row.provenance_json),
            'mapped provenance',
          ) as MappedDedupeEntry['provenanceVariants'],
        };
      }
    },
    *iterateBridgeRows() {
      const rows = db
        .prepare(
          `SELECT dedupe_key, source_label, code_raw, normalized_identity_key,
                  disposition, candidates_json
           FROM bridge_entry ORDER BY dedupe_key`,
        )
        .iterate() as IterableIterator<SqlRow>;
      for (const row of rows) {
        yield {
          dedupeKey: String(row.dedupe_key),
          mappedSourceLabel: String(row.source_label),
          mappedCodeRaw: String(row.code_raw),
          normalizedIdentityKey:
            row.normalized_identity_key === null ? null : String(row.normalized_identity_key),
          disposition: String(row.disposition) as ParsedBridgeRow['disposition'],
          candidateLegacyDbIds: safeJsonArray(
            String(row.candidates_json),
            'bridge candidates',
          ) as number[],
        };
      }
    },
    *iterateDbRows() {
      const rows = db
        .prepare('SELECT id, icd10_code FROM db_disease ORDER BY id')
        .iterate() as IterableIterator<SqlRow>;
      for (const row of rows) {
        yield {
          id: Number(row.id),
          icd10_code: row.icd10_code === null ? null : String(row.icd10_code),
        };
      }
    },
    bridgeRowsForDbId(dbId) {
      const rows = db
        .prepare(
          `SELECT b.dedupe_key, b.source_label, b.code_raw, b.normalized_identity_key,
                  b.disposition, b.candidates_json
           FROM bridge_candidate c
           JOIN bridge_entry b ON b.dedupe_key = c.dedupe_key
           WHERE c.db_id = ?
           ORDER BY b.dedupe_key`,
        )
        .all(dbId) as SqlRow[];
      return rows.map((row) => ({
        dedupeKey: String(row.dedupe_key),
        mappedSourceLabel: String(row.source_label),
        mappedCodeRaw: String(row.code_raw),
        normalizedIdentityKey:
          row.normalized_identity_key === null ? null : String(row.normalized_identity_key),
        disposition: String(row.disposition) as ParsedBridgeRow['disposition'],
        candidateLegacyDbIds: safeJsonArray(
          String(row.candidates_json),
          'bridge candidates',
        ) as number[],
      }));
    },
    addOutputRecord(kind, sortKey, json) {
      if (queryOnly) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          'Cannot populate output records after query-only activation',
        );
      }
      addOutput.run(kind, sortKey, json);
    },
    *iterateOutputRecords(kind) {
      yield* db
        .prepare('SELECT json FROM output_record WHERE kind = ? ORDER BY sort_key')
        .iterate(kind) as IterableIterator<{ json: string }>;
    },
    outputCount(kind) {
      return Number(
        (
          db
            .prepare('SELECT COUNT(*) AS count FROM output_record WHERE kind = ?')
            .get(kind) as SqlRow
        ).count,
      );
    },
    scalarNumber(sql) {
      const row = db.prepare(sql).get() as SqlRow | undefined;
      if (!row) return 0;
      return Number(Object.values(row)[0] ?? 0);
    },
    close() {
      if (!closed) {
        try {
          writeDb.close();
        } catch {
          // Prefer closing the primary reader next.
        }
        db.close();
        closed = true;
      }
    },
    destroy() {
      api.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
  return api;
}
