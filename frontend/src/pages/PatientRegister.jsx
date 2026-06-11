import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { personalFactorFromName, saveLocalPatient } from '../utils/patientDraft';

export default function PatientRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [mobile, setMobile] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function onPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) {
      setPhotoPreview('');
      return;
    }
    if (f.size > 140 * 1024) {
      setErr(t('patientReg.photoTooBig'));
      setPhotoPreview('');
      return;
    }
    setErr('');
    const r = new FileReader();
    r.onload = () => setPhotoPreview(String(r.result || ''));
    r.readAsDataURL(f);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const payload = {
      name: name.trim(),
      age: age ? Number(age) : undefined,
      gender: gender || undefined,
      weight: weight ? Number(weight) : undefined,
      mobile: mobile.replace(/\D/g, ''),
      photoUrl: photoPreview || undefined
    };
    try {
      const { data } = await client.post('/api/patients', payload);
      if (data.success && data.data?.id) {
        navigate('/case/new', { state: { patient: data.data } });
        return;
      }
      setErr(data.message || t('patientReg.saveFailed'));
    } catch (ex) {
      if (ex.response?.status === 503) {
        const id = `local-${Date.now()}`;
        const local = {
          id,
          ...payload,
          personalFactor: personalFactorFromName(payload.name)
        };
        saveLocalPatient(local);
        navigate('/case/new', { state: { patient: local } });
        return;
      }
      setErr(ex.response?.data?.message || ex.message || t('patientReg.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-10 pt-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-eh-gold2">{t('patientReg.title')}</h1>
        <Link to="/patient" className="text-xs text-eh-gold/70 underline">
          ← {t('patientHub.title')}
        </Link>
      </div>
      <p className="text-sm text-white/45">{t('patientReg.lead')}</p>

      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-white/[0.08] bg-eh-card/90 p-6 shadow-xl">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">{t('patientReg.name')}</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-eh-gold/30 focus:ring-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">{t('patientReg.age')}</label>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-eh-gold/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">{t('patientReg.gender')}</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-eh-gold/30 focus:ring-2"
            >
              <option value="">{t('patientReg.genderPick')}</option>
              <option value="M">{t('patientReg.male')}</option>
              <option value="F">{t('patientReg.female')}</option>
              <option value="O">{t('patientReg.other')}</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">{t('patientReg.weight')}</label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-eh-gold/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">{t('patientReg.mobile')}</label>
            <input
              required
              type="tel"
              inputMode="numeric"
              minLength={10}
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-eh-gold/30 focus:ring-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">{t('patientReg.photo')}</label>
          <input type="file" accept="image/*" onChange={onPhoto} className="text-sm text-white/60" />
        </div>
        {err ? <p className="text-sm text-red-400">{err}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-eh-sage to-eh-mint py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? t('common.loading') : t('patientReg.submit')}
        </button>
      </form>
    </div>
  );
}
