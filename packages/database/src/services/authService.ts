import {
  ACCOUNT_LOCK_MS,
  AUTHENTICATION_STATUS,
  OTP_IP_MAX_REQUESTS,
  OTP_IP_WINDOW_MS,
  OTP_MAX_ATTEMPTS,
  OTP_PHONE_MAX_REQUESTS,
  OTP_PHONE_WINDOW_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  PRIVILEGED_SESSION_ABSOLUTE_TIMEOUT_MS,
  PRIVILEGED_SESSION_IDLE_TIMEOUT_MS,
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_IDLE_TIMEOUT_MS,
  authWorkspaceForRole,
  contactLast4,
  createDefaultOtpDeliveryProvider,
  createPrincipalForPolicyEvaluation,
  generateCsrfToken,
  generateOpaqueToken,
  generateOtpCode,
  hashContact,
  hashIp,
  hashOtp,
  hashToken,
  hashUserAgent,
  newSalt,
  normalizeIndianMobile,
  requireAuthPepper,
  smsOnlyLoginAllowed,
  verifyOtp,
  PlatformRole,
  type IdentityPrincipal,
  type OtpDeliveryProvider,
  type PlatformRoleName,
} from '@ehas2/security';
import { withAdminClient } from '../pool.js';
import { PgAuditEventRepository } from '../repositories/postgres.js';

const audit = new PgAuditEventRepository();

export type AuthServiceResultCode =
  | 'OTP_PROVIDER_NOT_CONFIGURED'
  | 'OTP_DELIVERY_ACCEPTED'
  | 'OTP_DELIVERY_FAILED'
  | 'OTP_RATE_LIMITED'
  | 'OTP_PROVIDER_UNAVAILABLE'
  | 'OTP_CHALLENGE_EXPIRED'
  | 'OTP_INVALID'
  | 'OTP_ATTEMPTS_EXCEEDED'
  | 'OTP_ALREADY_USED'
  | 'OTP_CHALLENGE_CREATED'
  | 'LOGIN_SUCCEEDED'
  | 'SESSION_OK'
  | 'SESSION_MISSING'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'MEMBERSHIP_REQUIRED'
  | 'MEMBERSHIP_SELECTED'
  | 'LOGOUT_OK'
  | 'LOGOUT_ALL_OK'
  | 'ACCESS_DENIED'
  | 'CSRF_INVALID'
  | 'ORIGIN_INVALID'
  | 'PASSKEY_NOT_CONNECTED'
  | 'SMS_ONLY_SUPER_ADMIN_DENIED'
  | 'ACCOUNT_LOCKED'
  | 'USER_DISABLED'
  | 'GENERIC_AUTH_FAILURE';

function genericAuthFailure(): { code: AuthServiceResultCode; message: string } {
  return {
    code: 'GENERIC_AUTH_FAILURE',
    message: 'Unable to complete authentication request.',
  };
}

/** Membership-pending sessions may lack tenant scope; do not force clinic principal rules. */
function buildPrincipal(input: {
  subjectId: string;
  role: PlatformRoleName;
  tenantId: string | null;
  sessionId: string;
}): IdentityPrincipal {
  if (!input.tenantId) {
    return {
      subjectId: input.subjectId,
      role: input.role,
      tenantId: null,
      sessionId: input.sessionId,
      authenticationStatus: AUTHENTICATION_STATUS,
    };
  }
  return createPrincipalForPolicyEvaluation(input);
}

