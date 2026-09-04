import { test, expect, Page } from '@playwright/test';

import { createXydServer, createXydBunServer, XydServer } from '../../utils/xyd-server';

// SDK-native API docs (`api.openapi[..].sdk`): the OpenSDK enrichment runs at
// BUILD time in the docs engine — per-language SDK types, method signatures,
// and usage samples, with the raw-HTTP (cURL/Shell) view kept as a first-class
// entry in the page-wide language switcher. The second source (docs/plain) has
// NO `sdk` — it must render the classic REST-only view (regression guard).
// Run on BOTH engines.
const ENGINES: { name: string; make: (dir: string) => Promise<XydServer> }[] = [
    { name: 'bun', make: (dir) => createXydBunServer(dir) },
    { name: 'vite', make: (dir) => createXydServer(dir) },
];

const SDK_TITLES = ['Go', 'Python', 'TypeScript', 'Ruby', 'Java', 'C#'];

for (const engine of ENGINES) {
    test.describe(`openapi — sdk docs (${engine.name} engine)`, () => {
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

        const trigger = (page: Page) => page.locator('[part="language-select-trigger"]').first();
        const items = (page: Page) => page.locator('[part="language-select-item"]');
        const signature = (page: Page) => page.locator('[part="sdk-signature"]').first();

        async function pick(page: Page, title: string) {
            await trigger(page).click();
            await items(page).filter({ hasText: title }).first().click();
        }

        test('the language switcher lists the 6 SDK languages + Shell', async ({ page }) => {
            await goto(page, '/docs/api/get-all-todos');

            await expect(trigger(page)).toBeVisible();
            await trigger(page).click();
            const texts = await items(page).allInnerTexts();
            for (const t of [...SDK_TITLES, 'Shell']) {
                expect(texts.join(' ')).toContain(t);
            }
            // Shell (the raw-HTTP default view) is the FIRST entry
            expect(texts[0]).toContain('Shell');
            await page.keyboard.press('Escape');
        });

        test('the DEFAULT view is raw-HTTP: REST definitions, plain header — SDK one pick away', async ({ page }) => {
            await goto(page, '/docs/api/get-all-todos');

            // default = the Shell/HTTP entry: classic REST reference
            await expect(page.locator('[part="sdk-header"]')).toHaveCount(0);
            let h3 = await page.locator('h3').allInnerTexts();
            expect(h3).toContain('Response');
            expect(h3).not.toContain('Returns');

            // opting into an SDK language flips to the SDK-native view
            await pick(page, 'Go');
            await expect(page.locator('[part="sdk-header"]')).toHaveCount(1);
            await expect(signature(page)).toContainText('client.');
            h3 = await page.locator('h3').allInnerTexts();
            expect(h3).toContain('Returns');
            expect(h3).not.toContain('Response');
        });

        test('switching the language swaps the signature, types, and samples together', async ({ page }) => {
            await goto(page, '/docs/api/get-all-todos');
            await pick(page, 'Go');
            const goSig = await signature(page).textContent();

            await pick(page, 'Python');
            await expect(signature(page)).not.toHaveText(goSig!);
            await expect(signature(page)).toContainText('client.todos.list');
            expect(await page.locator('h3').allInnerTexts()).toContain('Returns');
        });

        test('the Shell entry shows the raw-HTTP view: REST definitions + method badge, no SDK header', async ({ page }) => {
            await goto(page, '/docs/api/get-all-todos');
            await pick(page, 'Java');
            await expect(page.locator('[part="sdk-header"]')).toHaveCount(1);
            await pick(page, 'Shell');

            await expect(page.locator('[part="sdk-header"]')).toHaveCount(0);
            // sidebar rows carry the attribute too (some hidden) — assert a
            // VISIBLE method badge exists (the plain operation header).
            await expect(page.locator('[data-atlas-oas-method]:visible').first()).toBeVisible();
            const h3 = await page.locator('h3').allInnerTexts();
            expect(h3).toContain('Response');
            expect(h3).not.toContain('Returns');

            // and switching BACK restores the SDK view
            await pick(page, 'Java');
            await expect(page.locator('[part="sdk-header"]')).toHaveCount(1);
            expect(await page.locator('h3').allInnerTexts()).toContain('Returns');
        });

        test('the chosen language persists across reloads (localStorage)', async ({ page }) => {
            await goto(page, '/docs/api/get-all-todos');
            await pick(page, 'Ruby');
            await expect(signature(page)).toContainText('Array<Models::Todo>');

            await page.reload();
            await page.waitForLoadState('networkidle');
            await expect(signature(page)).toContainText('Array<Models::Todo>');
            expect(await page.evaluate(() => localStorage.getItem('xyd:sdk-language'))).toBe('ruby');
        });

        test('REST status/contentType selects still work in the raw-HTTP view', async ({ page }) => {
            // get-a-todo-by-id has 200 + 404 responses → a real status select.
            await goto(page, '/docs/api/get-a-todo-by-id');
            await pick(page, 'Shell');

            const statusSelect = page.locator('xyd-atlas select, select').filter({ hasText: '404' }).first();
            await expect(statusSelect).toBeVisible();
            await statusSelect.selectOption('404');
            await expect(statusSelect).toHaveValue('404');
        });

        // x-sdk: the SPEC carries the SDK docs (embedded upstream via
        // `opensdk xsdk` — go+python only in the fixture). docs.json has NO
        // `sdk` flag for this source: detection is spec-driven, like x-docs.
        test('an x-sdk spec renders SDK docs with NO docs.json opt-in — spec languages only', async ({ page }) => {
            await goto(page, '/docs/xsdk/get-all-todos');

            await expect(trigger(page)).toBeVisible();
            await trigger(page).click();
            const texts = await items(page).allInnerTexts();
            expect(texts[0]).toContain('Shell'); // raw-HTTP default first
            expect(texts.join(' ')).toContain('Go');
            expect(texts.join(' ')).toContain('Python');
            // the spec's x-sdk.languages is the whole list — no TypeScript/Ruby/…
            expect(texts).toHaveLength(3);
            await page.keyboard.press('Escape');

            // default = raw-HTTP; picking a spec language flips to the SDK view
            await expect(page.locator('[part="sdk-header"]')).toHaveCount(0);
            await pick(page, 'Go');
            await expect(page.locator('[part="sdk-header"]')).toHaveCount(1);
            await expect(signature(page)).toContainText('client.');
            expect(await page.locator('h3').allInnerTexts()).toContain('Returns');
        });

        test('a source WITHOUT sdk renders the classic REST-only view (regression)', async ({ page }) => {
            await goto(page, '/docs/plain/get-all-users');

            await expect(page.locator('[part="sdk-header"]')).toHaveCount(0);
            await expect(page.locator('[part="language-select-trigger"]')).toHaveCount(0);
            // classic tab-row language switcher with the HTTP sample languages
            const tabs = await page.locator('[part="language-trigger"]').allInnerTexts();
            expect(tabs.join(' ')).toContain('shell');
            const h3 = await page.locator('h3').allInnerTexts();
            expect(h3).toContain('Response');
            expect(h3).not.toContain('Returns');
        });
    });
}
