import { useEffect, useState } from 'react';
import { Users, Activity, DollarSign, AlertCircle } from 'lucide-react';
import client from '../../api/client';

function StatCard({ label, value, icon: Icon, alert }) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="admin-stat-label">{label}</p>
          <p className={`admin-stat-value mt-1 ${alert ? 'text-red-600' : ''}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${alert ? 'bg-red-50 text-red-600' : 'bg-[#eff6ff] text-[#1a56db]'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function statusDot(status) {
  if (status === 'online') return 'admin-status-online';
  if (status === 'offline') return 'admin-status-offline';
  return 'admin-status-warn';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [system, setSystem] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, sysRes, actRes] = await Promise.all([
          client.get('/api/admin/dashboard-stats'),
          client.get('/api/admin/system-status'),
          client.get('/api/admin/activity-log?limit=10')
        ]);
        setStats(statsRes.data.data);
        setSystem(sysRes.data.data);
        setActivity(actRes.data.data || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;
  if (error) return <div className="admin-error">{error}</div>;

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Dashboard</h2>
        <p className="text-sm text-[#64748b]">Platform overview — real-time from API</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Doctors" value={stats?.totalDoctors ?? '—'} icon={Users} />
        <StatCard label="Active Today" value={stats?.activeToday ?? '—'} icon={Activity} />
        <StatCard label="Total Revenue" value={fmt(stats?.totalRevenue)} icon={DollarSign} />
        <StatCard
          label="Pending Verify"
          value={stats?.pendingVerify ?? '—'}
          icon={AlertCircle}
          alert={Number(stats?.pendingVerify) > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="admin-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4">System Status</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className={`admin-status-dot ${statusDot(system?.backend?.status)}`} />
              Backend: {system?.backend?.label || '—'}
            </li>
            <li>
              <span className={`admin-status-dot ${statusDot(system?.database?.status)}`} />
              Database: {system?.database?.label || '—'}
            </li>
            <li>
              <span className={`admin-status-dot ${statusDot(system?.ehEngines?.status)}`} />
              EH Engines: {system?.ehEngines?.label || '—'}
            </li>
            <li>
              <span className={`admin-status-dot admin-status-warn`} />
              Storage: {system?.storage?.label || '—'}
            </li>
            <li className="text-[#64748b]">Active Users: {system?.activeUsers ?? '—'}</li>
            <li className="text-[#64748b]">Server Load: {system?.serverLoad ?? '—'}%</li>
          </ul>
        </div>

        <div className="admin-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-[#64748b]">No recent activity</p>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {activity.map((a) => (
                <li key={a.id} className="text-sm border-b border-[#f1f5f9] pb-2 last:border-0">
                  <span className="font-medium text-[#0f172a]">{a.user}</span>
                  <span className="text-[#64748b]"> — {a.action}</span>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    {a.time ? new Date(a.time).toLocaleString('en-IN') : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
