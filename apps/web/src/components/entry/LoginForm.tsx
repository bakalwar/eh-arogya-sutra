'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { PhoneNumberField } from './PhoneNumberField';
import { PreviewModeBanner } from './PreviewModeBanner';
import { AUTH_PREVIEW_BANNER, validateIndianMobile } from '../../lib/authPreview';
import { PUBLIC_ROUTES } from '../../config/navigation';

export function LoginForm() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateIndianMobile(mobile);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(undefined);
    setLoading(true);
    // UI preview only — no SMS / provider call. Do not log mobile.
    window.setTimeout(() => {
      const params = new URLSearchParams({ preview: '1', m: mobile });
      router.push(`${PUBLIC_ROUTES.verifyOtp}?${params.toString()}`);
    }, 400);
  }

  return (
    <form className="ehas2-auth-actions" onSubmit={handleSubmit} noValidate>
      <PreviewModeBanner message={AUTH_PREVIEW_BANNER} />
      <PhoneNumberField
        value={mobile}
        onChange={(value) => {
          setMobile(value);
          if (error) setError(undefined);
        }}
        error={error}
        disabled={loading}
      />
      <Button type="submit" variant="primary" disabled={loading} aria-busy={loading}>
        {loading ? 'Preparing preview…' : 'Send OTP'}
      </Button>
      <p className="ehas2-hindi">मोबाइल नंबर दर्ज करें · OTP सेवा अभी कनेक्ट नहीं है</p>
      <div className="ehas2-auth-links">
        <a href="/ui-foundation">Design preview</a>
        <a href="#privacy">Privacy</a>
        <a href="#support">Support</a>
      </div>
    </form>
  );
}
