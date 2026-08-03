/** Phase 3 — formula-specific structured evidence adapter (D04/D08/Q16/Q-L). */

export const RULE4_EVIDENCE_SOURCE_TYPES = [
  'DOCTOR_STRUCTURED_ENTRY',
  'DIGITAL_STRUCTURED_REPORT',
  'OCR_EXTRACTED_DOCUMENT_IMAGE',
  'DOCTOR_FREE_TEXT_NLP_EXTRACTION',
  'DATASET_TAXONOMY_ALIGNMENT',
  'CLINICAL_PHOTO_RAW',
  'DOCTOR_STRUCTURED_PHOTO_OBSERVATION',
] as const;

export type Rule4EvidenceSourceType = (typeof RULE4_EVIDENCE_SOURCE_TYPES)[number];

export type Rule4AssertionStatus =
  | 'PRESENT'
  | 'POSITIVE'
  | 'NEGATED'
  | 'RULE_OUT'
  | 'SUSPECTED'
  | 'HISTORICAL_ONLY'
  | 'RESOLVED'
  | 'UNKNOWN'
  | 'AMBIGUOUS';

export type Rule4VerificationStatus = 'SUPPORTED' | 'VERIFIED';

export type Rule4FormulaRelevance = 'DIRECT' | 'INDIRECT' | 'UNRELATED';

export type Rule4ItemUsabilityStatus =
  'USABLE_DIRECT_CANDIDATE' | 'IGNORED_NOT_USABLE' | 'INVALID_NOT_USABLE' | 'SUPERSEDED_HISTORICAL';

export type Rule4ModelCalibrationStatus =
  'CALIBRATED_AND_VERIFIED' | 'NOT_CALIBRATED' | 'NOT_APPLICABLE';

export type Rule4Rule3BindingPortStatus = 'RESOLVED' | 'UNRESOLVED';

export type Rule4Rule3BindingPort = {
  formulaSlotId: string;
  portStatus: Rule4Rule3BindingPortStatus;
  formulaTargetId: string | null;
  organSystemKey: string | null;
  anatomicalSite: string | null;
  pathologyId: string | null;
};

export type Rule4ReportDocumentEnvelope = {
  documentId: string;
  parentSourceId: string;
  sourceType: Rule4EvidenceSourceType;
  sourceReference: string;
  timestampOrCaseContext: string;
  /** Tier 2 — schema / integrity (0–1). */
  documentIntegrityScore?: number | null;
  /** Tier 3 — readability (0–1). */
  documentReadabilityScore?: number | null;
  /** When false, Tier 2 native digital path skips model-calibration requirement. */
  extractionModelDerived?: boolean;
  modelCalibrationStatus?: Rule4ModelCalibrationStatus;
  modelName?: string | null;
  modelVersion?: string | null;
  calibrationVersion?: string | null;
};

export type Rule4EvidenceItemEnvelope = {
  findingId: string;
  documentId: string;
  parentSourceId: string;
  sourceType: Rule4EvidenceSourceType;
  sourceReference: string;
  timestampOrCaseContext: string;
  formulaSlotId: string;
  formulaTargetId: string;
  targetOrganSystem: string;
  anatomicalSite: string;
  targetPathologyId: string;
  /** Parent/related group match is NOT_EXECUTABLE until separate data freeze. */
  targetPathologyGroupId?: string | null;
  assertionStatus: Rule4AssertionStatus;
  verificationStatus: Rule4VerificationStatus;
  formulaRelevance: Rule4FormulaRelevance;
  confidenceScore: number;
  value?: string | number | null;
  unit?: string | null;
  laterality?: string | null;
  segment?: string | null;
  grade?: string | null;
  stage?: string | null;
  testPanelIdentity?: string | null;
  findingIdentityKey?: string | null;
  snippetContentHash?: string | null;
  extractionModelDerived?: boolean;
  modelCalibrationStatus?: Rule4ModelCalibrationStatus;
  requiresInterpretationFields?: boolean;
};

export type Rule4DocumentGateResult = {
  documentId: string;
  passed: boolean;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4ItemGateResult = {
  findingId: string;
  documentId: string;
  passed: boolean;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4IgnoredItemAuditEntry = {
  findingId: string;
  documentId: string;
  itemUsabilityStatus: Rule4ItemUsabilityStatus;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4DedupeSupersessionMetadata = {
  findingId: string;
  parentSourceId: string;
  dedupeGroupKey: string | null;
  supersededByFindingId: string | null;
  corroborationRank: number | null;
};

export type Rule4SlotContradictionStatus = {
  formulaSlotId: string;
  evidenceStatus: 'CLEAR' | 'CONTRADICTORY_EVIDENCE';
  doctorReviewRequired: true;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4FormulaBoundEvidencePool = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  usableFindingIds: readonly string[];
  ignoredFindingIds: readonly string[];
  /** Distinct parent sources among active usable findings (selector count). */
  corroborationDistinctParentCount: number;
  /** Audit-only corroborating parent source IDs for active pool (excludes superseded duplicates). */
  corroboratingParentSourceIds: readonly string[];
  contradiction: Rule4SlotContradictionStatus;
};

export type Rule4EvidenceAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  dataAssetVersion: string | null;
  label: 'SYNTHETIC' | 'PRODUCTION';
  rule3BindingPorts: readonly Rule4Rule3BindingPort[];
  documents: readonly Rule4ReportDocumentEnvelope[];
  items: readonly Rule4EvidenceItemEnvelope[];
  /** Internal/test audit probe — not selector authority; see quarantine.ts. */
  quarantineProbe?: Rule4QuarantineProbe;
};

/** Controlled probe keys only (boolean flags). Raw text values prohibited. */
export type Rule4QuarantineProbe = Partial<
  Record<
    | 'global_text'
    | 'globalText'
    | 'sys_text_full'
    | 'sysTextFull'
    | 'disease_keyword'
    | 'registry_nearest_match'
    | 'potency_logic'
    | 'raw_ocr_text'
    | 'rawOcrText'
    | 'keyword_selector'
    | 'keywordSelector'
    | 'registry_potency_logic'
    | 'nearest_match_pathology'
    | 'nearestMatchPathology'
    | 'clinical_photo_inference'
    | 'clinicalPhotoInference',
    boolean
  >
>;

export type Rule4EvidenceAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  dataAssetVersion: string | null;
  executionStatus: 'NOT_IMPLEMENTED';
  currentRuntimePotencyDelta: 'NONE';
  registryQ16SelectorStatus: 'NOT_EXECUTABLE_AS_Q16_SELECTOR';
  documentGateResults: readonly Rule4DocumentGateResult[];
  itemGateResults: readonly Rule4ItemGateResult[];
  ignoredAudit: readonly Rule4IgnoredItemAuditEntry[];
  dedupeSupersession: readonly Rule4DedupeSupersessionMetadata[];
  formulaBoundPools: readonly Rule4FormulaBoundEvidencePool[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicEvidencePoolFingerprint: string;
  quarantineReasonCodes: readonly string[];
};
