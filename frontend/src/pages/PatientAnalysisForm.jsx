import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Fuse from 'fuse.js';
import { 
  User, 
  Phone, 
  Activity, 
  Stethoscope, 
  Droplets, 
  Clock, 
  Upload, 
  Trash2, 
  Plus, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Heart,
  AlertCircle,
  FileText
} from 'lucide-react';
import client from '../api/client';
import { clearSmartSearchResult, saveSmartSearchResult } from '../utils/smartSearchStorage';

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

const ORGAN_LIST = [
  { key: 'heart', label: 'Heart', icon: Heart },
  { key: 'kidney', label: 'Kidney', icon: Droplets },
  { key: 'liver', label: 'Liver', icon: Activity },
  { key: 'joints', label: 'Joints', icon: Activity },
  { key: 'digestive', label: 'Digestive', icon: Activity },
  { key: 'nervous', label: 'Nervous', icon: Zap },
  { key: 'lung', label: 'Lungs', icon: Activity },
  { key: 'skin', label: 'Skin', icon: Activity },
  { key: 'endocrine', label: 'Endocrine', icon: Activity },
  { key: 'urinary', label: 'Urinary', icon: Droplets }
];

function phaseFromDuration(days) {
  const d = Number(days) || 0;
  if (d <= 14) return 'ACUTE';
  if (d <= 60) return 'SUB_ACUTE';
  if (d <= 365) return 'CHRONIC';
  return 'DEGENERATIVE';
}

