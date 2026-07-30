/**
 * TESTS-ONLY fake OTP delivery provider.
 * Never import from production app wiring.
 */
import type {
  OtpDeliveryProvider,
  OtpDeliveryRequest,
  OtpDeliveryResult,
} from '../../packages/security/src/otpDelivery.ts';

export class FakeOtpDeliveryProvider implements OtpDeliveryProvider {
  readonly name = 'test_fake';
  lastOtp: string | null = null;
  lastRequest: OtpDeliveryRequest | null = null;
  mode: 'accept' | 'unavailable' | 'failed' = 'accept';
  calls = 0;

  async sendChallenge(input: OtpDeliveryRequest): Promise<OtpDeliveryResult> {
    this.calls += 1;
    this.lastRequest = input;
    this.lastOtp = input.otpCode;
    if (this.mode === 'unavailable') {
      return {
        code: 'OTP_PROVIDER_UNAVAILABLE',
        provider: 'test_fake',
        accepted: false,
        retryAllowed: true,
      };
    }
    if (this.mode === 'failed') {
      return {
        code: 'OTP_DELIVERY_FAILED',
        provider: 'test_fake',
        accepted: false,
        retryAllowed: true,
      };
    }
    return {
      code: 'OTP_DELIVERY_ACCEPTED',
      provider: 'test_fake',
      accepted: true,
      retryAllowed: true,
    };
  }
}
