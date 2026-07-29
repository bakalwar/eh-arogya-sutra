/** Platform roles — least privilege. Super Admin is a separate control-plane identity. */
export const PlatformRole = {
  Doctor: 'Doctor',
  ClinicAdmin: 'ClinicAdmin',
  SupportOperator: 'SupportOperator',
  SecurityAnalyst: 'SecurityAnalyst',
  OperationsAdmin: 'OperationsAdmin',
  SuperAdmin: 'SuperAdmin',
  BreakGlassSuperAdmin: 'BreakGlassSuperAdmin',
} as const;

export type PlatformRoleName = (typeof PlatformRole)[keyof typeof PlatformRole];

export const SUPER_ADMIN_ROLES: ReadonlySet<PlatformRoleName> = new Set([
  PlatformRole.SuperAdmin,
  PlatformRole.BreakGlassSuperAdmin,
]);

export function isSuperAdminRole(role: PlatformRoleName | string | undefined): boolean {
  return !!role && SUPER_ADMIN_ROLES.has(role as PlatformRoleName);
}

export function isDoctorFacingRole(role: PlatformRoleName): boolean {
  return role === PlatformRole.Doctor || role === PlatformRole.ClinicAdmin;
}
