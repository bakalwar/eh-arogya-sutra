/**
 * Typed clinical persistence contracts — Phase 2A-D foundation.
 * No clinical medicine-selection logic. No invented live data.
 * Structured records are machine-readable source of truth;
 * immutable snapshots preserve exactly what the clinician reviewed.
 */
import { type FoundationStatusCode } from '@ehas2/shared';

export { CLINICAL_PRODUCT_CONSTITUTION, type ClinicalProductConstitution } from './constitution.js';
export * from './analyze.js';
export * from './nineRules.js';
export * from './rule4/index.js';

export const CLINICAL_CONTRACTS_VERSION = '0.3.0-phase5c' as const;
export const CLINICAL_CONTRACTS_STATUS = 'NOT_READY' as const;
export const CLINICAL_DATA_SERVICE_STATUS = 'DATA_SERVICE_NOT_INSTALLED' as const;

export type ApiNamespace = '/api/eh-as-2/v1';

export type EngineVersionInfo = {
  engineVersion: string;
  ruleVersion: string;
  diseaseDataVersion: string;
  medicineDataVersion: string;
};

/** Placeholder — full EHAS2ClinicalResult in Phase 6. */
export type EHAS2ClinicalResultShell = {
  _phase: '1a-shell';
  status: 'NOT_IMPLEMENTED';
  engineVersionInfo: EngineVersionInfo;
};

/** Trusted ownership context required on every protected clinical record. */
export type ClinicalOwnershipContext = {
  organizationTenantId: string;
  clinicId: string;
  patientId: string;
  consultationId?: string;
  responsibleDoctorId: string;
  createdByPrincipalId: string;
  updatedByPrincipalId: string;
  createdAt: string;
  updatedAt: string;
};

export type PatientIdentifier = {
  systemId: string;
  clinicLocalId: string | null;
  /** External identifiers must never be treated as authorization by themselves. */
  externalIds: readonly string[];
};

export type PatientContact = {
  phoneMasked: string | null;
  emailMasked: string | null;
  preferredContactMethod: 'phone' | 'email' | 'none' | null;
};

export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'LEGAL_HOLD';

export type PatientRecord = {
  ownership: ClinicalOwnershipContext;
  identifier: PatientIdentifier;
  displayName: string;
  dateOfBirth: string | null;
  sexAtBirth: string | null;
  contact: PatientContact;
  status: PatientStatus;
  /** Original photos are never part of persistent patient record. */
  persistentPhotoAllowed: false;
};

export type ConsultationStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'AWAITING_REPORT_VERIFICATION'
  | 'ANALYZED'
  | 'PENDING_CLINICIAN_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export type VitalsRecord = {
  recordedAt: string;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  pulseBpm: number | null;
  temperatureC: number | null;
  weightKg: number | null;
  heightCm: number | null;
  spo2Percent: number | null;
  notes: string | null;
};

export type ChiefComplaintRecord = {
  text: string;
  onset: string | null;
  duration: string | null;
};

export type SymptomRecord = {
  symptomId: string;
  label: string;
  severity: string | null;
  duration: string | null;
  notes: string | null;
};

export type TemperamentRecord = {
  label: string | null;
  notes: string | null;
};

export type ConstitutionRecord = {
  label: string | null;
  notes: string | null;
};

export type AffectedBodySiteRecord = {
  siteId: string;
  label: string;
  laterality: string | null;
};

export type ClinicalContextRecord = {
  historyNotes: string | null;
  temperament: TemperamentRecord | null;
  constitution: ConstitutionRecord | null;
  affectedBodySites: readonly AffectedBodySiteRecord[];
  additionalContext: string | null;
};

export type FindingVerificationStatus =
  | 'EXTRACTED_UNVERIFIED'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'CORRECTED_BY_DOCTOR'
  | 'REJECTED_AS_INCORRECT'
  | 'NOT_CLINICALLY_USED';

/**
 * Structured report finding — OCR text is never automatic clinical truth.
 * Original report bytes/files are never stored on this record.
 */
export type StructuredReportFinding = {
  findingId: string;
  processingId: string;
  extractedValueText: string;
  normalizedFinding: string | null;
  sourceCategory: ReportSourceCategory;
  confidence: number | null;
  units: string | null;
  referenceRange: string | null;
  verificationStatus: FindingVerificationStatus;
  doctorCorrection: string | null;
  correctionReason: string | null;
  verifiedByPrincipalId: string | null;
  verifiedAt: string | null;
  engineVersion: string | null;
  /** Persistence contract forbids original file / base64 / photo bytes. */
  originalFilePresent: false;
  originalBytesPresent: false;
  base64Present: false;
};

export type ReportSourceCategory =
  | 'ordinary_patient_photograph'
  | 'visible_lesion_image'
  | 'report_photograph'
  | 'radiology_image'
  | 'prescription_photograph'
  | 'lab_pdf'
  | 'other_document';

export type EngineVersionRecord = {
  engineVersion: string;
  ruleVersion: string;
};

export type DataVersionRecord = {
  diseaseDataVersion: string;
  medicineDataVersion: string;
};

