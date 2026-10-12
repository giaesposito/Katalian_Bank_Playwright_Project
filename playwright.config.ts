import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against the local Vite dev server by default (started automatically).
 * Point at any deployment with BASE_URL, e.g.
 *   BASE_URL=https://katalian-banking.vercel.app npx playwright test
 */
const BASE_URL = process.env.BASE_URL ?? 'http://katalian-banking.vercel.app';
const useLocalServer = !process.env.BASE_URL;

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
  webServer: useLocalServer
    ? {
        command: 'npm run dev -- --port 5173 --strictPort',
        cwd: '..',
        url: 'http://katalian-banking.vercel.app',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
});
