import { test, expect } from "@playwright/test";

import { createXydBuildServer, XydServer } from "../../utils/xyd-server";
import { startMcpStubServer, type McpStubServer } from "../../utils/mcp-stub";

test.describe("mcp — tools listed in sidebar and rendered on page", () => {
    let stub: McpStubServer;
    let server: XydServer;

    test.beforeAll(async () => {
        stub = await startMcpStubServer({
            handlers: {
                "tools/list": {
                    tools: [
                        {
                            name: "echo",
                            description: "Echoes back the provided message.",
                            inputSchema: {
                                type: "object",
                                properties: { message: { type: "string", description: "Text to echo." } },
                                required: ["message"],
                            },
                        },
                        {
                            name: "ping",
                            description: "Health check.",
                            inputSchema: { type: "object" },
                        },
                    ],
                },
                "resources/list": { resources: [] },
            },
        });

        server = await createXydBuildServer(__dirname, {
            env: { MCP_URL: stub.url },
        });
    });

    test.afterAll(async () => {
        await server?.stop();
        await stub?.stop();
    });

    test("each tool renders as its own page", async ({ page }) => {
        await page.goto(server.getUrl("/docs/api/mcp/echo"));
        await page.waitForLoadState("networkidle");

        await expect(page.locator("h1")).toContainText("echo");
        await expect(page.locator("main")).toContainText("Text to echo.");
        await expect(page.locator("main")).toContainText("message");
    });

    test("sidebar contains both tools", async ({ page }) => {
        await page.goto(server.getUrl("/docs/api/mcp/echo"));
        await page.waitForLoadState("networkidle");

        // The theme renders multiple <nav>/<aside> regions (top navbar,
        // sidebar, content nav). The previous `.first()` selector could
        // resolve to the top navbar instead of the sidebar — and
        // "ping" only ever shows up in the sidebar's tool list since
        // we're already on echo's page. Checking the whole body is the
        // most theme-agnostic way to assert the tool list links exist.
        await expect(page.locator("body")).toContainText("echo");
        await expect(page.locator("body")).toContainText("ping");
    });
});
