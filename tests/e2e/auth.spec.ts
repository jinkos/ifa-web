import { test, expect } from '@playwright/test';

// Support both DEMO_LOGIN_* and DEMO_* env var names
const EMAIL = process.env.DEMO_LOGIN_EMAIL || process.env.DEMO_EMAIL || '';
const PASSWORD = process.env.DEMO_LOGIN_PASSWORD || process.env.DEMO_PASSWORD || '';

function requireEnvCreds() {
  if (!EMAIL || !PASSWORD) {
    test.skip(true, 'Missing DEMO_LOGIN_EMAIL/DEMO_LOGIN_PASSWORD in environment');
  }
}

test.describe('Auth UI flow', () => {
  test('log out via user menu, then log in via sign-in form', async ({ page }) => {
    requireEnvCreds();

    // Go to a protected page; if logged in it will render dashboard, else middleware redirects to /sign-in
    await page.goto('/dashboard');

    // If we are logged in, there should be a user menu trigger; attempt to open it and sign out.
    const userMenuTrigger = page.getByTestId('user-menu-trigger');
    if (await userMenuTrigger.isVisible().catch(() => false)) {
      await userMenuTrigger.click();
      // Click Sign out menu item
      await page.getByTestId('menu-item-sign-out').click();
    }

    // After sign out, navigate to a public page with a visible Sign In header button
    await page.goto('/pricing');

    // If still logged in (no Sign In link), sign out via menu here
    const signInLink = page.getByRole('link', { name: /sign in/i });
    if (!(await signInLink.isVisible().catch(() => false))) {
      if (await userMenuTrigger.isVisible().catch(() => false)) {
        await userMenuTrigger.click();
        await page.getByTestId('menu-item-sign-out').click();
        // Wait for the header to show Sign In
        await signInLink.waitFor({ state: 'visible', timeout: 10000 });
      }
    }

    // Click the "Sign In" link in the header
    await signInLink.click();

    // Fill out the sign in form and submit
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Expect to land in dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
