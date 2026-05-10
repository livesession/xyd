import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('i18n — translation keys', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('default-locale sidebar group resolves "i18n:" key from en catalog', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Get Started');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });

    test('non-default-locale sidebar group resolves from pl catalog (nested key)', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        // Polish catalog uses nested form: { "sidebar": { "getstarted": "Zaczynamy" } }
        expect(body).toContain('Zaczynamy');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });
});
