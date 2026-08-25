/**
 * Playwright configuration for the SVG export visual-regression suite.
 */

import { defineConfig, devices } from '@playwright/test';

const port = process.env.E2E_PORT || 8787;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/__output__',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: './playwright-report' }]],
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    screenshot: 'off',
    video: 'off',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `node tests/e2e/server.mjs`,
    url: `http://localhost:${port}/fixture`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
