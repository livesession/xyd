import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

test.describe('Dynamic Theme Resolution', () => {
    // Run tests serially so they share a single beforeAll/server. With
    // fullyParallel: true, each test would spawn its own xyd build, and they'd
    // race on the shared <monorepo>/.xyd/host directory (rmSync of host fails
    // with ENOTEMPTY when another worker is mid-copy).
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('non-default theme (cosmo) resolves and renders page', async ({ page }) => {
        // docs.json sets theme.name to "cosmo"
        // The theme should be dynamically resolved without being hardcoded in host package.json
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toHaveText('Overview');
    });

    test('theme CSS is loaded', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        // Verify that theme-specific CSS variables are present (injected by xyd-themes/tokens.css)
        const hasCssVars = await page.evaluate(() => {
            const root = document.documentElement;
            const style = getComputedStyle(root);
            // --xyd-nav-height is a core layout token present in all themes
            return style.getPropertyValue('--xyd-nav-height') !== '';
        });
        expect(hasCssVars).toBe(true);
    });
});
