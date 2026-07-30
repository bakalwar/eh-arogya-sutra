import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOCTOR_NAV_ITEMS,
  doctorNavExcludesSuperAdmin,
} from '../../apps/web/src/config/navigation.ts';
import {
  statusLabelsAreTruthful,
  SYSTEM_STATUS_LABELS,
} from '../../apps/web/src/config/systemStatus.ts';
import {
  brandAssets,
  qaWidths,
  touchTargetMinPx,
} from '../../packages/design-system/src/tokens.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 1B navigation and status', () => {
  it('doctor navigation excludes Super Admin and security center', () => {
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.map((i) => i.label)).toEqual([
      'Dashboard',
      'New Case',
      'Patients',
      'Reports',
      'Prescriptions',
      'Medicines',
      'Feedback & Support',
      'My Profile',
      'Clinic Settings',
    ]);
    expect(DOCTOR_NAV_ITEMS[0]?.href).toBe('/dashboard');
  });

  it('keeps truthful system status labels', () => {
    expect(statusLabelsAreTruthful(SYSTEM_STATUS_LABELS)).toBe(true);
    expect(SYSTEM_STATUS_LABELS.join(' ')).toMatch(/Not Connected/);
    expect(SYSTEM_STATUS_LABELS.join(' ')).toMatch(/Not Installed/);
    expect(SYSTEM_STATUS_LABELS.join(' ')).toMatch(/Preview Only|Not Active/);
  });

  it('defines desktop, tablet, and mobile nav targets via single config', () => {
    expect(DOCTOR_NAV_ITEMS.length).toBeGreaterThanOrEqual(4);
    expect(
      DOCTOR_NAV_ITEMS.every(
        (i) =>
          i.href.startsWith('/dashboard') ||
          i.href.startsWith('/patients') ||
          i.href.startsWith('/cases') ||
          i.href.startsWith('/prescriptions') ||
          i.href.startsWith('/feedback') ||
          i.href.startsWith('/profile') ||
          i.href.startsWith('/clinic'),
      ),
    ).toBe(true);
  });
});

describe('Phase 1B assets and a11y foundations', () => {
  it('logo uses extracted public asset path (not base64)', () => {
    expect(brandAssets.logoPath).toBe('/brand/ehas2-logo.png');
    const logoFile = path.join(root, 'apps/web/public/brand/ehas2-logo.png');
    expect(fs.existsSync(logoFile)).toBe(true);
  });

  it('application source does not embed base64 logo blobs', () => {
    const scanRoots = [
      path.join(root, 'apps/web/src'),
      path.join(root, 'packages/design-system/src'),
    ];
    const bad: string[] = [];
    for (const dir of scanRoots) {
      for (const file of walk(dir)) {
        if (!/\.(ts|tsx|css|js|mjs)$/.test(file)) continue;
        const text = fs.readFileSync(file, 'utf8');
        if (text.includes('data:image') || /base64,[A-Za-z0-9+/]{200,}/.test(text)) {
          bad.push(path.relative(root, file));
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('shell CSS enforces 44px touch targets and skip link', () => {
    const css = fs.readFileSync(path.join(root, 'apps/web/src/styles/shell.css'), 'utf8');
    expect(css).toContain('--ehas2-touch-min');
    expect(css).toContain('ehas2-skip');
    expect(css).toContain('prefers-reduced-motion');
    expect(touchTargetMinPx).toBe(44);
  });

  it('documents required QA widths', () => {
    expect(qaWidths).toEqual([320, 360, 390, 430, 768, 1024, 1280, 1366, 1440, 1920]);
  });

  it('public and doctor shells remain distinct modules', () => {
    expect(fs.existsSync(path.join(root, 'apps/web/src/components/shell/PublicShell.tsx'))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(root, 'apps/web/src/components/shell/DoctorShell.tsx'))).toBe(
      true,
    );
    const doctor = fs.readFileSync(
      path.join(root, 'apps/web/src/components/shell/DoctorShell.tsx'),
      'utf8',
    );
    expect(doctor).toMatch(/DesktopSidebar|MobileBottomNav|TabletNavigation/);
    expect(doctor).not.toMatch(/SuperAdmin/);
  });

  it('ui foundation page includes Hindi sample and preview banner', () => {
    const page = fs.readFileSync(
      path.join(root, 'apps/web/src/app/ui-foundation/page.tsx'),
      'utf8',
    );
    expect(page).toMatch(/DESIGN SYSTEM PREVIEW/);
    expect(page).toMatch(/नमस्ते|आरोग्य/);
  });
});

function walk(dir: string, out: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
