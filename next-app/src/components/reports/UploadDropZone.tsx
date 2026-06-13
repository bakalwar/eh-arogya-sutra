'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  ACCEPT_BODY_PHOTOS,
  ACCEPT_REPORTS,
  createUploadItem,
  formatFileSize,
  type ReportUploadItem,
  type ReportUploadKind,
  validateReportFile,
} from '@/lib/api/reports';

type UploadDropZoneProps = {
  kind: ReportUploadKind;
  accept: string;
  icon: string;
  title: string;
  subtitle: string;
  capture?: 'environment' | 'user';
  files: ReportUploadItem[];
  onAdd: (items: ReportUploadItem[]) => void;
  onError: (message: string) => void;
};

export function UploadDropZone({
  kind,
  accept,
  icon,
  title,
  subtitle,
  capture,
  files,
  onAdd,
  onError,
}: UploadDropZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const ingest = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const next: ReportUploadItem[] = [];
      const errors: string[] = [];
      const baseIndex = files.length;

      Array.from(list).forEach((file, i) => {
        const err = validateReportFile(file, kind);
        if (err) {
          errors.push(err);
          return;
        }
        next.push(createUploadItem(file, kind, baseIndex + i));
      });

      if (errors.length) onError(errors.join(' '));
      if (next.length) {
        onAdd(next);
        onError('');
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [files.length, kind, onAdd, onError]
  );

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    ingest(e.dataTransfer.files);
  }

  const zoneFiles = files.filter((f) => f.kind === kind);

  return (
    <div className="eh-upload-block">
      <label
        htmlFor={inputId}
        className={`upload-zone eh-upload-zone${dragOver ? ' eh-upload-zone--active' : ''}`}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="upload-zone-icon">{icon}</div>
        <div className="upload-zone-title">{title}</div>
        <div className="upload-zone-sub">{subtitle}</div>
        <div className="upload-zone-hint">Tap to browse · drag &amp; drop · {zoneFiles.length} selected</div>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        capture={capture}
        className="eh-file-input-hidden"
        onChange={(e) => ingest(e.target.files)}
      />
      {zoneFiles.length > 0 && (
        <ul className="eh-upload-list">
          {zoneFiles.map((f) => (
            <li key={f.id} className="eh-upload-list-item">
              {f.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.previewUrl} alt="" className="eh-upload-thumb" />
              ) : (
                <span className="eh-upload-thumb eh-upload-thumb--doc">📄</span>
              )}
              <div className="eh-upload-meta">
                <div className="eh-upload-name">{f.name}</div>
                <div className="eh-upload-size">{formatFileSize(f.sizeBytes)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Gallery picker (no forced camera) — reliable on iOS/Android */
export function BodyPhotoGalleryZone({
  files,
  onAdd,
  onError,
}: {
  files: ReportUploadItem[];
  onAdd: (items: ReportUploadItem[]) => void;
  onError: (message: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function ingest(list: FileList | null) {
    if (!list?.length) return;
    const next: ReportUploadItem[] = [];
    const errors: string[] = [];
    const baseIndex = files.length;
    Array.from(list).forEach((file, i) => {
      const err = validateReportFile(file, 'bodyPhoto');
      if (err) errors.push(err);
      else next.push(createUploadItem(file, 'bodyPhoto', baseIndex + i));
    });
    if (errors.length) onError(errors.join(' '));
    if (next.length) {
      onAdd(next);
      onError('');
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="eh-upload-gallery-row">
      <label htmlFor={inputId} className="btn-secondary eh-upload-gallery-btn">
        Choose from gallery
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_BODY_PHOTOS}
        multiple
        className="eh-file-input-hidden"
        onChange={(e) => ingest(e.target.files)}
      />
    </div>
  );
}

export function useUploadFilesCleanup(files: ReportUploadItem[]) {
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [files]);
}
