import { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import client from '../../api/client';

const FILTERS = ['All', 'Pending', 'Active', 'Blocked', 'Trial', 'Pro', 'Basic'];

const emptyAddForm = { name: '', mobile: '', city: '', license: '' };

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [generatedPassword, setGeneratedPassword] = useState('');

  async function fetchDoctors() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter !== 'All') params.filter = filter.toLowerCase();
      if (search.trim()) params.search = search.trim();
      const { data } = await client.get('/api/admin/doctors', { params });
      setDoctors(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
  }, [filter]);

  async function openDetail(id) {
    setActionLoading(true);
    try {
      const { data } = await client.get(`/api/admin/doctors/${id}`);
      setDetail(data.data);
      setSelected(id);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load doctor');
    } finally {
      setActionLoading(false);
    }
  }

  async function runAction(action, id) {
    setActionLoading(true);
    setError('');
    try {
      if (action === 'verify') await client.put(`/api/admin/doctors/${id}/verify`);
      if (action === 'block') await client.put(`/api/admin/doctors/${id}/block`, { blocked: true });
      if (action === 'unblock') await client.put(`/api/admin/doctors/${id}/block`, { blocked: false });
      if (action === 'delete') {
        if (!window.confirm('Remove this doctor?')) return;
        await client.delete(`/api/admin/doctors/${id}`);
      }
      await fetchDoctors();
      if (selected === id) await openDetail(id);
    } catch (e) {
      setError(e.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddDoctor(e) {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setGeneratedPassword('');
    try {
      const { data } = await client.post('/api/admin/doctors', addForm);
      setGeneratedPassword(data.password || '');
      setAddForm(emptyAddForm);
      await fetchDoctors();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to create doctor');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(id) {
    setActionLoading(true);
    setError('');
    try {
      const { data } = await client.post(`/api/admin/doctors/${id}/reset-password`);
      setGeneratedPassword(data.password || '');
      alert(`Naya password: ${data.password}\n\nDoctor ko WhatsApp/call se bhejein. Pehli login par password badalna hoga.`);
    } catch (e) {
      setError(e.response?.data?.message || 'Reset failed');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Doctor Management</h2>
          <p className="text-sm text-[#64748b]">Add doctors, reset password, view login history</p>
        </div>
        <button type="button" className="admin-btn-primary flex items-center gap-2" onClick={() => { setShowAdd(true); setGeneratedPassword(''); }}>
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {generatedPassword && (
        <div className="admin-card border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900">Generated password (sirf ek baar dikhega):</p>
          <p className="mt-1 font-mono text-lg tracking-widest text-[#0f172a]">{generatedPassword}</p>
          <p className="mt-2 text-[#64748b]">Yah password doctor ko WhatsApp/call se bhejo. Pehli login par naya password set karna hoga.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`admin-btn-ghost ${filter === f ? 'admin-filter-active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
        <input
          className="admin-input pl-9"
          placeholder="Search name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchDoctors()}
        />
      </div>

      {loading ? (
        <div className="admin-loading">Loading doctors…</div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="admin-table w-full min-w-[720px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>City</th>
                <th>License</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.name}</td>
                  <td>{d.mobile}</td>
                  <td>{d.city}</td>
                  <td>{d.license}</td>
                  <td className="capitalize">{d.plan}</td>
                  <td>{d.status}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => runAction('verify', d.id)}>✓ Verify</button>
                      <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => runAction(d.status === 'Blocked' ? 'unblock' : 'block', d.id)}>⊘ Block</button>
                      <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => handleResetPassword(d.id)}>🔑 Reset</button>
                      <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => openDetail(d.id)}>👁 View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAdd(false)}>
          <div className="admin-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">+ Add Doctor</h3>
            <form onSubmit={handleAddDoctor} className="space-y-3">
              <input className="admin-input" placeholder="Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
              <input className="admin-input" placeholder="Mobile (10 digits)" maxLength={10} value={addForm.mobile} onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value.replace(/\D/g, '') })} required />
              <input className="admin-input" placeholder="City" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} />
              <input className="admin-input" placeholder="License / Registration No." value={addForm.license} onChange={(e) => setAddForm({ ...addForm, license: e.target.value })} />
              <button type="submit" className="admin-btn-primary w-full" disabled={actionLoading}>
                {actionLoading ? 'Creating…' : 'Generate Password & Create'}
              </button>
            </form>
            <button type="button" className="admin-btn-ghost w-full mt-2" onClick={() => setShowAdd(false)}>Close</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="admin-card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{detail.personal?.name}</h3>
            <div className="space-y-3 text-sm">
              <p><span className="text-[#64748b]">Mobile:</span> {detail.personal?.mobile}</p>
              <p><span className="text-[#64748b]">City:</span> {detail.personal?.city}</p>
              <p><span className="text-[#64748b]">License:</span> {detail.license?.registrationNumber}</p>
              <p><span className="text-[#64748b]">Patients:</span> {detail.patientCount}</p>
              <p><span className="text-[#64748b]">Prescriptions:</span> {detail.prescriptionCount}</p>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-[#0f172a] mb-2">Login History</h4>
              {detail.loginHistory?.length ? (
                <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                  {detail.loginHistory.map((row, i) => (
                    <li key={i} className="flex justify-between border-b border-[#e2e8f0] py-1">
                      <span>{row.time ? new Date(row.time).toLocaleString('en-IN') : '—'}</span>
                      <span className="text-[#64748b]">{row.ip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#64748b]">No logins yet</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <button type="button" className="admin-btn-primary text-xs" disabled={actionLoading} onClick={async () => {
                const plan = window.prompt('Plan: trial, basic, or pro', detail.plan);
                if (plan) {
                  await client.put(`/api/admin/doctors/${selected}/plan`, { plan });
                  openDetail(selected);
                  fetchDoctors();
                }
              }}>Change Plan</button>
              <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => handleResetPassword(selected)}>Reset Password</button>
              <button type="button" className="admin-btn-ghost text-xs" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
