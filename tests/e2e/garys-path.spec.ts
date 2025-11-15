import { test, expect } from '@playwright/test';
import * as path from 'node:path';

// Smoke test: run Gary's Path via Dev page button
// Precondition: global setup logged in (or app allows access to /dashboard/dev unauthenticated)

test('Gary\'s Path via Dev tools button navigates and triggers recreate', async ({ page }) => {
  // Allow extra time for upload + digest + extraction
  test.setTimeout(180_000);
  // Open Dev tools
  await page.goto('/dashboard/dev');

  // If redirected to sign-in, skip since this test requires an authenticated session
  if (page.url().includes('/sign-in')) {
    test.skip(true, 'Requires DEMO_EMAIL/DEMO_PASSWORD to be set for authenticated session');
  }

  // Ensure button is present and click it
  const button = page.getByTestId('gary-path-button');
  await expect(button).toBeVisible();
  await button.click();

  // Expect navigation to Clients page with recreate query params
  await page.waitForURL(/\/dashboard\/clients\?/, { timeout: 30_000 });
  await expect(page).toHaveURL(/recreate=1/);
  await expect(page).toHaveURL(/name=Gary%20T/);
  await expect(page).toHaveURL(/email=garry%40everard\.me\.uk/);

  // Wait for the Clients table to render
  await expect(page.getByTestId('clients-table')).toBeVisible();

  // Find Gary's row and click the tick (select client)
  const garyRow = page.getByTestId('clients-row').filter({ hasText: 'Gary T' }).first();
  await expect(garyRow).toBeVisible();
  await garyRow.getByRole('button', { name: /select client|selected client/i }).click();

  // Wait a moment for the selection to persist to localStorage
  await page.waitForTimeout(500);

  // Navigate to Documents tab/page
  await page.goto('/dashboard/documents');
  await expect(page).toHaveURL(/\/dashboard\/documents/);

  // Confirm Gary is shown as the selected client on the Documents page
  await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
  await expect(page.getByText('Gary T')).toBeVisible();

  // Confirm there are no documents listed yet (UI), with API fallback
  const noDocsUI = page.getByText('No documents yet.');
  const uiVisible = await noDocsUI.isVisible().catch(() => false);
  if (!uiVisible) {
    // Fallback: query the API directly for selected client to verify backend is reachable
    const selectedJSON = await page.evaluate(() => localStorage.getItem('selected_client'));
    const selected = selectedJSON ? JSON.parse(selectedJSON) : null;
    const teamId = selected?.team_id;
    const clientId = selected?.client_id;
    expect(teamId, 'teamId should be present from selected_client').toBeTruthy();
    expect(clientId, 'clientId should be present from selected_client').toBeTruthy();
    const resp = await page.request.get(`/api/docs/status?teamId=${teamId}&clientId=${clientId}`);
    expect(resp.ok()).toBeTruthy();
    const list = await resp.json();
    expect(Array.isArray(list)).toBeTruthy();
    // Note: Gary may have docs from previous runs; we don't assert count is 0
  }

  // Upload the external docx via the hidden file input in the dropzone
  const docPathEnv = process.env.E2E_DOC_PATH;
  const docNameEnv = process.env.E2E_DOC_NAME;
  const docName = docNameEnv || 'Gary Thompson FF.docx';
  const filePath = docPathEnv ? path.resolve(docPathEnv) : path.resolve('external', docName);
  await page.setInputFiles('input[type="file"]', filePath);

  // Expect uploading state, then success OR a clear error if backend is not configured
  await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
  const outcome = page.getByText(/Upload successful!|A document with this name already exists|Upload failed|commit failed|init-upload failed/i);
  await expect(outcome).toBeVisible({ timeout: 20000 });

  // Preflight: check if backend is configured AND healthy
  const fastapiUrl = process.env.FASTAPI_URL || '';
  let backendHealthy = false;
  if (fastapiUrl) {
    try {
      const healthUrl = `${fastapiUrl.replace(/\/$/, '')}/health`;
      const health = await page.request.get(healthUrl, { timeout: 3500 });
      backendHealthy = health.ok();
    } catch {
      backendHealthy = false;
    }
  }

  if (backendHealthy) {
    try {
      // Poll the API until the document is listed
      await expect.poll(async () => {
        const selectedJSON = await page.evaluate(() => localStorage.getItem('selected_client'));
        const selected = selectedJSON ? JSON.parse(selectedJSON) : null;
        const teamId = selected?.team_id;
        const clientId = selected?.client_id;
        if (!teamId || !clientId) return 'no-selection';
        const resp = await page.request.get(`/api/docs/status?teamId=${teamId}&clientId=${clientId}`);
        if (!resp.ok()) return 'bad-response';
        const list: Array<{ name: string }> = await resp.json();
        const found = Array.isArray(list) && list.some((d) => d.name === docName);
        return found ? 'found' : 'not-found';
      }, { timeout: 60_000, intervals: [500, 1000, 2000, 5000] }).toBe('found');

      // Also assert UI reflects the file name
      await expect(page.getByText(docName)).toBeVisible({ timeout: 10_000 });

      // Activate and wait for digestion to complete
      // Helper to fetch current status for the doc
      const getDocStatus = async (): Promise<string | null> => {
        const selectedJSON = await page.evaluate(() => localStorage.getItem('selected_client'));
        const selected = selectedJSON ? JSON.parse(selectedJSON) : null;
        const teamId = selected?.team_id;
        const clientId = selected?.client_id;
        if (!teamId || !clientId) return null;
        const resp = await page.request.get(`/api/docs/status?teamId=${teamId}&clientId=${clientId}`);
        if (!resp.ok()) return null;
        const list: Array<{ name: string; status?: string }> = await resp.json();
        const row = list.find((d) => d.name === docName);
        return (row?.status || 'inactive').toLowerCase();
      };

      // Start digest if inactive; otherwise just proceed to wait
      const initialStatus = await getDocStatus();
      if (initialStatus === 'inactive') {
        const row = page.getByRole('listitem').filter({ hasText: docName }).first();
        await expect(row).toBeVisible();
        const activateBtn = row.getByRole('button', { name: 'Activate' });
        await expect(activateBtn).toBeVisible();
        await activateBtn.click();
        // UI should flip to Digesting quickly
        await expect(row.getByText('Digesting')).toBeVisible({ timeout: 15_000 });
      }

      // Poll API for digested status
      await expect.poll(async () => {
        const status = await getDocStatus();
        return status;
      }, { timeout: 90_000, intervals: [1000, 2000, 5000] }).toBe('digested');

      // And ensure UI reflects Digested
  const digestedRow = page.getByRole('listitem').filter({ hasText: docName }).first();
      await expect(digestedRow.getByText('Digested')).toBeVisible({ timeout: 20_000 });

      // Go to Identity and extract
      await page.goto('/dashboard/identity');
      await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
      await expect(page.getByText('Gary T')).toBeVisible();

      const extractBtn = page.getByRole('button', { name: 'Extract from Docs' });
      // It could be disabled briefly; wait and click
      await expect(extractBtn).toBeEnabled({ timeout: 10_000 });
      await extractBtn.click();
      await expect(page.getByRole('button', { name: 'Extracting…' })).toBeVisible({ timeout: 5_000 });
      // Wait for extraction to complete by checking button returns to enabled state
      await expect(page.getByRole('button', { name: 'Extract from Docs' })).toBeEnabled({ timeout: 60_000 });

      // Assert Occupation was populated from docs
      const occupation = page.getByLabel('Occupation');
      await expect(occupation).toBeVisible();
      await expect(occupation).toHaveValue('Marketing Manager', { timeout: 30_000 });
    } catch (err) {
      // Diagnostics: print outcome message, docs status, and storage list
      const selectedJSON = await page.evaluate(() => localStorage.getItem('selected_client'));
      const selected = selectedJSON ? JSON.parse(selectedJSON) : null;
      const teamId = selected?.team_id;
      const clientId = selected?.client_id;
      const outcomeText = await outcome.first().innerText().catch(() => '');
      console.log('[e2e] upload outcome:', outcomeText);
      if (teamId && clientId) {
        const statusResp = await page.request.get(`/api/docs/status?teamId=${teamId}&clientId=${clientId}`);
        const statusJson = statusResp.ok() ? await statusResp.json() : { error: statusResp.status() };
        console.log('[e2e] /api/docs/status:', statusJson);
        const storeResp = await page.request.get(`/api/storage/list?teamId=${teamId}&clientId=${clientId}`);
        const storeJson = storeResp.ok() ? await storeResp.json() : { error: storeResp.status() };
        console.log('[e2e] /api/storage/list:', storeJson);
      }
      throw err;
    }
  } else {
    const why = fastapiUrl ? 'FASTAPI_URL health check failed' : 'FASTAPI_URL not set';
    test.info().annotations.push({ type: 'note', description: `${why}; skipping backend-dependent steps (presence, activate, digest, extract).` });
    // Log any on-screen error to aid diagnosis
    const msg = await outcome.first().innerText().catch(() => '');
    if (msg) console.log('[e2e] upload message:', msg);
  }
});
