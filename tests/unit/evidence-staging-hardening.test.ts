import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  STAGING_DIR_NAME,
  STAGING_SWEEP_MAX_AGE_MS,
  STREAMING_STAGING_CLASSIFICATION,
  bytesAsStream,
  disposeAllStagingForTests,
  exclusiveCreateStagingFile,
  resolveStagingRoot,
  resetStagingRootForTests,
  stagingPartName,
  sweepStaleStaging,
  touchStagingFileForTests,
  StreamIngestError,
  stageBoundedStream,
} from '../../packages/evidence-ingest/src/index.ts';

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

afterEach(async () => {
  await disposeAllStagingForTests();
  resetStagingRootForTests();
});

describe('F2A staging hardening', () => {
  it('exclusive-create collision fails closed without overwrite', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'ehas2-stage-col-'));
    const root = await resolveStagingRoot(parent);
    const name = stagingPartName();
    const first = await exclusiveCreateStagingFile(root, name);
    await first.write(PNG);
    await first.close();
    await expect(exclusiveCreateStagingFile(root, name)).rejects.toMatchObject({
      code: 'STAGING_CREATE_FAILED',
    });
  });

  it('removes stale owned parts and retains fresh owned files', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'ehas2-stage-age-'));
    const root = await resolveStagingRoot(parent);
    const staleName = stagingPartName();
    const freshName = stagingPartName();
    const stale = await exclusiveCreateStagingFile(root, staleName);
    await stale.close();
    const fresh = await exclusiveCreateStagingFile(root, freshName);
    await fresh.close();
    const now = Date.now();
    await touchStagingFileForTests(join(root, staleName), now - STAGING_SWEEP_MAX_AGE_MS - 5_000);
    await touchStagingFileForTests(join(root, freshName), now);
    const result = await sweepStaleStaging({ root, now, maxAgeMs: STAGING_SWEEP_MAX_AGE_MS });
    expect(result.removed).toBe(1);
    await expect(
      stageBoundedStream({ body: bytesAsStream(PNG), stagingRoot: root }),
    ).resolves.toMatchObject({
      classification: STREAMING_STAGING_CLASSIFICATION,
      productionReady: false,
    });
    const { access } = await import('node:fs/promises');
    await expect(access(join(root, freshName))).resolves.toBeUndefined();
    await expect(access(join(root, staleName))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('leaves unrelated temp files untouched', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'ehas2-stage-unrel-'));
    const root = await resolveStagingRoot(parent);
    const other = join(root, 'notes.txt');
    await writeFile(other, 'keep');
    await sweepStaleStaging({
      root,
      now: Date.now(),
      maxAgeMs: 1,
    });
    const { access } = await import('node:fs/promises');
    await expect(access(other)).resolves.toBeUndefined();
  });

  it('does not follow a malicious symlink or escape the staging root', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'ehas2-stage-link-'));
    const root = await resolveStagingRoot(parent);
    const outsideDir = await mkdtemp(join(tmpdir(), 'ehas2-outside-'));
    const outsideFile = join(outsideDir, 'secret.bin');
    await writeFile(outsideFile, 'outside');
    const linkName = stagingPartName();
    const linkPath = join(root, linkName);
    let linked = false;
    try {
      await symlink(outsideFile, linkPath);
      linked = true;
    } catch {
      linked = false;
    }
    const now = Date.now();
    await sweepStaleStaging({ root, now, maxAgeMs: 1 });
    const { access, lstat } = await import('node:fs/promises');
    await expect(access(outsideFile)).resolves.toBeUndefined();
    if (linked) {
      const st = await lstat(linkPath);
      expect(st.isSymbolicLink()).toBe(true);
    }
    expect(root.endsWith(STAGING_DIR_NAME)).toBe(true);
  });

  it('cleans up on abort and throw', async () => {
    const ac = new AbortController();
    async function* hang() {
      yield PNG.subarray(0, 8);
      ac.abort();
      yield PNG.subarray(8);
    }
    await expect(stageBoundedStream({ body: hang(), signal: ac.signal })).rejects.toBeInstanceOf(
      StreamIngestError,
    );
  });
});
