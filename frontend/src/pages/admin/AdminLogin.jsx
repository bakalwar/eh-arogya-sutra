import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { setSession } from '../../security/tokenManager';
import '../../styles/admin-panel.css';

function isPlatformAdmin(role) {
  return role === 'admin' || role === 'super_admin';
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/login', {
        mobile: form.mobile,
        password: form.password
      });
      if (data.success && (data.accessToken || data.token) && data.user) {
        if (!isPlatformAdmin(data.user.role)) {
          setErr('Doctor accounts cannot access admin panel.');
          return;
        }
        setSession(data.accessToken || data.token, data.user, data.refreshToken);
        navigate('/admin', { replace: true });
        return;
      }
      setErr(data.message || 'Login failed');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <h1 className="text-xl font-bold text-[#0f172a] text-center">Admin Login</h1>
        <p className="text-center text-sm text-[#64748b] mt-1 mb-6">E.H. Arogya Sutra — Platform Control</p>
        {err && <div className="admin-error mb-4">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="admin-input"
            placeholder="Admin mobile (10 digits)"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
            maxLength={10}
            required
          />
          <input
            className="admin-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit" className="admin-btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Logging in…' : 'Login to Admin Panel'}
          </button>
        </form>
        <p className="text-[10px] text-[#64748b] mt-4 text-center">
          Doctors: use <a href="/login" className="text-[#1a56db] underline">/login</a>
        </p>
      </div>
    </div>
  );
}
