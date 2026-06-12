import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import CaduceusLogo from '../components/website/CaduceusLogo';
import { getCurrentUser, saveTokens, getRefreshToken, getAccessToken } from '../security/tokenManager';

export default function ChangePassword() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const forced = !!user?.mustChangePassword;
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    if (form.next.length < 6) {
      setErr('Naya password kam se kam 6 characters ka hona chahiye.');
      return;
    }
    if (form.next !== form.confirm) {
      setErr('Password match nahi ho raha.');
      return;
    }
    setLoading(true);
    try {
      const body = { newPassword: form.next };
      if (!forced) body.currentPassword = form.current;
      const { data } = await client.post('/api/auth/change-password', body);
      if (data.success) {
        const updated = { ...user, mustChangePassword: false };
        saveTokens(getAccessToken(), getRefreshToken(), updated);
        navigate('/dashboard', { replace: true });
      } else {
        setErr(data.message || 'Update failed');
      }
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#060d07] via-[#0b1a0d] to-[#080f09] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#c9963a]/20 bg-[#0b1a0d]/95 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <CaduceusLogo size={64} className="site-logo-glow" />
          <h1 className="mt-4 font-display text-xl text-[#e8c46a]">
            {forced ? 'Naya Password Set Karen' : 'Password Badlein'}
          </h1>
          {forced && (
            <p className="mt-2 text-sm text-white/55">
              Pehli baar login — admin ne diya temporary password ab badalna zaroori hai.
            </p>
          )}
        </div>

        {err && (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-sm text-rose-200">
            ⚠️ {err}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {!forced && (
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
              type="password"
              placeholder="Current password"
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
              required
            />
          )}
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
            type="password"
            placeholder="Naya password (min 6)"
            minLength={6}
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
            required
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-500/40 focus:ring-2"
            type="password"
            placeholder="Naya password dubara"
            minLength={6}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#2d6a35] to-[#4a9b54] py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'SAVE & CONTINUE →'}
          </button>
        </form>
      </div>
    </div>
  );
}
