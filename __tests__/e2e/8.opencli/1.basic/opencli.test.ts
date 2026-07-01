import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

// Regression for `api.cli`: a docs project that only points `api.cli` at an
// OpenCLI spec must auto-generate one reference page per command, wire them into
// routes (no 404), and list them in the sidebar — no hand-written pages.
test.describe('api.cli virtual CLI pages [build]', () => {
  test.describe.configure({ mode: 'serial' });

  let server: XydServer;

  test.beforeAll(async () => {
    server = await createXydBuildServer(__dirname);
  });

  test.afterAll(async () => {
    await server.stop();
  });

  test('a generated command page renders (not 404)', async ({ page }) => {
    const resp = await page.goto(server.getUrl('/docs/cli/install'));
    expect(resp?.status() ?? 0).toBeLessThan(400);

    await page.waitForLoadState('networkidle');
    const body = (await page.textContent('body')) || '';
    // the command's converted reference: description + Options block + an option
    expect(body).toContain('Install one or more packages');
    expect(body).toContain('Options');
    expect(body).toContain('global');
    // a runnable CLI invocation is rendered as a code sample (like a request sample)
    expect(body).toContain('CLI Tool');
    expect(body).toContain('spice install');
  });

  test('every command is present in the sidebar', async ({ page }) => {
    await page.goto(server.getUrl('/docs/cli/overview'));
    await page.waitForLoadState('networkidle');

    // sidebar links to each generated command page
    for (const cmd of ['install', 'remove', 'list']) {
      await expect(page.locator(`a[href$="/docs/cli/${cmd}"]`).first()).toBeVisible();
    }
  });

  test('a second command page also renders', async ({ page }) => {
    const resp = await page.goto(server.getUrl('/docs/cli/remove'));
    expect(resp?.status() ?? 0).toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    const body = (await page.textContent('body')) || '';
    expect(body).toContain('Remove one or more packages');
  });
});
