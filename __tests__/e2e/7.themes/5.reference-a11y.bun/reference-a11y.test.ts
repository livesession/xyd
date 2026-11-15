import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import type { AddressInfo } from 'node:net';

import { test, expect, type Browser, type Page } from '@playwright/test';

import { createXydServerWithTemplate, type XydServer } from '../../utils/xyd-server';

// A CLI, an OpenAPI and a GraphQL reference beside a guide, built by the Bun
// engine (the engine the self-contained binary embeds) and served as static
// files. Checks what a reader sees on the reference pages: every text clears
// WCAG AA in light mode, in OS dark mode and in a dark mode picked on the
// site; links in running text stand out from the text around them; the
// phone drawer closes after navigating and keeps its links out of reach
// while closed; a page's trailing-slash form lands on the page.

const PAGES = [
    '/cli/deploy',
    '/cli/project',
    '/api/listProjects',
    '/api/objects/Project',
    '/graphql/queries/todo',
    '/graphql/objects/Todo',
    '/guides/quickstart',
];

// light and dark from the OS, and dark picked with the site's switch (the
// attribute, not the media query, carries the scheme then).
const SCHEMES = [
    { name: 'light', colorScheme: 'light' as const, picked: false },
    { name: 'dark (OS)', colorScheme: 'dark' as const, picked: false },
    { name: 'dark (picked)', colorScheme: 'light' as const, picked: true },
];

const THEMES = ['gusto', 'cosmo', 'opener', 'picasso', 'poetry', 'solar', 'terrarium'];

interface TextContrast {
    ratio: number;
    min: number;
    text: string;
    selector: string;
    color: string;
    background: string;
    // The pointer is on it (or on a descendant of it).
    hovered: boolean;
}

interface Audit {
    texts: TextContrast[];
    // Links inside running text that differ from the text around them by colour
    // alone, with less than 3:1 between the two.
    colourOnlyLinks: { text: string; ratio: number }[];
}

