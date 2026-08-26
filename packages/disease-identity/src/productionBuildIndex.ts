import { existsSync, mkdirSync, statSync, type rmSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  removeBuilderOwnedDirectory,
  formatFailClosedCleanupMessage,
  sleepSync,
  createBuilderOwnedDirectoryOwnership,
  CONTROLLED_INDEX_DB_BASENAME,
} from './controlledIndexCleanup.js';
import { DiseaseIdentityError } from './errors.js';
import {
  CONTROLLED_INDEX_CHECKPOINT_HEADROOM_BYTES,
  CONTROLLED_INDEX_OUTPUT_BATCH_ROWS,
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
  | { readonly mode?: 'production'; readonly maxControlledIndexBytes?: number }
  | {
      readonly mode: 'synthetic-test';
      readonly expectedDbRows: number;
      readonly expectedMappedRawRows: number;
      readonly expectedMappedUniqueRows: number;
      readonly expectedBridgeRows: number;
      /** Test-only override; production mode always uses MAX_CONTROLLED_INDEX_BYTES. */
      readonly maxControlledIndexBytes?: number;
      /** Synthetic-test only: inject cleanup I/O for failure-path regression tests. */
      readonly testCleanupHooks?: { readonly rmSyncImpl?: typeof rmSync };
    };

type SqlRow = Record<string, unknown>;

export type MappedBridgeJoinRow = {
  readonly dedupeKey: string;
  readonly mappedSourceLabel: string;
  readonly mappedCodeRaw: string;
  readonly provenanceVariants: MappedDedupeEntry['provenanceVariants'];
  readonly normalizedIdentityKey: string | null;
  readonly disposition: ParsedBridgeRow['disposition'];
  readonly candidateLegacyDbIds: number[];
};

type WalCheckpointResult = {
  readonly busy: number;
  readonly log: number;
  readonly checkpointed: number;
};

function parseWalCheckpointResult(result: unknown, boundary: string): WalCheckpointResult {
  const row = Array.isArray(result)
    ? result[0]
    : result && typeof result === 'object'
      ? result
      : null;
  if (!row || typeof row !== 'object' || !('busy' in row)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `${boundary}: controlled index WAL checkpoint returned unexpected result`,
    );
  }
  return row as WalCheckpointResult;
}

/** Test-visible validation for better-sqlite3 WAL checkpoint row shape and fail-closed semantics. */
export function validateWalCheckpointResult(
  result: unknown,
  boundary: string,
): WalCheckpointResult {
  const checkpoint = parseWalCheckpointResult(result, boundary);
  if (checkpoint.busy !== 0) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `${boundary}: controlled index WAL checkpoint busy (active reader/writer)`,
    );
  }
  if (checkpoint.log !== checkpoint.checkpointed) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `${boundary}: controlled index WAL checkpoint incomplete`,
    );
  }
  return checkpoint;
}

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
  flushTransactionBatch(): void;
  setQueryOnlyAfterPopulate(): void;
  checkControlledIndexSize(): bigint;
  assertIndexSizeLimit(): void;
  peakControlledIndexBytes(): bigint;
  controlledIndexFootprintBytes(): bigint;
  checkpointControlledIndexAtSafeBoundary(boundary: string): void;
  fetchMappedBridgeJoinBatch(limit: number, offset: number): MappedBridgeJoinRow[];
  fetchDbDiseaseBatch(limit: number, offset: number): LegacyDbRow[];
  mappedBridgeJoinRowCount(): number;
  assertMappedBridgeJoinInvariant(boundary: string): void;
  /** Synthetic-test only: record an observed peak without reading the filesystem. */
  testOnlyRecordPeakBytes(bytes: bigint): void;
  iterateMappedEntries(): IterableIterator<MappedDedupeEntry>;
  iterateBridgeRows(): IterableIterator<ParsedBridgeRow>;
  iterateDbRows(): IterableIterator<LegacyDbRow>;
  bridgeRowsForDbId(dbId: number): ParsedBridgeRow[];
  addOutputRecord(kind: OutputRecordKind, sortKey: string, json: string): void;
  iterateOutputRecords(kind: OutputRecordKind): IterableIterator<{ json: string }>;
  outputCount(kind: OutputRecordKind): number;
  scalarNumber(sql: string): number;
  close(): void;
  destroy(): void;
};

export const OUTPUT_RECORD_KINDS = ['disease', 'mapped', 'relationship', 'unresolved'] as const;
export type OutputRecordKind = (typeof OUTPUT_RECORD_KINDS)[number];

