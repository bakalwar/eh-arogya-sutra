import { FoundationStatus } from '@ehas2/shared';

/**
 * Free/low-cost pilot environment — must not claim 100,000-doctor readiness.
 */
export type FreePilotEnvironmentLimits = {
  maxInvitedDoctors: number;
  maxConcurrentUsers: number;
  dailyCaseLimit: number;
  reportProcessingConcurrency: number;
  databaseStorageLimitGb: number;
  cpuMemoryLabel: string;
  requestTimeoutSeconds: number;
  backupCapability: 'limited' | 'none' | 'full';
  serviceSleepColdStart: boolean;
  monitoringLimitations: string;
  claimsHundredThousandDoctorReadiness: false;
};

export const DEFAULT_FREE_PILOT_LIMITS: FreePilotEnvironmentLimits = {
  maxInvitedDoctors: 25,
  maxConcurrentUsers: 50,
  dailyCaseLimit: 200,
  reportProcessingConcurrency: 2,
  databaseStorageLimitGb: 5,
  cpuMemoryLabel: 'shared / burstable (pilot only)',
  requestTimeoutSeconds: 30,
  backupCapability: 'limited',
  serviceSleepColdStart: true,
  monitoringLimitations: 'Basic health only; no production SLO alerting',
  claimsHundredThousandDoctorReadiness: false,
};

export type CapacityThreshold = {
  thresholdId: string;
  metric: string;
  warningAt: number;
  criticalAt: number;
  unit: string;
  triggersMigrationPlanning: boolean;
};

export type CapacityAlert = {
  alertId: string;
  thresholdId: string;
  severity: 'warning' | 'critical';
  observedValue: number | null;
  message: string;
  patientIdentityPresent: false;
  reportContentPresent: false;
  status: typeof FoundationStatus.NOT_IMPLEMENTED | 'RAISED';
};

export const DEFAULT_CAPACITY_THRESHOLDS: readonly CapacityThreshold[] = [
  {
    thresholdId: 'doctors-invited',
    metric: 'invited_doctors',
    warningAt: 15,
    criticalAt: 25,
    unit: 'doctors',
    triggersMigrationPlanning: true,
  },
  {
    thresholdId: 'storage-gb',
    metric: 'database_storage_gb',
    warningAt: 3,
    criticalAt: 4.5,
    unit: 'GB',
    triggersMigrationPlanning: true,
  },
  {
    thresholdId: 'daily-cases',
    metric: 'daily_cases',
    warningAt: 120,
    criticalAt: 180,
    unit: 'cases/day',
    triggersMigrationPlanning: true,
  },
];

export type DatabasePortabilityPlan = {
  targetEngine: 'PostgreSQL';
  schemaMigrationsRequired: true;
  providerIndependentSqlPreferred: true;
  hardcodedExtensionsRequireAdr: true;
  connectionStringViaEnvironment: true;
  connectionPoolingRequired: true;
  tenantIndexesRequired: true;
  backupRestoreRequired: true;
  migrationChecksumsRequired: true;
  healthReadinessRequired: true;
  filesystemDependentClinicalRecordsForbidden: true;
  sqliteAsFinalHundredThousandDoctorDbForbidden: true;
  implementationPhase: 'Phase 3';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export const DATABASE_PORTABILITY_PLAN: DatabasePortabilityPlan = {
  targetEngine: 'PostgreSQL',
  schemaMigrationsRequired: true,
  providerIndependentSqlPreferred: true,
  hardcodedExtensionsRequireAdr: true,
  connectionStringViaEnvironment: true,
  connectionPoolingRequired: true,
  tenantIndexesRequired: true,
  backupRestoreRequired: true,
  migrationChecksumsRequired: true,
  healthReadinessRequired: true,
  filesystemDependentClinicalRecordsForbidden: true,
  sqliteAsFinalHundredThousandDoctorDbForbidden: true,
  implementationPhase: 'Phase 3',
  status: FoundationStatus.NOT_IMPLEMENTED,
};
