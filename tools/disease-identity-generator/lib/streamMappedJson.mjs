import {
  streamDedupeMappedJsonFile,
  streamDedupeMappedJsonFileWithConsumedDigest,
  streamMappedJsonArrayObjects,
  streamMappedJsonArrayFromAsyncIterable,
} from '../../../packages/disease-identity/dist/streamMappedArray.js';

/** @deprecated Prefer streamDedupeMappedJsonFile — does not retain the full raw array. */
export async function* streamMappedJsonRows(filePath) {
  yield* streamMappedJsonArrayObjects(filePath);
}

/** @deprecated Prefer streamDedupeMappedJsonFile for production builds. */
export async function collectMappedJsonRows(filePath) {
  const rows = [];
  for await (const row of streamMappedJsonArrayObjects(filePath)) {
    rows.push(row);
  }
  return rows;
}

export {
  streamDedupeMappedJsonFile,
  streamDedupeMappedJsonFileWithConsumedDigest,
  streamMappedJsonArrayObjects,
  streamMappedJsonArrayFromAsyncIterable,
};
