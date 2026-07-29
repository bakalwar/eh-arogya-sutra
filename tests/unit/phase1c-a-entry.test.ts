import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOCTOR_NAV_ITEMS,
  doctorNavExcludesSuperAdmin,
  QUICK_ACTIONS,
} from '../../apps/web/src/config/navigation.ts';
import {
  DASHBOARD_INTEGRATION_STATUS,
  statusLabelsAreTruthful,
  SYSTEM_STATUS_LABELS,
} from '../../apps/web/src/config/systemStatus.ts';
import {
  createLocalSupportId,
  isUniversalOtp,
  maskMobile,
  normalizeIndianMobile,
  UI_PREVIEW_CONTINUE_LABEL,
  validateIndianMobile,
  applyOtpPaste,
} from '../../apps/web/src/lib/authPreview.ts';
import { brandAssets } from '../../packages/design-system/src/tokens.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 1C-A auth preview', () => {
  it('validates Indian mobile numbers', () => {
    expect(validateIndianMobile('9876543210').ok).toBe(true);
    expect(validateIndianMobile('123').ok).toBe(false);
    expect(normalizeIndianMobile('+91-98765-43210')).toBe('9876543210');
  });

  it('masks mobile and rejects universal OTP', () => {
    expect(maskMobile('9876543210')).toBe('98••••••10');
    expect(isUniversalOtp('123456')).toBe(true);
    expect(isUniversalOtp('482913')).toBe(false);
  });

  it('parses OTP paste into six slots without accepting non-digits', () => {
    expect(applyOtpPaste('48-29-13')).toEqual(['4', '8', '2', '9', '1', '3']);
    expect(applyOtpPaste('12')).toEqual(['1', '2', '', '', '', '']);
    expect(applyOtpPaste('abcdef')).toEqual(['', '', '', '', '', '']);
  });

  it('preview continue label cannot be mistaken for production auth', () => {
    expect(UI_PREVIEW_CONTINUE_LABEL.toLowerCase()).toContain('not real authentication');
  });

  it('does not store credentials or OTP constants in source', () => {
    const auth = fs.readFileSync(path.join(root, 'apps/web/src/lib/authPreview.ts'), 'utf8');
    expect(auth).not.toMatch(/password\s*=/);
    expect(auth).not.toMatch(/OTP_SECRET|UNIVERSAL_OTP\s*=\s*['"]/);
  });
});

describe('Phase 1C-A dashboard truthfulness', () => {
  it('keeps truthful integration statuses and zero-friendly labels', () => {
    expect(statusLabelsAreTruthful(SYSTEM_STATUS_LABELS)).toBe(true);
    expect(DASHBOARD_INTEGRATION_STATUS.every((s) => /not |preview/i.test(s.value))).toBe(true);
  });

  it('quick actions include live clinical UX routes and deferred placeholders', () => {
    expect(QUICK_ACTIONS.find((a) => a.id === 'new-case')?.href).toBe('/cases/new');
    expect(QUICK_ACTIONS.find((a) => a.id === 'patients')?.href).toBe('/patients');
    expect(QUICK_ACTIONS.find((a) => a.id === 'prescriptions')?.href).toBe('/prescriptions');
    expect(QUICK_ACTIONS.find((a) => a.id === 'reports')?.href.includes('/coming/')).toBe(true);
  });

  it('doctor navigation excludes Super Admin and /ops', () => {
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href === '/dashboard')).toBe(true);
  });

  it('problem report privacy defaults exist in component', () => {
    const src = fs.readFileSync(
      path.join(root, 'apps/web/src/components/dashboard/ProblemReportDialog.tsx'),
      'utf8',
    );
    expect(src).toMatch(/Support service is not connected/);
    expect(src).toMatch(/NOT_CONNECTED/);
    expect(src).toMatch(/patient names/);
    expect(createLocalSupportId().startsWith('SUP-PREV-')).toBe(true);
  });

  it('uses optimized logo asset with explicit dimensions', () => {
    expect(brandAssets.logoPath).toBe('/brand/ehas2-logo.png');
    expect(brandAssets.logoWidth).toBe(512);
    expect(fs.existsSync(path.join(root, 'apps/web/public/brand/ehas2-logo.png'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'apps/web/public/brand/ehas2-logo.original.png'))).toBe(
      true,
    );
    const opt = fs.statSync(path.join(root, 'apps/web/public/brand/ehas2-logo.png')).size;
    const orig = fs.statSync(path.join(root, 'apps/web/public/brand/ehas2-logo.original.png')).size;
    expect(opt).toBeLessThan(orig);
  });

  it('fixtures remain synthetic-only', () => {
    const fixtures = path.join(root, 'fixtures');
    const text = walk(fixtures)
      .map((f) => fs.readFileSync(f, 'utf8'))
      .join('\n');
    expect(text).not.toMatch(/Irfaz Khan/i);
    expect(text.toLowerCase()).not.toMatch(/live clinical record dump/);
  });
});

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
