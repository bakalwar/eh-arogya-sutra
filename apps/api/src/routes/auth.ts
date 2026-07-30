import type { Express, Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  SESSION_COOKIE_NAME,
  clearCookie,
  csrfCookieAttrs,
  hashToken,
  originAllowed,
  parseCookies,
  requireAuthPepper,
  serializeCookie,
  sessionCookieAttrs,
  SESSION_ABSOLUTE_TIMEOUT_MS,
} from '@ehas2/security';
import { AuthService, authService as defaultAuthService } from '@ehas2/database';
import type { AuthedRequest } from '../middleware/authorization.js';
import { sendError, sendSuccess } from '../http/errors.js';

export type AuthRouteDeps = {
  auth?: AuthService;
  allowedOrigins?: string[];
};

function isProd(env = process.env): boolean {
  return (env.EHAS2_NODE_ENV ?? env.NODE_ENV) === 'production';
}

function clientIp(req: AuthedRequest): string | null {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0]!.trim();
  return req.socket.remoteAddress ?? null;
}

function setAuthCookies(
  res: Response,
  sessionToken: string,
  csrfToken: string,
  env = process.env,
): void {
  const maxAge = Math.floor(SESSION_ABSOLUTE_TIMEOUT_MS / 1000);
  const prod = isProd(env);
  res.append(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, sessionToken, sessionCookieAttrs(prod, maxAge)),
  );
  res.append(
    'Set-Cookie',
    serializeCookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieAttrs(prod, maxAge)),
  );
}

function clearAuthCookies(res: Response, env = process.env): void {
  const prod = isProd(env);
  const base = { httpOnly: true, secure: prod, sameSite: 'Lax' as const, path: '/' };
  res.append('Set-Cookie', clearCookie(SESSION_COOKIE_NAME, base));
  res.append('Set-Cookie', clearCookie(CSRF_COOKIE_NAME, { ...base, httpOnly: false }));
}

function mapAuthCodeToHttp(code: string): {
  status: number;
  apiCode: Parameters<typeof sendError>[2];
} {
  switch (code) {
    case 'OTP_PROVIDER_NOT_CONFIGURED':
      return { status: 503, apiCode: 'NOT_READY' };
    case 'OTP_RATE_LIMITED':
      return { status: 429, apiCode: 'RATE_LIMITED' };
    case 'OTP_PROVIDER_UNAVAILABLE':
    case 'OTP_DELIVERY_FAILED':
      return { status: 503, apiCode: 'NOT_READY' };
    case 'OTP_CHALLENGE_EXPIRED':
    case 'OTP_ALREADY_USED':
    case 'OTP_ATTEMPTS_EXCEEDED':
    case 'OTP_INVALID':
    case 'GENERIC_AUTH_FAILURE':
    case 'ACCOUNT_LOCKED':
    case 'USER_DISABLED':
      return { status: 401, apiCode: 'AUTH_NOT_CONNECTED' };
    case 'SMS_ONLY_SUPER_ADMIN_DENIED':
    case 'ACCESS_DENIED':
    case 'CSRF_INVALID':
    case 'ORIGIN_INVALID':
      return { status: 403, apiCode: 'FORBIDDEN' };
    case 'PASSKEY_NOT_CONNECTED':
      return { status: 501, apiCode: 'NOT_IMPLEMENTED' };
    case 'SESSION_MISSING':
    case 'SESSION_REVOKED':
    case 'SESSION_EXPIRED':
      return { status: 401, apiCode: 'AUTH_NOT_CONNECTED' };
    default:
      return { status: 400, apiCode: 'VALIDATION_ERROR' };
  }
}

/**
 * Phase 4A authentication routes. No header/query identity bypass.
 * Default OTP provider is NOT_CONFIGURED — never fakes delivery success.
 */
