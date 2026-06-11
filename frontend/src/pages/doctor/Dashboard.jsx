import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  FileText, 
  Search, 
  FlaskConical, 
  PlusSquare,
  TrendingUp,
  Clock,
  ArrowRight,
  UserPlus,
  Hexagon
} from 'lucide-react';
import { getUser } from '../../security/tokenManager';
import client from '../../api/client';
import StatCard from '../../components/StatCard';
import QuickAction from '../../components/QuickAction';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';

export default function DoctorDashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [ehStatus, setEhStatus] = useState(null);

  useEffect(() => {
    client.get('/api/eh-engine/health')
      .then(({ data }) => setEhStatus(data))
      .catch(() => setEhStatus({ online: false }));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECTION A: Hero Welcome Card */}
      <section className="rounded-[var(--radius-card)] border border-[rgba(201,150,58,0.2)] p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-[#0a1a0b] to-[#0d2010]">
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <p className="text-[9px] font-heading font-bold uppercase tracking-[4px] text-[var(--gold)]">CLINICAL DECISION SUPPORT</p>
            <h1 className="text-[18px] md:text-[24px] font-heading font-bold text-[var(--text)]">
              Good Morning, Dr. {user?.name || 'Practitioner'}
            </h1>
            <p className="text-[14px] font-subtitle italic text-[var(--muted)]">Your clinical intelligence engine is ready</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <NavLink to="/search" className="btn-gold-filled no-underline h-[36px] min-h-0">
              <PlusSquare className="w-4 h-4" /> New Analysis
            </NavLink>
            <NavLink to="/report-analysis" className="btn-gold-outline no-underline h-[36px] min-h-0">
              <FlaskConical className="w-4 h-4" /> Analyze Report
            </NavLink>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${ehStatus?.online ? 'bg-[var(--green)] animate-pulse shadow-[0_0_8px_var(--green)]' : 'bg-[var(--red)]'}`} />
              <span className="text-[11px] font-medium text-[var(--text)] opacity-80">EH Engine: {ehStatus?.online ? 'Operational' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hexagon className="w-3 h-3 text-[var(--gold)]" />
              <span className="text-[11px] font-medium text-[var(--gold)]">9 Rule Engines Active</span>
            </div>
          </div>
        </div>
        <Activity className="absolute -right-10 -bottom-10 w-48 h-48 text-[var(--gold)] opacity-5 pointer-events-none" />
      </section>

      {/* SECTION B: Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Patients" value="12" color="var(--gold)" icon={Users} />
        <StatCard label="Prescriptions" value="08" color="var(--green)" icon={FileText} />
        <StatCard label="Pending" value="04" color="#e8c46a" icon={Clock} />
        <StatCard label="Success Rate" value="94%" color="var(--green2)" icon={TrendingUp} />
      </div>

      {/* SECTION C: Quick Actions */}
      <div className="space-y-4">
        <h2 className="section-label">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction icon={Search} label="Symptom Search" onClick={() => navigate('/search')} />
          <QuickAction icon={FlaskConical} label="Upload Report" onClick={() => navigate('/report-analysis')} />
          <QuickAction icon={FileText} label="New Prescription" onClick={() => navigate('/prescription')} />
          <QuickAction icon={UserPlus} label="Add Patient" onClick={() => navigate('/patient')} />
        </div>
      </div>
    </div>
  );
}
