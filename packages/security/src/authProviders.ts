import { FoundationStatus } from '@ehas2/shared';
import { AUTHENTICATION_STATUS } from './identity.js';

/**
 * Provider-portable authentication interfaces — Phase 2B-A design only.
 * No SDK, no credentials, no OTP traffic, no session issuance.
 */
export type IdentityProviderName =
  | 'ehas2_internal'
  | 'msg91_otp_delivery'
  | 'twilio_verify'
  | 'amazon_cognito'
  | 'auth0'
  | 'firebase_auth'
  | 'keycloak_self_hosted'
  | 'unknown';

export type AuthenticationAssuranceLevel =
  'aal1_otp_or_password' | 'aal2_mfa_or_passkey' | 'aal3_phishing_resistant_hardware';

export type ProviderAccountMapping = {
  internalUserId: string;
  provider: IdentityProviderName;
  providerSubjectId: string;
  linkedAt: string;
  verified: boolean;
};

export type IdentityProviderChallenge = {
  challengeId: string;
  provider: IdentityProviderName;
  channel: 'sms_otp' | 'passkey' | 'security_key' | 'totp' | 'recovery';
  expiresAt: string;
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export interface IdentityProvider {
  readonly name: IdentityProviderName;
  readonly status: typeof FoundationStatus.NOT_IMPLEMENTED;
  beginAuthentication(_input: unknown): never;
}

export interface OtpProvider {
  readonly name: IdentityProviderName;
  readonly status: typeof FoundationStatus.NOT_IMPLEMENTED;
  sendChallenge(_input: unknown): never;
  verifyChallenge(_input: unknown): never;
}

export interface PasskeyProvider {
  readonly name: IdentityProviderName;
  readonly status: typeof FoundationStatus.NOT_IMPLEMENTED;
  beginRegistration(_input: unknown): never;
  finishRegistration(_input: unknown): never;
  beginAuthentication(_input: unknown): never;
  finishAuthentication(_input: unknown): never;
}

export interface SessionStore {
  readonly status: typeof FoundationStatus.NOT_IMPLEMENTED;
  createSession(_input: unknown): never;
  revokeSession(_input: unknown): never;
  listSessions(_input: unknown): never;
}

/** Provider outage must never create an authentication bypass. */
export type ProviderOutageBehavior = {
  allowAuthBypass: false;
  safeErrorCode:
    'AUTH_PROVIDER_UNAVAILABLE' | 'OTP_PROVIDER_UNAVAILABLE' | 'SESSION_STORE_UNAVAILABLE';
  retryAllowed: boolean;
  alertRequired: true;
};

export const PROVIDER_OUTAGE_NO_BYPASS: ProviderOutageBehavior = {
  allowAuthBypass: false,
  safeErrorCode: 'AUTH_PROVIDER_UNAVAILABLE',
  retryAllowed: true,
  alertRequired: true,
};

export class NotImplementedIdentityProvider implements IdentityProvider {
  readonly name: IdentityProviderName = 'unknown';
  readonly status = FoundationStatus.NOT_IMPLEMENTED;

  beginAuthentication(_input: unknown): never {
    const err = new Error('IdentityProvider: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

export class NotImplementedOtpProvider implements OtpProvider {
  readonly name: IdentityProviderName = 'unknown';
  readonly status = FoundationStatus.NOT_IMPLEMENTED;

  sendChallenge(_input: unknown): never {
    const err = new Error('OtpProvider: NOT_IMPLEMENTED — no OTP traffic in Phase 2B-A');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  verifyChallenge(_input: unknown): never {
    const err = new Error('OtpProvider: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

export class NotImplementedPasskeyProvider implements PasskeyProvider {
  readonly name: IdentityProviderName = 'unknown';
  readonly status = FoundationStatus.NOT_IMPLEMENTED;

  beginRegistration(_input: unknown): never {
    const err = new Error('PasskeyProvider: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  finishRegistration(_input: unknown): never {
    const err = new Error('PasskeyProvider: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  beginAuthentication(_input: unknown): never {
    const err = new Error('PasskeyProvider: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  finishAuthentication(_input: unknown): never {
    const err = new Error('PasskeyProvider: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

export class NotImplementedSessionStore implements SessionStore {
  readonly status = FoundationStatus.NOT_IMPLEMENTED;

  createSession(_input: unknown): never {
    const err = new Error('SessionStore: NOT_IMPLEMENTED — no production session issuance');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  revokeSession(_input: unknown): never {
    const err = new Error('SessionStore: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  listSessions(_input: unknown): never {
    const err = new Error('SessionStore: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

/** Provider identity is never authorization truth by itself. */
export function providerIdentityIsNotAuthorizationTruth(): true {
  return true;
}

export function authenticationRemainsNotImplemented(): boolean {
  return AUTHENTICATION_STATUS === 'NOT_IMPLEMENTED';
}

export function forbiddenClientTokenStorageLocations(): readonly string[] {
  return ['localStorage', 'sessionStorage', 'url_query_string'];
}

export const UNIVERSAL_OTP_FORBIDDEN = true as const;

export const AUTH_PROVIDER_DECISION_ADR_STATUS = 'ACCEPTED_ARCHITECTURE_ONLY' as const;
export const OTP_PROVIDER_STATUS = 'PENDING' as const;
