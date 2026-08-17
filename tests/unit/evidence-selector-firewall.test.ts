import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLINICAL_AUTHORITY_F1,
  EXTRACTION_STATUS_F1,
  SELECTOR_FORBIDDEN_FIELD_NAMES,
} from '../../packages/evidence-ingest/src/index.ts';
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

  it('evidence-ingest and F1 routes do not import rules, OCR, or analyzeComplete', () => {
    const files = [
      'packages/evidence-ingest/src/index.ts',
      'packages/evidence-ingest/src/validateFile.ts',
      'packages/evidence-ingest/src/objectStore.ts',
      'packages/evidence-ingest/src/malwareScan.ts',
      'packages/database/src/services/evidenceService.ts',
      'apps/api/src/routes/evidence.ts',
      'apps/worker/src/jobs/evidenceRetention.ts',
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
});
