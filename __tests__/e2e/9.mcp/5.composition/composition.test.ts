import { test, expect } from "@playwright/test";

import { createXydBuildServer, XydServer } from "../../utils/xyd-server";

/**
 * Verifies that a hand-authored markdown page with `mcp: ./source.json#tool:<name>`
 * frontmatter is composed with the auto-generated reference: the user's prose
 * (and any frontmatter overrides like `title`) appear alongside the
 * generated property tree for that tool.
 *
 * Regression coverage for two bugs that lived in this path:
 *   - composeFileMap only recognised `frontmatter.openapi` (not `mcp`)
 *   - composeFileMap stored the raw `<source>#<region>` value while the
 *     consumer looks up by region alone
 */
test.describe("mcp — composition (hand-authored page targets a single tool)", () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    test("user prose and the auto-generated property tree both render", async ({ page }) => {
        await page.goto(server.getUrl("/docs/api/mcp/search-docs"));
        await page.waitForLoadState("networkidle");

        // Composed prose from the user-authored .md must appear alongside the
        // auto-generated content.
        await expect(page.locator("main")).toContainText(
            "This intro goes above the auto-generated property tree",
        );

        // Auto-generated property tree — param name + description from
        // inputSchema. These only show when Atlas receives a non-empty
        // Reference for this region.
        await expect(page.locator("main")).toContainText("query");
        await expect(page.locator("main")).toContainText("Free-text query.");

        // The composed frontmatter title takes over the document title.
        await expect(page).toHaveTitle(/search_docs \(composed\)/);
    });

    test("untouched tool keeps its auto-generated description", async ({ page }) => {
        await page.goto(server.getUrl("/docs/api/mcp/ping"));
        await page.waitForLoadState("networkidle");

        await expect(page.locator("h1")).toContainText("ping");
        await expect(page.locator("main")).toContainText("Untouched tool.");
    });
});
