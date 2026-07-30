import medicinesJson from './medicines.v1.json' with { type: 'json' };
import manifestJson from './registry.manifest.json' with { type: 'json' };

export const MEDICINE_REGISTRY_VERSION = 'ehas2-medicine-registry-v1' as const;
export const MEDICINE_REGISTRY_STATUS = 'AVAILABLE' as const;
export const EXPECTED_MEDICINE_COUNT = 39 as const;
export const REQUIRED_CODE_C11 = 'C11' as const;

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

export type MedicineRegistryManifest = {
  registryVersion: string;
  medicineCount: number;
  codes: readonly string[];
  requiredCodePresent: string;
  sourceFingerprint: string;
  artifactSha256: string;
  sqliteSeedIsCanonical: false;
  notes: readonly string[];
};

export const medicineRegistryManifest = manifestJson as MedicineRegistryManifest;
export const medicines: readonly MedicineRecord[] = medicinesJson as MedicineRecord[];

export function listMedicineCodes(): readonly string[] {
  return medicines.map((m) => m.id);
}

export function getMedicineById(id: string): MedicineRecord | undefined {
  return medicines.find((m) => m.id === id);
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
  if (!unique.has(REQUIRED_CODE_C11)) {
    throw new Error(`${REQUIRED_CODE_C11} must be present in the canonical registry`);
  }
  for (const id of ids) {
    if (!id || !String(id).trim()) throw new Error('Empty medicine code rejected');
  }
}

/** SQLite seed (38 rows, missing C11) is never canonical. */
export function rejectSqliteSeedAsCanonical(seedCount: number, hasC11: boolean): never | void {
  if (seedCount === 38 && !hasC11) {
    throw new Error('SQLite medicines seed (38, missing C11) is not canonical');
  }
  if (seedCount !== EXPECTED_MEDICINE_COUNT || !hasC11) {
    throw new Error('Non-canonical medicine seed rejected');
  }
}

assertCanonicalMedicineRegistry(medicines);
