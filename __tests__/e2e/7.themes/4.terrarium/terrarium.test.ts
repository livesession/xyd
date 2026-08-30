import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// The terrarium theme: full-width, high-contrast docs with a ~800px left-aligned
// content column, a decoupled TOC, a taller nav, a fixed sidebar, non-uppercased
// group headers, blue links, a per-product brand accent (driven by a logoTrailing
// product's `color`), HashiCorp-style sidebar chrome, a GLOBAL product switcher
// (routeless segment), and per-product `appearance:"tabs"` tab bars. The render
// path is shared, so we assert the same behavior on BOTH engines.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`themes — terrarium (${engine.name} engine)`, () => {
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

        // The COMPUTED accent — not the inline var. Custom properties resolve where
        // they're declared, so asserting the inline `--theme-color-primary` alone
        // once masked a bug where `--color-primary` still computed to the theme
        // fallback (green) everywhere.
        const accentOf = (page: Page) =>
            page.locator('xyd-layout-primary').evaluate(
                (el) => getComputedStyle(el as HTMLElement).getPropertyValue('--color-primary').trim(),
            );

        // terrarium renders `appearance:"tabs"` segments in the primary-nav CENTER
        // (appearance.tabs.surface === "center"), not in a subnav.
        const tabTexts = (page: Page) =>
            page.locator('[part="nav-center"] xyd-nav-item').allInnerTexts();

        test('full-width layout: ~800px content column and a 64px nav', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');

            const navHeight = await page.evaluate(() =>
                getComputedStyle(document.documentElement).getPropertyValue('--xyd-nav-height').trim(),
            );
            expect(navHeight).toBe('64px');

            const maxWidth = await page.locator('[part="page-article"]').evaluate((el) => getComputedStyle(el).maxWidth);
            expect(maxWidth).toBe('800px');

            const containerMax = await page.locator('[part="page-container"]').first()
                .evaluate((el) => getComputedStyle(el).maxWidth);
            expect(containerMax).toBe('100%');
        });

        test('the left sidebar is fixed (sticky), scrolling independently of content', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const position = await page.locator('[part="sidebar"]')
                .evaluate((el) => getComputedStyle(el).position);
            expect(position).toBe('sticky');
        });

        test('group headers are NOT uppercased (groupCase: none) and are 13px', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const header = page.locator('aside[part="sidebar"] [part="item-header"]').first();
            expect(await header.evaluate((el) => getComputedStyle(el).textTransform)).toBe('none');
            expect(await header.evaluate((el) => getComputedStyle(el).fontSize)).toBe('13px');
        });

        test('groups are separated by a divider between sections (none above the first)', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const headers = page.locator('aside[part="sidebar"] [part="item-header"]');
            await expect(headers).toHaveCount(2);
            // the first group has no divider above it…
            const first = await headers.nth(0).evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
            expect(first).toBe(0);
            // …the second group has a top border (the divider below the first group's section)
            const second = await headers.nth(1).evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
            expect(second).toBeGreaterThan(0);
        });

        test('in-content links are blue (#1060ff), independent of the product accent', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const color = await page.evaluate(() =>
                getComputedStyle(document.documentElement).getPropertyValue('--xyd-anchor-color').trim(),
            );
            // resolves through --terrarium-link → #1060ff
            expect(color === '#1060ff' || color.includes('terrarium-link')).toBeTruthy();
        });

        test('text color tiers: headings #0c0c0e, body #3b3d45, inactive nav item #3b3d45', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const colorOf = (sel: string) =>
                page.locator(sel).first().evaluate((el) => getComputedStyle(el).color);

            expect(await colorOf('[part="page-article-content"] h1')).toBe('rgb(12, 12, 14)');   // #0c0c0e
            expect(await colorOf('[part="page-article-content"] p')).toBe('rgb(59, 61, 69)');     // #3b3d45
            // an inactive center-nav tab (API is inactive on the docs page)
            const inactive = page.locator('[part="nav-center"] xyd-nav-item:not([data-state="active"])').first();
            expect(await inactive.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(59, 61, 69)'); // #3b3d45
        });

        test('in-content prose links are underlined; chrome links are not', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');

            const proseDeco = await page.locator('[part="page-article-content"] p a', { hasText: 'architecture' })
                .first().evaluate((el) => getComputedStyle(el).textDecorationLine);
            expect(proseDeco).toContain('underline');

            // a nav-center tab (chrome) is NOT underlined
            const navDeco = await page.locator('[part="nav-center"] a').first()
                .evaluate((el) => getComputedStyle(el).textDecorationLine);
            expect(navDeco).toBe('none');
        });

        test('the product switcher is GLOBAL — visible on the landing page (routeless segment)', async ({ page }) => {
            await goto(page, '/overview');
            await expect(page.locator('[part="logo"] [data-fw-nav-dropdown]')).toBeVisible();
        });

        test('per-product accent: Nomad → green', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            expect(await accentOf(page)).toBe('#00ca8e');
        });

        test('switching products recolors the accent and swaps the sidebar', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            expect(await accentOf(page)).toBe('#00ca8e');
            await expect(page.locator('aside[part="sidebar"]').getByText('Quickstart')).toBeVisible();

            await goto(page, '/consul/docs/what-is-consul');
            expect(await accentOf(page)).toBe('#dc477d');
            await expect(page.locator('aside[part="sidebar"]').getByText('Quickstart')).toHaveCount(0);

            // The DERIVED tokens must recolor too (they're declared at :root, so
            // they only follow the accent when --theme-color-primary is set at
            // :root): the ACTIVE SIDEBAR ITEM renders in the product color.
            const activeItemColor = await page
                .locator('aside[part="sidebar"] [part="primary-item"][data-active="true"]').first()
                .evaluate((el) => getComputedStyle(el).color);
            expect(activeItemColor).toBe('rgb(220, 71, 125)'); // #dc477d
        });

        test('per-product tabs: Nomad shows Documentation + API, and they persist across the section', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            expect(await tabTexts(page)).toEqual(['Documentation', 'API']);

            // the tab bar stays on a sub-page of the section (route-prefix scoped)
            await goto(page, '/nomad/docs/quickstart');
            expect(await tabTexts(page)).toEqual(['Documentation', 'API']);
        });

        test('the tabs are PER-PRODUCT: Consul shows only Documentation', async ({ page }) => {
            await goto(page, '/consul/docs/what-is-consul');
            expect(await tabTexts(page)).toEqual(['Documentation']);
        });

        test('the tabs render in the nav center, not a subnav', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            await expect(page.locator('[part="nav-center"] xyd-nav-item').first()).toBeVisible();
            await expect(page.locator('xyd-subnav')).toHaveCount(0);
        });

        test('search renders on the RIGHT of the nav (the center hosts the tabs)', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            await expect(page.locator('[part="nav-right"] xyd-search-button')).toBeVisible();
            await expect(page.locator('[part="nav-center"] xyd-search-button')).toHaveCount(0);
        });

        test('mobile: the logo + product switcher are never crushed off-screen', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await goto(page, '/nomad/docs/what-is-nomad');
            const left = await page.locator('[part="nav-left"]').boundingBox();
            expect(left!.x).toBeGreaterThanOrEqual(0);
            // the switcher trigger stays visible…
            await expect(page.locator('[part="nav-left"] [data-fw-nav-dropdown]')).toBeVisible();
            // …and the tabs move to their own FULL-WIDTH second row (the header
            // wraps), horizontally scrollable — not crammed next to the logo
            const rows = await page.evaluate(() => {
                const leftBox = document.querySelector('[part="nav-left"]')!.getBoundingClientRect();
                const center = document.querySelector('[part="nav-center"]')!;
                const centerBox = center.getBoundingClientRect();
                const tablist = center.querySelector('[role="tablist"]')!;
                const nav = document.querySelector('xyd-nav')!;
                return {
                    secondRow: centerBox.top >= leftBox.bottom - 1,
                    // full row width minus the nav's side padding
                    fullWidth: centerBox.width >= window.innerWidth * 0.9,
                    // tabs WRAP to more lines when needed (no horizontal scrolling)
                    wraps: getComputedStyle(tablist).flexWrap === 'wrap',
                    // the sticky header is opaque — content must not show through
                    // behind the wrapped rows
                    opaque: getComputedStyle(nav).backgroundColor !== 'rgba(0, 0, 0, 0)',
                    // the border rides the sticky nav itself, so the WHOLE wrapped
                    // bar (below row 2) ends with the header border
                    borderBottom: parseFloat(getComputedStyle(nav).borderBottomWidth),
                };
            });
            expect(rows.secondRow).toBe(true);
            expect(rows.fullWidth).toBe(true);
            expect(rows.wraps).toBe(true);
            expect(rows.opaque).toBe(true);
            expect(rows.borderBottom).toBeGreaterThan(0);
        });

        test('the active nav tab uses a bottom underline, not a background pill', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const active = page.locator('[part="nav-center"] xyd-nav-item[data-state="active"]');
            await expect(active).toBeVisible();
            const s = await active.evaluate((el) => {
                const cs = getComputedStyle(el);
                return { border: cs.borderBottomWidth, bg: cs.backgroundColor };
            });
            expect(parseFloat(s.border)).toBeGreaterThan(0);           // has an underline
            expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(s.bg); // no pill background
        });

        test('the sidebar has no scroll shadow', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            await expect(page.locator('aside[part="sidebar"] [part="scroll-shadow"]')).toHaveCount(0);
        });

        test('clicking a tab switches section: sidebar + active tab change', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            // the "API" tab links to the API section
            await page.locator('[part="nav-center"] a', { hasText: 'API' }).click();
            await page.waitForURL(/\/nomad\/api\/overview$/);
            // sidebar swapped to the API section (its group header appears; the docs
            // section's pages are gone)
            await expect(
                page.locator('aside[part="sidebar"] [part="item-header"]', { hasText: 'HTTP API' }),
            ).toBeVisible();
            await expect(page.locator('aside[part="sidebar"]').getByText('Quickstart')).toHaveCount(0);
        });

        test('the built-in filter is route-scoped (components.filterSidebar.routes)', async ({ page }) => {
            // routes: ["nomad"] → shown on nomad pages…
            await goto(page, '/nomad/docs/what-is-nomad');
            await expect(page.locator('aside[part="sidebar"] input[aria-label="Filter sidebar"]')).toBeVisible();
            // …but NOT on consul pages (outside the configured routes)
            await goto(page, '/consul/docs/what-is-consul');
            await expect(page.locator('aside[part="sidebar"] input[aria-label="Filter sidebar"]')).toHaveCount(0);
        });

        test('sidebar chrome: "Filter sidebar" input hides non-matching items', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const sidebar = page.locator('aside[part="sidebar"]');
            await expect(sidebar.getByText('Quickstart')).toBeVisible();
            await expect(sidebar.getByText('Architecture')).toBeVisible();

            await sidebar.locator('input[aria-label="Filter sidebar"]').fill('quick');

            await expect(sidebar.getByText('Quickstart')).toBeVisible();
            await expect(sidebar.getByText('Architecture')).toHaveCount(0);
        });

        test('the switcher icon renders a custom SVG image (product logo)', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            // the active product (Nomad) icon is a data-uri SVG → rendered as <img>
            const img = page.locator('[part="dropdown-icon"] img').first();
            await expect(img).toHaveAttribute('src', /^data:image\/svg/);
        });

        test('the built-in filter + a custom fixed component live in the pinned region', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const fixed = page.locator('aside[part="sidebar"] [part="fixed"]');
            // built-in filter is pinned (not in the scrollable list)
            await expect(fixed.locator('input[aria-label="Filter sidebar"]')).toBeVisible();
            // the filter input has a leading filter icon inside the field
            await expect(fixed.locator('[part="sidebar-filter-icon"] svg')).toBeVisible();
            // custom `{ fixed: true, component: { import, props } }` widget renders
            // here, used a hook, and received its config `props` — the label proves
            // prop flow (it differs from the component's "Widget" fallback)
            const widget = fixed.locator('[part="test-widget"]');
            await expect(widget).toHaveText('Pinned Widget');
            await expect(widget).toHaveAttribute('data-product', 'Nomad');
        });

        test('collapsible items: custom chevron, instant expand, no weight change', async ({ page }) => {
            await goto(page, '/nomad/api/overview');
            const btn = page.locator('aside[part="sidebar"] [part="item-button"]', { hasText: 'Advanced' }).first();
            await expect(btn).toBeVisible();
            // terrarium's own chevron glyph (a data-URI mask), rotating fast (0.1s)
            const chev = await btn.evaluate((el) => {
                const cs = getComputedStyle(el, '::after');
                return { mask: cs.maskImage || (cs as any).webkitMaskImage || '', dur: cs.transitionDuration };
            });
            expect(chev.mask).toContain('data:image/svg+xml');
            expect(chev.dur).toContain('0.1s');
            // expand/collapse is INSTANT — the collapse element has no transition
            const weightBefore = await btn.evaluate((el) => getComputedStyle(el).fontWeight);
            await btn.click();
            const collapse = page.locator('aside[part="sidebar"] [part="subtree"] xyd-collapse').first();
            await expect(collapse).toHaveAttribute('data-open', 'true');
            const trans = await collapse.evaluate((el) => getComputedStyle(el).transitionDuration);
            expect(['0s', '0s, 0s']).toContain(trans);
            // …and expanding does NOT change the row's weight (whatever it rests at)
            const weightAfter = await btn.evaluate((el) => getComputedStyle(el).fontWeight);
            expect(weightAfter).toBe(weightBefore);
        });

        test('the STRING form of a custom component (no props) renders with its fallback', async ({ page }) => {
            // nomad/api uses the bare-string form `component: "./components/…"`
            await goto(page, '/nomad/api/overview');
            const widget = page.locator('aside[part="sidebar"] [part="fixed"] [part="test-widget"]');
            await expect(widget).toHaveText('Widget'); // no props → component's fallback
            await expect(widget).toHaveAttribute('data-product', 'Nomad');
        });

        test('the switcher is icon-only: no text label, larger icon', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const trigger = page.locator('[part="logo"] [part="dropdown-trigger"]');
            // iconOnly hides the trigger text label…
            await expect(trigger.locator('[part="dropdown-trigger-label"]')).toHaveCount(0);
            // …and renders the product image at the larger icon-only size (30px)
            const h = await trigger.locator('[part="dropdown-icon"] img').first()
                .evaluate((el) => getComputedStyle(el).height);
            expect(parseFloat(h)).toBeGreaterThanOrEqual(28);
        });

        test('a tab with `dropdownMenu` renders as a hover dropdown (HashiCorp "Documentation ▾" pattern)', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            // the "Guides" tab is a dropdown trigger in the nav center (NOT a plain tab item)
            const trigger = page.locator('[part="nav-center"] [part="dropdown-trigger"]', { hasText: 'Guides' });
            await expect(trigger).toBeVisible();
            // it's active because a child section (nomad/docs) prefixes the current path
            await expect(trigger).toHaveAttribute('data-active', 'true');
            // hovering reveals its sections, each linking to a route that has its own sidebar
            await trigger.hover();
            const menu = page.locator('[part="nav-center"] [data-fw-nav-dropdown] [part="dropdown-list"]');
            await expect(menu.getByText('Getting Started')).toBeVisible();
            await expect(menu.getByText('API Reference')).toBeVisible();
            // the menu entries render their configured icons
            await expect(menu.locator('[part="dropdown-item"] [part="dropdown-icon"] svg')).toHaveCount(2);
            // `dropdownMenu.itemsPerColumn: 1` → the 2 entries flow into 2 COLUMNS
            // (grid, column-first): side by side — same top, different left
            await expect(menu).toHaveAttribute('data-columns', 'true');
            const boxes = await menu.locator('[part="dropdown-item"]').evaluateAll((els) =>
                els.map((el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left) }; }));
            expect(boxes.length).toBe(2);
            expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(3);
            expect(boxes[1].left).toBeGreaterThan(boxes[0].left);
        });

        test('a segment `component` renders as the switcher dropdown PANEL', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            await page.locator('[part="logo"] [part="dropdown-trigger"]').hover();
            // the custom panel renders inside the dropdown (marked data-panel) and used a hook
            const panel = page.locator('[data-fw-nav-dropdown] [part="dropdown-list"][data-panel="true"] [part="segment-panel"]');
            await expect(panel).toBeVisible();
            await expect(panel).toHaveAttribute('data-product', 'Nomad');
        });

        test('the product switcher is spaced away from the logo', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const ml = await page.locator('[part="logo"] [data-fw-nav-dropdown]').first()
                .evaluate((el) => parseFloat(getComputedStyle(el).marginLeft));
            expect(ml).toBeGreaterThan(0);
        });

        test('breadcrumb links: underlined ONLY on hover, heavier than the current page, darken on hover', async ({ page }) => {
            await goto(page, '/nomad/docs/quickstart');
            const crumb = page.locator('[part="page-article-content"] xyd-breadcrumbs a').first();
            await expect(crumb).toBeVisible();

            const rest = await crumb.evaluate((el) => {
                const cs = getComputedStyle(el);
                return { deco: cs.textDecorationLine, weight: cs.fontWeight, color: cs.color };
            });
            // not underlined at rest…
            expect(rest.deco).toBe('none');
            // …but underlined on hover, and the color darkens
            await crumb.hover();
            const hovered = await crumb.evaluate((el) => {
                const cs = getComputedStyle(el);
                return { deco: cs.textDecorationLine, color: cs.color };
            });
            expect(hovered.deco).toContain('underline');
            expect(hovered.color).not.toBe(rest.color);

            // link is heavier than the plain (non-link) current-page crumb
            const currentWeight = await page.locator('[part="page-article-content"] xyd-breadcrumbs [part="item"][data-active="true"]')
                .evaluate((el) => getComputedStyle(el).fontWeight);
            expect(parseFloat(rest.weight)).toBeGreaterThan(parseFloat(currentWeight));
        });

        test('breadcrumbs have breathing room below (not crowding the content)', async ({ page }) => {
            await goto(page, '/nomad/docs/quickstart');
            const mb = await page.locator('[part="page-article-content"] xyd-breadcrumbs').first()
                .evaluate((el) => parseFloat(getComputedStyle(el).marginBottom));
            expect(mb).toBeGreaterThanOrEqual(16);
        });

        test('sidebar group headers are semibold (600), not extrabold', async ({ page }) => {
            await goto(page, '/nomad/docs/what-is-nomad');
            const fw = await page.locator('aside[part="sidebar"] [part="item-header"]').first()
                .evaluate((el) => getComputedStyle(el).fontWeight);
            expect(fw).toBe('600');
        });

        test('terrarium sidebar list padding is 8px 16px (general); fixed region holds the blank space below its input', async ({ page }) => {
            // No fixed region (consul: filter route-scoped out, no fixed component) →
            // the list keeps the general 8px 16px padding.
            await goto(page, '/consul/docs/what-is-consul');
            const consul = await page.locator('aside[part="sidebar"] [part="list"]').first()
                .evaluate((el) => { const cs = getComputedStyle(el); return { pt: cs.paddingTop, pl: cs.paddingLeft }; });
            expect(consul.pl).toBe('16px');
            expect(consul.pt).toBe('8px');
            // With a fixed region (nomad: filter + fixed widget) the list starts flush
            // (top padding 0) and the blank space below the pinned input lives in the
            // FIXED region's own bottom padding — so it survives scrolling (the scrolled
            // list can't touch the input).
            await goto(page, '/nomad/docs/what-is-nomad');
            const nomad = await page.evaluate(() => {
                const list = document.querySelector('aside[part="sidebar"] [part="list"]') as HTMLElement;
                const fixed = document.querySelector('aside[part="sidebar"] [part="fixed"]') as HTMLElement;
                return {
                    listPt: parseFloat(getComputedStyle(list).paddingTop),
                    fixedPb: parseFloat(getComputedStyle(fixed).paddingBottom),
                };
            });
            expect(nomad.listPt).toBe(0);
            expect(nomad.fixedPb).toBeGreaterThan(0);
        });

        test('no empty item-group adds space at the top of the sidebar', async ({ page }) => {
            // Consul has no sidebarDropdown / segment-dropdown configured, so
            // FwSidebarTabsDropdown renders nothing (an empty [part="item-group"]
            // would add top margin/space).
            await goto(page, '/consul/docs/what-is-consul');
            await expect(page.locator('aside[part="sidebar"] [part="item-group"]')).toHaveCount(0);
        });

        test('a FIXED `sidebarDropdown` segment renders its section switcher in the pinned region', async ({ page }) => {
            // nomad declares `appearance: { kind: "sidebarDropdown", options: { fixed: true } }`
            // → the section switcher (Documentation / API) renders inside the sidebar's
            // FIXED container (above the filter), NOT as an item-group in the list.
            await goto(page, '/nomad/docs/what-is-nomad');
            const switcher = page.locator('aside[part="sidebar"] [part="fixed"] xyd-sidebar-tabs-dropdown');
            await expect(switcher).toBeVisible();
            // it shows the current section (nomad/docs → "Documentation")…
            await expect(switcher).toContainText('Documentation');
            // …and no item-group is left in the scrollable list
            await expect(page.locator('aside[part="sidebar"] [part="item-group"]')).toHaveCount(0);
            // the filter input comes BEFORE the switcher in the pinned region
            const filterFirst = await page.evaluate(() => {
                const fixed = document.querySelector('aside[part="sidebar"] [part="fixed"]')!;
                const filter = fixed.querySelector('[part="sidebar-filter"]');
                const sw = fixed.querySelector('xyd-sidebar-tabs-dropdown');
                return !!(filter && sw && (filter.compareDocumentPosition(sw) & Node.DOCUMENT_POSITION_FOLLOWING));
            });
            expect(filterFirst).toBe(true);
            // the first group header sits close under the pinned container (its
            // base 24px top margin is dropped when the fixed region has content)
            const firstHeaderMt = await page.locator('aside[part="sidebar"] [part="list"] [part="item-header"]').first()
                .evaluate((el) => parseFloat(getComputedStyle(el).marginTop));
            expect(firstHeaderMt).toBe(0);
            // the switcher trigger uses the HashiCorp-style accent-derived soft
            // GRADIENT background + an inset 1px accent ring, and no card min-height
            const trig = await switcher.locator('button[part="dropdown-trigger"]').evaluate((el) => {
                const cs = getComputedStyle(el);
                return { bgImage: cs.backgroundImage, shadow: cs.boxShadow, minH: cs.minHeight };
            });
            expect(trig.bgImage).toContain('linear-gradient');
            expect(trig.shadow).toContain('inset');
            expect(trig.minH === '0px' || trig.minH === 'auto').toBe(true);
            // switcher text is medium weight (500), not the base semibold
            const labelWeight = await switcher.locator('[part="dropdown-label"]').first()
                .evaluate((el) => getComputedStyle(el).fontWeight);
            expect(labelWeight).toBe('500');
            // popover entries size like sidebar items (compact padding, small
            // radius) and their labels are NORMAL weight (trigger stays medium)
            await switcher.locator('button[part="dropdown-trigger"]').click();
            const entry = await switcher.locator('[part="dropdown-listitem"]').first().evaluate((el) => {
                const cs = getComputedStyle(el);
                const label = el.querySelector('[part="dropdown-label"]');
                return { pt: cs.paddingTop, pl: cs.paddingLeft, labelWeight: label ? getComputedStyle(label).fontWeight : null };
            });
            expect(entry.pt).toBe('6px');
            expect(entry.pl).toBe('12px');
            expect(entry.labelWeight).toBe('400');
            await page.keyboard.press('Escape');
            // scroll="sidebar": the WHOLE sidebar is the scroller (full-height
            // scrollbar) — the list itself no longer scrolls
            const scrollHost = await page.evaluate(() => {
                const host = document.querySelector('aside[part="sidebar"] xyd-sidebar') as HTMLElement;
                const list = host.querySelector('[part="list"]') as HTMLElement;
                return {
                    hostAttr: host.getAttribute('data-scroll'),
                    hostOverflow: getComputedStyle(host).overflowY,
                    listOverflow: getComputedStyle(list).overflowY,
                };
            });
            expect(scrollHost.hostAttr).toBe('sidebar');
            expect(scrollHost.hostOverflow).toBe('auto');
            expect(scrollHost.listOverflow).toBe('visible');
        });

        test('the section switcher shows ONLY inside its member sections', async ({ page }) => {
            // /nomad/other matches the segment ROUTE (nomad) but is not one of the
            // switcher's sections (nomad/docs, nomad/api) → no switcher there.
            await goto(page, '/nomad/other/index');
            await expect(page.locator('aside[part="sidebar"] xyd-sidebar-tabs-dropdown')).toHaveCount(0);
            // …while member sections still get it
            await goto(page, '/nomad/api/overview');
            await expect(page.locator('aside[part="sidebar"] [part="fixed"] xyd-sidebar-tabs-dropdown')).toBeVisible();
        });
    });
}
