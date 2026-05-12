import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('i18n — translation catalogs declared with custom paths and inline objects', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('en catalog loaded from custom file path (./locales/english.json)', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Get Started');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });

    test('pl catalog loaded from inline object in docs.json', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Zaczynamy');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });
});
