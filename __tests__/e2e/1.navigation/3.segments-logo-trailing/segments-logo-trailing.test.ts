import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// A `logoTrailing` segment renders as a hover product-switcher right after the
// logo, via the `logo.trailing` surface (hosted by FwLogo). The render path is
// shared, so we assert the same behavior on BOTH engines: the bun engine and the
// Vite engine that examples-build ships with.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`navigation — segments logoTrailing (${engine.name} engine)`, () => {
        let server: XydServer;

        test.beforeAll(async () => {
            server = await engine.make(__dirname);
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        const trigger = (page: Page) => page.locator('[part="dropdown-trigger"]');
        const triggerLabel = (page: Page) => page.locator('[part="dropdown-trigger-label"]');
        const item = (page: Page, label: string) =>
            page.locator('[part="dropdown-item"]', { hasText: label });

        async function goto(page: Page, path: string) {
            await page.goto(server.getUrl(path));
            await page.waitForLoadState('networkidle');
        }

        test('renders the switcher after the logo, labeled with the active product', async ({ page }) => {
            await goto(page, '/products/session-replay/overview');
            // hosted inside the logo element → "right after the logo"
            const switcher = page.locator('[part="logo"] [data-fw-nav-dropdown]');
            await expect(switcher).toBeVisible();
            await expect(triggerLabel(page)).toHaveText('Session Replay');
        });

        test('is global — visible on the landing page, labeled with the segment title', async ({ page }) => {
            await goto(page, '/overview');
            // logoTrailing is a top-level switcher: it renders on every page, not
            // only under a product route. No product is active on the landing, so
            // the trigger falls back to the segment `title`.
            await expect(page.locator('[part="logo"] [data-fw-nav-dropdown]')).toBeVisible();
            await expect(triggerLabel(page)).toHaveText('Products');
        });

        test('can pick a product from the landing page', async ({ page }) => {
            await goto(page, '/overview');
            await trigger(page).hover();
            await item(page, 'Web Analytics').click();
            await page.waitForURL(/\/products\/web-analytics\/overview$/);
            await expect(triggerLabel(page)).toHaveText('Web Analytics');
        });

        test('hover opens the menu with both products; the active one is checked', async ({ page }) => {
            await goto(page, '/products/session-replay/overview');
            await trigger(page).hover();
            await expect(item(page, 'Session Replay')).toBeVisible();
            await expect(item(page, 'Web Analytics')).toBeVisible();
            // active item carries the switcher check; the inactive one does not
            await expect(item(page, 'Session Replay').locator('[part="dropdown-check"]')).toHaveCount(1);
            await expect(item(page, 'Web Analytics').locator('[part="dropdown-check"]')).toHaveCount(0);
        });

        test('selecting another product navigates and the trigger updates', async ({ page }) => {
            await goto(page, '/products/session-replay/overview');
            await trigger(page).hover();
            await item(page, 'Web Analytics').click();
            await page.waitForURL(/\/products\/web-analytics\/overview$/);
            await expect(page.locator('h1')).toContainText('Web Analytics');
            await expect(triggerLabel(page)).toHaveText('Web Analytics');
        });

        test('the switcher persists on a sub-page of the product section', async ({ page }) => {
            await goto(page, '/products/session-replay/methods');
            await expect(page.locator('[part="logo"] [data-fw-nav-dropdown]')).toBeVisible();
            await expect(triggerLabel(page)).toHaveText('Session Replay');
        });

        test('the switcher does not leak into the footer logo (only the nav logo hosts it)', async ({ page }) => {
            await goto(page, '/products/session-replay/overview');
            // the footer also renders a logo (components.footer.logo), but only the
            // nav logo opts into `trailing`, so exactly one switcher exists.
            await expect(page.locator('[data-fw-nav-dropdown]')).toHaveCount(1);
        });

        test('the segment renders ONLY after the logo — never as a subnav below the nav', async ({ page }) => {
            await goto(page, '/products/session-replay/overview');
            // a `logoTrailing` segment must not also drive the default subnav/subheader
            // (regression: useMatchedSubNav used to render any non-sidebarDropdown segment)
            await expect(page.locator('xyd-subnav')).toHaveCount(0);
            await expect(page.locator('xyd-subnav-item')).toHaveCount(0);
        });
    });
}
