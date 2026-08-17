import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  MAX_EVIDENCE_BYTES,
  STREAMING_STAGING_CLASSIFICATION,
  UnavailableObjectStore,
  bytesAsStream,
  disposeAllStagingForTests,
  stageBoundedStream,
  stagingOpenCount,
  StreamIngestError,
  validateEvidenceBytes,
} from '../../packages/evidence-ingest/src/index.ts';

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

afterEach(async () => {
  await disposeAllStagingForTests();
});

describe('F2A streaming ingest', () => {
  it('rejects 0-byte streams', async () => {
    async function* empty() {
      yield Buffer.alloc(0);
    }
    await expect(stageBoundedStream({ body: empty() })).rejects.toBeInstanceOf(StreamIngestError);
    await expect(stageBoundedStream({ body: empty() })).rejects.toMatchObject({
      code: 'EMPTY_FILE',
    });
    expect(stagingOpenCount()).toBe(0);
  });

  it('accepts exact 10 MiB and rejects one extra byte', async () => {
    const exact = Buffer.alloc(MAX_EVIDENCE_BYTES, 1);
    const staged = await stageBoundedStream({ body: bytesAsStream(exact) });
    expect(staged.size).toBe(MAX_EVIDENCE_BYTES);
    expect(staged.classification).toBe(STREAMING_STAGING_CLASSIFICATION);
    expect(staged.productionReady).toBe(false);
    await staged.dispose();
    const over = Buffer.alloc(MAX_EVIDENCE_BYTES + 1, 1);
    await expect(stageBoundedStream({ body: bytesAsStream(over) })).rejects.toMatchObject({
      code: 'SIZE_REJECTED',
    });
    expect(stagingOpenCount()).toBe(0);
  });

  it('does not trust missing or dishonest Content-Length', async () => {
    const staged = await stageBoundedStream({
      body: bytesAsStream(PNG),
      declaredLength: null,
    });
    expect(staged.size).toBe(PNG.length);
    await staged.dispose();
    await expect(
      stageBoundedStream({ body: bytesAsStream(PNG), declaredLength: MAX_EVIDENCE_BYTES + 1 }),
    ).rejects.toMatchObject({ code: 'SIZE_REJECTED' });
    await expect(
      stageBoundedStream({ body: bytesAsStream(PNG), declaredLength: 4 }),
    ).rejects.toMatchObject({ code: 'CONTENT_LENGTH_MISMATCH' });
    expect(stagingOpenCount()).toBe(0);
  });

  it('cleans up on mid-stream abort', async () => {
    const ac = new AbortController();
    async function* hang() {
      yield PNG.subarray(0, 8);
      ac.abort();
      yield PNG.subarray(8);
    }
    await expect(stageBoundedStream({ body: hang(), signal: ac.signal })).rejects.toMatchObject({
      code: 'STREAM_ABORTED',
    });
    expect(stagingOpenCount()).toBe(0);
  });

  it('computes SHA-256 incrementally and matches full-buffer hash', async () => {
    async function* pieces() {
      yield PNG.subarray(0, 12);
      yield PNG.subarray(12, 40);
      yield PNG.subarray(40);
    }
    const staged = await stageBoundedStream({ body: pieces() });
    const expected = createHash('sha256').update(PNG).digest('hex');
    expect(staged.sha256).toBe(expected);
    const raw = await staged.readAll();
    const validated = validateEvidenceBytes({
      filename: 'lab.png',
      declaredMime: 'image/png',
      bytes: raw,
    });
    expect(validated.ok).toBe(true);
    if (validated.ok) expect(validated.contentSha256).toBe(expected);
    await staged.dispose();
  });

  it('does not auto-open a staging file when putStream throws without consuming', async () => {
    const staged = await stageBoundedStream({ body: bytesAsStream(PNG) });
    const store = new UnavailableObjectStore();
    await expect(store.putStream('ehas2/unconsumed', staged.chunks())).rejects.toMatchObject({
      code: 'STORE_UNAVAILABLE',
    });
    await staged.dispose();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(stagingOpenCount()).toBe(0);
  });
});
