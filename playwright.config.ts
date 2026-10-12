import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against the hosted app by default.
 * Point at any other deployment with BASE_URL, e.g. a local dev server:
 *   BASE_URL=http://localhost:5173 npx playwright test
 */
const BASE_URL = process.env.BASE_URL ?? 'https://katalian-banking.vercel.app';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    // Balances are rendered with toLocaleString(undefined, ...), so pin the locale.
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
