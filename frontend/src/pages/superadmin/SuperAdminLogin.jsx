import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '../../api/superAdminClient';
import { setSession } from '../../security/tokenManager';
import '../../styles/super-admin.css';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', secret_key: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await superAdminApi.login(form);
      setSession(data.accessToken, data.user, data.refreshToken);
      navigate('/super-admin/overview', { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sa-login-page">
      <div className="sa-login-box">
        <h1 className="font-display text-xl text-[#e8c46a] text-center">SUPER ADMIN</h1>
        <p className="text-center text-xs text-white/45 mt-1 mb-6">E.H. Arogya Sutra — Master Control</p>
        {err && <div className="sa-alert-red">⚠️ {err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="sa-input"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            className="sa-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            className="sa-input"
            type="password"
            placeholder="Secret Key"
            value={form.secret_key}
            onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
            required
          />
          <button type="submit" className="sa-btn w-full mt-2" disabled={loading}>
            {loading ? 'Verifying…' : '🔐 Enter Control Center'}
          </button>
        </form>
        <p className="text-[10px] text-white/30 mt-4 text-center">IP whitelist + 3-factor auth · No OTP</p>
      </div>
    </div>
  );
}
