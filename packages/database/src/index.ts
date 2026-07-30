/**
 * PostgreSQL persistence services — Phase 3B.
 * Clinical engine, OTP, and production patient records remain out of scope.
 */
export const DATABASE_PACKAGE_VERSION = '0.1.0-phase3b' as const;
export const DATABASE_PACKAGE_STATUS = 'PERSISTENCE_SERVICES' as const;
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
} from './domainErrors.js';
export {
  type TenantContext,
  type TransactionContext,
  assertTenantContext,
  assertBackgroundJobTenant,
} from './tenantContext.js';
export { getPool, closePool, withTenantTransaction, withAdminClient } from './pool.js';
export {
  migrateUp,
  migrateDownLast,
  resetDatabaseSchema,
  listMigrationFiles,
  getOrderedMigrationIds,
  checksumFile,
} from './migrate.js';
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
  UNSCOPED_PATIENT_METHODS_FORBIDDEN,
} from './repositories/postgres.js';
export { PgIdempotencyRepository } from './repositories/idempotency.js';
export { PatientService, patientService } from './services/patientService.js';
export { ConsultationService, consultationService } from './services/consultationService.js';

/** @deprecated — use getPool / withTenantTransaction. Kept to fail closed without config. */
export function getConnection(): never {
  const err = new Error('DATABASE_NOT_INSTALLED_OR_USE_POOL');
  (err as Error & { code: string }).code = 'DATABASE_NOT_INSTALLED';
  throw err;
}
