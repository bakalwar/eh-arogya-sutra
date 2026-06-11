import { useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { superAdminApi } from '../../api/superAdminClient';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="sa-stat-card">
      <div className="icon">{icon}</div>
      <div className="value">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

function fmtRs(n) {
  return `₹${fmt(n)}`;
}

export function OverviewPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    superAdminApi.overview().then((r) => setData(r.data.data)).catch(() => {});
  }, []);

  const s = data?.stats || {};
  const chart = data?.revenueChart || [];

  const lineData = {
    labels: chart.map((c) => c.month),
    datasets: [
      {
        label: 'Subscription',
        data: chart.map((c) => c.subscription),
        borderColor: '#4a9b54',
        backgroundColor: 'rgba(74,155,84,0.1)',
        tension: 0.3
      },
      {
        label: 'Pharmacy',
        data: chart.map((c) => c.pharmacy),
        borderColor: '#c9963a',
        backgroundColor: 'rgba(201,150,58,0.1)',
        tension: 0.3
      }
    ]
  };

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Overview</h1>
      <div className="sa-stat-grid">
        <StatCard icon="👨‍⚕️" label="Total Doctors" value={fmt(s.totalDoctors)} sub={`+${s.newDoctorsToday || 0} today`} />
        <StatCard icon="💰" label="Monthly Revenue" value={fmtRs(s.monthlyRevenue)} sub={`+${s.revenueGrowth || 0}% ↑`} />
        <StatCard icon="📋" label="Active Subscr." value={fmt(s.activeSubscriptions)} sub={`${s.subscriptionRate || 0}%`} />
        <StatCard icon="📄" label="Prescriptions" value={fmt(s.totalPrescriptions)} sub="this month" />
      </div>
      <div className="sa-stat-grid">
        <StatCard icon="🆓" label="Trial" value={fmt(s.trialDoctors)} sub="expiring soon" />
        <StatCard icon="🔵" label="Basic" value={fmt(s.basicDoctors)} sub="₹699/mo" />
        <StatCard icon="⭐" label="Pro" value={fmt(s.proDoctors)} sub="₹1499/mo" />
        <StatCard icon="🏪" label="Orders Today" value={fmt(s.ordersToday)} sub={fmtRs(s.ordersAmount)} />
      </div>

      <div className="sa-panel">
        <h2>Revenue (12 months)</h2>
        <Line data={lineData} options={{ responsive: true, plugins: { legend: { labels: { color: '#ccc' } } } }} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="sa-panel">
          <h2>Recent Activity</h2>
          <ul className="space-y-2 text-sm">
            {(data?.activity || []).map((a, i) => (
              <li key={i} className="text-white/70">
                {a.type === 'success' && '🟢'} {a.type === 'danger' && '🔴'} {a.type === 'warn' && '🟡'}{' '}
                {a.type === 'info' && '🔵'} {a.text} — <span className="text-white/40">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sa-panel">
          <h2>Today Summary</h2>
          <ul className="space-y-2 text-sm text-white/70">
            <li>New Registrations: {s.todaySummary?.newRegistrations ?? '—'}</li>
            <li>Payments Received: {fmtRs(s.todaySummary?.paymentsReceived)}</li>
            <li>Prescriptions: {fmt(s.todaySummary?.prescriptionsGenerated)}</li>
            <li>Reports Analyzed: {fmt(s.todaySummary?.reportsAnalyzed)}</li>
            <li>Active Sessions: {fmt(s.todaySummary?.activeSessions)}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  function load() {
    superAdminApi.doctors({ search }).then((r) => setDoctors(r.data.data || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function viewDoctor(id) {
    const { data } = await superAdminApi.doctor(id);
    setSelected(data.data);
  }

  async function setPlan(id, plan) {
    await superAdminApi.updateDoctor(id, { plan });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Doctors Management</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <input className="sa-input max-w-xs" placeholder="🔍 Search name/mobile/city" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="button" className="sa-btn" onClick={load}>
          Search
        </button>
      </div>
      <div className="sa-panel overflow-x-auto">
        <table className="sa-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Doctor</th>
              <th>Mobile</th>
              <th>City</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d, i) => (
              <tr key={d.id}>
                <td>{String(i + 1).padStart(3, '0')}</td>
                <td>{d.name}</td>
                <td>{d.mobile}</td>
                <td>{d.city}</td>
                <td>
                  {d.plan === 'pro' ? 'Pro ⭐' : d.plan}
                  {d.isSuspended && ' ⏸️'}
                </td>
                <td>
                  <button type="button" className="text-xs text-[#c9963a] underline mr-2" onClick={() => viewDoctor(d.id)}>
                    View
                  </button>
                  <button type="button" className="text-xs text-emerald-400 underline mr-1" onClick={() => setPlan(d.id, 'pro')}>
                    Pro
                  </button>
                  <button type="button" className="text-xs text-sky-400 underline" onClick={() => setPlan(d.id, 'basic')}>
                    Basic
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="sa-panel mt-4">
          <h2>Doctor Detail</h2>
          <p className="text-sm text-white/70">{selected.name} · {selected.mobile}</p>
          <p className="text-sm text-white/50">Rx count: {selected.prescriptionCount}</p>
          <button type="button" className="sa-btn-ghost sa-btn mt-2" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export function RevenuePage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    superAdminApi.revenue().then((r) => setData(r.data.data));
  }, []);

  const pieData = {
    labels: (data?.bySource || []).map((x) => x.label),
    datasets: [{ data: (data?.bySource || []).map((x) => x.value), backgroundColor: ['#4a9b54', '#2d6a35', '#c9963a', '#e8c46a'] }]
  };

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Revenue & Payments</h1>
      <div className="sa-panel">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <p>Today: {fmtRs(data?.summary?.today)}</p>
          <p>Week: {fmtRs(data?.summary?.week)}</p>
          <p>Month: {fmtRs(data?.summary?.month)}</p>
          <p>Year: {fmtRs(data?.summary?.year)}</p>
          <p>Total: {fmtRs(data?.summary?.total)}</p>
        </div>
      </div>
      <div className="sa-panel max-w-md">
        <h2>Revenue by Source</h2>
        <Pie data={pieData} />
      </div>
      <div className="sa-panel overflow-x-auto">
        <table className="sa-table">
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
            {(data?.payments || []).map((p, i) => (
              <tr key={i}>
                <td>{p.date ? new Date(p.date).toLocaleDateString('en-IN') : '—'}</td>
                <td>{p.doctor}</td>
                <td>{fmtRs(p.amount)}</td>
                <td>{p.method}</td>
                <td>✅ {p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SubscriptionsPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    superAdminApi.subscriptions().then((r) => setData(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Subscriptions</h1>
      <div className="sa-stat-grid">
        <StatCard icon="✅" label="Active" value={data?.overview?.active} />
        <StatCard icon="⏰" label="Expiring 7d" value={data?.overview?.expiring7} />
        <StatCard icon="🆓" label="Trial" value={data?.overview?.trial} />
        <StatCard icon="❌" label="Cancelled" value={data?.overview?.cancelled} />
      </div>
      <div className="sa-alert-red sa-panel">
        <h2 className="!mb-2">Expiring Soon</h2>
        {(data?.expiringSoon || []).map((d) => (
          <div key={d.id} className="flex justify-between text-sm py-1 border-b border-white/5">
            <span>{d.name} · {d.plan}</span>
            <button
              type="button"
              className="text-xs text-emerald-400"
              onClick={() => superAdminApi.extendSubscription({ doctorId: d.id, days: 7 }).then(() => window.location.reload())}
            >
              Extend 7d
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PricingPage() {
  const [pricing, setPricing] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: 50, maxUses: 100 });

  useEffect(() => {
    superAdminApi.pricing().then((r) => {
      setPricing(r.data.data.pricing || {});
      setCoupons(r.data.data.coupons || []);
    });
  }, []);

  async function savePrices() {
    await superAdminApi.savePricing({ pricing });
    alert('Prices saved for new subscriptions only.');
  }

  async function createCoupon() {
    await superAdminApi.createCoupon(couponForm);
    superAdminApi.pricing().then((r) => setCoupons(r.data.data.coupons || []));
  }

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Pricing Manager</h1>
      <div className="sa-panel">
        <p className="text-xs text-amber-200/80 mb-3">⚠️ New prices apply to new subscriptions only.</p>
        {['basicMonthly', 'basicYearly', 'proMonthly', 'proYearly', 'trialDays', 'basicPatientLimit'].map((k) => (
          <label key={k} className="block text-xs text-white/50 mb-1">
            {k}
            <input className="sa-input" value={pricing[k] ?? ''} onChange={(e) => setPricing({ ...pricing, [k]: e.target.value })} />
          </label>
        ))}
        <button type="button" className="sa-btn mt-2" onClick={savePrices}>
          💾 Save New Prices
        </button>
      </div>
      <div className="sa-panel">
        <h2>Create Coupon</h2>
        <input className="sa-input" placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
        <input className="sa-input" type="number" placeholder="Discount %" value={couponForm.discountPercent} onChange={(e) => setCouponForm({ ...couponForm, discountPercent: e.target.value })} />
        <button type="button" className="sa-btn" onClick={createCoupon}>
          Create Coupon
        </button>
        <table className="sa-table mt-4">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Uses</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.discount_percent}%</td>
                <td>{c.uses_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReferralsPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    superAdminApi.referrals().then((r) => setData(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Referrals</h1>
      <div className="sa-stat-grid">
        <StatCard icon="🔗" label="Total" value={data?.stats?.total} />
        <StatCard icon="✅" label="Successful" value={data?.stats?.successful} />
        <StatCard icon="🎁" label="Rewards" value={`${data?.stats?.rewardsMonths} mo`} />
        <StatCard icon="💰" label="Revenue" value={fmtRs(data?.stats?.revenue)} />
      </div>
      <div className="sa-panel overflow-x-auto">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Doctor</th>
              <th>Referrals</th>
              <th>Earned</th>
            </tr>
          </thead>
          <tbody>
            {(data?.topReferrers || []).map((r) => (
              <tr key={r.rank}>
                <td>{r.rank}</td>
                <td>{r.doctor}</td>
                <td>{r.referrals}</td>
                <td>{r.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MedicinesPage() {
  const [meds, setMeds] = useState([]);
  useEffect(() => {
    superAdminApi.medicines().then((r) => setMeds(r.data.data || []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Medicine Database</h1>
      <div className="sa-panel overflow-x-auto">
        <table className="sa-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Series</th>
              <th>Polarity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meds.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td>{m.name}</td>
                <td>{m.series}</td>
                <td>{m.polarity}</td>
                <td>
                  <button type="button" className="text-xs text-rose-400" onClick={() => superAdminApi.deleteMedicine(m.id).then(() => setMeds((x) => x.filter((y) => y.id !== m.id)))}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BooksPage() {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    superAdminApi.books().then((r) => setBooks(r.data.data || [])).catch(() => setBooks([]));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Book Library Admin</h1>
      <div className="sa-panel">
        <p className="text-sm text-white/50 mb-2">Upload via Doctor Admin → Book Library. OCR review coming soon.</p>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.title || b.bookName}</td>
                <td>{b.category || '—'}</td>
                <td>{b.status || 'active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VideosPage() {
  const [data, setData] = useState({ pending: [], approved: [] });
  useEffect(() => {
    superAdminApi.videos().then((r) => setData(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Video Verification</h1>
      <div className="sa-alert-red sa-panel">
        <h2>🔴 {data.pending?.length || 0} Pending</h2>
        {(data.pending || []).map((v) => (
          <div key={v.id} className="border-t border-white/10 py-3 mt-2">
            <p className="font-medium">{v.title}</p>
            <p className="text-xs text-white/50">{v.doctor_name}</p>
            <div className="flex gap-2 mt-2">
              <button type="button" className="sa-btn text-xs" onClick={() => superAdminApi.approveVideo(v.id).then(() => window.location.reload())}>
                ✅ Approve
              </button>
              <button type="button" className="sa-btn-ghost sa-btn text-xs" onClick={() => superAdminApi.rejectVideo(v.id, { reason: 'Rejected' }).then(() => window.location.reload())}>
                ❌ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PharmacyPage() {
  const [data, setData] = useState({ orders: [], settings: {} });
  useEffect(() => {
    superAdminApi.pharmacy().then((r) => setData(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Pharmacy Orders</h1>
      <div className="sa-panel overflow-x-auto">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Doctor</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data.orders || []).map((o) => (
              <tr key={o.id}>
                <td>{o.orderNumber}</td>
                <td>{o.doctor}</td>
                <td>{fmtRs(o.amount)}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    superAdminApi.settings().then((r) => setData(r.data.data));
  }, []);

  if (!data) return <p className="text-white/50">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">System Settings</h1>
      <div className="sa-panel">
        <h2>App Branding</h2>
        <input className="sa-input" placeholder="App Name" defaultValue={data.branding?.appName} />
        <input className="sa-input" placeholder="Support Email" defaultValue={data.branding?.supportEmail} />
        <button type="button" className="sa-btn" onClick={() => superAdminApi.saveSettings(data)}>
          Save
        </button>
      </div>
      <div className="sa-panel">
        <h2>API Keys</h2>
        <p className="text-xs text-white/50">LibreTranslate: {data.apiKeys?.libretranslate || '—'}</p>
        <p className="text-xs text-white/50">SMTP: {data.apiKeys?.smtp}</p>
      </div>
    </div>
  );
}

export function SecurityPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    superAdminApi.security().then((r) => setData(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Security & Logs</h1>
      <div className="sa-stat-grid">
        <StatCard icon="⚠️" label="Failed Logins" value={data?.failedLoginsToday} />
        <StatCard icon="🚫" label="Blocked IPs" value={data?.blockedCount} />
        <StatCard icon="👤" label="Sessions" value={data?.activeSessions} />
      </div>
      <div className="sa-panel overflow-x-auto">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {(data?.logs || []).map((l) => (
              <tr key={l.id}>
                <td>{l.time ? new Date(l.time).toLocaleString('en-IN') : '—'}</td>
                <td>{l.user}</td>
                <td>{l.action}</td>
                <td>{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnnouncementsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ type: 'info', title: '', message: '', target: 'all' });

  function load() {
    superAdminApi.announcements().then((r) => setList(r.data.data || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function send() {
    await superAdminApi.sendAnnouncement(form);
    setForm({ type: 'info', title: '', message: '', target: 'all' });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-xl text-[#e8c46a] mb-4">Announcements</h1>
      <div className="sa-panel">
        <select className="sa-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="update">Update</option>
        </select>
        <input className="sa-input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="sa-input min-h-[80px]" placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button type="button" className="sa-btn" onClick={send}>
          📧 Send Announcement
        </button>
      </div>
      <div className="sa-panel">
        <h2>Sent</h2>
        {list.map((a) => (
          <p key={a.id} className="text-sm text-white/60 border-b border-white/5 py-2">
            <strong>{a.title}</strong> — {a.message?.slice(0, 80)}
          </p>
        ))}
      </div>
    </div>
  );
}
