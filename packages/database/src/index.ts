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
export { EvidenceService, evidenceService } from './services/evidenceService.js';
export type { EvidenceServiceDeps } from './services/evidenceService.js';
export { PgEvidenceRepository } from './repositories/evidence.js';
export type { EvidenceItemRecord, EvidenceJobRecord } from './repositories/evidence.js';
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
