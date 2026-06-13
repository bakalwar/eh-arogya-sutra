'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import CaduceusLogo from '@/components/ui/CaduceusLogo';
import { homePathForUser, loginDoctor } from '@/lib/api/auth';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await loginDoctor(mobile.trim(), password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = searchParams.get('next');
      const dest = next && next.startsWith('/') ? next : homePathForUser(result.user);
      window.location.assign(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="eh-mock-root login-page">
      <div className="login-glow" />
      <div className="login-card">
        <div className="login-logo">
          <CaduceusLogo size={64} variant="splash" gradientPrefix="login" />
        </div>
        <h1 className="login-title">AROGYA SUTRA</h1>
        <p className="login-sub">E.H. Practitioner Login</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="mobile">
              Mobile Number
            </label>
            <input
              id="mobile"
              className="form-input"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</p>
          ) : null}
          <button type="submit" className="btn-new login-btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
