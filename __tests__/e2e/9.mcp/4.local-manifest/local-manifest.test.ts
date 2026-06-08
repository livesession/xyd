import { test, expect } from "@playwright/test";

import { createXydBuildServer, XydServer } from "../../utils/xyd-server";

/**
 * Regression test for the bug that shipped on canary.examples.xyd.dev:
 * with a static `mcp.json` source, the converter produced References but
 * `pluginNavigation` emitted an empty sidebar because no `context.group`
 * was set — so no tool/resource pages got routed.
 *
 * If this test breaks, the example will show only the manually-authored
 * intro page with no auto-generated tool pages under the API tab.
 */
test.describe("mcp — local JSON manifest source", () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    test("each tool from mcp.json renders as its own page", async ({ page }) => {
        await page.goto(server.getUrl("/mcp/echo"));
        await page.waitForLoadState("networkidle");

        await expect(page.locator("h1")).toContainText("echo");
        await expect(page.locator("main")).toContainText("Text to echo.");
        await expect(page.locator("main")).toContainText("message");
    });

    test("ping tool (empty inputSchema) is reachable", async ({ page }) => {
        await page.goto(server.getUrl("/mcp/ping"));
        await page.waitForLoadState("networkidle");

        await expect(page.locator("h1")).toContainText("ping");
        await expect(page.locator("main")).toContainText("Health check.");
    });

    test("resource page shows uri + mimeType", async ({ page }) => {
        await page.goto(server.getUrl("/mcp/readme"));
        await page.waitForLoadState("networkidle");

        await expect(page.locator("main")).toContainText("doc:///readme");
        await expect(page.locator("main")).toContainText("text/markdown");
    });
});
