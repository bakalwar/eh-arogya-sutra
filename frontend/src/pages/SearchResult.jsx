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
import { postClinicalSummary } from '../api/postClinicalSummary';
import ClinicalSummaryDisplay from '../components/ClinicalSummaryDisplay';
import EHPrescription_Jagamba from '../components/EHPrescription_Jagamba';
import { getUser } from '../security/tokenManager';
import { loadSmartSearchResult, saveSmartSearchResult } from '../utils/smartSearchStorage';
import {
  extractClinicalSummary,
  normalizeCaseDataForSummary,
  buildClientFallbackSummary,
  normalizeEngineVia,
  formatEngineViaLabel
} from '../utils/summaryCaseData';

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

  function applyEngineResult(pData) {
    setEngineResult(
      pData.engine_result ||
        pData.eh_analysis?.engine_result ||
        (pData.mixtures?.length
          ? {
              mixtures: pData.mixtures,
              diet: pData.eh_analysis?.diet || pData.diet,
              dosage: pData.eh_analysis?.dosage || pData.dosage
            }
          : null)
    );
  }

  const fetchSummary = async (pData) => {
    setLoading(true);
    setErr('');
    setProgressMsg('E.H. Complete Engine — Clinical summary ban rahi hai…');

    const caseData = normalizeCaseDataForSummary(pData);
    const cached = extractClinicalSummary(caseData);
    if (cached?.trim()) {
      setSummary(cached);
      setSummaryVia(normalizeEngineVia(caseData.summary_via || caseData.via));
      setSummarySource(caseData.summary_source || 'EH API — 14k diseases + 9 Rule Engines');
      applyEngineResult(caseData);
      setLoading(false);
      return;
    }

    try {
      // EH API v3 — 14k diseases + 9 Rule Engines (summary_engine.py), not book/Ollama
      const res = await postClinicalSummary(caseData);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Summary generation failed');
      }

      const d = res.data.data || {};
      const text = d.summary || '';
      if (!text.trim()) {
        throw new Error('Empty summary from server');
      }

      setSummary(text);
      setSummarySource(d.source || d.summary_engine || 'AI Engine');
      setSummaryVia(normalizeEngineVia(d.summary_via || d.via));
      if (d.engine_result) setEngineResult(d.engine_result);

      try {
        saveSmartSearchResult({
          ...pData,
          ...caseData,
          clinical_summary: text,
          summary: text,
          summary_source: d.source,
          summary_via: d.summary_via
        });
      } catch {
        /* sessionStorage optional */
      }
    } catch (e) {
      console.error('Summary Gen Error:', e);
      const fallback = buildClientFallbackSummary(caseData);
      setSummary(fallback);
      setSummarySource('client-fallback');
      setSummaryVia('offline');
      setErr(
        'Summary API fail: ' +
          (e.response?.data?.message || e.response?.data?.error || e.message) +
          ' — analyze formulas ऊपर दिख रहे हैं।'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) {
        const localData = loadSmartSearchResult();
        if (localData) {
          const summaryText = extractClinicalSummary(localData);
          setData(localData);
          applyEngineResult(localData);
          if (summaryText?.trim()) {
            setSummary(summaryText);
            setSummaryVia(normalizeEngineVia(localData.summary_via || localData.via));
            setSummarySource(localData.summary_source || 'EH API — 14k diseases + 9 Rule Engines');
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            await fetchSummary(localData);
          }
        } else {
          setErr('No analysis result found. Pehle /search par Analyze Case chalayein.');
          setLoading(false);
        }
        return;
      }

      try {
        const res = await client.get(`/api/prescriptions/${id}`);
        setData(res.data);
        applyEngineResult(res.data);
        const dbSummary = res.data.clinical_summary || extractClinicalSummary(res.data);
        if (dbSummary?.trim()) {
          setSummary(dbSummary);
          setSummaryVia('db');
          setSummarySource('Database');
          setLoading(false);
        } else {
          await fetchSummary(res.data);
        }
      } catch (e) {
        setErr('Result load fail: ' + (e.response?.data?.error || e.message));
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

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
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        <p className="mt-6 animate-pulse text-base font-bold uppercase tracking-widest text-gold md:text-lg">
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
    <div className="w-full font-sans text-white">
      <div className="mx-auto w-full max-w-7xl space-y-8 md:space-y-10">

        {err && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-red-400 text-sm"
               style={{ borderColor: COLORS.red, backgroundColor: 'rgba(231, 76, 60, 0.1)' }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 md:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
            <button type="button" onClick={() => navigate('/search')} className="shrink-0 rounded-full border border-white/10 p-2.5 transition-all hover:bg-white/5 md:p-3">
              <ChevronLeft className="h-5 w-5 text-gold" />
            </button>
            <div className="min-w-0">
              <h1 className="mt-1 flex items-center gap-3 font-serif text-xl font-bold tracking-tight md:text-2xl lg:text-3xl" style={{ fontFamily: 'Cinzel, serif' }}>
                {data?.patient?.name || 'Patient Analysis'}
              </h1>
              <p className="mt-1 text-[10px] uppercase tracking-widest opacity-40 md:text-xs">
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {[
            { label: 'Polarity', value: pol, icon: Activity, color: COLORS.gold },
            { label: 'Phase', value: pickText(expert.phase || data?.analysis?.phase, 'CHRONIC'), icon: Clock, color: COLORS.blue },
            { label: 'Potency', value: potency, icon: Zap, color: COLORS.green },
            { label: 'Electricity', value: electricity, icon: Sparkles, color: COLORS.gold }
          ].map((item, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-4 md:space-y-3 md:rounded-2xl md:p-6" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
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
            Engine: {summarySource} • {formatEngineViaLabel(summaryVia)}
          </p>
        </div>

        {/* Formula preview — visible even before scrolling summary */}
        {mixtures.length > 0 && (
          <div className="p-8 rounded-3xl border space-y-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Prescription Formulas</h2>
            <div className="flex w-full flex-col gap-3">
              {mixtures.map((m, i) => (
                <div key={i} className="w-full rounded-2xl border border-green/20 bg-green/5 px-4 py-3.5 md:px-5 md:py-4">
                  <p className="text-sm leading-relaxed text-white/90 md:text-[15px]">
                    <span className="font-bold text-[#6abf72]">{m.label || `Mixture ${String.fromCharCode(65 + i)}`}</span>
                    {m.system_key || m.system ? (
                      <span className="text-white/75"> — {(m.system_key || m.system).toString()}</span>
                    ) : null}
                    {(m.formula || m.formula_obj?.full) && (
                      <span className="text-white/85"> (Formula: {m.formula || m.formula_obj?.full})</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Document */}
        <div className="w-full overflow-hidden rounded-2xl border shadow-2xl md:rounded-3xl" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-8 md:py-5" style={{ borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Clinical Summary Output</h3>
            <div className="flex items-center gap-2 rounded-full border border-green/20 bg-green/10 px-3 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-green-500">Verified by CDSS</span>
            </div>
          </div>

          <div className="w-full px-3 py-5 sm:px-6 md:px-8 md:py-10 lg:px-10">
            {summary ? (
              <ClinicalSummaryDisplay summary={summary} />
            ) : (
              <div className="py-20 text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm opacity-40 uppercase tracking-widest">Summary could not be generated</p>
                <button onClick={() => data && fetchSummary(data)} className="px-6 py-2 rounded-full border border-gold text-gold text-[10px] font-bold uppercase tracking-widest hover:bg-gold/10 transition-all">
                  Dubara सारांश
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
