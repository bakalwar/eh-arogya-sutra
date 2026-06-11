import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { loadLocalPatients } from '../utils/patientDraft';

export default function PatientPortal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const local = loadLocalPatients();
  const [remote, setRemote] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get('/api/patients');
        if (!cancelled && data.success && Array.isArray(data.data)) setRemote(data.data);
      } catch {
        /* DB off — use local drafts only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10 pt-2">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-eh-gold/80">{t('patientHub.badge')}</p>
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t('patientHub.title')}</h1>
        <p className="mt-2 text-sm text-white/45">{t('patientHub.sub')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <NavLink
          to="/patient/register"
          className="rounded-3xl border border-eh-gold/25 bg-gradient-to-br from-eh-card to-eh-surface/80 p-6 shadow-lg transition hover:border-eh-gold/45"
        >
          <div className="font-display text-lg text-eh-gold2">{t('patientHub.cardReg')}</div>
          <p className="mt-2 text-sm text-white/45">{t('patientHub.cardRegSub')}</p>
        </NavLink>
        <div className="rounded-3xl border border-white/10 bg-eh-card/90 p-6 shadow-lg">
          <div className="font-display text-lg text-white">{t('patientHub.cardCase')}</div>
          <p className="mt-2 text-sm text-white/45">{t('patientHub.cardCaseSub')}</p>
          <p className="mt-3 text-xs text-amber-200/80">{t('patientHub.caseHint')}</p>
        </div>
      </div>

      {remote.length > 0 && (
        <div className="rounded-3xl border border-white/[0.08] bg-eh-card/80 p-5">
          <h2 className="font-display text-sm font-semibold text-eh-gold2">{t('patientHub.remoteTitle')}</h2>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {remote.slice(0, 12).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-white/90">{p.name}</p>
                  <p className="text-xs text-white/40">{p.mobile || '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/case/new', { state: { patient: p } })}
                  className="rounded-lg border border-eh-mint/30 bg-eh-mint/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"
                >
                  {t('patientHub.openCase')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {local.length > 0 && (
        <div className="rounded-3xl border border-white/[0.08] bg-eh-card/80 p-5">
          <h2 className="font-display text-sm font-semibold text-eh-gold2">{t('patientHub.localTitle')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            {local.slice(0, 8).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2 last:border-0">
                <span>{p.name}</span>
                <button
                  type="button"
                  onClick={() => navigate('/case/new', { state: { patient: p } })}
                  className="text-xs font-semibold text-eh-gold underline"
                >
                  {t('patientHub.openCase')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-white/30">{t('panels.patient')}</p>
    </div>
  );
}
