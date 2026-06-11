import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { useApiHealth } from '../hooks/useApiHealth';
import CaduceusLogo from '../components/website/CaduceusLogo';
import { setSession, clearSession } from '../security/tokenManager';
import { setLanguage } from '../i18n';

function OtpBoxes({ value, onChange, disabled }) {
  const refs = useRef([]);

  function handleChange(index, digit) {
    const d = digit.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(6, ' ').split('').slice(0, 6);
    chars[index] = d || '';
    const next = chars.join('').replace(/\s/g, '');
    onChange(next);
    if (d && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="OTP">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          className="h-12 w-10 rounded-lg border border-white/15 bg-white/5 text-center text-xl text-white outline-none ring-emerald-500/40 focus:ring-2"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState('password');
  const [form, setForm] = useState({ mobile: '', password: '', otp: '', totp: '' });
  const [challengeId, setChallengeId] = useState('');
  const [userId, setUserId] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [otpDevConsole, setOtpDevConsole] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const { apiReady, apiStatus, recheckApi } = useApiHealth();

  useEffect(() => {
    document.title = `${t('nav.login')} — E.H. Arogya Sutra`;
    const fresh = searchParams.get('start') === '1' || searchParams.get('fresh') === '1';
    if (fresh) clearSession();
    setBooted(true);
  }, [t, searchParams]);

  if (!booted) return null;

  function networkHint() {
    return import.meta.env.PROD ? t('login.errNetworkHintProd') : t('login.errNetworkHint');
  }

  function handleApiError(e2) {
    const status = e2.response?.status;
    const msg = e2.response?.data?.message;
    if (!e2.response) {
      setErr(apiStatus === 'checking' ? t('login.apiStarting') : `${t('login.errNetwork')} — ${networkHint()}`);
    } else if (status === 503 && msg) {
      setErr(msg);
    } else if (status === 502 || status === 503) {
      setErr(import.meta.env.PROD ? t('login.errBackendProd') : t('login.errBackend'));
    } else if (status === 429) setErr(t('login.errRateLimit'));
    else if (status === 423) setErr(msg || t('login.errLocked'));
    else setErr(msg || e2.message || t('login.errGeneric'));
  }

  async function handleLogin(e) {
    e?.preventDefault();
    setErr('');
    if (!apiReady) await recheckApi();
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/login', {
        mobile: form.mobile,
        password: form.password
      });
      if (data.success && data.requires2fa) {
        setUserId(data.userId);
        setStep('2fa');
      } else if (data.success && data.requiresOtp && data.challengeId) {
        setChallengeId(data.challengeId);
        setEmailHint(data.emailHint || '');
        setOtpDevConsole(!!data.otpDevConsole);
        setOtpMessage(data.message || '');
        const code = data.devOtp ? String(data.devOtp) : '';
        setDevOtp(code);
        setForm((f) => ({ ...f, otp: code }));
        setStep('otp');
      } else {
        setErr(data.message || 'Login failed');
      }
    } catch (e2) {
      handleApiError(e2);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e?.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/verify-otp', {
        challengeId,
        otp: form.otp.trim()
      });
      if (data.success && (data.accessToken || data.token)) {
        setSession(data.accessToken || data.token, data.user, data.refreshToken);
        const role = data.user?.role;
        const dest =
          role === 'super_admin'
            ? '/super-admin/overview'
            : role === 'admin'
              ? '/admin'
              : '/dashboard';
        navigate(dest, { replace: true });
      } else {
        setErr(data.message || 'Verification failed');
      }
    } catch (e2) {
      handleApiError(e2);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2fa(e) {
    e?.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/verify-2fa', {
        userId,
        token: form.totp.trim()
      });
      if (data.success && (data.accessToken || data.token)) {
        setSession(data.accessToken || data.token, data.user, data.refreshToken);
        const role = data.user?.role;
        const dest =
          role === 'super_admin'
            ? '/super-admin/overview'
            : role === 'admin'
              ? '/admin'
              : '/dashboard';
        navigate(dest, { replace: true });
      } else {
        setErr(data.message || 'Verification failed');
      }
    } catch (e2) {
      handleApiError(e2);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#060d07] via-[#0b1a0d] to-[#080f09] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#c9963a]/20 bg-[#0b1a0d]/95 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <CaduceusLogo size={72} className="site-logo-glow" />
          <h1 className="mt-4 font-display text-2xl tracking-wide text-[#e8c46a]">AROGYA SUTRA</h1>
          <p className="mt-1 text-sm text-white/50">Doctor Login</p>
          <span className="mt-2 rounded-full border border-[#4a9b54]/40 bg-[#4a9b54]/10 px-3 py-0.5 text-[10px] font-semibold tracking-widest text-[#4a9b54]">
            ✦ Doctor CDSS — Smart Search &amp; Clinical Summary
          </span>
        </div>

        {apiStatus === 'checking' && (
          <p className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center text-xs text-sky-100">
            {t('login.apiStarting')}
          </p>
        )}
        {apiStatus === 'down' && (
          <p className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100">
            {networkHint()} — login try kar sakte hain.
          </p>
        )}
        {apiReady && <p className="mt-3 text-center text-[10px] text-emerald-400/90">● {t('login.apiReady')}</p>}

        {err && (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-sm text-rose-200">
            ⚠️ {err}
          </p>
        )}

        <div className="mt-6 space-y-5">
          {step === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-white/45">{t('login.mobile')}</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-white/45">{t('login.password')}</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
                  type="password"
                  placeholder="Password dalein"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Verify ho raha hai…' : 'LOGIN →'}
              </button>
              <p className="text-center text-[11px] text-white/40">{t('login.hint')}</p>
              <div className="flex flex-col gap-2 text-center text-xs">
                <Link to="/register" className="text-[#c9963a]/90 underline">
                  Naye Doctor? Register Karen
                </Link>
                <Link to="/website" className="text-white/40 underline">
                  ← Public website
                </Link>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-center text-sm text-white/60">
                OTP bheja gaya — {form.mobile}
                {emailHint ? ` (${emailHint})` : ''}
              </p>
              {otpMessage && <p className="text-center text-xs text-white/45">{otpMessage}</p>}

              {devOtp && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-center text-sm text-emerald-100">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
                    🔧 Development Mode
                  </span>
                  Your OTP: <strong className="font-mono text-lg tracking-widest text-white">{devOtp}</strong>
                  <button
                    type="button"
                    className="mt-2 block w-full rounded-lg border border-emerald-400/30 py-1 text-xs"
                    onClick={() => setForm((f) => ({ ...f, otp: devOtp }))}
                  >
                    Auto Fill
                  </button>
                </div>
              )}

              {otpDevConsole && !devOtp && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100">
                  OTP server terminal mein hai — <strong>npm run dev:fix</strong> then <strong>npm run dev</strong>
                </p>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <OtpBoxes value={form.otp} onChange={(otp) => setForm((f) => ({ ...f, otp }))} disabled={loading} />
                <button
                  type="submit"
                  disabled={loading || form.otp.length < 6}
                  className="w-full rounded-xl bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white disabled:opacity-50"
                >
                  {loading ? 'Verify ho raha hai…' : 'VERIFY & LOGIN →'}
                </button>
              </form>

              <button
                type="button"
                className="w-full text-xs text-white/45 underline"
                onClick={() => {
                  setStep('password');
                  setForm((f) => ({ ...f, otp: '' }));
                  setDevOtp('');
                  setErr('');
                }}
              >
                ← Password page par wapas
              </button>
            </div>
          )}

          {step === '2fa' && (
            <div className="space-y-4">
              <p className="text-center text-sm text-white/60">
                2FA Verification Required
              </p>
              <p className="text-center text-xs text-white/45">Enter the 6-digit code from your authenticator app.</p>

              <form onSubmit={handleVerify2fa} className="space-y-4">
                <OtpBoxes value={form.totp} onChange={(totp) => setForm((f) => ({ ...f, totp }))} disabled={loading} />
                <button
                  type="submit"
                  disabled={loading || form.totp.length < 6}
                  className="w-full rounded-xl bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'VERIFY & LOGIN →'}
                </button>
              </form>

              <button
                type="button"
                className="w-full text-xs text-white/45 underline"
                onClick={() => {
                  setStep('password');
                  setForm((f) => ({ ...f, totp: '' }));
                  setErr('');
                }}
              >
                ← Back to Password
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="text-xs text-white/40 underline" onClick={() => setLanguage('hi')}>
            हिंदी
          </button>
          <span className="text-white/20">|</span>
          <button type="button" className="text-xs text-white/40 underline" onClick={() => setLanguage('en')}>
            English
          </button>
        </div>
      </div>
    </div>
  );
}
