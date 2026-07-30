import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLocalPreviewAllowed } from '../../apps/web/src/lib/preview/previewGate.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 4C-V production preview isolation (source)', () => {
  it('production build gate denies preview', () => {
    expect(isLocalPreviewAllowed({ NODE_ENV: 'production' })).toBe(false);
  });

  it('production sources do not include preview bypass via query', () => {
    const mw = fs.readFileSync(path.join(root, 'apps/web/src/middleware.ts'), 'utf8');
    expect(mw).not.toMatch(/enablePreview\s*===?\s*['"]1['"]/);
    expect(mw).not.toMatch(/searchParams\.get\([^)]+\)\s*&&\s*isLocalPreviewAllowed/);
    // Gate is env-only.
    expect(mw).toMatch(/isLocalPreviewAllowed\(process\.env\)/);
  });

  it('DoctorShell source has no Management/Super Admin preview links', () => {
    const shell = fs.readFileSync(
      path.join(root, 'apps/web/src/components/shell/DoctorShell.tsx'),
      'utf8',
    );
    const nav = fs.readFileSync(
      path.join(root, 'apps/web/src/components/shell/DoctorNavigation.tsx'),
      'utf8',
    );
    expect(shell + nav).not.toMatch(/\/preview\/management|\/preview\/super-admin|\/ops/);
  });
});
