import * as fs from 'node:fs';
import * as path from 'node:path';

import { test, expect } from '@playwright/test';

import { createXydServer, type XydServer } from '../../utils/xyd-server';

// The API reference mounted under `advanced.basename`, built by the Bun engine
// (`XYD_BUN=1 xyd build` — the engine the self-contained binary embeds). The
// document comes from `api.openapi` in docs.json rather than from the positional
// of the fast-serve mode: the Bun build is launched without the CLI's argv, so a
// positional never reaches its settings loader. The static output has to be ONE
// self-contained tree at client/docs/, exactly like the Vite engine's (see the
// sibling 5.atlas-only+basename): the pages, the raw routes, sitemap.xml /
// robots.txt AND the hashed assets, every URL carrying the prefix. The engine
// used to leave assets/ and the SEO files at the client root while the pages
// referenced them as /assets/*, which a host that mounts client/docs/ at /docs
// cannot serve. Served by the harness's static server (`npx serve`, clean URLs).
const BASE = '/docs';

test.describe('openapi — api reference + basename (bun engine, build)', () => {
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServer(__dirname, { mode: 'build', env: { XYD_BUN: '1' } });
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    async function get(urlPath: string) {
        const res = await fetch(server.getUrl(urlPath), { redirect: 'follow' });
        return { status: res.status, type: res.headers.get('content-type') || '', body: await res.text() };
    }

    test('the landing page and the reference pages are under the prefix', async () => {
        const landing = await get(`${BASE}/`);
        expect(landing.status).toBe(200);
        expect(landing.type).toContain('text/html');
        expect(landing.body).toMatch(/<title>Book API[^<]*<\/title>/);

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
        // the client module, the stylesheets, the settings and the icon-set scripts
        expect(assets.length).toBeGreaterThan(1);
        for (const url of assets) {
            expect(url.startsWith(`${BASE}/assets/`), url).toBe(true);
            expect((await get(url)).status, url).toBe(200);
        }
        // the page's own links stay under the prefix too
        const links = urls.filter((u) => !u.includes('/assets/'));
        for (const url of links) {
            expect(url === BASE || url.startsWith(`${BASE}/`), url).toBe(true);
        }
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
        const mount = path.join(client, ...BASE.split('/').filter(Boolean));

        // the pages, flattened as usual
        expect(fs.existsSync(path.join(mount, 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(mount, 'getBookByTitle.html'))).toBe(true);
        expect(fs.existsSync(path.join(mount, 'objects', 'Book.html'))).toBe(true);
        // the hashed assets, the SEO files and the raw routes live under the
        // mount — nothing of the site at the client root
        expect(fs.existsSync(path.join(mount, 'assets'))).toBe(true);
        expect(fs.existsSync(path.join(client, 'assets'))).toBe(false);
        for (const file of ['sitemap.xml', 'robots.txt', 'llms.txt']) {
            expect(fs.existsSync(path.join(mount, file)), file).toBe(true);
            expect(fs.existsSync(path.join(client, file)), file).toBe(false);
        }
    });
});
