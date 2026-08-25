import readline from 'node:readline';
import { DiseaseIdentityError } from './errors.js';
import { assertConsumedByteDigest, hashingReadStream } from './fileHash.js';
import { EXPECTED_INVENTORY_ROW_COUNT, PINNED_INVENTORY_SHA256 } from './fullCorpusConstants.js';

export type InventoryVerifyResult = {
  readonly inventoryVerified: boolean;
  readonly inventorySha256: string | null;
  readonly consumedBytes: number;
  readonly rowCount: number;
};

/**
 * Same-stream inventory verification. Absent inventory ⇒ verified=false / sha=null.
 * Present inventory must match pinned digest, exact row count, and mapped raw-row reconciliation
 * before any caller may emit inventoryVerified=true.
 */
export async function verifyInventorySameStream(input: {
  readonly inventoryPath: string | null | undefined;
  readonly mappedRawRowCount: number;
}): Promise<InventoryVerifyResult> {
  if (!input.inventoryPath) {
    return {
      inventoryVerified: false,
      inventorySha256: null,
      consumedBytes: 0,
      rowCount: 0,
    };
  }

  const hashing = hashingReadStream(input.inventoryPath);
  let rows = 0;
  const rl = readline.createInterface({ input: hashing.stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.trim().length === 0) continue;
    rows += 1;
    if (rows > EXPECTED_INVENTORY_ROW_COUNT) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Inventory exceeds expected ${EXPECTED_INVENTORY_ROW_COUNT} rows`,
      );
    }
  }
  const consumedBytes = hashing.consumedBytes();
  const digest = hashing.digestHex();
  await assertConsumedByteDigest(digest, PINNED_INVENTORY_SHA256, 'inventory');
  if (rows !== EXPECTED_INVENTORY_ROW_COUNT) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Inventory row count mismatch: expected ${EXPECTED_INVENTORY_ROW_COUNT}, observed ${rows}`,
    );
  }
  if (rows !== input.mappedRawRowCount) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Inventory row count does not reconcile with mapped.json',
    );
  }
  return {
    inventoryVerified: true,
    inventorySha256: PINNED_INVENTORY_SHA256,
    consumedBytes,
    rowCount: rows,
  };
}
