import { createReadStream } from 'node:fs';
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

type ParserState =
  'SEEK_ARRAY' | 'IN_ARRAY' | 'IN_OBJECT' | 'IN_STRING' | 'IN_STRING_ESCAPE' | 'AFTER_ARRAY';

/**
 * String-aware streaming extractor for a single top-level JSON array of objects.
 * Tracks quotes, escapes, and braces inside strings. Does not retain clinical fields —
 * each object is JSON.parsed then reduced via parseMappedJsonRow.
 */
export async function* streamMappedJsonArrayObjects(
  filePath: string,
  options?: { maxObjectBytes?: number },
): AsyncGenerator<MappedJsonRow> {
  const maxObjectBytes = options?.maxObjectBytes ?? MAX_MAPPED_OBJECT_BYTES;
  const stream = createReadStream(filePath, { encoding: 'utf8' });
  let state: ParserState = 'SEEK_ARRAY';
  let buffer = '';
  let objectStart = -1;
  let depth = 0;
  let rowNumber = 0;
  let sawArrayEnd = false;
  let scanFrom = 0;

  for await (const chunk of stream) {
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
        // Consume one escaped character (including \" \\ \/ \b \f \n \r \t or \uXXXX first char).
        // For \uXXXX we only need to skip the backslash+one char here; subsequent hex digits
        // are ordinary string characters and safe for brace tracking.
        state = 'IN_STRING';
        i += 1;
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
          objectStart = i;
          i += 1;
          continue;
        }
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unexpected token in mapped.json array');
      }

      // IN_OBJECT (outside strings)
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
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
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

    if (state === 'IN_OBJECT' && objectStart >= 0) {
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
      // Keep only unconsumed tail (should be empty when array/after-array idle).
      buffer = buffer.slice(i);
      scanFrom = 0;
    }
  }

  if (!sawArrayEnd || (state as string) !== 'AFTER_ARRAY') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'mapped.json array not closed or incomplete');
  }
  if (buffer.trim().length > 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Trailing data after mapped.json array');
  }
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
