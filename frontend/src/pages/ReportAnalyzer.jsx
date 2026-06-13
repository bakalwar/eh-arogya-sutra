import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileText,
  Upload,
  Plus,
  Trash2,
  User,
  Droplets,
} from 'lucide-react';
import client from '../api/client';

const COLORS = {
  bg: '#0a0a0a',
  surface: '#111111',
  border: '#1a1a1a',
  text: '#ffffff',
  textMuted: '#888888',
  gold: '#d4af37',
  goldMuted: 'rgba(212, 175, 55, 0.1)',
  teal: '#008080',
  tealMuted: 'rgba(0, 128, 128, 0.1)',
  red: '#ff4d4d',
  green: '#4ade80',
};

function countWords(text) {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

function doshaPillStyle(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('severe')) return { borderColor: COLORS.red, color: COLORS.red, backgroundColor: 'rgba(255,77,77,0.1)' };
  if (s.includes('mild')) return { borderColor: COLORS.gold, color: COLORS.gold, backgroundColor: COLORS.goldMuted };
  return { borderColor: COLORS.green, color: COLORS.green, backgroundColor: 'rgba(74,222,128,0.08)' };
}

function labStatusColor(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'HIGH' || s === 'LOW' || s === 'ABNORMAL') return COLORS.red;
  return COLORS.green;
}

function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
}

