import * as fs from 'node:fs';
import * as path from 'node:path';

import { test, expect } from '@playwright/test';

import { createXydServerWithTemplate, type XydServer } from '../../utils/xyd-server';

// A CLI reference (`api.cli`) mounted under `advanced.basename`, built by the
// Bun engine (the engine the self-contained binary embeds), with the CLI's
// global options rendered on every command page
// (`options.globalOptionsPerCommand`). Built from a copy of this directory in a
// fresh temporary workspace, so the test knows the build directory and can
// check that no output names it. Served by the harness's static server
// (`npx serve`, clean URLs), which has no `/_xyd/data` endpoint: client-side
// navigation falls back to fetching the target page.
const BASE = '/docs';

test.describe('opencli — cli reference + basename + global options (bun engine, build)', () => {
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServerWithTemplate(__dirname, { mode: 'build', env: { XYD_BUN: '1' } });
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    async function get(urlPath: string) {
        const res = await fetch(server.getUrl(urlPath), { redirect: 'follow' });
        return { status: res.status, type: res.headers.get('content-type') || '', body: await res.text() };
    }

    function clientDir(): string {
        return path.join(server.getTempDir()!, '.xyd', 'build', 'client');
    }

    test('every command page shows the global options', async ({ page }) => {
        for (const command of ['init', 'deploy', 'project/list']) {
            const resp = await page.goto(server.getUrl(`${BASE}/cli/${command}`));
            expect(resp?.status() ?? 0, command).toBeLessThan(400);
            const body = (await page.textContent('body')) || '';
            expect(body, command).toContain('Global options');
            expect(body, command).toContain('--profile');
            expect(body, command).toContain('--verbose');
        }
        // ... and they get no page of their own
        expect(fs.existsSync(path.join(clientDir(), 'docs', 'cli', 'global-options.html'))).toBe(false);
    });

    test('the llms.txt links carry the basename', async () => {
        const llms = await get(`${BASE}/llms.txt`);
        expect(llms.status).toBe(200);
        const links = [...llms.body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
        expect(links).toContain(`${BASE}/cli/init.md`);
        expect(links).toContain(`${BASE}/cli/project/list.md`);
        for (const link of links) {
            expect(link.startsWith(`${BASE}/`), link).toBe(true);
            expect((await get(link)).status, link).toBe(200);
        }
    });

    test('the .md twins name the CLI source relative to the docs root', async () => {
        const twin = await get(`${BASE}/cli/init.md`);
        expect(twin.status).toBe(200);
        expect(twin.body).toMatch(/^cli: ['"]?~\/acme\.opencli\.json#init['"]?$/m);

        const nested = await get(`${BASE}/cli/project/list.md`);
        expect(nested.body).toMatch(/^cli: ['"]?~\/acme\.opencli\.json#project list['"]?$/m);
    });

    test('no output file names the directory the site was built in', async () => {
        const workspace = server.getTempDir()!;
        // macOS hands out /var/... temp dirs that resolve to /private/var/...
        const needles = [...new Set([workspace, fs.realpathSync(workspace)])];
        const files = fs.readdirSync(clientDir(), { recursive: true, withFileTypes: true })
            .filter((entry) => entry.isFile() && /\.(html|md|txt|json|js|xml)$/.test(entry.name))
            .map((entry) => path.join(entry.parentPath, entry.name));
        expect(files.length).toBeGreaterThan(5);
        for (const file of files) {
            const text = fs.readFileSync(file, 'utf8');
            for (const needle of needles) {
                expect(text.includes(needle), `${path.relative(clientDir(), file)} names ${needle}`).toBe(false);
            }
        }
    });

    test('client-side navigation asks for page data under the basename, never at the host root', async ({ page }) => {
        const requests: { pathname: string; type: string }[] = [];
        page.on('request', (req) => {
            const url = new URL(req.url());
            if (url.host === new URL(server.getUrl()).host) {
                requests.push({ pathname: url.pathname, type: req.resourceType() });
            }
        });

        await page.goto(server.getUrl(`${BASE}/cli/init`));
        await page.waitForLoadState('networkidle');
        requests.length = 0;

        await page.locator(`a[href="${BASE}/cli/deploy"]:visible`).first().click();
        await expect(page).toHaveURL(new RegExp(`${BASE}/cli/deploy$`));
        await expect(page.locator('body')).toContainText('Deploy the current project.');

        const paths = requests.map((r) => r.pathname);
        expect(paths).toContain(`${BASE}/_xyd/data`);
        expect(paths).not.toContain('/_xyd/data');
        // the static host has no data endpoint: the page fetch stood in for it,
        // without a full page load
        expect(requests.filter((r) => r.type === 'document')).toEqual([]);
    });
});
