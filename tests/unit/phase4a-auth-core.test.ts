import { describe, expect, it } from 'vitest';
import {
  NotConfiguredOtpDeliveryProvider,
  OTP_PROVIDER_STATUS,
  createDefaultOtpDeliveryProvider,
  generateOtpCode,
  hashContact,
  hashOtp,
  hashToken,
  normalizeIndianMobile,
  originAllowed,
  requireAuthPepper,
  requiredAssuranceForRole,
  sessionCookieAttrs,
  smsOnlyLoginAllowed,
  verifyOtp,
  PlatformRole,
  AUTHENTICATION_STATUS,
  forbiddenClientTokenStorageLocations,
} from '../../packages/security/src/index.ts';

describe('Phase 4A auth unit contracts', () => {
  it('normalizes Indian mobiles and hashes contacts', () => {
    expect(normalizeIndianMobile('+91-98765-43210')).toBe('+919876543210');
    expect(normalizeIndianMobile('123')).toBeNull();
    const pepper = requireAuthPepper({ EHAS2_NODE_ENV: 'test' });
    const a = hashContact('+919876543210', pepper);
    const b = hashContact('+919876543210', pepper);
    expect(a).toBe(b);
    expect(a).not.toContain('98765');
  });

  it('OTP verifier uses scrypt and timing-safe verify', () => {
    const pepper = requireAuthPepper({ EHAS2_NODE_ENV: 'test' });
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
    const salt = 'aabbccddeeff00112233445566778899';
    const verifier = hashOtp(code, salt, pepper);
    expect(verifyOtp(code, salt, pepper, verifier)).toBe(true);
    expect(verifyOtp('000000', salt, pepper, verifier)).toBe(false);
  });

  it('session tokens hash; cookies are HttpOnly; Secure in production', () => {
    const pepper = requireAuthPepper({ EHAS2_NODE_ENV: 'test' });
    const token = 'opaque-session-token-value';
    expect(hashToken(token, pepper)).not.toBe(token);
    const prod = sessionCookieAttrs(true, 60);
    expect(prod.httpOnly).toBe(true);
    expect(prod.secure).toBe(true);
    const dev = sessionCookieAttrs(false, 60);
    expect(dev.secure).toBe(false);
  });

  it('default OTP provider is NOT_CONFIGURED and never accepts', async () => {
    expect(OTP_PROVIDER_STATUS).toBe('NOT_CONFIGURED');
    expect(AUTHENTICATION_STATUS).toBe('PHASE_4A_SESSION_CORE');
    const provider = createDefaultOtpDeliveryProvider();
    expect(provider).toBeInstanceOf(NotConfiguredOtpDeliveryProvider);
    const result = await provider.sendChallenge({
      deliveryRef: 'ref',
      channel: 'sms_mobile',
      otpCode: '482913',
      purpose: 'login',
      expiresAt: new Date().toISOString(),
    });
    expect(result.code).toBe('OTP_PROVIDER_NOT_CONFIGURED');
    expect(result.accepted).toBe(false);
  });

  it('privileged assurance and SMS-only Super Admin policy', () => {
    expect(requiredAssuranceForRole(PlatformRole.SuperAdmin)).toBe(
      'aal3_phishing_resistant_hardware',
    );
    expect(smsOnlyLoginAllowed(PlatformRole.SuperAdmin)).toBe(false);
    expect(smsOnlyLoginAllowed(PlatformRole.Doctor)).toBe(true);
    expect(
      originAllowed('http://localhost:3000', 'localhost:3000', ['http://localhost:3000']),
    ).toBe(true);
    expect(forbiddenClientTokenStorageLocations()).toContain('localStorage');
  });
});
