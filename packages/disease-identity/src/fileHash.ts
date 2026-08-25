import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, statfs } from 'node:fs/promises';
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
  const availableBytes = Number(fsStat.bavail) * Number(fsStat.bsize);
  if (!Number.isFinite(availableBytes) || availableBytes < minimumBytes) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Insufficient free space: need ${minimumBytes} bytes, available ${Number.isFinite(availableBytes) ? availableBytes : 0} bytes`,
    );
  }
  return { availableBytes };
}