// Runs in the page: the contrast of every visible text in the article against
// the background it sits on, and every link in running text that is neither
// underlined nor 3:1 apart from the text around it.
function auditPage(): Audit {
    function parse(value: string | null): { r: number; g: number; b: number; a: number } | null {
        if (!value) return null;
        const p3 = value.match(/color\(display-p3 ([^)]+)\)/);
        if (p3) {
            const v = p3[1].split(/[ /]+/).filter(Boolean).map(Number);
            const lin = (x: number) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
            const enc = (x: number) => {
                x = Math.min(1, Math.max(0, x));
                return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
            };
            const [R, G, B] = v.slice(0, 3).map(lin);
            return {
                r: enc(1.2249 * R - 0.2247 * G),
                g: enc(-0.042 * R + 1.0419 * G),
                b: enc(-0.0197 * R - 0.0786 * G + 1.0979 * B),
                a: v.length > 3 ? v[3] : 1,
            };
        }
        // color-mix(in srgb, …) computes to color(srgb r g b), channels 0–1.
        const srgb = value.match(/color\(srgb ([^)]+)\)/);
        if (srgb) {
            const v = srgb[1].split(/[ /]+/).filter(Boolean).map(Number);
            return { r: v[0] * 255, g: v[1] * 255, b: v[2] * 255, a: v.length > 3 ? v[3] : 1 };
        }
        const m = value.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    function luminance({ r, g, b }: { r: number; g: number; b: number }) {
        const f = (v: number) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function ratio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
        const l1 = luminance(a);
        const l2 = luminance(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    // The opaque colour behind an element: its own and its ancestors'
    // backgrounds (a gradient counts as its first colour), composited.
    function backgroundOf(el: Element) {
        const layers: { r: number; g: number; b: number; a: number }[] = [];
        for (let e: Element | null = el; e; e = e.parentElement) {
            const style = getComputedStyle(e);
            let c = parse(style.backgroundColor);
            if ((!c || c.a === 0) && /gradient\(/.test(style.backgroundImage)) c = parse(style.backgroundImage);
            if (c && c.a > 0) {
                layers.push(c);
                if (c.a >= 1) break;
            }
        }
        let out = { r: 255, g: 255, b: 255 };
        for (let i = layers.length - 1; i >= 0; i--) {
            const c = layers[i];
            out = { r: c.r * c.a + out.r * (1 - c.a), g: c.g * c.a + out.g * (1 - c.a), b: c.b * c.a + out.b * (1 - c.a) };
        }
        return out;
    }
    function selectorOf(el: Element) {
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
        const part = el.getAttribute('part');
        return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (part ? `[part=${part}]` : '');
    }

    const root = document.querySelector('[part="page-article-content"]') || document.body;
    const texts: TextContrast[] = [];
    const seen = new Set<Element>();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const el = node.parentElement;
        if (!node.textContent?.trim() || !el || seen.has(el)) continue;
        seen.add(el);
        const style = getComputedStyle(el);
        if (el.getBoundingClientRect().width === 0 || style.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
        const fg = parse(style.color);
        if (!fg) continue;
        const bg = backgroundOf(el);
        const shown = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
        const size = parseFloat(style.fontSize);
        const large = size >= 24 || (parseInt(style.fontWeight, 10) >= 700 && size >= 18.66);
        texts.push({
            ratio: Math.round(ratio(shown, bg) * 100) / 100,
            min: large ? 3 : 4.5,
            text: (el.textContent || '').trim().slice(0, 40),
            selector: selectorOf(el),
            color: style.color,
            background: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
            hovered: el.matches(':hover'),
        });
    }

    const colourOnlyLinks: Audit['colourOnlyLinks'] = [];
    for (const a of Array.from(root.querySelectorAll('a'))) {
        if (a.getBoundingClientRect().width === 0 || !a.textContent?.trim()) continue;
        const block = a.parentElement?.closest('p, li, dd, td, th, blockquote, figcaption');
        if (!block || block.closest('nav, xyd-breadcrumbs, xyd-navlinks')) continue;
        if (block.textContent?.trim() === a.textContent.trim()) continue; // no text around it
        const style = getComputedStyle(a);
        if (/underline/.test(style.textDecorationLine)) continue;
        const around = ratio(parse(style.color)!, parse(getComputedStyle(block).color)!);
        if (around < 3) colourOnlyLinks.push({ text: a.textContent.trim(), ratio: Math.round(around * 100) / 100 });
    }

    return { texts, colourOnlyLinks };
}

// A browser context in the scheme: from the OS, or dark picked on the site.
async function schemeContext(browser: Browser, scheme: (typeof SCHEMES)[number]) {
    const context = await browser.newContext({ colorScheme: scheme.colorScheme, viewport: { width: 1280, height: 900 } });
    if (scheme.picked) {
        await context.addInitScript(() => {
            try {
                localStorage.setItem('xyd-color-scheme', 'dark');
            } catch {}
        });
    }
    return context;
}

// The colour of a running-text link and of a reference link (a GraphQL field's
// type, drawn in the reference's accent) in each scheme.
async function linkColours(browser: Browser, server: XydServer) {
    const out: Record<string, { link: string; reference: string }> = {};
    for (const scheme of SCHEMES) {
        const context = await schemeContext(browser, scheme);
        const page = await context.newPage();
        await page.goto(server.getUrl('/guides/quickstart'), { waitUntil: 'networkidle' });
        const link = await page
            .locator('[part="page-article-content"] p a', { hasText: 'command reference' })
            .evaluate((a) => getComputedStyle(a).color);
        await page.goto(server.getUrl('/graphql/queries/todo'), { waitUntil: 'networkidle' });
        const reference = await page
            .locator('[class*="ApiRefPropertiesPropTypeCodeLink"]', { hasText: 'Todo' })
            .first()
            .evaluate((a) => getComputedStyle(a).color);
        out[scheme.name] = { link, reference };
        await context.close();
    }
    return out;
}

// The links a hover test puts the pointer on: one in running text, and a
// reference link (a GraphQL field's type, drawn in the reference's accent).
const HOVER_LINKS = {
    text: { pathname: '/guides/quickstart', selector: '[part="page-article-content"] p a', text: 'command reference' },
    reference: { pathname: '/graphql/queries/todo', selector: '[class*="ApiRefPropertiesPropTypeCodeLink"]', text: 'Todo' },
};

// Each link's contrast while the pointer is on it, in every scheme: the
// failures, empty when every hovered link clears WCAG AA.
async function hoveredLinkFailures(browser: Browser, server: XydServer, links: (keyof typeof HOVER_LINKS)[]) {
    const failures: string[] = [];
    for (const scheme of SCHEMES) {
        const context = await schemeContext(browser, scheme);
        const page = await context.newPage();
        for (const name of links) {
            const link = HOVER_LINKS[name];
            await page.goto(server.getUrl(link.pathname), { waitUntil: 'networkidle' });
            await page.locator(link.selector, { hasText: link.text }).first().hover();
            const audit = await page.evaluate(auditPage);
            const hovered = audit.texts.find((t) => t.hovered && t.text === link.text);
            if (!hovered) {
                failures.push(`${scheme.name}: the ${name} link "${link.text}" is not under the pointer`);
            } else if (hovered.ratio < 4.5) {
                failures.push(`${scheme.name}: the hovered ${name} link "${link.text}" ${hovered.color} on ${hovered.background} = ${hovered.ratio}:1`);
            }
        }
        await context.close();
    }
    return failures;
}

// What every theme's build is checked for besides the contrast audit.
function schemeTests(server: () => XydServer) {
    test('dark mode picked on the site colours links and the reference like dark mode from the OS', async ({ browser }) => {
        const colours = await linkColours(browser, server());
        expect(colours['dark (picked)']).toEqual(colours['dark (OS)']);
    });

    test('a hovered link, in running text and in the reference, still clears WCAG AA', async ({ browser }) => {
        expect(await hoveredLinkFailures(browser, server(), ['text', 'reference'])).toEqual([]);
    });
}

async function auditAll(browser: Browser, server: XydServer) {
    const failures: string[] = [];
    const checked: Record<string, number> = {};
    for (const scheme of SCHEMES) {
        const context = await schemeContext(browser, scheme);
        const page = await context.newPage();
        for (const pathname of PAGES) {
            await page.goto(server.getUrl(pathname), { waitUntil: 'networkidle' });
            if (scheme.picked) {
                await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
            }
            const audit = await page.evaluate(auditPage);
            for (const t of audit.texts) {
                checked[t.selector.replace(/_[a-z0-9]+(?=$|\[)/, '')] = (checked[t.selector.replace(/_[a-z0-9]+(?=$|\[)/, '')] || 0) + 1;
                if (t.ratio < t.min) {
                    failures.push(`${scheme.name} ${pathname}: "${t.text}" ${t.selector} ${t.color} on ${t.background} = ${t.ratio}:1 (needs ${t.min}:1)`);
                }
            }
            for (const link of audit.colourOnlyLinks) {
                failures.push(`${scheme.name} ${pathname}: the link "${link.text}" differs from its text by colour alone (${link.ratio}:1)`);
            }
        }
        await context.close();
    }
    return { failures, checked };
}

test.describe('reference pages — contrast, links, phone drawer, trailing slash (bun engine, build)', () => {
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServerWithTemplate(__dirname, { mode: 'build', env: { XYD_BUN: '1' } });
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    test('every reference text clears WCAG AA in light, OS dark and picked dark mode', async ({ browser }) => {
        const { failures, checked } = await auditAll(browser, server);
        expect(failures).toEqual([]);
        // The audit reached the parts it is about: the option, argument and
        // field names (and, below, the usage line).
        expect(Object.keys(checked).some((n) => n.startsWith('code.ApiRefPropertiesPropNameCodeHost'))).toBe(true);
        expect(await usageLineContrast(browser, server)).toBeGreaterThanOrEqual(4.5);
    });

    test('a running-text link is underlined in dark mode, and the theme colour stays on links', async ({ browser }) => {
        const context = await browser.newContext({ colorScheme: 'dark' });
        const page = await context.newPage();
        await page.goto(server.getUrl('/guides/quickstart'), { waitUntil: 'networkidle' });
        const link = page.locator('[part="page-article-content"] p a', { hasText: 'command reference' });
        const style = await link.evaluate((a) => {
            const s = getComputedStyle(a);
            return { decoration: s.textDecorationLine, color: s.color, text: getComputedStyle(a.closest('p')!).color };
        });
        expect(style.decoration).toContain('underline');
        expect(style.color).not.toBe(style.text);
        await context.close();
    });

    schemeTests(() => server);

    test('the client ships React\'s production build and logs no React warnings', async ({ page }) => {
        const messages: string[] = [];
        page.on('console', (m) => {
            if (m.type() === 'error' || m.type() === 'warning') messages.push(m.text());
        });
        for (const pathname of ['/cli/deploy', '/api/listProjects', '/graphql/queries/todo']) {
            await page.goto(server.getUrl(pathname), { waitUntil: 'networkidle' });
        }
        expect(messages.filter((m) => /React|Invalid prop/.test(m))).toEqual([]);

        const src = await page.locator('script[src*="client-"]').first().getAttribute('src');
        const bundle = await (await fetch(server.getUrl(src!))).text();
        expect(bundle).not.toContain('supplied to `React.Fragment`');
    });

    test.describe('on a phone', () => {
        test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

        async function drawerState(page: Page) {
            return page.evaluate(() => {
                const drawer = document.querySelector('[part="mobile-sidebar"]')!;
                const style = getComputedStyle(drawer);
                return {
                    open: drawer.getAttribute('data-active') === 'true',
                    inert: drawer.hasAttribute('inert'),
                    visibility: style.visibility,
                    boxShadow: style.boxShadow,
                    focus: document.activeElement?.getAttribute('part') || document.activeElement?.tagName.toLowerCase(),
                };
            });
        }

        test('the closed drawer is out of the tab order and casts no shadow', async ({ page }) => {
            await page.goto(server.getUrl('/cli/deploy'), { waitUntil: 'networkidle' });
            expect(await drawerState(page)).toMatchObject({ open: false, inert: true, visibility: 'hidden', boxShadow: 'none' });

            for (let i = 0; i < 30; i++) {
                await page.keyboard.press('Tab');
                const inDrawer = await page.evaluate(() => !!document.activeElement?.closest('[part="mobile-sidebar"]'));
                expect(inDrawer, `tab stop ${i + 1}`).toBe(false);
            }
        });

        test('the drawer closes after a link in it navigates, and focus returns to the menu button', async ({ page }) => {
            await page.goto(server.getUrl('/cli/deploy'), { waitUntil: 'networkidle' });
            const toggle = page.locator('[part="hamburger-button"]');

            await toggle.tap();
            await expect(toggle).toHaveAttribute('aria-expanded', 'true');
            expect(await drawerState(page)).toMatchObject({ open: true, inert: false, visibility: 'visible' });

            await page.locator('[part="mobile-sidebar"] a[href="/cli/init"]').tap();
            await expect(page).toHaveURL(/\/cli\/init$/);
            await expect(page.locator('h1')).toHaveText('init');
            await expect.poll(async () => (await drawerState(page)).open).toBe(false);
            expect(await drawerState(page)).toMatchObject({ inert: true, focus: 'hamburger-button' });
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        });

        test('Escape closes the drawer', async ({ page }) => {
            await page.goto(server.getUrl('/cli/deploy'), { waitUntil: 'networkidle' });
            await page.locator('[part="hamburger-button"]').tap();
            await expect.poll(async () => (await drawerState(page)).open).toBe(true);

            await page.keyboard.press('Escape');

            await expect.poll(async () => (await drawerState(page)).open).toBe(false);
            expect(await drawerState(page)).toMatchObject({ inert: true, focus: 'hamburger-button' });
        });
    });

    test('a trailing slash on a generated page lands on the page', async ({ page }) => {
        // The harness's static server (clean URLs) serves the slashed form itself.
        for (const pathname of ['/cli/deploy/', '/cli/project/list/', '/api/listProjects/']) {
            const response = await page.goto(server.getUrl(pathname), { waitUntil: 'networkidle' });
            expect(response?.status(), pathname).toBe(200);
        }
        await expect(page.locator('h1')).toHaveText('List projects');

        // A host that maps nothing to the slashed form answers it with the build's
        // 404.html, which moves the browser on to the page.
        const clientDir = path.join(server.getTempDir()!, '.xyd', 'build', 'client');
        expect(fs.existsSync(path.join(clientDir, '404.html'))).toBe(true);
        const strict = await strictStaticServer(clientDir);
        try {
            // `commit`: the not-found page replaces the address while it loads.
            await page.goto(`${strict.url}/cli/deploy/`, { waitUntil: 'commit' });
            await expect(page).toHaveURL(`${strict.url}/cli/deploy`);
            await expect(page.locator('h1')).toHaveText('deploy');

            await page.goto(`${strict.url}/cli/project/list/?tab=options#all`, { waitUntil: 'commit' });
            await expect(page).toHaveURL(`${strict.url}/cli/project/list?tab=options#all`);
            await expect(page.locator('h1')).toHaveText('project list');

            // A real miss stays a miss.
            const missing = await page.goto(`${strict.url}/cli/nope`);
            expect(missing?.status()).toBe(404);
            await expect(page.locator('h1')).toHaveText('Page not found');
        } finally {
            await strict.close();
        }
    });
});

// The dev servers of both engines answer a page's trailing-slash form with a
// redirect to the page (the Vite engine used to send it to the first page),
// with the site at the root and under `advanced.basename`.
for (const engine of [
    { name: 'bun engine', env: { XYD_BUN: '1' } as Record<string, string> },
    { name: 'vite engine', env: {} as Record<string, string> },
]) {
    for (const base of ['', '/docs']) {
        test.describe(`dev server — trailing slash (${engine.name}${base ? `, basename ${base}` : ''})`, () => {
            let server: XydServer;
            let template: string | undefined;

            test.beforeAll(async () => {
                let dir = __dirname;
                if (base) {
                    template = fs.mkdtempSync(path.join(os.tmpdir(), 'xyd-reference-basename-'));
                    fs.cpSync(__dirname, template, { recursive: true, filter: (src) => !src.endsWith('.test.ts') && !src.includes('.xyd') });
                    const docsPath = path.join(template, 'docs.json');
                    const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
                    docs.advanced = { ...(docs.advanced || {}), basename: base };
                    fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2));
                    dir = template;
                }
                server = await createXydServerWithTemplate(dir, { mode: 'dev', env: engine.env, readyPath: `${base}/cli/deploy` });
            });

            test.afterAll(async () => {
                await server?.stop();
                if (template) fs.rmSync(template, { recursive: true, force: true });
            });

            test('a page\'s trailing-slash form redirects to the page', async ({ page }) => {
                const res = await fetch(server.getUrl(`${base}/cli/deploy/?tab=1`), { redirect: 'manual' });
                expect(res.status).toBe(308);
                const location = new URL(res.headers.get('location')!, server.getUrl());
                expect(location.pathname + location.search).toBe(`${base}/cli/deploy?tab=1`);

                await page.goto(server.getUrl(`${base}/cli/project/list/`));
                await expect(page).toHaveURL(new RegExp(`${base}/cli/project/list$`));
                await expect(page.locator('h1')).toHaveText('project list');
            });
        });
    }
}

// The other themes render the same reference components with their own
// colours: each one's reference pages clear AA in every scheme too.
for (const theme of THEMES.filter((t) => t !== 'gusto')) {
    test.describe(`reference contrast — ${theme} theme (bun engine, build)`, () => {
        test.describe.configure({ mode: 'serial' });

        let server: XydServer;
        let template: string;

        test.beforeAll(async () => {
            template = fs.mkdtempSync(path.join(os.tmpdir(), `xyd-reference-${theme}-`));
            fs.cpSync(__dirname, template, { recursive: true, filter: (src) => !src.endsWith('.test.ts') && !src.includes('.xyd') });
            const docsPath = path.join(template, 'docs.json');
            const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
            docs.theme.name = theme;
            fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2));
            server = await createXydServerWithTemplate(template, { mode: 'build', env: { XYD_BUN: '1' } });
        });

        test.afterAll(async () => {
            await server?.stop();
            fs.rmSync(template, { recursive: true, force: true });
        });

        test('every reference text clears WCAG AA, and running-text links stand out', async ({ browser }) => {
            const { failures } = await auditAll(browser, server);
            expect(failures).toEqual([]);
        });

        schemeTests(() => server);
    });
}

