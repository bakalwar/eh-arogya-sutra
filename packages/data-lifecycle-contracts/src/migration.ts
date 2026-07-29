import { FoundationStatus } from '@ehas2/shared';

/**
 * Free-to-paid / environment migration — contracts and NOT_IMPLEMENTED services only.
 * The future Super Admin Migration Control must not switch traffic without gates.
 */
export const MIGRATION_CONTROL_STATES = [
  'NOT_CONFIGURED',
  'PREFLIGHT_RUNNING',
  'PREFLIGHT_FAILED',
  'TARGET_READY',
  'BACKUP_RUNNING',
  'COPYING',
  'VALIDATING',
  'AWAITING_OWNER_CONFIRMATION',
  'SWITCHING_TRAFFIC',
  'MONITORING',
  'COMPLETED',
  'ROLLBACK_AVAILABLE',
  'ROLLING_BACK',
  'FAILED',
] as const;

export type MigrationStatus = (typeof MIGRATION_CONTROL_STATES)[number];

export type MigrationSource = {
  environmentId: string;
  label: string;
  providerNeutral: true;
};

export type MigrationTarget = {
  environmentId: string;
  label: string;
  providerNeutral: true;
  provisioned: boolean;
};

export type MigrationStepName =
  | 'preflight'
  | 'paid_target_provisioning'
  | 'configuration_validation'
  | 'schema_migration'
  | 'encrypted_source_backup'
  | 'restore_copy_to_target'
  | 'record_count_comparison'
  | 'checksum_integrity_validation'
  | 'permission_verification'
  | 'readonly_smoke_tests'
  | 'application_health_checks'
  | 'temp_upload_store_emptiness'
  | 'maintenance_window'
  | 'final_incremental_sync'
  | 'owner_confirmation'
  | 'traffic_switch'
  | 'post_switch_monitoring'
  | 'rollback_window'
  | 'source_retirement';

export type MigrationStep = {
  step: MigrationStepName;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  resumable: true;
  idempotent: true;
  patientDataInLogsForbidden: true;
};

export type RecordCountReport = {
  entity: string;
  sourceCount: number | null;
  targetCount: number | null;
  matched: boolean | null;
};

export type ChecksumReport = {
  scope: string;
  sourceChecksum: string | null;
  targetChecksum: string | null;
  matched: boolean | null;
};

export type DataIntegrityReport = {
  recordCounts: readonly RecordCountReport[];
  checksums: readonly ChecksumReport[];
  validationPassed: boolean;
  temporaryReportsPresentInBackup: false;
};

export type TrafficSwitchPlan = {
  requiresValidationPassed: true;
  requiresOwnerConfirmation: true;
  requiresVerifiedBackup: true;
  requiresRollbackPlan: true;
};

export type RollbackPlan = {
  required: true;
  tested: boolean;
  windowHours: number;
  status: typeof FoundationStatus.NOT_IMPLEMENTED | 'DOCUMENTED';
};

export type MigrationFailure = {
  step: MigrationStepName | null;
  code: string;
  safeMessage: string;
  reportContentPresent: false;
  patientIdentityPresent: false;
};

export type MigrationPreflight = {
  checks: readonly string[];
  passed: boolean | null;
  status: typeof FoundationStatus.NOT_IMPLEMENTED | 'RUNNING' | 'PASSED' | 'FAILED';
};

export type MigrationPlan = {
  planId: string;
  source: MigrationSource;
  target: MigrationTarget;
  steps: readonly MigrationStep[];
  status: MigrationStatus;
  backupVerifiedRequired: true;
  integrityValidationRequired: true;
  ownerConfirmationRequired: true;
  rollbackPlanRequired: true;
  superAdminOnly: true;
  managementAdminMayTrigger: false;
  workingButtonImplemented: false;
};

export type MigrationAuditEvent = {
  eventId: string;
  actorId: string;
  actorRole: string;
  action: string;
  fromStatus: MigrationStatus | null;
  toStatus: MigrationStatus | null;
  reason: string;
  requestId: string;
  timestamp: string;
  reauthConfirmed: boolean;
  ownerConfirmationPresent: boolean;
  patientDataPresent: false;
  reportContentPresent: false;
};

