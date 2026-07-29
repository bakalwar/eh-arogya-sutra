import { describe, expect, it } from 'vitest';
import {
  Permission,
  PlatformRole,
  assertClinicAdminNotPlatformManagement,
  assertNoManagementPhiByDefault,
  createPrincipalForPolicyEvaluation,
  createTrustedAuthzContext,
  doctorCannotElevateViaPayload,
  doctorSeesFeedbackAndSupport,
  evaluateAuthorization,
  evaluateManagementShellAccess,
  evaluateResourceOwnership,
  managementCannotAccessSuperAdminByDefault,
  managementNavigationVisible,
  rejectClientSuppliedRoleGrant,
  rejectTestPrincipalInProduction,
  roleHasPermission,
  switchTrustedWorkspace,
  WorkspaceKind,
} from '../../packages/security/src/index.ts';
import {
  createNotConnectedManagementDashboard,
  createNotConnectedRevenueSummary,
  evaluateTestimonialPublication,
  FeedbackCategory,
  FeedbackModerationService,
  managementNavExcludesSuperAdminControls,
  MANAGEMENT_NAV_ITEMS,
} from '../../packages/management-contracts/src/index.ts';
import {
  doctorNavExcludesManagementAdmin,
  doctorNavExcludesSuperAdmin,
  doctorNavIncludesFeedbackAndSupport,
  DOCTOR_NAV_ITEMS,
} from '../../apps/web/src/config/navigation.ts';

describe('Phase 2A-M visibility (Doctor UX)', () => {
  it('1. Doctor sees Feedback & Support', () => {
    expect(doctorNavIncludesFeedbackAndSupport()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.label === 'Feedback & Support')).toBe(true);
    const doctorCtx = createTrustedAuthzContext({
      subjectId: 'doc-1',
      memberships: [PlatformRole.Doctor],
      activeRole: PlatformRole.Doctor,
      tenantId: 'tenant-a',
    });
    expect(doctorSeesFeedbackAndSupport(doctorCtx)).toBe(true);
  });

  it('2. Doctor does not see Management Admin', () => {
    expect(doctorNavExcludesManagementAdmin()).toBe(true);
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => /management/i.test(i.label))).toBe(false);
  });
});

