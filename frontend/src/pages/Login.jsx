import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import CaduceusLogo from '../components/website/CaduceusLogo';
import { setSession, clearSession } from '../security/tokenManager';
import { setLanguage } from '../i18n';
import { parseLoginResponse, homePathForUser } from '../utils/authLogin';

export default function Login() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const [adminPhone, setAdminPhone] = useState('9098791989');

  useEffect(() => {
    document.title = `${t('nav.login')} — E.H. Arogya Sutra`;
    const fresh = searchParams.get('start') === '1' || searchParams.get('fresh') === '1';
    if (fresh) clearSession();
    setBooted(true);
    client.get('/api/branding').then(({ data }) => {
      if (data?.data?.clinicPhone) {
        setAdminPhone(String(data.data.clinicPhone).replace(/\D/g, '').slice(-10) || data.data.clinicPhone);
      }
    }).catch(() => {});
  }, [t, searchParams]);

  if (!booted) return null;

  function handleApiError(e2) {
    const status = e2.response?.status;
    const msg = e2.response?.data?.message;
    if (!e2.response) {
      setErr(import.meta.env.PROD ? t('login.errBackendProd') : `${t('login.errNetwork')} — ${t('login.errNetworkHint')}`);
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
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/login', {
        mobile: form.mobile,
        password: form.password
      });
      const result = parseLoginResponse(data);
      if (result.ok) {
        setSession(result.accessToken, result.user, result.refreshToken);
        window.location.assign(homePathForUser(result.user));
        return;
      }
      setErr(result.error);
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

        {err && (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-sm text-rose-200">
            ⚠️ {err}
          </p>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Login ho raha hai…' : 'LOGIN →'}
          </button>
          <p className="text-center text-[11px] text-white/40">{t('login.hint')}</p>
          <p className="text-center text-xs text-white/45">
            {t('login.forgotPassword')}{' '}
            <a href={`tel:${adminPhone}`} className="text-[#c9963a]/90 underline">
              {adminPhone}
            </a>
          </p>
          <div className="flex flex-col gap-2 text-center text-xs">
            <Link to="/register" className="text-[#c9963a]/90 underline">
              Naye Doctor? Admin se register karayein
            </Link>
            <Link to="/website" className="text-white/40 underline">
              ← Public website
            </Link>
          </div>
        </form>

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
