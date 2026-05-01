import { test, expect } from '@playwright/test';
import * as http from 'node:http';

import { createXydServerWithTemplate, XydServer } from '../../utils/xyd-server';

/**
 * Make an HTTP request with a custom Host header.
 * Node's fetch may ignore the Host header (forbidden header),
 * so we use http.request directly.
 */
function requestWithHost(url: string, host: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname,
            method: 'GET',
            headers: { 'Host': host },
        }, (res) => {
            res.resume();
            resolve(res.statusCode!);
        });
        req.on('error', reject);
        req.end();
    });
}

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
        const status = await requestWithHost(server.getUrl('/overview'), 'test.example.com');
        expect(status).toBe(200);
    });

    test('allowedHosts: request with disallowed host is rejected', async () => {
        // Vite should reject requests with a Host header not in allowedHosts
        const status = await requestWithHost(server.getUrl('/overview'), 'evil.example.com');
        expect(status).toBe(403);
    });

    test('allowedHosts: localhost is always allowed', async ({ page }) => {
        // localhost is implicitly allowed by Vite regardless of allowedHosts
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1');
        await expect(heading).toHaveText('Overview');
    });
});