export default function PatientAnalysisForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bpS, setBpS] = useState('');
  const [bpD, setBpD] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('7');
  const [phase, setPhase] = useState('ACUTE');
  const [temperament, setTemperament] = useState('');
  const [organs, setOrgans] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // Fuse.js for fuzzy search
  const fuse = useMemo(() => new Fuse(allSymptoms, {
    keys: ['name', 'name_hi'],
    threshold: 0.3
  }), [allSymptoms]);

  useEffect(() => {
    // Fetch symptoms for autocomplete
    client.get('/api/search/symptoms')
      .then(({ data: res }) => {
        if (res?.success) setAllSymptoms(res.data);
      })
      .catch((e) => console.warn('Symptoms fetch failed:', e.message));

    const st = location.state;
    if (st?.patient) {
      setName(st.patient.name || '');
      setAge(st.patient.age || '');
      setGender(st.patient.gender || 'Male');
      setMobile(st.patient.mobile || '');
    }
    if (st?.draft) {
      const d = st.draft;
      if (d.symptoms) {
        const syms = Array.isArray(d.symptoms) 
          ? d.symptoms.map(s => typeof s === 'string' ? s : s.name).join(', ')
          : d.symptoms;
        setSymptoms(syms);
      }
      if (d.durationDays) {
        setDuration(String(d.durationDays));
        setPhase(phaseFromDuration(d.durationDays));
      }
    }
  }, [location.state]);

  const handleSymptomChange = (val) => {
    setSymptoms(val);
    const parts = val.split(/[,،؛;\n]+/).map((s) => s.trim());
    const last = parts[parts.length - 1];
    if (last.length >= 2) {
      const results = fuse.search(last);
      setFilteredSuggestions(results.map(r => r.item).slice(0, 8));
    } else {
      setFilteredSuggestions([]);
    }
  };

  const addSymptom = (s) => {
    const parts = symptoms.split(/[,،؛;\n]+/).map((p) => p.trim());
    parts.pop();
    parts.push(s.name);
    setSymptoms(parts.join(', ') + ', ');
    setFilteredSuggestions([]);
  };

  const toggleOrgan = (key) => {
    setOrgans((prev) => (prev.includes(key) ? prev.filter((o) => o !== key) : [...prev, key]));
  };

  async function handleSubmit() {
    if (!name.trim()) {
      setErr('Patient name is required.');
      return;
    }
    if (!symptoms.trim()) {
      setErr('Symptoms / chief complaint likhna zaroori hai.');
      return;
    }
    setBusy(true);
    setErr('');
    clearSmartSearchResult();

    const formData = new FormData();
    formData.append('patient_name', name);
    formData.append('age', age || '30');
    formData.append('gender', gender);
    formData.append('bp_systolic', bpS || '120');
    formData.append('bp_diastolic', bpD || '80');
    formData.append('chief_complaint', symptoms.trim());
    formData.append('phase', phase);
    formData.append('duration_days', duration);
    formData.append('condition', phase.toLowerCase());

    if (selectedFiles.length > 0) {
      formData.append('report_file', selectedFiles[0]);
    }

    try {
      const res = await client.post('/api/search/analyze-complete', formData, {
        timeout: 300000
      });

      const payload = res.data?.data;
      if (!res.data?.success || !payload) {
        setErr(res.data?.message || 'Analysis failed — koi data nahi aaya.');
        return;
      }

      const summaryText =
        payload.clinical_summary ||
        payload.summary ||
        payload.eh_analysis?.clinical_summary ||
        payload.eh_analysis?.parcha ||
        '';

      try {
        saveSmartSearchResult({
          ...payload,
          clinical_summary: summaryText,
          summary: summaryText,
          patientId: location.state?.patient?.id || null,
          searchSessionId: Date.now()
        });
      } catch (storageErr) {
        console.warn('sessionStorage save failed:', storageErr);
      }

      navigate('/search/result', { replace: true, state: { fromAnalyze: true } });
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Analysis engine error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b pb-8" style={{ borderColor: COLORS.border }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: COLORS.gold }}>
              Clinical Intake
            </p>
            <h1 className="mt-2 text-3xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <Stethoscope className="w-8 h-8" style={{ color: COLORS.gold }} />
              Patient Analysis
            </h1>
            <p className="mt-2 text-sm opacity-50">Enter vitals and symptoms for EH diagnostic support</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Form Fields */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Section 1: Identity */}
            <div className="space-y-6 p-8 rounded-3xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                <User className="w-4 h-4" /> Identity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ram Sharma"
                    className="w-full bg-black/20 border rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mobile Number</label>
                  <input 
                    type="tel" 
                    value={mobile} 
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-black/20 border rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Age</label>
                  <input 
                    type="number" 
                    value={age} 
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="35"
                    className="w-full bg-black/20 border rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-black/20 border rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors appearance-none"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Vitals */}
            <div className="space-y-6 p-8 rounded-3xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Vitals
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">BP Systolic</label>
                  <input 
                    type="number" 
                    value={bpS} 
                    onChange={(e) => setBpS(e.target.value)}
                    placeholder="120"
                    className="w-full bg-black/20 border rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-center"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">BP Diastolic</label>
                  <input 
                    type="number" 
                    value={bpD} 
                    onChange={(e) => setBpD(e.target.value)}
                    placeholder="80"
                    className="w-full bg-black/20 border rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-center"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Duration (Days)</label>
                  <input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => { setDuration(e.target.value); setPhase(phaseFromDuration(e.target.value)); }}
                    className="w-full bg-black/20 border rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-center"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/5 border border-gold/10">
                <Clock className="w-3 h-3 text-gold" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Detected Phase: {phase}</span>
              </div>
            </div>

            {/* Section 3: Symptoms */}
            <div className="space-y-6 p-8 rounded-3xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Symptoms & Complaints
              </h2>
              <div className="space-y-4">
                <textarea 
                  value={symptoms}
                  onChange={(e) => handleSymptomChange(e.target.value)}
                  placeholder="Enter symptoms separated by commas..."
                  className="w-full h-32 bg-black/20 border rounded-2xl p-5 focus:outline-none focus:border-gold transition-colors resize-none"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                />
                
                {filteredSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-black/40 border border-white/5">
                    {filteredSuggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => addSymptom(s)}
                        className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right: Affected Organs & Upload */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Affected Organs */}
            <div className="p-8 rounded-3xl border space-y-6" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Affected Systems
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {ORGAN_LIST.map((org) => (
                  <button
                    key={org.key}
                    onClick={() => toggleOrgan(org.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all ${
                      organs.includes(org.key) 
                        ? 'bg-green text-white border-green shadow-[0_0_15px_rgba(74,155,84,0.3)]' 
                        : 'bg-black/20 border-white/5 opacity-40 hover:opacity-100'
                    }`}
                  >
                    <org.icon className="w-3 h-3" />
                    {org.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Upload */}
            <div className="p-8 rounded-3xl border space-y-6" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Medical Reports
              </h2>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-white/[0.02] transition-all"
                     style={{ borderColor: COLORS.border }}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileText className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Upload Files</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])}
                />
              </label>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                      <span className="text-[10px] font-mono truncate max-w-[150px] opacity-60">{f.name}</span>
                      <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-3 h-3 text-red-500 opacity-40 hover:opacity-100" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full py-5 rounded-full font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
              style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Analyzing Engine...
                </>
              ) : (
                <>
                  Analyze Case <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {err && (
              <div className="p-4 rounded-2xl border flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-wider"
                   style={{ borderColor: COLORS.red, backgroundColor: 'rgba(231, 76, 60, 0.1)' }}>
                <AlertCircle className="w-4 h-4" /> {err}
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 py-10 border-t text-center opacity-20 text-[10px] uppercase tracking-[0.3em]" style={{ borderColor: COLORS.border }}>
          EH Arogya Sutra • Clinical Intelligence Engine • 2026
        </footer>
      </div>
    </div>
  );
}
