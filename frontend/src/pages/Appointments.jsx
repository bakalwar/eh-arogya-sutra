import { useTranslation } from 'react-i18next';
import PreviewNotice from '../components/PreviewNotice';

const slots = [
  { time: '09:30', title: 'Follow-up — Anita Desai', sub: 'Lymphatic · D10 refill', type: 'done' },
  { time: '10:15', title: 'New patient — Rohit Mehta', sub: 'Intake + polarity', type: 'live' },
  { time: '11:00', title: 'Kavita Singh', sub: 'EH prescription review', type: 'wait' },
  { time: '11:45', title: 'Vikram Joshi', sub: 'Lab report discussion', type: 'wait' },
  { time: '03:00', title: 'Tele-consult block', sub: 'Reserved · 45 min', type: 'hold' }
];

export default function Appointments() {
  const { t, i18n } = useTranslation();

  const today = new Date().toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const typeStyle = {
    done: 'border-white/10 bg-white/[0.04] text-white/45',
    live: 'border-eh-mint/40 bg-eh-mint/15 text-emerald-100',
    wait: 'border-eh-gold/30 bg-eh-gold/10 text-eh-gold2',
    hold: 'border-sky-500/25 bg-sky-500/10 text-sky-100'
  };

  const typeLabel = {
    done: t('appointments.statusDone'),
    live: t('appointments.statusLive'),
    wait: t('appointments.statusWait'),
    hold: t('appointments.statusHold')
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10 pt-2">
      <PreviewNotice>अपॉइंटमेंट कैलेंडर API जल्द — अभी नमूना समय-सारणी।</PreviewNotice>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-eh-gold/80">{t('appointments.badge')}</p>
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t('appointments.title')}</h1>
        <p className="text-sm text-eh-gold2/90">{today}</p>
        <p className="text-sm text-white/45">{t('appointments.sub')}</p>
      </header>

      <ol className="relative space-y-0 before:absolute before:left-[21px] before:top-3 before:h-[calc(100%-24px)] before:w-px before:bg-gradient-to-b before:from-eh-gold/50 before:to-transparent sm:before:left-[23px]">
        {slots.map((s) => (
          <li key={s.time + s.title} className="relative flex gap-4 pl-1 sm:gap-5">
            <div className="flex w-12 shrink-0 flex-col items-center pt-1 sm:w-14">
              <span className="z-[1] flex h-10 w-10 items-center justify-center rounded-full border border-eh-gold/30 bg-eh-card font-mono text-[11px] font-semibold text-eh-gold2">
                {s.time}
              </span>
            </div>
            <div className="mb-4 min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-eh-card/90 p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeStyle[s.type]}`}
                >
                  {typeLabel[s.type]}
                </span>
              </div>
              <p className="font-medium text-white/95">{s.title}</p>
              <p className="mt-1 text-sm text-white/40">{s.sub}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-center text-[11px] text-white/25">{t('appointments.foot')}</p>
    </div>
  );
}
