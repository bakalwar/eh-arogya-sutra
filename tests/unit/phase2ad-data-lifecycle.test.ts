import { describe, expect, it } from 'vitest';
import {
  assertFindingHasVerificationStatus,
  assertNoBase64InFinding,
  assertNoOriginalReportInConsultation,
  assertPrescriptionImmutable,
  createDataServiceNotInstalledDashboard,
  createNextPrescriptionVersion,
  CLINICAL_DATA_SERVICE_STATUS,
  type ConsultationRecord,
  type PrescriptionSnapshot,
  type StructuredReportFinding,
} from '../../packages/clinical-contracts/src/index.ts';
import {
  assertNoProviderCredentialsInCatalog,
  createDefaultMigrationPlan,
  createDeletionFailureAlert,
  createNotImplementedProviderCatalog,
  createTempReportProcessingContext,
  DEFAULT_BACKUP_PLAN,
  DEFAULT_FREE_PILOT_LIMITS,
  DATABASE_PORTABILITY_PLAN,
  evaluateTrafficSwitchGate,
  managementAdminMayTriggerMigration,
  MigrationControlService,
  PROHIBITED_PERSISTENT_REPORT_ARTIFACTS,
  requiresCleanup,
  TEMP_REPORT_LIFECYCLE_STATES,
} from '../../packages/data-lifecycle-contracts/src/index.ts';
import {
  createPrincipalForPolicyEvaluation,
  evaluatePatientHistoryAccess,
  evaluateCrossTenantHistoryDenied,
  PlatformRole,
  rejectTestPrincipalInProduction,
} from '../../packages/security/src/index.ts';

const ownership = {
  organizationTenantId: 'tenant-a',
  clinicId: 'clinic-a',
  patientId: 'pat-1',
  consultationId: 'cons-1',
  responsibleDoctorId: 'doc-1',
  createdByPrincipalId: 'doc-1',
  updatedByPrincipalId: 'doc-1',
  createdAt: '2026-07-29T00:00:00.000Z',
  updatedAt: '2026-07-29T00:00:00.000Z',
};

function samplePrescription(versionNumber = 1): PrescriptionSnapshot {
  return {
    prescriptionId: `rx-${versionNumber}`,
    consultationId: 'cons-1',
    versionNumber,
    previousVersionId: versionNumber > 1 ? `rx-${versionNumber - 1}` : null,
    status: 'issued',
    structuredPrescription: {
      oralFormulas: [],
      tabletSectionA: null,
      tabletSectionBSlots: [],
      externalApplications: [],
      dietGuidance: null,
      safetyWarnings: [],
      followUp: null,
    },
    readableSnapshot: 'Oral: none\nTablets: none',
    engine: { engineVersion: '0', ruleVersion: '0' },
    data: { diseaseDataVersion: '0', medicineDataVersion: '0' },
    clinicianReview: {
      decision: 'accepted',
      modificationReason: null,
      reviewedByPrincipalId: 'doc-1',
      reviewedAt: '2026-07-29T00:00:00.000Z',
    },
    modificationReason: null,
    createdAt: '2026-07-29T00:00:00.000Z',
    contentHash: 'hash-v1',
    auditEventId: 'audit-1',
    immutable: true,
  };
}

function sampleConsultation(): ConsultationRecord {
  return {
    ownership,
    status: 'COMPLETED',
    chiefComplaint: { text: 'Headache', onset: null, duration: null },
    symptoms: [],
    vitals: null,
    clinicalContext: null,
    structuredReportFindings: [],
    analysis: null,
    currentPrescriptionId: 'rx-1',
    clinicalSummarySnapshotId: 'sum-1',
    clinicianReview: {
      decision: 'accepted',
      modificationReason: null,
      reviewedByPrincipalId: 'doc-1',
      reviewedAt: '2026-07-29T00:00:00.000Z',
    },
    audit: {
      createdByPrincipalId: 'doc-1',
      updatedByPrincipalId: 'doc-1',
      createdAt: '2026-07-29T00:00:00.000Z',
      updatedAt: '2026-07-29T00:00:00.000Z',
      requestId: 'req-1',
      engine: null,
      data: null,
    },
    originalReportFilesPresent: false,
    originalPhotoFilesPresent: false,
    reportBase64Present: false,
  };
}

function sampleFinding(): StructuredReportFinding {
  return {
    findingId: 'f-1',
    processingId: 'proc-1',
    extractedValueText: 'Hb 12.1',
    normalizedFinding: 'hemoglobin',
    sourceCategory: 'lab_pdf',
    confidence: 0.8,
    units: 'g/dL',
    referenceRange: null,
    verificationStatus: 'EXTRACTED_UNVERIFIED',
    doctorCorrection: null,
    correctionReason: null,
    verifiedByPrincipalId: null,
    verifiedAt: null,
    engineVersion: 'ocr-0',
    originalFilePresent: false,
    originalBytesPresent: false,
    base64Present: false,
  };
}

