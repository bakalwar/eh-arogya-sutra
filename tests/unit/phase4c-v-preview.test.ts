import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isLocalPreviewAllowed,
  previewCreatesPrincipal,
  previewCreatesTenantContext,
  previewIssuesSession,
  previewMayCallClinicalEngine,
  previewMayCallPayment,
  previewMayRequestOtp,
  previewMayUploadReports,
  previewMayWritePostgres,
  PREVIEW_WATERMARK,
  queryCannotEnablePreview,
} from '../../apps/web/src/lib/preview/previewGate.ts';
import { PREVIEW_CATALOG } from '../../apps/web/src/lib/preview/previewCatalog.ts';
import {
  doctorNavExcludesManagementAdmin,
  doctorNavExcludesSuperAdmin,
  DOCTOR_NAV_ITEMS,
} from '../../apps/web/src/config/navigation.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 4C-V local preview isolation', () => {
  it('allows preview only in development/test; production blocked', () => {
    expect(isLocalPreviewAllowed({ NODE_ENV: 'development' })).toBe(true);
    expect(isLocalPreviewAllowed({ NODE_ENV: 'test' })).toBe(true);
    expect(isLocalPreviewAllowed({ NODE_ENV: 'production' })).toBe(false);
    expect(isLocalPreviewAllowed({ NODE_ENV: 'development', EHAS2_NODE_ENV: 'production' })).toBe(
      false,
    );
  });

  it('query parameter cannot enable preview', () => {
    expect(queryCannotEnablePreview(new URLSearchParams('preview=1&enablePreview=true'))).toBe(
      true,
    );
    expect(isLocalPreviewAllowed({ NODE_ENV: 'production' })).toBe(false);
  });

  it('preview cannot create Principal, TenantContext, or session', () => {
    expect(previewCreatesPrincipal()).toBe(false);
    expect(previewCreatesTenantContext()).toBe(false);
    expect(previewIssuesSession()).toBe(false);
  });

  it('preview cannot write DB / OTP / engine / upload / payment', () => {
    expect(previewMayWritePostgres()).toBe(false);
    expect(previewMayRequestOtp()).toBe(false);
    expect(previewMayCallClinicalEngine()).toBe(false);
    expect(previewMayUploadReports()).toBe(false);
    expect(previewMayCallPayment()).toBe(false);
  });

  it('watermark and synthetic labels are required', () => {
    expect(PREVIEW_WATERMARK).toMatch(/SYNTHETIC DEMO/);
    expect(PREVIEW_WATERMARK).toMatch(/NOT SAVED/);
  });

  it('doctor nav excludes Management and Super Admin', () => {
    expect(doctorNavExcludesManagementAdmin()).toBe(true);
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href.startsWith('/preview'))).toBe(false);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href.startsWith('/management'))).toBe(false);
  });

  it('management and super-admin preview are separate catalog entries', () => {
    const mgmt = PREVIEW_CATALOG.find((i) => i.id === 'management');
    const sa = PREVIEW_CATALOG.find((i) => i.id === 'super-admin');
    expect(mgmt?.href).toBe('/preview/management');
    expect(sa?.href).toBe('/preview/super-admin');
    expect(mgmt?.shell).toBe('management');
    expect(sa?.shell).toBe('super-admin');
  });

  it('middleware and preview pages enforce production block', () => {
    const mw = fs.readFileSync(path.join(root, 'apps/web/src/middleware.ts'), 'utf8');
    expect(mw).toMatch(/isLocalPreviewAllowed/);
    expect(mw).toMatch(/PREVIEW_NOT_AVAILABLE/);
    expect(mw).not.toMatch(/searchParams\.get\(['"]preview['"]\).*isLocalPreviewAllowed/);
    const gallery = fs.readFileSync(path.join(root, 'apps/web/src/app/preview/page.tsx'), 'utf8');
    expect(gallery).toMatch(/notFound/);
    expect(gallery).toMatch(/isLocalPreviewAllowed/);
  });

  it('production navigation config has no /preview link', () => {
    const nav = fs.readFileSync(path.join(root, 'apps/web/src/config/navigation.ts'), 'utf8');
    expect(nav).not.toMatch(/href:\s*['"]\/preview/);
  });

  it('fixtures remain synthetic-only with no medicine inference', () => {
    const clinical = fs.readFileSync(
      path.join(root, 'apps/web/src/data/syntheticClinicalResults.ts'),
      'utf8',
    );
    expect(clinical).toMatch(/Demo Patient/);
    expect(clinical).not.toMatch(/WE\s*=\s*['"]/);
    expect(clinical).toMatch(/UI does not select medicines/);
    const fixtures = fs.readFileSync(
      path.join(root, 'apps/web/src/data/syntheticPatients.ts'),
      'utf8',
    );
    expect(fixtures).toMatch(/Demo Patient A/);
    expect(fixtures).not.toMatch(/localStorage/);
  });

  it('root package.json forwards npm run dev to web workspace', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.dev).toBe('npm run dev -w eh-arogya-sutra-2-web');
    expect(pkg.scripts['test:browser']).toBe('playwright test -c playwright.config.mjs');
  });
});
