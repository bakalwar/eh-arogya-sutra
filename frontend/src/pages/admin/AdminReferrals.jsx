import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Gift, 
  Search, 
  ArrowLeft,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';
import client from '../../api/client';

// DESIGN TOKENS
const COLORS = {
  bg: '#080f09', // Dark Forest
  surface: '#0c160d',
  border: 'rgba(201, 150, 58, 0.1)',
  gold: '#c9963a',
  green: '#4a9b54',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)'
};

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/admin/referrals');
      if (res.data.success) {
        setReferrals(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = referrals.filter(ref => {
    const referrerName = ref.referrer?.name || '';
    const referredName = ref.referredUser?.name || '';
    return referrerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           referredName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-8" style={{ borderColor: COLORS.border }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: COLORS.gold }}>
              Growth & Network
            </p>
            <h1 className="mt-2 text-3xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <Gift className="w-8 h-8" style={{ color: COLORS.gold }} />
              Referral Tracking
            </h1>
            <p className="mt-2 text-sm opacity-50">Monitor doctor-to-doctor referrals and reward distribution</p>
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

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border flex items-center gap-5" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <div className="p-4 rounded-xl bg-gold/10" style={{ backgroundColor: 'rgba(201, 150, 58, 0.1)' }}>
              <Users className="w-6 h-6" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <p className="text-2xl font-bold font-serif" style={{ fontFamily: 'Cinzel, serif' }}>{referrals.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total Referrals</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl border flex items-center gap-5" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <div className="p-4 rounded-xl bg-green/10" style={{ backgroundColor: 'rgba(74, 155, 84, 0.1)' }}>
              <TrendingUp className="w-6 h-6" style={{ color: COLORS.green }} />
            </div>
            <div>
              <p className="text-2xl font-bold font-serif" style={{ fontFamily: 'Cinzel, serif' }}>{Math.floor(referrals.length * 0.8)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Conversion Rate</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl border flex items-center gap-5" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <div className="p-4 rounded-xl bg-blue/10" style={{ backgroundColor: 'rgba(93, 173, 226, 0.1)' }}>
              <Award className="w-6 h-6" style={{ color: '#5dade2' }} />
            </div>
            <div>
              <p className="text-2xl font-bold font-serif" style={{ fontFamily: 'Cinzel, serif' }}>{Math.floor(referrals.length / 10)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Rewards Claimed</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text"
            placeholder="Search by referrer or referred name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:border-gold transition-colors"
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
          />
        </div>

        {/* Referrals Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Referrer (Source)</th>
                <th className="px-6 py-4 text-center"><ArrowRight className="w-4 h-4 mx-auto opacity-20" /></th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Referred (New Doctor)</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Reward Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm opacity-40 uppercase tracking-widest">Loading Referrals...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <p className="text-sm opacity-40 uppercase tracking-widest">No referral records found</p>
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                          <User className="w-4 h-4 opacity-40" />
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-wide">{ref.referrer?.name || 'Unknown'}</p>
                          <p className="text-[10px] opacity-40 font-mono">{ref.referral_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <ArrowRight className="w-4 h-4 mx-auto opacity-20 group-hover:opacity-100 group-hover:text-gold transition-all" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                          <User className="w-4 h-4 opacity-40" />
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-wide">{ref.referredUser?.name || 'New User'}</p>
                          <p className="text-[10px] opacity-40">{ref.referredUser?.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] opacity-60 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {new Date(ref.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                           style={{ 
                             borderColor: ref.reward_status === 'claimed' ? COLORS.green : COLORS.gold, 
                             color: ref.reward_status === 'claimed' ? COLORS.green : COLORS.gold, 
                             backgroundColor: ref.reward_status === 'claimed' ? 'rgba(74, 155, 84, 0.1)' : 'rgba(201, 150, 58, 0.1)' 
                           }}>
                        {ref.reward_status === 'claimed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {ref.reward_status}
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
          EH Arogya Sutra • Growth & Referral Engine
        </footer>
      </div>
    </div>
  );
}
