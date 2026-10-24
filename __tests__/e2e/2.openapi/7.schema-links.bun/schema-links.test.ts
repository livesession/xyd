import * as path from 'node:path';

import { test, expect } from '@playwright/test';

import { createXydServer, type XydServer } from '../../utils/xyd-server';

// Schema links on the Bun engine (`XYD_BUN=1 xyd build` — the engine the
// self-contained binary embeds), in the two ways a reference is mounted: at the
// root under `advanced.basename` (root/), and under an `api.openapi.route`
// prefix (route/). A property typed by a component schema links to that
// schema's page — nested rows included — and the link has to land on a page the
// build wrote, whatever the prefix. A schema the document hides
// (`x-docs.hidden`) has no page, so a property typed by it never links.
//
// The document is the converter's `5.xdocs.objects` fixture: `listWidgets`
// returns a hidden envelope whose `data` is an array of `Widget` (a page), and
// `Widget.tags` is an array of the hidden `Tag` (no page).
const CASES = [
    { name: 'root + basename', dir: 'root', prefix: '/docs' },
    { name: 'api.openapi.route', dir: 'route', prefix: '/docs/api' },
];

/** The hrefs inside the type column of every property row on a page. */
function typeColumnLinks(html: string): string[] {
    const cells = [...html.matchAll(/<atlas-apiref-proptype[^>]*>([\s\S]*?)<\/atlas-apiref-proptype>/g)];
    return cells.flatMap((m) => [...m[1].matchAll(/href="([^"]+)"/g)].map((h) => h[1]));
}

for (const kase of CASES) {
    test.describe(`openapi — schema links, ${kase.name} (bun engine, build)`, () => {
        test.describe.configure({ mode: 'serial' });

        let server: XydServer;

        test.beforeAll(async () => {
            server = await createXydServer(path.join(__dirname, kase.dir), { mode: 'build', env: { XYD_BUN: '1' } });
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        async function get(urlPath: string) {
            const res = await fetch(server.getUrl(urlPath), { redirect: 'follow' });
            return { status: res.status, body: await res.text() };
        }

        test('a nested row typed by a component schema links to that schema\'s page, under the prefix', async () => {
            const { status, body } = await get(`${kase.prefix}/listWidgets`);
            expect(status).toBe(200);

            const links = typeColumnLinks(body);
            // listWidgets → (hidden envelope) → data: array of Widget
            expect(links).toContain(`${kase.prefix}/objects/Widget`);
            for (const href of links) {
                expect(href.startsWith(`${kase.prefix}/`), href).toBe(true);
                expect((await get(href)).status, href).toBe(200);
            }
        });

        test('a property typed by a hidden schema does not link, and the hidden schema has no page', async () => {
            expect((await get(`${kase.prefix}/objects/Tag`)).status).toBe(404);

            for (const page of ['objects/Widget', 'createWidget']) {
                const { status, body } = await get(`${kase.prefix}/${page}`);
                expect(status, page).toBe(200);
                const links = typeColumnLinks(body);
                expect(links.some((href) => href.endsWith('/objects/Tag')), `${page}: ${links.join(' ')}`).toBe(false);
                for (const href of links) {
                    expect((await get(href)).status, href).toBe(200);
                }
            }
        });

        test('the object page follows its x-docs: title and group', async () => {
            const { status, body } = await get(`${kase.prefix}/objects/Widget`);
            expect(status).toBe(200);
            expect(body).toMatch(/<title>The widget object[^<]*<\/title>/);
        });
    });
}
