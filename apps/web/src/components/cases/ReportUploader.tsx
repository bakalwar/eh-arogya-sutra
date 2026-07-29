'use client';

import { useId, useRef, useState } from 'react';
import {
  REPORT_CATEGORIES,
  REPORT_STORAGE_BANNER,
  reportUploadConnected,
  revokeObjectUrl,
  validateReportFile,
  type LocalReportFile,
} from '../../lib/case/reportFiles';
import type { ReportCategory } from '../../lib/case/types';
import { Button } from '../ui/Button';
import { SelectedReportCard } from './SelectedReportCard';

export function ReportUploader({
  reports,
  onChange,
}: {
  reports: LocalReportFile[];
  onChange: (next: LocalReportFile[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [category, setCategory] = useState<ReportCategory>('blood-lab');
  const [message, setMessage] = useState<string | undefined>();
  const [dragging, setDragging] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next = [...reports];
    let lastError: string | undefined;
    for (const file of Array.from(fileList)) {
      const result = validateReportFile(file, next, category);
      if (!result.ok) {
        lastError = result.message;
        continue;
      }
      const objectUrl = result.meta.previewKind === 'image' ? URL.createObjectURL(file) : undefined;
      next.push({ ...result.meta, objectUrl });
    }
    onChange(next);
    setMessage(lastError);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeReport(id: string) {
    const target = reports.find((r) => r.id === id);
    revokeObjectUrl(target?.objectUrl);
    onChange(reports.filter((r) => r.id !== id));
  }

  function replaceReport(id: string, fileList: FileList | null) {
    if (!fileList?.[0]) return;
    const file = fileList[0];
    const without = reports.filter((r) => r.id !== id);
    const result = validateReportFile(file, without, category);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const old = reports.find((r) => r.id === id);
    revokeObjectUrl(old?.objectUrl);
    const objectUrl = result.meta.previewKind === 'image' ? URL.createObjectURL(file) : undefined;
    onChange([...without, { ...result.meta, objectUrl }]);
    setMessage(undefined);
  }

  return (
    <section className="ehas2-uploader" aria-label="Report uploader">
      <p className="ehas2-preview-banner" role="status">
        ◇ {REPORT_STORAGE_BANNER} Upload connected: {String(reportUploadConnected())}.
      </p>
      <div className="ehas2-field">
        <label htmlFor="report-category">Report category</label>
        <select
          id="report-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ReportCategory)}
        >
          {REPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div
        className={`ehas2-dropzone${dragging ? ' ehas2-dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <p>Drag and drop PDF/JPG/PNG here, or choose files / camera on phone.</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
          capture="environment"
          multiple
          onChange={(e) => addFiles(e.target.files)}
        />
        <label htmlFor={inputId} className="ehas2-btn ehas2-btn--secondary">
          Select files
        </label>
      </div>
      {message ? (
        <p className="ehas2-field__error" role="alert">
          {message}
        </p>
      ) : null}
      <ul className="ehas2-report-list">
        {reports.map((report) => (
          <li key={report.id}>
            <SelectedReportCard
              report={report}
              onRemove={() => removeReport(report.id)}
              onReplace={(files) => replaceReport(report.id, files)}
            />
          </li>
        ))}
      </ul>
      {reports.length === 0 ? (
        <p role="status">No reports selected. Reports are optional in this preview.</p>
      ) : null}
      <Button type="button" variant="ghost" disabled>
        Retry upload (NOT_CONNECTED)
      </Button>
    </section>
  );
}

export { SelectedReportCard };
