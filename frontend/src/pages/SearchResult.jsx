import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { 
  User, 
  Sparkles, 
  Activity, 
  Clock, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  Printer,
  FileDown,
  Save,
  ChevronLeft
} from 'lucide-react';
import client from '../api/client';
import ClinicalSummaryDisplay from '../components/ClinicalSummaryDisplay';
import EHPrescription_Jagamba from '../components/EHPrescription_Jagamba';
import { getUser } from '../security/tokenManager';
import { loadSmartSearchResult } from '../utils/smartSearchStorage';

// DESIGN TOKENS
const COLORS = {
  bg: '#080f09', // Dark Forest
  surface: '#0c160d',
  border: 'rgba(201, 150, 58, 0.1)',
  gold: '#c9963a',
  green: '#4a9b54',
  blue: '#2980b9',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)'
};

function pickText(val, fallback = '—') {
  if (val == null || val === '') return fallback;
  if (typeof val === 'object') {
    return val.polarity || val.potency || val.prakriti || val.elec || fallback;
  }
  return String(val);
}

export default function SearchResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [summary, setSummary] = useState('');
  const [summarySource, setSummarySource] = useState('');
  const [summaryVia, setSummaryVia] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [engineResult, setEngineResult] = useState(null);
  const [showPrescription, setShowPrescription] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) {
        const localData = loadSmartSearchResult();
        if (localData) {
          const summaryText =
            localData.clinical_summary ||
            localData.summary ||
            localData.eh_analysis?.clinical_summary ||
            localData.eh_analysis?.parcha ||
            '';
          setData(localData);
          setSummary(summaryText);
          setSummaryVia(localData.summary_via || localData.via || 'fastapi');
          setSummarySource(localData.summary_source || 'EH API — 9 Rule Engines');
          setEngineResult(
            localData.engine_result ||
              (localData.mixtures?.length
                ? {
                    mixtures: localData.mixtures,
                    diet: localData.eh_analysis?.diet || localData.diet,
                    dosage: localData.eh_analysis?.dosage || localData.dosage
                  }
                : null)
          );
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setErr('No analysis result found. Pehle /search par Analyze Case chalayein.');
          setLoading(false);
        }
        return;
      }

      try {
        const res = await client.get(`/api/prescriptions/${id}`);
        setData(res.data);
        if (res.data.clinical_summary) {
          setSummary(res.data.clinical_summary);
          setSummaryVia('db');
          setSummarySource('Database');
          setLoading(false);
        } else {
          fetchSummary(res.data);
        }
      } catch (e) {
        setErr('Result load fail: ' + (e.response?.data?.error || e.message));
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  const fetchSummary = async (pData) => {
    setLoading(true);
    setErr('');
    setProgressMsg('E.H. Complete Engine — Analyzing symptoms & reports…');
    
    try {
      const res = await client.post('/api/summary/generate', {
        id: pData._id,
        patientName: pData.patient?.name || pData.name || 'Patient',
        symptoms: pData.chief_complaint || '',
        reports: pData.reports || [],
        eh_analysis: pData.eh_analysis
      });

      setSummary(res.data.summary);
      setSummarySource(res.data.source || 'AI Engine');
      setSummaryVia(res.data.via || 'fastapi');
      setEngineResult(res.data.engine_result || null);
    } catch (e) {
      console.error('Summary Gen Error:', e);
      setErr('Summary gen fail: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const savePrescription = async () => {
    if (!summary) return;
    setSaving(true);
    try {
      await client.put(`/api/prescriptions/${id}`, {
        clinical_summary: summary,
        engine_result: engineResult
      });
      setSaveMsg('✅ Clinical report saved to database.');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      alert('Save fail: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !summary && !err) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center" style={{ backgroundColor: COLORS.bg }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
        <p className="mt-6 text-lg font-bold text-gold uppercase tracking-widest animate-pulse">
          {progressMsg || '9 Rule Engines — Clinical summary ban rahi hai…'}
        </p>
      </div>
    );
  }

  const pol = pickText(data?.analysis?.polarity || data?.eh_analysis?.polarity, 'MIXED');
  const expert = data?.eh_analysis || data?.analysis || {};
  const potency = pickText(data?.analysis?.dilution || expert.potency || data?.potency, 'D10');
  const electricity = pickText(data?.analysis?.electricity || expert.electricity, 'BE');
  const conf = data?.expert?.confidence || expert.confidence || 95;
  const mixtures = data?.mixtures || expert.mixtures || [];

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-5xl mx-auto space-y-10">

        {err && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-red-400 text-sm"
               style={{ borderColor: COLORS.red, backgroundColor: 'rgba(231, 76, 60, 0.1)' }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/search')} className="p-3 rounded-full border border-white/10 hover:bg-white/5 transition-all">
              <ChevronLeft className="w-5 h-5 text-gold" />
            </button>
            <div>
              <h1 className="mt-1 text-2xl font-serif font-bold tracking-tight flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
                {data?.patient?.name || 'Patient Analysis'}
              </h1>
              <p className="text-xs opacity-40 uppercase tracking-widest mt-1">
                {data?.patient?.age} Yrs • {data?.patient?.gender} • {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-gold/5 border border-gold/20 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">9 Rule Engines Active</span>
            </div>
          </div>
        </header>

        {/* Clinical Markers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Polarity', value: pol, icon: Activity, color: COLORS.gold },
            { label: 'Phase', value: pickText(expert.phase || data?.analysis?.phase, 'CHRONIC'), icon: Clock, color: COLORS.blue },
            { label: 'Potency', value: potency, icon: Zap, color: COLORS.green },
            { label: 'Electricity', value: electricity, icon: Sparkles, color: COLORS.gold }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl border space-y-3" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{item.label}</p>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <p className="text-xl font-serif font-bold tracking-wide" style={{ fontFamily: 'Cinzel, serif' }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Confidence Bar */}
        <div className="p-8 rounded-3xl border space-y-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Analysis Confidence
            </h2>
            <span className="text-xs font-bold text-gold">{conf}%</span>
          </div>
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold to-green transition-all duration-1000" style={{ width: `${conf}%` }} />
          </div>
          <p className="text-[10px] opacity-30 italic">
            Engine: {summarySource} • {summaryVia === 'fastapi' ? 'Real-time 9 Rule Engine Logic' : 'AI-Enhanced Clinical Summary'}
          </p>
        </div>

        {/* Formula preview — visible even before scrolling summary */}
        {mixtures.length > 0 && (
          <div className="p-8 rounded-3xl border space-y-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Prescription Formulas</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {mixtures.map((m, i) => (
                <div key={i} className="p-4 rounded-xl border border-green/20 bg-green/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2">{m.label || `Mixture ${String.fromCharCode(65 + i)}`}</p>
                  <p className="text-sm font-mono text-green-400">{m.formula || m.formula_obj?.full || '—'}</p>
                  <p className="text-[10px] opacity-40 mt-2 uppercase">{m.system_key || m.system || ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Document */}
        <div className="rounded-3xl border overflow-hidden shadow-2xl" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <div className="px-8 py-5 border-b flex items-center justify-between" style={{ borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Clinical Summary Output</h3>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green/10 border border-green/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-green-500">Verified by CDSS</span>
            </div>
          </div>
          
          <div className="p-8 md:p-12">
            {summary ? (
              <div className="prose prose-invert max-w-none">
                <ClinicalSummaryDisplay summary={summary} />
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm opacity-40 uppercase tracking-widest">Summary could not be generated</p>
                <button onClick={() => data && fetchSummary(data)} className="px-6 py-2 rounded-full border border-gold text-gold text-[10px] font-bold uppercase tracking-widest hover:bg-gold/10 transition-all">
                  Retry Analysis
                </button>
              </div>
            )}
          </div>

          {summary && (
            <div className="px-8 py-4 border-t flex items-center gap-3" style={{ borderColor: COLORS.border, backgroundColor: 'rgba(201, 150, 58, 0.05)' }}>
              <Sparkles className="w-4 h-4 text-gold" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold/70">
                The summary above is dynamically generated based on Count Mattei's 9 principles.
              </p>
            </div>
          )}
        </div>

        {/* Prescription Preview (Jagamba Style) */}
        {engineResult && showPrescription && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Prescription Preview
              </h2>
              <button onClick={() => setShowPrescription(false)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline">
                Close Preview
              </button>
            </div>
            <div className="rounded-3xl border p-4 shadow-2xl bg-white" style={{ borderColor: COLORS.border }}>
              <div className="max-h-[1000px] overflow-y-auto rounded-2xl">
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
                    polarity: pol || 'POSITIVE',
                    disease: data.chief_complaint || 'General Condition',
                    active_systems: data.eh_analysis?.active_systems || [],
                    dosage: data.eh_analysis?.dosage
                  }}
                  engineResult={engineResult}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-10 border-t" style={{ borderColor: COLORS.border }}>
          {engineResult && !showPrescription && (
            <button
              onClick={() => setShowPrescription(true)}
              className="px-10 py-4 rounded-full font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-2xl"
              style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}
            >
              <Sparkles className="w-5 h-5" /> Generate Prescription
            </button>
          )}
          
          <button
            disabled={saving || !summary}
            onClick={savePrescription}
            className="px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-white/5 disabled:opacity-30"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save to DB'}
          </button>

          <button
            onClick={() => window.print()}
            className="px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-white/5"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>

          <button
            className="px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-white/5"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
          >
            <FileDown className="w-4 h-4" /> Download PDF
          </button>
        </div>

        {saveMsg && (
          <div className="text-center animate-bounce">
            <p className="text-xs font-bold uppercase tracking-widest text-green-500">{saveMsg}</p>
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
