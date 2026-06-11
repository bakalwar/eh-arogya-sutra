import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Printer, 
  Download, 
  Save, 
  Plus, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  ArrowLeft,
  Settings,
  Sparkles
} from 'lucide-react';
import client from '../api/client';
import { getUser } from '../security/tokenManager';
import EHPrescription_Jagamba from '../components/EHPrescription_Jagamba';
import { loadSmartSearchResult } from '../utils/smartSearchStorage';

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

export default function Prescription() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [showPreview, setShowPrescription] = useState(false);

  useEffect(() => {
    const cached = loadSmartSearchResult();
    if (cached) {
      setData(cached);
      setShowPrescription(true);
    }
  }, []);

  const handleDownloadPdf = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await client.post('/api/prescriptions/pdf', {
        patientName: data?.patient?.name || 'Patient',
        clinical_summary: data?.clinical_summary || data?.summary || '',
        items: data?.mixtures?.map(m => m.formula) || []
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `EH-Prescription-${data?.patient?.name || 'Patient'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMsg('PDF downloaded successfully');
    } catch (e) {
      setErr('PDF download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-6 border-b pb-8" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-full border transition-all hover:bg-white/5"
              style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: COLORS.gold }}>
                Prescription System
              </p>
              <h1 className="mt-1 text-2xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
                <FileText className="w-7 h-7 text-gold" />
                EH Prescription
              </h1>
              <p className="text-xs opacity-40 uppercase tracking-widest mt-1">
                Zero Hardcoded Medicines • Count Mattei Principles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadPdf}
              disabled={busy || !data}
              className="px-6 py-2.5 rounded-full border border-gold text-gold text-[10px] font-bold uppercase tracking-widest hover:bg-gold/10 transition-all flex items-center gap-2 disabled:opacity-30"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </header>

        {!data ? (
          <div className="py-20 text-center space-y-6 rounded-3xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <Zap className="w-12 h-12 mx-auto opacity-20 text-gold" />
            <div className="space-y-2">
              <h2 className="text-xl font-serif font-bold" style={{ fontFamily: 'Cinzel, serif' }}>No Active Case Found</h2>
              <p className="text-sm opacity-40 max-w-xs mx-auto">Please run a clinical analysis from the Search Engine first to generate a prescription.</p>
            </div>
            <button 
              onClick={() => navigate('/search')}
              className="px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-2xl"
              style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}
            >
              Start New Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Clinical Summary Mini-Card */}
            <div className="p-8 rounded-3xl border space-y-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Case Summary
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Engine Verified</span>
              </div>
              <p className="text-sm leading-relaxed opacity-70 line-clamp-3 italic">
                {data.clinical_summary || data.summary}
              </p>
              <button 
                onClick={() => navigate('/search/result')}
                className="text-[10px] font-bold uppercase tracking-widest text-gold hover:underline flex items-center gap-1"
              >
                View Full Analysis <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Jagamba Prescription Sheet */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
              <EHPrescription_Jagamba 
                doctor={{
                  doctor_name: user?.name || "Expert Doctor",
                  clinic_name: user?.clinic_name || "Jagamba Health Clinic",
                  mobile: user?.mobile || "9098791989",
                  clinic_city: user?.address_city || "Seoni",
                  clinic_state: user?.address_state || "M.P."
                }}
                patient={{
                  patient_name: data.patient?.name || data.name || "Patient",
                  age: data.patient?.age || data.age || "",
                  gender: data.patient?.gender || data.gender || "Male",
                  bp_systolic: data.patient?.bp_systolic || "120",
                  bp_diastolic: data.patient?.bp_diastolic || "80",
                  phase: data.patient?.condition || 'chronic',
                  polarity: data.clinical_analysis?.polarity || 'POSITIVE',
                  disease: data.chief_complaint || 'General Condition',
                  active_systems: data.clinical_analysis?.active_systems || [],
                  dosage: data.clinical_analysis?.dosage
                }}
                engineResult={data}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 py-10 border-t text-center opacity-20 text-[10px] uppercase tracking-[0.3em]" style={{ borderColor: COLORS.border }}>
          EH Arogya Sutra • Clinical Intelligence Engine • 2026
        </footer>
      </div>
    </div>
  );
}