function buildClinicalFormData(patientData) {
  const formData = new FormData();
  const chiefComplaint = [
    patientData.symptoms.join(', '),
    patientData.labText ? `Lab: ${patientData.labText}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  patientData.images.forEach((img) => {
    if (!img?.file) return;
    if (isPdfFile(img.file)) {
      formData.append('report_files', img.file);
    } else if (img.file.type.startsWith('image/')) {
      formData.append('body_photos', img.file);
    } else {
      formData.append('report_files', img.file);
    }
  });

  formData.append('output_mode', 'clinical_only');
  formData.append('patient_name', patientData.name.trim() || 'Patient');
  formData.append('age', patientData.age || 40);
  formData.append('gender', patientData.gender || 'Male');
  formData.append('weight', patientData.weight || '');
  formData.append('bp_systolic', patientData.bp_systolic || 120);
  formData.append('bp_diastolic', patientData.bp_diastolic || 80);
  formData.append('pulse', patientData.pulse || '');
  formData.append('condition', 'chronic');
  if (chiefComplaint) {
    formData.append('chief_complaint', chiefComplaint);
    formData.append('symptoms', chiefComplaint);
  }
  return formData;
}

function SynthesizedPanel({ data }) {
  const r = data.clinicalReport;
  const p = data.patient;
  const narrative = r.overall_clinical_impression || '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <strong className="text-lg">{p.name}</strong>
          <span className="opacity-60">
            {' '}
            · {p.age}y · {p.gender} · {new Date(p.date).toLocaleDateString()}
          </span>
        </div>
        {r.severity ? (
          <span className="px-3 py-1 rounded-full text-xs border" style={{ borderColor: COLORS.gold, color: COLORS.gold }}>
            {r.severity}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['Vat', r.vat_status],
          ['Pitt', r.pitt_status],
          ['Kaph', r.kaph_status],
        ].map(([label, status]) => (
          <span
            key={label}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={doshaPillStyle(status)}
          >
            {label}: {status}
          </span>
        ))}
        {r.dosha_dominant ? (
          <span className="text-xs opacity-50 self-center">Elevated: {r.dosha_dominant}</span>
        ) : null}
      </div>

      <div className="space-y-4 text-sm leading-relaxed opacity-90">
        {narrative.split(/\n\n+/).filter(Boolean).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {r.lab_findings?.length ? (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <h4 className="text-xs uppercase tracking-widest opacity-50">Laboratory Values</h4>
          {r.lab_findings.map((lab, i) => (
            <div
              key={`${lab.parameter}-${i}`}
              className="grid grid-cols-3 gap-2 py-2 border-b text-sm"
              style={{ borderColor: COLORS.border }}
            >
              <span>{lab.parameter}</span>
              <span className="font-mono">{lab.value}</span>
              <span className="text-xs font-bold uppercase" style={{ color: labStatusColor(lab.status) }}>
                {lab.status}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const ReportAnalyzer = () => {
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    weight: '',
    bp_systolic: '',
    bp_diastolic: '',
    pulse: '',
    symptoms: [],
    currentSymptom: '',
    labText: '',
    images: [],
  });

  const [synthesis, setSynthesis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({ ...prev, [name]: value }));
  };

  const addSymptom = () => {
    if (patientData.currentSymptom.trim()) {
      setPatientData((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, prev.currentSymptom.trim()],
        currentSymptom: '',
      }));
    }
  };

  const removeSymptom = (index) => {
    setPatientData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max 50 MB allowed.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPatientData((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            {
              file,
              preview: file.type.startsWith('image/') ? reader.result : null,
              name: file.name,
              type: file.type,
            },
          ],
        }));
      };
      reader.onerror = () => console.error('FileReader error');

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        setPatientData((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            { file, preview: null, name: file.name, type: file.type },
          ],
        }));
      }
    });
    e.target.value = '';
  };

  const removeImage = (index) => {
    setPatientData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const runAnalysis = async () => {
    if (!patientData.images.length) {
      setError('Upload at least one medical report (PDF/image) or a body-part photo.');
      return;
    }
    if (!patientData.name.trim()) {
      setError('Enter patient name before analyzing.');
      return;
    }

    setLoading(true);
    setError(null);
    setSynthesis(null);

    try {
      const formData = buildClinicalFormData(patientData);
      const response = await client.post('/api/search/clinical-analysis', formData, {
        timeout: 600000,
      });

      const resData = response.data;
      if (!resData?.success || !resData?.data?.clinicalReport?.overall_clinical_impression) {
        console.error('[ReportAnalyzer] invalid response:', resData);
        throw new Error('Analysis failed — please try again.');
      }

      setSynthesis(resData.data);
    } catch (err) {
      console.error('[ReportAnalyzer]', err);
      setError(
        err.response?.data?.message || err.message || 'Analysis failed — please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const wordCount = synthesis ? countWords(synthesis.clinicalReport.overall_clinical_impression) : 0;

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="mx-auto w-full max-w-7xl space-y-10">
        <header className="flex items-center justify-between border-b pb-6" style={{ borderColor: COLORS.border }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8" style={{ color: COLORS.gold }} />
              Report Analysis
            </h1>
            <p className="text-sm mt-1 opacity-60">Upload reports/photos — click Analyze Report for clinical synthesis only</p>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8 border-l-4 pl-6" style={{ borderColor: COLORS.gold }}>
            <h2 className="text-lg font-semibold uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5" /> Patient &amp; Upload
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs opacity-50 uppercase mb-1 block">Patient Name</label>
                <input
                  type="text"
                  name="name"
                  value={patientData.name}
                  onChange={handleInputChange}
                  placeholder="Patient name"
                  className="w-full bg-transparent border-b py-2 focus:outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs opacity-50 uppercase mb-1 block">Age</label>
                  <input type="number" name="age" value={patientData.age} onChange={handleInputChange} className="w-full bg-transparent border-b py-2" style={{ borderColor: COLORS.border }} />
                </div>
                <div>
                  <label className="text-xs opacity-50 uppercase mb-1 block">Gender</label>
                  <select name="gender" value={patientData.gender} onChange={handleInputChange} className="w-full bg-transparent border-b py-2" style={{ borderColor: COLORS.border }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer" style={{ borderColor: COLORS.teal, backgroundColor: COLORS.tealMuted }}>
              <Upload className="w-8 h-8 mb-2" style={{ color: COLORS.teal }} />
              <p className="text-sm">Upload report PDF/image or body photo</p>
              <input type="file" className="hidden" multiple onChange={handleImageUpload} accept="image/*,application/pdf" />
            </label>

            <div className="grid grid-cols-4 gap-2">
              {patientData.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border flex items-center justify-center" style={{ borderColor: COLORS.border }}>
                  {img.preview ? (
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 opacity-50" />
                  )}
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Droplets className="w-4 h-4" /> Symptoms (optional)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={patientData.currentSymptom}
                  onChange={(e) => setPatientData((prev) => ({ ...prev, currentSymptom: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                  placeholder="Add symptom..."
                  className="flex-1 bg-transparent border-b py-2"
                  style={{ borderColor: COLORS.border }}
                />
                <button type="button" onClick={addSymptom} className="p-2 rounded-full" style={{ backgroundColor: COLORS.goldMuted, color: COLORS.gold }}>
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={runAnalysis}
              disabled={loading || !patientData.images.length}
              className="w-full px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Activity className="w-6 h-6" />
                  Analyze Report ({patientData.images.length} file{patientData.images.length === 1 ? '' : 's'})
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 border-l-4 pl-6" style={{ borderColor: COLORS.teal }}>
            <h2 className="text-lg font-semibold uppercase tracking-wider flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5" /> Clinical Analysis
            </h2>
            <div className="rounded-xl border p-6 min-h-[320px]" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
              {loading ? (
                <p className="text-sm opacity-70">Analyzing — reading reports and generating clinical summary…</p>
              ) : synthesis ? (
                <>
                  <SynthesizedPanel data={synthesis} />
                  <p className="text-xs opacity-40 mt-6">{wordCount} words · clinical synthesis (no prescription)</p>
                </>
              ) : (
                <p className="text-sm opacity-60">
                  Upload reports/photos and click <strong>Analyze Report</strong> to generate the clinical analysis.
                  No preview runs while typing the patient name.
                </p>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="p-6 rounded-xl border flex items-center gap-4 text-red-500" style={{ borderColor: COLORS.red, backgroundColor: 'rgba(255, 77, 77, 0.1)' }}>
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportAnalyzer;
