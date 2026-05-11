import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('i18n — per-locale overrides (dot-keys + nested form)', () => {
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('default locale renders without leaking pl/de override values', async ({ page }) => {
        await page.goto(server.getUrl('/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('English Welcome');
        // Per-locale overrides only apply to their own locale.
        expect(body).not.toContain('już wkrótce');
        expect(body).not.toContain('Bald verfügbar');
    });

    test('pl locale serves Polish content', async ({ page }) => {
        await page.goto(server.getUrl('/pl/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Polski Witamy');
    });

    test('de locale serves German content', async ({ page }) => {
        await page.goto(server.getUrl('/de/docs/intro'));
        await page.waitForLoadState('networkidle');

        const body = await page.content();
        expect(body).toContain('Deutsch Willkommen');
    });

    test('built settings bundle serializes both dot-key and nested overrides', async ({ request }) => {
        // pl uses flat dot-keys; de uses nested-object form.
        // Both should land in settings.navigation.languages[].overrides.
        const res = await request.get(server.getUrl('/'));
        const html = await res.text();
        const match = html.match(/\/assets\/virtual_xyd-settings-[^"]+\.js/);
        expect(match, 'settings bundle URL present in HTML').not.toBeNull();
        const bundleRes = await request.get(server.getUrl(match![0]));
        const bundle = await bundleRes.text();

        // pl flat dot-keys preserved as-is (expanded by applyOverrides at request time)
        expect(bundle).toContain(
            '"components.banner.content":"**xyd 0.1.0-beta** — już wkrótce"'
        );
        expect(bundle).toContain('"components.banner.icon":"rocket"');

        // de nested-object form preserved
        expect(bundle).toContain('Bald verfügbar');
    });
});
