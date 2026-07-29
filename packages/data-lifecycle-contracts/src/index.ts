export {
  TEMP_REPORT_LIFECYCLE_STATES,
  DEFAULT_REPORT_DELETION_POLICY,
  PROHIBITED_PERSISTENT_REPORT_ARTIFACTS,
  createTempReportProcessingContext,
  requiresCleanup,
  createDeletionFailureAlert,
  TemporaryReportProcessingService,
} from './report-lifecycle.js';
export type {
  TempReportLifecycleState,
  TempReportCleanupTrigger,
  TempReportProcessingContext,
  DeletionVerificationStatus,
  ReportDeletionPolicy,
  SafeDeletionFailureAlert,
  ReportCleanupAuditEvent,
  ProhibitedPersistentReportArtifact,
  PersistedReportProcessingMetadata,
} from './report-lifecycle.js';

export {
  createNotImplementedProviderCatalog,
  assertNoProviderCredentialsInCatalog,
} from './providers.js';
export type {
  DatabaseProvider,
  TemporaryObjectStore,
  QueueProvider,
  EmailProvider,
  SmsProvider,
  MonitoringProvider,
  SecretProvider,
  BackupProvider,
  DeploymentProvider,
  ProviderAbstractionCatalog,
} from './providers.js';

export { DEFAULT_BACKUP_PLAN, DATA_RETENTION_POLICIES, BackupService } from './backup.js';
export type {
  BackupPlan,
  BackupVerification,
  DataRetentionClass,
  DataRetentionPolicyHook,
  DataRetentionPolicy,
} from './backup.js';

export {
  DEFAULT_FREE_PILOT_LIMITS,
  DEFAULT_CAPACITY_THRESHOLDS,
  DATABASE_PORTABILITY_PLAN,
} from './capacity.js';
export type {
  FreePilotEnvironmentLimits,
  CapacityThreshold,
  CapacityAlert,
  DatabasePortabilityPlan,
} from './capacity.js';

export {
  MIGRATION_CONTROL_STATES,
  ORDERED_MIGRATION_STEPS,
  createDefaultMigrationPlan,
  evaluateTrafficSwitchGate,
  managementAdminMayTriggerMigration,
  MigrationControlService,
  SUPER_ADMIN_LIFECYCLE_MONITORING,
} from './migration.js';
export type {
  MigrationStatus,
  MigrationSource,
  MigrationTarget,
  MigrationStepName,
  MigrationStep,
  RecordCountReport,
  ChecksumReport,
  DataIntegrityReport,
  TrafficSwitchPlan,
  RollbackPlan,
  MigrationFailure,
  MigrationPreflight,
  MigrationPlan,
  MigrationAuditEvent,
  MigrationGateEvaluation,
  SuperAdminLifecycleMonitoringMetric,
  SuperAdminLifecycleMonitoringView,
} from './migration.js';

export const DATA_LIFECYCLE_CONTRACTS_VERSION = '0.1.0-phase2ad' as const;
