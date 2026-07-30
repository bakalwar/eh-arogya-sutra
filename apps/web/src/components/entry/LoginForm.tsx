'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { PhoneNumberField } from './PhoneNumberField';
import { PreviewModeBanner } from './PreviewModeBanner';
import {
  AUTH_PREVIEW_BANNER,
  normalizeIndianMobile,
  validateIndianMobile,
} from '../../lib/authPreview';
import { PUBLIC_ROUTES } from '../../config/navigation';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';

function apiBase(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_EHAS2_API_BASE) {
    return process.env.NEXT_PUBLIC_EHAS2_API_BASE.replace(/\/$/, '');
  }
  return '';
}

export function LoginForm() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateIndianMobile(mobile);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(undefined);
    setStatus(undefined);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}${EHAS2_API_NAMESPACE}/auth/otp/request`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizeIndianMobile(mobile) }),
        cache: 'no-store',
      });
      const body = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
        data?: { realOtpSent?: boolean; challengeId?: string };
      };
      if (body.code === 'OTP_PROVIDER_NOT_CONFIGURED' || res.status === 503) {
        setStatus(
          'OTP_PROVIDER_NOT_CONFIGURED — no OTP was sent. Real authentication cannot continue until a provider is approved and configured.',
        );
        // Do not navigate as if SMS succeeded. Do not put phone in the URL for auth.
        return;
      }
      if (!res.ok) {
        setError(body.message ?? 'Unable to start authentication.');
        return;
      }
      // Provider accepted delivery — challenge id only, never OTP, never phone in query.
      const challengeId = body.data?.challengeId;
      if (challengeId) {
        router.push(`${PUBLIC_ROUTES.verifyOtp}?challenge=${encodeURIComponent(challengeId)}`);
      }
    } catch {
      setError('Authentication API is unreachable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="ehas2-auth-actions" onSubmit={(e) => void handleSubmit(e)} noValidate>
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
        {loading ? 'Requesting…' : 'Send OTP'}
      </Button>
      {status ? (
        <p className="ehas2-field__error" role="status">
          {status}
        </p>
      ) : null}
      <p className="ehas2-hindi">मोबाइल नंबर दर्ज करें · OTP प्रदाता अभी कॉन्फ़िगर नहीं है</p>
      <div className="ehas2-auth-links">
        <a href={`${PUBLIC_ROUTES.verifyOtp}?preview=1`}>UI preview only (not authentication)</a>
        <a href="/ui-foundation">Design preview</a>
      </div>
    </form>
  );
}
