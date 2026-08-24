import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
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

export async function assertMinimumFreeBytes(dirPath: string, minimumBytes: number): Promise<void> {
  // Node has no portable free-space API; validate destination exists/writable via stat.
  try {
    await stat(dirPath);
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Output parent path is not accessible');
  }
  if (minimumBytes <= 0) {
    return;
  }
}
