import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

const REGISTRY = process.env.npm_config_registry || 'http://localhost:4873';

test.describe('Custom npm Theme (Advanced)', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        const customThemeDir = path.resolve(__dirname, 'custom-theme-advanced');

        // Publish the custom theme package (ignore if already published)
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
            if (!output?.includes('409') && !output?.includes('EPUBLISHCONFLICT') &&
                !e.message?.includes('409') && !e.message?.includes('EPUBLISHCONFLICT')) {
                throw e;
            }
        }

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

    test('page renders with advanced custom theme', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toHaveText('Overview');
    });

    test('this.surfaces.define() injects sidebar top component', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const sidebarTop = page.locator('[data-testid="custom-sidebar-top"]');
        await expect(sidebarTop.last()).toBeVisible();
    });

    test('this.theme.Update() applies appearance config', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        // The custom theme CSS sets --custom-advanced-theme: "active"
        const hasCustomVar = await page.evaluate(() => {
            const root = document.documentElement;
            const style = getComputedStyle(root);
            return style.getPropertyValue('--custom-advanced-theme').trim() === '"active"';
        });
        expect(hasCustomVar).toBe(true);
    });

    test('custom primary color is applied via vars.css', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const primaryColor = await page.evaluate(() => {
            const root = document.documentElement;
            return getComputedStyle(root).getPropertyValue('--color-primary').trim();
        });
        expect(primaryColor).toBe('#e17055');
    });

});