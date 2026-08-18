/**
 * F3D-2A versioned terminology-pack contracts.
 * Foundation only: schema, checksum, loader. No parser, no clinical authority.
 */

export const F3D2_TERMINOLOGY_PACK_FOUNDATION = true as const;
export const TERMINOLOGY_PRODUCTION_ENTRY_COUNT = 0 as const;
export const OWNER_TERMINOLOGY_FREEZE_PENDING = true as const;
export const NORMALIZATION_PARSER_AVAILABLE = false as const;

export const TERMINOLOGY_SCHEMA_VERSION = 'ehas2-terminology-pack-v1' as const;
export const TERMINOLOGY_CANONICALIZATION_VERSION = 'ehas2-terminology-canonical-v1' as const;
export const TERMINOLOGY_CHECKSUM_ALGORITHM = 'sha256' as const;

export const EMPTY_PACK_ID = 'ehas2-default-terminology' as const;
export const EMPTY_PACK_VERSION = '0.0.0-empty' as const;
export const EMPTY_PACK_STATUS = 'EMPTY_AWAITING_OWNER_FREEZE' as const;
export const EMPTY_PACK_APPROVAL_POSTURE = 'NO_ENTRIES_OWNER_FREEZE_PENDING' as const;
export const DEFAULT_PRODUCTION_PACK_REL = 'packs/empty-awaiting-owner-freeze.v1.json' as const;

export const SYNTHETIC_PACK_ID = 'ehas2-synthetic-terminology-test' as const;
export const SYNTHETIC_PACK_VERSION = '0.0.0-test' as const;

export const PACK_STATUSES = [
  'EMPTY_AWAITING_OWNER_FREEZE',
  'SYNTHETIC_TEST_ONLY',
  'OWNER_FROZEN',
] as const;
export type PackStatus = (typeof PACK_STATUSES)[number];

export const ENTRY_TYPES = [
  'LANGUAGE_EQUIVALENCE',
  'CLINICAL_SYNONYM',
  'ABBREVIATION',
  'ROMAN_HINDI',
  'NEGATION_CUE',
  'DURATION_PHRASE',
  'UNIT_ALIAS',
  'UNSAFE_AMBIGUOUS',
] as const;
export type TerminologyEntryType = (typeof ENTRY_TYPES)[number];

export const PACK_LANGUAGES = ['en', 'hi', 'und'] as const;
export type PackLanguage = (typeof PACK_LANGUAGES)[number];

export const PACK_SCRIPTS = ['Latn', 'Deva', 'Mixed', 'Unknown'] as const;
export type PackScript = (typeof PACK_SCRIPTS)[number];

export const AMBIGUITY_CLASSIFICATIONS = ['UNAMBIGUOUS', 'AMBIGUOUS', 'UNRESOLVED'] as const;
export type AmbiguityClassification = (typeof AMBIGUITY_CLASSIFICATIONS)[number];

export const NEGATION_INTERACTIONS = [
  'NOT_APPLICABLE',
  'PRE_CUE',
  'POST_CUE',
  'PSEUDO_CUE',
] as const;
export type NegationInteraction = (typeof NEGATION_INTERACTIONS)[number];

export const CONTEXT_REQUIREMENTS = ['NONE', 'SAME_CLAUSE', 'OWNER_CONTEXT_REQUIRED'] as const;
export type ContextRequirement = (typeof CONTEXT_REQUIREMENTS)[number];

export const ENTRY_DECISION_STATUSES = ['ACTIVE', 'SUPERSEDED'] as const;
export type EntryDecisionStatus = (typeof ENTRY_DECISION_STATUSES)[number];

export const SELECTOR_PROHIBITIONS = ['SELECTOR_FORBIDDEN'] as const;
export type SelectorProhibition = (typeof SELECTOR_PROHIBITIONS)[number];

export const LICENSE_CLASSIFICATIONS = [
  'OWNER_INTERNAL_EMPTY',
  'OWNER_CLINIC_FROZEN',
  'SYNTHETIC_TEST_ONLY',
  'UNICODE_CLDR_PENDING',
  'UCUM_VERBATIM_PENDING',
] as const;
export type LicenseClassification = (typeof LICENSE_CLASSIFICATIONS)[number];

export const PACK_TOP_LEVEL_KEYS = [
  'schemaVersion',
  'packId',
  'packVersion',
  'status',
  'ownerApprovalToken',
  'createdAt',
  'provenance',
  'licenseClassification',
  'entries',
  'canonicalizationVersion',
  'checksumAlgorithm',
  'contentChecksum',
] as const;

export const PROVENANCE_KEYS = ['source', 'note'] as const;