// A site that sets its own primary gets it on its links and on the reference's
// accent, as on the rest of its accent, whether it sets
// theme.appearance.colors.primary or the --color-primary token through
// theme.appearance.cssTokens. The themes' deeper (or lighter) link shades stand
// in for the theme's own primary only. Terrarium keeps its blue text links
// whatever the accent.
const SITE_PRIMARY = { hex: '#d00000', rgb: 'rgb(208, 0, 0)' };
for (const { theme, engine, via } of [
    ...['gusto', 'poetry', 'cosmo', 'opener', 'picasso', 'terrarium'].map((theme) => ({ theme, engine: 'bun', via: 'colors' })),
    { theme: 'gusto', engine: 'vite', via: 'colors' },
    ...['gusto', 'poetry', 'cosmo', 'opener', 'picasso'].map((theme) => ({ theme, engine: 'bun', via: 'cssTokens' })),
    { theme: 'gusto', engine: 'vite', via: 'cssTokens' },
]) {
    test.describe(`a site's own primary colour through ${via} — ${theme} theme (${engine} engine, build)`, () => {
        test.describe.configure({ mode: 'serial' });

        let server: XydServer;
        let template: string;

        test.beforeAll(async () => {
            template = fs.mkdtempSync(path.join(os.tmpdir(), `xyd-reference-primary-${via}-${theme}-`));
            fs.cpSync(__dirname, template, { recursive: true, filter: (src) => !src.endsWith('.test.ts') && !src.includes('.xyd') });
            const docsPath = path.join(template, 'docs.json');
            const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
            docs.theme.name = theme;
            docs.theme.appearance = {
                ...(docs.theme.appearance || {}),
                ...(via === 'colors' ? { colors: { primary: SITE_PRIMARY.hex } } : { cssTokens: { '--color-primary': SITE_PRIMARY.hex } }),
            };
            fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2));
            server = await createXydServerWithTemplate(template, { mode: 'build', env: engine === 'bun' ? { XYD_BUN: '1' } : {} });
        });

        test.afterAll(async () => {
            await server?.stop();
            fs.rmSync(template, { recursive: true, force: true });
        });

        test('colours the links and the reference accent', async ({ browser }) => {
            const colours = await linkColours(browser, server);
            // The reference's accent is the site's colour in light mode; dark mode
            // draws it in the text colour, as without a colour of the site's own.
            expect(colours.light.reference).toBe(SITE_PRIMARY.rgb);
            if (theme !== 'terrarium') {
                // No dark colour set: the primary applies in dark mode too.
                for (const scheme of SCHEMES) expect(colours[scheme.name].link, scheme.name).toBe(SITE_PRIMARY.rgb);
            }
        });

        test('a hovered reference link in the site\'s colour still clears WCAG AA', async ({ browser }) => {
            expect(await hoveredLinkFailures(browser, server, ['reference'])).toEqual([]);
        });
    });
}

