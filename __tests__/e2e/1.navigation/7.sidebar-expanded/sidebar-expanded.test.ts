import { test, expect, Page } from '@playwright/test';

import { createXydServer, XydServer } from '../../utils/xyd-server';

// `expanded: true` on a nested sidebar group: it opens on load even when the
// reader is on a page outside it. It is a DEFAULT, not a lock — clicking still
// collapses it, and nothing re-opens it while the reader stays on the page (the
// asToc host below re-seeds the sidebar's open state on every scroll). Like the
// rest of the sidebar's open state, it starts over on the next page.
test.describe('navigation — sidebar expanded groups', () => {
    // One dev server for the file: parallel workers would each boot their own,
    // and concurrent vite boots exceed the start timeout.
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServer(__dirname);
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    async function goto(page: Page, path: string) {
        await page.goto(server.getUrl(path));
        await page.waitForLoadState('networkidle');
    }

    const sidebar = (page: Page) => page.locator('aside[part="sidebar"]');
    const groupButton = (page: Page, title: string) =>
        sidebar(page).locator('button[part="item-button"]', { hasText: title });
    const subtree = (page: Page, title: string) =>
        groupButton(page, title).locator('xpath=following-sibling::ul[@part="subtree"]/xyd-collapse');
    const link = (page: Page, title: string) =>
        sidebar(page).locator('a[part="item-link"]', { hasText: title });

    test('the group starts open on an unrelated page; groups without the flag stay closed', async ({ page }) => {
        await goto(page, '/docs/introduction');

        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'true');
        await expect(link(page, 'Overview')).toBeVisible();

        await expect(subtree(page, 'API')).toHaveAttribute('data-open', 'false');
        await expect(link(page, 'Errors')).toHaveCount(0);
    });

    test('clicking the group still collapses it', async ({ page }) => {
        await goto(page, '/docs/introduction');
        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'true');

        await groupButton(page, 'Documentation').click();

        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'false');
    });

    test('a collapse holds while the reader stays on the page (scroll-spy re-seeds the tree)', async ({ page }) => {
        await goto(page, '/');
        await groupButton(page, 'Documentation').click();
        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'false');

        // The asToc host tracks the scrolled-to section, which rebuilds the
        // sidebar's initial open state — the default must not win here.
        await page.evaluate(() => {
            const el = document.getElementById('sections-beta');
            window.scrollTo(0, el!.getBoundingClientRect().top + window.pageYOffset - 40);
        });
        // wait for scroll-spy to land, i.e. for the rebuild to have happened
        await expect(sidebar(page).locator('[part="primary-item"][data-active="true"]'))
            .toHaveText('Beta');

        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'false');
    });

    test('the default is applied again on the next page', async ({ page }) => {
        await goto(page, '/docs/introduction');
        await groupButton(page, 'Documentation').click();
        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'false');

        await link(page, 'Changelog').click();
        await expect.poll(() => page.evaluate(() => window.location.pathname))
            .toContain('/docs/changelog');

        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'true');
    });

    // A heading-less sidebar wraps everything in one `group: false` and nests the
    // real groups inside it, which puts the expanded group a level deeper and
    // reaches it through the branch that renders children without a SubTree.
    test('it works inside an unlabelled `group: false` wrapper', async ({ page }) => {
        await goto(page, '/docs/introduction');

        await expect(subtree(page, 'Nested Docs')).toHaveAttribute('data-open', 'true');
        // and the wrapper itself renders no header row
        await expect(sidebar(page).locator('li[part="item-header"]', { hasText: 'false' })).toHaveCount(0);
    });

    test('the group holding the active page opens as usual, next to the expanded one', async ({ page }) => {
        await goto(page, '/docs/api/errors');

        await expect(subtree(page, 'API')).toHaveAttribute('data-open', 'true');
        await expect(subtree(page, 'Documentation')).toHaveAttribute('data-open', 'true');
    });
});
