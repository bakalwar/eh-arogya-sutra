import { mkdtemp, rm } from 'node:fs/promises';
import { chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export type JobTempDir = {
  path: string;
  cleanup: () => Promise<void>;
};

export async function createJobTempDir(prefix = 'ehas2-extract-'): Promise<JobTempDir> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix), { encoding: 'utf8' });
  await chmod(dir, 0o700);
  return {
    path: dir,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true });
    },
  };
}

export async function writePrivateFile(filePath: string, bytes: Uint8Array): Promise<void> {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(filePath, bytes, { mode: 0o600 });
}
