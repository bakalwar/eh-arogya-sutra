import { createHash, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  MAGIC_PREFIX_MAX_BYTES,
  MAX_EVIDENCE_BYTES,
  STREAMING_STAGING_CLASSIFICATION,
} from './types.js';

export class StreamIngestError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = 'StreamIngestError';
    this.code = code;
  }
}

export type StagedEvidenceBytes = {
  classification: typeof STREAMING_STAGING_CLASSIFICATION;
  productionReady: false;
  size: number;
  sha256: string;
  prefix: Buffer;
  readAll(): Promise<Buffer>;
  chunks(): AsyncIterable<Uint8Array>;
  dispose(): Promise<void>;
};

const openStaging = new Set<string>();
let stagingRoot: string | null = null;

export function stagingOpenCount(): number {
  return openStaging.size;
}

async function ensureStagingRoot(): Promise<string> {
  if (stagingRoot) return stagingRoot;
  const dir = join(tmpdir(), 'ehas2-evidence-staging');
  await mkdir(dir, { recursive: true, mode: 0o700 });
  try {
    await chmod(dir, 0o700);
  } catch {
    /* Windows may ignore mode */
  }
  stagingRoot = dir;
  return dir;
}

async function unlinkQuiet(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch {
    /* already gone */
  }
  openStaging.delete(path);
}

export async function disposeAllStagingForTests(): Promise<void> {
  const paths = [...openStaging];
  await Promise.all(paths.map((p) => unlinkQuiet(p)));
}

function parseDeclaredLength(declaredLength: number | null | undefined): number | null {
  if (declaredLength == null) return null;
  if (!Number.isFinite(declaredLength) || declaredLength < 0) return null;
  return Math.floor(declaredLength);
}

export async function* bytesAsStream(bytes: Uint8Array): AsyncGenerator<Uint8Array> {
  yield bytes;
}

export async function stageBoundedStream(input: {
  body: AsyncIterable<Uint8Array>;
  maxBytes?: number;
  declaredLength?: number | null;
  signal?: AbortSignal;
}): Promise<StagedEvidenceBytes> {
  const maxBytes = input.maxBytes ?? MAX_EVIDENCE_BYTES;
  const declared = parseDeclaredLength(input.declaredLength);
  if (declared != null && declared > maxBytes) {
    throw new StreamIngestError('SIZE_REJECTED');
  }

  const dir = await ensureStagingRoot();
  const filePath = join(dir, `ehas2-${randomBytes(16).toString('hex')}.part`);
  openStaging.add(filePath);
  const hash = createHash('sha256');
  const prefixChunks: Buffer[] = [];
  let prefixLen = 0;
  let size = 0;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  let disposed = false;

  const dispose = async (): Promise<void> => {
    if (disposed) return;
    disposed = true;
    if (handle) {
      try {
        await handle.close();
      } catch {
        /* ignore */
      }
      handle = null;
    }
    await unlinkQuiet(filePath);
  };

  try {
    if (input.signal?.aborted) {
      throw new StreamIngestError('STREAM_ABORTED');
    }
    handle = await open(filePath, 'w', 0o600);
    try {
      await chmod(filePath, 0o600);
    } catch {
      /* Windows may ignore mode */
    }

    const onAbort = (): void => {
      /* cooperative; loop checks signal */
    };
    input.signal?.addEventListener('abort', onAbort, { once: true });

    try {
      for await (const chunk of input.body) {
        if (input.signal?.aborted) {
          throw new StreamIngestError('STREAM_ABORTED');
        }
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (buf.length === 0) continue;
        size += buf.length;
        if (declared != null && size > declared) {
          throw new StreamIngestError('CONTENT_LENGTH_MISMATCH');
        }
        if (size > maxBytes) {
          throw new StreamIngestError('SIZE_REJECTED');
        }
        hash.update(buf);
        if (prefixLen < MAGIC_PREFIX_MAX_BYTES) {
          const take = Math.min(MAGIC_PREFIX_MAX_BYTES - prefixLen, buf.length);
          prefixChunks.push(buf.subarray(0, take));
          prefixLen += take;
        }
        await handle.write(buf);
      }
    } finally {
      input.signal?.removeEventListener('abort', onAbort);
    }

    if (input.signal?.aborted) {
      throw new StreamIngestError('STREAM_ABORTED');
    }
    if (size === 0) {
      throw new StreamIngestError('EMPTY_FILE');
    }
    if (declared != null && size !== declared) {
      throw new StreamIngestError('CONTENT_LENGTH_MISMATCH');
    }

    await handle.close();
    handle = null;
    const sha256 = hash.digest('hex');
    const prefix = Buffer.concat(prefixChunks);

    return {
      classification: STREAMING_STAGING_CLASSIFICATION,
      productionReady: false,
      size,
      sha256,
      prefix,
      async readAll() {
        return readFile(filePath);
      },
      chunks() {
        return createReadStream(filePath);
      },
      dispose,
    };
  } catch (err) {
    await dispose();
    throw err;
  }
}