describe('Phase 2A-M management access policy', () => {
  const doctor = createPrincipalForPolicyEvaluation({
    subjectId: 'doc-1',
    role: PlatformRole.Doctor,
    tenantId: 'tenant-a',
    isTestPrincipal: true,
  });
  const clinicAdmin = createPrincipalForPolicyEvaluation({
    subjectId: 'ca-1',
    role: PlatformRole.ClinicAdmin,
    tenantId: 'tenant-a',
    isTestPrincipal: true,
  });
  const managementAdmin = createPrincipalForPolicyEvaluation({
    subjectId: 'ma-1',
    role: PlatformRole.ManagementAdmin,
    tenantId: null,
    isTestPrincipal: true,
  });
  const billing = createPrincipalForPolicyEvaluation({
    subjectId: 'bill-1',
    role: PlatformRole.BillingAdmin,
    tenantId: null,
    isTestPrincipal: true,
  });
  const verification = createPrincipalForPolicyEvaluation({
    subjectId: 'ver-1',
    role: PlatformRole.DoctorVerificationAdmin,
    tenantId: null,
    isTestPrincipal: true,
  });
  const finance = createPrincipalForPolicyEvaluation({
    subjectId: 'fin-1',
    role: PlatformRole.FinanceViewer,
    tenantId: null,
    isTestPrincipal: true,
  });
  const support = createPrincipalForPolicyEvaluation({
    subjectId: 'sup-1',
    role: PlatformRole.SupportAdmin,
    tenantId: null,
    isTestPrincipal: true,
  });

  it('3. Doctor cannot access /management shell', () => {
    expect(evaluateManagementShellAccess(PlatformRole.Doctor).allowed).toBe(false);
    expect(
      evaluateAuthorization({
        principal: doctor,
        permission: Permission.ManagementShellAccess,
      }).reason,
    ).toBe('permission_denied');
  });

  it('4. Clinic Admin cannot access platform Management Admin', () => {
    expect(assertClinicAdminNotPlatformManagement(PlatformRole.ClinicAdmin)).toBe(true);
    expect(
      evaluateAuthorization({
        principal: clinicAdmin,
        permission: Permission.ManagementShellAccess,
      }).allowed,
    ).toBe(false);
  });

  it('5. ManagementAdmin can access management shell policy', () => {
    expect(evaluateManagementShellAccess(PlatformRole.ManagementAdmin).allowed).toBe(true);
    expect(
      evaluateAuthorization({
        principal: managementAdmin,
        permission: Permission.ManagementShellAccess,
      }).allowed,
    ).toBe(true);
  });

  it('6. BillingAdmin cannot verify doctors', () => {
    expect(roleHasPermission(PlatformRole.BillingAdmin, Permission.DoctorVerificationReview)).toBe(
      false,
    );
    expect(
      evaluateAuthorization({
        principal: billing,
        permission: Permission.DoctorVerificationReview,
      }).allowed,
    ).toBe(false);
  });

  it('7. VerificationAdmin cannot issue refunds', () => {
    expect(roleHasPermission(PlatformRole.DoctorVerificationAdmin, Permission.RefundApprove)).toBe(
      false,
    );
    expect(
      evaluateAuthorization({
        principal: verification,
        permission: Permission.RefundApprove,
      }).allowed,
    ).toBe(false);
  });

  it('8. FinanceViewer cannot modify payments', () => {
    expect(roleHasPermission(PlatformRole.FinanceViewer, Permission.SubscriptionManage)).toBe(
      false,
    );
    expect(roleHasPermission(PlatformRole.FinanceViewer, Permission.RefundApprove)).toBe(false);
    expect(
      evaluateAuthorization({
        principal: finance,
        permission: Permission.RefundRequest,
      }).allowed,
    ).toBe(false);
  });

  it('9. SupportAdmin cannot view raw security incidents', () => {
    expect(roleHasPermission(PlatformRole.SupportAdmin, Permission.OpsSecurityRead)).toBe(false);
    expect(
      evaluateAuthorization({
        principal: support,
        permission: Permission.OpsSecurityRead,
      }).allowed,
    ).toBe(false);
  });

  it('10. ManagementAdmin cannot access Super Admin controls by default', () => {
    expect(managementCannotAccessSuperAdminByDefault(PlatformRole.ManagementAdmin)).toBe(true);
    expect(
      evaluateAuthorization({
        principal: managementAdmin,
        permission: Permission.SuperAdminControlPlane,
      }).allowed,
    ).toBe(false);
    expect(managementNavExcludesSuperAdminControls()).toBe(true);
    expect(MANAGEMENT_NAV_ITEMS.some((i) => i.href.includes('/ops'))).toBe(false);
  });

  it('11. Management roles cannot access patient PHI by default', () => {
    expect(assertNoManagementPhiByDefault(PlatformRole.ManagementAdmin)).toBe(true);
    expect(
      evaluateResourceOwnership(managementAdmin, {
        resourceKind: 'patient',
        resourceTenantId: 'tenant-a',
        ownerDoctorId: 'doc-1',
      }).reason,
    ).toBe('management_no_default_patient_phi');
    expect(
      evaluateAuthorization({
        principal: managementAdmin,
        permission: Permission.PatientRead,
      }).allowed,
    ).toBe(false);
  });

  it('12. client-supplied role cannot grant Management access', () => {
    expect(doctorCannotElevateViaPayload(PlatformRole.Doctor, 'ManagementAdmin')).toBe(false);
    expect(rejectClientSuppliedRoleGrant(doctor, 'ManagementAdmin').reason).toBe(
      'client_supplied_role_rejected',
    );
  });

  it('13. production rejects test Management identity', () => {
    expect(rejectTestPrincipalInProduction(managementAdmin, 'production').reason).toBe(
      'test_principal_rejected_in_production',
    );
    expect(
      evaluateAuthorization({
        principal: managementAdmin,
        permission: Permission.ManagementShellAccess,
        runtimeEnv: 'production',
      }).allowed,
    ).toBe(false);
  });
});

