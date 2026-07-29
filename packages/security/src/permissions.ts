import {
  isClinicScopedRole,
  isManagementRole,
  PlatformRole,
  type PlatformRoleName,
} from './roles.js';

/**
 * Explicit permissions — deny by default; grant only via role maps.
 * Doctor never receives management/ops/super-admin permissions.
 * Management never receives Super Admin control-plane or default patient PHI.
 */
export const Permission = {
  PatientRead: 'patient.read',
  PatientWrite: 'patient.write',
  ClinicalCaseRead: 'clinical.case.read',
  ClinicalCaseWrite: 'clinical.case.write',
  PrescriptionRead: 'prescription.read',
  PrescriptionReview: 'prescription.review',
  ReportMetadataRead: 'report.metadata.read',
  ClinicConfigWrite: 'clinic.config.write',
  SupportTicketWrite: 'support.ticket.write',
  FeedbackSubmit: 'feedback.submit',
  OpsHealthRead: 'ops.health.read',
  OpsSecurityRead: 'ops.security.read',
  OpsAdminAct: 'ops.admin.act',
  SuperAdminControlPlane: 'ops.super_admin.control_plane',
  PatientPhiBreakGlass: 'patient.phi.break_glass',

  /** Management shell entry */
  ManagementShellAccess: 'management.shell.access',

  DoctorList: 'doctor:list',
  DoctorViewSafeProfile: 'doctor:view_safe_profile',
  DoctorVerificationReview: 'doctor:verification_review',
  DoctorStatusManage: 'doctor:status_manage',
  DoctorSubscriptionView: 'doctor:subscription_view',
  DoctorSupportView: 'doctor:support_view',
  DoctorActivitySummaryView: 'doctor:activity_summary_view',

  SubscriptionList: 'subscription:list',
  SubscriptionView: 'subscription:view',
  SubscriptionManage: 'subscription:manage',
  PaymentList: 'payment:list',
  PaymentView: 'payment:view',
  PaymentFailureReview: 'payment:failure_review',
  RefundRequest: 'refund:request',
  RefundApprove: 'refund:approve',
  InvoiceView: 'invoice:view',
  EarningsView: 'earnings:view',
  FinanceExport: 'finance:export',

  SupportTicketList: 'support_ticket:list',
  SupportTicketView: 'support_ticket:view',
  SupportTicketAssign: 'support_ticket:assign',
  SupportTicketRespond: 'support_ticket:respond',
  SupportTicketStatusUpdate: 'support_ticket:status_update',
  FeedbackList: 'feedback:list',
  FeedbackView: 'feedback:view',
  FeedbackModerate: 'feedback:moderate',
  FeedbackEscalate: 'feedback:escalate',

  ReferralView: 'referral:view',
  ReferralManage: 'referral:manage',
  PlanView: 'plan:view',
  PlanDraftChange: 'plan:draft_change',
  CouponView: 'coupon:view',
  CouponManage: 'coupon:manage',
  ManagementReportView: 'management_report:view',
  ManagementReportExport: 'management_report:export',
  UsageAnalyticsViewSafe: 'usage_analytics:view_safe',
  ManagementAuditView: 'management.audit.view',
} as const;

export type PermissionName = (typeof Permission)[keyof typeof Permission];

const DOCTOR_PERMISSIONS: readonly PermissionName[] = [
  Permission.PatientRead,
  Permission.PatientWrite,
  Permission.ClinicalCaseRead,
  Permission.ClinicalCaseWrite,
  Permission.PrescriptionRead,
  Permission.PrescriptionReview,
  Permission.ReportMetadataRead,
  Permission.SupportTicketWrite,
  Permission.FeedbackSubmit,
];

const CLINIC_ADMIN_PERMISSIONS: readonly PermissionName[] = [
  ...DOCTOR_PERMISSIONS,
  Permission.ClinicConfigWrite,
];

const SUPPORT_PERMISSIONS: readonly PermissionName[] = [Permission.SupportTicketWrite];

const SECURITY_ANALYST_PERMISSIONS: readonly PermissionName[] = [
  Permission.OpsSecurityRead,
  Permission.OpsHealthRead,
];

const OPERATIONS_ADMIN_PERMISSIONS: readonly PermissionName[] = [
  Permission.OpsHealthRead,
  Permission.OpsAdminAct,
];

const SUPER_ADMIN_PERMISSIONS: readonly PermissionName[] = [
  Permission.OpsHealthRead,
  Permission.OpsSecurityRead,
  Permission.OpsAdminAct,
  Permission.SuperAdminControlPlane,
];

const DOCTOR_MGMT_READ: readonly PermissionName[] = [
  Permission.ManagementShellAccess,
  Permission.DoctorList,
  Permission.DoctorViewSafeProfile,
  Permission.DoctorSubscriptionView,
  Permission.DoctorSupportView,
  Permission.DoctorActivitySummaryView,
];

const BILLING_PERMS: readonly PermissionName[] = [
  Permission.ManagementShellAccess,
  Permission.SubscriptionList,
  Permission.SubscriptionView,
  Permission.SubscriptionManage,
  Permission.PaymentList,
  Permission.PaymentView,
  Permission.PaymentFailureReview,
  Permission.RefundRequest,
  Permission.InvoiceView,
  Permission.EarningsView,
  Permission.FinanceExport,
  Permission.DoctorSubscriptionView,
];

