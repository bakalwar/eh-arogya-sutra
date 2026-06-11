import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  UserX,
  ExternalLink
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

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/admin/users');
      if (res.data.success) {
        // Filter only doctors from the users list
        const doctorList = res.data.data.filter(u => u.role === 'doctor' || u.role === 'admin');
        setDoctors(doctorList);
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.mobile.includes(searchQuery);
    if (filter === 'all') return matchesSearch;
    return matchesSearch; // Add status filter logic when implemented in DB
  });

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-8" style={{ borderColor: COLORS.border }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: COLORS.gold }}>
              Management
            </p>
            <h1 className="mt-2 text-3xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <Users className="w-8 h-8" style={{ color: COLORS.gold }} />
              Doctors Directory
            </h1>
            <p className="mt-2 text-sm opacity-50">Manage registered medical professionals and their access</p>
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
              placeholder="Search by name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:border-gold transition-colors"
              style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-gold text-black' : 'hover:bg-white/5'}`}
              style={filter !== 'all' ? { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted } : { backgroundColor: COLORS.gold }}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-green text-white' : 'hover:bg-white/5'}`}
              style={filter !== 'active' ? { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted } : { backgroundColor: COLORS.green }}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-red text-white' : 'hover:bg-white/5'}`}
              style={filter !== 'pending' ? { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted } : { backgroundColor: COLORS.red }}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Doctor Details</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Subscription</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm opacity-40 uppercase tracking-widest">Loading Doctors...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <p className="text-sm opacity-40 uppercase tracking-widest">No doctors found</p>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" 
                             style={{ backgroundColor: COLORS.goldMuted, color: COLORS.gold }}>
                          {doc.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-wide">{doc.name}</p>
                          <p className="text-[10px] opacity-40 uppercase tracking-wider">{doc.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs opacity-60">
                          <Phone className="w-3 h-3" /> {doc.mobile}
                        </div>
                        {doc.email && (
                          <div className="flex items-center gap-2 text-xs opacity-60">
                            <Mail className="w-3 h-3" /> {doc.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                           style={{ borderColor: COLORS.green, color: COLORS.green, backgroundColor: 'rgba(74, 155, 84, 0.1)' }}>
                        <ShieldCheck className="w-3 h-3" /> Active Plan
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="View Profile">
                          <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Suspend Access">
                          <UserX className="w-4 h-4 text-red-500 opacity-40 group-hover:opacity-100" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <MoreVertical className="w-4 h-4 opacity-40" />
                        </button>
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
          EH Arogya Sutra • Secure Admin Environment
        </footer>
      </div>
    </div>
  );
}