describe('Phase 2A-M feedback moderation', () => {
  const service = new FeedbackModerationService();

  it('14. feedback accepts valid negative feedback privately', () => {
    const result = service.moderate({
      category: FeedbackCategory.Bug,
      rating: 1,
      title: 'Broken filter',
      description: 'Patient list filter resets every time I change clinic.',
      affectedFeatureOrPage: '/patients',
      problemOrSuggestion: 'problem',
      reproducibility: 'always',
    });
    expect(result.decision).toBe('ACCEPTED_PRIVATE');
    expect(result.reasonCode).toBe('NEGATIVE_ACCEPTED_PRIVATE');
    expect(result.publishTestimonial).toBe(false);
  });

  it('15. positive feedback is not automatically published', () => {
    const result = service.moderate({
      category: FeedbackCategory.Appreciation,
      rating: 5,
      title: 'Loved the summary',
      description: 'Clinical summary layout is clear and calm for daily use.',
      affectedFeatureOrPage: '/cases/demo/summary',
      problemOrSuggestion: 'other',
      reproducibility: 'unknown',
      publicTestimonialConsent: true,
    });
    expect(result.publishTestimonial).toBe(false);
    expect(result.decision).toBe('ACCEPTED_PRIVATE');
  });

  it('16. spam can be rejected with reason', () => {
    const result = service.moderate({
      category: FeedbackCategory.Other,
      title: 'Buy now crypto airdrop!!!!!!',
      description: 'Buy now crypto airdrop free money click here viagra',
      affectedFeatureOrPage: '/dashboard',
      problemOrSuggestion: 'other',
      reproducibility: 'unknown',
    });
    expect(result.decision).toBe('SPAM_REJECTED');
    expect(result.reasonCode).toBe('AUTOMATED_SPAM');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('17. low-confidence moderation goes to NEEDS_REVIEW', () => {
    const result = service.moderate({
      category: FeedbackCategory.Bug,
      title: 'Strange ID field',
      description: 'Form showed diagnosis := unclear and patient id := demo label.',
      affectedFeatureOrPage: '/cases/new',
      problemOrSuggestion: 'problem',
      reproducibility: 'once',
    });
    expect(result.decision).toBe('NEEDS_REVIEW');
    expect(result.reasonCode).toBe('LOW_CONFIDENCE');
    expect(result.humanReviewRequired).toBe(true);
  });

  it('18. security feedback escalates without exposing attack details', () => {
    const result = service.moderate({
      category: FeedbackCategory.Bug,
      title: 'Possible XSS concern',
      description: 'I think there may be an XSS vector on a preview page.',
      affectedFeatureOrPage: '/ui-foundation',
      problemOrSuggestion: 'problem',
      reproducibility: 'unknown',
    });
    expect(result.decision).toBe('SECURITY_ESCALATED');
    expect(result.escalation.escalationKind).toBe('security');
    expect(result.escalation.safeStatus).toBe('Security review requested');
    expect(JSON.stringify(result)).not.toMatch(/raw attack|stack trace|waf rule/i);
  });

  it('19. testimonial requires explicit consent', () => {
    const denied = evaluateTestimonialPublication({
      publicTestimonialConsent: false,
      manualApprovalGranted: true,
    });
    expect(denied.allowed).toBe(false);
    expect(denied.decision).toBe('PUBLICATION_CONSENT_REQUIRED');
    const stillPending = evaluateTestimonialPublication({
      publicTestimonialConsent: true,
      manualApprovalGranted: false,
    });
    expect(stillPending.allowed).toBe(false);
  });

  it('20. feedback contains no patient data by default', () => {
    const built = service.buildFeedbackRecord({
      feedbackId: 'fb-1',
      doctorPrincipalId: 'doc-1',
      tenantId: 'tenant-a',
      requestId: 'req-1',
      draft: {
        category: FeedbackCategory.Suggestion,
        title: 'Add dark print mode',
        description: 'Print layout needs a quieter ink mode for clinics.',
        affectedFeatureOrPage: '/print/demo',
        problemOrSuggestion: 'suggestion',
        reproducibility: 'unknown',
      },
    });
    expect(built.feedback.patientContentPresent).toBe(false);
    expect(built.transmission).toBe('NOT_CONNECTED');
    expect(JSON.stringify(built.feedback)).not.toMatch(
      /\bMRN\b|otp|symptoms|prescription contents/i,
    );
  });
});

describe('Phase 2A-M contracts and workspace switch', () => {
  it('dashboard and revenue contracts stay not connected', () => {
    const dash = createNotConnectedManagementDashboard('2026-07-29T00:00:00.000Z');
    expect(dash.status).toBe('NOT_CONNECTED');
    expect(dash.metrics.grossMonthlyRevenue.value).toBeNull();
    expect(dash.metrics.netMonthlyRevenue.unavailableReason).toMatch(/not connected/i);
    expect(createNotConnectedRevenueSummary().grossMinor).toBeNull();
  });

  it('dual membership requires audited workspace switch', () => {
    const sink = {
      events: [] as { result: string }[],
      record(e: { result: string }) {
        this.events.push(e);
      },
    };
    const ctx = createTrustedAuthzContext({
      subjectId: 'dual-1',
      memberships: [PlatformRole.Doctor, PlatformRole.ManagementAdmin],
      activeRole: PlatformRole.Doctor,
      tenantId: 'tenant-a',
    });
    expect(managementNavigationVisible(ctx)).toBe(false);
    const switched = switchTrustedWorkspace(ctx, PlatformRole.ManagementAdmin, {
      requestId: 'req-ws-1',
      sink,
    });
    expect(switched.decision.allowed).toBe(true);
    expect(switched.context.activeWorkspace).toBe(WorkspaceKind.Management);
    expect(managementNavigationVisible(switched.context)).toBe(true);
    expect(sink.events[0]?.result).toBe('allowed');
  });
});
