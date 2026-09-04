import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// Virtual/source pages: a page's URL decoupled from its markdown file path.
// `{ "page": "docs/angular/logs", "source": "docs/logs.angular" }` serves
// `docs/logs.angular.md` at `/docs/angular/logs` (the sugar is normalized to
// the uniform-era `{ virtual, page }` form, which stays supported raw).
// Run on BOTH engines.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`navigation — virtual/source pages (${engine.name} engine)`, () => {
        // One dev server per engine (parallel workers each boot their own and
        // vite cold boots exceed the 2-minute start timeout).
        test.describe.configure({ mode: 'serial' });

        let server: XydServer;

        test.beforeAll(async () => {
            server = await engine.make(__dirname);
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        async function goto(page: Page, path: string) {
            await page.goto(server.getUrl(path));
            await page.waitForLoadState('networkidle');
        }

        test('source pages serve the mapped file at the pretty URL', async ({ page }) => {
            await goto(page, '/docs/angular/logs');
            await expect(page.locator('h1').first()).toHaveText('Angular Logs');
            await expect(page.locator('main, body').first()).toContainText('angular-logs-marker');

            await goto(page, '/docs/bun/logs');
            await expect(page.locator('h1').first()).toHaveText('Bun Logs');
            await expect(page.locator('main, body').first()).toContainText('bun-logs-marker');
        });

        test('the raw { virtual, page } form keeps working', async ({ page }) => {
            await goto(page, '/docs/node/logs');
            await expect(page.locator('h1').first()).toHaveText('Node Logs');
            await expect(page.locator('main, body').first()).toContainText('node-logs-marker');
        });

        test('sidebar links point at the pretty URLs, labeled from the files\' frontmatter', async ({ page }) => {
            await goto(page, '/docs/index');

            // duplicated in DOM (mobile drawer) — assert on the VISIBLE one
            const angular = page.locator('a[part="item-link"][href="/docs/angular/logs"]:visible').first();
            await expect(angular).toBeVisible();
            await expect(angular).toContainText('Angular Logs');
            await expect(page.locator('a[part="item-link"][href="/docs/bun/logs"]:visible').first()).toContainText('Bun Logs');

            // clicking navigates to the pretty URL and renders the mapped file
            await angular.click();
            await page.waitForURL('**/docs/angular/logs');
            await expect(page.locator('h1').first()).toHaveText('Angular Logs');
        });

        test('prev/next navlinks travel between the pretty URLs', async ({ page }) => {
            await goto(page, '/docs/angular/logs');
            const next = page.locator('a[href="/docs/bun/logs"]:visible').last();
            await expect(next).toBeVisible();
            await next.click();
            await page.waitForURL('**/docs/bun/logs');
            await expect(page.locator('h1').first()).toHaveText('Bun Logs');
        });

        test('the FILE path is not a URL — only the pretty URL serves the page', async ({ page }) => {
            await page.goto(server.getUrl('/docs/logs.angular'));
            await page.waitForLoadState('networkidle');
            // not in navigation → not in the page-path mapping → 404/redirect,
            // never the page content
            expect(await page.content()).not.toContain('angular-logs-marker');
        });
    });
}
