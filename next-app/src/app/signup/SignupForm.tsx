'use client';

import Link from 'next/link';
import { useState } from 'react';
import CaduceusLogo from '@/components/ui/CaduceusLogo';
import { homePathForUser, signupDoctor } from '@/lib/api/auth';

export default function SignupForm() {
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const mobileDigits = mobile.replace(/\D/g, '').slice(-10);
    if (mobileDigits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!clinicName.trim()) {
      setError('Clinic name is required.');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the terms to register.');
      return;
    }

    setBusy(true);
    try {
      const result = await signupDoctor(
        mobileDigits,
        fullName.trim(),
        password,
        confirmPassword,
        clinicName.trim(),
        termsAccepted
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(homePathForUser(result.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
        <p className="login-sub">Doctor Sign Up</p>

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
            <label className="form-label" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              className="form-input"
              type="text"
              placeholder="Dr. Your Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="clinicName">
              Clinic Name
            </label>
            <input
              id="clinicName"
              className="form-input"
              type="text"
              placeholder="Your clinic name"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
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
              placeholder="Min 6 characters"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              className="form-input"
              type="password"
              placeholder="Re-enter password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <label className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
              style={{ marginTop: 3 }}
            />
            <span style={{ fontSize: 13, lineHeight: 1.4 }}>
              I accept the terms of service and privacy policy
            </span>
          </label>
          {error ? (
            <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</p>
          ) : null}
          <button type="submit" className="btn-new login-btn" disabled={busy}>
            {busy ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="login-footer">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
