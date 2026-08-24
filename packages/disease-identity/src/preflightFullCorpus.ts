import path from 'node:path';
import { assertFileSha256 } from './fileHash.js';
import {
  PINNED_BRIDGE_V3_SHA256,
  PINNED_INVENTORY_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
} from './fullCorpusConstants.js';
import { assertExternalOutputPath, rejectTempAsFinalBundlePath } from './pathSafety.js';

export type PreflightFullCorpusInput = {
  readonly repoRoot: string;
  readonly legacyDbPath: string;
  readonly mappedJsonPath: string;
  readonly bridgePath: string;
  readonly outputPath: string;
  readonly inventoryPath?: string | null;
  readonly minimumFreeBytes?: number;
};

export type PreflightFullCorpusResult = {
  readonly legacyDbSha256: string;
  readonly mappedJsonSha256: string;
  readonly bridgeSha256: string;
  readonly inventorySha256: string | null;
  readonly outputPath: string;
};

export async function preflightFullCorpus(
  input: PreflightFullCorpusInput,
): Promise<PreflightFullCorpusResult> {
  const outputPath = assertExternalOutputPath(input.repoRoot, input.outputPath);
  rejectTempAsFinalBundlePath(outputPath);

  await assertFileSha256(input.legacyDbPath, PINNED_LEGACY_DB_SHA256);
  await assertFileSha256(input.mappedJsonPath, PINNED_MAPPED_JSON_SHA256);
  await assertFileSha256(input.bridgePath, PINNED_BRIDGE_V3_SHA256);

  let inventorySha256: string | null = null;
  if (input.inventoryPath) {
    await assertFileSha256(input.inventoryPath, PINNED_INVENTORY_SHA256);
    inventorySha256 = PINNED_INVENTORY_SHA256;
  }

  if (input.minimumFreeBytes && input.minimumFreeBytes > 0) {
    // Parent directory must exist; exact free-space checks are platform-specific.
    assertExternalOutputPath(input.repoRoot, path.dirname(outputPath));
  }

  return {
    legacyDbSha256: PINNED_LEGACY_DB_SHA256,
    mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
    bridgeSha256: PINNED_BRIDGE_V3_SHA256,
    inventorySha256,
    outputPath,
  };
}
