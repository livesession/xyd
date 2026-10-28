import { test, expect } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

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
 * `xyd-mcp-server http --stateless`: the SDK client round-trips with no
 * session, and every request's own bearer reaches the API.
 */
test.describe("mcp-server — stateless streamable HTTP", () => {
    test.skip(mcpServerSuitesSkip(), MCP_SERVER_MISSING);

    let api: ApiStub;
    let mcp: RunningMcpServer;

    test.beforeAll(async () => {
        api = await startApiStub();
        mcp = await startMcpServer([
            PETS_OPENAPI,
            "--stateless",
            "--base-url",
            api.url,
            "--skip-resources",
            "--path",
            "/mcp,/v1/mcp",
            "--header",
            "X-Api-Version: 2026-01-01",
        ]);
    });

    test.afterAll(async () => {
        await mcp?.stop();
        await api?.stop();
    });

    async function connect(path: string, bearer: { current?: string }) {
        const transport = new StreamableHTTPClientTransport(new URL(`${mcp.origin}${path}`), {
            fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (bearer.current) headers.set("Authorization", `Bearer ${bearer.current}`);
                return fetch(input, { ...init, headers });
            },
        });
        const client = new Client({ name: "e2e", version: "0.0.0" });
        await client.connect(transport);
        return { client, transport };
    }

    test("round trip with the SDK client, no session issued", async () => {
        const { client, transport } = await connect("/mcp", { current: "token-a" });
        expect(transport.sessionId).toBeUndefined();

        const { tools } = await client.listTools();
        expect(tools.map((t) => t.name)).toEqual(["listPets", "createPet", "getPet", "deletePet"]);
        expect(tools.find((t) => t.name === "deletePet")?.annotations?.destructiveHint).toBe(true);

        const result = await client.callTool({ name: "getPet", arguments: { petId: "1" } });
        expect(result.isError).toBeFalsy();
        expect((result.content as Array<{ text: string }>)[0].text).toBe('{"id":"1","name":"Rex"}');
        await client.close();
    });

    test("each request's bearer reaches the API, on every mount path", async () => {
        api.seen.length = 0;
        const bearer: { current?: string } = { current: "token-a" };
        const { client } = await connect("/v1/mcp", bearer);
        await client.callTool({ name: "getPet", arguments: { petId: "1" } });
        bearer.current = "token-b";
        await client.callTool({ name: "listPets", arguments: { limit: 5 } });
        expect(api.seen.map((s) => [s.url, s.authorization, s.version])).toEqual([
            ["/v1/pets/1", "Bearer token-a", "2026-01-01"],
            ["/v1/pets?limit=5", "Bearer token-b", "2026-01-01"],
        ]);
        await client.close();
    });

    test("GET is refused and no session header is answered", async () => {
        const get = await fetch(mcp.url, { headers: { accept: "text/event-stream" } });
        expect(get.status).toBe(405);
        const post = await fetch(mcp.url, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        });
        expect(post.status).toBe(200);
        expect(post.headers.get("mcp-session-id")).toBeNull();
    });
});
