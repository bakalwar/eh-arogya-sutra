import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOCTOR_NAV_ITEMS,
  doctorNavExcludesManagementAdmin,
  doctorNavExcludesSuperAdmin,
  isDoctorAreaPath,
} from '../../apps/web/src/config/navigation.ts';
import { SYNTHETIC_DEMO_PROFILE } from '../../apps/web/src/lib/profileApi.ts';
import { qaWidths, touchTargetMinPx } from '../../packages/design-system/src/tokens.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 3D profile UI foundations', () => {
  it('doctor nav shows My Profile and Clinic Settings without admin planes', () => {
    expect(DOCTOR_NAV_ITEMS.some((i) => i.label === 'My Profile' && i.href === '/profile')).toBe(
      true,
    );
    expect(
      DOCTOR_NAV_ITEMS.some((i) => i.label === 'Clinic Settings' && i.href === '/clinic/settings'),
    ).toBe(true);
    expect(doctorNavExcludesManagementAdmin()).toBe(true);
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(
      DOCTOR_NAV_ITEMS.some((i) => /management|super.?admin|finance|security/i.test(i.label)),
    ).toBe(false);
  });

  it('profile and clinic routes exist and stay truthful about NOT_CONNECTED', () => {
    const pages = [
      'apps/web/src/app/profile/page.tsx',
      'apps/web/src/app/profile/edit/page.tsx',
      'apps/web/src/app/profile/qualifications/page.tsx',
      'apps/web/src/app/profile/registrations/page.tsx',
      'apps/web/src/app/profile/prescriber-preview/page.tsx',
      'apps/web/src/app/clinic/settings/page.tsx',
      'apps/web/src/app/clinic/hours/page.tsx',
      'apps/web/src/app/clinic/team/page.tsx',
    ];
    for (const rel of pages) {
      expect(fs.existsSync(path.join(root, rel))).toBe(true);
    }
    const shell = fs.readFileSync(
      path.join(root, 'apps/web/src/components/profile/ProfileShell.tsx'),
      'utf8',
    );
    const pagesSrc = fs.readFileSync(
      path.join(root, 'apps/web/src/components/profile/ProfilePages.tsx'),
      'utf8',
    );
    expect(shell).toMatch(/NOT_CONNECTED/);
    expect(shell).toMatch(/AUTH_NOT_CONNECTED/);
    expect(pagesSrc).toMatch(/NOT_CONNECTED/);
    expect(pagesSrc).not.toMatch(/localStorage/);
    expect(SYNTHETIC_DEMO_PROFILE.label).toBe('SYNTHETIC_DEMO');
    expect(isDoctorAreaPath('/profile')).toBe(true);
    expect(isDoctorAreaPath('/clinic/hours')).toBe(true);
  });

  it('responsive QA widths and touch targets remain defined for profile layouts', () => {
    expect(qaWidths).toEqual(
      expect.arrayContaining([320, 360, 390, 430, 768, 1024, 1366, 1440, 1920]),
    );
    expect(touchTargetMinPx).toBeGreaterThanOrEqual(44);
    const css = fs.readFileSync(path.join(root, 'apps/web/src/styles/shell.css'), 'utf8');
    expect(css).toMatch(/ehas2-profile-subnav/);
    expect(css).toMatch(/430px/);
  });

  it('does not embed console.error spam markers or fake success toasts in profile UI', () => {
    const pagesSrc = fs.readFileSync(
      path.join(root, 'apps/web/src/components/profile/ProfilePages.tsx'),
      'utf8',
    );
    expect(pagesSrc).not.toMatch(/toast\.success|Saved successfully|console\.error\(/);
    expect(pagesSrc).toMatch(/blocked · NOT_CONNECTED|NOT_CONNECTED —/);
  });
});
