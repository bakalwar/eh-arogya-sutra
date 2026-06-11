import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import client from '../../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RevenueAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await client.get('/api/admin/revenue');
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load revenue');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="admin-loading">Loading revenue…</div>;
  if (error) return <div className="admin-error">{error}</div>;

  const chartData = {
    labels: (data?.monthlyChart || []).map((m) => m.month),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: (data?.monthlyChart || []).map((m) => m.revenue),
        backgroundColor: '#1a56db',
        borderRadius: 6
      }
    ]
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Revenue Analytics</h2>
        <p className="text-sm text-[#64748b]">Monthly revenue and recent payments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <p className="admin-stat-label">Total Revenue</p>
          <p className="admin-stat-value">{fmt(data?.totalRevenue)}</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-stat-label">This Month</p>
          <p className="admin-stat-value">{fmt(data?.thisMonth)}</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-stat-label">Growth</p>
          <p className={`admin-stat-value ${Number(data?.growthPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data?.growthPercent ?? 0}%
          </p>
        </div>
      </div>

      <div className="admin-card p-5">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }}
        />
      </div>

      <div className="admin-card overflow-x-auto">
        <table className="admin-table w-full min-w-[520px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Doctor</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentPayments || []).slice(0, 20).map((p, i) => (
              <tr key={p.id || i}>
                <td>{p.date ? new Date(p.date).toLocaleDateString('en-IN') : '—'}</td>
                <td>{p.doctor}</td>
                <td>{fmt(p.amount)}</td>
                <td>{p.method}</td>
                <td className="capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
