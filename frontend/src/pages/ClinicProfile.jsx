import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { getUser } from '../security/tokenManager';
import '../styles/clinic-profile.css';

const DEGREES = [
  { id: 'BEMS', label: 'BEMS (Bachelor of EH Medicine)' },
  { id: 'MD_EH', label: 'MD (EH)' },
  { id: 'CERTIFICATE', label: 'Certificate Course' },
  { id: 'OTHER', label: 'Other' }
];

const SPEC_OPTIONS = [
  'Chronic Diseases',
  'Skin Diseases',
  'Children Health',
  'Women Health',
  'Cancer / Tumor',
  'Kidney Diseases',
  'Respiratory',
  'Diabetes'
];

const EMPTY = {
  fullName: '',
  mobile: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressPin: '',
  primaryDegree: 'BEMS',
  primaryDegreeOther: '',
  additionalQualifications: [''],
  registrationNumber: '',
  registrationAuthority: '',
  registrationValid: '',
  yearOfPassing: '',
  university: '',
  specializations: [],
  specializationOther: '',
  experienceYears: '',
  clinicName: '',
  clinicLogoPath: '',
  clinicPhone: '',
  clinicEmail: '',
  clinicWebsite: '',
  clinicAddressStreet: '',
  clinicAddressCity: '',
  clinicAddressState: '',
  clinicAddressPin: '',
  clinicDistrict: '',
  googleMapsLink: '',
  clinicTimingWeekdays: '9:00 AM - 6:00 PM',
  clinicTimingSunday: 'Closed',
  consultationFee: '',
  profilePhotoPath: '',
  signaturePath: '',
  sealPath: '',
  prescriptionHeaderName: '',
  prescriptionDisclaimer: '',
  prescriptionShow: {
    doctorName: true,
    registrationNumber: true,
    clinicName: true,
    clinicPhone: true,
    clinicAddress: true,
    timing: true,
    digitalSignature: true
  },
  pharmacyContact: '',
  pharmacyWhatsapp: '',
  pharmacyMessage: 'Medicine ke behtar results ke liye E.H. AROGYA SUTRA se sampark karen'
};

