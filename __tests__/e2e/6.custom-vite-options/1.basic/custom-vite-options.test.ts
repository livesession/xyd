import { test, expect } from '@playwright/test';

import { createXydServerWithTemplate, XydServer } from '../../utils/xyd-server';

test.describe('Custom Vite Options', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServerWithTemplate(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('allowedHosts: request with allowed host succeeds', async () => {
        // docs.json sets allowedHosts to ["test.example.com"]
        // Vite should accept requests with that Host header
        const response = await fetch(server.getUrl('/overview'), {
            headers: { 'Host': 'test.example.com' },
        });

        expect(response.status).toBe(200);
    });

    test('allowedHosts: request with disallowed host is rejected', async () => {
        // Vite should reject requests with a Host header not in allowedHosts
        const response = await fetch(server.getUrl('/overview'), {
            headers: { 'Host': 'evil.example.com' },
        });

        expect(response.status).toBe(403);
    });

    test('allowedHosts: localhost is always allowed', async ({ page }) => {
        // localhost is implicitly allowed by Vite regardless of allowedHosts
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toHaveText('Overview');
    });
});
