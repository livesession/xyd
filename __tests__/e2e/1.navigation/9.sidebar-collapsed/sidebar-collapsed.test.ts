import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// `collapsed: true` on a TOP-LEVEL sidebar group: its header becomes a toggle —
// a button carrying the group's name, `aria-expanded`, `aria-controls` the tree
// it folds — and the group starts folded on a page outside it. It opens on a
// click (or Enter), or when it holds the current page, and, like the rest of
// the sidebar's open state, starts over on the next page. Groups without the
// flag keep their static header; a nested group inside stays an ordinary
// nested group. Run on BOTH engines.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`navigation — sidebar collapsed groups (${engine.name} engine)`, () => {
        // One dev server per engine (parallel workers each boot their own and
        // vite cold boots exceed the 2-minute start timeout).
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
        const header = (page: Page, title: string) =>
            sidebar(page).locator('li[part="item-header"]', { hasText: title });
        const toggle = (page: Page) =>
            sidebar(page).locator('button[part="item-header-toggle"]', { hasText: 'Reference' });
        // the collapsible group's rows: one root-level subtree over the same
        // xyd-collapse the nested groups use
        const groupTree = (page: Page) =>
            sidebar(page).locator('li[data-group-tree] > ul[part="subtree"][data-root] > xyd-collapse');
        const nestedTree = (page: Page, title: string) =>
            sidebar(page).locator('button[part="item-button"]', { hasText: title })
                .locator('xpath=following-sibling::ul[@part="subtree"]/xyd-collapse');
        const link = (page: Page, title: string) =>
            sidebar(page).locator('a[part="item-link"]', { hasText: title });

        test('the header is a toggle, folded on a page outside the group; a plain group keeps its static header', async ({ page }) => {
            await goto(page, '/docs/introduction');

            await expect(toggle(page)).toBeVisible();
            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
            await expect(header(page, 'Reference')).toHaveAttribute('data-collapsible', 'true');
            await expect(header(page, 'Reference')).toHaveAttribute('data-open', 'false');
            await expect(groupTree(page)).toHaveAttribute('data-open', 'false');
            // the rows are not mounted while the group is folded
            await expect(link(page, 'Widget')).toHaveCount(0);

            // aria-controls names the tree the toggle folds
            const controls = await toggle(page).getAttribute('aria-controls');
            expect(controls).toBeTruthy();
            await expect(sidebar(page).locator(`ul[part="subtree"][data-root][id="${controls}"]`)).toHaveCount(1);

            // the group without the flag: a static header, no toggle, rows listed
            await expect(header(page, 'Get Started')).toBeVisible();
            await expect(header(page, 'Get Started').locator('button')).toHaveCount(0);
            await expect(link(page, 'Changelog')).toBeVisible();
        });

        test('a click opens the group, a second click folds it again', async ({ page }) => {
            await goto(page, '/docs/introduction');

            await toggle(page).click();
            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
            await expect(header(page, 'Reference')).toHaveAttribute('data-open', 'true');
            await expect(groupTree(page)).toHaveAttribute('data-open', 'true');
            await expect(link(page, 'Widget')).toBeVisible();
            await expect(link(page, 'Part')).toBeVisible();
            // the nested group inside stays a nested group: folded until clicked
            await expect(nestedTree(page, 'Nested')).toHaveAttribute('data-open', 'false');
            await expect(link(page, 'Assembly')).toHaveCount(0);

            await toggle(page).click();
            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
            await expect(groupTree(page)).toHaveAttribute('data-open', 'false');
            // the rows unmount once the collapse has animated
            await expect(link(page, 'Widget')).toHaveCount(0);
        });

        test('the toggle works from the keyboard', async ({ page }) => {
            await goto(page, '/docs/introduction');

            await toggle(page).focus();
            await page.keyboard.press('Enter');

            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
            await expect(link(page, 'Widget')).toBeVisible();
        });

        test('the group starts open on a page inside it, with the active row', async ({ page }) => {
            await goto(page, '/docs/reference/widget');

            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
            await expect(groupTree(page)).toHaveAttribute('data-open', 'true');
            await expect(sidebar(page).locator('[part="primary-item"][data-active="true"]')).toHaveText('Widget');
            // the sibling nested group is not the page's, so it stays folded
            await expect(nestedTree(page, 'Nested')).toHaveAttribute('data-open', 'false');
        });

        test('a page in a nested group opens the group and the nested group', async ({ page }) => {
            await goto(page, '/docs/reference/nested/assembly');

            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
            await expect(nestedTree(page, 'Nested')).toHaveAttribute('data-open', 'true');
            await expect(link(page, 'Assembly')).toBeVisible();
        });

        test('the open state starts over on the next page', async ({ page }) => {
            await goto(page, '/docs/introduction');
            await toggle(page).click();
            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');

            await link(page, 'Changelog').click();
            await expect.poll(() => page.evaluate(() => window.location.pathname))
                .toContain('/docs/changelog');

            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
            await expect(groupTree(page)).toHaveAttribute('data-open', 'false');
        });

        test('leaving the group folds it again', async ({ page }) => {
            await goto(page, '/docs/reference/widget');
            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');

            await link(page, 'Introduction').click();
            await expect.poll(() => page.evaluate(() => window.location.pathname))
                .toContain('/docs/introduction');

            await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        });
    });
}
