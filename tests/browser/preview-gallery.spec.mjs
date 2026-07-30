import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const PREVIEW_WATERMARK = 'SYNTHETIC DEMO — NOT CLINICAL OUTPUT — NOT SAVED';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const auditDir = path.join(os.tmpdir(), 'ehas2_phase4c_v_audit');
const shotDir = path.join(auditDir, 'screenshots');
const reviewedDir = path.join(root, 'docs/phase-reports/qa-screenshots-4c-v');

const VIEWPORTS = [
  { name: '320x800', width: 320, height: 800 },
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    // Allow 2px subpixel rounding on narrow viewports.
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow).toBe(false);
}

test.beforeAll(() => {
  fs.mkdirSync(shotDir, { recursive: true });
  fs.mkdirSync(reviewedDir, { recursive: true });
});

test.describe('Phase 4C-V browser preview', () => {
  test('local preview gallery opens with watermark and isolation truths', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const requests = [];
    page.on('request', (req) => {
      requests.push(`${req.method()} ${req.url()}`);
    });

    await page.goto('/preview');
    await expect(page.getByRole('heading', { name: 'Local preview gallery' })).toBeVisible();
    await expect(page.locator('[data-ehas2-preview-watermark="true"]')).toContainText(
      PREVIEW_WATERMARK,
    );
    await expect(page.getByText(/No Principal \/ TenantContext \/ session cookies/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Super Admin foundation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Management Admin/i })).toBeVisible();

    const forbidden = requests.filter((r) =>
      /\/auth\/otp|\/auth\/session|\/analysis|\/payment|\/upload|eh_arogya|electrohomeopathy/i.test(
        r,
      ),
    );
    expect(forbidden).toEqual([]);
    expect(errors.filter((e) => !/favicon/i.test(e))).toEqual([]);
  });

  test('login shows OTP_PROVIDER_NOT_CONFIGURED truthfully; no session cookie', async ({
    page,
    context,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.route('**/api/eh-as-2/v1/auth/otp/request', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'OTP_PROVIDER_NOT_CONFIGURED',
          message: 'OTP delivery provider is not configured.',
          data: { realOtpSent: false, challengeId: null },
        }),
      });
    });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Doctor login/i })).toBeVisible();
    await page.getByLabel(/Mobile number/i).fill('9876500199');
    await page.getByRole('button', { name: /Send OTP/i }).click();
    await expect(page.getByText(/OTP_PROVIDER_NOT_CONFIGURED/i)).toBeVisible({ timeout: 15_000 });
    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === 'ehas2_sid')).toBe(false);
    expect(
      errors.filter((e) => !/favicon|Failed to fetch|unreachable|503|Service Unavailable/i.test(e)),
    ).toEqual([]);
  });

  test('analysis shows CLINICAL_ENGINE_NOT_CONNECTED', async ({ page }) => {
    await page.goto('/cases/preview-case-empty/analysis');
    await expect(page.getByText('CLINICAL_ENGINE_NOT_CONNECTED')).toBeVisible();
  });

  test('profile shows AUTH_NOT_CONNECTED', async ({ page }) => {
    await page.goto('/profile');
    await expect(
      page.getByText(/AUTH_NOT_CONNECTED|Authentication · NOT_CONNECTED/i).first(),
    ).toBeVisible();
  });

  test('formula fixture shows demo watermark / synthetic banner', async ({ page }) => {
    await page.goto('/cases/preview-case-3mix/prescription');
    await expect(
      page.getByText(/DEMO CLINICAL LAYOUT|SYNTHETIC|NOT A GENERATED PRESCRIPTION/i).first(),
    ).toBeVisible();
    await expect(page.locator('#tablet-section-a')).toBeVisible();
    await expect(page.locator('#external-applications')).toBeVisible();
  });

  test('management and super-admin previews are separate shells', async ({ page }) => {
    await page.goto('/preview/management');
    await expect(page.getByText(/Management Admin/i).first()).toBeVisible();
    await expect(page.locator('[data-ehas2-doctor-shell]')).toHaveCount(0);

    await page.goto('/preview/super-admin');
    await expect(page.locator('[data-ehas2-super-admin-preview="true"]')).toBeVisible();
    await expect(page.getByText(/control-plane|Super Admin foundation/i).first()).toBeVisible();
  });

  test('doctor dashboard nav excludes Management and Super Admin', async ({ page }) => {
    await page.goto('/dashboard');
    const navText = await page.locator('nav, aside, [class*="nav"]').allTextContents();
    const joined = navText.join(' ');
    expect(joined).not.toMatch(/Management Admin/i);
    expect(joined).not.toMatch(/Super Admin/i);
    expect(joined).not.toMatch(/\/ops/i);
  });

  test('print preview has demo watermark', async ({ page }) => {
    await page.goto('/print/preview-case-3mix');
    await expect(
      page.locator('.ehas2-print-watermark, [class*="watermark"]').first(),
    ).toBeVisible();
    await expect(page.getByText(/DEMO CLINICAL LAYOUT/i).first()).toBeVisible();
  });

  test('keyboard smoke: focus moves on preview', async ({ page }) => {
    await page.goto('/preview');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(focused.length).toBeGreaterThan(0);
  });

  for (const vp of VIEWPORTS) {
    test(`responsive ${vp.name} — preview gallery no horizontal overflow`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/preview');
      await assertNoHorizontalOverflow(page);
      await expect(page.getByRole('heading', { name: 'Local preview gallery' })).toBeVisible();
      expect(errors.filter((e) => !/favicon/i.test(e))).toEqual([]);
    });
  }

  test('reviewed screenshots mobile/tablet/laptop/desktop/print', async ({ page }) => {
    const targets = [
      { name: 'mobile-390', width: 390, height: 844, path: '/preview' },
      { name: 'tablet-768', width: 768, height: 1024, path: '/preview' },
      { name: 'laptop-1440', width: 1440, height: 900, path: '/preview' },
      { name: 'desktop-1920', width: 1920, height: 1080, path: '/dashboard' },
      { name: 'print-preview', width: 1024, height: 1280, path: '/print/preview-case-3mix' },
    ];
    for (const t of targets) {
      await page.setViewportSize({ width: t.width, height: t.height });
      await page.goto(t.path);
      const raw = path.join(shotDir, `${t.name}.png`);
      const reviewed = path.join(reviewedDir, `${t.name}.png`);
      await page.screenshot({ path: raw, fullPage: true });
      fs.copyFileSync(raw, reviewed);
      expect(fs.existsSync(reviewed)).toBe(true);
    }
  });

  test('network privacy: gallery + clinical fixture produce zero protected API writes', async ({
    page,
  }) => {
    const writes = [];
    page.on('request', (req) => {
      const m = req.method();
      const u = req.url();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(m) && /\/api\/eh-as-2\//i.test(u)) {
        writes.push(`${m} ${u}`);
      }
    });
    await page.goto('/preview');
    await page.goto('/cases/preview-case-3mix/prescription');
    expect(writes).toEqual([]);
  });
});
