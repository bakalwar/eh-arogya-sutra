import { FoundationStatus } from '@ehas2/shared';

/**
 * Encrypted backup / restore foundation — disaster recovery is NOT ready until Phase 13 drills.
 */
export type BackupPlan = {
  encryptedDatabaseBackupRequired: true;
  frequency: string;
  retentionDays: number;
  accessPolicy: string;
  integrityCheckRequired: true;
  restoreTestingRequired: true;
  recoveryPointObjectiveHours: number;
  recoveryTimeObjectiveHours: number;
  failedBackupAlertRequired: true;
  restoreDrillEvidenceRequired: true;
  temporaryReportObjectsIncluded: false;
  clinicalTextAndPrescriptionSnapshotsIncluded: true;
  disasterRecoveryReadyClaim: false;
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export const DEFAULT_BACKUP_PLAN: BackupPlan = {
  encryptedDatabaseBackupRequired: true,
  frequency: 'daily',
  retentionDays: 30,
  accessPolicy: 'least-privilege Super Admin / ops only',
  integrityCheckRequired: true,
  restoreTestingRequired: true,
  recoveryPointObjectiveHours: 24,
  recoveryTimeObjectiveHours: 8,
  failedBackupAlertRequired: true,
  restoreDrillEvidenceRequired: true,
  temporaryReportObjectsIncluded: false,
  clinicalTextAndPrescriptionSnapshotsIncluded: true,
  disasterRecoveryReadyClaim: false,
  status: FoundationStatus.NOT_IMPLEMENTED,
};

export type BackupVerification = {
  backupId: string;
  verified: boolean;
  checksum: string | null;
  verifiedAt: string | null;
  temporaryReportsPresent: false;
  clinicalTextPresent: boolean | null;
  status: typeof FoundationStatus.NOT_IMPLEMENTED | 'VERIFIED' | 'FAILED';
};

export type DataRetentionClass =
  | 'patient_clinical_records'
  | 'consultation_history'
  | 'prescription_snapshots'
  | 'audit_logs'
  | 'support_feedback'
  | 'temporary_report_objects'
  | 'extracted_findings'
  | 'backups';

export type DataRetentionPolicyHook =
  | 'patient_data_export'
  | 'correction'
  | 'retention_review'
  | 'authorized_deletion_request'
  | 'legal_hold'
  | 'secure_deletion'
  | 'backup_expiry';

export type DataRetentionPolicy = {
  class: DataRetentionClass;
  description: string;
  immediatePermanentDeletionWithoutReviewForbidden: true;
  hooks: readonly DataRetentionPolicyHook[];
  legalComplianceReviewRequired: true;
};

export const DATA_RETENTION_POLICIES: readonly DataRetentionPolicy[] = [
  {
    class: 'patient_clinical_records',
    description: 'Structured patient and consultation clinical records.',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: [
      'patient_data_export',
      'correction',
      'retention_review',
      'authorized_deletion_request',
      'legal_hold',
      'secure_deletion',
    ],
    legalComplianceReviewRequired: true,
  },
  {
    class: 'consultation_history',
    description: 'Visit history with structured clinical fields and snapshots.',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: ['retention_review', 'authorized_deletion_request', 'legal_hold', 'secure_deletion'],
    legalComplianceReviewRequired: true,
  },
  {
    class: 'prescription_snapshots',
    description: 'Immutable prescription versions and readable snapshots.',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: ['retention_review', 'legal_hold', 'secure_deletion'],
    legalComplianceReviewRequired: true,
  },
  {
    class: 'audit_logs',
    description: 'Security and clinical audit metadata.',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: ['retention_review', 'legal_hold'],
    legalComplianceReviewRequired: true,
  },
  {
    class: 'support_feedback',
    description: 'Doctor feedback and support tickets (no patient PHI by default).',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: ['retention_review', 'authorized_deletion_request', 'secure_deletion'],
    legalComplianceReviewRequired: true,
  },
  {
    class: 'temporary_report_objects',
    description: 'Ephemeral report processing objects — short TTL, never permanent.',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: ['secure_deletion', 'backup_expiry'],
    legalComplianceReviewRequired: true,
  },
  {
    class: 'extracted_findings',
    description: 'Verified structured findings extracted from temporary reports.',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: ['correction', 'retention_review', 'authorized_deletion_request', 'legal_hold'],
    legalComplianceReviewRequired: true,
  },
  {
    class: 'backups',
    description: 'Encrypted backups of clinical text and snapshots — never original report files.',
    immediatePermanentDeletionWithoutReviewForbidden: true,
    hooks: ['backup_expiry', 'legal_hold', 'secure_deletion'],
    legalComplianceReviewRequired: true,
  },
];

export class BackupService {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  static createBackup(_input: unknown): never {
    const err = new Error('BackupService: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}
