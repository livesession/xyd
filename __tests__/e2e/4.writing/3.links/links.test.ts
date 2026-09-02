import { test, expect } from '@playwright/test';

import { createXydServerWithTemplate, XydServer } from '../../utils/xyd-server';

// FwLink resolved an href by trying `new URL(href)` and then checking for a
// leading "/". Anything that failed both — a same-page "#anchor", a relative
// path, a bare query string — fell through to a branch that rendered
// `<Anchor as="button">` and dropped the href on the floor, so the text looked
// like a link and did nothing. Same-page anchors are the common case: a page
// with an in-page table of contents lost every jump on it.
test.describe('Markdown links', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServerWithTemplate(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('a same-page anchor renders as an anchor and jumps in-page', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const anchor = page.locator('a[href="#target-section"]');
        await expect(anchor).toHaveCount(1);
        await expect(anchor).toHaveText('same-page anchor');

        // The heading it points at has to carry the id, or the jump is inert
        // even with the href restored.
        await expect(page.locator('#target-section')).toHaveCount(1);

        await anchor.click();
        await expect(page).toHaveURL(/#target-section$/);
    });

    test('rooted, external and mail links still render as anchors', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        // Matched by link text, not by href alone: the rooted link is also a
        // sidebar entry, so an href-only count measures the nav as well as the
        // rendered markdown.
        await expect(page.getByRole('link', { name: 'rooted link', exact: true }))
            .toHaveAttribute('href', '/guides/introduction');
        await expect(page.getByRole('link', { name: 'external link', exact: true }))
            .toHaveAttribute('href', 'https://example.com/docs');
        await expect(page.getByRole('link', { name: 'mail link', exact: true }))
            .toHaveAttribute('href', 'mailto:hi@example.com');
    });

    test('no link renders as a button', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        // The old fallback rendered link text as a <button> for any href it
        // could not classify. Assert on the link texts themselves rather than a
        // container selector, so this cannot pass vacuously.
        for (const name of ['same-page anchor', 'rooted link', 'external link', 'mail link']) {
            await expect(page.getByText(name, { exact: true })).toHaveJSProperty('tagName', 'A');
        }
    });
});