function Section({ title, children }) {
  return (
    <section className="profile-section">
      <h2 className="profile-section-title">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="profile-label">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}

export default function ClinicProfile() {
  const user = getUser();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [completion, setCompletion] = useState({ percent: 0, missing: [] });
  const photoRef = useRef(null);
  const logoRef = useRef(null);
  const sigRef = useRef(null);
  const sealRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/api/profile');
      const p = data.data?.profile || data.profile || {};
      setForm({
        ...EMPTY,
        ...p,
        additionalQualifications:
          p.additionalQualifications?.length > 0 ? p.additionalQualifications : [''],
        mobile: p.mobile || user?.mobile || '',
        fullName: p.fullName || p.name || user?.name || ''
      });
      setCompletion(data.data?.completion || { percent: 0, missing: [] });
    } catch {
      setForm((f) => ({
        ...f,
        mobile: user?.mobile || '',
        fullName: user?.name || ''
      }));
    } finally {
      setLoading(false);
    }
  }, [user?.mobile, user?.name]);

  useEffect(() => {
    document.title = 'Doctor & Clinic Profile — E.H. Arogya Sutra';
    load();
  }, [load]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setShow(key, checked) {
    setForm((f) => ({
      ...f,
      prescriptionShow: { ...f.prescriptionShow, [key]: checked }
    }));
  }

  function toggleSpec(name) {
    setForm((f) => {
      const list = f.specializations.includes(name)
        ? f.specializations.filter((s) => s !== name)
        : [...f.specializations, name];
      return { ...f, specializations: list };
    });
  }

  async function uploadFile(endpoint, file, pathKey) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await client.post(endpoint, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const path = data.data?.[pathKey] || data.data?.path;
    if (path) set(pathKey, path);
    return path;
  }

  async function handleUpload(type, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (type === 'photo') await uploadFile('/api/profile/upload-photo', file, 'profilePhotoPath');
      if (type === 'logo') await uploadFile('/api/profile/upload-logo', file, 'clinicLogoPath');
      if (type === 'signature') await uploadFile('/api/profile/upload-signature', file, 'signaturePath');
      if (type === 'seal') await uploadFile('/api/profile/upload-seal', file, 'sealPath');
      setToast('✅ Upload ho gaya!');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      setToast(err.response?.data?.message || 'Upload failed');
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        additionalQualifications: form.additionalQualifications.filter((q) => q?.trim())
      };
      const { data } = await client.put('/api/profile', payload);
      setForm({ ...EMPTY, ...data.data.profile });
      setCompletion(data.data.completion);
      setEditing(false);
      setToast('✅ Profile save ho gaya!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const disabled = !editing;
  const headerDefault =
    form.prescriptionHeaderName ||
    `${form.fullName ? `Dr. ${form.fullName.replace(/^Dr\.?\s*/i, '')}` : 'Doctor'} · ${form.clinicName || 'Clinic'}`;

  if (loading) {
    return (
      <div className="profile-page mx-auto max-w-3xl px-4 py-8 text-center text-white/50">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="profile-page mx-auto max-w-3xl px-4 py-4">
      <div className="profile-header-bar">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-sm text-white/50 hover:text-[#e8c46a]">
            ← Back
          </Link>
          <h1>DOCTOR & CLINIC PROFILE</h1>
        </div>
        <div className="profile-header-actions">
          {!editing ? (
            <button type="button" className="profile-btn" onClick={() => setEditing(true)}>
              ✏️ Edit
            </button>
          ) : (
            <>
              <button type="button" className="profile-btn" onClick={() => { setEditing(false); load(); }}>
                Cancel
              </button>
              <button type="button" className="profile-btn profile-btn-primary" onClick={save} disabled={saving}>
                💾 Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-completion">
        <div className="flex justify-between text-sm text-white/70">
          <span>Profile Complete: {completion.percent || 0}%</span>
        </div>
        <div className="profile-completion-bar">
          <div className="profile-completion-fill" style={{ width: `${completion.percent || 0}%` }} />
        </div>
        {completion.missing?.length > 0 && (
          <div className="profile-missing">
            <p>Yeh fields baki hain:</p>
            <ul>
              {completion.missing.slice(0, 6).map((m) => (
                <li key={m}>* {m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Section title="👨‍⚕️ DOCTOR KI JANKARI">
        <div className="profile-photo-wrap">
          <div className="profile-photo-circle">
            {form.profilePhotoPath ? (
              <img src={form.profilePhotoPath} alt="" />
            ) : (
              <span>👨‍⚕️</span>
            )}
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleUpload('photo', e)} />
          <button
            type="button"
            className="profile-upload-btn"
            disabled={disabled}
            onClick={() => photoRef.current?.click()}
          >
            📷 Photo Change Karen
          </button>
        </div>

        <Field label="Full Name" required>
          <input
            className="profile-input"
            value={form.fullName}
            disabled={disabled}
            placeholder="Dr. ______"
            onChange={(e) => set('fullName', e.target.value)}
          />
        </Field>
        <Field label="Mobile Number" required>
          <input className="profile-input" value={form.mobile} readOnly disabled />
        </Field>
        <Field label="Email Address">
          <input
            className="profile-input"
            type="email"
            value={form.email}
            disabled={disabled}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Date of Birth">
          <input
            className="profile-input"
            type="date"
            value={form.dateOfBirth}
            disabled={disabled}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </Field>
        <Field label="Gender">
          <div className="profile-radio-row">
            {['male', 'female', 'other'].map((g) => (
              <label key={g}>
                <input
                  type="radio"
                  name="gender"
                  checked={form.gender === g}
                  disabled={disabled}
                  onChange={() => set('gender', g)}
                />
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Full Address" required>
          <input
            className="profile-input"
            placeholder="Street"
            value={form.addressStreet}
            disabled={disabled}
            onChange={(e) => set('addressStreet', e.target.value)}
          />
          <div className="profile-grid-2">
            <input
              className="profile-input"
              placeholder="City"
              value={form.addressCity}
              disabled={disabled}
              onChange={(e) => set('addressCity', e.target.value)}
            />
            <input
              className="profile-input"
              placeholder="State"
              value={form.addressState}
              disabled={disabled}
              onChange={(e) => set('addressState', e.target.value)}
            />
          </div>
          <input
            className="profile-input"
            placeholder="PIN Code"
            value={form.addressPin}
            disabled={disabled}
            onChange={(e) => set('addressPin', e.target.value)}
          />
        </Field>
      </Section>

      <Section title="🎓 YOGYATA (Qualification)">
        <Field label="Primary Degree" required>
          <div className="profile-radio-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            {DEGREES.map((d) => (
              <label key={d.id}>
                <input
                  type="radio"
                  name="degree"
                  checked={form.primaryDegree === d.id}
                  disabled={disabled}
                  onChange={() => set('primaryDegree', d.id)}
                />
                {d.label}
              </label>
            ))}
          </div>
          {form.primaryDegree === 'OTHER' && (
            <input
              className="profile-input"
              placeholder="Other degree"
              value={form.primaryDegreeOther}
              disabled={disabled}
              onChange={(e) => set('primaryDegreeOther', e.target.value)}
            />
          )}
        </Field>
        <Field label="Additional Qualifications">
          {form.additionalQualifications.map((q, i) => (
            <input
              key={i}
              className="profile-input"
              value={q}
              disabled={disabled}
              onChange={(e) => {
                const next = [...form.additionalQualifications];
                next[i] = e.target.value;
                set('additionalQualifications', next);
              }}
            />
          ))}
          {editing && (
            <button
              type="button"
              className="profile-upload-btn"
              onClick={() => set('additionalQualifications', [...form.additionalQualifications, ''])}
            >
              + Add More
            </button>
          )}
        </Field>
        <Field label="EH Registration Number" required>
          <input
            className="profile-input"
            value={form.registrationNumber}
            disabled={disabled}
            placeholder="BEMS/___/___"
            onChange={(e) => set('registrationNumber', e.target.value)}
          />
        </Field>
        <Field label="Registration Authority">
          <input
            className="profile-input"
            value={form.registrationAuthority}
            disabled={disabled}
            onChange={(e) => set('registrationAuthority', e.target.value)}
          />
        </Field>
        <Field label="Registration Valid Till">
          <input
            className="profile-input"
            type="month"
            value={form.registrationValid?.slice(0, 7) || ''}
            disabled={disabled}
            onChange={(e) => set('registrationValid', e.target.value ? `${e.target.value}-01` : '')}
          />
        </Field>
        <Field label="Year of Passing">
          <input
            className="profile-input"
            placeholder="YYYY"
            maxLength={4}
            value={form.yearOfPassing}
            disabled={disabled}
            onChange={(e) => set('yearOfPassing', e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </Field>
        <Field label="University / Institute" required>
          <input
            className="profile-input"
            value={form.university}
            disabled={disabled}
            onChange={(e) => set('university', e.target.value)}
          />
        </Field>
        <Field label="Specialization">
          <div className="profile-check-grid">
            {SPEC_OPTIONS.map((s) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={form.specializations.includes(s)}
                  disabled={disabled}
                  onChange={() => toggleSpec(s)}
                />
                {s}
              </label>
            ))}
          </div>
          <input
            className="profile-input"
            placeholder="Other specialization"
            value={form.specializationOther}
            disabled={disabled}
            onChange={(e) => set('specializationOther', e.target.value)}
          />
        </Field>
        <Field label="Experience (Years)">
          <input
            className="profile-input"
            type="number"
            min={0}
            value={form.experienceYears}
            disabled={disabled}
            onChange={(e) => set('experienceYears', e.target.value)}
          />
        </Field>
      </Section>

      <Section title="🏥 CLINIC KI JANKARI">
        <Field label="Clinic Name" required>
          <input
            className="profile-input"
            value={form.clinicName}
            disabled={disabled}
            onChange={(e) => set('clinicName', e.target.value)}
          />
        </Field>
        <Field label="Clinic Logo">
          {form.clinicLogoPath && <img src={form.clinicLogoPath} alt="" className="profile-logo-preview" />}
          <input ref={logoRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleUpload('logo', e)} />
          <button type="button" className="profile-upload-btn" disabled={disabled} onClick={() => logoRef.current?.click()}>
            📷 Logo Upload Karen
          </button>
        </Field>
        <Field label="Clinic Phone Number" required>
          <input
            className="profile-input"
            value={form.clinicPhone}
            disabled={disabled}
            placeholder="+91"
            onChange={(e) => set('clinicPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </Field>
        <Field label="Clinic Email">
          <input
            className="profile-input"
            type="email"
            value={form.clinicEmail}
            disabled={disabled}
            onChange={(e) => set('clinicEmail', e.target.value)}
          />
        </Field>
        <Field label="Clinic Website">
          <input
            className="profile-input"
            value={form.clinicWebsite}
            disabled={disabled}
            placeholder="www."
            onChange={(e) => set('clinicWebsite', e.target.value)}
          />
        </Field>
        <Field label="Clinic Full Address" required>
          <input
            className="profile-input"
            placeholder="Street"
            value={form.clinicAddressStreet}
            disabled={disabled}
            onChange={(e) => set('clinicAddressStreet', e.target.value)}
          />
          <div className="profile-grid-2">
            <input
              className="profile-input"
              placeholder="City"
              value={form.clinicAddressCity}
              disabled={disabled}
              onChange={(e) => set('clinicAddressCity', e.target.value)}
            />
            <input
              className="profile-input"
              placeholder="State"
              value={form.clinicAddressState}
              disabled={disabled}
              onChange={(e) => set('clinicAddressState', e.target.value)}
            />
          </div>
          <div className="profile-grid-2">
            <input
              className="profile-input"
              placeholder="PIN"
              value={form.clinicAddressPin}
              disabled={disabled}
              onChange={(e) => set('clinicAddressPin', e.target.value)}
            />
            <input
              className="profile-input"
              placeholder="District"
              value={form.clinicDistrict}
              disabled={disabled}
              onChange={(e) => set('clinicDistrict', e.target.value)}
            />
          </div>
        </Field>
        <Field label="Google Maps Link">
          <input
            className="profile-input"
            value={form.googleMapsLink}
            disabled={disabled}
            onChange={(e) => set('googleMapsLink', e.target.value)}
          />
        </Field>
        <Field label="Timing" required>
          <input
            className="profile-input"
            placeholder="Monday-Saturday"
            value={form.clinicTimingWeekdays}
            disabled={disabled}
            onChange={(e) => set('clinicTimingWeekdays', e.target.value)}
          />
          <input
            className="profile-input"
            placeholder="Sunday"
            value={form.clinicTimingSunday}
            disabled={disabled}
            onChange={(e) => set('clinicTimingSunday', e.target.value)}
          />
        </Field>
        <Field label="Consultation Fee">
          <input
            className="profile-input"
            type="number"
            placeholder="₹"
            value={form.consultationFee}
            disabled={disabled}
            onChange={(e) => set('consultationFee', e.target.value)}
          />
        </Field>
      </Section>

      <Section title="📄 PRESCRIPTION SETTINGS">
        <p className="mb-3 text-xs text-white/40">(PDF mein yahi dikhega)</p>
        <Field label="Prescription Header Name" required>
          <input
            className="profile-input"
            value={form.prescriptionHeaderName}
            disabled={disabled}
            placeholder={headerDefault}
            onChange={(e) => set('prescriptionHeaderName', e.target.value)}
          />
          <p className="text-[10px] text-white/35">Default: Doctor Name + Clinic Name</p>
        </Field>
        <Field label="Doctor Signature">
          {form.signaturePath && <p className="text-xs text-emerald-400/80 mb-1">✓ Uploaded</p>}
          <input ref={sigRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleUpload('signature', e)} />
          <button type="button" className="profile-upload-btn" disabled={disabled} onClick={() => sigRef.current?.click()}>
            ✍️ Signature Upload Karen
          </button>
        </Field>
        <Field label="Digital Seal (optional)">
          <input ref={sealRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleUpload('seal', e)} />
          <button type="button" className="profile-upload-btn" disabled={disabled} onClick={() => sealRef.current?.click()}>
            🔏 Seal Upload Karen
          </button>
        </Field>
        <Field label="Disclaimer Text">
          <textarea
            className="profile-input min-h-[72px]"
            rows={3}
            value={form.prescriptionDisclaimer}
            disabled={disabled}
            onChange={(e) => set('prescriptionDisclaimer', e.target.value)}
          />
        </Field>
        <p className="profile-label">Show on Prescription</p>
        <div className="profile-check-grid">
          {[
            ['doctorName', 'Doctor Name'],
            ['registrationNumber', 'Registration Number'],
            ['clinicName', 'Clinic Name'],
            ['clinicPhone', 'Clinic Phone'],
            ['clinicAddress', 'Clinic Address'],
            ['timing', 'Timing'],
            ['digitalSignature', 'Digital Signature']
          ].map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={!!form.prescriptionShow?.[key]}
                disabled={disabled}
                onChange={(e) => setShow(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="🌿 E.H. AROGYA SUTRA CONTACT">
        <p className="mb-3 text-xs text-white/40">(Prescription ke neeche dikhega)</p>
        <Field label="Contact Phone">
          <input
            className="profile-input"
            value={form.pharmacyContact}
            disabled={disabled}
            onChange={(e) => set('pharmacyContact', e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </Field>
        <Field label="WhatsApp Number">
          <input
            className="profile-input"
            value={form.pharmacyWhatsapp}
            disabled={disabled}
            onChange={(e) => set('pharmacyWhatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </Field>
        <Field label="Contact Message">
          <textarea
            className="profile-input min-h-[64px]"
            value={form.pharmacyMessage}
            disabled={disabled}
            onChange={(e) => set('pharmacyMessage', e.target.value)}
          />
        </Field>
      </Section>

      <button type="button" className="profile-save-bottom" disabled={!editing || saving} onClick={save}>
        💾 Profile Save Karen
      </button>

      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  );
}
