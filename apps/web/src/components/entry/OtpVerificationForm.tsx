'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../ui/Button';
import { OTPInput } from './OTPInput';
import { PreviewModeBanner } from './PreviewModeBanner';
import {
  AUTH_PREVIEW_BANNER,
  isUniversalOtp,
  maskMobile,
  normalizeIndianMobile,
  UI_PREVIEW_CONTINUE_LABEL,
} from '../../lib/authPreview';
import { PUBLIC_ROUTES } from '../../config/navigation';

export function OtpVerificationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const mobileParam = params.get('m') ?? '';
  const masked = useMemo(() => maskMobile(normalizeIndianMobile(mobileParam)), [mobileParam]);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | undefined>();
  const [resendSeconds] = useState(30);
  const code = digits.join('');

  function handlePreviewContinue(event: FormEvent) {
    event.preventDefault();
    if (code.length === 6 && isUniversalOtp(code)) {
      setError('Universal OTP codes are not accepted.');
      return;
    }
    // Explicit UI-preview navigation — not backend verification.
    router.push(PUBLIC_ROUTES.dashboard);
  }

  return (
    <form className="ehas2-auth-actions" onSubmit={handlePreviewContinue}>
      <PreviewModeBanner message={AUTH_PREVIEW_BANNER} />
      <p>
        Code preview for <strong>{masked}</strong>
      </p>
      <OTPInput
        value={digits}
        onChange={(next) => {
          setDigits(next);
          if (error) setError(undefined);
        }}
        error={error}
      />
      <p role="status">Resend available in {resendSeconds}s (UI timer only — no SMS).</p>
      <Button type="submit" variant="primary">
        {UI_PREVIEW_CONTINUE_LABEL}
      </Button>
      <div className="ehas2-auth-links">
        <a href={PUBLIC_ROUTES.login}>Change number</a>
      </div>
    </form>
  );
}
