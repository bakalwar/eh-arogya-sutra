/**
 * Clinical data package manifests — Phase 5B.
 * Full disease artifact lives under data/clinical-artifacts/ (gitignored).
 * Runtime must never depend on the protected old-project path.
 */

export const DISEASE_PACKAGE_SCHEMA_VERSION = 'ehas2-disease-schema-v1' as const;
export const DISEASE_DATASET_VERSION = 'ehas2-disease-v1' as const;
export const EXPECTED_DISEASE_COUNT = 116_284 as const;

export const MEDICINE_REGISTRY_VERSION = 'ehas2-medicine-registry-v1' as const;
export const RULE_SET_VERSION = 'ehas2-nine-rule-interfaces-v1' as const;
export const CLINICAL_ENGINE_VERSION = 'ehas2-clinical-engine-scaffold-v1' as const;

/** Approved offline artifact install location (relative to repo root). */
export const CLINICAL_ARTIFACT_DIR = 'data/clinical-artifacts' as const;
export const DISEASE_PACKAGE_DIR = 'data/clinical-artifacts/disease-package-v1' as const;

export const EXPECTED_SOURCE_DB_SHA256 =
  'C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154' as const;

export type PackageInstallStatus =
  'NOT_GENERATED' | 'GENERATED_LOCAL' | 'NOT_INSTALLED_LIVE' | 'INSTALLED';

export type DiseasePackageStatus = {
  expectedCount: typeof EXPECTED_DISEASE_COUNT;
  schemaVersion: typeof DISEASE_PACKAGE_SCHEMA_VERSION;
  datasetVersion: typeof DISEASE_DATASET_VERSION;
  generatedLocal: boolean;
  installedLive: false;
  artifactPathPolicy: typeof DISEASE_PACKAGE_DIR;
  runtimeOldProjectPathAllowed: false;
};

export function defaultDiseasePackageStatus(generatedLocal: boolean): DiseasePackageStatus {
  return {
    expectedCount: EXPECTED_DISEASE_COUNT,
    schemaVersion: DISEASE_PACKAGE_SCHEMA_VERSION,
    datasetVersion: DISEASE_DATASET_VERSION,
    generatedLocal,
    installedLive: false,
    artifactPathPolicy: DISEASE_PACKAGE_DIR,
    runtimeOldProjectPathAllowed: false,
  };
}

export const APPROVED_DISEASE_FIELDS = [
  'id',
  'icd10_code',
  'name_english',
  'name_hindi',
  'category',
  'system_key',
  'symptoms_en',
  'symptoms_hi',
  'prakruti',
  'base_medicines',
  'base_formula',
] as const;
