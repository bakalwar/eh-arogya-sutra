import { createHash, randomBytes } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  chmod,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  unlink,
  utimes,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative, sep } from 'node:path';
import {
  EVIDENCE_TTL_MINUTES,
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

export const STAGING_DIR_NAME = 'ehas2-evidence-staging';
export const STAGING_PART_RE = /^ehas2-[0-9a-f]{32}\.part$/;
export const STAGING_SWEEP_LIMIT = 50;
export const STAGING_SWEEP_MAX_AGE_MS = Math.min(15 * 60_000, EVIDENCE_TTL_MINUTES * 60_000);

const openStaging = new Set<string>();
let stagingRoot: string | null = null;

export function stagingOpenCount(): number {
  return openStaging.size;
}

export function resetStagingRootForTests(): void {
  stagingRoot = null;
}

export function stagingPartName(): string {
  return `ehas2-${randomBytes(16).toString('hex')}.part`;
}

function exclusiveOpenFlags(): number {
  let flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL;
  if (typeof fsConstants.O_NOFOLLOW === 'number') flags |= fsConstants.O_NOFOLLOW;
  return flags;
}

function isFsCode(err: unknown, code: string): boolean {
  return Boolean(err && typeof err === 'object' && (err as { code?: string }).code === code);
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

async function assertContained(root: string, candidate: string): Promise<void> {
  const rel = relative(root, candidate);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || rel.startsWith('../')) {
    throw new StreamIngestError('STAGING_UNAVAILABLE');
  }
  if (rel.split(/[/\\]/).some((part) => part === '..')) {
    throw new StreamIngestError('STAGING_UNAVAILABLE');
  }
}

export async function resolveStagingRoot(baseDir?: string): Promise<string> {
  const parent = baseDir ?? tmpdir();
  const dir = join(parent, STAGING_DIR_NAME);
  try {
    const existing = await lstat(dir);
    if (existing.isSymbolicLink() || !existing.isDirectory()) {
      throw new StreamIngestError('STAGING_UNAVAILABLE');
    }
  } catch (err) {
    if (err instanceof StreamIngestError) throw err;
    if (!isFsCode(err, 'ENOENT')) throw new StreamIngestError('STAGING_UNAVAILABLE');
    try {
      await mkdir(dir, { recursive: true, mode: 0o700 });
    } catch {
      throw new StreamIngestError('STAGING_UNAVAILABLE');
    }
  }
  try {
    await chmod(dir, 0o700);
  } catch {
    /* Windows may ignore mode */
  }
  const parentReal = await realpath(parent);
  const dirReal = await realpath(dir);
  await assertContained(parentReal, dirReal);
  if (basename(dirReal) !== STAGING_DIR_NAME) {
    throw new StreamIngestError('STAGING_UNAVAILABLE');
  }
  return dirReal;
}

async function ensureStagingRoot(): Promise<string> {
  if (stagingRoot) return stagingRoot;
  const dir = await resolveStagingRoot();
  stagingRoot = dir;
  await sweepStaleStaging({ root: dir });
  return dir;
}

export async function exclusiveCreateStagingFile(
  dir: string,
  name: string,
): Promise<Awaited<ReturnType<typeof open>>> {
  if (!STAGING_PART_RE.test(name)) {
    throw new StreamIngestError('STAGING_CREATE_FAILED');
  }
  const filePath = join(dir, name);
  await assertContained(dir, filePath);
  try {
    const st = await lstat(filePath);
    void st;
    throw new StreamIngestError('STAGING_CREATE_FAILED');
  } catch (err) {
    if (err instanceof StreamIngestError) throw err;
    if (!isFsCode(err, 'ENOENT')) throw new StreamIngestError('STAGING_CREATE_FAILED');
  }
  try {
    return await open(filePath, exclusiveOpenFlags(), 0o600);
  } catch {
    throw new StreamIngestError('STAGING_CREATE_FAILED');
  }
}

export async function sweepStaleStaging(
  input: {
    root?: string;
    now?: number;
    maxAgeMs?: number;
    limit?: number;
  } = {},
): Promise<{ scanned: number; removed: number; skipped: number }> {
  const root = input.root ?? (await resolveStagingRoot());
  const now = input.now ?? Date.now();
  const maxAgeMs = Math.min(
    input.maxAgeMs ?? STAGING_SWEEP_MAX_AGE_MS,
    EVIDENCE_TTL_MINUTES * 60_000,
  );
  const limit = Math.min(STAGING_SWEEP_LIMIT, Math.max(1, input.limit ?? STAGING_SWEEP_LIMIT));
  let scanned = 0;
  let removed = 0;
  let skipped = 0;
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return { scanned: 0, removed: 0, skipped: 0 };
  }
  for (const entry of entries) {
    if (scanned >= limit) break;
    scanned += 1;
    if (!STAGING_PART_RE.test(entry.name)) {
      skipped += 1;
      continue;
    }
    const full = join(root, entry.name);
    if (openStaging.has(full)) {
      skipped += 1;
      continue;
    }
    let st;
    try {
      st = await lstat(full);
    } catch {
      skipped += 1;
      continue;
    }
    if (!st.isFile() || st.isSymbolicLink()) {
      skipped += 1;
      continue;
    }
    try {
      await assertContained(root, full);
    } catch {
      skipped += 1;
      continue;
    }
    const age = now - st.mtimeMs;
    if (age < maxAgeMs) {
      skipped += 1;
      continue;
    }
    await unlinkQuiet(full);
    removed += 1;
  }
  return { scanned, removed, skipped };
}

export async function touchStagingFileForTests(filePath: string, mtimeMs: number): Promise<void> {
  const at = new Date(mtimeMs);
  await utimes(filePath, at, at);
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
  stagingRoot?: string;
}): Promise<StagedEvidenceBytes> {
  const maxBytes = input.maxBytes ?? MAX_EVIDENCE_BYTES;
  const declared = parseDeclaredLength(input.declaredLength);
  if (declared != null && declared > maxBytes) {
    throw new StreamIngestError('SIZE_REJECTED');
  }

  const dir = input.stagingRoot ?? (await ensureStagingRoot());
  await sweepStaleStaging({ root: dir });
  const name = stagingPartName();
  const filePath = join(dir, name);
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
    handle = await exclusiveCreateStagingFile(dir, name);
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
      async *chunks() {
        const reader = await open(filePath, 'r');
        try {
          const buf = Buffer.alloc(64 * 1024);
          for (;;) {
            const { bytesRead } = await reader.read(buf, 0, buf.length, null);
            if (bytesRead === 0) break;
            yield Buffer.from(buf.subarray(0, bytesRead));
          }
        } finally {
          await reader.close();
        }
      },
      dispose,
    };
  } catch (err) {
    await dispose();
    throw err;
  }
}
