'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/DashboardPanels';
import ClinicalSummaryDisplay from '@/components/ClinicalSummaryDisplay';
import { formatTodayDate } from '@/lib/formatDate';
import { loadSmartSearchResult, saveSmartSearchResult } from '@/lib/session/smartSearchStorage';
import { extractClinicalSummary } from '@/lib/summaryCaseData';
import { needsFullClinicalSummary, postClinicalSummary } from '@/lib/api/summary';

export default function CaseSummaryPage() {
  const [caseData, setCaseData] = useState<Record<string, unknown> | null>(null);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');

  async function generateSummary(data: Record<string, unknown>) {
    setLoadingSummary(true);
    setError('');
    try {
      const res = await postClinicalSummary(data);
      const text = res.data?.summary || '';
      if (text.trim()) {
        setSummary(text);
        saveSmartSearchResult({ ...data, clinical_summary: text, summary: text });
      } else {
        setError('Summary is not available yet. Please try again.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate summary.');
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    const data = loadSmartSearchResult();
    if (!data) {
      setError('No active case on file.');
      return;
    }
    setCaseData(data);
    const existing = extractClinicalSummary(data);
    setSummary(existing);
    if (needsFullClinicalSummary(data)) {
      void generateSummary(data);
    }
  }, []);

  async function refreshSummary() {
    if (!caseData) return;
    await generateSummary(caseData);
  }

  const patient = (caseData?.patient || {}) as Record<string, unknown>;
  const eh = (caseData?.eh_analysis || {}) as Record<string, unknown>;
  const polarity = ((eh.polarity as Record<string, unknown>)?.polarity ||
    (caseData?.analysis as Record<string, unknown>)?.polarity ||
    '—') as string;
  const patientName =
    (patient.name as string) ||
    (caseData?.patient_name as string) ||
    'Patient';

  return (
    <>
      <PageHeader
        title={
          <>
            Case Summary · <span>{patientName}</span>
          </>
        }
        subtitle="Polarity assessment, formulas, diet, and clinical guidance."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Case · <span>{patientName}</span>
          </>
        }
        action={
          <Link href="/records" className="btn-secondary">
            ← All Records
          </Link>
        }
      />

      {error && !caseData ? (
        <div className="eh-analyze-status error">
          {error}{' '}
          <Link href="/symptom-search" style={{ color: '#e8c46a' }}>
            Start clinical search
          </Link>
        </div>
      ) : null}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">💬 Clinical Summary</div>
            <button
              type="button"
              className="card-action"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)' }}
              onClick={refreshSummary}
              disabled={loadingSummary || !caseData}
            >
              {loadingSummary ? 'Updating…' : '↻ Refresh'}
            </button>
          </div>
          <div className="card-body">
            {loadingSummary ? (
              <div className="eh-analyze-status loading">Generating clinical summary (9 Rule Engines)…</div>
            ) : null}
            {error && caseData ? <div className="eh-analyze-status error">{error}</div> : null}
            {summary ? (
              <ClinicalSummaryDisplay summary={summary} />
            ) : caseData ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Summary not yet available.{' '}
                <button type="button" className="card-action" onClick={refreshSummary}>
                  Generate
                </button>
              </p>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Assessment</div>
          </div>
          <div className="card-body">
            {caseData ? (
              <div className="advice-box">
                <div className="advice-title">Clinical Profile</div>
                <div className="advice-item">
                  <span className="advice-dot">▶</span>
                  Polarity: {String(polarity)}
                </div>
                <div className="advice-item">
                  <span className="advice-dot">▶</span>
                  Phase: {String(eh.phase || '—')}
                </div>
                <div className="advice-item">
                  <span className="advice-dot">▶</span>
                  Potency: {String((eh.potency as Record<string, unknown>)?.potency || '—')}
                </div>
                <div className="advice-item">
                  <span className="advice-dot">▶</span>
                  Prakriti: {String((eh.prakriti as Record<string, unknown>)?.prakriti || '—')}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Complete a search or report analysis to view details.</p>
            )}
            <div className="rx-actions">
              <Link href="/symptom-search" className="rx-btn rx-modify">
                ✏️ New Search
              </Link>
              <Link href="/reports" className="rx-btn rx-pdf">
                📄 Report Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
