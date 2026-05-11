import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('i18n — catalog-only navigation', () => {
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('default-locale inherits top-level sidebar; group title resolves from en catalog', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Get Started');
        expect(body).toContain('English Welcome');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });

    test('pl locale inherits top-level sidebar; group title resolves from pl catalog', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Zaczynamy');
        expect(body).toContain('Polski Witamy');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });

    test('de locale inherits top-level sidebar; group title resolves from de catalog', async ({ page }) => {
        await page.goto(server.getUrl('/de/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Erste Schritte');
        expect(body).toContain('Deutsch Willkommen');
    });
});
