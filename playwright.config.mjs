import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const auditDir = path.join(os.tmpdir(), 'ehas2_phase4c_v_audit');
const PORT = Number(process.env.EHAS2_PREVIEW_PORT || 4101);
const baseURL = `http://127.0.0.1:${PORT}`;
const nodeBin = process.execPath;

/** Isolated Playwright config — JS to avoid root TS project-references loader issues. */
export default defineConfig({
  testDir: path.join(root, 'tests/browser'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(auditDir, 'playwright-report') }],
  ],
  outputDir: path.join(auditDir, 'test-results'),
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  webServer: {
    // Explicit -p avoids clashing with apps/web "next dev -p 4101" when using an alternate port.
    command: `"${nodeBin}" "${path.join(root, 'node_modules/next/dist/bin/next')}" dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI && PORT === 4101,
    timeout: 180_000,
    cwd: path.join(root, 'apps/web'),
    env: {
      ...process.env,
      PATH: `${path.dirname(nodeBin)}${path.delimiter}${process.env.PATH || ''}`,
      NODE_ENV: 'development',
      EHAS2_NODE_ENV: 'development',
      PORT: String(PORT),
    },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
