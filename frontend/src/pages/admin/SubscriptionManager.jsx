import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function SubscriptionManager() {
  const [settings, setSettings] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', discountPercent: '', validUntil: '', maxUses: '100' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [setRes, coupRes] = await Promise.all([
        client.get('/api/admin/settings'),
        client.get('/api/admin/coupons')
      ]);
      setSettings(setRes.data.data);
      setCoupons(coupRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function savePrice(plan, field, value) {
    setSaving(true);
    try {
      const pricing = { ...(settings?.pricing || {}) };
      pricing[field] = Number(value);
      await client.put('/api/admin/settings', { pricing });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save price');
    } finally {
      setSaving(false);
    }
  }

  async function createCoupon(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/api/admin/coupon', {
        code: form.code,
        discountPercent: Number(form.discountPercent),
        validUntil: form.validUntil || null,
        maxUses: Number(form.maxUses) || 100
      });
      setForm({ code: '', discountPercent: '', validUntil: '', maxUses: '100' });
      await load();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-loading">Loading subscriptions…</div>;

  const pricing = settings?.pricing || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Subscription Manager</h2>
        <p className="text-sm text-[#64748b]">Plans, pricing, and coupon codes</p>
      </div>
      {error && <div className="admin-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="admin-card p-6">
          <h3 className="font-bold text-[#1a56db] uppercase text-sm">Basic Plan</h3>
          <p className="text-3xl font-bold mt-2">₹{pricing.basicMonthly ?? 699}<span className="text-sm font-normal text-[#64748b]">/month</span></p>
          <p className="text-sm text-[#64748b] mt-1">{pricing.basicPatientLimit ?? 100} patients max</p>
          <button type="button" className="admin-btn-primary mt-4 text-sm" disabled={saving} onClick={() => {
            const v = window.prompt('Basic monthly price (₹)', pricing.basicMonthly ?? 699);
            if (v) savePrice('basic', 'basicMonthly', v);
          }}>Edit Price</button>
        </div>
        <div className="admin-card p-6">
          <h3 className="font-bold text-[#1a56db] uppercase text-sm">Pro Plan</h3>
          <p className="text-3xl font-bold mt-2">₹{pricing.proMonthly ?? 1499}<span className="text-sm font-normal text-[#64748b]">/month</span></p>
          <p className="text-sm text-[#64748b] mt-1">Unlimited patients</p>
          <button type="button" className="admin-btn-primary mt-4 text-sm" disabled={saving} onClick={() => {
            const v = window.prompt('Pro monthly price (₹)', pricing.proMonthly ?? 1499);
            if (v) savePrice('pro', 'proMonthly', v);
          }}>Edit Price</button>
        </div>
      </div>

      <div className="admin-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-[#0f172a]">Coupon Codes</h3>
        </div>
        <form onSubmit={createCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
          <input className="admin-input" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <input className="admin-input" placeholder="Discount %" type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} required />
          <input className="admin-input" placeholder="Expiry (YYYY-MM-DD)" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
          <button type="submit" className="admin-btn-primary" disabled={saving}>+ Create Coupon</button>
        </form>
        <div className="overflow-x-auto">
          <table className="admin-table w-full min-w-[480px]">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Used</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={4} className="text-[#64748b] text-sm py-4">No coupons yet</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono font-medium">{c.code}</td>
                  <td>{c.discount}%</td>
                  <td>{c.used}/{c.maxUses ?? '∞'}</td>
                  <td>{c.expiry ? new Date(c.expiry).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
