import { apiRequest, ApiError } from '@/lib/api/client';
import { appEnv } from '@/lib/api/config';
import type { SynthesizedClinicalPayload } from '@/components/reports/SynthesizedClinicalDisplay';

/** Locked for Report Analysis — Python :8005 /api/v3/analyze-report must never enter prescription mode */
export const CLINICAL_OUTPUT_MODE = 'clinical_only' as const;

/** Medical imaging / lab PDFs vs prabhavit ang (affected body part) photos */
export type ReportUploadKind = 'report' | 'bodyPhoto';

export type ReportAnalysisMode =
  | 'photo_temperament'
  | 'medical_report_ocr'
  | 'combined'
  | 'auto';

export interface ReportUploadItem {
  id: string;
  file: File;
  name: string;
  kind: ReportUploadKind;
  sizeBytes: number;
  previewUrl?: string;
}

export interface ReportAnalyzeResult {
  success: boolean;
  message?: string;
  data?: SynthesizedClinicalPayload;
  pipeline?: string;
  output_mode?: string;
  analysis_mode?: ReportAnalysisMode | string;
  eh_engine_online?: boolean;
}

export interface ReportAnalysisOutput {
  analysis: SynthesizedClinicalPayload;
  pipeline: string;
  analysisMode: ReportAnalysisMode | string;
  outputMode: typeof CLINICAL_OUTPUT_MODE;
}

export const FIELD_REPORT_FILES = 'report_files';
export const FIELD_BODY_PHOTOS = 'body_photos';

export const ACCEPT_REPORTS =
  'application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,image/*';
export const ACCEPT_BODY_PHOTOS = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,image/*';

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const PRESCRIPTION_MARKERS =
  /MIXTURE\s+[A-D]|CLINICAL\s+PRESCRIPTION|formula_[abcd]|prescription_id|node-rule|ollama-book|book-rag/i;

/** Force clinical_only on every Report Analysis multipart request */
export function enforceClinicalOutputMode(form: FormData): FormData {
  form.set('output_mode', CLINICAL_OUTPUT_MODE);
  return form;
}

function safeFileName(file: File, kind: ReportUploadKind, index: number) {
  const raw = (file.name || '').trim();
  if (raw) return raw;
  const ext =
    file.type === 'application/pdf'
      ? 'pdf'
      : file.type.includes('png')
        ? 'png'
        : file.type.includes('webp')
          ? 'webp'
          : 'jpg';
  return kind === 'bodyPhoto' ? `body-photo-${index + 1}.${ext}` : `report-${index + 1}.${ext}`;
}

function isLikelyImage(file: File) {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|heic|heif|tiff?)$/i.test(file.name || '');
}

function isLikelyPdfOrImage(file: File) {
  if (file.type === 'application/pdf') return true;
  if (isLikelyImage(file)) return true;
  return /\.pdf$/i.test(file.name || '');
}

export function resolveReportAnalysisMode(files: ReportUploadItem[]): ReportAnalysisMode {
  const hasReports = files.some((f) => f.kind === 'report');
  const hasBody = files.some((f) => f.kind === 'bodyPhoto');
  if (hasBody && !hasReports) return 'photo_temperament';
  if (hasReports && !hasBody) return 'medical_report_ocr';
  if (hasReports && hasBody) return 'combined';
  return 'auto';
}

export function createUploadItem(file: File, kind: ReportUploadKind, index: number): ReportUploadItem {
  const name = safeFileName(file, kind, index);
  const previewUrl =
    kind === 'bodyPhoto' && isLikelyImage(file) ? URL.createObjectURL(file) : undefined;
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    name,
    kind,
    sizeBytes: file.size,
    previewUrl,
  };
}