export function registerAuthRoutes(app: Express, deps: AuthRouteDeps = {}): void {
  const auth = deps.auth ?? defaultAuthService;
  const ns = `${EHAS2_API_NAMESPACE}/auth`;
  const allowedOrigins = deps.allowedOrigins ?? [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
  ];

  app.post(`${ns}/otp/request`, async (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const phone = String((req.body as { phone?: string })?.phone ?? '');
    const result = await auth.requestOtp(phone, {
      ip: clientIp(req),
      userAgent: req.header('user-agent'),
    });
    if (result.code === 'OTP_PROVIDER_NOT_CONFIGURED') {
      // Truthful stop — challenge may exist for audit/throttle, but no OTP was delivered.
      res.status(503).json({
        success: false,
        code: 'OTP_PROVIDER_NOT_CONFIGURED',
        message: 'OTP delivery provider is not configured.',
        data: {
          challengeId: result.challengeId ?? null,
          resendAvailableAt: result.resendAvailableAt ?? null,
          expiresAt: result.expiresAt ?? null,
          realOtpSent: false,
        },
        requestId: req.requestId,
      });
      return;
    }
    if (result.code !== 'OTP_DELIVERY_ACCEPTED' && result.code !== 'OTP_CHALLENGE_CREATED') {
      const mapped = mapAuthCodeToHttp(result.code);
      sendError(res, mapped.status, mapped.apiCode, result.code, req.requestId ?? 'unknown');
      return;
    }
    sendSuccess(
      res,
      {
        challengeId: result.challengeId,
        resendAvailableAt: result.resendAvailableAt,
        expiresAt: result.expiresAt,
        realOtpSent: true,
      },
      req.requestId ?? 'unknown',
    );
  });

  app.post(`${ns}/otp/verify`, async (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = req.body as { phone?: string; challengeId?: string; otp?: string };
    const result = await auth.verifyOtp(
      String(body.phone ?? ''),
      String(body.challengeId ?? ''),
      String(body.otp ?? ''),
      { ip: clientIp(req), userAgent: req.header('user-agent') },
    );
    if (!result.sessionToken || !result.csrfToken) {
      const mapped = mapAuthCodeToHttp(result.code);
      // Enumeration-safe message for invalid OTP paths
      sendError(
        res,
        mapped.status,
        mapped.apiCode,
        result.code === 'GENERIC_AUTH_FAILURE'
          ? 'Unable to complete authentication request.'
          : result.code,
        req.requestId ?? 'unknown',
      );
      return;
    }
    setAuthCookies(res, result.sessionToken, result.csrfToken);
    sendSuccess(
      res,
      {
        code: result.code,
        memberships: result.memberships ?? [],
        principal: result.principal
          ? {
              subjectId: result.principal.subjectId,
              role: result.principal.role,
              tenantId: result.principal.tenantId,
              sessionId: result.principal.sessionId,
            }
          : null,
      },
      req.requestId ?? 'unknown',
    );
  });

  app.get(`${ns}/session`, async (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const cookies = parseCookies(req.header('cookie') ?? undefined);
    const resolved = await auth.resolveSession(cookies[SESSION_COOKIE_NAME]);
    if (
      (resolved.code !== 'SESSION_OK' && resolved.code !== 'MEMBERSHIP_REQUIRED') ||
      !resolved.principal ||
      !resolved.session
    ) {
      sendError(res, 401, 'AUTH_NOT_CONNECTED', 'No active session.', req.requestId ?? 'unknown');
      return;
    }
    sendSuccess(
      res,
      {
        authenticated: true,
        membershipRequired: resolved.code === 'MEMBERSHIP_REQUIRED',
        principal: {
          subjectId: resolved.principal.subjectId,
          role: resolved.principal.role,
          tenantId: resolved.principal.tenantId,
          sessionId: resolved.principal.sessionId,
        },
        workspace: resolved.session.workspace,
        membershipId: resolved.session.membershipId,
        idleExpiresAt: resolved.session.idleExpiresAt,
        absoluteExpiresAt: resolved.session.absoluteExpiresAt,
      },
      req.requestId ?? 'unknown',
    );
  });

  app.get(`${ns}/security-status`, (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    sendSuccess(
      res,
      {
        otpProvider: 'NOT_CONFIGURED',
        realOtpSent: false,
        passkeys: 'PASSKEY_NOT_CONNECTED',
        sessionCore: 'PHASE_4A_SESSION_CORE',
        breakGlass: false,
      },
      req.requestId ?? 'unknown',
    );
  });

  app.post(`${ns}/logout`, async (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const cookies = parseCookies(req.header('cookie') ?? undefined);
    await auth.logout(cookies[SESSION_COOKIE_NAME] ?? '');
    clearAuthCookies(res);
    sendSuccess(res, { loggedOut: true }, req.requestId ?? 'unknown');
  });

  app.post(`${ns}/logout-all`, async (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const cookies = parseCookies(req.header('cookie') ?? undefined);
    const sid = cookies[SESSION_COOKIE_NAME];
    if (!sid) {
      sendError(res, 401, 'AUTH_NOT_CONNECTED', 'No active session.', req.requestId ?? 'unknown');
      return;
    }
    const resolved = await auth.resolveSession(sid);
    if (!resolved.session) {
      clearAuthCookies(res);
      sendError(res, 401, 'AUTH_NOT_CONNECTED', 'No active session.', req.requestId ?? 'unknown');
      return;
    }
    const origin = req.header('origin') ?? undefined;
    const host = req.header('host') ?? undefined;
    if (!originAllowed(origin, host, allowedOrigins)) {
      sendError(res, 403, 'FORBIDDEN', 'ORIGIN_INVALID', req.requestId ?? 'unknown');
      return;
    }
    const pepper = requireAuthPepper();
    const presented = req.header(CSRF_HEADER_NAME) ?? cookies[CSRF_COOKIE_NAME];
    if (!auth.verifyCsrf(resolved.session.csrfTokenHash, presented, pepper)) {
      sendError(res, 403, 'FORBIDDEN', 'CSRF_INVALID', req.requestId ?? 'unknown');
      return;
    }
    await auth.logoutAll(sid);
    clearAuthCookies(res);
    sendSuccess(res, { loggedOutAll: true }, req.requestId ?? 'unknown');
  });

  app.get(`${ns}/memberships`, async (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const cookies = parseCookies(req.header('cookie') ?? undefined);
    const resolved = await auth.resolveSession(cookies[SESSION_COOKIE_NAME]);
    if (!resolved.principal) {
      sendError(res, 401, 'AUTH_NOT_CONNECTED', 'No active session.', req.requestId ?? 'unknown');
      return;
    }
    // Reuse verify path listing via a lightweight re-query through selectMembership denial path:
    // For Phase 4A, return memberships from a fresh otp-less lookup by resolving via logoutAll's user.
    const { withAdminClient } = await import('@ehas2/database');
    const rows = await withAdminClient(async (query) => {
      const m = await query(
        `SELECT m.id, m.organization_id, m.clinic_id, m.status, COALESCE(r.code,'Doctor') AS role_code
         FROM memberships m
         LEFT JOIN membership_roles mr ON mr.membership_id = m.id
         LEFT JOIN roles r ON r.id = mr.role_id
         WHERE m.user_id = $1
         ORDER BY m.created_at ASC`,
        [resolved.principal!.subjectId],
      );
      return m.rows.map((row) => {
        const rec = row as Record<string, unknown>;
        return {
          membershipId: String(rec.id),
          organizationId: String(rec.organization_id),
          clinicId: rec.clinic_id == null ? null : String(rec.clinic_id),
          roleCode: String(rec.role_code),
          status: String(rec.status),
        };
      });
    });
    sendSuccess(res, { memberships: rows }, req.requestId ?? 'unknown');
  });

  app.post(`${ns}/select-membership`, async (req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const cookies = parseCookies(req.header('cookie') ?? undefined);
    const sid = cookies[SESSION_COOKIE_NAME];
    if (!sid) {
      sendError(res, 401, 'AUTH_NOT_CONNECTED', 'No active session.', req.requestId ?? 'unknown');
      return;
    }
    const resolved = await auth.resolveSession(sid);
    if (!resolved.session) {
      sendError(res, 401, 'AUTH_NOT_CONNECTED', 'No active session.', req.requestId ?? 'unknown');
      return;
    }
    const origin = req.header('origin') ?? undefined;
    const host = req.header('host') ?? undefined;
    if (!originAllowed(origin, host, allowedOrigins)) {
      sendError(res, 403, 'FORBIDDEN', 'ORIGIN_INVALID', req.requestId ?? 'unknown');
      return;
    }
    const pepper = requireAuthPepper();
    const presented = req.header(CSRF_HEADER_NAME) ?? cookies[CSRF_COOKIE_NAME];
    if (!auth.verifyCsrf(resolved.session.csrfTokenHash, presented, pepper)) {
      sendError(res, 403, 'FORBIDDEN', 'CSRF_INVALID', req.requestId ?? 'unknown');
      return;
    }
    const membershipId = String((req.body as { membershipId?: string })?.membershipId ?? '');
    const result = await auth.selectMembership(sid, membershipId);
    if (!result.sessionToken || !result.csrfToken) {
      sendError(res, 403, 'FORBIDDEN', result.code, req.requestId ?? 'unknown');
      return;
    }
    setAuthCookies(res, result.sessionToken, result.csrfToken);
    sendSuccess(
      res,
      {
        code: result.code,
        principal: result.principal
          ? {
              subjectId: result.principal.subjectId,
              role: result.principal.role,
              tenantId: result.principal.tenantId,
              sessionId: result.principal.sessionId,
            }
          : null,
      },
      req.requestId ?? 'unknown',
    );
  });

  app.post(`${ns}/reauthenticate`, (_req: AuthedRequest, res) => {
    res.setHeader('Cache-Control', 'no-store');
    sendError(
      res,
      501,
      'NOT_IMPLEMENTED',
      'Privileged re-authentication requires passkey assurance (PASSKEY_NOT_CONNECTED).',
      _req.requestId ?? 'unknown',
    );
  });

  const passkeyNotConnected = (req: AuthedRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    sendError(
      res,
      501,
      'NOT_IMPLEMENTED',
      'PASSKEY_NOT_CONNECTED — standards-compliant WebAuthn library wiring pending owner approval.',
      req.requestId ?? 'unknown',
    );
  };

  app.post(`${ns}/passkeys/registration/options`, passkeyNotConnected);
  app.post(`${ns}/passkeys/registration/verify`, passkeyNotConnected);
  app.post(`${ns}/passkeys/authentication/options`, passkeyNotConnected);
  app.post(`${ns}/passkeys/authentication/verify`, passkeyNotConnected);
}

/** Exported for tests — hash comparison helper. */
export function csrfMatches(sessionHash: string, presented: string, pepper: string): boolean {
  return hashToken(presented, pepper) === sessionHash;
}
