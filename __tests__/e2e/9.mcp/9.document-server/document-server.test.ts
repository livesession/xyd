import { test, expect } from "@playwright/test";

import { createXydBuildServer, type XydServer } from "../../utils/xyd-server";
import {
    MCP_SERVER_MISSING,
    PETS_OPENAPI,
    mcpServerSuitesSkip,
    startApiStub,
    startMcpServer,
    type ApiStub,
    type RunningMcpServer,
} from "../../utils/mcp-server";

/**
 * xyd documents xyd-mcp-server itself: a stateful server with sessions and
 * answers streamed as server-sent events, read through the handshake.
 */
test.describe("mcp — documenting a running xyd-mcp-server", () => {
    test.skip(mcpServerSuitesSkip(), MCP_SERVER_MISSING);

    let api: ApiStub;
    let mcp: RunningMcpServer;
    let server: XydServer;

    test.beforeAll(async () => {
        api = await startApiStub();
        mcp = await startMcpServer([PETS_OPENAPI, "--base-url", api.url, "--skip-resources"]);
        server = await createXydBuildServer(__dirname, { env: { MCP_URL: mcp.url } });
    });

    test.afterAll(async () => {
        await server?.stop();
        await mcp?.stop();
        await api?.stop();
    });

    test("the server's tools render as pages", async ({ page }) => {
        await page.goto(server.getUrl("/docs/api/mcp/getpet"));
        await page.waitForLoadState("networkidle");
        await expect(page.locator("h1")).toContainText("getPet");
        await expect(page.locator("main")).toContainText("petId");
        await expect(page.locator("body")).toContainText("deletePet");
    });
});
