import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  // In CI: serve one minimal project first and stop the run if that fails.
  globalSetup: './__tests__/e2e/utils/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // Per test (and per beforeAll). In CI a hung test must not eat the job's budget.
  timeout: process.env.CI ? 5 * 60 * 1000 : 60 * 60 * 1000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
}); 