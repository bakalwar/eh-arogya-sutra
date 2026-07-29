import { AUTHENTICATION_STATUS } from './identity.js';
import {
  PlatformRole,
  isManagementRole,
  isSuperAdminRole,
  type PlatformRoleName,
} from './roles.js';
import type { AuthzDecision } from './authorize.js';

/**
 * Explicit workspace kinds — dual membership must never silently mix nav/authz.
 */
export const WorkspaceKind = {
  Doctor: 'doctor',
  ClinicAdmin: 'clinic_admin',
  Management: 'management',
  SuperAdminOps: 'super_admin_ops',
} as const;

export type WorkspaceKindName = (typeof WorkspaceKind)[keyof typeof WorkspaceKind];

export type TrustedAuthzContext = {
  subjectId: string;
  memberships: readonly PlatformRoleName[];
  activeWorkspace: WorkspaceKindName;
  activeRole: PlatformRoleName;
  tenantId: string | null;
  authenticationStatus: typeof AUTHENTICATION_STATUS;
};

export type WorkspaceSwitchAuditEvent = {
  eventType: 'workspace_switch';
  actorId: string;
  fromWorkspace: WorkspaceKindName;
  toWorkspace: WorkspaceKindName;
  fromRole: PlatformRoleName;
  toRole: PlatformRoleName;
  timestamp: string;
  requestId: string;
  result: 'allowed' | 'denied';
  reason: string;
};

export type WorkspaceSwitchSink = {
  record(event: WorkspaceSwitchAuditEvent): void;
};

export function workspaceForRole(role: PlatformRoleName): WorkspaceKindName {
  if (isSuperAdminRole(role)) return WorkspaceKind.SuperAdminOps;
  if (isManagementRole(role)) return WorkspaceKind.Management;
  if (role === PlatformRole.ClinicAdmin) return WorkspaceKind.ClinicAdmin;
  return WorkspaceKind.Doctor;
}

export function createTrustedAuthzContext(input: {
  subjectId: string;
  memberships: readonly PlatformRoleName[];
  activeRole: PlatformRoleName;
  tenantId: string | null;
}): TrustedAuthzContext {
  if (!input.memberships.includes(input.activeRole)) {
    throw new Error('activeRole must be included in memberships');
  }
  return {
    subjectId: input.subjectId,
    memberships: input.memberships,
    activeWorkspace: workspaceForRole(input.activeRole),
    activeRole: input.activeRole,
    tenantId: input.tenantId,
    authenticationStatus: AUTHENTICATION_STATUS,
  };
}

/**
 * Explicit audited workspace switch — never silent mix of Doctor and Management nav.
 */
export function switchTrustedWorkspace(
  ctx: TrustedAuthzContext,
  nextRole: PlatformRoleName,
  options: { requestId: string; sink?: WorkspaceSwitchSink; timestamp?: string },
): { context: TrustedAuthzContext; decision: AuthzDecision } {
  const policy = 'workspace-switch-v1';
  if (!ctx.memberships.includes(nextRole)) {
    const decision: AuthzDecision = {
      allowed: false,
      reason: 'membership_missing_for_workspace',
      policy,
    };
    options.sink?.record({
      eventType: 'workspace_switch',
      actorId: ctx.subjectId,
      fromWorkspace: ctx.activeWorkspace,
      toWorkspace: workspaceForRole(nextRole),
      fromRole: ctx.activeRole,
      toRole: nextRole,
      timestamp: options.timestamp ?? new Date().toISOString(),
      requestId: options.requestId,
      result: 'denied',
      reason: decision.reason,
    });
    return { context: ctx, decision };
  }

  const next: TrustedAuthzContext = {
    ...ctx,
    activeRole: nextRole,
    activeWorkspace: workspaceForRole(nextRole),
  };
  const decision: AuthzDecision = {
    allowed: true,
    reason: 'workspace_switched',
    policy,
  };
  options.sink?.record({
    eventType: 'workspace_switch',
    actorId: ctx.subjectId,
    fromWorkspace: ctx.activeWorkspace,
    toWorkspace: next.activeWorkspace,
    fromRole: ctx.activeRole,
    toRole: nextRole,
    timestamp: options.timestamp ?? new Date().toISOString(),
    requestId: options.requestId,
    result: 'allowed',
    reason: decision.reason,
  });
  return { context: next, decision };
}

/** UX helper — Management nav only when trusted context is in Management workspace. */
export function managementNavigationVisible(ctx: TrustedAuthzContext | null | undefined): boolean {
  return !!ctx && ctx.activeWorkspace === WorkspaceKind.Management;
}

/** UX helper — Doctor Feedback entry is always doctor-facing; Management nav is not. */
export function doctorSeesFeedbackAndSupport(ctx: TrustedAuthzContext | null | undefined): boolean {
  if (!ctx) return true; // static doctor UI preview
  return (
    ctx.activeWorkspace === WorkspaceKind.Doctor ||
    ctx.activeWorkspace === WorkspaceKind.ClinicAdmin
  );
}