describe('Phase 2A-D tenant-scoped history', () => {
  const doctorA = createPrincipalForPolicyEvaluation({
    subjectId: 'doc-1',
    role: PlatformRole.Doctor,
    tenantId: 'tenant-a',
    isTestPrincipal: true,
  });
  const management = createPrincipalForPolicyEvaluation({
    subjectId: 'ma-1',
    role: PlatformRole.ManagementAdmin,
    tenantId: null,
    isTestPrincipal: true,
  });
  const superAdmin = createPrincipalForPolicyEvaluation({
    subjectId: 'sa-1',
    role: PlatformRole.SuperAdmin,
    tenantId: null,
    isTestPrincipal: true,
  });

  it('1. doctor history query requires trusted tenant context', () => {
    const allowed = evaluatePatientHistoryAccess({
      principal: doctorA,
      trustedTenantId: 'tenant-a',
      ownerDoctorId: 'doc-1',
    });
    expect(allowed.allowed).toBe(true);
    expect(allowed.policy).toBe('patient-history-v1');
  });

  it('2. Doctor A cannot read Clinic B patient history', () => {
    const denied = evaluateCrossTenantHistoryDenied({
      principal: doctorA,
      otherTenantId: 'tenant-b',
      patientOwnerDoctorId: 'doc-other',
    });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe('tenant_mismatch');
  });

  it('3. Management Admin has no default patient-PHI access', () => {
    expect(
      evaluatePatientHistoryAccess({
        principal: management,
        trustedTenantId: 'tenant-a',
      }).reason,
    ).toBe('management_no_default_patient_phi');
  });

  it('4. Super Admin has no default patient-PHI access', () => {
    expect(
      evaluatePatientHistoryAccess({
        principal: superAdmin,
        trustedTenantId: 'tenant-a',
      }).reason,
    ).toBe('super_admin_no_default_patient_resource_access');
  });
});

describe('Phase 2A-D immutable prescription and non-retention', () => {
  it('5. prescription versions are immutable', () => {
    expect(assertPrescriptionImmutable(samplePrescription())).toBe(true);
  });

  it('6. modification creates new-version contract', () => {
    const previous = samplePrescription(1);
    const next = createNextPrescriptionVersion({
      previous,
      structuredPrescription: previous.structuredPrescription,
      readableSnapshot: 'Modified readable snapshot',
      clinicianReview: {
        decision: 'modified',
        modificationReason: 'Dose clarification',
        reviewedByPrincipalId: 'doc-1',
        reviewedAt: '2026-07-29T01:00:00.000Z',
      },
      modificationReason: 'Dose clarification',
      createdAt: '2026-07-29T01:00:00.000Z',
      contentHash: 'hash-v2',
      auditEventId: 'audit-2',
      engine: previous.engine,
      data: previous.data,
    });
    expect(next.versionNumber).toBe(2);
    expect(next.previousVersionId).toBe(previous.prescriptionId);
    expect(previous.versionNumber).toBe(1);
    expect(next.contentHash).not.toBe(previous.contentHash);
  });

  it('7. original report is not part of persistent record contract', () => {
    expect(assertNoOriginalReportInConsultation(sampleConsultation())).toBe(true);
    expect(PROHIBITED_PERSISTENT_REPORT_ARTIFACTS).toContain('pdf');
    expect(PROHIBITED_PERSISTENT_REPORT_ARTIFACTS).toContain('patient_photograph');
  });

  it('8. base64/report bytes cannot enter saved clinical contract', () => {
    const finding = sampleFinding();
    expect(assertNoBase64InFinding(finding)).toBe(true);
    expect(sampleConsultation().reportBase64Present).toBe(false);
  });

  it('9. extracted finding requires verification status', () => {
    expect(assertFindingHasVerificationStatus(sampleFinding())).toBe(true);
  });
});

describe('Phase 2A-D temporary report lifecycle', () => {
  it('10. temporary report lifecycle includes cleanup', () => {
    const ctx = createTempReportProcessingContext({
      processingId: 'proc-rand-1',
      tenantId: 'tenant-a',
      clinicId: 'clinic-a',
      doctorId: 'doc-1',
      ttlExpiresAt: '2026-07-29T01:00:00.000Z',
    });
    expect(TEMP_REPORT_LIFECYCLE_STATES).toContain('OriginalDeleted');
    expect(TEMP_REPORT_LIFECYCLE_STATES).toContain('DeletionVerified');
    expect(ctx.cleanupRequiredOn).toContain('success');
    expect(requiresCleanup('success')).toBe(true);
  });

  it('11. error/cancel/timeout paths require cleanup', () => {
    expect(requiresCleanup('error')).toBe(true);
    expect(requiresCleanup('timeout')).toBe(true);
    expect(requiresCleanup('user_cancellation')).toBe(true);
  });

  it('12. deletion failure generates safe escalation', () => {
    const alert = createDeletionFailureAlert({
      alertId: 'alert-1',
      processingId: 'proc-1',
      tenantId: 'tenant-a',
      retryCount: 5,
      createdAt: '2026-07-29T02:00:00.000Z',
    });
    expect(alert.status).toBe('DELETION_VERIFICATION_FAILED');
    expect(alert.escalatedToSuperAdminOps).toBe(true);
  });

  it('13. report content is absent from alerts/logs', () => {
    const alert = createDeletionFailureAlert({
      alertId: 'alert-2',
      processingId: 'proc-2',
      tenantId: 'tenant-a',
      retryCount: 1,
      createdAt: '2026-07-29T02:00:00.000Z',
    });
    expect(alert.reportContentPresent).toBe(false);
    expect(JSON.stringify(alert)).not.toMatch(/base64|pdf bytes|report contents/i);
  });
});

