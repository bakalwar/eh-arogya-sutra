/**
 * PostgreSQL persistence — Phase 4A authentication core ready.
 * Clinical engine, real OTP provider, uploads, and production patient records remain out of scope.
 */
export const DATABASE_PACKAGE_VERSION = '0.1.0-phase4a' as const;
export const DATABASE_PACKAGE_STATUS = 'AUTH_CORE_READY' as const;
export const DATABASE_ACCESS_LAYER = 'pg+sql-migrations' as const;

export {
  loadDatabaseConfig,
  requireDatabaseConfig,
  databaseReadinessCode,
  type DatabaseConfig,
  type DatabaseSslMode,
} from './config.js';
export {
  DatabaseNotInstalledError,
  TenantContextRequiredError,
  MembershipInactiveError,
  CrossTenantDeniedError,
  InvalidReviewTransitionError,
  ImmutablePrescriptionError,
  sanitizeDatabaseError,
} from './errors.js';
export {
  ValidationError,
  ResourceNotFoundError,
  ConflictError,
  IdempotencyConflictError,
  InvalidConsultationTransitionError,
  ImmutableArtifactError,
  AccessDeniedError,
  RateLimitedError,
  RateLimitUnavailableError,
  ObjectStoreUnavailableError,
  ReviewConflictError,
  FactConflictError,
} from './domainErrors.js';
export {
  type TenantContext,
  type TransactionContext,
  assertTenantContext,
  assertBackgroundJobTenant,
  assertProfileAccessContext,
  assertClinicAdminRole,
} from './tenantContext.js';
export {
  getPool,
  closePool,
  withTenantTransaction,
  withAdminClient,
  runInSavepoint,
} from './pool.js';
export {
  migrateUp,
  migrateDownLast,
  migrateDownLastForIsolatedTest,
  resetDatabaseSchema,
  listMigrationFiles,
  getOrderedMigrationIds,
  checksumFile,
} from './migrate.js';
export {
  assertDestructiveTestDatabaseOperationAllowed,
  DestructiveTestDatabaseGuardError,
  ISOLATED_TEST_PG_ALLOWLIST_DATABASES,
  type DestructiveTestDatabaseGuardReason,
} from './destructiveTestDbGuard.js';
export {
  REVIEW_STATES,
  assertValidReviewTransition,
  isTerminalReviewState,
  type ReviewState,
} from './reviewTransitions.js';
export {
  CONSULTATION_STATUSES,
  assertValidConsultationTransition,
  isTerminalConsultationStatus,
  consultationAllowsFieldUpdate,
  type ConsultationStatus,
} from './consultationTransitions.js';
export {
  assertUuid,
  normalizeDisplayName,
  clampPageLimit,
  hashPayload,
  MAX_FINDING_BATCH,
} from './validation.js';
export type * from './repositories/types.js';
export {
  PgUserRepository,
  PgOrganizationRepository,
  PgMembershipRepository,
  PgPatientRepository,
  PgConsultationRepository,
  PgClinicalAnalysisRepository,
  PgPrescriptionRepository,
  PgSummarySnapshotRepository,
  PgReportFindingRepository,
  PgAuditEventRepository,
  assertAuditMetadataSafe,
  UNSCOPED_PATIENT_METHODS_FORBIDDEN,
} from './repositories/postgres.js';
export {
  PgDoctorProfileRepository,
  PgClinicProfileRepository,
  buildPrescriberIdentitySnapshot,
} from './repositories/profiles.js';
export { PgIdempotencyRepository } from './repositories/idempotency.js';
export { PatientService, patientService } from './services/patientService.js';
export { ConsultationService, consultationService } from './services/consultationService.js';
export {
  ConsultationIntakeService,
  consultationIntakeService,
} from './services/consultationIntakeService.js';
export type { ConsultationIntakePatch } from './services/consultationIntakeService.js';
export {
  CueEligibleSourceService,
  cueEligibleSourceService,
  bindDoctorDeclaredChiefComplaintSourceIdentity,
} from './services/cueEligibleSourceService.js';
export type {
  ParseDoctorDeclaredChiefComplaintCuesInput,
  DoctorDeclaredChiefComplaintCueAdapterResult,
  DoctorDeclaredChiefComplaintBinding,
} from './services/cueEligibleSourceService.js';
export {
  F3cReviewedCueSourceService,
  f3cReviewedCueSourceService,
  bindF3cReviewedSourceIdentity,
} from './services/f3cReviewedCueSourceService.js';
export type {
  ParseF3cReviewedSourceCuesInput,
  F3cReviewedSourceCueAdapterResult,
  F3cReviewedSourceBinding,
} from './services/f3cReviewedCueSourceService.js';
export {
  lockChiefComplaintCueSource,
  chiefComplaintCueSourceLockKey,
  lockF3cReviewedCueSource,
  f3cReviewedCueSourceLockKey,
  lockStructuredVitalSourceFields,
  structuredVitalSourceLockKey,
  CUE_SOURCE_LOCK_PREFIX,
  CUE_SOURCE_LOCK_FIELD_CHIEF_COMPLAINT,
  F3C_REVIEWED_CUE_SOURCE_LOCK_PREFIX,
  STRUCTURED_VITAL_SOURCE_LOCK_PREFIX,
} from './services/cueSourceLock.js';
export {
  STRUCTURED_VITAL_FIELD_SPECS,
  STRUCTURED_VITAL_SOURCE_FIELDS,
  isStructuredVitalSourceField,
  sortStructuredVitalFields,
  vitalFieldsChanged,
  presentVitalMeasurementKeys,
  sourceFieldsForVitalColumns,
  LEGACY_TEMPERATURE_UNIT_TEXT,
  CANONICAL_TEMPERATURE_UNIT_TEXT,
} from './services/structuredVitalSource.js';
export type {
  StructuredVitalSourceField,
  StructuredVitalFieldSpec,
  VitalPatchMeasurementKey,
} from './services/structuredVitalSource.js';
export { EvidenceService, evidenceService } from './services/evidenceService.js';
export type { EvidenceServiceDeps } from './services/evidenceService.js';
export { PgEvidenceRepository } from './repositories/evidence.js';
export type { EvidenceItemRecord, EvidenceJobRecord } from './repositories/evidence.js';
export { PgExtractionRepository } from './repositories/extraction.js';
export type { ExtractionRunRecord } from './repositories/extraction.js';
export { PgCandidateReviewRepository } from './repositories/candidateReview.js';
export { PgFactCandidateRepository } from './repositories/factCandidate.js';
export { PgFactNormalizationRepository } from './repositories/factNormalization.js';
export type { InsertFactNormalizationInput } from './repositories/factNormalization.js';
export { FactCandidateService, factCandidateService } from './services/factCandidateService.js';
export type {
  FactCandidateServiceDeps,
  MaterializeFactCandidateInput,
} from './services/factCandidateService.js';
export {
  FactNormalizationService,
  factNormalizationService,
} from './services/factNormalizationService.js';
export type {
  MaterializeFactNormalizationsInput,
  MaterializeFactNormalizationsResult,
  FactNormalizationServiceDeps,
} from './services/factNormalizationService.js';
export {
  lockAndSupersedeFactsWithNormalizations,
  invalidateChiefComplaintFactsAndNormalizations,
  invalidateReviewedCandidateFactsAndNormalizations,
  invalidateStructuredVitalFactsAndNormalizations,
} from './services/factNormalizationLifecycle.js';
export { PgConsultationIntakeRepository } from './repositories/consultationIntake.js';
export type {
  ConsultationIntakeBundle,
  VitalsIntake,
  SymptomIntake,
  ClinicalContextIntake,
} from './repositories/consultationIntake.js';
export {
  DoctorProfileService,
  ClinicProfileService,
  MembershipQueryService,
  doctorProfileService,
  clinicProfileService,
  membershipQueryService,
} from './services/profileServices.js';
export { AuthService, authService } from './services/authService.js';
export type { AuthServiceResultCode, AuthServiceDeps } from './services/authService.js';

/** @deprecated — use getPool / withTenantTransaction. Kept to fail closed without config. */
export function getConnection(): never {
  const err = new Error('DATABASE_NOT_INSTALLED_OR_USE_POOL');
  (err as Error & { code: string }).code = 'DATABASE_NOT_INSTALLED';
  throw err;
}
