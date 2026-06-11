import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../api/client';

const BLOOD_FIELDS = [
  { key: 'hemoglobin', label: 'Hemoglobin', placeholder: '12–17' },
  { key: 'wbc', label: 'WBC', placeholder: '4000–11000' },
  { key: 'platelets', label: 'Platelets', placeholder: '150k–400k' },
  { key: 'glucose', label: 'Sugar / Glucose', placeholder: '70–100' },
  { key: 'creatinine', label: 'Creatinine', placeholder: '0.6–1.2' },
  { key: 'uric_acid', label: 'Uric Acid', placeholder: '3.5–7.2' },
  { key: 'esr', label: 'ESR', placeholder: '0–20' },
  { key: 'crp', label: 'CRP', placeholder: '0–5' },
  { key: 'bp_systolic', label: 'BP Systolic', placeholder: '90–120' },
  { key: 'vitamin_d', label: 'Vitamin D', placeholder: '30–100' },
  { key: 'hemoglobin_a1c', label: 'Hemoglobin A1c', placeholder: '4–5.6' }
];

const DEMO_BLOOD = {
  hemoglobin: '9.5',
  wbc: '3200',
  glucose: '145',
  crp: '12',
  bp_systolic: '138'
};

const DEMO_IMAGING =
  'MRI shows swelling and inflammation with enlarged lymph nodes. Mild cortical thinning and bone loss noted.';

function MarkerRow({ m }) {
  const tone =
    m.status === 'high'
      ? 'border-rose-500/30 bg-rose-500/10'
      : m.status === 'low'
        ? 'border-sky-500/30 bg-sky-500/10'
        : 'border-white/10 bg-white/5';
  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-white">{m.label}</span>
        <span className="font-mono text-xs text-white/80">
          {m.value} {m.unit}
        </span>
      </div>
      <p className="mt-1 text-xs text-white/55">{m.explanation}</p>
    </div>
  );
}

export default function ReportAnalysis() {
  const { t } = useTranslation();
  const [values, setValues] = useState({});
  const [imagingText, setImagingText] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function setField(key, v) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function loadDemo() {
    setValues(DEMO_BLOOD);
    setImagingText(DEMO_IMAGING);
    setResult(null);
    setErr('');
  }

  async function analyze() {
    setBusy(true);
    setErr('');
    setResult(null);
    const bloodValues = {};
    for (const [k, v] of Object.entries(values)) {
      const n = String(v).trim();
      if (n) bloodValues[k] = Number(n);
    }
    if (!Object.keys(bloodValues).length && !imagingText.trim()) {
      setErr('Enter at least one blood value or imaging text.');
      setBusy(false);
      return;
    }
    try {
      const { data } = await client.post('/api/reports/analyze', {
        reportType: 'combined',
        bloodValues,
        imagingText: imagingText.trim()
      });
      if (data.success) setResult(data.data);
      else setErr(data.message || 'Analysis failed');
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Network error — run: npm run dev:app');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-eh-gold/80">EH CDSS</p>
        <h1 className="font-display text-2xl text-eh-gold2">{t('nav.reports')}</h1>
        <p className="mt-1 text-sm text-white/45">
          Blood + imaging — HIGH (badhna) = Positive rog · LOW (ghatna) = Negative rog
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadDemo}
          className="rounded-xl border border-eh-gold/40 bg-eh-gold/10 px-4 py-2 text-sm font-semibold text-eh-gold2"
        >
          Load demo
        </button>
        <button
          type="button"
          onClick={analyze}
          disabled={busy}
          className="rounded-xl bg-gradient-to-r from-eh-gold to-eh-gold2 px-5 py-2 text-sm font-semibold text-eh-bg disabled:opacity-50"
        >
          {busy ? 'Analyzing…' : 'Analyze report'}
        </button>
      </div>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <section className="rounded-2xl border border-white/[0.08] bg-eh-card/80 p-5">
        <h2 className="font-display text-lg text-white">Blood parameters</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {BLOOD_FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-white/70">
                {f.label} <span className="text-white/35">({f.placeholder})</span>
              </span>
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-eh-gold/40"
                placeholder={f.placeholder}
                value={values[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-eh-card/80 p-5">
        <h2 className="font-display text-lg text-white">MRI / CT / X-ray text</h2>
        <textarea
          className="mt-3 min-h-[120px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-eh-gold/40"
          placeholder="Paste radiology impression…"
          value={imagingText}
          onChange={(e) => setImagingText(e.target.value)}
        />
      </section>

      {result ? (
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-eh-gold/25 bg-eh-gold/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-eh-gold2">Overall rog</p>
              <p className="mt-2 text-lg font-semibold text-white">{String(result.rogPolarity || '').toUpperCase()}</p>
              <p className="mt-1 text-xs text-white/50">{result.reportTrendLabel}</p>
            </div>
            {result.blood ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200">Blood</p>
                <p className="mt-1 text-sm text-white/80">{result.blood.summary}</p>
                <p className="mt-1 text-xs text-white/45">{result.blood.electricity}</p>
              </div>
            ) : null}
          </div>

          {result.blood?.markers?.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white/60">Blood markers</h3>
              {result.blood.markers.map((m) => (
                <MarkerRow key={m.test_key} m={m} />
              ))}
            </div>
          ) : null}

          {result.imaging ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Imaging</p>
              <p className="mt-2 text-sm text-white/80">{result.imaging.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(result.imaging.positiveKeywords || []).map((k) => (
                  <span key={`p-${k}`} className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-100">
                    + {k}
                  </span>
                ))}
                {(result.imaging.negativeKeywords || []).map((k) => (
                  <span key={`n-${k}`} className="rounded bg-sky-500/20 px-2 py-0.5 text-xs text-sky-100">
                    − {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
