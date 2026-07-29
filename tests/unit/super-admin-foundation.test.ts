import { describe, expect, it } from 'vitest';
import {
  assertHighRiskActionMetadata,
  assertSecurityEventIdentifiers,
  evaluateSuperAdminAccess,
  PlatformRole,
  redactSensitiveFields,
  SuperAdminAuthService,
  SuperAdminMonitoringService,
  toDoctorSafeError,
} from '../../packages/security/src/index.ts';
import {
  notImplementedService,
  OPS_CONTRACTS_STATUS,
  type DoctorProblemReport,
  type HealthStatus,
  type ReadinessStatus,
} from '../../packages/ops-contracts/src/index.ts';
import { SecurityEventSink } from '../../packages/observability/src/index.ts';
import { FoundationStatus } from '../../packages/shared/src/index.ts';

describe('Super Admin authorization foundation', () => {
  it('denies Doctor Super Admin access by default', () => {
    const decision = evaluateSuperAdminAccess(PlatformRole.Doctor);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('deny_by_default');
  });

  it('denies undefined / unknown roles', () => {
    expect(evaluateSuperAdminAccess(undefined).allowed).toBe(false);
    expect(evaluateSuperAdminAccess('TotallyFakeRole').allowed).toBe(false);
  });

  it('allows only Super Admin control-plane roles', () => {
    expect(evaluateSuperAdminAccess(PlatformRole.SuperAdmin).allowed).toBe(true);
    expect(evaluateSuperAdminAccess(PlatformRole.BreakGlassSuperAdmin).allowed).toBe(true);
    expect(evaluateSuperAdminAccess(PlatformRole.SecurityAnalyst).allowed).toBe(false);
  });
});

describe('Doctor-safe errors and redaction', () => {
  it('excludes stack traces from doctor-safe errors', () => {
    const safe = toDoctorSafeError({
      errorCode: 'EHAS2_TMP',
      supportId: 'SUP-1',
      stack: 'Error: boom\n    at secret.ts:1',
      internalDetail: 'SELECT * FROM patients',
    });
    expect(safe).not.toHaveProperty('stack');
    expect(JSON.stringify(safe)).not.toMatch(/secret\.ts|SELECT \*/);
    expect(safe.errorCode).toBe('EHAS2_TMP');
    expect(safe.supportId).toBe('SUP-1');
  });

  it('redacts defined sensitive fields including patient and secrets', () => {
    const { data, removedKeys } = redactSensitiveFields({
      requestId: 'r1',
      patientName: 'ShouldNotAppear',
      phoneNumber: '9999999999',
      password: 'x',
      token: 'y',
      errorCode: 'E1',
    });
    expect(data.requestId).toBe('r1');
    expect(data.errorCode).toBe('E1');
    expect(data).not.toHaveProperty('patientName');
    expect(data).not.toHaveProperty('password');
    expect(removedKeys).toEqual(
      expect.arrayContaining(['patientName', 'phoneNumber', 'password', 'token']),
    );
  });

  it('DoctorProblemReport type shape excludes secret-like required fields', () => {
    const report: DoctorProblemReport = {
      supportId: 'SUP-2',
      category: 'ui',
      shortDescription: 'blank screen',
      screenshotConsent: false,
      timestamp: new Date().toISOString(),
      requestId: 'req-1',
      recentErrorCode: 'EHAS2_TMP',
    };
    expect(report).not.toHaveProperty('password');
    expect(report).not.toHaveProperty('token');
    expect(report).not.toHaveProperty('patientName');
  });
});

describe('Ops contracts honesty', () => {
  it('marks ops contracts NOT_IMPLEMENTED', () => {
    expect(OPS_CONTRACTS_STATUS).toBe('NOT_IMPLEMENTED');
    const svc = notImplementedService('super-admin-dashboard');
    expect(svc.statusCode).toBe(FoundationStatus.NOT_IMPLEMENTED);
    expect(svc.state).toBe('not_ready');
  });

  it('distinguishes health from readiness shapes', () => {
    const health: HealthStatus = {
      ok: true,
      service: 'api',
      phase: '1a',
      checkedAt: new Date().toISOString(),
    };
    const ready: ReadinessStatus = {
      ready: false,
      clinicalEngine: false,
      dataPackages: false,
      authentication: false,
      patientDatabase: false,
      payment: false,
      monitoring: false,
      superAdminControlPlane: false,
      checkedAt: new Date().toISOString(),
    };
    expect(health.ok).toBe(true);
    expect(ready.ready).toBe(false);
    expect(ready.monitoring).toBe(false);
  });

  it('requires security event identifiers', () => {
    expect(() =>
      assertSecurityEventIdentifiers({ eventId: '', requestId: 'r', traceId: 't' }),
    ).toThrow(/eventId/);
    expect(() =>
      assertSecurityEventIdentifiers({ eventId: 'e', requestId: 'r', traceId: 't' }),
    ).not.toThrow();
  });

  it('requires high-risk action reason and audit metadata', () => {
    expect(() =>
      assertHighRiskActionMetadata({
        action: 'maintenance_mode',
        actorId: 'sa-1',
        reason: '',
        requestId: 'r1',
        requiresReauth: true,
        requiresAudit: true,
      }),
    ).toThrow(/reason/);
    expect(() =>
      assertHighRiskActionMetadata({
        action: 'maintenance_mode',
        actorId: 'sa-1',
        reason: 'emergency patch window',
        requestId: 'r1',
        requiresReauth: true,
        requiresAudit: true,
      }),
    ).not.toThrow();
  });

  it('auth and monitoring shells throw NOT_IMPLEMENTED', () => {
    expect(SuperAdminAuthService.status).toBe('NOT_IMPLEMENTED');
    expect(() => SuperAdminAuthService.authenticate({})).toThrow(/NOT_IMPLEMENTED/);
    expect(() => SuperAdminMonitoringService.getDashboard()).toThrow(/NOT_IMPLEMENTED/);
    expect(() => new SecurityEventSink().emitSecurityEvent({} as never)).toThrow(/NOT_IMPLEMENTED/);
  });
});
