import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import client from '../../api/client';

const FILTERS = ['All', 'Pending', 'Active', 'Blocked', 'Trial', 'Pro', 'Basic'];

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Doctor Management</h2>
        <p className="text-sm text-[#64748b]">Verify, block, and manage registered doctors</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

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
          <table className="admin-table w-full min-w-[640px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>License</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.name}</td>
                  <td>{d.city}</td>
                  <td>{d.license}</td>
                  <td className="capitalize">{d.plan}</td>
                  <td>{d.status}</td>
                  <td>{d.joined ? new Date(d.joined).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => runAction('verify', d.id)}>✓ Verify</button>
                      <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => runAction(d.status === 'Blocked' ? 'unblock' : 'block', d.id)}>⊘ Block</button>
                      <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={() => openDetail(d.id)}>👁 View</button>
                      <button type="button" className="admin-btn-ghost text-xs text-red-600" disabled={actionLoading} onClick={() => runAction('delete', d.id)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div className="flex flex-wrap gap-2 mt-6">
              <button type="button" className="admin-btn-primary text-xs" disabled={actionLoading} onClick={async () => {
                const plan = window.prompt('Plan: trial, basic, or pro', detail.plan);
                if (plan) {
                  await client.put(`/api/admin/doctors/${selected}/plan`, { plan });
                  openDetail(selected);
                  fetchDoctors();
                }
              }}>Change Plan</button>
              <button type="button" className="admin-btn-ghost text-xs" disabled={actionLoading} onClick={async () => {
                await client.post(`/api/admin/doctors/${selected}/reset-password`);
                alert('Password reset to Reset@123456');
              }}>Reset Password</button>
              <button type="button" className="admin-btn-ghost text-xs" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