export type ClinicalAnalysisRecord = {
  analysisId: string;
  status: FoundationStatusCode | 'GENERATED' | 'FAILED';
  engine: EngineVersionRecord;
  data: DataVersionRecord;
  generatedAt: string | null;
  notes: string | null;
};

export type OralFormulaRecord = {
  formulaId: string;
  label: string;
  medicines: readonly string[];
  potency: string | null;
  electricity: string | null;
  doseInstructions: string | null;
};

export type TabletSectionARecord = {
  status: 'generated' | 'not-generated';
  medicines: readonly string[];
  potency: string | null;
  electricity: string | null;
  scheduleInstructions: string | null;
  notGeneratedReason: string | null;
};

export type TabletSectionBSlotRecord = {
  slotId: 'before-food' | 'after-food' | 'night';
  status: 'generated' | 'not-generated';
  medicine: string | null;
  potency: string | null;
  electricity: string | null;
  timing: string | null;
  notGeneratedReason: string | null;
};

export type ExternalApplicationRecord = {
  applicationId: string;
  bodySite: string;
  medicines: readonly string[];
  preparation: string | null;
  frequency: string | null;
  duration: string | null;
  safetyInstructions: string | null;
};

export type DietGuidanceRecord = {
  guidanceText: string;
};

export type SafetyWarningRecord = {
  warningId: string;
  severity: 'info' | 'warning' | 'critical';
  text: string;
};

export type FollowUpRecord = {
  dueAt: string | null;
  instructions: string | null;
  status: 'scheduled' | 'due' | 'completed' | 'cancelled' | null;
};

export type ClinicianReviewDecision =
  'accepted' | 'modified' | 'rejected' | 'needs-clarification' | 'pending-review';

export type ClinicianReviewRecord = {
  decision: ClinicianReviewDecision;
  modificationReason: string | null;
  reviewedByPrincipalId: string | null;
  reviewedAt: string | null;
};

/**
 * Immutable human-readable snapshot of the clinical summary as reviewed.
 * Must not be reconstructed later from future engine rules.
 */
export type ClinicalSummarySnapshot = {
  snapshotId: string;
  consultationId: string;
  readableText: string;
  engine: EngineVersionRecord;
  data: DataVersionRecord;
  createdAt: string;
  contentHash: string;
  immutable: true;
};

/**
 * Structured prescription payload — machine-readable source of truth for a version.
 */
export type StructuredPrescription = {
  oralFormulas: readonly OralFormulaRecord[];
  tabletSectionA: TabletSectionARecord | null;
  tabletSectionBSlots: readonly TabletSectionBSlotRecord[];
  externalApplications: readonly ExternalApplicationRecord[];
  dietGuidance: DietGuidanceRecord | null;
  safetyWarnings: readonly SafetyWarningRecord[];
  followUp: FollowUpRecord | null;
};

/**
 * Immutable prescription version — never overwrite; create a new version on modification.
 */
export type PrescriptionSnapshot = {
  prescriptionId: string;
  consultationId: string;
  versionNumber: number;
  previousVersionId: string | null;
  status: 'draft' | 'issued' | 'superseded' | 'cancelled';
  structuredPrescription: StructuredPrescription;
  readableSnapshot: string;
  engine: EngineVersionRecord;
  data: DataVersionRecord;
  clinicianReview: ClinicianReviewRecord;
  modificationReason: string | null;
  createdAt: string;
  contentHash: string;
  auditEventId: string | null;
  immutable: true;
};

export type ConsultationAuditMetadata = {
  createdByPrincipalId: string;
  updatedByPrincipalId: string;
  createdAt: string;
  updatedAt: string;
  requestId: string | null;
  engine: EngineVersionRecord | null;
  data: DataVersionRecord | null;
};

/**
 * Structured consultation record — not a single plain-text blob.
 * Original report files/photos are never part of this persistent contract.
 */
export type ConsultationRecord = {
  ownership: ClinicalOwnershipContext;
  status: ConsultationStatus;
  chiefComplaint: ChiefComplaintRecord | null;
  symptoms: readonly SymptomRecord[];
  vitals: VitalsRecord | null;
  clinicalContext: ClinicalContextRecord | null;
  structuredReportFindings: readonly StructuredReportFinding[];
  analysis: ClinicalAnalysisRecord | null;
  currentPrescriptionId: string | null;
  clinicalSummarySnapshotId: string | null;
  clinicianReview: ClinicianReviewRecord | null;
  audit: ConsultationAuditMetadata;
  /** Non-retention: original report artifacts are excluded from persistent records. */
  originalReportFilesPresent: false;
  originalPhotoFilesPresent: false;
  reportBase64Present: false;
};

export type PatientHistoryQuery = {
  tenantId: string;
  clinicId?: string;
  patientId?: string;
  doctorId?: string;
  fromDate?: string;
  toDate?: string;
  status?: ConsultationStatus;
  followUpDue?: boolean;
  clinicianReviewStatus?: ClinicianReviewDecision;
  /** Client-provided tenant/doctor IDs are not trusted alone — trusted context required. */
  trustedTenantContextRequired: true;
};