describe('Phase 2A-D backup and migration safety', () => {
  it('14. temporary report objects are excluded from backups', () => {
    expect(DEFAULT_BACKUP_PLAN.temporaryReportObjectsIncluded).toBe(false);
  });

  it('15. text clinical records are included in protected backup plan', () => {
    expect(DEFAULT_BACKUP_PLAN.clinicalTextAndPrescriptionSnapshotsIncluded).toBe(true);
  });

  it('16. migration requires verified backup', () => {
    const plan = createDefaultMigrationPlan({
      planId: 'mig-1',
      sourceLabel: 'pilot',
      targetLabel: 'paid',
    });
    expect(plan.backupVerifiedRequired).toBe(true);
    expect(
      evaluateTrafficSwitchGate({
        validationPassed: true,
        backupVerified: false,
        ownerConfirmed: true,
        rollbackPlanPresent: true,
        actorIsSuperAdmin: true,
      }).reason,
    ).toBe('backup_not_verified');
  });

  it('17. migration requires integrity comparison', () => {
    expect(
      createDefaultMigrationPlan({ planId: 'mig-2', sourceLabel: 'a', targetLabel: 'b' })
        .integrityValidationRequired,
    ).toBe(true);
  });

  it('18. migration requires owner confirmation', () => {
    expect(
      evaluateTrafficSwitchGate({
        validationPassed: true,
        backupVerified: true,
        ownerConfirmed: false,
        rollbackPlanPresent: true,
        actorIsSuperAdmin: true,
      }).reason,
    ).toBe('owner_confirmation_required');
  });

  it('19. traffic switch cannot occur after failed validation', () => {
    expect(
      evaluateTrafficSwitchGate({
        validationPassed: false,
        backupVerified: true,
        ownerConfirmed: true,
        rollbackPlanPresent: true,
        actorIsSuperAdmin: true,
      }).allowed,
    ).toBe(false);
  });

  it('20. rollback plan is required', () => {
    expect(
      evaluateTrafficSwitchGate({
        validationPassed: true,
        backupVerified: true,
        ownerConfirmed: true,
        rollbackPlanPresent: false,
        actorIsSuperAdmin: true,
      }).reason,
    ).toBe('rollback_plan_required');
  });

  it('21. migration is Super Admin-only', () => {
    expect(
      createDefaultMigrationPlan({ planId: 'mig-3', sourceLabel: 'a', targetLabel: 'b' })
        .superAdminOnly,
    ).toBe(true);
    expect(
      evaluateTrafficSwitchGate({
        validationPassed: true,
        backupVerified: true,
        ownerConfirmed: true,
        rollbackPlanPresent: true,
        actorIsSuperAdmin: false,
      }).reason,
    ).toBe('super_admin_only');
  });

  it('22. Management Admin cannot trigger migration', () => {
    expect(managementAdminMayTriggerMigration()).toBe(false);
    expect(
      createDefaultMigrationPlan({ planId: 'mig-4', sourceLabel: 'a', targetLabel: 'b' })
        .managementAdminMayTrigger,
    ).toBe(false);
  });

  it('23. provider credentials are absent', () => {
    expect(assertNoProviderCredentialsInCatalog(createNotImplementedProviderCatalog())).toBe(true);
  });

  it('24. free environment cannot claim 100,000-doctor readiness', () => {
    expect(DEFAULT_FREE_PILOT_LIMITS.claimsHundredThousandDoctorReadiness).toBe(false);
    expect(DEFAULT_FREE_PILOT_LIMITS.maxInvitedDoctors).toBeLessThan(1000);
    expect(DATABASE_PORTABILITY_PLAN.sqliteAsFinalHundredThousandDoctorDbForbidden).toBe(true);
  });

  it('25. data-service absence returns truthful NOT_INSTALLED state', () => {
    const dash = createDataServiceNotInstalledDashboard('doc-1', 'tenant-a');
    expect(dash.status).toBe(CLINICAL_DATA_SERVICE_STATUS);
    expect(dash.metrics.totalPermittedPatients).toBeNull();
  });

  it('migration control remains NOT_IMPLEMENTED and production rejects test identity', () => {
    expect(MigrationControlService.status).toBe('NOT_IMPLEMENTED');
    expect(
      createDefaultMigrationPlan({ planId: 'mig-5', sourceLabel: 'a', targetLabel: 'b' })
        .workingButtonImplemented,
    ).toBe(false);
    const testPrincipal = createPrincipalForPolicyEvaluation({
      subjectId: 'sa-test',
      role: PlatformRole.SuperAdmin,
      tenantId: null,
      isTestPrincipal: true,
    });
    expect(rejectTestPrincipalInProduction(testPrincipal, 'production').allowed).toBe(false);
  });
});
