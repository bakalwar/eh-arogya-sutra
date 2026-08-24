import { createReadStream } from 'node:fs';
import { parseMappedJsonRow } from '../../../packages/disease-identity/dist/mappedIngest.js';

/** Stream a top-level JSON array and yield only source/code fields. */
export async function* streamMappedJsonRows(filePath) {
  const stream = createReadStream(filePath, { encoding: 'utf8' });
  let buffer = '';
  let rowNumber = 0;
  let inArray = false;
  let objectDepth = 0;
  let objectStart = -1;

  for await (const chunk of stream) {
    buffer += chunk;
    let i = 0;
    while (i < buffer.length) {
      const ch = buffer[i];
      if (!inArray) {
        if (ch === '[') {
          inArray = true;
        }
        i += 1;
        continue;
      }
      if (objectDepth === 0) {
        if (ch === '{') {
          objectDepth = 1;
          objectStart = i;
        } else if (ch === ']') {
          buffer = buffer.slice(i + 1);
          return;
        }
        i += 1;
        continue;
      }
      if (ch === '{') {
        objectDepth += 1;
      } else if (ch === '}') {
        objectDepth -= 1;
        if (objectDepth === 0) {
          rowNumber += 1;
          const objectText = buffer.slice(objectStart, i + 1);
          const raw = JSON.parse(objectText);
          yield parseMappedJsonRow(raw, rowNumber);
          buffer = buffer.slice(i + 1);
          i = 0;
          continue;
        }
      }
      i += 1;
    }
    if (objectDepth === 0) {
      buffer = '';
    } else if (objectStart >= 0) {
      buffer = buffer.slice(objectStart);
      objectStart = 0;
    }
  }
}

export async function collectMappedJsonRows(filePath) {
  const rows = [];
  for await (const row of streamMappedJsonRows(filePath)) {
    rows.push(row);
  }
  return rows;
}
