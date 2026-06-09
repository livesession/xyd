import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('i18n — catalog $-prefixed override keys', () => {
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('default locale sidebar title resolves from en catalog', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Get Started');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });

    test('pl locale sidebar title resolves from pl catalog', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Zaczynamy');
        expect(body).not.toContain('i18n: sidebar.getstarted');
    });

    test('de locale sidebar title resolves from de catalog', async ({ page }) => {
        await page.goto(server.getUrl('/de/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Erste Schritte');
    });

    test('built settings bundle contains $-extracted overrides for non-default locales', async ({ request }) => {
        // Catalog `$`-keys should be pulled into navigation.languages[].overrides
        // at boot. The settings module that ships to the browser must serialize
        // them so client/SSR see consistent locale overrides.
        const res = await request.get(server.getUrl('/'));
        const html = await res.text();
        const match = html.match(/\/assets\/virtual_xyd-settings-[^"]+\.js/);
        expect(match, 'settings bundle URL present in HTML').not.toBeNull();
        const bundleRes = await request.get(server.getUrl(match![0]));
        const bundle = await bundleRes.text();

        // pl entry: both content + icon override paths from pl.json $-keys.
        // Vite/esbuild may emit string values with either double quotes or
        // backticks (template literals) — match either via regex.
        expect(bundle).toMatch(
            /"components\.banner\.content":\s*["`]\*\*xyd 0\.1\.0-beta\*\* — już wkrótce["`]/
        );
        expect(bundle).toMatch(/"components\.banner\.icon":\s*["`]rocket["`]/);
        // de entry: only content override (no icon in de.json)
        expect(bundle).toMatch(
            /"components\.banner\.content":\s*["`]\*\*xyd 0\.1\.0-beta\*\* — Bald verfügbar["`]/
        );

        // The `$`-prefix must be stripped — overrides keys are plain dot-paths.
        expect(bundle).not.toContain('$components.banner');
    });

    test('catalog $-keys do not appear as raw text in rendered pages', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).not.toContain('$components.banner');
    });
});
