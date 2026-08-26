import { createReadStream, createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import readline from 'node:readline';
import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import {
  EXPECTED_BRIDGE_ROW_COUNT,
  parseBridgeRowForSchema,
  parseJsonObjectRejectDuplicateKeys,
  BRIDGE_INGEST_SCHEMA_PINNED_V3,
  BRIDGE_INGEST_SCHEMA_SYNTHETIC,
  DiseaseIdentityError,
  assertConsumedByteDigest,
} from '../../../packages/disease-identity/dist/index.js';

export const MAX_BRIDGE_LINE_BYTES = 64 * 1024;
export const MAX_BRIDGE_ROWS = EXPECTED_BRIDGE_ROW_COUNT;

function createHashingPassThrough(hash) {
  return new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });
}

function resolveBridgeSchema(options = {}) {
  const schema = options.bridgeSchema ?? BRIDGE_INGEST_SCHEMA_PINNED_V3;
  if (schema === BRIDGE_INGEST_SCHEMA_SYNTHETIC) {
    if (options.allowSyntheticBridgeSchema !== true) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Synthetic bridge schema is test-only and cannot enter the production path',
      );
    }
    return schema;
  }
  if (schema !== BRIDGE_INGEST_SCHEMA_PINNED_V3) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Unknown bridge schema mode ${String(schema)}`,
    );
  }
  return schema;
}

function parseBridgeLine(line, lineNumber, schema, options) {
  const raw = parseJsonObjectRejectDuplicateKeys(line, lineNumber);
  return parseBridgeRowForSchema(schema, raw, lineNumber, {
    seenBridgeIds: options.seenBridgeIds,
    allowSyntheticBridgeSchema: options.allowSyntheticBridgeSchema === true,
  });
}

/**
 * Stream bridge JSONL into an index Map by dedupeKey and Map dbId->evidence,
 * writing a JSONL spool. Stores ParsedBridgeRow in maps only once (no raw rows array).
 * Production default: pinned Bridge V3 actual schema.
 */
export async function streamBridgeToIndex(filePath, spoolPath, options = {}) {
  const maxLineBytes = options.maxLineBytes ?? MAX_BRIDGE_LINE_BYTES;
  const maxRows = options.maxRows ?? MAX_BRIDGE_ROWS;
  const expectedSha256 = options.expectedSha256 ?? null;
  const schema = resolveBridgeSchema(options);
  const seenBridgeIds = schema === BRIDGE_INGEST_SCHEMA_PINNED_V3 ? new Set() : undefined;

  const byDedupeKey = new Map();
  const byDbId = new Map();
  const hash = createHash('sha256');
  const hashing = createHashingPassThrough(hash);
  const fileStream = createReadStream(filePath);
  fileStream.pipe(hashing);

  const rl = readline.createInterface({
    input: hashing,
    crlfDelay: Infinity,
  });

  const out = createWriteStream(spoolPath, { encoding: 'utf8' });
  let lineNumber = 0;

  for await (const line of rl) {
    if (line.trim().length === 0) {
      continue;
    }
    if (Buffer.byteLength(line, 'utf8') > maxLineBytes) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Bridge JSONL line exceeds maxLineBytes (${maxLineBytes})`,
      );
    }
    lineNumber += 1;
    if (lineNumber > maxRows) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Bridge JSONL exceeds maxRows (${maxRows})`,
      );
    }
    const parsed = parseBridgeLine(line, lineNumber, schema, {
      seenBridgeIds,
      allowSyntheticBridgeSchema: options.allowSyntheticBridgeSchema,
    });
    if (byDedupeKey.has(parsed.dedupeKey)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate bridge mapped key');
    }
    byDedupeKey.set(parsed.dedupeKey, parsed);
    for (const id of parsed.candidateLegacyDbIds) {
      const bucket = byDbId.get(id) ?? [];
      bucket.push(parsed);
      byDbId.set(id, bucket);
    }
    const spoolLine = `${JSON.stringify({
      mappedSourceLabel: parsed.mappedSourceLabel,
      mappedCodeRaw: parsed.mappedCodeRaw,
      disposition: parsed.disposition,
      candidateLegacyDbIds: parsed.candidateLegacyDbIds,
      dedupeKey: parsed.dedupeKey,
    })}\n`;
    if (!out.write(spoolLine)) {
      await new Promise((resolve) => out.once('drain', resolve));
    }
  }

  out.end();
  await finished(out);

  const consumedHex = hash.digest('hex');
  if (expectedSha256) {
    await assertConsumedByteDigest(consumedHex, expectedSha256, 'bridge');
  }

  return {
    byDedupeKey,
    byDbId,
    rowCount: lineNumber,
    spoolPath,
    consumedSha256: consumedHex,
    rows: () => [...byDedupeKey.values()],
  };
}

/** Production direct-to-SQLite ingest. Retains one parsed bridge line at a time. */
export async function ingestBridgeToBuildIndex(filePath, index, options = {}) {
  const maxLineBytes = options.maxLineBytes ?? MAX_BRIDGE_LINE_BYTES;
  const maxRows = options.maxRows ?? MAX_BRIDGE_ROWS;
  const schema = resolveBridgeSchema(options);
  const seenBridgeIds = schema === BRIDGE_INGEST_SCHEMA_PINNED_V3 ? new Set() : undefined;
  const hash = createHash('sha256');
  let consumedBytes = 0;
  const hashing = new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      consumedBytes += chunk.byteLength;
      callback(null, chunk);
    },
  });
  const fileStream = createReadStream(filePath);
  fileStream.on('error', (error) => hashing.destroy(error));
  fileStream.pipe(hashing);
  const rl = readline.createInterface({ input: hashing, crlfDelay: Infinity });
  let rowCount = 0;
  try {
    for await (const line of rl) {
      if (line.trim().length === 0) continue;
      if (Buffer.byteLength(line, 'utf8') > maxLineBytes) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Bridge JSONL line exceeds maxLineBytes (${maxLineBytes})`,
        );
      }
      rowCount += 1;
      if (rowCount > maxRows) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Bridge JSONL exceeds maxRows (${maxRows})`,
        );
      }
      index.insertBridgeRow(
        parseBridgeLine(line, rowCount, schema, {
          seenBridgeIds,
          allowSyntheticBridgeSchema: options.allowSyntheticBridgeSchema,
        }),
      );
    }
  } catch (error) {
    rl.close();
    fileStream.destroy();
    hashing.destroy();
    throw error;
  }
  const consumedSha256 = hash.digest('hex');
  if (options.expectedSha256) {
    await assertConsumedByteDigest(consumedSha256, options.expectedSha256, 'bridge');
  }
  return { rowCount, consumedSha256, consumedBytes };
}

/** @deprecated Prefer streamBridgeToIndex for production builds. */
export async function collectBridgeRows(filePath, options = {}) {
  const maxLineBytes = options.maxLineBytes ?? MAX_BRIDGE_LINE_BYTES;
  const maxRows = options.maxRows ?? MAX_BRIDGE_ROWS;
  const schema = resolveBridgeSchema(options);
  const seenBridgeIds = schema === BRIDGE_INGEST_SCHEMA_PINNED_V3 ? new Set() : undefined;
  const rows = [];
  const hash = createHash('sha256');
  const hashing = createHashingPassThrough(hash);
  createReadStream(filePath).pipe(hashing);
  const rl = readline.createInterface({
    input: hashing,
    crlfDelay: Infinity,
  });
  let lineNumber = 0;
  for await (const line of rl) {
    if (line.trim().length === 0) {
      continue;
    }
    if (Buffer.byteLength(line, 'utf8') > maxLineBytes) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Bridge JSONL line exceeds maxLineBytes (${maxLineBytes})`,
      );
    }
    lineNumber += 1;
    if (lineNumber > maxRows) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Bridge JSONL exceeds maxRows (${maxRows})`,
      );
    }
    rows.push(
      parseBridgeLine(line, lineNumber, schema, {
        seenBridgeIds,
        allowSyntheticBridgeSchema: options.allowSyntheticBridgeSchema,
      }),
    );
  }
  const consumedSha256 = hash.digest('hex');
  if (options.expectedSha256) {
    await assertConsumedByteDigest(consumedSha256, options.expectedSha256, 'bridge');
  }
  return rows;
}
