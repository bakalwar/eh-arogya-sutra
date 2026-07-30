/**
 * Provider-neutral OTP delivery interface — Phase 4A.
 * Default production adapter returns OTP_PROVIDER_NOT_CONFIGURED (never fake success).
 */

export type OtpDeliveryResultCode =
  | 'OTP_PROVIDER_NOT_CONFIGURED'
  | 'OTP_DELIVERY_ACCEPTED'
  | 'OTP_DELIVERY_FAILED'
  | 'OTP_RATE_LIMITED'
  | 'OTP_PROVIDER_UNAVAILABLE';

export type OtpDeliveryRequest = {
  /** Opaque delivery handle — never a plaintext phone in logs. */
  deliveryRef: string;
  channel: 'sms_mobile';
  /** OTP plaintext is passed only to the provider adapter; never logged. */
  otpCode: string;
  purpose: 'login' | 'reauthenticate' | 'recovery';
  expiresAt: string;
};

export type OtpDeliveryResult = {
  code: OtpDeliveryResultCode;
  provider: 'none' | 'msg91_candidate' | 'twilio_verify_candidate' | 'test_fake';
  accepted: boolean;
  retryAllowed: boolean;
};

export interface OtpDeliveryProvider {
  readonly name: string;
  sendChallenge(input: OtpDeliveryRequest): Promise<OtpDeliveryResult>;
}

/** Production/default — truthful not-configured, never claims delivery. */
export class NotConfiguredOtpDeliveryProvider implements OtpDeliveryProvider {
  readonly name = 'none';

  async sendChallenge(_input: OtpDeliveryRequest): Promise<OtpDeliveryResult> {
    return {
      code: 'OTP_PROVIDER_NOT_CONFIGURED',
      provider: 'none',
      accepted: false,
      retryAllowed: false,
    };
  }
}

export const OTP_PROVIDER_STATUS = 'NOT_CONFIGURED' as const;

export function createDefaultOtpDeliveryProvider(): OtpDeliveryProvider {
  return new NotConfiguredOtpDeliveryProvider();
}
