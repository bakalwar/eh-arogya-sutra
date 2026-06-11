import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  DollarSign, 
  Search, 
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  CreditCard
} from 'lucide-react';
import client from '../../api/client';

// DESIGN TOKENS
const COLORS = {
  bg: '#080f09', // Dark Forest
  surface: '#0c160d',
  border: 'rgba(201, 150, 58, 0.1)',
  gold: '#c9963a',
  green: '#4a9b54',
  red: '#e74c3c',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)'
};

export default function AdminRevenue() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/admin/payments');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(pay => {
    const name = pay.user?.name || '';
    const mobile = pay.user?.mobile || '';
    const txId = pay.transaction_id || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           mobile.includes(searchQuery) ||
           txId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-8" style={{ borderColor: COLORS.border }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: COLORS.gold }}>
              Financial Control
            </p>
            <h1 className="mt-2 text-3xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <DollarSign className="w-8 h-8" style={{ color: COLORS.gold }} />
              Revenue & Payments
            </h1>
            <p className="mt-2 text-sm opacity-50">Track all incoming transactions and financial history</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
                    style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <NavLink
              to="/admin"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </NavLink>
          </div>
        </header>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Total Revenue</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-bold" style={{ fontFamily: 'Cinzel, serif', color: COLORS.gold }}>₹{totalRevenue.toLocaleString()}</span>
              <span className="text-xs opacity-30 font-bold uppercase tracking-widest">INR</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest">
              <TrendingUp className="w-3 h-3" /> 12% Growth this month
            </div>
          </div>
          <div className="p-8 rounded-3xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Successful Payments</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{payments.filter(p => p.status === 'completed').length}</span>
              <span className="text-xs opacity-30 font-bold uppercase tracking-widest">Transactions</span>
            </div>
          </div>
          <div className="p-8 rounded-3xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Pending / Failed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-bold" style={{ fontFamily: 'Cinzel, serif', color: COLORS.red }}>{payments.filter(p => p.status !== 'completed').length}</span>
              <span className="text-xs opacity-30 font-bold uppercase tracking-widest">Issues</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text"
            placeholder="Search by name, mobile or Transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:border-gold transition-colors"
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
          />
        </div>

        {/* Payments Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Doctor / Payer</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Method & ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm opacity-40 uppercase tracking-widest">Loading Transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <p className="text-sm opacity-40 uppercase tracking-widest">No payment records found</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                          <User className="w-4 h-4 opacity-40" />
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-wide">{pay.user?.name || 'Unknown'}</p>
                          <p className="text-[10px] opacity-40">{pay.user?.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold tracking-wide" style={{ color: COLORS.gold }}>₹{parseFloat(pay.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                          <CreditCard className="w-3 h-3" /> {pay.payment_method || 'UPI'}
                        </div>
                        <p className="text-[10px] opacity-30 font-mono">{pay.transaction_id || pay.id.slice(0,12)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] opacity-60 font-bold uppercase tracking-widest">
                        <Calendar className="w-3 h-3" /> {new Date(pay.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                           style={{ 
                             borderColor: pay.status === 'completed' ? COLORS.green : pay.status === 'failed' ? COLORS.red : COLORS.gold, 
                             color: pay.status === 'completed' ? COLORS.green : pay.status === 'failed' ? COLORS.red : COLORS.gold, 
                             backgroundColor: pay.status === 'completed' ? 'rgba(74, 155, 84, 0.1)' : pay.status === 'failed' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(201, 150, 58, 0.1)' 
                           }}>
                        {pay.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : pay.status === 'failed' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {pay.status}
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
          EH Arogya Sutra • Financial Ledger Engine
        </footer>
      </div>
    </div>
  );
}