export const ENTRY_KEYS = [
  'id',
  'entryType',
  'aliasText',
  'canonicalLabel',
  'language',
  'script',
  'ambiguityClassification',
  'provenanceReference',
  'licenseClassification',
  'negationInteraction',
  'contextRequirements',
  'decisionStatus',
  'selectorProhibition',
] as const;

export const CHECKSUM_EXCLUDED_KEYS = ['contentChecksum', 'ownerApprovalToken'] as const;

/** Pack JSON object keys that would couple terminology to clinical selectors. */
export const TERMINOLOGY_PACK_SELECTOR_FORBIDDEN_KEYS = [
  'diseaseId',
  'disease_id',
  'selectedDisease',
  'medicineCode',
  'medicine_code',
  'medicineId',
  'medicine_id',
  'base_formula',
  'base_medicines',
  'formula',
  'oralFormula',
  'potency',
  'dose',
  'dosage',
  'severityMapping',
  'severity',
  'organSystem',
  'system_key',
  'affectsClinicalSelection',
  'clinically_used',
  'clinicallyUsed',
  'polarity',
  'temperament',
  'constitution',
  'icd10_code',
  'icd11',
  'snomed',
  'loinc',
  'namaste',
  'analyzeComplete',
] as const;

export const TERMINOLOGY_PACK_PHI_FORBIDDEN_KEYS = [
  'patientName',
  'patient_name',
  'phone',
  'email',
  'consultationText',
  'consultation_text',
  'reportText',
  'report_text',
  'originalSourceSpan',
  'object_key',
  'objectKey',
  'object_url',
  'presigned',
  'password',
  'secret',
  'credential',
  'apiKey',
  'api_key',
  'mrn',
  'MRN',
] as const;

export const MAX_PACK_BYTES = 65_536;
export const MAX_ENTRIES = 64;
export const MAX_ALIAS_CHARS = 80;
export const MAX_LABEL_CHARS = 80;
export const MAX_ID_CHARS = 64;
export const MAX_TOKEN_CHARS = 200;
export const MAX_NOTE_CHARS = 200;
export const MAX_PROVENANCE_REF_CHARS = 80;

export const PLACEHOLDER_TOKENS = [
  'PENDING',
  'TODO',
  'PLACEHOLDER',
  'APPROVED',
  'owner-approved',
  'OWNER_APPROVED',
  'changeme',
  'TOKEN',
] as const;

export type TerminologyProvenance = {
  readonly source: string;
  readonly note: string;
};

export type TerminologyPackEntry = {
  readonly id: string;
  readonly entryType: TerminologyEntryType;
  readonly aliasText: string;
  readonly canonicalLabel: string;
  readonly language: PackLanguage;
  readonly script: PackScript;
  readonly ambiguityClassification: AmbiguityClassification;
  readonly provenanceReference: string;
  readonly licenseClassification: LicenseClassification;
  readonly negationInteraction: NegationInteraction;
  readonly contextRequirements: ContextRequirement;
  readonly decisionStatus: EntryDecisionStatus;
  readonly selectorProhibition: SelectorProhibition;
};

export type TerminologyPack = {
  readonly schemaVersion: typeof TERMINOLOGY_SCHEMA_VERSION;
  readonly packId: string;
  readonly packVersion: string;
  readonly status: PackStatus;
  readonly ownerApprovalToken: string;
  readonly createdAt: string;
  readonly provenance: TerminologyProvenance;
  readonly licenseClassification: LicenseClassification;
  readonly entries: readonly TerminologyPackEntry[];
  readonly canonicalizationVersion: typeof TERMINOLOGY_CANONICALIZATION_VERSION;
  readonly checksumAlgorithm: typeof TERMINOLOGY_CHECKSUM_ALGORITHM;
  readonly contentChecksum: string;
};

export type TerminologyLookupResult = {
  readonly matched: false;
  readonly reason: 'NO_EXECUTABLE_ALIASES' | 'TERMINOLOGY_LOOKUP_NOT_CONNECTED';
};

export type LoadedTerminologyPack = {
  readonly packId: string;
  readonly packVersion: string;
  readonly status: PackStatus;
  readonly contentChecksum: string;
  readonly entryCount: number;
  readonly executable: false;
  readonly ownerTerminologyFreezePending: boolean;
  readonly normalizationParserAvailable: false;
  readonly syntheticTestOnly: boolean;
  lookupAlias(_text: string): TerminologyLookupResult;
};

export const TERMINOLOGY_SELECTOR_FORBIDDEN_FIELD_NAMES = [
  'medicineCode',
  'formula',
  'potency',
  'dose',
  'diseaseId',
  'selectedDisease',
  'analyzeComplete',
] as const;
