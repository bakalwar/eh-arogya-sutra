import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Pill, 
  Search, 
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Filter,
  MoreVertical,
  Activity,
  Zap,
  Info
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

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  const groups = ['All', 'Scrofoloso', 'Canceroso', 'Angiotico', 'Linfatico', 'Febrifugo', 'Vermifugo', 'Electricity'];

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/medicines');
      if (res.data.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (med.indications || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = activeGroup === 'All' || (med.medicineGroup || '').includes(activeGroup);
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-8" style={{ borderColor: COLORS.border }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: COLORS.gold }}>
              Clinical Library
            </p>
            <h1 className="mt-2 text-3xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <Pill className="w-8 h-8" style={{ color: COLORS.gold }} />
              Medicines Catalog
            </h1>
            <p className="mt-2 text-sm opacity-50">Manage the authentic Electro-Homeopathy medicine database</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}>
              <Plus className="w-4 h-4" /> Add Medicine
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

        {/* Groups Filter */}
        <div className="flex flex-wrap items-center gap-2 pb-2 overflow-x-auto no-scrollbar">
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeGroup === group ? 'bg-gold text-black' : 'hover:bg-white/5'}`}
              style={activeGroup !== group ? { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted } : { backgroundColor: COLORS.gold }}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text"
            placeholder="Search by name or indications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:border-gold transition-colors"
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
          />
        </div>

        {/* Medicines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm opacity-40 uppercase tracking-widest">Loading Library...</p>
              </div>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-sm opacity-40 uppercase tracking-widest">No medicines found</p>
            </div>
          ) : (
            filteredMedicines.map((med) => (
              <div key={med.id} className="group p-6 rounded-2xl border transition-all hover:border-gold/30" 
                   style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gold/5" style={{ backgroundColor: 'rgba(201, 150, 58, 0.05)' }}>
                    <Activity className="w-5 h-5" style={{ color: COLORS.gold }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <Edit2 className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500 opacity-30 group-hover:opacity-100" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-bold tracking-wide">{med.name}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{med.medicineGroup || 'General'} • {med.system}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Indications
                    </p>
                    <p className="text-xs opacity-60 leading-relaxed line-clamp-3">{med.indications || 'No clinical indications listed.'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                      <Info className="w-3 h-3 opacity-30" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dilution: {med.dilution || '1:9'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="py-10 text-center opacity-20 text-[10px] uppercase tracking-[0.3em]">
          EH Arogya Sutra • Clinical Knowledge Base
        </footer>
      </div>
    </div>
  );
}
