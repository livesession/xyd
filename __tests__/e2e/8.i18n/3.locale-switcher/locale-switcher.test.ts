import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('i18n — FwLocaleSwitcher', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('switcher renders with all configured locales', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');

        const switcher = page.locator('[data-fw-locale-switcher]');
        await expect(switcher).toHaveCount(1);

        const options = await switcher.locator('option').allTextContents();
        expect(options).toEqual(expect.arrayContaining(['English', 'Polski', 'Deutsch']));
    });

    test('switcher reflects the current locale', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const switcher = page.locator('[data-fw-locale-switcher]');
        await expect(switcher).toHaveValue('pl');
    });

    test('selecting a locale navigates to the same slug under that locale', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText('English Welcome');

        await page.locator('[data-fw-locale-switcher]').selectOption('pl');
        await page.waitForURL(/\/pl\/docs\/intro$/);
        await expect(page.locator('h1')).toContainText('Polski Witamy');
    });

    test('switching from non-default to default drops the locale prefix', async ({ page }) => {
        await page.goto(server.getUrl('/de/docs/intro'));
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText('Deutsch Willkommen');

        await page.locator('[data-fw-locale-switcher]').selectOption('en');
        await page.waitForURL((url) => /\/docs\/intro$/.test(url.pathname) && !/\/(de|pl)\//.test(url.pathname));
        await expect(page.locator('h1')).toContainText('English Welcome');
    });

    test('selection persists in xyd-locale cookie', async ({ page, context }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');
        await page.locator('[data-fw-locale-switcher]').selectOption('pl');
        await page.waitForURL(/\/pl\/docs\/intro$/);

        const cookies = await context.cookies();
        const localeCookie = cookies.find(c => c.name === 'xyd-locale');
        expect(localeCookie?.value).toBe('pl');
    });
});
