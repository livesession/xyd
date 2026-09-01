import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// sidebar-as-TOC (`asToc: true` sidebar groups): the groups' pages are NOT
// real pages — their content is composed into ONE host page (here: the root
// index) as `[data-astoc-section]` sections. The sidebar items act as that
// page's TOC: clicking scrolls (hash only, no route change), scrolling marks
// the matching item active, and the right-hand TOC is hidden on the host.
// Normal groups ("Resources") keep normal page navigation. Run on BOTH
// engines — they exercise DIFFERENT pagemap implementations (Rust vs JS).
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

const SECTION_IDS = [
    'operating-systems-linux',
    'operating-systems-windows',
    'operating-systems-macos',
    'programming-languages-python',
    'programming-languages-javascript',
    'programming-languages-java',
    'tools-git',
];

for (const engine of ENGINES) {
    test.describe(`navigation — sidebar-as-toc (${engine.name} engine)`, () => {
        // One dev server per engine: without serial mode every parallel worker
        // would run beforeAll and boot its OWN server — concurrent vite boots
        // regularly exceed the 2-minute start timeout on a loaded machine.
        test.describe.configure({ mode: 'serial' });

        let server: XydServer;

        test.beforeAll(async () => {
            server = await engine.make(__dirname);
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        async function goto(page: Page, path: string) {
            await page.goto(server.getUrl(path));
            await page.waitForLoadState('networkidle');
        }

        const sidebar = (page: Page) => page.locator('aside[part="sidebar"]');
        const itemLink = (page: Page, sectionId: string) =>
            sidebar(page).locator(`a[href$="#${sectionId}"]`);

        test('sidebar renders asToc items with frontmatter titles under their group headers', async ({ page }) => {
            await goto(page, '/');

            // innerText reflects CSS text-transform (poetry uppercases group
            // headers) — compare case-insensitively.
            const headers = await sidebar(page).locator('[part="item-header"]').allInnerTexts();
            expect(headers.map(h => h.trim().toLowerCase())).toEqual(
                expect.arrayContaining(['operating systems', 'programming languages', 'tools', 'resources'])
            );

            for (const title of ['Linux', 'Windows', 'macOS', 'Python', 'JavaScript', 'Java', 'Git']) {
                await expect(sidebar(page).getByText(title, { exact: true })).toBeVisible();
            }

            // asToc items link to host + section anchors, not to page routes
            for (const id of SECTION_IDS) {
                await expect(itemLink(page, id)).toHaveCount(1);
            }
        });

        test('the host page contains every section in config order, intro first', async ({ page }) => {
            await goto(page, '/');

            const ids = await page
                .locator('[data-astoc-section]')
                .evaluateAll(els => els.map(el => el.id));
            expect(ids).toEqual(SECTION_IDS);

            await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
            // Intro renders before the first section
            const introY = (await page.getByRole('heading', { name: 'Overview' }).boundingBox())!.y;
            const firstSectionY = (await page.locator('#operating-systems-linux').boundingBox())!.y;
            expect(introY).toBeLessThan(firstSectionY);

            // Section content is really injected
            await expect(page.locator('#operating-systems-linux')).toContainText('family of open-source');
            await expect(page.locator('#programming-languages-java')).toContainText('object-oriented');
        });

        test('clicking an asToc item scrolls to its section without navigating', async ({ page }) => {
            await goto(page, '/');

            await itemLink(page, 'operating-systems-macos').click();

            // hash updates via history.replaceState; pathname must NOT change
            await expect.poll(async () => page.evaluate(() => window.location.hash))
                .toBe('#operating-systems-macos');
            expect(await page.evaluate(() => window.location.pathname)).toBe('/');

            // the section lands near the top of the viewport (smooth scroll)
            await expect.poll(async () => {
                const box = await page.locator('#operating-systems-macos').boundingBox();
                return box ? Math.abs(box.y) : Infinity;
            }, { timeout: 5000 }).toBeLessThan(150);
        });

        test('scrolling marks the matching sidebar item active (scroll-spy)', async ({ page }) => {
            await goto(page, '/');

            const activeMarker = (id: string) =>
                itemLink(page, id).locator('[part="primary-item"][data-active="true"]');

            // scroll to a late section
            await page.evaluate(() => {
                const el = document.getElementById('programming-languages-java');
                window.scrollTo(0, el!.getBoundingClientRect().top + window.pageYOffset - 40);
            });
            await expect.poll(async () => activeMarker('programming-languages-java').count())
                .toBe(1);

            // scroll back to an earlier section — active follows
            await page.evaluate(() => {
                const el = document.getElementById('operating-systems-windows');
                window.scrollTo(0, el!.getBoundingClientRect().top + window.pageYOffset - 40);
            });
            await expect.poll(async () => activeMarker('operating-systems-windows').count())
                .toBe(1);
            expect(await activeMarker('programming-languages-java').count()).toBe(0);
        });

        test('the right-hand TOC is hidden on the host page but present on a normal page', async ({ page }) => {
            await goto(page, '/');
            await expect(page.locator('xyd-toc')).toHaveCount(0);

            await goto(page, '/resources/getting-help');
            await expect(page.locator('xyd-toc')).toHaveCount(1);
        });

        test('normal-group items navigate; an asToc item from there returns to the host + hash', async ({ page }) => {
            await goto(page, '/');

            await sidebar(page).locator('a[href$="/resources/getting-help"]').click();
            await expect.poll(async () => page.evaluate(() => window.location.pathname))
                .toContain('/resources/getting-help');
            await expect(page.getByRole('heading', { name: 'Getting Help' })).toBeVisible();

            // Off-host, an asToc item is a normal link to <host>#<section> —
            // it navigates back to the host and scrolls to the section.
            await itemLink(page, 'programming-languages-python').click();
            await expect.poll(async () => page.evaluate(() => window.location.pathname))
                .toBe('/');
            await expect.poll(async () => page.evaluate(() => window.location.hash))
                .toBe('#programming-languages-python');
            await expect.poll(async () => {
                const box = await page.locator('#programming-languages-python').boundingBox();
                return box ? Math.abs(box.y) : Infinity;
            }, { timeout: 5000 }).toBeLessThan(300);
        });

        test('asToc section paths are NOT real pages — direct visits 404', async ({ page }) => {
            const resp = await page.goto(server.getUrl('/operating-systems/linux'));
            expect(resp?.status()).toBe(404);
        });

        test('CONSECUTIVE asToc groups share ONE TOC track; `indicator: false` opts out', async ({ page }) => {
            await goto(page, '/');

            // "Operating Systems" (asToc: true) and "Programming Languages"
            // (asToc: {}) are adjacent — they merge into a SINGLE [data-astoc]
            // wrapper (headers included) so ONE continuous line spans both,
            // never a broken per-group line.
            const wrappers = sidebar(page).locator('[part="item-group"][data-astoc="true"]');
            await expect(wrappers).toHaveCount(1);

            const wrapper = wrappers.first();
            await expect(wrapper.locator('a[href$="#operating-systems-linux"]')).toHaveCount(1);
            await expect(wrapper.locator('a[href$="#programming-languages-python"]')).toHaveCount(1);
            const headerTexts = await wrapper.locator('[part="item-header"]').allInnerTexts();
            expect(headerTexts.map(h => h.trim().toLowerCase()))
                .toEqual(['operating systems', 'programming languages']);

            // "Tools" (asToc: { indicator: false }) — plain look, outside the
            // wrapper, but its items are still asToc sections (hash hrefs).
            await expect(wrapper.locator('a[href$="#tools-git"]')).toHaveCount(0);
            await expect(itemLink(page, 'tools-git')).toHaveCount(1);

            // the wrapper actually draws the track (pseudo-element with 2px width)
            const trackWidth = await wrapper.evaluate(
                (el) => getComputedStyle(el, '::before').width,
            );
            expect(trackWidth).toBe('2px');
        });

        test('host-page breadcrumbs follow the section being read', async ({ page }) => {
            await goto(page, '/');

            const crumbTexts = () => page.locator('xyd-breadcrumbs [part="item"]').allInnerTexts();

            // at the top the first section is active → "Operating Systems / Linux"
            await expect.poll(crumbTexts).toEqual(['Operating Systems', 'Linux']);

            // scroll to a later section → crumbs follow (breadcrumbs stay
            // enabled for the indicator-less group — options are independent)
            await page.evaluate(() => {
                const el = document.getElementById('programming-languages-java');
                window.scrollTo(0, el!.getBoundingClientRect().top + window.pageYOffset - 40);
            });
            await expect.poll(crumbTexts).toEqual(['Programming Languages', 'Java']);
        });

        test('joined sections are visually separated and clear the sticky header on scroll', async ({ page }) => {
            await goto(page, '/');

            const second = page.locator('#operating-systems-windows');
            const marginTop = await second.evaluate((el) => getComputedStyle(el).marginTop);
            expect(parseFloat(marginTop)).toBeGreaterThanOrEqual(32);

            const scrollMargin = await second.evaluate((el) => getComputedStyle(el).scrollMarginTop);
            expect(parseFloat(scrollMargin)).toBeGreaterThan(0);
        });

        test('prev/next navlinks skip asToc sections', async ({ page }) => {
            await goto(page, '/resources/getting-help');

            const links = page.locator('xyd-navlinks [part="link"]');
            const texts = (await links.allInnerTexts()).join(' ');
            // next → FAQ (the only other real page); no section ever appears
            expect(texts).toContain('FAQ');
            for (const sectionTitle of ['Linux', 'Windows', 'macOS', 'Python', 'JavaScript', 'Java', 'Git']) {
                expect(texts).not.toContain(sectionTitle);
            }
        });
    });
}
