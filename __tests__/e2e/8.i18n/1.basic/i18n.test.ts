import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('i18n — basic routing', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('default locale (en) serves at unprefixed URL', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toContainText('Welcome to xyd');
    });

    test('Polish locale serves at /pl/ prefix', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toContainText('Witamy w xyd');
    });

    test('German locale serves at /de/ prefix', async ({ page }) => {
        await page.goto(server.getUrl('/de/docs/intro'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toContainText('Willkommen bei xyd');
    });

    test('locale routes deliver distinct content', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');
        const enBody = await page.textContent('main');

        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');
        const plBody = await page.textContent('main');

        expect(enBody).not.toEqual(plBody);
        expect(enBody).toMatch(/in English/);
        expect(plBody).toMatch(/po polsku/);
    });
});
