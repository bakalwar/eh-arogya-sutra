import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREVIEW_CATALOG } from '../../apps/web/src/lib/preview/previewCatalog.ts';
import {
  isLocalPreviewAllowed,
  previewMayCallClinicalEngine,
} from '../../apps/web/src/lib/preview/previewGate.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 5A clinical integration status preview', () => {
  it('catalog includes clinical-integration-status under audit group', () => {
    const item = PREVIEW_CATALOG.find((i) => i.id === 'clinical-integration-status');
    expect(item?.href).toBe('/preview/clinical-integration-status');
    expect(item?.group).toBe('audit');
  });

  it('status page source is non-clinical and gated', () => {
    const page = fs.readFileSync(
      path.join(root, 'apps/web/src/app/preview/clinical-integration-status/page.tsx'),
      'utf8',
    );
    expect(page).toMatch(/isLocalPreviewAllowed/);
    expect(page).toMatch(/AUDIT_ONLY/);
    expect(page).toMatch(/NOT_CONNECTED/);
    expect(page).toMatch(/NOT_USED/);
    expect(page).not.toMatch(/fetch\(|axios|AnalyzeComplete|otp\/request/i);
    expect(previewMayCallClinicalEngine()).toBe(false);
    expect(isLocalPreviewAllowed({ NODE_ENV: 'production' })).toBe(false);
  });

  it('audit docs exist and forbid patient/clinical data copy claims', () => {
    const report = fs.readFileSync(
      path.join(root, 'docs/phase-reports/PHASE_5A_CLINICAL_MIGRATION_AUDIT.md'),
      'utf8',
    );
    expect(report).toMatch(/116,284/);
    expect(report).toMatch(/No clinical code or data was copied/);
    expect(fs.existsSync(path.join(root, 'docs/clinical/nine-rule-engine-matrix.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs/clinical/medicine-registry-audit.md'))).toBe(true);
  });
});