async function bumpRateLimit(
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>,
  bucketKey: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  const now = Date.now();
  const existing = await query(
    `SELECT window_started_at, hit_count FROM auth_rate_limit_buckets WHERE bucket_key = $1`,
    [bucketKey],
  );
  const row = existing.rows[0] as { window_started_at: Date; hit_count: number } | undefined;
  if (!row) {
    await query(
      `INSERT INTO auth_rate_limit_buckets (bucket_key, window_started_at, hit_count) VALUES ($1, now(), 1)`,
      [bucketKey],
    );
    return true;
  }
  const started = new Date(row.window_started_at).getTime();
  if (now - started > windowMs) {
    await query(
      `UPDATE auth_rate_limit_buckets SET window_started_at = now(), hit_count = 1, updated_at = now() WHERE bucket_key = $1`,
      [bucketKey],
    );
    return true;
  }
  if (row.hit_count >= max) return false;
  await query(
    `UPDATE auth_rate_limit_buckets SET hit_count = hit_count + 1, updated_at = now() WHERE bucket_key = $1`,
    [bucketKey],
  );
  return true;
}

async function recordAttempt(
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>,
  input: {
    contactHash?: string | null;
    ipHash?: string | null;
    userId?: string | null;
    eventType: string;
    outcome: 'SUCCESS' | 'DENIED' | 'FAILED' | 'THROTTLED';
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await query(
    `INSERT INTO auth_attempts (contact_hash, ip_hash, user_id, event_type, outcome, metadata)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [
      input.contactHash ?? null,
      input.ipHash ?? null,
      input.userId ?? null,
      input.eventType,
      input.outcome,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export type AuthServiceDeps = {
  otpDelivery?: OtpDeliveryProvider;
};

export class AuthService {
  private readonly otpDelivery: OtpDeliveryProvider;

  constructor(deps: AuthServiceDeps = {}) {
    this.otpDelivery = deps.otpDelivery ?? createDefaultOtpDeliveryProvider();
  }

  async requestOtp(
    rawPhone: string,
    meta: { ip?: string | null; userAgent?: string | null },
    env: Record<string, string | undefined> = process.env,
  ): Promise<{
    code: AuthServiceResultCode;
    challengeId?: string;
    resendAvailableAt?: string;
    expiresAt?: string;
  }> {
    const pepper = requireAuthPepper(env);
    const normalized = normalizeIndianMobile(rawPhone);
    // Enumeration-safe: invalid phone still returns generic-shaped throttle-safe response.
    if (!normalized) {
      return { code: 'OTP_PROVIDER_NOT_CONFIGURED' };
    }
    const contactHash = hashContact(normalized, pepper);
    const ipHash = hashIp(meta.ip, pepper);
    const uaHash = hashUserAgent(meta.userAgent, pepper);

    return withAdminClient(async (query) => {
      const phoneOk = await bumpRateLimit(
        query,
        `otp:phone:${contactHash}`,
        OTP_PHONE_WINDOW_MS,
        OTP_PHONE_MAX_REQUESTS,
      );
      const ipOk = await bumpRateLimit(
        query,
        `otp:ip:${ipHash ?? 'unknown'}`,
        OTP_IP_WINDOW_MS,
        OTP_IP_MAX_REQUESTS,
      );
      if (!phoneOk || !ipOk) {
        await recordAttempt(query, {
          contactHash,
          ipHash,
          eventType: 'otp_throttled',
          outcome: 'THROTTLED',
          metadata: { scope: !phoneOk ? 'phone' : 'ip' },
        });
        return { code: 'OTP_RATE_LIMITED' };
      }

      const recent = await query(
        `SELECT resend_available_at FROM auth_otp_challenges
         WHERE contact_hash = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [contactHash],
      );
      const last = recent.rows[0] as { resend_available_at: Date } | undefined;
      if (last && new Date(last.resend_available_at).getTime() > Date.now()) {
        await recordAttempt(query, {
          contactHash,
          ipHash,
          eventType: 'otp_throttled',
          outcome: 'THROTTLED',
          metadata: { scope: 'resend_cooldown' },
        });
        return { code: 'OTP_RATE_LIMITED' };
      }

      const otp = generateOtpCode();
      const salt = newSalt();
      const verifier = hashOtp(otp, salt, pepper);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);
      const resendAt = new Date(Date.now() + OTP_RESEND_COOLDOWN_MS);

      await query(
        `UPDATE auth_otp_challenges SET status = 'INVALIDATED', updated_at = now()
         WHERE contact_hash = $1 AND status = 'PENDING'`,
        [contactHash],
      );

      const inserted = await query(
        `INSERT INTO auth_otp_challenges (
           contact_hash, purpose, otp_verifier, otp_salt, expires_at, max_attempts,
           resend_available_at, ip_hash, user_agent_hash, status, provider_code, delivery_status
         ) VALUES ($1,'login',$2,$3,$4,$5,$6,$7,$8,'PENDING','none','NOT_CONFIGURED')
         RETURNING id, expires_at, resend_available_at`,
        [
          contactHash,
          verifier,
          salt,
          expiresAt.toISOString(),
          OTP_MAX_ATTEMPTS,
          resendAt.toISOString(),
          ipHash,
          uaHash,
        ],
      );
      const challenge = inserted.rows[0] as {
        id: string;
        expires_at: Date;
        resend_available_at: Date;
      };

      const delivery = await this.otpDelivery.sendChallenge({
        deliveryRef: contactHash.slice(0, 12),
        channel: 'sms_mobile',
        otpCode: otp,
        purpose: 'login',
        expiresAt: expiresAt.toISOString(),
      });

      await query(
        `UPDATE auth_otp_challenges SET delivery_status = $2, provider_code = $3, updated_at = now() WHERE id = $1`,
        [
          challenge.id,
          delivery.code === 'OTP_DELIVERY_ACCEPTED'
            ? 'ACCEPTED'
            : delivery.code === 'OTP_RATE_LIMITED'
              ? 'RATE_LIMITED'
              : delivery.code === 'OTP_PROVIDER_UNAVAILABLE'
                ? 'UNAVAILABLE'
                : delivery.code === 'OTP_DELIVERY_FAILED'
                  ? 'FAILED'
                  : 'NOT_CONFIGURED',
          delivery.provider,
        ],
      );

      await recordAttempt(query, {
        contactHash,
        ipHash,
        eventType: 'otp_requested',
        outcome: delivery.accepted ? 'SUCCESS' : 'DENIED',
        metadata: { delivery: delivery.code, challengeId: challenge.id },
      });

      // Never return OTP. When provider not configured, challenge exists but delivery did not occur.
      if (delivery.code === 'OTP_PROVIDER_NOT_CONFIGURED') {
        return {
          code: 'OTP_PROVIDER_NOT_CONFIGURED',
          challengeId: challenge.id,
          resendAvailableAt: new Date(challenge.resend_available_at).toISOString(),
          expiresAt: new Date(challenge.expires_at).toISOString(),
        };
      }
      if (delivery.code === 'OTP_RATE_LIMITED') return { code: 'OTP_RATE_LIMITED' };
      if (delivery.code === 'OTP_PROVIDER_UNAVAILABLE') return { code: 'OTP_PROVIDER_UNAVAILABLE' };
      if (!delivery.accepted) return { code: 'OTP_DELIVERY_FAILED' };
      return {
        code: 'OTP_DELIVERY_ACCEPTED',
        challengeId: challenge.id,
        resendAvailableAt: new Date(challenge.resend_available_at).toISOString(),
        expiresAt: new Date(challenge.expires_at).toISOString(),
      };
    }, env);
  }

  async verifyOtp(
    rawPhone: string,
    challengeId: string,
    otpCode: string,
    meta: { ip?: string | null; userAgent?: string | null },
    env: Record<string, string | undefined> = process.env,
  ): Promise<{
    code: AuthServiceResultCode;
    sessionToken?: string;
    csrfToken?: string;
    principal?: IdentityPrincipal;
    memberships?: Array<{
      membershipId: string;
      organizationId: string;
      clinicId: string | null;
      roleCode: string;
      status: string;
    }>;
  }> {
    const pepper = requireAuthPepper(env);
    const normalized = normalizeIndianMobile(rawPhone);
    if (!normalized || !challengeId || !/^\d{6}$/.test(otpCode)) {
      return genericAuthFailure();
    }
    const contactHash = hashContact(normalized, pepper);
    const ipHash = hashIp(meta.ip, pepper);
    const uaHash = hashUserAgent(meta.userAgent, pepper);

    return withAdminClient(async (query) => {
      const ch = await query(
        `SELECT * FROM auth_otp_challenges WHERE id = $1 AND contact_hash = $2`,
        [challengeId, contactHash],
      );
      const challenge = ch.rows[0] as Record<string, unknown> | undefined;
      if (!challenge) {
        await recordAttempt(query, {
          contactHash,
          ipHash,
          eventType: 'otp_verify_failed',
          outcome: 'FAILED',
          metadata: { reason: 'not_found' },
        });
        return genericAuthFailure();
      }

      if (String(challenge.status) === 'CONSUMED') {
        return { code: 'OTP_ALREADY_USED' };
      }
      if (String(challenge.status) === 'LOCKED') {
        return { code: 'OTP_ATTEMPTS_EXCEEDED' };
      }
      // Fail closed: never verify OTP for challenges that were not delivered.
      if (String(challenge.delivery_status) !== 'ACCEPTED') {
        await recordAttempt(query, {
          contactHash,
          ipHash,
          eventType: 'otp_verify_failed',
          outcome: 'DENIED',
          metadata: { reason: 'delivery_not_accepted' },
        });
        if (String(challenge.delivery_status) === 'NOT_CONFIGURED') {
          return { code: 'OTP_PROVIDER_NOT_CONFIGURED' };
        }
        if (String(challenge.delivery_status) === 'UNAVAILABLE') {
          return { code: 'OTP_PROVIDER_UNAVAILABLE' };
        }
        return genericAuthFailure();
      }
      if (new Date(String(challenge.expires_at)).getTime() < Date.now()) {
        await query(
          `UPDATE auth_otp_challenges SET status = 'EXPIRED', updated_at = now() WHERE id = $1`,
          [challengeId],
        );
        return { code: 'OTP_CHALLENGE_EXPIRED' };
      }
      if (Number(challenge.attempt_count) >= Number(challenge.max_attempts)) {
        await query(
          `UPDATE auth_otp_challenges SET status = 'LOCKED', updated_at = now() WHERE id = $1`,
          [challengeId],
        );
        return { code: 'OTP_ATTEMPTS_EXCEEDED' };
      }

      const ok = verifyOtp(
        otpCode,
        String(challenge.otp_salt),
        pepper,
        String(challenge.otp_verifier),
      );
      if (!ok) {
        const attempts = Number(challenge.attempt_count) + 1;
        const locked = attempts >= Number(challenge.max_attempts);
        await query(
          `UPDATE auth_otp_challenges SET attempt_count = $2, status = $3, updated_at = now() WHERE id = $1`,
          [challengeId, attempts, locked ? 'LOCKED' : 'PENDING'],
        );
        await recordAttempt(query, {
          contactHash,
          ipHash,
          eventType: 'otp_verify_failed',
          outcome: 'FAILED',
          metadata: { attempts },
        });
        if (locked) {
          await query(
            `INSERT INTO auth_account_security (user_id, lock_until, failed_verify_count, last_failed_at)
             SELECT user_id, now() + ($2::bigint * interval '1 millisecond'), $3, now()
             FROM auth_contact_methods WHERE contact_hash = $1
             ON CONFLICT (user_id) DO UPDATE SET
               lock_until = EXCLUDED.lock_until,
               failed_verify_count = auth_account_security.failed_verify_count + EXCLUDED.failed_verify_count,
               last_failed_at = now(),
               updated_at = now()`,
            [contactHash, ACCOUNT_LOCK_MS, attempts],
          );
          return { code: 'OTP_ATTEMPTS_EXCEEDED' };
        }
        return genericAuthFailure();
      }

      await query(
        `UPDATE auth_otp_challenges SET status = 'CONSUMED', consumed_at = now(), updated_at = now() WHERE id = $1`,
        [challengeId],
      );

      // Resolve or create synthetic user bound to contact hash (no plaintext phone stored).
      let userId: string;
      const existingContact = await query(
        `SELECT user_id, status FROM auth_contact_methods WHERE channel = 'sms_mobile' AND contact_hash = $1`,
        [contactHash],
      );
      if (existingContact.rows[0]) {
        userId = String((existingContact.rows[0] as { user_id: string }).user_id);
        const user = await query(`SELECT status FROM users WHERE id = $1`, [userId]);
        const status = String(
          (user.rows[0] as { status?: string } | undefined)?.status ?? 'INACTIVE',
        );
        if (status !== 'ACTIVE') {
          await recordAttempt(query, {
            contactHash,
            ipHash,
            userId,
            eventType: 'disabled_account_attempt',
            outcome: 'DENIED',
          });
          return { code: 'USER_DISABLED' };
        }
      } else {
        const created = await query(
          `INSERT INTO users (display_name, status) VALUES ($1, 'ACTIVE') RETURNING id`,
          ['Doctor'],
        );
        userId = String((created.rows[0] as { id: string }).id);
        await query(
          `INSERT INTO auth_contact_methods (user_id, channel, contact_hash, contact_last4, verified_at, status)
           VALUES ($1,'sms_mobile',$2,$3,now(),'ACTIVE')`,
          [userId, contactHash, contactLast4(normalized)],
        );
        await query(
          `INSERT INTO auth_account_security (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
          [userId],
        );
        await query(
          `INSERT INTO auth_recovery_methods (user_id, method_type, status) VALUES ($1,'recovery_codes_contract','CONTRACT_ONLY')`,
          [userId],
        );
      }

      const memberships = await query(
        `SELECT m.id, m.organization_id, m.clinic_id, m.status, COALESCE(r.code, 'Doctor') AS role_code
         FROM memberships m
         LEFT JOIN membership_roles mr ON mr.membership_id = m.id
         LEFT JOIN roles r ON r.id = mr.role_id
         WHERE m.user_id = $1
         ORDER BY m.created_at ASC`,
        [userId],
      );

      const mapped = memberships.rows.map((row) => {
        const rec = row as Record<string, unknown>;
        return {
          membershipId: String(rec.id),
          organizationId: String(rec.organization_id),
          clinicId: rec.clinic_id == null ? null : String(rec.clinic_id),
          roleCode: String(rec.role_code),
          status: String(rec.status),
        };
      });

      const active = mapped.filter((m) => m.status === 'ACTIVE');
      let roleCode: PlatformRoleName = PlatformRole.Doctor;
      let membershipId: string | null = null;
      let organizationId: string | null = null;
      let clinicId: string | null = null;

      if (active.length === 1) {
        membershipId = active[0]!.membershipId;
        organizationId = active[0]!.organizationId;
        clinicId = active[0]!.clinicId;
        roleCode = (active[0]!.roleCode as PlatformRoleName) || PlatformRole.Doctor;
      }

      if (!smsOnlyLoginAllowed(roleCode)) {
        await recordAttempt(query, {
          contactHash,
          ipHash,
          userId,
          eventType: 'sms_only_super_admin_denied',
          outcome: 'DENIED',
        });
        return { code: 'SMS_ONLY_SUPER_ADMIN_DENIED' };
      }

      const workspace = authWorkspaceForRole(roleCode);
      const idleMs =
        workspace === 'doctor' ? SESSION_IDLE_TIMEOUT_MS : PRIVILEGED_SESSION_IDLE_TIMEOUT_MS;
      const absMs =
        workspace === 'doctor'
          ? SESSION_ABSOLUTE_TIMEOUT_MS
          : PRIVILEGED_SESSION_ABSOLUTE_TIMEOUT_MS;
      const now = Date.now();
      const sessionToken = generateOpaqueToken();
      const csrfToken = generateCsrfToken();
      const tokenHash = hashToken(sessionToken, pepper);
      const csrfHash = hashToken(csrfToken, pepper);

      const sessionIns = await query(
        `INSERT INTO auth_sessions (
           user_id, token_hash, workspace, assurance_level, auth_methods,
           membership_id, organization_id, clinic_id, role_code, csrf_token_hash,
           idle_expires_at, absolute_expires_at, ip_hash, user_agent_hash
         ) VALUES (
           $1,$2,$3,'aal1_otp',ARRAY['sms_otp']::text[],
           $4,$5,$6,$7,$8,
           $9,$10,$11,$12
         ) RETURNING id`,
        [
          userId,
          tokenHash,
          workspace,
          membershipId,
          organizationId,
          clinicId,
          active.length === 1 ? roleCode : null,
          csrfHash,
          new Date(now + idleMs).toISOString(),
          new Date(now + absMs).toISOString(),
          ipHash,
          uaHash,
        ],
      );
      const sessionId = String((sessionIns.rows[0] as { id: string }).id);

      await recordAttempt(query, {
        contactHash,
        ipHash,
        userId,
        eventType: 'login_succeeded',
        outcome: 'SUCCESS',
        metadata: { sessionId, workspace },
      });

      try {
        await audit.append(
          { query },
          {
            organizationId: organizationId ?? undefined,
            clinicId: clinicId ?? undefined,
            actorId: userId,
            actorRole: roleCode,
            eventType: 'auth_login_succeeded',
            resourceType: 'auth_session',
            resourceId: sessionId,
            outcome: 'SUCCESS',
            metadata: { workspace, assurance: 'aal1_otp' },
          },
        );
      } catch {
        // Security-event write failure policy: login still succeeds; attempt row already stored.
      }

      const principal = buildPrincipal({
        subjectId: userId,
        role: roleCode,
        tenantId: organizationId,
        sessionId,
      });

      return {
        code: active.length === 0 || active.length > 1 ? 'MEMBERSHIP_REQUIRED' : 'LOGIN_SUCCEEDED',
        sessionToken,
        csrfToken,
        principal,
        memberships: mapped,
      };
    }, env);
  }

  async resolveSession(
    sessionToken: string | null | undefined,
    env: Record<string, string | undefined> = process.env,
  ): Promise<{
    code: AuthServiceResultCode;
    principal?: IdentityPrincipal;
    session?: {
      id: string;
      userId: string;
      workspace: string;
      membershipId: string | null;
      organizationId: string | null;
      clinicId: string | null;
      roleCode: string | null;
      csrfTokenHash: string;
      idleExpiresAt: string;
      absoluteExpiresAt: string;
    };
  }> {
    if (!sessionToken) return { code: 'SESSION_MISSING' };
    const pepper = requireAuthPepper(env);
    const tokenHash = hashToken(sessionToken, pepper);
    return withAdminClient(async (query) => {
      const res = await query(`SELECT * FROM auth_sessions WHERE token_hash = $1`, [tokenHash]);
      const row = res.rows[0] as Record<string, unknown> | undefined;
      if (!row) return { code: 'SESSION_MISSING' };
      if (row.revoked_at) return { code: 'SESSION_REVOKED' };
      const now = Date.now();
      if (new Date(String(row.absolute_expires_at)).getTime() < now) {
        return { code: 'SESSION_EXPIRED' };
      }
      if (new Date(String(row.idle_expires_at)).getTime() < now) {
        return { code: 'SESSION_EXPIRED' };
      }
      const user = await query(`SELECT status FROM users WHERE id = $1`, [String(row.user_id)]);
      if (String((user.rows[0] as { status?: string } | undefined)?.status) !== 'ACTIVE') {
        return { code: 'USER_DISABLED' };
      }

      const idleMs =
        String(row.workspace) === 'doctor'
          ? SESSION_IDLE_TIMEOUT_MS
          : PRIVILEGED_SESSION_IDLE_TIMEOUT_MS;
      await query(
        `UPDATE auth_sessions SET last_seen_at = now(), idle_expires_at = $2, updated_at = now() WHERE id = $1`,
        [String(row.id), new Date(now + idleMs).toISOString()],
      );

      const roleCode =
        (String(row.role_code || 'Doctor') as PlatformRoleName) || PlatformRole.Doctor;
      const tenantId = row.organization_id == null ? null : String(row.organization_id);
      const principal = buildPrincipal({
        subjectId: String(row.user_id),
        role: roleCode,
        tenantId,
        sessionId: String(row.id),
      });
      return {
        code: tenantId && row.role_code ? 'SESSION_OK' : 'MEMBERSHIP_REQUIRED',
        principal,
        session: {
          id: String(row.id),
          userId: String(row.user_id),
          workspace: String(row.workspace),
          membershipId: row.membership_id == null ? null : String(row.membership_id),
          organizationId: row.organization_id == null ? null : String(row.organization_id),
          clinicId: row.clinic_id == null ? null : String(row.clinic_id),
          roleCode: row.role_code == null ? null : String(row.role_code),
          csrfTokenHash: String(row.csrf_token_hash),
          idleExpiresAt: new Date(String(row.idle_expires_at)).toISOString(),
          absoluteExpiresAt: new Date(String(row.absolute_expires_at)).toISOString(),
        },
      };
    }, env);
  }

  async logout(
    sessionToken: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<{ code: AuthServiceResultCode }> {
    const pepper = requireAuthPepper(env);
    const tokenHash = hashToken(sessionToken, pepper);
    return withAdminClient(async (query) => {
      const res = await query(`SELECT id, user_id FROM auth_sessions WHERE token_hash = $1`, [
        tokenHash,
      ]);
      const row = res.rows[0] as { id: string; user_id: string } | undefined;
      if (!row) return { code: 'LOGOUT_OK' };
      await query(
        `UPDATE auth_sessions SET revoked_at = now(), revoke_reason = 'logout', updated_at = now() WHERE id = $1`,
        [row.id],
      );
      await query(
        `INSERT INTO auth_session_revocations (session_id, user_id, reason, revoked_by_actor_id)
         VALUES ($1,$2,'logout',$2)`,
        [row.id, row.user_id],
      );
      await recordAttempt(query, {
        userId: row.user_id,
        eventType: 'logout',
        outcome: 'SUCCESS',
        metadata: { sessionId: row.id },
      });
      return { code: 'LOGOUT_OK' };
    }, env);
  }

  async logoutAll(
    sessionToken: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<{ code: AuthServiceResultCode }> {
    const resolved = await this.resolveSession(sessionToken, env);
    if (!resolved.session) return { code: 'SESSION_MISSING' };
    const userId = resolved.session.userId;
    return withAdminClient(async (query) => {
      const sessions = await query(
        `SELECT id FROM auth_sessions WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
      for (const s of sessions.rows) {
        const id = String((s as { id: string }).id);
        await query(
          `UPDATE auth_sessions SET revoked_at = now(), revoke_reason = 'logout_all', updated_at = now() WHERE id = $1`,
          [id],
        );
        await query(
          `INSERT INTO auth_session_revocations (session_id, user_id, reason, revoked_by_actor_id)
           VALUES ($1,$2,'logout_all',$2)`,
          [id, userId],
        );
      }
      await recordAttempt(query, {
        userId,
        eventType: 'logout_all',
        outcome: 'SUCCESS',
        metadata: { count: sessions.rows.length },
      });
      return { code: 'LOGOUT_ALL_OK' };
    }, env);
  }

  async selectMembership(
    sessionToken: string,
    membershipId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<{
    code: AuthServiceResultCode;
    sessionToken?: string;
    csrfToken?: string;
    principal?: IdentityPrincipal;
  }> {
    const resolved = await this.resolveSession(sessionToken, env);
    if (!resolved.session || !resolved.principal) return { code: 'SESSION_MISSING' };
    const pepper = requireAuthPepper(env);
    return withAdminClient(async (query) => {
      const m = await query(
        `SELECT m.id, m.user_id, m.organization_id, m.clinic_id, m.status, COALESCE(r.code,'Doctor') AS role_code
         FROM memberships m
         LEFT JOIN membership_roles mr ON mr.membership_id = m.id
         LEFT JOIN roles r ON r.id = mr.role_id
         WHERE m.id = $1`,
        [membershipId],
      );
      const row = m.rows[0] as Record<string, unknown> | undefined;
      if (!row || String(row.user_id) !== resolved.session!.userId) {
        return { code: 'ACCESS_DENIED' };
      }
      if (String(row.status) !== 'ACTIVE') {
        return { code: 'ACCESS_DENIED' };
      }
      const roleCode = String(row.role_code) as PlatformRoleName;
      if (!smsOnlyLoginAllowed(roleCode) && resolved.session!.workspace === 'doctor') {
        // Selecting into super-admin via membership without passkey assurance is denied.
        return { code: 'SMS_ONLY_SUPER_ADMIN_DENIED' };
      }

      // Rotate session after membership/privilege change.
      await query(
        `UPDATE auth_sessions SET revoked_at = now(), revoke_reason = 'rotated', updated_at = now() WHERE id = $1`,
        [resolved.session!.id],
      );
      const newToken = generateOpaqueToken();
      const csrfToken = generateCsrfToken();
      const workspace = authWorkspaceForRole(roleCode);
      const idleMs =
        workspace === 'doctor' ? SESSION_IDLE_TIMEOUT_MS : PRIVILEGED_SESSION_IDLE_TIMEOUT_MS;
      const absMs =
        workspace === 'doctor'
          ? SESSION_ABSOLUTE_TIMEOUT_MS
          : PRIVILEGED_SESSION_ABSOLUTE_TIMEOUT_MS;
      const now = Date.now();
      const ins = await query(
        `INSERT INTO auth_sessions (
           user_id, token_hash, workspace, assurance_level, auth_methods,
           membership_id, organization_id, clinic_id, role_code, csrf_token_hash,
           idle_expires_at, absolute_expires_at, rotated_from_session_id
         ) VALUES ($1,$2,$3,'aal1_otp',ARRAY['sms_otp']::text[],$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          resolved.session!.userId,
          hashToken(newToken, pepper),
          workspace,
          String(row.id),
          String(row.organization_id),
          row.clinic_id == null ? null : String(row.clinic_id),
          roleCode,
          hashToken(csrfToken, pepper),
          new Date(now + idleMs).toISOString(),
          new Date(now + absMs).toISOString(),
          resolved.session!.id,
        ],
      );
      const sessionId = String((ins.rows[0] as { id: string }).id);
      await recordAttempt(query, {
        userId: resolved.session!.userId,
        eventType: 'membership_selected',
        outcome: 'SUCCESS',
        metadata: { membershipId, sessionId },
      });
      const principal = buildPrincipal({
        subjectId: resolved.session!.userId,
        role: roleCode,
        tenantId: String(row.organization_id),
        sessionId,
      });
      return {
        code: 'MEMBERSHIP_SELECTED',
        sessionToken: newToken,
        csrfToken,
        principal,
      };
    }, env);
  }

  verifyCsrf(sessionCsrfHash: string, presented: string | undefined, pepper: string): boolean {
    if (!presented) return false;
    return hashToken(presented, pepper) === sessionCsrfHash;
  }
}

export const authService = new AuthService();
