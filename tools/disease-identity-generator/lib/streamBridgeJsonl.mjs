import { createReadStream } from 'node:fs';
import readline from 'node:readline';
import { parseBridgeJsonlRow } from '../../../packages/disease-identity/dist/bridgeIngest.js';

export async function collectBridgeRows(filePath) {
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
    lineNumber += 1;
    rows.push(parseBridgeJsonlRow(JSON.parse(line), lineNumber));
  }
  return rows;
}
