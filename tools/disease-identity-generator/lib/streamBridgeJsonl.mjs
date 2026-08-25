import { createReadStream, createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import readline from 'node:readline';
import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import {
  EXPECTED_BRIDGE_ROW_COUNT,
  parseBridgeJsonlRow,
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

/**
 * Stream bridge JSONL into an index Map by dedupeKey and Map dbId->evidence,
 * writing a JSONL spool. Stores ParsedBridgeRow in maps only once (no raw rows array).
 */
export async function streamBridgeToIndex(filePath, spoolPath, options = {}) {
  const maxLineBytes = options.maxLineBytes ?? MAX_BRIDGE_LINE_BYTES;
  const maxRows = options.maxRows ?? MAX_BRIDGE_ROWS;
  const expectedSha256 = options.expectedSha256 ?? null;

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
    const parsed = parseBridgeJsonlRow(JSON.parse(line), lineNumber);
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
      let raw;
      try {
        raw = JSON.parse(line);
      } catch {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Malformed bridge JSON at line ${rowCount}`,
        );
      }
      index.insertBridgeRow(parseBridgeJsonlRow(raw, rowCount));
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
    rows.push(parseBridgeJsonlRow(JSON.parse(line), lineNumber));
  }
  const consumedSha256 = hash.digest('hex');
  if (options.expectedSha256) {
    await assertConsumedByteDigest(consumedSha256, options.expectedSha256, 'bridge');
  }
  return rows;
}
