import { createReadStream } from 'node:fs';
import readline from 'node:readline';
import {
  EXPECTED_BRIDGE_ROW_COUNT,
  parseBridgeJsonlRow,
  DiseaseIdentityError,
} from '../../../packages/disease-identity/dist/index.js';

export const MAX_BRIDGE_LINE_BYTES = 64 * 1024;
export const MAX_BRIDGE_ROWS = EXPECTED_BRIDGE_ROW_COUNT;

export async function collectBridgeRows(filePath, options = {}) {
  const maxLineBytes = options.maxLineBytes ?? MAX_BRIDGE_LINE_BYTES;
  const maxRows = options.maxRows ?? MAX_BRIDGE_ROWS;
  const rows = [];
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
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
  return rows;
}
