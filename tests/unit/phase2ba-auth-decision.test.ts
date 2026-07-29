import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUTHENTICATION_STATUS,
  AUTH_PROVIDER_DECISION_ADR_STATUS,
  OTP_PROVIDER_STATUS,
  NotImplementedOtpProvider,
  NotImplementedSessionStore,
  PROVIDER_OUTAGE_NO_BYPASS,
  PlatformRole,
  UNIVERSAL_OTP_FORBIDDEN,
  authenticationRemainsNotImplemented,
  createPrincipalForPolicyEvaluation,
  evaluateAuthorization,
  evaluateManagementShellAccess,
  evaluateSuperAdminAccess,
  forbiddenClientTokenStorageLocations,
  managementCannotAccessSuperAdminByDefault,
  providerIdentityIsNotAuthorizationTruth,
  Permission,
} from '../../packages/security/src/index.ts';
import {
  doctorNavExcludesManagementAdmin,
  doctorNavExcludesSuperAdmin,
} from '../../apps/web/src/config/navigation.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 2B-A authentication decision audit', () => {
  it('keeps authentication NOT_IMPLEMENTED', () => {
    expect(AUTHENTICATION_STATUS).toBe('NOT_IMPLEMENTED');
    expect(authenticationRemainsNotImplemented()).toBe(true);
  });

  it('does not add provider SDKs to package manifests', () => {
    const manifests = [
      'package.json',
      'apps/web/package.json',
      'apps/api/package.json',
      'packages/security/package.json',
    ];
    const banned =
      /auth0|@clerk|firebase|amazon-cognito|aws-amplify|keycloak-js|next-auth|@supabase\/auth|passport|lucia|msg91|twilio|@simplewebauthn/i;
    for (const rel of manifests) {
      const text = fs.readFileSync(path.join(root, rel), 'utf8');
      expect(banned.test(text)).toBe(false);
    }
  });

  it('refuses production session issuance and OTP sending paths', () => {
    const sessions = new NotImplementedSessionStore();
    const otp = new NotImplementedOtpProvider();
    expect(() => sessions.createSession({})).toThrow(/NOT_IMPLEMENTED/);
    expect(() => otp.sendChallenge({})).toThrow(/NOT_IMPLEMENTED/);
  });

  it('forbids universal OTP and client token storage locations', () => {
    expect(UNIVERSAL_OTP_FORBIDDEN).toBe(true);
    expect(forbiddenClientTokenStorageLocations()).toEqual([
      'localStorage',
      'sessionStorage',
      'url_query_string',
    ]);
  });

  it('keeps Doctor away from Management and Super Admin by policy/nav', () => {
    expect(doctorNavExcludesManagementAdmin()).toBe(true);
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(evaluateManagementShellAccess(PlatformRole.Doctor).allowed).toBe(false);
    expect(evaluateSuperAdminAccess(PlatformRole.Doctor).allowed).toBe(false);
  });

  it('keeps Management Admin away from Super Admin by default', () => {
    expect(managementCannotAccessSuperAdminByDefault(PlatformRole.ManagementAdmin)).toBe(true);
    const ma = createPrincipalForPolicyEvaluation({
      subjectId: 'ma-1',
      role: PlatformRole.ManagementAdmin,
      tenantId: null,
      isTestPrincipal: true,
    });
    expect(
      evaluateAuthorization({
        principal: ma,
        permission: Permission.SuperAdminControlPlane,
      }).allowed,
    ).toBe(false);
  });

  it('treats provider identity as non-authorization truth and forbids outage bypass', () => {
    expect(providerIdentityIsNotAuthorizationTruth()).toBe(true);
    expect(PROVIDER_OUTAGE_NO_BYPASS.allowAuthBypass).toBe(false);
  });

  it('requires high assurance Super Admin by separate control-plane permission', () => {
    expect(evaluateSuperAdminAccess(PlatformRole.SuperAdmin).allowed).toBe(true);
    expect(evaluateSuperAdminAccess(PlatformRole.Doctor).allowed).toBe(false);
    expect(evaluateSuperAdminAccess(PlatformRole.ManagementAdmin).allowed).toBe(false);
  });

  it('accepts authentication architecture only with OTP provider pending', () => {
    expect(AUTH_PROVIDER_DECISION_ADR_STATUS).toBe('ACCEPTED_ARCHITECTURE_ONLY');
    expect(OTP_PROVIDER_STATUS).toBe('PENDING');
    const adr = fs.readFileSync(
      path.join(root, 'docs/adr/013-authentication-provider-decision.md'),
      'utf8',
    );
    expect(adr).toMatch(/ACCEPTED — ARCHITECTURE ONLY; OTP PROVIDER PENDING/);
  });
});