export type PatientHistoryResult = {
  status: FoundationStatusCode | typeof CLINICAL_DATA_SERVICE_STATUS;
  patients: readonly PatientRecord[];
  note: string;
};

export type ConsultationSearchQuery = {
  tenantId: string;
  clinicId?: string;
  patientId?: string;
  doctorId?: string;
  fromDate?: string;
  toDate?: string;
  status?: ConsultationStatus;
  trustedTenantContextRequired: true;
};

export type ConsultationSearchResult = {
  status: FoundationStatusCode | typeof CLINICAL_DATA_SERVICE_STATUS;
  consultations: readonly ConsultationRecord[];
  note: string;
};

export type PrescriptionHistoryQuery = {
  tenantId: string;
  patientId?: string;
  consultationId?: string;
  doctorId?: string;
  trustedTenantContextRequired: true;
};

export type PrescriptionHistoryResult = {
  status: FoundationStatusCode | typeof CLINICAL_DATA_SERVICE_STATUS;
  prescriptions: readonly PrescriptionSnapshot[];
  note: string;
};

export type FollowUpDueQuery = {
  tenantId: string;
  clinicId?: string;
  doctorId?: string;
  asOfDate: string;
  trustedTenantContextRequired: true;
};

export type FollowUpDueResult = {
  status: FoundationStatusCode | typeof CLINICAL_DATA_SERVICE_STATUS;
  dueConsultationIds: readonly string[];
  note: string;
};

export type DoctorActivitySummary = {
  doctorId: string;
  tenantId: string;
  status: typeof CLINICAL_DATA_SERVICE_STATUS | FoundationStatusCode;
  totalPermittedPatients: number | null;
  patientsSeenToday: number | null;
  consultationsThisMonth: number | null;
  pendingReviews: number | null;
  followUpsDue: number | null;
  draftConsultations: number | null;
  completedPrescriptions: number | null;
  unresolvedSupportTickets: number | null;
  note: string;
};

export type ClinicPatientCount = {
  clinicId: string;
  tenantId: string;
  status: typeof CLINICAL_DATA_SERVICE_STATUS | FoundationStatusCode;
  count: number | null;
  note: string;
};

export type DoctorPatientCount = {
  doctorId: string;
  tenantId: string;
  status: typeof CLINICAL_DATA_SERVICE_STATUS | FoundationStatusCode;
  count: number | null;
  note: string;
};

export type DoctorDashboardDataContract = {
  status: typeof CLINICAL_DATA_SERVICE_STATUS;
  message: string;
  metrics: DoctorActivitySummary;
};

/** Creates a new immutable prescription version — never overwrites prior version. */
export function createNextPrescriptionVersion(input: {
  previous: PrescriptionSnapshot;
  structuredPrescription: StructuredPrescription;
  readableSnapshot: string;
  clinicianReview: ClinicianReviewRecord;
  modificationReason: string;
  createdAt: string;
  contentHash: string;
  auditEventId: string | null;
  engine: EngineVersionRecord;
  data: DataVersionRecord;
}): PrescriptionSnapshot {
  if (!input.modificationReason.trim()) {
    throw new Error('Prescription modification requires a non-empty reason');
  }
  return {
    prescriptionId: `${input.previous.prescriptionId}-v${input.previous.versionNumber + 1}`,
    consultationId: input.previous.consultationId,
    versionNumber: input.previous.versionNumber + 1,
    previousVersionId: input.previous.prescriptionId,
    status: 'issued',
    structuredPrescription: input.structuredPrescription,
    readableSnapshot: input.readableSnapshot,
    engine: input.engine,
    data: input.data,
    clinicianReview: input.clinicianReview,
    modificationReason: input.modificationReason,
    createdAt: input.createdAt,
    contentHash: input.contentHash,
    auditEventId: input.auditEventId,
    immutable: true,
  };
}

export function assertPrescriptionImmutable(snapshot: PrescriptionSnapshot): boolean {
  return snapshot.immutable === true;
}

export function assertNoOriginalReportInConsultation(record: ConsultationRecord): boolean {
  return (
    record.originalReportFilesPresent === false &&
    record.originalPhotoFilesPresent === false &&
    record.reportBase64Present === false
  );
}

export function assertFindingHasVerificationStatus(finding: StructuredReportFinding): boolean {
  return !!finding.verificationStatus;
}

export function assertNoBase64InFinding(finding: StructuredReportFinding): boolean {
  return finding.base64Present === false && finding.originalBytesPresent === false;
}

export function createDataServiceNotInstalledDashboard(
  doctorId: string,
  tenantId: string,
): DoctorDashboardDataContract {
  return {
    status: CLINICAL_DATA_SERVICE_STATUS,
    message: 'DATA_SERVICE_NOT_INSTALLED',
    metrics: {
      doctorId,
      tenantId,
      status: CLINICAL_DATA_SERVICE_STATUS,
      totalPermittedPatients: null,
      patientsSeenToday: null,
      consultationsThisMonth: null,
      pendingReviews: null,
      followUpsDue: null,
      draftConsultations: null,
      completedPrescriptions: null,
      unresolvedSupportTickets: null,
      note: 'DATA_SERVICE_NOT_INSTALLED',
    },
  };
}
