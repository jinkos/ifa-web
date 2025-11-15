import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// If demo creds are not provided, don't set a storageState path to avoid file-not-found errors.
const hasLoginCreds =
  (!!process.env.DEMO_LOGIN_EMAIL && !!process.env.DEMO_LOGIN_PASSWORD) ||
  (!!process.env.DEMO_EMAIL && !!process.env.DEMO_PASSWORD);
const storageStatePath = hasLoginCreds ? 'playwright/.auth/demo.json' : undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // Only apply storageState when available (created by globalSetup when DEMO creds exist)
    storageState: storageStatePath as any,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  globalSetup: 'tests/e2e/fixtures/auth.setup.ts',
  webServer: {
    command: process.env.PW_USE_DEV ? 'pnpm dev' : 'pnpm build && pnpm start',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
