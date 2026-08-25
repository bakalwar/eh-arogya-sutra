import {
  assertFileSha256,
  assertMinimumFreeBytes,
  captureFileIdentity,
  type FileIdentitySnapshot,
} from './fileHash.js';
import {
  PINNED_BRIDGE_V3_SHA256,
  PINNED_INVENTORY_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
  RECOMMENDED_MINIMUM_FREE_BYTES,
} from './fullCorpusConstants.js';
import {
  assertExternalOutputPathAsync,
  assertExternalRegularFileInput,
  rejectTempAsFinalBundlePath,
  resolveNearestExistingParent,
} from './pathSafety.js';

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
  readonly inputIdentities: {
    readonly legacyDb: FileIdentitySnapshot;
    readonly mappedJson: FileIdentitySnapshot;
    readonly bridge: FileIdentitySnapshot;
    readonly inventory: FileIdentitySnapshot | null;
  };
};

export async function preflightFullCorpus(
  input: PreflightFullCorpusInput,
): Promise<PreflightFullCorpusResult> {
  const outputPath = await assertExternalOutputPathAsync(input.repoRoot, input.outputPath);
  rejectTempAsFinalBundlePath(outputPath);

  const legacyDbPath = await assertExternalRegularFileInput(input.repoRoot, input.legacyDbPath);
  const mappedJsonPath = await assertExternalRegularFileInput(input.repoRoot, input.mappedJsonPath);
  const bridgePath = await assertExternalRegularFileInput(input.repoRoot, input.bridgePath);

  await assertFileSha256(legacyDbPath, PINNED_LEGACY_DB_SHA256);
  await assertFileSha256(mappedJsonPath, PINNED_MAPPED_JSON_SHA256);
  await assertFileSha256(bridgePath, PINNED_BRIDGE_V3_SHA256);

  const legacyDb = await captureFileIdentity(legacyDbPath);
  const mappedJson = await captureFileIdentity(mappedJsonPath);
  const bridge = await captureFileIdentity(bridgePath);

  let inventorySha256: string | null = null;
  let inventory: FileIdentitySnapshot | null = null;
  if (input.inventoryPath) {
    const inventoryPath = await assertExternalRegularFileInput(input.repoRoot, input.inventoryPath);
    await assertFileSha256(inventoryPath, PINNED_INVENTORY_SHA256);
    inventorySha256 = PINNED_INVENTORY_SHA256;
    inventory = await captureFileIdentity(inventoryPath);
  }

  const minFree = input.minimumFreeBytes ?? RECOMMENDED_MINIMUM_FREE_BYTES;
  if (minFree > 0) {
    const parent = await resolveNearestExistingParent(outputPath);
    await assertMinimumFreeBytes(parent, minFree);
  }

  return {
    legacyDbSha256: PINNED_LEGACY_DB_SHA256,
    mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
    bridgeSha256: PINNED_BRIDGE_V3_SHA256,
    inventorySha256,
    outputPath,
    inputIdentities: { legacyDb, mappedJson, bridge, inventory },
  };
}
