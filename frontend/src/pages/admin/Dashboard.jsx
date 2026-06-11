import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  Download, 
  Tag, 
  Bell,
  ArrowRight
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import QuickAction from '../../components/QuickAction';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ActivityFeed from '../../components/ActivityFeed';

export default function AdminDashboard() {
  const [stats] = useState({
    doctors: 142,
    revenue: '₹89K',
    prescriptions: 1248,
    pending: 8
  });

  const pendingDoctors = [
    { name: 'Dr. Ram Sharma', city: 'Seoni', license: 'Valid', joined: 'Today', plan: 'Trial' },
    { name: 'Dr. Sita Gupta', city: 'Jabalpur', license: 'Pending', joined: 'Yesterday', plan: 'Pro' },
  ];

  const activityItems = [
    { type: 'auth', text: 'Dr. Ram logged in', time: '2 min ago', badge: 'Login', badgeType: 'info' },
    { type: 'medicine', text: 'Medicine C-8 updated', time: '15 min ago', badge: 'Update', badgeType: 'warning' },
    { type: 'verify', text: 'Dr. Sita verified', time: '1 hr ago', badge: 'Verified', badgeType: 'success' },
  ];

  const columns = [
    { header: 'Doctor', key: 'name', render: (val) => <span className="font-bold">{val}</span> },
    { header: 'City', key: 'city' },
    { header: 'License', key: 'license', render: (val) => <Badge text={val} type={val === 'Valid' ? 'success' : 'warning'} /> },
    { header: 'Joined', key: 'joined' },
    { header: 'Plan', key: 'plan', render: (val) => <Badge text={val} type="muted" /> },
    { 
      header: 'Action', 
      key: 'action', 
      align: 'right', 
      render: () => (
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 bg-[var(--green)]/20 text-[var(--green)] rounded-md text-[10px] font-bold hover:bg-[var(--green)]/30 transition-all">Verify</button>
          <button className="px-3 py-1 border border-[var(--red)]/30 text-[var(--red)] rounded-md text-[10px] font-bold hover:bg-[var(--red)]/10 transition-all">Reject</button>
        </div>
      ) 
    }
  ];

  const MobileDoctorCard = ({ row }) => (
    <div className="card-base p-4 space-y-3 group active:scale-[0.98]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[14px] font-bold">{row.name}</p>
          <p className="text-[11px] text-[var(--muted)]">{row.city} · {row.joined}</p>
        </div>
        <Badge text={row.plan} type="muted" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <Badge text={row.license} type={row.license === 'Valid' ? 'success' : 'warning'} />
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-[var(--green)]/20 text-[var(--green)] rounded-md text-[10px] font-bold">Verify</button>
          <button className="px-3 py-1 border border-[var(--red)]/30 text-[var(--red)] rounded-md text-[10px] font-bold">Reject</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* SECTION A: Admin Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Doctors" value={stats.doctors} color="var(--gold)" icon={Users} />
        <StatCard label="Revenue" value={stats.revenue} color="var(--green)" icon={DollarSign} />
        <StatCard label="Prescriptions" value={stats.prescriptions} color="var(--blue)" icon={FileText} />
        <StatCard label="Pending Verify" value={stats.pending} color="var(--red)" icon={Clock} urgent />
      </div>

      {/* SECTION B: Revenue Chart (Placeholder for now) */}
      <div className="card-base p-6">
        <h2 className="section-label mb-6">MONTHLY REVENUE</h2>
        <div className="h-[200px] w-full bg-white/5 rounded-xl flex items-center justify-center border border-dashed border-white/10">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold">Chart.js Line Graph Placeholder</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECTION C: Doctor Verification Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label">PENDING VERIFICATION</h2>
            <Badge text={`${stats.pending} Pending`} type="danger" />
          </div>
          <DataTable 
            columns={columns} 
            data={pendingDoctors} 
            mobileCard={MobileDoctorCard}
          />
        </div>

        {/* SECTION E: Recent Activity Feed */}
        <div className="space-y-4">
          <h2 className="section-label">SYSTEM ACTIVITY</h2>
          <div className="card-base p-4">
            <ActivityFeed items={activityItems} />
            <button className="w-full mt-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded-lg transition-all flex items-center justify-center gap-2">
              View All Logs <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D: Quick Actions */}
      <div className="space-y-4">
        <h2 className="section-label">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction icon={PlusCircle} label="Add Medicine" onClick={() => {}} />
          <QuickAction icon={Download} label="Export Report" onClick={() => {}} />
          <QuickAction icon={Tag} label="Change Price" onClick={() => {}} />
          <QuickAction icon={Bell} label="Send Notice" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
}
