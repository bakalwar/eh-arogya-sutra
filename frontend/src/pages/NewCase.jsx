import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Fuse from 'fuse.js';
import { EH_SYMPTOMS } from '../data/ehSymptoms';

export default function NewCase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const patient = state?.patient;

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [reportTrend, setReportTrend] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [reportName, setReportName] = useState('');
  const [photoName, setPhotoName] = useState('');

  const fuse = useMemo(
    () => new Fuse(EH_SYMPTOMS, { keys: ['name', 'keywords'], threshold: 0.38, ignoreLocation: true }),
    []
  );
  const picks = useMemo(() => {
    const s = q.trim();
    if (!s) return [];
    return fuse.search(s).slice(0, 10).map((r) => r.item);
  }, [fuse, q]);

  function addSymptom(name) {
    if (rows.some((r) => r.name === name)) return;
    setRows((prev) => [...prev, { name, severity: 6 }]);
    setQ('');
  }

  function setSeverity(i, v) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, severity: Number(v) } : r)));
  }

  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function goToSmartSearch() {
    if (!rows.length) return;
    navigate('/search', {
      state: {
        fromCase: true,
        patient,
        draft: {
          symptoms: rows.map((r) => ({ name: r.name, severity: r.severity, keywords: '' })),
          durationDays: Number(durationDays) || 0,
          reportTrend: reportTrend === 'high' || reportTrend === 'low' ? reportTrend : null,
          clinicalNotes,
          reportFileName: reportName || null,
          photoFileName: photoName || null
        }
      }
    });
  }

  const DEMO_PATIENT = { id: 'demo-local', name: 'Ram Sharma (Demo)', mobile: '9876500001' };

  if (!patient) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <p className="text-white/70">{t('case.needPatient')}</p>
        <div className="flex flex-col items-center gap-3">
          <Link to="/patient/register" className="inline-block rounded-xl bg-eh-gold px-5 py-2 text-sm font-semibold text-eh-bg">
            {t('patientReg.title')}
          </Link>
          <button
            type="button"
            className="rounded-xl border border-eh-gold/40 px-5 py-2 text-sm font-semibold text-eh-gold2"
            onClick={() => navigate('/case/new', { state: { patient: DEMO_PATIENT }, replace: true })}
          >
            Demo case (no register) → Smart Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-eh-gold/80">{t('case.badge')}</p>
          <h1 className="font-display text-2xl font-semibold text-white">{t('case.title')}</h1>
          <p className="mt-1 text-sm text-white/45">
            {patient.name} · {patient.mobile || '—'}
          </p>
        </div>
        <Link to="/patient" className="text-xs text-eh-gold/70 underline">
          {t('case.backHub')}
        </Link>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-eh-card/90 p-6 shadow-xl">
        <h2 className="font-display text-sm font-semibold text-eh-gold2">{t('case.symptoms')}</h2>
        <div className="relative mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('case.symptomPh')}
            className="w-full rounded-xl border border-eh-gold/25 bg-black/30 px-4 py-3 text-white outline-none ring-eh-gold/20 focus:ring-2"
          />
          {picks.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-eh-bg py-1 shadow-2xl">
              {picks.map((p) => (
                <li key={p.name}>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-white/85 hover:bg-white/[0.06]"
                    onClick={() => addSymptom(p.name)}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {rows.map((r, i) => (
            <div key={r.name} className="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium text-white">{r.name}</div>
              <div className="flex flex-1 flex-col gap-1 sm:max-w-xs">
                <label className="text-[10px] uppercase tracking-wider text-white/35">{t('case.severity')}</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={r.severity}
                  onChange={(e) => setSeverity(i, e.target.value)}
                  className="w-full accent-eh-mint"
                />
                <div className="text-xs text-eh-gold2">{r.severity}/10</div>
              </div>
              <button type="button" onClick={() => removeRow(i)} className="text-xs text-red-400 underline">
                {t('case.remove')}
              </button>
            </div>
          ))}
          {!rows.length ? <p className="text-sm text-white/35">{t('case.noSymptoms')}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/[0.08] bg-eh-card/90 p-6">
          <label className="text-xs uppercase tracking-wider text-white/40">{t('case.duration')}</label>
          <input
            type="number"
            min={0}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-eh-gold/30"
          />
          <p className="mt-2 text-xs text-white/30">{t('case.durationHint')}</p>
        </div>
        <div className="rounded-3xl border border-white/[0.08] bg-eh-card/90 p-6">
          <label className="text-xs uppercase tracking-wider text-white/40">{t('case.reportTrend')}</label>
          <select
            value={reportTrend}
            onChange={(e) => setReportTrend(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-eh-gold/30"
          >
            <option value="">{t('case.trendAuto')}</option>
            <option value="high">{t('case.trendHigh')}</option>
            <option value="low">{t('case.trendLow')}</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-eh-card/90 p-6">
        <label className="text-xs uppercase tracking-wider text-white/40">{t('case.uploads')}</label>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] text-white/35">{t('case.reportPdf')}</p>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setReportName(e.target.files?.[0]?.name || '')}
              className="text-xs text-white/50"
            />
          </div>
          <div>
            <p className="mb-1 text-[11px] text-white/35">{t('case.patientPhoto')}</p>
            <input type="file" accept="image/*" onChange={(e) => setPhotoName(e.target.files?.[0]?.name || '')} className="text-xs text-white/50" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-eh-card/90 p-6">
        <label className="text-xs uppercase tracking-wider text-white/40">{t('case.notes')}</label>
        <textarea
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-eh-gold/30"
        />
      </div>

      <button
        type="button"
        disabled={!rows.length}
        onClick={goToSmartSearch}
        className="w-full rounded-2xl bg-gradient-to-r from-eh-gold to-eh-gold2 py-3.5 font-display text-sm font-semibold tracking-wide text-eh-bg shadow-lg shadow-eh-gold/20 disabled:opacity-40"
      >
        {t('case.openSmartSearch')}
      </button>
    </div>
  );
}
