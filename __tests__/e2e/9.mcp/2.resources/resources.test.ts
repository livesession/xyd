import { test, expect } from "@playwright/test";

import { createXydBuildServer, XydServer } from "../../utils/xyd-server";
import { startMcpStubServer, type McpStubServer } from "../../utils/mcp-stub";

test.describe("mcp — resources render uri + mimeType", () => {
    let stub: McpStubServer;
    let server: XydServer;

    test.beforeAll(async () => {
        stub = await startMcpStubServer({
            handlers: {
                "tools/list": { tools: [] },
                "resources/list": {
                    resources: [
                        {
                            uri: "file:///readme.md",
                            name: "README",
                            description: "Project readme.",
                            mimeType: "text/markdown",
                        },
                    ],
                },
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

    test("resource page shows uri and mimeType", async ({ page }) => {
        await page.goto(server.getUrl("/mcp/readme"));
        await page.waitForLoadState("networkidle");

        await expect(page.locator("main")).toContainText("file:///readme.md");
        await expect(page.locator("main")).toContainText("text/markdown");
    });
});