// The usage line at the top of a command page (`acme deploy [options] [target]`)
// in dark mode, where it kept a light box with light text.
async function usageLineContrast(browser: Browser, server: XydServer): Promise<number> {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto(server.getUrl('/cli/deploy'), { waitUntil: 'networkidle' });
    const audit = await page.evaluate(auditPage);
    await context.close();
    const usage = audit.texts.filter((t) => t.text.startsWith('acme deploy [options] [target]'));
    expect(usage.length).toBeGreaterThan(0);
    return Math.min(...usage.map((t) => t.ratio));
}

// A static server that knows exact files and `<path>.html` only, and answers
// anything else with 404.html — the way an object store set up as a website, or
// a host with no rewrites, treats the flattened output.
async function strictStaticServer(dir: string): Promise<{ url: string; close: () => Promise<void> }> {
    const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.txt': 'text/plain',
    };
    const server = http.createServer((req, res) => {
        const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
        const rel = pathname.replace(/^\/+/, '');
        const candidates = rel === '' ? ['index.html'] : [rel, `${rel}.html`];
        for (const candidate of candidates) {
            const file = path.join(dir, candidate);
            if (!file.startsWith(dir + path.sep) && file !== dir) continue;
            if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
                res.end(fs.readFileSync(file));
                return;
            }
        }
        res.writeHead(404, { 'content-type': 'text/html' });
        res.end(fs.readFileSync(path.join(dir, '404.html')));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    return {
        url: `http://localhost:${port}`,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    };
}
