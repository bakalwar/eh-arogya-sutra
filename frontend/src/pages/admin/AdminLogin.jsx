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
  const [step, setStep] = useState('password');
  const [form, setForm] = useState({ mobile: '', password: '', otp: '', challengeId: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState('');

  async function onPasswordSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    setDevHint('');
    try {
      const { data } = await client.post('/api/auth/login', {
        mobile: form.mobile,
        password: form.password
      });
      if (data.success && data.challengeId) {
        setForm((f) => ({ ...f, challengeId: data.challengeId }));
        setStep('otp');
        setDevHint(data.devOtp ? `Dev OTP: ${data.devOtp}` : '');
        return;
      }
      if (data.accessToken && data.user) {
        if (!isPlatformAdmin(data.user.role)) {
          setErr('Doctor accounts cannot access admin panel.');
          return;
        }
        setSession(data.accessToken, data.user, data.refreshToken);
        navigate('/admin', { replace: true });
      }
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/verify-otp', {
        challengeId: form.challengeId,
        otp: form.otp
      });
      if (!isPlatformAdmin(data.user?.role)) {
        setErr('Only admin accounts can sign in here. Use doctor login for clinical access.');
        return;
      }
      setSession(data.accessToken, data.user, data.refreshToken);
      navigate('/admin', { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.message || 'OTP verification failed');
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
        {devHint && <p className="text-xs text-[#1a56db] mb-3 text-center">{devHint}</p>}

        {step === 'password' ? (
          <form onSubmit={onPasswordSubmit} className="space-y-3">
            <input
              className="admin-input"
              placeholder="Admin mobile (10 digits)"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
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
              {loading ? 'Sending OTP…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={onOtpSubmit} className="space-y-3">
            <input
              className="admin-input"
              placeholder="SMS OTP (mobile par aaya)"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              required
            />
            <button type="submit" className="admin-btn-primary w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Enter Admin Dashboard'}
            </button>
            <button type="button" className="admin-btn-ghost w-full" onClick={() => setStep('password')}>
              Back
            </button>
          </form>
        )}
        <p className="text-[10px] text-[#64748b] mt-4 text-center">
          Doctors: use <a href="/login" className="text-[#1a56db] underline">/login</a>
        </p>
      </div>
    </div>
  );
}
