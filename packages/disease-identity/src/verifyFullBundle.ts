import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { assertFileSha256 } from './fileHash.js';
import { validateBundleManifest } from './manifest.js';
import { assertNoProhibitedFields } from './validationPrimitives.js';

export async function verifyFullBundle(bundleDir: string): Promise<void> {
  const resolved = path.resolve(bundleDir);
  const manifestRaw = await readFile(path.join(resolved, 'bundle-manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
  validateBundleManifest(manifest);
  assertNoProhibitedFields(manifest);

  const artifacts = manifest.artifacts as Array<{
    name: string;
    sha256: string;
    bytes: number;
    rowCount: number;
  }>;
  for (const artifact of artifacts) {
    const filePath = path.join(resolved, artifact.name);
    const content = await readFile(filePath, 'utf8');
    if (Buffer.byteLength(content, 'utf8') !== artifact.bytes) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Byte size mismatch for ${artifact.name}`);
    }
    await assertFileSha256(filePath, artifact.sha256);
    if (artifact.name.endsWith('.jsonl')) {
      const lines = content.split('\n').filter((line) => line.trim().length > 0);
      if (lines.length !== artifact.rowCount) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Row count mismatch for ${artifact.name}`,
        );
      }
      for (const line of lines) {
        assertNoProhibitedFields(JSON.parse(line) as unknown);
      }
    }
  }

  const entries = await readdir(resolved);
  const allowed = new Set(
    artifacts
      .map((artifact) => artifact.name)
      .concat(['bundle-manifest.json', 'p2c-build-evidence.json']),
  );
  for (const entry of entries) {
    if (!allowed.has(entry)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Unexpected bundle file ${entry}`);
    }
  }
}
