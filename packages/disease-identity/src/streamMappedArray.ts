import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { Transform } from 'node:stream';
import { DiseaseIdentityError } from './errors.js';
import {
  createMappedDedupeBuckets,
  dedupeMappedRowsFromBuckets,
  parseMappedJsonRow,
  type MappedDedupeEntry,
  type MappedJsonRow,
} from './mappedIngest.js';

/** Max UTF-8 bytes for a single top-level mapped object (source/code only retained after parse). */
export const MAX_MAPPED_OBJECT_BYTES = 256 * 1024;

const VALID_SINGLE_ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't']);

type ParserState =
  | 'SEEK_ARRAY'
  | 'IN_ARRAY'
  | 'IN_OBJECT'
  | 'IN_STRING'
  | 'IN_STRING_ESCAPE'
  | 'IN_UNICODE_ESCAPE'
  | 'AFTER_ARRAY';

function isHexDigit(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
}

/**
 * String-aware streaming extractor for a single top-level JSON array of objects.
 * Chunk-boundary safe: unfinished objects (including mid-string / mid-escape /
 * mid-unicode-escape) are retained across chunks. Invalid JSON escapes are rejected.
 */
export async function* streamMappedJsonArrayFromAsyncIterable(
  chunks: AsyncIterable<string>,
  options?: { maxObjectBytes?: number },
): AsyncGenerator<MappedJsonRow> {
  const maxObjectBytes = options?.maxObjectBytes ?? MAX_MAPPED_OBJECT_BYTES;
  let state: ParserState = 'SEEK_ARRAY';
  let buffer = '';
  let objectStart = -1;
  let depth = 0;
  let arrayDepth = 0;
  let rowNumber = 0;
  let sawArrayEnd = false;
  let scanFrom = 0;
  let hexDigitsRemaining = 0;

  for await (const chunk of chunks) {
    buffer += chunk;
    let i = scanFrom;
    while (i < buffer.length) {
      const ch = buffer[i]!;

      if (state === 'SEEK_ARRAY') {
        if (/\s/.test(ch)) {
          i += 1;
          continue;
        }
        if (ch === '[') {
          state = 'IN_ARRAY';
          i += 1;
          continue;
        }
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          'mapped.json must start with a top-level JSON array',
        );
      }

      if (state === 'AFTER_ARRAY') {
        if (/\s/.test(ch)) {
          i += 1;
          continue;
        }
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Trailing data after mapped.json array');
      }

      if (state === 'IN_STRING') {
        if (ch === '\\') {
          state = 'IN_STRING_ESCAPE';
        } else if (ch === '"') {
          state = 'IN_OBJECT';
        }
        i += 1;
        continue;
      }

      if (state === 'IN_STRING_ESCAPE') {
        if (ch === 'u') {
          state = 'IN_UNICODE_ESCAPE';
          hexDigitsRemaining = 4;
          i += 1;
          continue;
        }
        if (!VALID_SINGLE_ESCAPES.has(ch)) {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            `Invalid JSON string escape \\${ch} in mapped.json`,
          );
        }
        state = 'IN_STRING';
        i += 1;
        continue;
      }

      if (state === 'IN_UNICODE_ESCAPE') {
        if (!isHexDigit(ch)) {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            'Invalid JSON unicode escape in mapped.json',
          );
        }
        hexDigitsRemaining -= 1;
        i += 1;
        if (hexDigitsRemaining === 0) {
          state = 'IN_STRING';
        }
        continue;
      }

      if (state === 'IN_ARRAY') {
        if (/\s|,/.test(ch)) {
          i += 1;
          continue;
        }
        if (ch === ']') {
          sawArrayEnd = true;
          state = 'AFTER_ARRAY';
          i += 1;
          continue;
        }
        if (ch === '{') {
          state = 'IN_OBJECT';
          depth = 1;
          arrayDepth = 0;
          objectStart = i;
          i += 1;
          continue;
        }
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unexpected token in mapped.json array');
      }

      // IN_OBJECT (outside strings) — track nested braces/brackets for ignored fields.
      if (ch === '"') {
        state = 'IN_STRING';
        i += 1;
        continue;
      }
      if (ch === '{') {
        depth += 1;
        i += 1;
        continue;
      }
      if (ch === '[') {
        arrayDepth += 1;
        i += 1;
        continue;
      }
      if (ch === ']') {
        arrayDepth -= 1;
        if (arrayDepth < 0) {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            'Malformed nested array in mapped.json object',
          );
        }
        i += 1;
        continue;
      }
      if (ch === '}') {
        depth -= 1;
        if (depth < 0) {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            'Malformed nested object in mapped.json',
          );
        }
        if (depth === 0) {
          if (arrayDepth !== 0) {
            throw new DiseaseIdentityError(
              'MALFORMED_INPUT',
              'Malformed nesting in mapped.json object',
            );
          }
          const objectText = buffer.slice(objectStart, i + 1);
          const byteLen = Buffer.byteLength(objectText, 'utf8');
          if (byteLen > maxObjectBytes) {
            throw new DiseaseIdentityError(
              'MALFORMED_INPUT',
              `Mapped object exceeds maxObjectBytes (${maxObjectBytes})`,
            );
          }
          let raw: unknown;
          try {
            raw = JSON.parse(objectText);
          } catch {
            throw new DiseaseIdentityError(
              'MALFORMED_INPUT',
              `Malformed mapped.json object at row ${rowNumber + 1}`,
            );
          }
          if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new DiseaseIdentityError(
              'MALFORMED_INPUT',
              `Mapped row must be an object at ${rowNumber + 1}`,
            );
          }
          rowNumber += 1;
          yield parseMappedJsonRow(raw as Record<string, unknown>, rowNumber);
          buffer = buffer.slice(i + 1);
          objectStart = -1;
          i = 0;
          scanFrom = 0;
          state = 'IN_ARRAY';
          continue;
        }
        i += 1;
        continue;
      }
      i += 1;
    }

    // Chunk boundary: retain unfinished object across IN_OBJECT / string / escape states.
    const inUnfinishedObject =
      objectStart >= 0 &&
      (state === 'IN_OBJECT' ||
        state === 'IN_STRING' ||
        state === 'IN_STRING_ESCAPE' ||
        state === 'IN_UNICODE_ESCAPE');

    if (inUnfinishedObject) {
      buffer = buffer.slice(objectStart);
      objectStart = 0;
      scanFrom = buffer.length;
      if (Buffer.byteLength(buffer, 'utf8') > maxObjectBytes) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Mapped object exceeds maxObjectBytes (${maxObjectBytes})`,
        );
      }
    } else {
      buffer = buffer.slice(i);
      scanFrom = 0;
    }
  }

  if (!sawArrayEnd || state !== 'AFTER_ARRAY') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'mapped.json array not closed or incomplete');
  }
  if (buffer.trim().length > 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Trailing data after mapped.json array');
  }
}

/**
 * File-based wrapper — does not retain clinical fields beyond parseMappedJsonRow.
 */
export async function* streamMappedJsonArrayObjects(
  filePath: string,
  options?: { maxObjectBytes?: number },
): AsyncGenerator<MappedJsonRow> {
  const stream = createReadStream(filePath, { encoding: 'utf8' });
  yield* streamMappedJsonArrayFromAsyncIterable(stream, options);
}

/**
 * Stream mapped.json into bounded dedupe buckets without retaining the full raw row array.
 * Peak memory ≈ unique-key bucket map (expected ≤ 50,544) + one object buffer.
 */
export async function streamDedupeMappedJsonFile(
  filePath: string,
  options?: {
    expectedRawRows?: number;
    expectedUniqueKeys?: number;
    maxObjectBytes?: number;
  },
): Promise<MappedDedupeEntry[]> {
  const buckets = createMappedDedupeBuckets();
  let rawCount = 0;
  for await (const row of streamMappedJsonArrayObjects(filePath, {
    maxObjectBytes: options?.maxObjectBytes,
  })) {
    rawCount += 1;
    buckets.add(row);
  }
  return dedupeMappedRowsFromBuckets(buckets, rawCount, options);
}

/**
 * Parse and hash the exact same byte stream. Production callers provide onRow
 * to persist immediately into SQLite; in that mode no mapped-entry array or
 * corpus-sized dedupe map is created in JavaScript.
 */
export async function streamDedupeMappedJsonFileWithConsumedDigest(
  filePath: string,
  options?: {
    expectedRawRows?: number;
    expectedUniqueKeys?: number;
    maxObjectBytes?: number;
    onRow?: (row: MappedJsonRow) => void | Promise<void>;
    getUniqueKeyCount?: () => number;
  },
): Promise<{
  entries: MappedDedupeEntry[] | null;
  consumedSha256: string;
  consumedBytes: number;
  rawRowCount: number;
  uniqueKeyCount: number;
}> {
  const hash = createHash('sha256');
  let consumedBytes = 0;
  const input = createReadStream(filePath);
  const hashing = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      hash.update(chunk);
      consumedBytes += chunk.byteLength;
      callback(null, chunk);
    },
  });
  input.on('error', (error) => hashing.destroy(error));
  input.pipe(hashing);
  hashing.setEncoding('utf8');

  const buckets = options?.onRow ? null : createMappedDedupeBuckets();
  let rawRowCount = 0;
  try {
    for await (const row of streamMappedJsonArrayFromAsyncIterable(hashing, {
      maxObjectBytes: options?.maxObjectBytes,
    })) {
      rawRowCount += 1;
      if (options?.onRow) {
        await options.onRow(row);
      } else {
        buckets!.add(row);
      }
    }
  } catch (error) {
    input.destroy();
    hashing.destroy();
    throw error;
  }

  let entries: MappedDedupeEntry[] | null = null;
  let uniqueKeyCount: number;
  if (buckets) {
    entries = dedupeMappedRowsFromBuckets(buckets, rawRowCount, options);
    uniqueKeyCount = entries.length;
  } else {
    uniqueKeyCount = options?.getUniqueKeyCount?.() ?? -1;
    if (options?.expectedRawRows !== undefined && rawRowCount !== options.expectedRawRows) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Expected ${options.expectedRawRows} mapped.json rows, observed ${rawRowCount}`,
      );
    }
    if (
      options?.expectedUniqueKeys !== undefined &&
      uniqueKeyCount !== options.expectedUniqueKeys
    ) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Expected ${options.expectedUniqueKeys} unique mapped keys, observed ${uniqueKeyCount}`,
      );
    }
  }

  return {
    entries,
    consumedSha256: hash.digest('hex'),
    consumedBytes,
    rawRowCount,
    uniqueKeyCount,
  };
}
