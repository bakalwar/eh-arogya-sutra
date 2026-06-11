import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function SystemSettings() {
  const [form, setForm] = useState({
    appName: '',
    referralRules: {},
    maxPatientsBasic: 100,
    maintenanceMode: false,
    maintenanceMessage: '',
    announcementBanner: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/admin/settings');
        const s = data.data;
        setForm({
          appName: s.appName || '',
          referralRules: s.referralRules || {},
          maxPatientsBasic: s.maxPatientsBasic ?? 100,
          maintenanceMode: !!s.maintenanceMode,
          maintenanceMessage: s.maintenanceMessage || '',
          announcementBanner: s.announcementBanner || ''
        });
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await client.put('/api/admin/settings', form);
      setSaved(true);
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-loading">Loading settings…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">System Settings</h2>
        <p className="text-sm text-[#64748b]">Platform configuration</p>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {saved && <div className="admin-card p-3 text-sm text-green-700 bg-green-50 border-green-200">Settings saved</div>}

      <form onSubmit={onSave} className="admin-card p-6 space-y-4">
        <div>
          <label className="admin-stat-label block mb-1">App Name</label>
          <input className="admin-input" value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} />
        </div>

        <div>
          <label className="admin-stat-label block mb-1">Referral Rules (JSON)</label>
          <textarea
            className="admin-input font-mono text-xs min-h-[80px]"
            value={JSON.stringify(form.referralRules, null, 2)}
            onChange={(e) => {
              try {
                setForm({ ...form, referralRules: JSON.parse(e.target.value) });
              } catch {
                /* ignore invalid json while typing */
              }
            }}
          />
          <p className="text-xs text-[#64748b] mt-1">Example: 10 referrals = 1 month free</p>
        </div>

        <div>
          <label className="admin-stat-label block mb-1">Max Patients (Basic Plan)</label>
          <input
            className="admin-input"
            type="number"
            value={form.maxPatientsBasic}
            onChange={(e) => setForm({ ...form, maxPatientsBasic: Number(e.target.value) })}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="maint"
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
          />
          <label htmlFor="maint" className="text-sm font-medium">Maintenance Mode ON/OFF</label>
        </div>

        <div>
          <label className="admin-stat-label block mb-1">Maintenance Message</label>
          <input className="admin-input" value={form.maintenanceMessage} onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })} />
        </div>

        <div>
          <label className="admin-stat-label block mb-1">Announcement Banner Text</label>
          <input className="admin-input" value={form.announcementBanner} onChange={(e) => setForm({ ...form, announcementBanner: e.target.value })} />
        </div>

        <button type="submit" className="admin-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
