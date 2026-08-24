import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';

export async function compareFullBuilds(dirA: string, dirB: string): Promise<void> {
  const resolvedA = path.resolve(dirA);
  const resolvedB = path.resolve(dirB);
  const filesA = (await readdir(resolvedA)).sort();
  const filesB = (await readdir(resolvedB)).sort();

  if (filesA.join('|') !== filesB.join('|')) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bundle file sets differ between builds');
  }

  for (const file of filesA) {
    const [a, b] = await Promise.all([
      readFile(path.join(resolvedA, file)),
      readFile(path.join(resolvedB, file)),
    ]);
    if (!a.equals(b)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Byte mismatch for ${file}`);
    }
  }
}