export const ORDERED_MIGRATION_STEPS: readonly MigrationStepName[] = [
  'preflight',
  'paid_target_provisioning',
  'configuration_validation',
  'schema_migration',
  'encrypted_source_backup',
  'restore_copy_to_target',
  'record_count_comparison',
  'checksum_integrity_validation',
  'permission_verification',
  'readonly_smoke_tests',
  'application_health_checks',
  'temp_upload_store_emptiness',
  'maintenance_window',
  'final_incremental_sync',
  'owner_confirmation',
  'traffic_switch',
  'post_switch_monitoring',
  'rollback_window',
  'source_retirement',
];

export function createDefaultMigrationPlan(input: {
  planId: string;
  sourceLabel: string;
  targetLabel: string;
}): MigrationPlan {
  return {
    planId: input.planId,
    source: {
      environmentId: 'source',
      label: input.sourceLabel,
      providerNeutral: true,
    },
    target: {
      environmentId: 'target',
      label: input.targetLabel,
      providerNeutral: true,
      provisioned: false,
    },
    steps: ORDERED_MIGRATION_STEPS.map((step) => ({
      step,
      status: 'pending',
      resumable: true,
      idempotent: true,
      patientDataInLogsForbidden: true,
    })),
    status: 'NOT_CONFIGURED',
    backupVerifiedRequired: true,
    integrityValidationRequired: true,
    ownerConfirmationRequired: true,
    rollbackPlanRequired: true,
    superAdminOnly: true,
    managementAdminMayTrigger: false,
    workingButtonImplemented: false,
  };
}

export type MigrationGateEvaluation = {
  allowed: boolean;
  reason: string;
};

export function evaluateTrafficSwitchGate(input: {
  validationPassed: boolean;
  backupVerified: boolean;
  ownerConfirmed: boolean;
  rollbackPlanPresent: boolean;
  actorIsSuperAdmin: boolean;
}): MigrationGateEvaluation {
  if (!input.actorIsSuperAdmin) {
    return { allowed: false, reason: 'super_admin_only' };
  }
  if (!input.backupVerified) {
    return { allowed: false, reason: 'backup_not_verified' };
  }
  if (!input.validationPassed) {
    return { allowed: false, reason: 'validation_failed' };
  }
  if (!input.ownerConfirmed) {
    return { allowed: false, reason: 'owner_confirmation_required' };
  }
  if (!input.rollbackPlanPresent) {
    return { allowed: false, reason: 'rollback_plan_required' };
  }
  return { allowed: true, reason: 'gates_passed' };
}

export function managementAdminMayTriggerMigration(): false {
  return false;
}

/** Future Super Admin Migration Control — contract only. */
export class MigrationControlService {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  static trigger(_input: unknown): never {
    const err = new Error('MigrationControlService: NOT_IMPLEMENTED (contract only)');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

export type SuperAdminLifecycleMonitoringMetric =
  | 'database_capacity'
  | 'record_growth'
  | 'failed_backups'
  | 'overdue_restore_test'
  | 'temporary_report_cleanup_backlog'
  | 'deletion_verification_failures'
  | 'orphan_temporary_objects'
  | 'migration_readiness'
  | 'migration_progress_failure'
  | 'rollback_readiness'
  | 'integrity_mismatch';

export type SuperAdminLifecycleMonitoringView = {
  metrics: readonly SuperAdminLifecycleMonitoringMetric[];
  reportContentVisible: false;
  patientIdentityVisible: false;
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export const SUPER_ADMIN_LIFECYCLE_MONITORING: SuperAdminLifecycleMonitoringView = {
  metrics: [
    'database_capacity',
    'record_growth',
    'failed_backups',
    'overdue_restore_test',
    'temporary_report_cleanup_backlog',
    'deletion_verification_failures',
    'orphan_temporary_objects',
    'migration_readiness',
    'migration_progress_failure',
    'rollback_readiness',
    'integrity_mismatch',
  ],
  reportContentVisible: false,
  patientIdentityVisible: false,
  status: FoundationStatus.NOT_IMPLEMENTED,
};
