import { PlatformRole, type PlatformRoleName } from './roles.js';

/**
 * Explicit permissions — deny by default; grant only via role maps.
 * Doctor never receives ops/super-admin permissions.
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
  OpsHealthRead: 'ops.health.read',
  OpsSecurityRead: 'ops.security.read',
  OpsAdminAct: 'ops.admin.act',
  SuperAdminControlPlane: 'ops.super_admin.control_plane',
  /** Explicit — Super Admin does NOT get this by default. */
  PatientPhiBreakGlass: 'patient.phi.break_glass',
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

/** Super Admin control-plane permissions — no default patient PHI. */
const SUPER_ADMIN_PERMISSIONS: readonly PermissionName[] = [
  Permission.OpsHealthRead,
  Permission.OpsSecurityRead,
  Permission.OpsAdminAct,
  Permission.SuperAdminControlPlane,
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
};

export function permissionsForRole(role: PlatformRoleName): readonly PermissionName[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: PlatformRoleName, permission: PermissionName): boolean {
  return permissionsForRole(role).includes(permission);
}
