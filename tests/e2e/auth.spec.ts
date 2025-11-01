import { test, expect } from '@playwright/test';

const EMAIL = process.env.DEMO_LOGIN_EMAIL || '';
const PASSWORD = process.env.DEMO_LOGIN_PASSWORD || '';

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

    // Click the "Sign In" link in the header
    await page.getByRole('link', { name: 'Sign In' }).click();

    // Fill out the sign in form and submit
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Expect to land in dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Optionally verify the user menu is present again
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
  });
});
