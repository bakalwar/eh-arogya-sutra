/**
 * Phase 3A clinical product constitution — permanent product requirements.
 * Guard tests assert these strings remain present. This does not prove clinical correctness.
 */

export const CLINICAL_PRODUCT_CONSTITUTION = {
  scale: {
    targetRegisteredDoctors: 100_000,
    registeredActiveConcurrentAreSeparate: true,
    freeServerHundredThousandClaimForbidden: true,
    loadTestingRequiredBeforeProduction: true,
  },
  engine: {
    nineRuleEngineRequired: true,
    requiredResultMetadata: [
      'engineVersion',
      'rulesVersion',
      'diseaseDataVersion',
      'medicineDataVersion',
      'inputHash',
      'evidence',
      'confidence',
      'unresolvedReason',
    ] as const,
  },
  oralFormulas: {
    simpleCount: 3,
    moderateCount: 4,
    complexCount: 5,
    neverOnlyOneOrTwo: true,
    noUnjustifiedRepetition: true,
    formulaSpecificPotency: true,
    formulaSpecificElectricity: true,
    noDefaultWE: true,
  },
  tablets: {
    independentFromOral: true,
    fullMedicinePoolSize: 39,
    emptySectionBReason: 'NO_CLINICALLY_JUSTIFIED_CANDIDATE',
  },
  externalApplications: {
    organSpecific: true,
    notBlindlyCopiedFromOral: true,
    noForcedCountFilling: true,
  },
  generation: {
    noPatientNameHardcoding: true,
    noFixedMedicineOrFormula: true,
    noFrontendMedicineSelection: true,
    noSilentClinicalFallback: true,
  },
  review: {
    doctorReviewBeforeIssuance: true,
    modificationCreatesNewVersion: true,
    originalGeneratedResultPreserved: true,
  },
  nonRetention: {
    originalPhotoPdfNeverPermanent: true,
    ordinaryPhotoCannotReliablyDetermineEveryDisease: true,
  },
  summary: {
    mustComeFromStructuredEngineOutput: true,
    rendererMustNeverInventClinicalInformation: true,
  },
} as const;

export type ClinicalProductConstitution = typeof CLINICAL_PRODUCT_CONSTITUTION;
