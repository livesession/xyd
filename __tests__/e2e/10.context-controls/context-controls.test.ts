import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../utils/xyd-server';

// Page context controls: contextual page actions (copy, ChatGPT/Claude,
// view markdown, MCP), explicit dropdown grouping, a content-version
// switcher, and custom {import, props} components — global via
// components.contextControls, per page via frontmatter or the sidebar entry
// (page-level REPLACES global), at header / toc-top / toc-bottom slots.
// Run on BOTH engines.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`context controls (${engine.name} engine)`, () => {
        test.describe.configure({ mode: 'serial' });
        test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

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

        const slot = (page: Page, appearance: string) =>
            page.locator(`[part="context-controls"][data-appearance="${appearance}"]:visible`).first();

        test('global copy control renders in the header slot; click copies the raw markdown', async ({ page }) => {
            await goto(page, '/docs/plain');

            const header = slot(page, 'header');
            await expect(header).toBeVisible();
            const button = header.locator('button', { hasText: 'Copy page' }).first();
            await expect(button).toBeVisible();
            await button.click();

            const copied = await page.evaluate(() => navigator.clipboard.readText());
            expect(copied).toContain('plain-page-marker');
            expect(copied).toContain('# Plain');
        });

        test('page-level declaration REPLACES global: content-version at toc-top, no header copy', async ({ page }) => {
            await goto(page, '/docs/angular/logs');

            await expect(page.locator('[part="context-controls"][data-appearance="header"]')).toHaveCount(0);

            const tocTop = slot(page, 'toc-top');
            await expect(tocTop).toBeVisible();
            // the slot sits INSIDE the toc column, before the toc list
            await expect(page.locator('[part="page-article-nav"] [part="context-controls"][data-appearance="toc-top"]:visible').first()).toBeVisible();
            await expect(tocTop.locator('[part="context-dropdown-trigger"]')).toContainText('Angular');
        });

        test('content-version dropdown lists variants and navigates; the check follows', async ({ page }) => {
            await goto(page, '/docs/angular/logs');

            const trigger = slot(page, 'toc-top').locator('[part="context-dropdown-trigger"]');
            await trigger.click();
            const items = page.locator('[part="context-dropdown-item"]');
            await expect(items).toHaveCount(2);
            await expect(items.filter({ hasText: 'Angular' }).first()).toHaveAttribute('aria-selected', 'true');

            await items.filter({ hasText: 'Bun' }).first().click();
            await page.waitForURL('**/docs/bun/logs');
            await expect(page.locator('h1').first()).toHaveText('Bun Logs');

            await slot(page, 'toc-top').locator('[part="context-dropdown-trigger"]').click();
            await expect(page.locator('[part="context-dropdown-item"]').filter({ hasText: 'Bun' }).first())
                .toHaveAttribute('aria-selected', 'true');
        });

        test('sidebar-entry dropdown group: 4 action rows with the right targets', async ({ page }) => {
            await goto(page, '/docs/actions');

            const header = slot(page, 'header');
            await header.locator('[part="context-dropdown-trigger"]').click();

            const items = page.locator('[part="context-dropdown-item"]');
            await expect(items).toHaveCount(4);
            await expect(items.filter({ hasText: 'Copy page' }).first()).toBeVisible();
            await expect(items.filter({ hasText: 'Open in ChatGPT' }).first())
                .toHaveAttribute('href', /chatgpt\.com/);
            await expect(items.filter({ hasText: 'Open in Claude' }).first())
                .toHaveAttribute('href', /claude\.ai/);
            await expect(items.filter({ hasText: 'View as Markdown' }).first())
                .toHaveAttribute('href', '/docs/actions.md');
            await page.keyboard.press('Escape');
        });

        test('the dropdown shows row icons and dismisses on outside click and Escape', async ({ page }) => {
            await goto(page, '/docs/actions');

            const trigger = slot(page, 'header').locator('[part="context-dropdown-trigger"]');
            await trigger.click();
            // icons are pre-resolved in the framework layer (xyd-ui's bundled
            // Icon context can't resolve string names)
            expect(await page.locator('[part="context-dropdown-item-icon"] svg').count()).toBe(4);

            // outside click closes (regression: an always-matching CSS
            // animation wedged Radix Presence, keeping the menu mounted)
            await page.locator('h1').first().click({ position: { x: 5, y: 5 } });
            await expect(page.locator('[part="context-dropdown-item"]')).toHaveCount(0);

            await trigger.click();
            await expect(page.locator('[part="context-dropdown-item"]')).toHaveCount(4);
            await page.keyboard.press('Escape');
            await expect(page.locator('[part="context-dropdown-item"]')).toHaveCount(0);
        });

        test('sidebar-entry mcp control renders at toc-bottom and copies the server URL', async ({ page }) => {
            await goto(page, '/docs/actions');

            const tocBottom = page.locator('[part="page-article-nav"] [part="context-controls"][data-appearance="toc-bottom"]:visible').first();
            await expect(tocBottom).toBeVisible();
            await tocBottom.locator('button', { hasText: 'Copy MCP server URL' }).first().click();
            expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://mcp.example.dev/sse');
        });

        test('custom {import, props} control renders the project component', async ({ page }) => {
            await goto(page, '/docs/custom');

            const custom = page.locator('[data-testid="custom-control"]:visible').first();
            await expect(custom).toBeVisible();
            await expect(custom).toHaveText('Hello context-controls');
        });

        test('same-URL content swap: the query param swaps content in place', async ({ page }) => {
            await goto(page, '/docs/logs');
            await expect(page.locator('main, body').first()).toContainText('swap-default-marker');

            const trigger = page.locator('[part="page-article-nav"] [part="context-dropdown-trigger"]:visible').first();
            await expect(trigger).toContainText('Default');
            await trigger.click();
            await page.locator('[part="context-dropdown-item"]').filter({ hasText: 'Bun' }).first().click();

            // SAME pathname, configurable param set, content swapped
            await page.waitForURL('**/docs/logs?runtime=bun');
            await expect(page.locator('h1').first()).toHaveText('Logs — Bun');
            await expect(page.locator('main, body').first()).toContainText('swap-bun-marker');

            // back to default drops the param and restores the host content
            await page.locator('[part="page-article-nav"] [part="context-dropdown-trigger"]:visible').first().click();
            await page.locator('[part="context-dropdown-item"]').filter({ hasText: 'Default' }).first().click();
            await page.waitForURL(url => url.pathname.endsWith('/docs/logs') && !url.searchParams.has('runtime'));
            await expect(page.locator('main, body').first()).toContainText('swap-default-marker');
        });

        test('same-URL content swap: deep links render the variant immediately', async ({ page }) => {
            await goto(page, '/docs/logs?runtime=bun');
            await expect(page.locator('h1').first()).toHaveText('Logs — Bun');
            await expect(page.locator('main, body').first()).toContainText('swap-bun-marker');
        });

        test('the raw markdown behind view-markdown is actually served', async ({ page }) => {
            const res = await page.request.get(server.getUrl('/docs/actions.md'));
            expect(res.ok()).toBe(true);
            expect(await res.text()).toContain('actions-page-marker');
        });
    });
}
