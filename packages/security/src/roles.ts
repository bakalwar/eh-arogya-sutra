/** Platform roles — least privilege. Super Admin is a separate control-plane identity. */
export const PlatformRole = {
  Doctor: 'Doctor',
  ClinicAdmin: 'ClinicAdmin',
  SupportOperator: 'SupportOperator',
  SecurityAnalyst: 'SecurityAnalyst',
  OperationsAdmin: 'OperationsAdmin',
  SuperAdmin: 'SuperAdmin',
  BreakGlassSuperAdmin: 'BreakGlassSuperAdmin',
  /** Platform management plane (not Super Admin ops). */
  ManagementAdmin: 'ManagementAdmin',
  DoctorVerificationAdmin: 'DoctorVerificationAdmin',
  BillingAdmin: 'BillingAdmin',
  SupportAdmin: 'SupportAdmin',
  FinanceViewer: 'FinanceViewer',
  PlatformOperationsManager: 'PlatformOperationsManager',
  ManagementReadOnlyAuditor: 'ManagementReadOnlyAuditor',
} as const;

export type PlatformRoleName = (typeof PlatformRole)[keyof typeof PlatformRole];

export const SUPER_ADMIN_ROLES: ReadonlySet<PlatformRoleName> = new Set([
  PlatformRole.SuperAdmin,
  PlatformRole.BreakGlassSuperAdmin,
]);

export const MANAGEMENT_ROLES: ReadonlySet<PlatformRoleName> = new Set([
  PlatformRole.ManagementAdmin,
  PlatformRole.DoctorVerificationAdmin,
  PlatformRole.BillingAdmin,
  PlatformRole.SupportAdmin,
  PlatformRole.FinanceViewer,
  PlatformRole.PlatformOperationsManager,
  PlatformRole.ManagementReadOnlyAuditor,
]);

export function isSuperAdminRole(role: PlatformRoleName | string | undefined): boolean {
  return !!role && SUPER_ADMIN_ROLES.has(role as PlatformRoleName);
}

export function isManagementRole(role: PlatformRoleName | string | undefined): boolean {
  return !!role && MANAGEMENT_ROLES.has(role as PlatformRoleName);
}

export function isDoctorFacingRole(role: PlatformRoleName): boolean {
  return role === PlatformRole.Doctor || role === PlatformRole.ClinicAdmin;
}

export function isClinicScopedRole(role: PlatformRoleName): boolean {
  return isDoctorFacingRole(role) || role === PlatformRole.SupportOperator;
}
