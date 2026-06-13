'use client';

import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/ui/DashboardPanels';
import SynthesizedClinicalDisplay, {
  type SynthesizedClinicalPayload,
} from '@/components/reports/SynthesizedClinicalDisplay';
import {
  BodyPhotoGalleryZone,
  UploadDropZone,
  useUploadFilesCleanup,
} from '@/components/reports/UploadDropZone';
import { formatTodayDate } from '@/lib/formatDate';
import {
  ACCEPT_BODY_PHOTOS,
  ACCEPT_REPORTS,
  formatFileSize,
  revokeUploadPreviews,
  runReportAnalysis,
  type ReportUploadItem,
} from '@/lib/api/reports';

export default function ReportsPage() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('40');
  const [gender, setGender] = useState('Male');
  const [bpS, setBpS] = useState('120');
  const [bpD, setBpD] = useState('80');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<ReportUploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SynthesizedClinicalPayload | null>(null);

  useUploadFilesCleanup(files);

  const addFiles = useCallback((items: ReportUploadItem[]) => {
    setFiles((prev) => [...prev, ...items]);
  }, []);

  function removeFile(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function clearAllFiles() {
    revokeUploadPreviews(files);
    setFiles([]);
  }

  async function runAnalysis() {
    if (!files.length) {
      setError('Upload at least one medical report (PDF/image) or a body-part photo.');
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);

    try {
      const { analysis } = await runReportAnalysis({
        files,
        patientName: name.trim() || 'Patient',
        age,
        gender,
        bpSystolic: bpS,
        bpDiastolic: bpD,
        notes,
      });
      setResult(analysis);
    } catch (e) {
      console.error('[reports]', e);
      setError('Analysis failed — please try again.');
    } finally {
      setBusy(false);
    }
  }

  const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);

  return (
    <>
      <PageHeader
        title={
          <>
            Report <span>Analysis</span>
          </>
        }
        subtitle="Upload reports or photos — click Analyze Report for clinical synthesis (no prescription)."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Reports · <span>Analysis</span>
          </>
        }
        action={
          <button type="button" className="btn-new" onClick={runAnalysis} disabled={busy || !files.length}>
            {busy ? 'Analyzing…' : 'Analyze Report'}
          </button>
        }
      />

      {error ? <div className="eh-analyze-status error">{error}</div> : null}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📄 Upload for Analysis</div>
            {files.length > 0 ? (
              <button type="button" className="card-action" onClick={clearAllFiles}>
                Clear all
              </button>
            ) : null}
          </div>
          <div className="card-body">
            <UploadDropZone
              kind="report"
              accept={ACCEPT_REPORTS}
              icon="📄"
              title="Lab & imaging reports"
              subtitle="Blood · CBC · LFT · MRI · CT · Sonography · Pathology (PDF or image)"
              files={files}
              onAdd={addFiles}
              onError={setError}
            />

            <div style={{ marginTop: 20 }}>
              <UploadDropZone
                kind="bodyPhoto"
                accept={ACCEPT_BODY_PHOTOS}
                icon="📷"
                title="Prabhavit ang ki photo"
                subtitle="Take a live photo of affected skin, swelling, or lesion"
                capture="environment"
                files={files}
                onAdd={addFiles}
                onError={setError}
              />
              <BodyPhotoGalleryZone files={files} onAdd={addFiles} onError={setError} />
            </div>

            {files.length > 0 && (
              <div className="eh-upload-summary" style={{ marginTop: 16 }}>
                <div className="eh-upload-summary-title">
                  {files.length} file{files.length === 1 ? '' : 's'} ready · {formatFileSize(totalBytes)}
                </div>
                <ul className="eh-upload-queue">
                  {files.map((f) => (
                    <li key={f.id} className="result-card" style={{ marginBottom: 8 }}>
                      <div className="rc-top">
                        <div className="rc-title">
                          {f.kind === 'bodyPhoto' ? '📷 ' : '📄 '}
                          {f.name}
                          <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
                            {formatFileSize(f.sizeBytes)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="s-tag-x"
                          onClick={() => removeFile(f.id)}
                          aria-label={`Remove ${f.name}`}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Patient Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Patient name"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input className="form-input" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Clinical Notes (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Symptoms, history, or report context…"
              />
            </div>

            <button
              type="button"
              className="btn-new"
              style={{ width: '100%', marginTop: 16 }}
              onClick={runAnalysis}
              disabled={busy || !files.length}
            >
              {busy ? 'Analyzing…' : `Analyze Report (${files.length} file${files.length === 1 ? '' : 's'})`}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Clinical Analysis</div>
          </div>
          <div className="card-body">
            {busy ? (
              <p className="eh-analyze-status loading" style={{ margin: 0 }}>
                Analyzing — reading reports and generating clinical summary…
              </p>
            ) : result ? (
              <SynthesizedClinicalDisplay data={result} />
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Upload reports/photos and click <strong>Analyze Report</strong> to generate the clinical
                analysis.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
