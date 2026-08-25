import { createHash, type Hash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, statfs } from 'node:fs/promises';
import { Transform, type TransformCallback } from 'node:stream';
import { DiseaseIdentityError } from './errors.js';

export async function sha256FileHex(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function assertFileSha256(filePath: string, expectedHex: string): Promise<void> {
  const observed = await sha256FileHex(filePath);
  if (observed !== expectedHex.toLowerCase()) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `SHA-256 mismatch for ${filePath.split(/[/\\]/).pop() ?? 'input'}`,
    );
  }
}

/**
 * Readable that SHA-256s every byte consumed. Pipes file bytes through a hashing
 * transform so callers (e.g. readline) see the same stream without competing listeners.
 */
export function hashingReadStream(filePath: string): {
  stream: Transform;
  hash: Hash;
  digestHex: () => string;
} {
  const hash = createHash('sha256');
  const fileStream = createReadStream(filePath);
  const transform = new Transform({
    transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  fileStream.on('error', (err) => transform.destroy(err));
  fileStream.pipe(transform);
  return {
    stream: transform,
    hash,
    digestHex: () => hash.digest('hex'),
  };
}

/** Transform that updates a SHA-256 hasher with every chunk that passes through. */
export function createHashingTransform(hash: Hash = createHash('sha256')): {
  transform: Transform;
  digestHex: () => string;
} {
  const transform = new Transform({
    transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  return {
    transform,
    digestHex: () => hash.digest('hex'),
  };
}

export async function assertConsumedByteDigest(
  observedHex: string,
  expectedHex: string,
  label: string,
): Promise<void> {
  if (observedHex.toLowerCase() !== expectedHex.toLowerCase()) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Consumed-byte SHA-256 mismatch for ${label}`,
    );
  }
}

export type FileIdentitySnapshot = {
  readonly size: number;
  readonly mtimeMs: number;
  readonly sha256: string;
};

export async function captureFileIdentity(filePath: string): Promise<FileIdentitySnapshot> {
  const st = await stat(filePath);
  const sha256 = await sha256FileHex(filePath);
  return { size: st.size, mtimeMs: st.mtimeMs, sha256 };
}

export async function assertFileIdentityUnchanged(
  filePath: string,
  before: FileIdentitySnapshot,
): Promise<void> {
  const after = await captureFileIdentity(filePath);
  if (
    after.size !== before.size ||
    after.mtimeMs !== before.mtimeMs ||
    after.sha256 !== before.sha256
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Input file changed during processing: ${filePath.split(/[/\\]/).pop() ?? 'input'}`,
    );
  }
}

export type FreeSpaceStat = {
  readonly bavail: number | bigint;
  readonly bsize: number | bigint;
};

export type FreeSpaceAdapter = (dirPath: string) => Promise<FreeSpaceStat>;

async function defaultFreeSpaceAdapter(dirPath: string): Promise<FreeSpaceStat> {
  const s = await statfs(dirPath);
  return { bavail: s.bavail, bsize: s.bsize };
}

export async function assertMinimumFreeBytes(
  dirPath: string,
  minimumBytes: number,
  adapter: FreeSpaceAdapter = defaultFreeSpaceAdapter,
): Promise<{ availableBytes: number }> {
  if (
    typeof minimumBytes !== 'number' ||
    !Number.isSafeInteger(minimumBytes) ||
    minimumBytes <= 0
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'minimumFreeBytes must be a positive safe integer',
    );
  }

  try {
    await stat(dirPath);
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Output parent path is not accessible');
  }

  const fsStat = await adapter(dirPath);
  const availableBytesBig = BigInt(fsStat.bavail) * BigInt(fsStat.bsize);
  const minimumBytesBig = BigInt(minimumBytes);

  if (availableBytesBig < minimumBytesBig) {
    const availableBytes =
      availableBytesBig > BigInt(Number.MAX_SAFE_INTEGER)
        ? Number.MAX_SAFE_INTEGER
        : Number(availableBytesBig);
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Insufficient free space: need ${minimumBytes} bytes, available ${availableBytes} bytes`,
    );
  }

  const availableBytes =
    availableBytesBig > BigInt(Number.MAX_SAFE_INTEGER)
      ? Number.MAX_SAFE_INTEGER
      : Number(availableBytesBig);
  return { availableBytes };
}
