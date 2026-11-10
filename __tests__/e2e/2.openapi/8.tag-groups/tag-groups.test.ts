import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// Tag groups and display names in the generated sidebar. The document's
// `x-tagGroups` group the top-level groups into sections, and each tag's
// `x-displayName` labels its groups (see openapi.yaml):
//
//   Core            ← a static section header
//     Store ▸       ← nested groups, each a toggle, folded unless it holds
//     Pets  ▸         the current page
//   Audit log       ← in no tag group: keeps its place, static
//     List audit events
//   Admin
//     users ▸       ← no display name: the tag's name
//   Objects ▸       ← collapsed, last
//     Money
//     Pets ▸
//     Store ▸
//
// A nested group's toggle states whether its rows are open (`aria-expanded`)
// and which subtree it folds (`aria-controls`); only the group of the current
// page is open, and nothing is open on the landing page. Run on BOTH engines.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

for (const engine of ENGINES) {
    test.describe(`openapi — tag groups and display names (${engine.name} engine)`, () => {
        // One dev server per engine (parallel workers each boot their own and
        // vite cold boots exceed the 2-minute start timeout).
        test.describe.configure({ mode: 'serial' });

        let server: XydServer;

        test.beforeAll(async ({ browser }) => {
            server = await engine.make(__dirname);

            // A cold dev server may optimize its dependencies on the first
            // visits and reload the page under a test: visit every kind of page
            // once before the tests do.
            const page = await browser.newPage();
            for (const path of ['/', '/createPet', '/objects/Order', '/']) {
                await goto(page, path);
            }
            await page.close();
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        async function goto(page: Page, path: string) {
            await page.goto(server.getUrl(path));
            await page.waitForLoadState('networkidle');
        }

        const sidebar = (page: Page) => page.locator('aside[part="sidebar"]');
        const headers = (page: Page) => sidebar(page).locator('li[part="item-header"]');
        const header = (page: Page, title: string) =>
            sidebar(page).locator('li[part="item-header"]', { hasText: title });
        const objectsToggle = (page: Page) =>
            sidebar(page).locator('button[part="item-header-toggle"]', { hasText: 'Objects' });
        // the nested groups under the sections (outside the objects group's
        // tree), and the ones inside the objects group
        const sectionRows = (page: Page) =>
            sidebar(page).locator('xpath=.//button[@part="item-button"][not(ancestor::li[@data-group-tree])]');
        const sectionRow = (page: Page, title: string) => sectionRows(page).filter({ hasText: title });
        const objectsRow = (page: Page, title: string) =>
            sidebar(page).locator('li[data-group-tree] button[part="item-button"]', { hasText: title });
        const rowsOf = (row: ReturnType<typeof sectionRow>) =>
            row.locator('xpath=following-sibling::ul[@part="subtree"]/xyd-collapse');
        const link = (page: Page, title: string) =>
            sidebar(page).locator('a[part="item-link"]', { hasText: title });
        const expanded = (page: Page) => sidebar(page).locator('[aria-expanded="true"]');
        const activeTitle = (page: Page) =>
            sidebar(page).locator('[part="primary-item"][data-active="true"] [part="item-title"]');

        test('the sections are static headers, the areas nested toggles under their display names, Objects collapsed and last', async ({ page }) => {
            await goto(page, '/');

            // the raw header text — the theme's CSS may uppercase it on screen
            await expect(headers(page)).toHaveText(['Core', 'Audit log', 'Admin', 'Objects']);
            for (const title of ['Core', 'Audit log', 'Admin']) {
                await expect(header(page, title).locator('button')).toHaveCount(0);
            }

            // the groups inside the sections: the tag group's order, the display
            // names (a tag without one keeps its name)
            await expect(sectionRows(page).locator('[part="item-title"]')).toHaveText(['Store', 'Pets', 'users']);
            // the group in no tag group keeps its rows under its own header
            await expect(link(page, 'List audit events')).toBeVisible();

            // the objects group: a toggle, folded, its sub-groups display-named
            await expect(objectsToggle(page)).toHaveAttribute('aria-expanded', 'false');
            await objectsToggle(page).click();
            await expect(objectsRow(page, 'Pets')).toBeVisible();
            await expect(objectsRow(page, 'Store')).toBeVisible();
            await expect(link(page, 'Money')).toBeVisible();
        });

        test('each area toggle is a plain button naming the subtree it folds', async ({ page }) => {
            await goto(page, '/');

            const rows = sectionRows(page);
            await expect(rows).toHaveCount(3);
            for (const row of await rows.all()) {
                await expect(row).toHaveAttribute('type', 'button');
                await expect(row).toHaveAttribute('aria-expanded', 'false');
                // a router link's attribute does not leak onto a button
                expect(await row.getAttribute('prefetch')).toBeNull();

                const controls = await row.getAttribute('aria-controls');
                expect(controls).toBeTruthy();
                await expect(sidebar(page).locator(`ul[part="subtree"][id="${controls}"]`)).toHaveCount(1);
            }
        });

        test('nothing is open on the landing page', async ({ page }) => {
            await goto(page, '/');

            await expect(expanded(page)).toHaveCount(0);
            await expect(sidebar(page).locator('xyd-collapse[data-open="true"]')).toHaveCount(0);
            await expect(sidebar(page).locator('li[part="item-header"][data-open="true"]')).toHaveCount(0);
            await expect(link(page, 'List pets')).toHaveCount(0);
            await expect(link(page, 'Place order')).toHaveCount(0);
        });

        test('only the area of the current page is open, with the active row', async ({ page }) => {
            await goto(page, '/createPet');

            await expect(sectionRow(page, 'Pets')).toHaveAttribute('aria-expanded', 'true');
            await expect(rowsOf(sectionRow(page, 'Pets'))).toHaveAttribute('data-open', 'true');
            await expect(activeTitle(page)).toHaveText('Create pet');

            await expect(sectionRow(page, 'Store')).toHaveAttribute('aria-expanded', 'false');
            await expect(sectionRow(page, 'users')).toHaveAttribute('aria-expanded', 'false');
            await expect(objectsToggle(page)).toHaveAttribute('aria-expanded', 'false');
            await expect(expanded(page)).toHaveCount(1);
        });

        test('an object page opens the objects group and its own sub-group, every area stays folded', async ({ page }) => {
            await goto(page, '/objects/Order');

            await expect(objectsToggle(page)).toHaveAttribute('aria-expanded', 'true');
            await expect(objectsRow(page, 'Store')).toHaveAttribute('aria-expanded', 'true');
            await expect(objectsRow(page, 'Pets')).toHaveAttribute('aria-expanded', 'false');
            await expect(activeTitle(page)).toHaveText('The order object');

            for (const title of ['Store', 'Pets', 'users']) {
                await expect(sectionRow(page, title)).toHaveAttribute('aria-expanded', 'false');
            }
            await expect(expanded(page)).toHaveCount(2);
        });

        test('a click opens an area, several stay open, a second click folds it', async ({ page }) => {
            await goto(page, '/');

            await sectionRow(page, 'Store').click();
            await expect(sectionRow(page, 'Store')).toHaveAttribute('aria-expanded', 'true');
            await expect(link(page, 'Place order')).toBeVisible();

            await sectionRow(page, 'Pets').click();
            await expect(sectionRow(page, 'Pets')).toHaveAttribute('aria-expanded', 'true');
            await expect(sectionRow(page, 'Store')).toHaveAttribute('aria-expanded', 'true');
            await expect(link(page, 'List pets')).toBeVisible();

            await sectionRow(page, 'Store').click();
            await expect(sectionRow(page, 'Store')).toHaveAttribute('aria-expanded', 'false');
            await expect(link(page, 'Place order')).toHaveCount(0);
        });
    });
}
