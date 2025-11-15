import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

export default async function globalSetup(config: FullConfig) {
  const storagePath = path.resolve('playwright/.auth');
  const storageFile = path.join(storagePath, 'demo.json');

  if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = (config.projects[0].use as any).baseURL as string;
  // Support both DEMO_LOGIN_* and DEMO_* env var names
  const email = process.env.DEMO_LOGIN_EMAIL || process.env.DEMO_EMAIL;
  const password = process.env.DEMO_LOGIN_PASSWORD || process.env.DEMO_PASSWORD;

  if (!email || !password) {
    console.warn('[e2e] DEMO_LOGIN_EMAIL/DEMO_LOGIN_PASSWORD (or DEMO_EMAIL/DEMO_PASSWORD) not set; skipping auth and continuing unauthenticated');
    await browser.close();
    return;
  }

  // Go to sign-in page and login
  await page.goto(`${baseURL}/sign-in`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for dashboard home after login
  await page.waitForURL(/\/dashboard(\b|\/)/, { timeout: 30_000 });

  await page.context().storageState({ path: storageFile });
  await browser.close();
}
