import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// Breadcrumbs: full path (incl. the top-level tab "Guides"), and each crumb is a
// link ONLY when it resolves to a real route (tab/route, page, or a group with a
// `page`); a plain group and the current page are plain text. Shared render path,
// so assert on both engines.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`navigation — breadcrumbs (${engine.name} engine)`, () => {
        let server: XydServer;

        test.beforeAll(async () => { server = await engine.make(__dirname); });
        test.afterAll(async () => { await server?.stop(); });

        const items = (page: Page) => page.locator('xyd-breadcrumbs [part="item"]');
        const crumb = (page: Page, text: string) =>
            page.locator('xyd-breadcrumbs [part="item"]', { hasText: text });

        async function goto(page: Page, path: string) {
            await page.goto(server.getUrl(path));
            await page.waitForLoadState('networkidle');
        }

        test('shows the full path including the root tab (Guides / Customization / Appearance)', async ({ page }) => {
            await goto(page, '/guides/customization/appearance');
            await expect(items(page)).toHaveText(['Guides', 'Customization', 'Appearance']);
        });

        test('links only crumbs with a real route: root tab yes, plain group no, current no', async ({ page }) => {
            await goto(page, '/guides/customization/appearance');
            await expect(crumb(page, 'Guides').locator('a')).toHaveCount(1);        // tab route → link
            await expect(crumb(page, 'Customization').locator('a')).toHaveCount(0); // plain group → text
            await expect(crumb(page, 'Appearance').locator('a')).toHaveCount(0);    // current page → text
            await expect(page.locator('xyd-breadcrumbs [part="item"][data-active="true"]')).toHaveText('Appearance');
        });

        test('the root crumb links to its route', async ({ page }) => {
            await goto(page, '/guides/customization/appearance');
            await expect(crumb(page, 'Guides').locator('a')).toHaveAttribute('href', /\/guides$/);
        });

        test('a group-with-`page` is a clickable breadcrumb and navigates', async ({ page }) => {
            await goto(page, '/guides/integrations/analytics');
            await expect(items(page)).toHaveText(['Guides', 'Integrations', 'Analytics']);
            const link = crumb(page, 'Integrations').locator('a');
            await expect(link).toHaveCount(1); // group has a `page` → real route → link
            await link.click();
            await page.waitForURL(/\/guides\/integrations\/overview$/);
            await expect(page.locator('h1')).toContainText('Integrations');
        });
    });
}
