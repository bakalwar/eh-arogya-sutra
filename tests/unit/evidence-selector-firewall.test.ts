import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLINICAL_AUTHORITY_F1,
  EXTRACTION_STATUS_F1,
  SELECTOR_FORBIDDEN_FIELD_NAMES,
} from '../../packages/evidence-ingest/src/index.ts';
import {
  CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES,
  EVIDENCE_OCR_ADAPTER_CONNECTED,
} from '../../packages/evidence-extract/src/index.ts';
import { reportUploadConnected } from '../../apps/web/src/lib/case/reportFiles.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('evidence selector firewall', () => {
  it('keeps originals non-authoritative and extraction unauthorized', () => {
    expect(CLINICAL_AUTHORITY_F1).toBe('NOT_AUTHORITATIVE');
    expect(EXTRACTION_STATUS_F1).toBe('NOT_AUTHORIZED');
  });

  it('does not declare selector fields on evidence metadata', () => {
    const types = read('packages/evidence-ingest/src/types.ts');
    const metaStart = types.indexOf('export type EvidenceMetadata');
    const meta = types.slice(
      metaStart,
      types.indexOf('export const SELECTOR_FORBIDDEN', metaStart),
    );
    expect(meta).toContain('export type EvidenceMetadata');
    for (const field of SELECTOR_FORBIDDEN_FIELD_NAMES) {
      expect(meta).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('evidence-ingest and F1/F2A routes do not import rules, OCR, or analyzeComplete', () => {
    const files = [
      ...fs
        .readdirSync(path.join(root, 'packages/evidence-ingest/src'))
        .filter((f) => f.endsWith('.ts') && f !== 'types.ts')
        .map((f) => `packages/evidence-ingest/src/${f}`),
      'packages/database/src/services/evidenceService.ts',
      'packages/database/src/repositories/evidence.ts',
      'apps/api/src/routes/evidence.ts',
      'apps/api/src/http/streamBody.ts',
      'apps/api/src/middleware/uploadLimits.ts',
      'apps/worker/src/index.ts',
      'apps/worker/src/jobs/evidenceRetention.ts',
      'apps/worker/src/jobs/evidencePoller.ts',
      'packages/observability/src/evidenceMetrics.ts',
    ];
    const blob = files.map(read).join('\n');
    expect(blob).not.toMatch(/@ehas2\/rule[1-9]/);
    expect(blob).not.toMatch(/tesseract|pdf-parse|analyzeComplete/i);
    expect(blob).not.toMatch(/evaluateRule[1-9]/);
    expect(blob).toMatch(/EVIDENCE_OCR_CONNECTED = false/);
  });

  it('web case uploader remains disconnected', () => {
    expect(reportUploadConnected()).toBe(false);
    const uploader = read('apps/web/src/components/cases/ReportUploader.tsx');
    expect(uploader).not.toMatch(/fetch\(|XMLHttpRequest|axios/);
  });

  it('F3A candidate DTO and extract package stay selector-firewalled', () => {
    expect(EVIDENCE_OCR_ADAPTER_CONNECTED).toBe(false);
    const dto = read('packages/evidence-extract/src/types.ts');
    const start = dto.indexOf('export type ExtractionCandidateDto');
    const slice = dto.slice(start, dto.indexOf('export type ExtractionRequest', start));
    for (const field of CANDIDATE_SELECTOR_FORBIDDEN_FIELD_NAMES) {
      expect(slice).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
    const extractSrc = fs
      .readdirSync(path.join(root, 'packages/evidence-extract/src'))
      .filter((f) => f.endsWith('.ts') && f !== 'types.ts')
      .map((f) => read(`packages/evidence-extract/src/${f}`))
      .join('\n');
    expect(extractSrc).not.toMatch(/@ehas2\/rule[1-9]/);
    expect(extractSrc).not.toMatch(/tesseract|pdf-parse|pdfjs|analyzeComplete|LibreTranslate/i);
    expect(extractSrc).not.toMatch(/evaluateRule[1-9]/);
    expect(extractSrc).not.toMatch(/\baffectsClinicalSelection\s*:\s*true\b/);
  });

  it('F3C review paths stay selector-firewalled and candidate-immutable', () => {
    const review = read('packages/database/src/repositories/candidateReview.ts');
    expect(review).not.toMatch(/UPDATE clinical_evidence_extraction_candidates/i);
    expect(review).not.toMatch(/@ehas2\/rule[1-9]/);
    expect(review).toMatch(/clinically_used',\s*$|clinically_used/i);
    expect(review).toMatch(/false/);
  });
});
