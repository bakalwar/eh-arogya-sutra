/**
 * Super Admin / operations contracts — Phase 1A-H shells only.
 * Live monitoring, auth, and alerts activate in later phases (see engineering-phases.md).
 * No fake “healthy production” success; unimplemented services return NOT_IMPLEMENTED.
 */
import { FoundationStatus, type FoundationStatusCode } from '@ehas2/shared';

export const OPS_CONTRACTS_VERSION = '0.1.0-phase1a' as const;
export const OPS_CONTRACTS_STATUS = 'NOT_IMPLEMENTED' as const;

export type AlertSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export type AcknowledgementStatus = 'unacknowledged' | 'acknowledged' | 'escalated' | 'resolved';

export type SupportTicketStatus = 'New' | 'Investigating' | 'Waiting' | 'Resolved' | 'Closed';

export type HealthState = 'unknown' | 'healthy' | 'degraded' | 'unhealthy' | 'not_ready';

/** Process liveness — must not be treated as clinical or dependency readiness. */
export type HealthStatus = {
  ok: boolean;
  service: string;
  phase: string;
  checkedAt: string;
  requestId?: string;
};

/** Dependency / data readiness — false while required services are absent. */
export type ReadinessStatus = {
  ready: boolean;
  clinicalEngine: boolean;
  dataPackages: boolean;
  authentication: boolean;
  patientDatabase: boolean;
  payment: boolean;
  monitoring: boolean;
  superAdminControlPlane: boolean;
  checkedAt: string;
  requestId?: string;
};

export type ServiceStatus = {
  serviceId: string;
  state: HealthState;
  statusCode: FoundationStatusCode;
  message: string;
  releaseVersion?: string;
  checkedAt: string;
};

export type SecurityEvent = {
  eventId: string;
  eventType: string;
  timestamp: string;
  environment: string;
  actorId?: string;
  actorRole?: string;
  tenantId?: string;
  sourceIpClassification?: 'trusted' | 'untrusted' | 'unknown';
  deviceOrSessionId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  result: 'allowed' | 'denied' | 'error' | 'unknown';
  riskScore?: number;
  requestId: string;
  traceId: string;
  releaseVersion?: string;
  /** Redacted metadata only — never secrets or patient content. */
  redactedContext?: Record<string, string | number | boolean | null>;
};

export type AuditEvent = {
  eventId: string;
  timestamp: string;
  environment: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  tenantId?: string;
  reason?: string;
  requestId: string;
  traceId: string;
  result: 'success' | 'failure' | 'denied';
  immutable: true;
  releaseVersion?: string;
};

export type Incident = {
  incidentId: string;
  severity: AlertSeverity;
  title: string;
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  service: string;
  environment: string;
  openedAt: string;
  owner?: string;
  requestId?: string;
  traceId?: string;
  runbookId?: string;
  /** Safe redacted context only. */
  redactedSummary: string;
};

export type Alert = {
  alertId: string;
  severity: AlertSeverity;
  timestamp: string;
  service: string;
  environment: string;
  releaseVersion?: string;
  errorCode?: string;
  requestId?: string;
  traceId?: string;
  affectedScope: string;
  redactedContext: string;
  runbookLink?: string;
  acknowledgementStatus: AcknowledgementStatus;
  owner?: string;
  escalationTimerMinutes?: number;
};

export type DoctorProblemReport = {
  supportId: string;
  category: string;
  shortDescription: string;
  affectedPageOrAction?: string;
  screenshotConsent: boolean;
  appVersion?: string;
  browser?: string;
  deviceType?: string;
  timestamp: string;
  routeName?: string;
  requestId?: string;
  recentErrorCode?: string;
  tenantId?: string;
  /** Explicitly forbidden fields must never appear on this type. */
};

export type SupportTicket = {
  ticketId: string;
  supportId: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  doctorVisibleStatus: SupportTicketStatus;
  /** Internal security details must never be copied into doctor-visible fields. */
};

export type DeploymentStatus = {
  deploymentId: string;
  environment: string;
  releaseVersion: string;
  state: 'unknown' | 'pending' | 'in_progress' | 'succeeded' | 'failed' | 'rolled_back';
  statusCode: FoundationStatusCode;
  checkedAt: string;
};

export type BackupStatus = {
  backupId: string;
  environment: string;
  lastSuccessAt?: string;
  ageHours?: number;
  state: HealthState;
  statusCode: FoundationStatusCode;
  restoreTestStatus?: 'unknown' | 'passed' | 'failed' | 'not_run';
};

export type CertificateStatus = {
  certificateId: string;
  hostname: string;
  expiresAt?: string;
  daysRemaining?: number;
  state: HealthState;
  statusCode: FoundationStatusCode;
};

export type CapacityStatus = {
  resource: 'cpu' | 'memory' | 'disk' | 'db_pool' | 'queue' | 'storage';
  utilizationPercent?: number;
  state: HealthState;
  statusCode: FoundationStatusCode;
  checkedAt: string;
};

export type ClinicalEngineHealth = {
  state: HealthState;
  statusCode: FoundationStatusCode;
  engineVersion?: string;
  ruleVersion?: string;
  diseaseDataVersion?: string;
  medicineDataVersion?: string;
  analysisStartedCount?: number;
  analysisFailedCount?: number;
  fallbackRate?: number;
  /** Never include identifiable clinical content. */
};

export type ReportProcessingHealth = {
  state: HealthState;
  statusCode: FoundationStatusCode;
  uploadFailures?: number;
  ocrFailures?: number;
  queueDepth?: number;
  oldestJobAgeSeconds?: number;
};

export type HighRiskActionRequest = {
  action: string;
  actorId: string;
  reason: string;
  requestId: string;
  requiresReauth: true;
  requiresAudit: true;
};

/** Explicit non-live marker for Phase 1A-H shells. */
export function notImplementedService(serviceId: string): ServiceStatus {
  return {
    serviceId,
    state: 'not_ready',
    statusCode: FoundationStatus.NOT_IMPLEMENTED,
    message: `${serviceId} is NOT_IMPLEMENTED (Phase 1A-H shell only; not live)`,
    checkedAt: new Date().toISOString(),
  };
}
