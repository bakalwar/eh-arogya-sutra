'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/DashboardPanels';
import { formatTodayDate } from '@/lib/formatDate';
import {
  analyzeCaseComplete,
  fetchSymptoms,
  searchDiseases,
  type SymptomItem,
} from '@/lib/api/search';
import { clearSmartSearchResult, saveSmartSearchResult } from '@/lib/session/smartSearchStorage';
import { extractClinicalSummary } from '@/lib/summaryCaseData';

function phaseFromDuration(days: number) {
  if (days <= 14) return 'ACUTE';
  if (days <= 60) return 'SUB_ACUTE';
  if (days <= 365) return 'CHRONIC';
  return 'DEGENERATIVE';
}

export default function SymptomSearchPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState('Male');
  const [bpS, setBpS] = useState('120');
  const [bpD, setBpD] = useState('80');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('7');
  const [phase, setPhase] = useState('ACUTE');
  const [allSymptoms, setAllSymptoms] = useState<SymptomItem[]>([]);
  const [suggestions, setSuggestions] = useState<SymptomItem[]>([]);
  const [diseaseHits, setDiseaseHits] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSymptoms()
      .then(setAllSymptoms)
      .catch(() => setAllSymptoms([]));
  }, []);

  const updateSuggestions = useCallback(
    (val: string) => {
      const parts = val.split(/[,،؛;\n]+/).map((s) => s.trim());
      const last = parts[parts.length - 1]?.toLowerCase() || '';
      if (last.length < 2) {
        setSuggestions([]);
        return;
      }
      const hits = allSymptoms
        .filter(
          (s) =>
            s.name.toLowerCase().includes(last) ||
            (s.name_hi || '').toLowerCase().includes(last)
        )
        .slice(0, 8);
      setSuggestions(hits);
    },
    [allSymptoms]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      const parts = symptoms.split(/[,،؛;\n]+/).map((s) => s.trim());
      const last = parts[parts.length - 1] || '';
      if (last.length >= 3) {
        searchDiseases(last, 5)
          .then((rows) =>
            setDiseaseHits(
              rows.map((r) => r.name || r.disease || '').filter(Boolean)
            )
          )
          .catch(() => setDiseaseHits([]));
      } else {
        setDiseaseHits([]);
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [symptoms]);

  function handleSymptomChange(val: string) {
    setSymptoms(val);
    updateSuggestions(val);
    const d = Number(duration) || 7;
    setPhase(phaseFromDuration(d));
  }

  function addSymptom(item: SymptomItem) {
    const parts = symptoms.split(/[,،؛;\n]+/).map((p) => p.trim());
    parts.pop();
    parts.push(item.name);
    setSymptoms(`${parts.join(', ')}, `);
    setSuggestions([]);
  }

  async function handleAnalyze() {
    if (!name.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!symptoms.trim()) {
      setError('Please enter symptoms or chief complaint.');
      return;
    }
    setBusy(true);
    setError('');
    clearSmartSearchResult();

    const form = new FormData();
    form.append('patient_name', name.trim());
    form.append('age', age || '30');
    form.append('gender', gender);
    form.append('bp_systolic', bpS || '120');
    form.append('bp_diastolic', bpD || '80');
    form.append('chief_complaint', symptoms.trim());
    form.append('phase', phase);
    form.append('duration_days', duration);
    form.append('condition', phase.toLowerCase());

    try {
      const res = await analyzeCaseComplete(form);
      const payload = res.data;
      if (!res.success || !payload) {
        setError(res.message || 'Analysis could not be completed.');
        return;
      }

      const summaryText = extractClinicalSummary(payload as Record<string, unknown>);
      saveSmartSearchResult({
        ...payload,
        clinical_summary: summaryText,
        summary: summaryText,
        searchSessionId: Date.now(),
      });
      router.push('/case-summary');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={
          <>
            Symptom <span>Search</span>
          </>
        }
        subtitle="Enter patient details and symptoms for clinical decision support."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Search · <span>Symptoms</span>
          </>
        }
        action={
          <button type="button" className="btn-new" onClick={handleAnalyze} disabled={busy}>
            {busy ? 'Analyzing…' : 'Run Analysis'}
          </button>
        }
      />

      {busy ? (
        <div className="eh-analyze-status loading">Preparing clinical analysis — please wait…</div>
      ) : null}
      {error ? <div className="eh-analyze-status error">{error}</div> : null}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">🩺 Patient Intake</div>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ram Sharma"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  className="form-input"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">BP Systolic</label>
                <input className="form-input" value={bpS} onChange={(e) => setBpS(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">BP Diastolic</label>
                <input className="form-input" value={bpD} onChange={(e) => setBpD(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Duration (days)</label>
              <input
                className="form-input"
                type="number"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setPhase(phaseFromDuration(Number(e.target.value) || 7));
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Symptoms / Chief Complaint *</label>
              <textarea
                className="form-input"
                rows={4}
                value={symptoms}
                onChange={(e) => handleSymptomChange(e.target.value)}
                placeholder="Bukhar, Khansi, Gale Dard..."
                style={{ resize: 'vertical', minHeight: 96 }}
              />
            </div>
            {suggestions.length > 0 && (
              <div className="symptom-tags" style={{ marginTop: 8 }}>
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    className="s-tag"
                    style={{ cursor: 'pointer', border: 'none' }}
                    onClick={() => addSymptom(s)}
                  >
                    {s.name}
                    {s.name_hi ? ` · ${s.name_hi}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🔬 Condition Match</div>
            <Link href="/case-summary" className="card-action">
              Last Case →
            </Link>
          </div>
          <div className="card-body">
            {diseaseHits.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--faint)' }}>
                Suggested conditions appear as you type symptoms.
              </p>
            ) : (
              <div className="symptom-tags">
                {diseaseHits.map((d) => (
                  <span key={d} className="s-tag">
                    {d}
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn-new"
                style={{ width: '100%' }}
                onClick={handleAnalyze}
                disabled={busy}
              >
                {busy ? 'Analyzing…' : 'Generate Prescription'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
