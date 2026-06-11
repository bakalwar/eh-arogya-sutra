import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  CreditCard, 
  Search, 
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  MoreVertical
} from 'lucide-react';
import client from '../../api/client';

// DESIGN TOKENS
const COLORS = {
  bg: '#080f09', // Dark Forest
  surface: '#0c160d',
  border: 'rgba(201, 150, 58, 0.1)',
  gold: '#c9963a',
  green: '#4a9b54',
  blue: '#5dade2',
  red: '#e74c3c',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)'
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/admin/subscriptions');
      if (res.data.success) {
        setSubscriptions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    const name = sub.user?.name || '';
    const mobile = sub.user?.mobile || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           mobile.includes(searchQuery);
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return COLORS.green;
      case 'expired': return COLORS.red;
      case 'cancelled': return COLORS.textMuted;
      default: return COLORS.gold;
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-8" style={{ borderColor: COLORS.border }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: COLORS.gold }}>
              Billing & Plans
            </p>
            <h1 className="mt-2 text-3xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <CreditCard className="w-8 h-8" style={{ color: COLORS.gold }} />
              Subscriptions
            </h1>
            <p className="mt-2 text-sm opacity-50">Monitor active plans, renewals, and revenue flow</p>
          </div>
          <NavLink
            to="/admin"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </NavLink>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input 
              type="text"
              placeholder="Search by doctor name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:border-gold transition-colors"
              style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
              <Zap className="w-4 h-4" style={{ color: COLORS.gold }} />
              <span className="text-xs font-bold uppercase tracking-widest">Plans: 3 Active</span>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Doctor</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Plan Details</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Validity</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Usage</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm opacity-40 uppercase tracking-widest">Loading Subscriptions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <p className="text-sm opacity-40 uppercase tracking-widest">No subscriptions found</p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" 
                             style={{ backgroundColor: COLORS.goldMuted, color: COLORS.gold }}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-wide">{sub.user?.name || 'Unknown'}</p>
                          <p className="text-[10px] opacity-40 uppercase tracking-wider">{sub.user?.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: sub.plan_name === 'pro' ? COLORS.gold : COLORS.blue }}>
                          {sub.plan_name} Plan
                        </p>
                        <p className="text-[10px] opacity-30 mt-0.5">ID: {sub.id.slice(0,8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] opacity-60">
                          <Calendar className="w-3 h-3" /> Starts: {new Date(sub.start_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] opacity-60">
                          <Clock className="w-3 h-3" /> Ends: {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5 w-32">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="opacity-40">Patients</span>
                          <span>{sub.patients_used}/{sub.patient_limit}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full transition-all" 
                               style={{ 
                                 width: `${Math.min(100, (sub.patients_used / sub.patient_limit) * 100)}%`,
                                 backgroundColor: (sub.patients_used / sub.patient_limit) > 0.9 ? COLORS.red : COLORS.gold
                               }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                           style={{ borderColor: getStatusColor(sub.status), color: getStatusColor(sub.status), backgroundColor: `${getStatusColor(sub.status)}10` }}>
                        {sub.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {sub.status}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer className="py-10 text-center opacity-20 text-[10px] uppercase tracking-[0.3em]">
          EH Arogya Sutra • Billing & Subscription Engine
        </footer>
      </div>
    </div>
  );
}
