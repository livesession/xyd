import { test, expect, Page } from '@playwright/test';

import { createXydBunServer, XydServer } from '../../utils/xyd-server';

// The `dropdownMenu` nav feature ships on the Rust+bun engine — run against it.
test.describe('navigation — dropdownMenu (bun engine)', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBunServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    const trigger = (page: Page, label: string) =>
        page.locator('[part="dropdown-trigger"]', { hasText: label });
    const item = (page: Page, label: string) =>
        page.locator('[part="dropdown-item"]', { hasText: label });

    async function open(page: Page) {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');
    }

    test('renders both dropdown triggers (SSR + hydrate)', async ({ page }) => {
        await open(page);
        await expect(page.locator('[data-fw-nav-dropdown]')).toHaveCount(2);
        await expect(trigger(page, 'Products')).toBeVisible();
        await expect(trigger(page, 'Company')).toBeVisible();
    });

    test('trigger:"hover" opens the menu on hover', async ({ page }) => {
        await open(page);
        await trigger(page, 'Products').hover();
        await expect(item(page, 'Browser SDK')).toBeVisible();
        await expect(item(page, 'REST API')).toBeVisible();
    });

    test('appearance.navigationDropdown.chevron:"static" does not rotate the open chevron', async ({ page }) => {
        await open(page);
        await trigger(page, 'Products').hover();
        await expect(item(page, 'Browser SDK')).toBeVisible(); // menu open → trigger data-state="open"
        const chevron = trigger(page, 'Products').locator('[part="dropdown-chevron"]');
        // static → rotate(0deg) → identity matrix. A rotating chevron would be matrix(-1, …).
        const transform = await chevron.evaluate((el) => getComputedStyle(el).transform);
        expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
    });

    test('appearance.navigationDropdown.items:"flush" gives edge-to-edge rows with bigger padding', async ({ page }) => {
        await open(page);
        await trigger(page, 'Products').hover();
        const rest = item(page, 'REST API');
        await expect(rest).toBeVisible();
        await expect(rest).toHaveCSS('padding-left', '16px');
        await expect(rest).toHaveCSS('padding-top', '10px');
    });

    test('trigger and menu items use a pointer cursor', async ({ page }) => {
        await open(page);
        const t = trigger(page, 'Products');
        await expect(t).toHaveCSS('cursor', 'pointer');
        await t.hover();
        const sdk = item(page, 'Browser SDK');
        await expect(sdk).toBeVisible();
        await expect(sdk).toHaveCSS('cursor', 'pointer');
    });

    test('opened menu is within the viewport (not clipped)', async ({ page }) => {
        await open(page);
        await trigger(page, 'Products').hover();
        const list = page.locator('[part="dropdown-list"]').first();
        await expect(list).toBeVisible();
        const box = await list.boundingBox();
        const vw = page.viewportSize()!;
        expect(box).not.toBeNull();
        // The menu must sit inside the viewport (a clipped/off-screen menu fails here).
        expect(box!.x).toBeGreaterThanOrEqual(-1);
        expect(box!.y).toBeGreaterThanOrEqual(-1);
        expect(box!.x + box!.width).toBeLessThanOrEqual(vw.width + 1);
        expect(box!.height).toBeGreaterThan(0);
    });

    test('menu stays open moving pointer from trigger into it', async ({ page }) => {
        await open(page);
        await trigger(page, 'Products').hover();
        const sdk = item(page, 'Browser SDK');
        await expect(sdk).toBeVisible();
        // Move the pointer down into the menu with a human-like pause; the menu
        // must NOT flicker closed (the bug this fixes).
        await page.waitForTimeout(250);
        await sdk.hover();
        await page.waitForTimeout(250);
        await expect(sdk).toBeVisible();
    });

    test('trigger:"click" opens on click, not on hover', async ({ page }) => {
        await open(page);
        // hover must NOT open a click-triggered menu
        await trigger(page, 'Company').hover();
        await expect(item(page, 'Changelog')).toHaveCount(0);
        // click opens it
        await trigger(page, 'Company').click();
        await expect(item(page, 'Changelog')).toBeVisible();
    });

    test('multi-level submenu opens', async ({ page }) => {
        await open(page);
        await trigger(page, 'Products').hover();
        const guides = page.locator('[part="dropdown-item"][data-has-submenu]', { hasText: 'Guides' });
        await expect(guides).toBeVisible();
        await guides.hover();
        await expect(item(page, 'Authentication')).toBeVisible();
    });

    test('selecting a leaf item navigates', async ({ page }) => {
        await open(page);
        await trigger(page, 'Products').hover();
        await item(page, 'Browser SDK').click();
        await page.waitForURL(/\/docs\/browser$/);
        await expect(page.locator('h1')).toContainText('Browser SDK');
    });

    test('Escape closes the menu', async ({ page }) => {
        await open(page);
        await trigger(page, 'Company').click();
        await expect(item(page, 'Changelog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(item(page, 'Changelog')).toHaveCount(0);
    });
});