export function buildReportAnalysisFormData(input: {
  files: ReportUploadItem[];
  patientName: string;
  age: string;
  gender: string;
  bpSystolic: string;
  bpDiastolic: string;
  notes?: string;
  pulse?: string;
  weight?: string;
}): FormData {
  const form = new FormData();
  const analysisMode = resolveReportAnalysisMode(input.files);

  input.files.forEach((item) => {
    const blob = item.file;
    const filename = item.name;
    if (item.kind === 'bodyPhoto') {
      form.append(FIELD_BODY_PHOTOS, blob, filename);
    } else {
      form.append(FIELD_REPORT_FILES, blob, filename);
    }
  });

  form.append('analysis_mode', analysisMode);
  enforceClinicalOutputMode(form);
  form.append('patient_name', input.patientName.trim() || 'Patient');
  form.append('age', input.age || '40');
  form.append('gender', input.gender || 'Male');
  form.append('bp_systolic', input.bpSystolic || '120');
  form.append('bp_diastolic', input.bpDiastolic || '80');
  form.append('condition', 'chronic');

  if (input.weight?.trim()) form.append('weight', input.weight.trim());
  if (input.pulse?.trim()) form.append('pulse', input.pulse.trim());

  const complaint = (input.notes || '').trim();
  if (complaint) {
    form.append('chief_complaint', complaint);
    form.append('symptoms', complaint);
  } else if (input.files.length) {
    form.append('chief_complaint', 'Clinical report / imaging analysis requested');
    form.append('symptoms', 'Clinical report / imaging analysis requested');
  }

  return form;
}

function assertClinicalAnalysisResponse(res: ReportAnalyzeResult, analysis: SynthesizedClinicalPayload) {
  const pipeline = res.pipeline || analysis.pipeline || '';
  if (
    /node-rule|ollama-book|book-rag|node-fallback|9engine-prescribe/i.test(pipeline) ||
    (/9engine-analyze-report/i.test(pipeline) && !/clinical|synthesis/i.test(pipeline))
  ) {
    throw new Error('Prescription pipeline blocked.');
  }

  const impression = analysis.clinicalReport?.overall_clinical_impression || '';
  if (PRESCRIPTION_MARKERS.test(impression)) {
    throw new Error('Response contains prescription content.');
  }
}

/**
 * Report Analysis — single click: Node orchestrates :8001 + :8005 + Claude synthesis.
 */
export async function analyzeClinicalReport(form: FormData): Promise<ReportAnalyzeResult> {
  enforceClinicalOutputMode(form);
  const isLocal = appEnv === 'local';
  return apiRequest<ReportAnalyzeResult>('/api/search/clinical-analysis', {
    method: 'POST',
    body: form,
    timeoutMs: 600_000,
    auth: !isLocal,
  });
}

export async function runReportAnalysis(input: {
  files: ReportUploadItem[];
  patientName: string;
  age: string;
  gender: string;
  bpSystolic: string;
  bpDiastolic: string;
  notes?: string;
}): Promise<ReportAnalysisOutput> {
  if (!input.files.length) {
    throw new Error('No files selected — upload a report or body-part photo first.');
  }

  const analysisMode = resolveReportAnalysisMode(input.files);
  const form = enforceClinicalOutputMode(buildReportAnalysisFormData(input));

  let res: ReportAnalyzeResult;
  try {
    res = await analyzeClinicalReport(form);
  } catch (e) {
    if (e instanceof ApiError) {
      console.error('[reports] API error:', e.status, e.message, e.data);
    }
    throw e;
  }

  const analysis = res.data;
  if (!res.success || !analysis?.clinicalReport?.overall_clinical_impression) {
    console.error('[reports] invalid response:', res);
    throw new Error('Analysis failed — please try again.');
  }

  assertClinicalAnalysisResponse(res, analysis);

  return {
    analysis,
    pipeline: res.pipeline || analysis.pipeline || 'eh-api-claude-synthesis',
    analysisMode: res.analysis_mode || analysisMode,
    outputMode: CLINICAL_OUTPUT_MODE,
  };
}

export function validateReportFile(file: File, kind: ReportUploadKind): string | null {
  if (!file || file.size <= 0) {
    return 'Empty file — please select again.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name || 'File'} exceeds 50 MB limit.`;
  }
  if (kind === 'bodyPhoto') {
    if (!isLikelyImage(file) && file.type !== '') {
      return `${file.name || 'Photo'}: use JPEG, PNG, or WebP images.`;
    }
    return null;
  }
  if (!isLikelyPdfOrImage(file) && file.type !== '') {
    return `${file.name || 'File'}: upload PDF or image reports only.`;
  }
  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function revokeUploadPreviews(items: ReportUploadItem[]) {
  items.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
}
