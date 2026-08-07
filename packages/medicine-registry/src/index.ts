import medicinesV2Json from './medicines.v2.json' with { type: 'json' };
import manifestV2Json from './registry.v2.manifest.json' with { type: 'json' };
import medicinesV1Json from './medicines.v1.json' with { type: 'json' };
import manifestV1Json from './registry.v1.manifest.json' with { type: 'json' };

/** Current canonical registry (owner CQ-001A). */
export const MEDICINE_REGISTRY_VERSION = 'ehas2-medicine-registry-v2' as const;
export const MEDICINE_REGISTRY_STATUS = 'AVAILABLE' as const;
export const EXPECTED_MEDICINE_COUNT = 38 as const;

/** Historical snapshot — immutable 39-code registry including C11. */
export const MEDICINE_REGISTRY_V1_VERSION = 'ehas2-medicine-registry-v1' as const;
export const HISTORICAL_V1_MEDICINE_COUNT = 39 as const;
export const HISTORICAL_V1_REQUIRED_CODE_C11 = 'C11' as const;

/** Owner-approved canonical identity set (CQ-001A). Identity/count only — not clinical selection. */
export const CQ001A_CANONICAL_MEDICINE_CODES = [
  'A1',
  'A2',
  'A3',
  'APP',
  'BE',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C10',
  'C13',
  'C15',
  'C17',
  'F1',
  'F2',
  'GE',
  'L1',
  'P1',
  'P2',
  'P3',
  'P4',
  'RE',
  'S-Lass',
  'S1',
  'S2',
  'S3',
  'S5',
  'S6',
  'S10',
  'S11',
  'S12',
  'Ven1',
  'Ver1',
  'Ver2',
  'WE',
  'YE',
] as const;

export type MedicineRecord = {
  id: string;
  name: string;
  group_type?: string;
  polarity?: string;
  nickname?: string;
  target_organ?: string;
  description?: string;
  organ_action?: string;
  when_to_give?: string;
  disease_clusters?: string;
  potency_logic?: string;
  temperament_affinity?: string;
  search_tags?: string;
  medicine_number?: string;
};

export type MedicineRegistryManifestV2 = {
  registryVersion: string;
  medicineCount: number;
  codes: readonly string[];
  excludedCodes: readonly string[];
  ownerDecision: string;
  supersedesVersion: string;
  sourceFingerprint: string;
  artifactSha256: string;
  sqliteSeedIsCanonical: false;
  notes: readonly string[];
};

export type MedicineRegistryManifestV1 = {
  registryVersion: string;
  medicineCount: number;
  codes: readonly string[];
  requiredCodePresent: string;
  sourceFingerprint: string;
  artifactSha256: string;
  sqliteSeedIsCanonical: false;
  notes: readonly string[];
};

export const medicineRegistryManifest = manifestV2Json as MedicineRegistryManifestV2;
export const medicines: readonly MedicineRecord[] = medicinesV2Json as MedicineRecord[];

export const medicineRegistryManifestV1 = manifestV1Json as MedicineRegistryManifestV1;
export const medicinesV1: readonly MedicineRecord[] = medicinesV1Json as MedicineRecord[];

export function listMedicineCodes(): readonly string[] {
  return medicines.map((m) => m.id);
}

export function getMedicineById(id: string): MedicineRecord | undefined {
  return medicines.find((m) => m.id === id);
}

export function getMedicineByIdV1(id: string): MedicineRecord | undefined {
  return medicinesV1.find((m) => m.id === id);
}

function assertExactCodeSet(ids: readonly string[], expected: readonly string[]): void {
  const got = [...ids].sort((a, b) => a.localeCompare(b));
  const want = [...expected].sort((a, b) => a.localeCompare(b));
  if (got.length !== want.length || got.some((c, i) => c !== want[i])) {
    throw new Error('Medicine code set does not match CQ-001A canonical allowlist');
  }
}

export function assertCanonicalMedicineRegistry(
  records: readonly MedicineRecord[] = medicines,
): void {
  const ids = records.map((m) => m.id);
  const unique = new Set(ids);
  if (records.length !== EXPECTED_MEDICINE_COUNT) {
    throw new Error(`Medicine count must be ${EXPECTED_MEDICINE_COUNT}, got ${records.length}`);
  }
  if (unique.size !== ids.length) {
    throw new Error('Duplicate medicine codes are not allowed');
  }
  if (unique.has('C11')) {
    throw new Error('C11 must not be present in canonical registry v2');
  }
  assertExactCodeSet(ids, CQ001A_CANONICAL_MEDICINE_CODES);
  for (const id of ids) {
    if (!id || !String(id).trim()) throw new Error('Empty medicine code rejected');
  }
}

export function assertHistoricalMedicineRegistryV1(
  records: readonly MedicineRecord[] = medicinesV1,
): void {
  const ids = records.map((m) => m.id);
  const unique = new Set(ids);
  if (records.length !== HISTORICAL_V1_MEDICINE_COUNT) {
    throw new Error(
      `Historical v1 count must be ${HISTORICAL_V1_MEDICINE_COUNT}, got ${records.length}`,
    );
  }
  if (!unique.has(HISTORICAL_V1_REQUIRED_CODE_C11)) {
    throw new Error(`${HISTORICAL_V1_REQUIRED_CODE_C11} must be present in historical v1 registry`);
  }
}

/** Reject seeds whose code set is not the CQ-001A canonical 38 (identity check only). */
export function rejectNonCanonicalMedicineSeed(
  seedCount: number,
  seedCodes: readonly string[],
): never | void {
  if (seedCount !== EXPECTED_MEDICINE_COUNT) {
    throw new Error('Non-canonical medicine seed rejected: count mismatch');
  }
  const unique = new Set(seedCodes);
  if (unique.has('C11')) {
    throw new Error('Non-canonical medicine seed rejected: C11 excluded by CQ-001A');
  }
  try {
    assertExactCodeSet(seedCodes, CQ001A_CANONICAL_MEDICINE_CODES);
  } catch {
    throw new Error('Non-canonical medicine seed rejected: code set mismatch');
  }
}

assertCanonicalMedicineRegistry(medicines);
assertHistoricalMedicineRegistryV1(medicinesV1);
