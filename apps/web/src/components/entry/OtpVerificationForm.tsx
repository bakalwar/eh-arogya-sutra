'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../ui/Button';
import { OTPInput } from './OTPInput';
import { PreviewModeBanner } from './PreviewModeBanner';
import {
  AUTH_PREVIEW_BANNER,
  isUniversalOtp,
  UI_PREVIEW_CONTINUE_LABEL,
} from '../../lib/authPreview';
import { PUBLIC_ROUTES } from '../../config/navigation';

export function OtpVerificationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preview = params.get('preview') === '1';
  const challengeId = params.get('challenge') ?? '';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const code = digits.join('');
  const heading = useMemo(
    () =>
      preview ? 'UI preview — not real authentication' : 'Enter OTP (provider must be configured)',
    [preview],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (code.length === 6 && isUniversalOtp(code)) {
      setError('Universal OTP codes are not accepted.');
      return;
    }
    if (preview) {
      // Explicit UI-preview navigation — not backend verification; never writes to PostgreSQL.
      router.push(PUBLIC_ROUTES.dashboard);
      return;
    }
    if (!challengeId) {
      setStatus('OTP_PROVIDER_NOT_CONFIGURED — start again from login. No OTP was delivered.');
      return;
    }
    setStatus(
      'OTP verification requires a configured delivery provider. Production login remains blocked at OTP_PROVIDER_NOT_CONFIGURED.',
    );
  }

  return (
    <form className="ehas2-auth-actions" onSubmit={handleSubmit}>
      <PreviewModeBanner message={AUTH_PREVIEW_BANNER} />
      <p>{heading}</p>
      <OTPInput
        value={digits}
        onChange={(next) => {
          setDigits(next);
          if (error) setError(undefined);
        }}
        error={error}
      />
      {status ? (
        <p className="ehas2-field__error" role="status">
          {status}
        </p>
      ) : null}
      <Button type="submit" variant="primary">
        {preview ? UI_PREVIEW_CONTINUE_LABEL : 'Verify OTP'}
      </Button>
      <div className="ehas2-auth-links">
        <a href={PUBLIC_ROUTES.login}>Back to login</a>
        <a href={PUBLIC_ROUTES.login}>Provider not configured</a>
      </div>
    </form>
  );
}
