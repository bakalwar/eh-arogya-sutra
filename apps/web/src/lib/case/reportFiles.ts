import type { ReportCategory, ReportSelectionMetadata } from './types';

export const REPORT_STORAGE_BANNER = 'Report storage and analysis are not connected.' as const;

export const MAX_REPORT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);
export const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']);

export const REPORT_CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: 'blood-lab', label: 'Blood/Lab' },
  { id: 'usg', label: 'USG' },
  { id: 'xray', label: 'X-ray' },
  { id: 'mri', label: 'MRI' },
  { id: 'ct', label: 'CT' },
  { id: 'clinical-image', label: 'Clinical Image' },
  { id: 'other', label: 'Other' },
];

export type LocalReportFile = ReportSelectionMetadata & {
  objectUrl?: string;
};

export type ReportValidationResult =
  { ok: true; meta: ReportSelectionMetadata } | { ok: false; message: string };

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? (parts.at(-1) ?? '') : '';
}

function safeDisplayName(name: string): string {
  return name.replace(/[<>]/g, '').slice(0, 120) || 'selected-file';
}

function mimeMatchesExtension(mime: string, ext: string): boolean {
  if (ext === 'pdf') return mime === 'application/pdf' || mime === '';
  if (ext === 'png') return mime === 'image/png' || mime === '';
  if (ext === 'jpg' || ext === 'jpeg') {
    return mime === 'image/jpeg' || mime === 'image/jpg' || mime === '';
  }
  return false;
}

export function validateReportFile(
  file: { name: string; type: string; size: number },
  existing: ReportSelectionMetadata[],
  category: ReportCategory,
): ReportValidationResult {
  const ext = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, message: 'Unsupported file type. Use PDF, JPG, JPEG, or PNG.' };
  }
  if (file.type && !ALLOWED_MIME.has(file.type) && file.type !== 'image/jpg') {
    return { ok: false, message: 'MIME type is not allowed for report preview.' };
  }
  if (file.size <= 0) {
    return { ok: false, message: 'File appears empty.' };
  }
  if (file.size > MAX_REPORT_BYTES) {
    return { ok: false, message: 'File is too large (max 10 MB in this preview).' };
  }
  const displayName = safeDisplayName(file.name);
  const duplicate = existing.some(
    (r) => r.displayName === displayName && r.sizeBytes === file.size,
  );
  if (duplicate) {
    return { ok: false, message: 'Duplicate file selection detected.' };
  }
  const consistent = mimeMatchesExtension(file.type, ext);
  const previewKind =
    ext === 'pdf'
      ? 'pdf-placeholder'
      : ext === 'png' || ext === 'jpg' || ext === 'jpeg'
        ? 'image'
        : 'unsupported';
  return {
    ok: true,
    meta: {
      id: `syn-report-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      displayName,
      category,
      mimeType: file.type || 'application/octet-stream',
      extension: ext,
      sizeBytes: file.size,
      previewKind,
      mimeExtensionConsistent: consistent,
    },
  };
}

export function revokeObjectUrl(url?: string): void {
  if (url) URL.revokeObjectURL(url);
}

export function clearLocalReports(reports: LocalReportFile[]): void {
  for (const report of reports) revokeObjectUrl(report.objectUrl);
}

/** Explicitly no network upload in Phase 1C-B. */
export function reportUploadConnected(): false {
  return false;
}
