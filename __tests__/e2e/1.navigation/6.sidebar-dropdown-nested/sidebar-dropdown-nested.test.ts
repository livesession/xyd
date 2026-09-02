import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// Nested items in a sidebar-dropdown segment: a `pages` entry may itself be
// `{ title, icon?, description?, pages: [...] }` — it renders as an inline-
// expandable GROUP row inside the dropdown popover (accordion), children
// indented; leaves keep normal link behavior. The group containing the ACTIVE
// page auto-expands; expansion state resets when the popover closes. Run on
// BOTH engines (shared render path; the framework/ui dists differ per engine
// packaging).
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`navigation — sidebar-dropdown nested (${engine.name} engine)`, () => {
        // One dev server per engine (parallel workers would each boot their own
        // server and vite cold boots exceed the 2-minute start timeout).
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

        const dropdown = (page: Page) => page.locator('aside[part="sidebar"] xyd-sidebar-tabs-dropdown');
        const trigger = (page: Page) => dropdown(page).locator('[part="dropdown-trigger"]');
        const list = (page: Page) => dropdown(page).locator('[part="dropdown-list"]');
        const groupRow = (page: Page, title: string) =>
            list(page).locator(`button[part="dropdown-listitem"][data-group]`, { hasText: title });

        test('the switcher renders; trigger shows the active section; click opens the list', async ({ page }) => {
            await goto(page, '/docs/guides/index');

            await expect(trigger(page)).toBeVisible();
            await expect(trigger(page).locator('[part="dropdown-label"]')).toHaveText('Guides');

            await trigger(page).click();
            await expect(list(page)).toBeVisible();
        });

        test('leaf entries are links and navigate (popover closes)', async ({ page }) => {
            await goto(page, '/docs/guides/index');
            await trigger(page).click();

            const reference = list(page).locator('a[part="dropdown-listitem"]', { hasText: 'Reference' });
            await expect(reference).toHaveAttribute('href', /\/docs\/reference\/index$/);

            await reference.click();
            await expect.poll(() => page.evaluate(() => window.location.pathname))
                .toContain('/docs/reference/index');
            await expect(list(page)).toHaveCount(0);
        });

        test('a nested group renders as a collapsed button row (icon, description, chevron — not a link)', async ({ page }) => {
            await goto(page, '/docs/guides/index');
            await trigger(page).click();

            const sdks = groupRow(page, 'SDKs');
            await expect(sdks).toHaveCount(1);
            await expect(list(page).locator('a[data-group]')).toHaveCount(0);

            await expect(sdks.locator('[part="dropdown-icon"]')).toHaveCount(1);
            await expect(sdks.locator('[part="dropdown-description"]')).toHaveText('Client libraries');
            await expect(sdks.locator('[part="dropdown-chevron"]')).toHaveCount(1);
            await expect(sdks).toHaveAttribute('aria-expanded', 'false');
            await expect(list(page).locator('[part="dropdown-sublist"]')).toHaveCount(0);
        });

        test('clicking a group expands its children inline (popover stays open); clicking again collapses', async ({ page }) => {
            await goto(page, '/docs/guides/index');
            await trigger(page).click();

            const sdks = groupRow(page, 'SDKs');
            await sdks.click();

            await expect(sdks).toHaveAttribute('aria-expanded', 'true');
            const sublist = list(page).locator('[part="dropdown-sublist"]');
            await expect(sublist).toHaveCount(1);
            await expect(sublist.locator('a[part="dropdown-listitem"]')).toHaveCount(2);
            await expect(sublist).toBeVisible();
            // the popover did NOT close
            await expect(list(page)).toBeVisible();

            // container-level indent (survives theme listitem-padding overrides)
            const padding = await sublist.evaluate((el) => getComputedStyle(el).paddingLeft);
            expect(parseFloat(padding)).toBeGreaterThanOrEqual(14);

            // chevron rotated when expanded
            const transform = await sdks.locator('[part="dropdown-chevron"]')
                .evaluate((el) => getComputedStyle(el).transform);
            expect(transform).not.toBe('none');

            await sdks.click();
            await expect(sdks).toHaveAttribute('aria-expanded', 'false');
            await expect(list(page).locator('[part="dropdown-sublist"]')).toHaveCount(0);
        });

        test('clicking a nested child navigates, closes the popover, and the trigger shows the child', async ({ page }) => {
            await goto(page, '/docs/guides/index');
            await trigger(page).click();
            await groupRow(page, 'SDKs').click();

            await list(page).locator('a[part="dropdown-listitem"]', { hasText: 'JavaScript SDK' }).click();

            await expect.poll(() => page.evaluate(() => window.location.pathname))
                .toContain('/docs/sdk/js/index');
            await expect(list(page)).toHaveCount(0);
            await expect(trigger(page).locator('[part="dropdown-label"]')).toHaveText('JavaScript SDK');
        });

        test('on a nested child page its group auto-expands and the child is selected', async ({ page }) => {
            await goto(page, '/docs/sdk/py/index');

            await expect(trigger(page).locator('[part="dropdown-label"]')).toHaveText('Python SDK');
            await trigger(page).click();

            await expect(groupRow(page, 'SDKs')).toHaveAttribute('aria-expanded', 'true');
            const py = list(page).locator('a[part="dropdown-listitem"]', { hasText: 'Python SDK' });
            await expect(py).toHaveAttribute('aria-selected', 'true');
            await expect(py.locator('[part="chevron-check"] svg')).toHaveCount(1);

            // the OTHER group stays collapsed
            await expect(groupRow(page, 'Deployment')).toHaveAttribute('aria-expanded', 'false');
        });

        test('Escape closes the popover', async ({ page }) => {
            await goto(page, '/docs/guides/index');
            await trigger(page).click();
            await expect(list(page)).toBeVisible();

            await page.keyboard.press('Escape');
            await expect(list(page)).toHaveCount(0);
        });

        test('expansion state resets when the popover closes', async ({ page }) => {
            await goto(page, '/docs/guides/index');
            await trigger(page).click();

            await groupRow(page, 'Deployment').click();
            await expect(groupRow(page, 'Deployment')).toHaveAttribute('aria-expanded', 'true');

            await page.keyboard.press('Escape');
            await expect(list(page)).toHaveCount(0);

            await trigger(page).click();
            // fresh state: active page (Guides) is not inside any group → both collapsed
            await expect(groupRow(page, 'Deployment')).toHaveAttribute('aria-expanded', 'false');
            await expect(groupRow(page, 'SDKs')).toHaveAttribute('aria-expanded', 'false');
        });
    });
}
