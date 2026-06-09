import { test, expect } from "@playwright/test";

import { createXydBuildServer, XydServer } from "../../utils/xyd-server";
import { startMcpStubServer, type McpStubServer } from "../../utils/mcp-stub";

test.describe("mcp — bearer token from $MCP_TOKEN is sent to the server", () => {
    const TOKEN = "test-token-123";
    let stub: McpStubServer;
    let server: XydServer;

    test.beforeAll(async () => {
        stub = await startMcpStubServer({
            requireToken: TOKEN,
            handlers: {
                "tools/list": {
                    tools: [{ name: "secret_tool", description: "auth only", inputSchema: { type: "object" } }],
                },
                "resources/list": { resources: [] },
            },
        });
        server = await createXydBuildServer(__dirname, {
            env: { MCP_URL: stub.url, MCP_TOKEN: TOKEN },
        });
    });

    test.afterAll(async () => {
        await server?.stop();
        await stub?.stop();
    });

    test("stub server saw Authorization: Bearer <token>", async ({ page }) => {
        await page.goto(server.getUrl("/docs/api/mcp/secret-tool"));
        await page.waitForLoadState("networkidle");

        expect(stub.receivedHeaders.length).toBeGreaterThan(0);
        for (const h of stub.receivedHeaders) {
            expect(h.authorization).toBe(`Bearer ${TOKEN}`);
        }
        await expect(page.locator("h1")).toContainText("secret_tool");
    });
});
