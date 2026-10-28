import { test, expect } from "@playwright/test";

import { createXydBuildServer, type XydServer } from "../../utils/xyd-server";
import { startMcpStubServer, type McpStubServer } from "../../utils/mcp-stub";

/**
 * A spec-strict streamable-HTTP server: it answers nothing before `initialize`,
 * issues a session, wants `Mcp-Session-Id` + `Mcp-Protocol-Version` on every
 * later request, and streams its answers as server-sent events. The docs build
 * must go through the handshake to list its tools.
 */
test.describe("mcp — a spec-strict server is documented through the initialize handshake", () => {
    let stub: McpStubServer;
    let server: XydServer;

    test.beforeAll(async () => {
        stub = await startMcpStubServer({
            strict: true,
            sse: true,
            handlers: {
                "tools/list": {
                    tools: [
                        {
                            name: "lookup",
                            description: "Looks a record up by key.",
                            inputSchema: {
                                type: "object",
                                properties: { key: { type: "string", description: "The record key." } },
                                required: ["key"],
                            },
                        },
                    ],
                },
                "resources/list": { resources: [] },
            },
        });
        server = await createXydBuildServer(__dirname, { env: { MCP_URL: stub.url } });
    });

    test.afterAll(async () => {
        await server?.stop();
        await stub?.stop();
    });

    test("the tool renders as a page", async ({ page }) => {
        await page.goto(server.getUrl("/docs/api/mcp/lookup"));
        await page.waitForLoadState("networkidle");
        await expect(page.locator("h1")).toContainText("lookup");
        await expect(page.locator("main")).toContainText("The record key.");
    });

    test("every read began with initialize and carried the session", async () => {
        const posts = stub.received.filter((r) => r.httpMethod === "POST");
        expect(posts.length).toBeGreaterThan(0);
        // Nothing was refused: no request came before its session.
        expect(stub.received.filter((r) => r.status === 400)).toEqual([]);

        // Each read is initialize → notifications/initialized → the lists.
        const initializes = posts.filter((r) => r.method === "initialize");
        expect(initializes.length).toBeGreaterThan(0);
        expect(posts[0].method).toBe("initialize");
        expect(posts.filter((r) => r.method === "notifications/initialized")).toHaveLength(initializes.length);

        for (const list of posts.filter((r) => r.method === "tools/list" || r.method === "resources/list")) {
            expect(stub.sessions.issued).toContain(list.headers["mcp-session-id"]);
            expect(list.headers["mcp-protocol-version"]).toBeTruthy();
        }
        // The sessions it opened, it ended.
        expect([...stub.sessions.ended].sort()).toEqual([...stub.sessions.issued].sort());
    });
});