const SUPPORT_ADMIN_PERMS: readonly PermissionName[] = [
  Permission.ManagementShellAccess,
  Permission.SupportTicketList,
  Permission.SupportTicketView,
  Permission.SupportTicketAssign,
  Permission.SupportTicketRespond,
  Permission.SupportTicketStatusUpdate,
  Permission.FeedbackList,
  Permission.FeedbackView,
  Permission.FeedbackModerate,
  Permission.FeedbackEscalate,
  Permission.DoctorSupportView,
];

const VERIFICATION_PERMS: readonly PermissionName[] = [
  Permission.ManagementShellAccess,
  Permission.DoctorList,
  Permission.DoctorViewSafeProfile,
  Permission.DoctorVerificationReview,
  Permission.DoctorStatusManage,
];

const FINANCE_VIEWER_PERMS: readonly PermissionName[] = [
  Permission.ManagementShellAccess,
  Permission.SubscriptionList,
  Permission.SubscriptionView,
  Permission.PaymentList,
  Permission.PaymentView,
  Permission.InvoiceView,
  Permission.EarningsView,
  Permission.FinanceExport,
  Permission.ManagementReportView,
];

const PLATFORM_OPS_MANAGER_PERMS: readonly PermissionName[] = [
  Permission.ManagementShellAccess,
  ...DOCTOR_MGMT_READ,
  Permission.ReferralView,
  Permission.ReferralManage,
  Permission.PlanView,
  Permission.PlanDraftChange,
  Permission.CouponView,
  Permission.CouponManage,
  Permission.ManagementReportView,
  Permission.ManagementReportExport,
  Permission.UsageAnalyticsViewSafe,
  Permission.ManagementAuditView,
];

const MANAGEMENT_ADMIN_PERMS: readonly PermissionName[] = [
  ...new Set([
    ...DOCTOR_MGMT_READ,
    ...BILLING_PERMS,
    ...SUPPORT_ADMIN_PERMS,
    ...VERIFICATION_PERMS,
    ...PLATFORM_OPS_MANAGER_PERMS,
    Permission.RefundApprove,
    Permission.DoctorStatusManage,
  ]),
];

const MANAGEMENT_AUDITOR_PERMS: readonly PermissionName[] = [
  Permission.ManagementShellAccess,
  Permission.DoctorList,
  Permission.DoctorViewSafeProfile,
  Permission.DoctorSubscriptionView,
  Permission.DoctorActivitySummaryView,
  Permission.SubscriptionList,
  Permission.SubscriptionView,
  Permission.PaymentList,
  Permission.PaymentView,
  Permission.InvoiceView,
  Permission.EarningsView,
  Permission.SupportTicketList,
  Permission.SupportTicketView,
  Permission.FeedbackList,
  Permission.FeedbackView,
  Permission.ReferralView,
  Permission.PlanView,
  Permission.CouponView,
  Permission.ManagementReportView,
  Permission.UsageAnalyticsViewSafe,
  Permission.ManagementAuditView,
];

export const ROLE_PERMISSIONS: Readonly<Record<PlatformRoleName, readonly PermissionName[]>> = {
  [PlatformRole.Doctor]: DOCTOR_PERMISSIONS,
  [PlatformRole.ClinicAdmin]: CLINIC_ADMIN_PERMISSIONS,
  [PlatformRole.SupportOperator]: SUPPORT_PERMISSIONS,
  [PlatformRole.SecurityAnalyst]: SECURITY_ANALYST_PERMISSIONS,
  [PlatformRole.OperationsAdmin]: OPERATIONS_ADMIN_PERMISSIONS,
  [PlatformRole.SuperAdmin]: SUPER_ADMIN_PERMISSIONS,
  [PlatformRole.BreakGlassSuperAdmin]: [
    ...SUPER_ADMIN_PERMISSIONS,
    Permission.PatientPhiBreakGlass,
  ],
  [PlatformRole.ManagementAdmin]: MANAGEMENT_ADMIN_PERMS,
  [PlatformRole.DoctorVerificationAdmin]: VERIFICATION_PERMS,
  [PlatformRole.BillingAdmin]: BILLING_PERMS,
  [PlatformRole.SupportAdmin]: SUPPORT_ADMIN_PERMS,
  [PlatformRole.FinanceViewer]: FINANCE_VIEWER_PERMS,
  [PlatformRole.PlatformOperationsManager]: PLATFORM_OPS_MANAGER_PERMS,
  [PlatformRole.ManagementReadOnlyAuditor]: MANAGEMENT_AUDITOR_PERMS,
};

export function permissionsForRole(role: PlatformRoleName): readonly PermissionName[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: PlatformRoleName, permission: PermissionName): boolean {
  return permissionsForRole(role).includes(permission);
}

export function roleMayAccessManagementShell(role: PlatformRoleName): boolean {
  return roleHasPermission(role, Permission.ManagementShellAccess);
}

export function assertNoManagementPhiByDefault(role: PlatformRoleName): boolean {
  if (!isManagementRole(role)) return true;
  const perms = permissionsForRole(role);
  return (
    !perms.includes(Permission.PatientRead) &&
    !perms.includes(Permission.PatientWrite) &&
    !perms.includes(Permission.ClinicalCaseRead) &&
    !perms.includes(Permission.PrescriptionRead) &&
    !perms.includes(Permission.PatientPhiBreakGlass) &&
    !perms.includes(Permission.SuperAdminControlPlane) &&
    !perms.includes(Permission.OpsSecurityRead)
  );
}

export function assertClinicAdminNotPlatformManagement(role: PlatformRoleName): boolean {
  return isClinicScopedRole(role) ? !roleMayAccessManagementShell(role) : true;
}
