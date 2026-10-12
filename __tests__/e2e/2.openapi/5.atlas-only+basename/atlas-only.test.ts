import * as fs from 'node:fs';
import * as path from 'node:path';

import { test, expect } from '@playwright/test';

import { createXydServer, type XydServer } from '../../utils/xyd-server';

// Atlas-only: `xyd build ./openapi.yaml` — the fast-serve mode, the positional
// document and no docs content — mounted under `advanced.basename` from the
// docs.json beside it. The static output has to be ONE self-contained tree at
// client/docs/: the landing page synthesized from info.title, a page per
// operation and per schema, the raw routes (llms.txt + the .md twins) and the
// assets, every URL carrying the prefix. Served by the harness's static server
// (`npx serve`, clean URLs) exactly like a production host would.
const BASE = '/docs';

test.describe('openapi — atlas-only + basename (build)', () => {
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServer(__dirname, { mode: 'build', args: ['./openapi.yaml'] });
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    async function get(urlPath: string) {
        const res = await fetch(server.getUrl(urlPath), { redirect: 'follow' });
        return { status: res.status, type: res.headers.get('content-type') || '', body: await res.text() };
    }

    test('the landing page is synthesized from info.title, under the prefix', async ({ page }) => {
        const res = await get(`${BASE}/`);
        expect(res.status).toBe(200);
        expect(res.type).toContain('text/html');
        expect(res.body).toMatch(/<title>Book API[^<]*<\/title>/);

        await page.goto(server.getUrl(`${BASE}/`));
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1').first()).toHaveText('Book API');
        await expect(page.locator('main')).toContainText('API for managing books and authors');
    });

    test('one page per operation and per schema', async () => {
        const operation = await get(`${BASE}/getBookByTitle`);
        expect(operation.status).toBe(200);
        expect(operation.body).toMatch(/<title>Get a book by title[^<]*<\/title>/);

        const schema = await get(`${BASE}/objects/Book`);
        expect(schema.status).toBe(200);
        expect(schema.body).toMatch(/<title>Book[^<]*<\/title>/);
    });

    test('the asset URLs carry the prefix and resolve', async () => {
        const { body } = await get(`${BASE}/getBookByTitle`);
        const urls = [...body.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
        const assets = urls.filter((u) => u.includes('/assets/'));
        expect(assets.length).toBeGreaterThan(0);
        for (const url of assets) {
            expect(url.startsWith(`${BASE}/assets/`)).toBe(true);
        }
        // the page's own links stay under the prefix too
        const links = urls.filter((u) => !u.includes('/assets/'));
        for (const url of links) {
            expect(url === BASE || url.startsWith(`${BASE}/`)).toBe(true);
        }

        const script = assets.find((u) => u.endsWith('.js'))!;
        expect((await get(script)).status).toBe(200);
    });

    test('the raw routes: llms.txt and the .md twins', async () => {
        const llms = await get(`${BASE}/llms.txt`);
        expect(llms.status).toBe(200);
        expect(llms.type).toContain('text/plain');
        expect(llms.body).toContain('Book API');

        const twin = await get(`${BASE}/getBookByTitle.md`);
        expect(twin.status).toBe(200);
        expect(twin.type).toContain('text/markdown');
    });

    test('the output tree is self-contained under the prefix', async () => {
        const client = path.join(__dirname, '.xyd', 'build', 'client');
        const segments = BASE.split('/').filter(Boolean);
        const mount = path.join(client, ...segments);

        // the basename's own index stays index.html (not hoisted to <basename>.html)
        expect(fs.existsSync(path.join(mount, 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(client, ...segments.slice(0, -1), `${segments.at(-1)}.html`))).toBe(false);
        // routes are flattened as usual
        expect(fs.existsSync(path.join(mount, 'getBookByTitle.html'))).toBe(true);
        expect(fs.existsSync(path.join(mount, 'objects', 'Book.html'))).toBe(true);
        // assets + the SPA fallback live under the mount, nothing at the client root
        expect(fs.existsSync(path.join(mount, 'assets'))).toBe(true);
        expect(fs.existsSync(path.join(client, 'assets'))).toBe(false);
        expect(fs.existsSync(path.join(mount, '__spa-fallback.html'))).toBe(true);
        expect(fs.existsSync(path.join(client, '__spa-fallback.html'))).toBe(false);
        expect(fs.existsSync(path.join(mount, 'llms.txt'))).toBe(true);
    });
});