function safeJsonArray(value: string, label: string): unknown[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', `${label} must be a JSON array`);
  }
  return parsed;
}

function formatFailClosedMessage(reason: string, cleanupFailure: string | null): string {
  return formatFailClosedCleanupMessage(reason, cleanupFailure);
}

export function createProductionBuildIndex(
  dir: string,
  options: IndexMode = {},
): ProductionBuildIndex {
  mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'production-build-index.sqlite');
  const indexOwnership = createBuilderOwnedDirectoryOwnership('controlled-index', dir, {
    indexDbBasename: CONTROLLED_INDEX_DB_BASENAME,
  });
  const ownsIndexFiles = !existsSync(dbPath);
  const primaryDb = new Database(dbPath);
  // Separate connection for output writes so ordered readers can stay open without
  // "database connection is busy" conflicts during streaming generation.
  let closed = false;
  let queryOnly = false;
  const writeDbPath = dbPath;
  let writeDb = new Database(writeDbPath);
  const BUILDER_BUSY_TIMEOUT_MS = 5_000;
  const CHECKPOINT_MAX_ATTEMPTS = 3;
  const CHECKPOINT_BACKOFF_MS = 10;

  function configureWriteConnection(conn: Database.Database): void {
    conn.pragma(`busy_timeout = ${BUILDER_BUSY_TIMEOUT_MS}`);
    conn.pragma('journal_mode = WAL');
    conn.pragma('synchronous = NORMAL');
    conn.pragma('foreign_keys = ON');
    if (queryOnly) {
      conn.pragma('query_only = ON');
    }
  }

  function configurePrimaryConnection(conn: Database.Database): void {
    conn.pragma(`busy_timeout = ${BUILDER_BUSY_TIMEOUT_MS}`);
    conn.pragma('journal_mode = WAL');
    conn.pragma('synchronous = NORMAL');
    conn.pragma('foreign_keys = ON');
    if (queryOnly) {
      conn.pragma('query_only = ON');
    }
  }

  configurePrimaryConnection(primaryDb);
  configureWriteConnection(writeDb);
  primaryDb.exec(`
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
      kind TEXT NOT NULL CHECK (kind IN ('disease','mapped','relationship','unresolved')),
      sort_key TEXT NOT NULL,
      json TEXT NOT NULL,
      PRIMARY KEY (kind, sort_key)
    ) STRICT;
  `);

  const insertDb = primaryDb.prepare('INSERT INTO db_disease(id, icd10_code) VALUES (?, ?)');
  const insertMapped = primaryDb.prepare(
    'INSERT OR IGNORE INTO mapped_entry(dedupe_key, source_label, code_raw, provenance_json) VALUES (?, ?, ?, ?)',
  );
  const insertBridge = primaryDb.prepare(
    `INSERT INTO bridge_entry
      (dedupe_key, source_label, code_raw, normalized_identity_key, disposition, candidates_json)
      VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertCandidate = primaryDb.prepare(
    'INSERT INTO bridge_candidate(db_id, dedupe_key) VALUES (?, ?)',
  );
  const insertBridgeTransaction = primaryDb.transaction((row: ParsedBridgeRow) => {
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
  const setMetaStatement = primaryDb.prepare(
    'INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
  );
  const incrementMappedRaw = primaryDb.prepare(
    `INSERT INTO meta(key, value) VALUES ('mappedRawRows', '1')
     ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(value AS INTEGER) + 1 AS TEXT)`,
  );
  let addOutput = writeDb.prepare(
    'INSERT INTO output_record(kind, sort_key, json) VALUES (?, ?, ?)',
  );
  const fetchMappedBridgeJoinBatchStmt = primaryDb.prepare(
    `SELECT m.dedupe_key, m.source_label, m.code_raw, m.provenance_json,
            b.normalized_identity_key, b.disposition, b.candidates_json
     FROM mapped_entry m
     INNER JOIN bridge_entry b ON b.dedupe_key = m.dedupe_key
     ORDER BY m.dedupe_key
     LIMIT ? OFFSET ?`,
  );
  const fetchDbDiseaseBatchStmt = primaryDb.prepare(
    'SELECT id, icd10_code FROM db_disease ORDER BY id LIMIT ? OFFSET ?',
  );

  let peakControlledIndexBytes = 0n;
  let mutationsSinceSizeCheck = 0;
  let inputBatchRows = 0;
  let inputTransactionOpen = false;
  let activeReadScopes = 0;
  const TRANSACTION_BATCH_ROWS = CONTROLLED_INDEX_OUTPUT_BATCH_ROWS;
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
  const maxIndexBytes =
    configured.mode === 'synthetic-test' && typeof options.maxControlledIndexBytes === 'number'
      ? options.maxControlledIndexBytes
      : MAX_CONTROLLED_INDEX_BYTES;
  const checkpointThresholdBytes =
    BigInt(maxIndexBytes) - BigInt(CONTROLLED_INDEX_CHECKPOINT_HEADROOM_BYTES);
  const testCleanupRmSync =
    configured.mode === 'synthetic-test' && 'testCleanupHooks' in options
      ? options.testCleanupHooks?.rmSyncImpl
      : undefined;

  function removeOwnedIndexDirectory(): string | null {
    return removeBuilderOwnedDirectory(dir, {
      ownership: indexOwnership,
      rmSyncImpl: testCleanupRmSync,
    });
  }

  function count(table: string): number {
    return Number(
      (primaryDb.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as SqlRow).count,
    );
  }

  function controlledIndexBytes(): bigint {
    return [dbPath, `${dbPath}-wal`, `${dbPath}-shm`, `${dbPath}-journal`].reduce(
      (total, file) => total + (existsSync(file) ? BigInt(statSync(file).size) : 0n),
      0n,
    );
  }

  function recordPeak(bytes: bigint): void {
    if (bytes > peakControlledIndexBytes) {
      peakControlledIndexBytes = bytes;
    }
  }

  function closeOwnedConnections(): void {
    if (inputTransactionOpen) {
      try {
        primaryDb.exec('ROLLBACK');
      } catch {
        // Continue fail-closed cleanup.
      }
      inputTransactionOpen = false;
      inputBatchRows = 0;
    }
    if (!closed) {
      closeWriteConnection();
      try {
        primaryDb.close();
      } catch {
        // Continue removing only the owned index directory.
      }
      closed = true;
    }
  }

  function failClosedOnIndexSize(reason: string): never {
    closeOwnedConnections();
    const cleanupFailure = ownsIndexFiles && existsSync(dir) ? removeOwnedIndexDirectory() : null;
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      formatFailClosedMessage(reason, cleanupFailure),
    );
  }

  function enforceControlledIndexCap(context: string): bigint {
    const bytes = controlledIndexBytes();
    recordPeak(bytes);
    if (bytes > BigInt(maxIndexBytes) || peakControlledIndexBytes > BigInt(maxIndexBytes)) {
      failClosedOnIndexSize(
        `${context}: production build index exceeds MAX_CONTROLLED_INDEX_BYTES (${maxIndexBytes})`,
      );
    }
    return bytes;
  }

  function checkControlledIndexSize(): bigint {
    if (closed) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Controlled index already closed');
    }
    return enforceControlledIndexCap('Controlled index size check');
  }

  function closeWriteConnection(): void {
    try {
      writeDb.close();
    } catch {
      // Continue checkpoint on the primary reader connection.
    }
  }

  function reopenWriteConnection(): void {
    if (closed) {
      return;
    }
    writeDb = new Database(writeDbPath);
    configureWriteConnection(writeDb);
    addOutput = writeDb.prepare('INSERT INTO output_record(kind, sort_key, json) VALUES (?, ?, ?)');
  }

  function runWalCheckpointTruncate(boundary: string): WalCheckpointResult {
    closeWriteConnection();
    try {
      for (let attempt = 1; attempt <= CHECKPOINT_MAX_ATTEMPTS; attempt += 1) {
        let result: unknown;
        try {
          result = primaryDb.pragma('wal_checkpoint(TRUNCATE)', { simple: false });
        } catch {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            `${boundary}: controlled index WAL checkpoint is unavailable on builder-owned index`,
          );
        }
        try {
          return validateWalCheckpointResult(result, boundary);
        } catch (error) {
          const busy =
            error instanceof DiseaseIdentityError &&
            error.message.includes('checkpoint busy (active reader/writer)');
          if (busy && attempt < CHECKPOINT_MAX_ATTEMPTS) {
            sleepSync(CHECKPOINT_BACKOFF_MS * attempt);
            continue;
          }
          throw error;
        }
      }
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `${boundary}: controlled index WAL checkpoint failed`,
      );
    } finally {
      if (!closed) {
        reopenWriteConnection();
      }
    }
  }

  function checkpointControlledIndexAtSafeBoundary(boundary: string): void {
    if (closed) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Controlled index already closed');
    }
    if (activeReadScopes > 0) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `${boundary}: controlled index checkpoint blocked while read scope active`,
      );
    }
    const before = enforceControlledIndexCap(`${boundary}: pre-checkpoint`);
    const shouldCheckpoint =
      before >= checkpointThresholdBytes ||
      boundary === 'after-mapped-bridge-output' ||
      boundary === 'after-output-population' ||
      boundary === 'final-compact-assertion' ||
      boundary.endsWith('-batch');
    if (!shouldCheckpoint) {
      return;
    }
    runWalCheckpointTruncate(boundary);
    enforceControlledIndexCap(`${boundary}: post-checkpoint`);
  }

  function beginInputTransaction(): void {
    if (!inputTransactionOpen) {
      primaryDb.exec('BEGIN IMMEDIATE');
      inputTransactionOpen = true;
    }
  }

  function flushInputTransaction(): void {
    if (inputTransactionOpen) {
      primaryDb.exec('COMMIT');
      inputTransactionOpen = false;
      inputBatchRows = 0;
      checkControlledIndexSize();
    }
  }

  function afterInputMutation(): void {
    inputBatchRows += 1;
    if (inputBatchRows >= TRANSACTION_BATCH_ROWS) {
      flushInputTransaction();
    }
  }

  function afterOutputMutation(): void {
    mutationsSinceSizeCheck += 1;
    if (mutationsSinceSizeCheck >= TRANSACTION_BATCH_ROWS) {
      mutationsSinceSizeCheck = 0;
      checkControlledIndexSize();
    }
  }

  const api: ProductionBuildIndex = {
    get db(): Database.Database {
      return primaryDb;
    },
    dbPath,
    mode: configured.mode,
    insertDbRow(row: LegacyDbRow) {
      checkControlledIndexSize();
      beginInputTransaction();
      insertDb.run(row.id, row.icd10_code);
      afterInputMutation();
    },
    insertMappedRow(row: MappedJsonRow) {
      checkControlledIndexSize();
      beginInputTransaction();
      const dedupeKey = mappedRawKey(row.source, row.code);
      const variant = { mappedCodeRaw: row.code, mappedSourceLabel: row.source };
      const existing = primaryDb
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
          primaryDb
            .prepare(
              'UPDATE mapped_entry SET source_label = ?, code_raw = ?, provenance_json = ? WHERE dedupe_key = ?',
            )
            .run(
              variants[0]!.mappedSourceLabel,
              variants[0]!.mappedCodeRaw,
              canonicalJsonString(variants),
              dedupeKey,
            );
        }
      }
      incrementMappedRaw.run();
      afterInputMutation();
    },
    insertBridgeRow(row: ParsedBridgeRow) {
      checkControlledIndexSize();
      beginInputTransaction();
      insertBridgeTransaction(row);
      afterInputMutation();
    },
    setMeta(key: string, value: string) {
      setMetaStatement.run(key, value);
    },
    getMeta(key: string) {
      const row = primaryDb.prepare('SELECT value FROM meta WHERE key = ?').get(key) as
        SqlRow | undefined;
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
    flushTransactionBatch() {
      flushInputTransaction();
    },
    setQueryOnlyAfterPopulate() {
      flushInputTransaction();
      checkControlledIndexSize();
      primaryDb.pragma('optimize');
      checkControlledIndexSize();
      primaryDb.pragma('query_only = ON');
      writeDb.pragma('query_only = ON');
      queryOnly = true;
    },
    checkControlledIndexSize,
    controlledIndexFootprintBytes() {
      return controlledIndexBytes();
    },
    checkpointControlledIndexAtSafeBoundary(boundary: string) {
      checkpointControlledIndexAtSafeBoundary(boundary);
    },
    fetchMappedBridgeJoinBatch(limit: number, offset: number) {
      const rows = fetchMappedBridgeJoinBatchStmt.all(limit, offset) as SqlRow[];
      return rows.map((row) => ({
        dedupeKey: String(row.dedupe_key),
        mappedSourceLabel: String(row.source_label),
        mappedCodeRaw: String(row.code_raw),
        provenanceVariants: safeJsonArray(
          String(row.provenance_json),
          'mapped provenance',
        ) as MappedDedupeEntry['provenanceVariants'],
        normalizedIdentityKey:
          row.normalized_identity_key === null ? null : String(row.normalized_identity_key),
        disposition: String(row.disposition) as ParsedBridgeRow['disposition'],
        candidateLegacyDbIds: safeJsonArray(
          String(row.candidates_json),
          'bridge candidates',
        ) as number[],
      }));
    },
    fetchDbDiseaseBatch(limit: number, offset: number) {
      const rows = fetchDbDiseaseBatchStmt.all(limit, offset) as SqlRow[];
      return rows.map((row) => ({
        id: Number(row.id),
        icd10_code: row.icd10_code === null ? null : String(row.icd10_code),
      }));
    },
    mappedBridgeJoinRowCount() {
      return Number(
        (
          primaryDb
            .prepare(
              `SELECT COUNT(*) AS count FROM mapped_entry m
               INNER JOIN bridge_entry b ON b.dedupe_key = m.dedupe_key`,
            )
            .get() as SqlRow
        ).count,
      );
    },
    assertMappedBridgeJoinInvariant(boundary: string) {
      if (closed) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Controlled index already closed');
      }
      const mapped = count('mapped_entry');
      const bridge = count('bridge_entry');
      const joined = api.mappedBridgeJoinRowCount();
      if (mapped !== bridge || mapped !== joined || bridge !== joined) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `${boundary}: mapped/bridge join reconciliation failed (counts mapped=${mapped} bridge=${bridge} joined=${joined})`,
        );
      }
    },
    peakControlledIndexBytes() {
      return peakControlledIndexBytes;
    },
    assertIndexSizeLimit() {
      checkControlledIndexSize();
      const peakBeforeCheckpoint = peakControlledIndexBytes;
      checkpointControlledIndexAtSafeBoundary('final-compact-assertion');
      if (
        peakBeforeCheckpoint > BigInt(maxIndexBytes) ||
        peakControlledIndexBytes > BigInt(maxIndexBytes)
      ) {
        failClosedOnIndexSize(
          `Production build index peak exceeds MAX_CONTROLLED_INDEX_BYTES (${maxIndexBytes})`,
        );
      }
    },
    testOnlyRecordPeakBytes(bytes: bigint) {
      if (configured.mode !== 'synthetic-test') {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          'testOnlyRecordPeakBytes is synthetic-test only',
        );
      }
      recordPeak(bytes);
    },
    *iterateMappedEntries() {
      activeReadScopes += 1;
      try {
        const rows = primaryDb
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
      } finally {
        activeReadScopes -= 1;
      }
    },
    *iterateBridgeRows() {
      activeReadScopes += 1;
      try {
        const rows = primaryDb
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
      } finally {
        activeReadScopes -= 1;
      }
    },
    *iterateDbRows() {
      activeReadScopes += 1;
      try {
        const rows = primaryDb
          .prepare('SELECT id, icd10_code FROM db_disease ORDER BY id')
          .iterate() as IterableIterator<SqlRow>;
        for (const row of rows) {
          yield {
            id: Number(row.id),
            icd10_code: row.icd10_code === null ? null : String(row.icd10_code),
          };
        }
      } finally {
        activeReadScopes -= 1;
      }
    },
    bridgeRowsForDbId(dbId: number) {
      const rows = primaryDb
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
    addOutputRecord(kind: OutputRecordKind, sortKey: string, json: string) {
      if (!(OUTPUT_RECORD_KINDS as readonly string[]).includes(kind)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Unknown output_record kind: ${kind}`);
      }
      checkControlledIndexSize();
      if (queryOnly) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          'Cannot populate output records after query-only activation',
        );
      }
      addOutput.run(kind, sortKey, json);
      afterOutputMutation();
    },
    *iterateOutputRecords(kind: OutputRecordKind) {
      if (!(OUTPUT_RECORD_KINDS as readonly string[]).includes(kind)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Unknown output_record kind: ${kind}`);
      }
      yield* primaryDb
        .prepare('SELECT json FROM output_record WHERE kind = ? ORDER BY sort_key')
        .iterate(kind) as IterableIterator<{ json: string }>;
    },
    outputCount(kind: OutputRecordKind) {
      if (!(OUTPUT_RECORD_KINDS as readonly string[]).includes(kind)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Unknown output_record kind: ${kind}`);
      }
      return Number(
        (
          primaryDb
            .prepare('SELECT COUNT(*) AS count FROM output_record WHERE kind = ?')
            .get(kind) as SqlRow
        ).count,
      );
    },
    scalarNumber(sql: string) {
      const row = primaryDb.prepare(sql).get() as SqlRow | undefined;
      if (!row) return 0;
      return Number(Object.values(row)[0] ?? 0);
    },
    close() {
      closeOwnedConnections();
    },
    destroy() {
      api.close();
      removeOwnedIndexDirectory();
    },
  };
  return api;
}
