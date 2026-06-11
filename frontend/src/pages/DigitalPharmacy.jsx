import { useTranslation } from 'react-i18next';
import PreviewNotice from '../components/PreviewNotice';

const rows = [
  { sku: 'S-12', name: 'Scrofoloso', lot: 'EH-2401', qty: 24, min: 10, dil: '1:9 ready' },
  { sku: 'C-8', name: 'Canceroso', lot: 'EH-2402', qty: 8, min: 12, dil: '1:47 base' },
  { sku: 'A-3', name: 'Angiotico', lot: 'EH-2398', qty: 31, min: 8, dil: '1:9 ready' },
  { sku: 'L-5', name: 'Lymphatico', lot: 'EH-2400', qty: 0, min: 6, dil: 'Reorder' },
  { sku: 'P-1', name: 'Pettorale', lot: 'EH-2395', qty: 15, min: 10, dil: '1:9 ready' }
];

export default function DigitalPharmacy() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10 pt-2">
      <PreviewNotice>इन्वेंटरी API जल्द — अभी नमूना स्टॉक टेबल।</PreviewNotice>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-eh-gold/80">{t('pharmacy.badge')}</p>
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t('pharmacy.title')}</h1>
        <p className="max-w-2xl text-sm text-white/45">{t('pharmacy.sub')}</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
          {t('pharmacy.chipOk')}
        </span>
        <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
          {t('pharmacy.chipLow')}
        </span>
        <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-100">
          {t('pharmacy.chipOut')}
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-eh-card/90 shadow-xl shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-white/40">
                <th className="px-5 py-4">{t('pharmacy.colSku')}</th>
                <th className="px-5 py-4">{t('pharmacy.colName')}</th>
                <th className="px-5 py-4">{t('pharmacy.colLot')}</th>
                <th className="px-5 py-4 text-right">{t('pharmacy.colQty')}</th>
                <th className="px-5 py-4 text-right">{t('pharmacy.colMin')}</th>
                <th className="px-5 py-4">{t('pharmacy.colDil')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const low = r.qty > 0 && r.qty < r.min;
                const out = r.qty === 0;
                return (
                  <tr
                    key={r.sku}
                    className={`border-b border-white/[0.05] last:border-0 ${
                      out ? 'bg-rose-500/[0.06]' : low ? 'bg-amber-500/[0.04]' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-eh-gold2">{r.sku}</td>
                    <td className="px-5 py-3.5 font-medium text-white/90">{r.name}</td>
                    <td className="px-5 py-3.5 text-white/45">{r.lot}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-white">{r.qty}</td>
                    <td className="px-5 py-3.5 text-right text-white/40">{r.min}</td>
                    <td className="px-5 py-3.5 text-white/55">{r.dil}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-[11px] text-white/25">{t('pharmacy.foot')}</p>
    </div>
  );
}
