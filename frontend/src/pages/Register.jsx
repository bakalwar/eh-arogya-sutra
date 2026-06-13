import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import CaduceusLogo from '../components/website/CaduceusLogo';
import { setSession } from '../security/tokenManager';
import { parseLoginResponse, homePathForUser } from '../utils/authLogin';

export default function Register() {
  const [form, setForm] = useState({
    mobile: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e?.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/signup', {
        mobile: form.mobile,
        full_name: form.fullName,
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      const result = parseLoginResponse(data);
      if (result.ok) {
        setSession(result.accessToken, result.user, result.refreshToken);
        window.location.assign(homePathForUser(result.user));
        return;
      }
      setErr(result.error);
    } catch (e2) {
      const msg = e2.response?.data?.message;
      setErr(msg || e2.message || 'Signup failed');
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
          <p className="mt-1 text-sm text-white/50">Doctor Sign Up</p>
        </div>

        {err && (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-sm text-rose-200">
            ⚠️ {err}
          </p>
        )}

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/45">Mobile Number</label>
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
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/45">Full Name</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
              type="text"
              placeholder="Dr. Your Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/45">Password</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
              type="password"
              placeholder="Min 6 characters"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/45">Confirm Password</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
              type="password"
              placeholder="Re-enter password"
              minLength={6}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'SIGN UP →'}
          </button>
          <p className="text-center text-xs text-white/45">
            Already have an account?{' '}
            <Link to="/login" className="text-[#c9963a]/90 underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
