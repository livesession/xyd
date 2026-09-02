import { test, expect } from '@playwright/test';

import { createXydServerWithTemplate, XydServer } from '../../utils/xyd-server';

// `:::code-tutorial` is a numbered stepper whose body is two columns: prose on the
// left, the code and callouts it produces on the right. The columns come from one
// grid on the `li`, so the list stays a real `ol`/`li` — the number is list position,
// not a CSS counter — and the aside drops under the prose on narrow viewports.
test.describe('Code tutorial directive', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydServerWithTemplate(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('renders steps as list items of a real ordered list', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const list = page.locator('main ol').filter({ has: page.locator('[part="marker"]') });
        await expect(list).toHaveCount(1);

        const steps = list.locator('> li');
        await expect(steps).toHaveCount(3);

        // the badge is decorative; the position an assistive tech reads comes from the
        // list itself, so the item has to be a direct child of the ol
        await expect(steps.locator('[part="marker"]')).toHaveText(['1', '2', '3']);
        await expect(steps.first().locator('[part="marker"]')).toHaveAttribute('aria-hidden', 'true');

        await expect(steps.first().locator('[part="title"]')).toHaveText('Install the SDK');
        await expect(steps.first().locator('[part="body"]'))
            .toContainText('Pick the package manager you already use.');

        // prose the author left outside a list item still renders, but never as a
        // direct child of the ol - that is the list-semantics violation
        await expect(page.locator('main')).toContainText('Anything left outside a list item is not a step.');
        await expect(list.locator('> :not(li)')).toHaveCount(0);
    });

    test('nested directives inside an aside are components, not raw text', async ({ page }) => {
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const aside = page.locator('[part="aside"]');
        await expect(aside).toHaveCount(1);

        // `:::code-group` and `:::callout` are container directives of their own, so
        // this only passes if the directive plugin converts recursively
        await expect(aside.locator('xyd-codetabs')).toHaveCount(1);
        await expect(aside.getByRole('tab', { name: 'npm', exact: true })).toBeVisible();
        await expect(aside.locator('xyd-callout')).toContainText('Requires Node 22.12+.');

        await expect(page.locator('main')).not.toContainText(':::');
    });

    test('the aside sits beside the prose on desktop and under it on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(server.getUrl('/overview'));
        await page.waitForLoadState('networkidle');

        const body = page.locator('[part="body"]').first();
        const aside = page.locator('[part="aside"]');

        let bodyBox = await body.boundingBox();
        let asideBox = await aside.boundingBox();
        expect(asideBox!.x).toBeGreaterThanOrEqual(bodyBox!.x + bodyBox!.width);

        // 1024px is the tablet breakpoint the layout already uses
        await page.setViewportSize({ width: 900, height: 900 });

        bodyBox = await body.boundingBox();
        asideBox = await aside.boundingBox();
        expect(asideBox!.y).toBeGreaterThanOrEqual(bodyBox!.y + bodyBox!.height);
        expect(asideBox!.x).toBeCloseTo(bodyBox!.x, 0);
    });
});
