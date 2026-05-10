import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

// Verdaccio URL: Docker entrypoint sets npm_config_registry, CI sets XYD_E2E_VERDACCIO_URL
const REGISTRY = process.env.XYD_E2E_VERDACCIO_URL || process.env.npm_config_registry || 'http://localhost:4873';

test.describe('Custom npm Theme', () => {
    // Run tests serially so they share a single beforeAll/server. With
    // fullyParallel: true, each test would spawn its own xyd build, and they'd
    // race on the shared <monorepo>/.xyd/host directory.
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        const customThemeDir = path.resolve(__dirname, 'custom-theme');

        // Publish the custom theme package to the registry (ignore if already published)
        try {
            execSync(`npm publish --registry ${REGISTRY} --no-git-checks 2>&1`, {
                cwd: customThemeDir,
                env: {
                    ...process.env,
                    npm_config_registry: REGISTRY,
                }
            });
        } catch (e: any) {
            const output = e.stdout?.toString() + e.stderr?.toString();
            // E409/EPUBLISHCONFLICT = already published, that's fine
            if (!output?.includes('409') && !output?.includes('EPUBLISHCONFLICT') &&
                !e.message?.includes('409') && !e.message?.includes('EPUBLISHCONFLICT')) {
                throw e;
            }
        }

        // Build and serve the test site with the registry env vars
        server = await createXydBuildServer(__dirname, {
            env: {
                npm_config_registry: REGISTRY,
                BUN_CONFIG_REGISTRY: REGISTRY,
            }
        });
    });

    test.afterAll(async () => {
        if (server) await server.stop();
    });

    test('custom npm theme resolves and renders page', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toHaveText('Overview');
    });

    test('custom theme CSS is loaded', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        // Verify custom theme CSS variable is injected
        const hasCustomVar = await page.evaluate(() => {
            const root = document.documentElement;
            const style = getComputedStyle(root);
            return style.getPropertyValue('--custom-theme-test').trim() === '"active"';
        });
        expect(hasCustomVar).toBe(true);
    });
});