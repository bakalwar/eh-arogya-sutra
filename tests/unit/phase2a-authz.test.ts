import { describe, expect, it } from 'vitest';
import {
  AUTHENTICATION_STATUS,
  AUTHORIZATION_POLICY_STATUS,
  Permission,
  PlatformRole,
  createPrincipalForPolicyEvaluation,
  createTenantContext,
  doctorCannotElevateViaPayload,
  evaluateAuthorization,
  evaluateResourceOwnership,
  evaluateSuperAdminAccess,
  permissionsForRole,
  roleHasPermission,
  SuperAdminAuthService,
} from '../../packages/security/src/index.ts';
import {
  doctorNavExcludesSuperAdmin,
  DOCTOR_NAV_ITEMS,
} from '../../apps/web/src/config/navigation.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 2A identity and permissions', () => {
  it('keeps authentication NOT_IMPLEMENTED while authz policies are active', () => {
    expect(AUTHENTICATION_STATUS).toBe('NOT_IMPLEMENTED');
    expect(AUTHORIZATION_POLICY_STATUS).toBe('PHASE_2A_ACTIVE');
  });

  it('does not grant Doctor ops or Super Admin permissions', () => {
    expect(roleHasPermission(PlatformRole.Doctor, Permission.SuperAdminControlPlane)).toBe(false);
    expect(roleHasPermission(PlatformRole.Doctor, Permission.OpsSecurityRead)).toBe(false);
    expect(roleHasPermission(PlatformRole.Doctor, Permission.PatientRead)).toBe(true);
    expect(permissionsForRole(PlatformRole.SuperAdmin)).not.toContain(Permission.PatientRead);
    expect(permissionsForRole(PlatformRole.SuperAdmin)).not.toContain(
      Permission.PatientPhiBreakGlass,
    );
  });

  it('requires tenantId for doctor-facing principals', () => {
    expect(() =>
      createPrincipalForPolicyEvaluation({
        subjectId: 'doc-1',
        role: PlatformRole.Doctor,
        tenantId: null,
      }),
    ).toThrow(/tenantId/);
  });
});

describe('Phase 2A authorization decisions (deterministic)', () => {
  const doctor = createPrincipalForPolicyEvaluation({
    subjectId: 'doc-1',
    role: PlatformRole.Doctor,
    tenantId: 'tenant-a',
  });
  const otherDoctor = createPrincipalForPolicyEvaluation({
    subjectId: 'doc-2',
    role: PlatformRole.Doctor,
    tenantId: 'tenant-a',
  });
  const clinicAdmin = createPrincipalForPolicyEvaluation({
    subjectId: 'admin-1',
    role: PlatformRole.ClinicAdmin,
    tenantId: 'tenant-a',
  });
  const superAdmin = createPrincipalForPolicyEvaluation({
    subjectId: 'sa-1',
    role: PlatformRole.SuperAdmin,
    tenantId: null,
  });

  it('denies null principal (auth not connected)', () => {
    const decision = evaluateAuthorization({
      principal: null,
      permission: Permission.PatientRead,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('authentication_not_connected');
  });

  it('allows doctor patient read in-tenant and denies cross-tenant', () => {
    expect(
      evaluateAuthorization({
        principal: doctor,
        permission: Permission.PatientRead,
        resource: {
          resourceKind: 'patient',
          resourceTenantId: 'tenant-a',
          ownerDoctorId: 'doc-1',
        },
      }).allowed,
    ).toBe(true);

    expect(
      evaluateAuthorization({
        principal: doctor,
        permission: Permission.PatientRead,
        resource: {
          resourceKind: 'patient',
          resourceTenantId: 'tenant-b',
          ownerDoctorId: 'doc-1',
        },
      }).reason,
    ).toBe('tenant_mismatch');
  });

  it('enforces doctor resource ownership inside tenant', () => {
    expect(
      evaluateResourceOwnership(doctor, {
        resourceKind: 'case',
        resourceTenantId: 'tenant-a',
        ownerDoctorId: 'doc-2',
      }).allowed,
    ).toBe(false);
    expect(
      evaluateResourceOwnership(clinicAdmin, {
        resourceKind: 'case',
        resourceTenantId: 'tenant-a',
        ownerDoctorId: 'doc-2',
      }).allowed,
    ).toBe(true);
    expect(
      evaluateResourceOwnership(otherDoctor, {
        resourceKind: 'case',
        resourceTenantId: 'tenant-a',
        ownerDoctorId: 'doc-2',
      }).allowed,
    ).toBe(true);
  });

  it('denies Super Admin default patient resource access and doctor Super Admin elevation', () => {
    expect(evaluateSuperAdminAccess(PlatformRole.Doctor).allowed).toBe(false);
    expect(
      evaluateAuthorization({
        principal: doctor,
        permission: Permission.SuperAdminControlPlane,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateResourceOwnership(superAdmin, {
        resourceKind: 'patient',
        resourceTenantId: 'tenant-a',
        ownerDoctorId: 'doc-1',
      }).reason,
    ).toBe('super_admin_no_default_patient_resource_access');
    expect(doctorCannotElevateViaPayload(PlatformRole.Doctor, 'SuperAdmin')).toBe(false);
    expect(doctorCannotElevateViaPayload(PlatformRole.Doctor, 'Doctor')).toBe(true);
  });

  it('does not implement live Super Admin authentication', () => {
    expect(() => SuperAdminAuthService.authenticate({ user: 'x' })).toThrow(/NOT_IMPLEMENTED/);
  });
});

describe('Phase 2A tenant helpers and doctor UI boundary', () => {
  it('creates tenant context and keeps Super Admin out of doctor nav', () => {
    expect(createTenantContext('tenant-a').tenantId).toBe('tenant-a');
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => /super.?admin/i.test(i.label))).toBe(false);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href.includes('/ops'))).toBe(false);
  });

  it('api middleware and server wire authz without OTP/provider secrets', () => {
    const server = fs.readFileSync(path.join(root, 'apps/api/src/server.ts'), 'utf8');
    const createApp = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    const mw = fs.readFileSync(path.join(root, 'apps/api/src/middleware/authorization.ts'), 'utf8');
    expect(server).toMatch(/createApp\(\)/);
    expect(server).toMatch(/principal always null|Phase 4 authentication/i);
    expect(createApp).toMatch(/requirePermission\(Permission\.PatientRead\)/);
    expect(createApp).toMatch(/requirePermission\(Permission\.SuperAdminControlPlane\)/);
    expect(createApp).toMatch(/AUTHENTICATION_STATUS/);
    expect(createApp).not.toMatch(/UNIVERSAL_OTP|speakeasy|twilio|hardcoded.*password/i);
    expect(server).not.toMatch(/x-user-id|x-tenant-id|query\.tenant/i);
    expect(createApp).not.toMatch(/x-user-id|x-tenant-id|query\.tenant/i);
    expect(mw).toMatch(/AUTH_NOT_CONNECTED/);
    expect(mw).toMatch(/evaluateAuthorization/);
  });
});
